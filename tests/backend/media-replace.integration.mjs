import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url=process.env.DORAMI_TEST_SUPABASE_URL,anonKey=process.env.DORAMI_TEST_ANON_KEY,serviceKey=process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email=process.env.DORAMI_TEST_OWNER_EMAIL,password=process.env.DORAMI_TEST_OWNER_PASSWORD;
if(!url||!anonKey||!serviceKey||!email||!password)throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');
const admin=createClient(url,serviceKey,{auth:{persistSession:false}}),owner=createClient(url,anonKey,{auth:{persistSession:false}});
let {data:users}=await admin.auth.admin.listUsers();let user=users.users.find((item)=>item.email===email);if(!user){const made=await admin.auth.admin.createUser({email,password,email_confirm:true});if(made.error)throw made.error;user=made.data.user;}
await admin.from('owner_accounts').upsert({user_id:user.id});const signed=await owner.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;const token=signed.data.session.access_token;
const oldId=crypto.randomUUID(),newId=crypto.randomUUID(),oldPath=`replace/${oldId}.png`,newPath=`replace/${newId}.png`;const bytes=new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
for(const [id,path]of [[oldId,oldPath],[newId,newPath]]){let uploaded=await admin.storage.from('draft-media').upload(path,bytes,{contentType:'image/png'});if(uploaded.error)throw uploaded.error;let inserted=await admin.from('media_assets').insert({id,bucket_id:'draft-media',object_path:path,visibility:'private',mime_type:'image/png',byte_size:bytes.length,alt_text:''});if(inserted.error)throw inserted.error;}
const doc={schemaVersion:1,content:{type:'doc',content:[{type:'image',attrs:{mediaId:oldId,src:'https://private.invalid/old'}}]}};
const made=await owner.rpc('create_draft_post',{p_title:'교체 테스트',p_category_id:null});if(made.error)throw made.error;const postId=made.data;
let saved=await owner.rpc('save_draft',{p_post_id:postId,p_expected_version:1,p_title:'교체 테스트',p_summary:'',p_category_id:null,p_tags:[],p_document:doc,p_cover_media_id:oldId,p_original_created_at:null,p_source_url:null});if(saved.error)throw saved.error;
let about=await owner.rpc('save_about',{p_expected_version:1,p_document:doc});if(about.error)throw about.error;
let template=await owner.from('templates').insert({name:'교체 템플릿',document:doc}).select('id').single();if(template.error)throw template.error;
const response=await fetch(`${url}/functions/v1/admin-media`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({mediaId:oldId,replacementMediaId:newId})});if(response.status!==200)throw new Error(`replace failed ${response.status} ${await response.text()}`);
const result=await response.json();assert.equal(result.oldMediaRetained,true);assert.deepEqual(result.replacement.drafts,1);assert.equal(result.replacement.about,true);assert.equal(result.replacement.templates,1);
const currentDraft=await owner.from('drafts').select('version,document,cover_media_id').eq('post_id',postId).single();assert.equal(currentDraft.data.version,3);assert.equal(currentDraft.data.document.content.content[0].attrs.mediaId,newId);assert.equal(currentDraft.data.cover_media_id,newId);
const currentAbout=await owner.from('about_draft').select('version,document').single();assert.equal(currentAbout.data.version,3);assert.equal(currentAbout.data.document.content.content[0].attrs.mediaId,newId);
const currentTemplate=await owner.from('templates').select('document').eq('id',template.data.id).single();assert.equal(currentTemplate.data.document.content.content[0].attrs.mediaId,newId);
const oldHistory=await owner.from('draft_versions').select('snapshot').eq('post_id',postId).eq('version',2).single();assert.equal(oldHistory.data.snapshot.document.content.content[0].attrs.mediaId,oldId,'history retains old media identity');
const deleteOld=await fetch(`${url}/functions/v1/admin-media?mediaId=${oldId}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});assert.equal(deleteOld.status,409,'history reference prevents old object deletion');
console.log('media replacement integration: PASS');
