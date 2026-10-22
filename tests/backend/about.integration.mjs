import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url=process.env.DORAMI_TEST_SUPABASE_URL,anonKey=process.env.DORAMI_TEST_ANON_KEY,serviceKey=process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email=process.env.DORAMI_TEST_OWNER_EMAIL,password=process.env.DORAMI_TEST_OWNER_PASSWORD;
if(!url||!anonKey||!serviceKey||!email||!password)throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');
const admin=createClient(url,serviceKey,{auth:{persistSession:false}}),owner=createClient(url,anonKey,{auth:{persistSession:false}});
let {data:users,error:usersError}=await admin.auth.admin.listUsers();if(usersError)throw usersError;let user=users.users.find((item)=>item.email===email);
if(!user){const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;user=data.user;}
await admin.from('owner_accounts').upsert({user_id:user.id});
const {data:auth,error:authError}=await owner.auth.signInWithPassword({email,password});if(authError)throw authError;const token=auth.session.access_token;
const mediaId=crypto.randomUUID(),path=`about-test/${mediaId}.gif`,bytes=new TextEncoder().encode('GIF89a-about-image');
let {error}=await admin.storage.from('draft-media').upload(path,bytes,{contentType:'image/gif'});if(error)throw error;
({error}=await admin.from('media_assets').insert({id:mediaId,bucket_id:'draft-media',object_path:path,visibility:'private',mime_type:'image/gif',byte_size:bytes.length,alt_text:'소개'}));if(error)throw error;
const draft={schemaVersion:1,content:{type:'doc',content:[{type:'image',attrs:{mediaId,src:'https://private-preview.invalid/about',alt:'소개'}}]}};
const {data:saved,error:saveError}=await owner.rpc('save_about',{p_expected_version:1,p_document:draft});if(saveError)throw saveError;assert.equal(saved.version,2);
let response=await fetch(`${url}/functions/v1/publish-dispatch`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'about',expectedVersion:2})});
if(response.status!==202)throw new Error(`About publish failed: ${response.status} ${await response.text()}`);const published=await response.json();
const {data:deployment,error:deploymentError}=await owner.from('deployments').select('manifest').eq('id',published.deployment_id).single();if(deploymentError)throw deploymentError;
const attrs=deployment.manifest.about.content.content[0].attrs;assert.notEqual(attrs.mediaId,mediaId);assert.match(attrs.src,/\/published-media\/about\//);
const privateEdit={schemaVersion:1,content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'비공개 수정'}]}]}};
const {data:edited,error:editError}=await owner.rpc('save_about',{p_expected_version:2,p_document:privateEdit});if(editError)throw editError;assert.equal(edited.version,3);
const {data:settings,error:settingsError}=await owner.from('site_settings').select('current_about_publication_id').single();if(settingsError)throw settingsError;
const {data:publicAbout,error:publicError}=await owner.from('about_publications').select('document').eq('id',settings.current_about_publication_id).single();if(publicError)throw publicError;
assert.equal(publicAbout.document.content.content[0].type,'image','private About save must not alter public About');
console.log('About draft/publication integration: PASS');
