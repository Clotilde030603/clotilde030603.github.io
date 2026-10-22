import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.DORAMI_TEST_SUPABASE_URL;
const anonKey = process.env.DORAMI_TEST_ANON_KEY;
const serviceKey = process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email = process.env.DORAMI_TEST_OWNER_EMAIL; const password = process.env.DORAMI_TEST_OWNER_PASSWORD;
if (!url || !anonKey || !serviceKey || !email || !password) throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createError) throw createError;
const { error: ownerError } = await admin.from('owner_accounts').insert({ user_id: created.user.id });
if (ownerError) throw ownerError;
const owner = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: auth, error: authError } = await owner.auth.signInWithPassword({ email, password });
if (authError) throw authError;
const token = auth.session.access_token;
const { count: initialMediaCount, error: initialMediaError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (initialMediaError) throw initialMediaError;

const bytesOne = new TextEncoder().encode('GIF89a-backup-one');
const bytesTwo = new TextEncoder().encode('GIF89a-backup-two');
const mediaOne = crypto.randomUUID(); const mediaTwo = crypto.randomUUID();
const pathOne = `restore/${mediaOne}/one.gif`; const pathTwo = `restore/${mediaTwo}/two.gif`;
const base64 = (bytes) => Buffer.from(bytes).toString('base64');
const backup = {
  format: 'dorami-backup', schemaVersion: 1, exportedAt: new Date().toISOString(),
  categories: [], posts: [], drafts: [], draftVersions: [], publications: [], slugAliases: [], templates: [], comments: [],
  mediaAssets: [
    { id: mediaOne, bucket_id: 'draft-media', object_path: pathOne, visibility: 'private', mime_type: 'image/gif', byte_size: bytesOne.length, alt_text: '', width: 1, height: 1, created_at: new Date().toISOString() },
    { id: mediaTwo, bucket_id: 'draft-media', object_path: pathTwo, visibility: 'private', mime_type: 'image/gif', byte_size: bytesTwo.length, alt_text: '', width: 1, height: 1, created_at: new Date().toISOString() },
  ],
  storageObjects: [
    { bucketId: 'draft-media', path: pathOne, mimeType: 'image/gif', byteSize: bytesOne.length, base64: base64(bytesOne) },
    { bucketId: 'draft-media', path: pathTwo, mimeType: 'image/gif', byteSize: bytesTwo.length, base64: base64(bytesTwo) },
  ],
};

async function restore(candidate) {
  return fetch(`${url}/functions/v1/admin-backup`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ backup: candidate }),
  });
}

for (const [label, mutate] of [
  ['unknown bucket', (candidate) => { candidate.mediaAssets[0].bucket_id = 'avatars'; candidate.storageObjects[0].bucketId = 'avatars'; }],
  ['bucket visibility mismatch', (candidate) => { candidate.mediaAssets[0].visibility = 'public'; }],
  ['unsupported MIME type', (candidate) => { candidate.mediaAssets[0].mime_type = 'image/svg+xml'; candidate.storageObjects[0].mimeType = 'image/svg+xml'; }],
  ['MIME signature mismatch', (candidate) => { const bad = new TextEncoder().encode('not-an-image'); candidate.mediaAssets[0].byte_size = bad.length; candidate.storageObjects[0].byteSize = bad.length; candidate.storageObjects[0].base64 = base64(bad); }],
  ['unsafe object path', (candidate) => { candidate.mediaAssets[0].object_path = '../outside.png'; candidate.storageObjects[0].path = '../outside.png'; }],
]) {
  const candidate = structuredClone(backup); mutate(candidate);
  const rejected = await restore(candidate);
  assert.equal(rejected.status, 400, `${label} must be rejected before storage upload`);
}
const { count: rowsAfterValidation, error: validationCountError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (validationCountError) throw validationCountError;
assert.equal(rowsAfterValidation, initialMediaCount, 'invalid portable backups must not create media rows');
const { data: validationObjects, error: validationListError } = await admin.storage.from('draft-media').list(`restore/${mediaOne}`);
if (validationListError) throw validationListError;
assert.equal(validationObjects?.length ?? 0, 0, 'invalid portable backups must not upload storage objects');

const { count: existingPosts, error: existingPostsError } = await admin.from('posts').select('id', { count: 'exact', head: true });
const { count: existingCategories, error: existingCategoriesError } = await admin.from('categories').select('id', { count: 'exact', head: true });
if (existingPostsError || existingCategoriesError) throw existingPostsError ?? existingCategoriesError;
if ((existingPosts ?? 0) > 0 || (existingCategories ?? 0) > 0) {
  console.log('backup restore validation: PASS (full restore branch requires an empty local target)');
  process.exit(0);
}

const { error: conflictSeedError } = await admin.storage.from('draft-media').upload(pathTwo, bytesTwo, { contentType: 'image/gif' });
if (conflictSeedError) throw conflictSeedError;
let response = await restore(backup);
assert.equal(response.status, 409, 'a second-object conflict must abort restore');
const { data: firstAfterFailure } = await admin.storage.from('draft-media').download(pathOne);
assert.equal(firstAfterFailure, null, 'the first uploaded object must be compensated');
const { count: dbRowsAfterFailure, error: countError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (countError) throw countError;
assert.equal(dbRowsAfterFailure, initialMediaCount, 'database restore must not commit before every upload succeeds');

const { error: removeConflictError } = await admin.storage.from('draft-media').remove([pathTwo]);
if (removeConflictError) throw removeConflictError;
response = await restore(backup);
if (response.status !== 201) throw new Error(`restore retry failed: ${response.status} ${await response.text()}`);
const result = await response.json();
assert.equal(result.mediaRestore, 'complete'); assert.equal(result.restoredMedia, 2);
const { count: restoredRows, error: restoredCountError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (restoredCountError) throw restoredCountError;
assert.equal(restoredRows, initialMediaCount + 2);
console.log('backup restore integration: PASS');
