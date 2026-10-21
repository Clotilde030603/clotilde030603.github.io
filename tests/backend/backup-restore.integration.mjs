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

const bytesOne = new TextEncoder().encode('backup-one');
const bytesTwo = new TextEncoder().encode('backup-two');
const mediaOne = crypto.randomUUID(); const mediaTwo = crypto.randomUUID();
const pathOne = `restore/${mediaOne}/one.png`; const pathTwo = `restore/${mediaTwo}/two.png`;
const base64 = (bytes) => Buffer.from(bytes).toString('base64');
const backup = {
  format: 'dorami-backup', schemaVersion: 1, exportedAt: new Date().toISOString(),
  categories: [], posts: [], drafts: [], draftVersions: [], publications: [], slugAliases: [], templates: [], comments: [],
  mediaAssets: [
    { id: mediaOne, bucket_id: 'draft-media', object_path: pathOne, visibility: 'private', mime_type: 'image/png', byte_size: bytesOne.length, alt_text: '', width: 1, height: 1, created_at: new Date().toISOString() },
    { id: mediaTwo, bucket_id: 'draft-media', object_path: pathTwo, visibility: 'private', mime_type: 'image/png', byte_size: bytesTwo.length, alt_text: '', width: 1, height: 1, created_at: new Date().toISOString() },
  ],
  storageObjects: [
    { bucketId: 'draft-media', path: pathOne, mimeType: 'image/png', byteSize: bytesOne.length, base64: base64(bytesOne) },
    { bucketId: 'draft-media', path: pathTwo, mimeType: 'image/png', byteSize: bytesTwo.length, base64: base64(bytesTwo) },
  ],
};

const { error: conflictSeedError } = await admin.storage.from('draft-media').upload(pathTwo, bytesTwo, { contentType: 'image/png' });
if (conflictSeedError) throw conflictSeedError;
let response = await fetch(`${url}/functions/v1/admin-backup`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ backup }),
});
assert.equal(response.status, 409, 'a second-object conflict must abort restore');
const { data: firstAfterFailure } = await admin.storage.from('draft-media').download(pathOne);
assert.equal(firstAfterFailure, null, 'the first uploaded object must be compensated');
const { count: dbRowsAfterFailure, error: countError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (countError) throw countError;
assert.equal(dbRowsAfterFailure, 0, 'database restore must not commit before every upload succeeds');

const { error: removeConflictError } = await admin.storage.from('draft-media').remove([pathTwo]);
if (removeConflictError) throw removeConflictError;
response = await fetch(`${url}/functions/v1/admin-backup`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ backup }),
});
if (response.status !== 201) throw new Error(`restore retry failed: ${response.status} ${await response.text()}`);
const result = await response.json();
assert.equal(result.mediaRestore, 'complete'); assert.equal(result.restoredMedia, 2);
const { count: restoredRows, error: restoredCountError } = await admin.from('media_assets').select('id', { count: 'exact', head: true });
if (restoredCountError) throw restoredCountError;
assert.equal(restoredRows, 2);
console.log('backup restore integration: PASS');
