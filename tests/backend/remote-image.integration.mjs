import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url=process.env.DORAMI_TEST_SUPABASE_URL,anonKey=process.env.DORAMI_TEST_ANON_KEY,serviceKey=process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email=process.env.DORAMI_TEST_OWNER_EMAIL,password=process.env.DORAMI_TEST_OWNER_PASSWORD;
if(!url||!anonKey||!serviceKey||!email||!password)throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');
const admin=createClient(url,serviceKey,{auth:{persistSession:false}});const owner=createClient(url,anonKey,{auth:{persistSession:false}});
let {data:users,error:usersError}=await admin.auth.admin.listUsers();if(usersError)throw usersError;
let user=users.users.find((item)=>item.email===email);
if(!user){const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;user=data.user;}
await admin.from('owner_accounts').upsert({user_id:user.id});
const {data:auth,error:authError}=await owner.auth.signInWithPassword({email,password});if(authError)throw authError;const token=auth.session.access_token;
const {count:before,error:beforeError}=await admin.from('media_assets').select('id',{count:'exact',head:true});if(beforeError)throw beforeError;
for(const unsafe of ['https://127.0.0.1/private.png','https://localhost/image.png','https://user:pass@example.com/image.png']){
  const response=await fetch(`${url}/functions/v1/import-remote-image`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({url:unsafe})});
  assert.equal(response.status,400,`unsafe target must fail: ${unsafe}`);
}
const privateRedirect=process.env.DORAMI_TEST_PRIVATE_REDIRECT_URL;
if(privateRedirect){
  const redirected=await fetch(`${url}/functions/v1/import-remote-image`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({url:privateRedirect})});
  assert.equal(redirected.status,400,'a public URL redirecting to a private address must fail');
}
const {count:after,error:afterError}=await admin.from('media_assets').select('id',{count:'exact',head:true});if(afterError)throw afterError;
assert.equal(after,before,'failed remote imports create no media metadata');
const publicImage=process.env.DORAMI_TEST_REMOTE_IMAGE_URL;
if(publicImage){
  const imported=await fetch(`${url}/functions/v1/import-remote-image`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({url:publicImage,altText:'원격 테스트'})});
  if(imported.status!==201)throw new Error(`safe remote import failed: ${imported.status} ${await imported.text()}`);
  const payload=await imported.json();
  assert.equal(payload.media.bucket_id,'draft-media');assert.equal(payload.media.visibility,'private');assert.match(payload.signedUrl,/\/storage\/v1\/object\/sign\/draft-media\//);
  const {data:stored,error:storedError}=await admin.storage.from('draft-media').download(payload.media.object_path);if(storedError)throw storedError;assert(stored.size>0);
}
const {data:postId,error:createError}=await owner.rpc('create_draft_post',{p_title:'원격 미해결',p_category_id:null});if(createError)throw createError;
await owner.from('posts').update({slug:`remote-unresolved-${Date.now()}`}).eq('id',postId);
const unresolved={schemaVersion:1,content:{type:'doc',content:[{type:'image',attrs:{src:'https://example.com/image.png',alt:'미해결'}}]}};
const {error:saveError}=await owner.rpc('save_draft',{p_post_id:postId,p_expected_version:1,p_title:'원격 미해결',p_summary:'',p_category_id:null,p_tags:[],p_document:unresolved,p_cover_media_id:null,p_original_created_at:null,p_source_url:null});if(saveError)throw saveError;
const publish=await fetch(`${url}/functions/v1/publish-dispatch`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({postId,expectedVersion:2})});
assert.equal(publish.status,409,'unimported remote image cannot publish');
const {data:post,error:postError}=await owner.from('posts').select('status,current_publication_id').eq('id',postId).single();if(postError)throw postError;
assert.equal(post.status,'draft');assert.equal(post.current_publication_id,null);
console.log('remote image integration: PASS');
