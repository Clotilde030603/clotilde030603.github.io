import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.DORAMI_TEST_SUPABASE_URL;
const anonKey = process.env.DORAMI_TEST_ANON_KEY;
const serviceKey = process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email = process.env.DORAMI_TEST_OWNER_EMAIL;
const password = process.env.DORAMI_TEST_OWNER_PASSWORD;
if (!url || !anonKey || !serviceKey || !email || !password) throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createError) throw createError;
assert(created.user);
const { error: ownerError } = await admin.from('owner_accounts').insert({ user_id: created.user.id });
if (ownerError) throw ownerError;

const owner = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: session, error: signInError } = await owner.auth.signInWithPassword({ email, password });
if (signInError) throw signInError;
const token = session.session?.access_token;
assert(token);

const { data: postId, error: createPostError } = await owner.rpc('create_draft_post', { p_title: '미디어 발행 검증', p_category_id: null });
if (createPostError) throw createPostError;
const { error: slugError } = await owner.from('posts').update({ slug: 'media-publication-check' }).eq('id', postId);
if (slugError) throw slugError;

const placeholder = {
  schemaVersion: 1,
  content: { type: 'doc', content: [{ type: 'image', attrs: { src: 'import-asset:images%2Frabbit.png', alt: '토끼' } }] },
};
const { error: placeholderSaveError } = await owner.rpc('save_draft', {
  p_post_id: postId, p_expected_version: 1, p_title: '미디어 발행 검증', p_summary: '', p_category_id: null,
  p_tags: [], p_document: placeholder, p_cover_media_id: null, p_original_created_at: null, p_source_url: null,
});
if (placeholderSaveError) throw placeholderSaveError;
let response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ postId, expectedVersion: 2 }),
});
assert.equal(response.status, 409, 'unresolved import assets must block publication');

const privateId = crypto.randomUUID();
const missingId = crypto.randomUUID();
const privatePath = `${postId}/${privateId}/rabbit.png`;
const missingPath = `${postId}/${missingId}/second.png`;
const bytes = new TextEncoder().encode('synthetic-image-bytes');
const { error: uploadError } = await admin.storage.from('draft-media').upload(privatePath, bytes, { contentType: 'image/png' });
if (uploadError) throw uploadError;
const { error: metadataError } = await admin.from('media_assets').insert({
  id: privateId, bucket_id: 'draft-media', object_path: privatePath, visibility: 'private',
  mime_type: 'image/png', byte_size: bytes.byteLength, alt_text: '토끼', width: 32, height: 32,
});
if (metadataError) throw metadataError;
const { error: missingMetadataError } = await admin.from('media_assets').insert({
  id: missingId, bucket_id: 'draft-media', object_path: missingPath, visibility: 'private',
  mime_type: 'image/png', byte_size: bytes.byteLength, alt_text: '두 번째', width: 32, height: 32,
});
if (missingMetadataError) throw missingMetadataError;
const privateDocument = {
  schemaVersion: 1,
  content: { type: 'doc', content: [
    { type: 'image', attrs: { mediaId: privateId, src: 'https://private-preview.invalid/signed', alt: '토끼' } },
    { type: 'image', attrs: { mediaId: missingId, src: 'https://private-preview.invalid/second', alt: '두 번째' } },
  ] },
};
const { error: mediaSaveError } = await owner.rpc('save_draft', {
  p_post_id: postId, p_expected_version: 2, p_title: '미디어 발행 검증', p_summary: '', p_category_id: null,
  p_tags: [], p_document: privateDocument, p_cover_media_id: privateId, p_original_created_at: null, p_source_url: null,
});
if (mediaSaveError) throw mediaSaveError;
response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ postId, expectedVersion: 3 }),
});
assert.equal(response.status, 409, 'a missing second object must stop publication');
const { count: leakedMedia, error: leakedError } = await admin.from('media_assets').select('id', { count: 'exact', head: true }).eq('bucket_id','published-media');
if (leakedError) throw leakedError;
assert.equal(leakedMedia, 0, 'promotion failure must remove the first promoted metadata row');
const expectedLeakedPath = `${postId}/${privateId}/rabbit.png`;
const { data: leakedFiles, error: listError } = await admin.storage.from('published-media').list(`${postId}/${privateId}`);
if (listError) throw listError;
assert.equal(leakedFiles?.some((file) => `${postId}/${privateId}/${file.name}` === expectedLeakedPath), false, 'promotion failure must remove the first object');
const { error: secondUploadError } = await admin.storage.from('draft-media').upload(missingPath, bytes, { contentType: 'image/png' });
if (secondUploadError) throw secondUploadError;
response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ postId, expectedVersion: 3 }),
});
assert.equal(response.status, 202, await response.text());

const { data: post, error: postError } = await owner.from('posts').select('current_publication_id').eq('id', postId).single();
if (postError) throw postError;
const { data: publication, error: publicationError } = await owner.from('publications').select('document,cover_media_id').eq('id', post.current_publication_id).single();
if (publicationError) throw publicationError;
const attrs = publication.document.content.content[0].attrs;
const secondAttrs = publication.document.content.content[1].attrs;
assert.notEqual(attrs.mediaId, privateId);
assert.match(attrs.src, /\/storage\/v1\/object\/public\/published-media\//);
assert.equal(publication.cover_media_id, attrs.mediaId);
assert.notEqual(secondAttrs.mediaId, missingId);
const { data: promoted, error: promotedError } = await admin.from('media_assets').select('bucket_id,object_path,visibility').eq('id', attrs.mediaId).single();
if (promotedError) throw promotedError;
assert.deepEqual({ bucket: promoted.bucket_id, visibility: promoted.visibility }, { bucket: 'published-media', visibility: 'public' });
const { data: downloaded, error: downloadError } = await admin.storage.from('published-media').download(promoted.object_path);
if (downloadError) throw downloadError;
assert.equal(await downloaded.text(), 'synthetic-image-bytes');
response = await fetch(`${url}/functions/v1/restore-publication`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ publicationId: post.current_publication_id, mode: 'new' }),
});
if (response.status !== 201) throw new Error(`publication restore failed: ${response.status} ${await response.text()}`);
const restoredResult = await response.json();
assert.notEqual(restoredResult.postId, postId);
assert.equal(restoredResult.clonedMedia, 2);
const { data: restoredDraft, error: restoredError } = await owner.from('drafts').select('*').eq('post_id', restoredResult.postId).single();
if (restoredError) throw restoredError;
const restoredAttrs = restoredDraft.document.content.content[0].attrs;
assert.notEqual(restoredAttrs.mediaId, attrs.mediaId);
assert.match(restoredAttrs.src, /\/storage\/v1\/object\/sign\/draft-media\//);
assert.doesNotMatch(JSON.stringify(restoredDraft.document), /\/object\/public\/published-media\//);
const { data: restoredMedia, error: restoredMediaError } = await admin.from('media_assets').select('bucket_id,visibility').eq('id', restoredAttrs.mediaId).single();
if (restoredMediaError) throw restoredMediaError;
assert.deepEqual(restoredMedia, { bucket_id: 'draft-media', visibility: 'private' });
const { error: restoreEditError } = await owner.rpc('save_draft', {
  p_post_id: restoredResult.postId, p_expected_version: 1, p_title: '복원 후 수정', p_summary: '', p_category_id: null,
  p_tags: [], p_document: restoredDraft.document, p_cover_media_id: restoredDraft.cover_media_id, p_original_created_at: null, p_source_url: null,
});
if (restoreEditError) throw restoreEditError;
const { error: restoredSlugError } = await owner.from('posts').update({ slug: `restored-media-${Date.now()}` }).eq('id', restoredResult.postId);
if (restoredSlugError) throw restoredSlugError;
response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ postId: restoredResult.postId, expectedVersion: 2 }),
});
assert.equal(response.status, 202, 'image-bearing restored draft can be edited and republished');
console.log('media publish integration: PASS');
