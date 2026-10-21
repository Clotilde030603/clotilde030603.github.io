import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.DORAMI_TEST_SUPABASE_URL;
const anonKey = process.env.DORAMI_TEST_ANON_KEY;
const serviceKey = process.env.DORAMI_TEST_SERVICE_ROLE_KEY;
const email = process.env.DORAMI_TEST_OWNER_EMAIL;
const password = process.env.DORAMI_TEST_OWNER_PASSWORD;
if (!url || !anonKey || !serviceKey || !email || !password) throw new Error('local Supabase test environment and DORAMI_TEST_OWNER_EMAIL/PASSWORD are required');

const siteOrigin = 'https://clotilde030603.github.io';
const localOrigin = 'http://127.0.0.1:4321';
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
let { data: users, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw usersError;
let authUser = users.users.find((user) => user.email === email);
if (!authUser) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  authUser = data.user;
}
assert(authUser);
const { error: allowError } = await admin.from('owner_accounts').upsert({ user_id: authUser.id });
if (allowError) throw allowError;
const owner = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: auth, error: authError } = await owner.auth.signInWithPassword({ email, password });
if (authError) throw authError;
const ownerToken = auth.session?.access_token;
assert(ownerToken);

const title = `댓글 통계 검증 ${Date.now()}`;
const { data: postId, error: createError } = await owner.rpc('create_draft_post', { p_title: title, p_category_id: null });
if (createError) throw createError;
const slug = `comments-analytics-${Date.now()}`;
const { error: slugError } = await owner.from('posts').update({ slug }).eq('id', postId);
if (slugError) throw slugError;
const document = { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '합성 검증 글' }] }] } };
const { error: saveError } = await owner.rpc('save_draft', {
  p_post_id: postId, p_expected_version: 1, p_title: title, p_summary: '로컬 합성 검증', p_category_id: null,
  p_tags: ['test'], p_document: document, p_cover_media_id: null, p_original_created_at: null, p_source_url: null,
});
if (saveError) throw saveError;
let response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json', Origin: siteOrigin },
  body: JSON.stringify({ action: 'publish', postId, expectedVersion: 2 }),
});
if (response.status !== 202) throw new Error(`publish failed: ${response.status} ${await response.text()}`);

const submitComment = async (nickname, body) => fetch(`${url}/functions/v1/public-comments`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: siteOrigin },
  body: JSON.stringify({ postId, nickname, body }),
});
const readComments = async () => fetch(`${url}/functions/v1/public-comments?postId=${postId}`, { headers: { Origin: siteOrigin } });

response = await submitComment('방문자', '검토 대기 댓글');
assert.equal(response.status, 202);
const pending = await response.json();
assert.equal(pending.comment.status, 'pending');
assert.match(pending.comment.createdAt, /^\d{4}-\d{2}-\d{2}T/);
response = await readComments();
assert.equal(response.status, 200);
assert.deepEqual((await response.json()).comments, [], 'pending comments are not public');

const { error: approveError } = await owner.from('comments').update({ status: 'published' }).eq('id', pending.comment.id);
if (approveError) throw approveError;
response = await readComments();
let publicComments = await response.json();
assert.equal(publicComments.comments.length, 1);
assert.equal(publicComments.comments[0].id, pending.comment.id);
assert.match(publicComments.comments[0].createdAt, /^\d{4}-\d{2}-\d{2}T/);

const { error: deleteError } = await owner.from('comments').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', pending.comment.id);
if (deleteError) throw deleteError;
response = await readComments();
assert.deepEqual((await response.json()).comments, [], 'owner deletion disappears from public comments');

response = await submitComment('두 번째', '차단 후 표시 정책 검증');
assert.equal(response.status, 202);
const second = await response.json();
const { error: secondApproveError } = await owner.from('comments').update({ status: 'published' }).eq('id', second.comment.id);
if (secondApproveError) throw secondApproveError;
const { error: blockError } = await owner.from('posts').update({ comments_enabled: false, comments_visible: true }).eq('id', postId);
if (blockError) throw blockError;
response = await submitComment('차단 방문자', '작성되면 안 됨');
assert.equal(response.status, 403, 'blocked post rejects new comments');
response = await readComments();
publicComments = await response.json();
assert.equal(publicComments.enabled, false);
assert.equal(publicComments.comments.length, 1, 'existing comments remain visible when configured');
const { error: hideError } = await owner.from('posts').update({ comments_visible: false }).eq('id', postId);
if (hideError) throw hideError;
response = await readComments();
publicComments = await response.json();
assert.equal(publicComments.visible, false);
assert.deepEqual(publicComments.comments, []);

const view = async (sessionId, origin = siteOrigin, authorization = null) => fetch(`${url}/functions/v1/record-view`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) },
  body: JSON.stringify({ postId, sessionId }),
});
response = await view(crypto.randomUUID());
assert.equal(response.status, 202);
assert.equal((await response.json()).recorded, true, 'a real public article view is recorded');
response = await view(crypto.randomUUID(), localOrigin);
assert.equal(response.status, 202);
assert.equal((await response.json()).recorded, false, 'local preview view is ignored');
response = await view(crypto.randomUUID(), siteOrigin, ownerToken);
assert.equal(response.status, 202);
assert.equal((await response.json()).recorded, false, 'authenticated owner view is ignored');

const seoulToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const { data: analytics, error: analyticsError } = await owner.rpc('analytics_summary', { p_from: seoulToday, p_to: seoulToday });
if (analyticsError) throw analyticsError;
assert.equal(analytics.metric, 'page_views');
assert.equal(analytics.timezone, 'Asia/Seoul');
assert.equal(analytics.total, 1, 'preview and owner events do not affect the aggregate');
assert.equal(analytics.posts.find((post) => post.postId === postId)?.views, 1);
const anonymous = createClient(url, anonKey, { auth: { persistSession: false } });
const { error: anonymousAnalyticsError } = await anonymous.rpc('analytics_summary', { p_from: seoulToday, p_to: seoulToday });
assert(anonymousAnalyticsError, 'anonymous analytics RPC must be denied');

response = await fetch(`${url}/functions/v1/publish-dispatch`, {
  method: 'POST', headers: { Authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json', Origin: siteOrigin },
  body: JSON.stringify({ action: 'unpublish', postId }),
});
assert.equal(response.status, 202);
response = await readComments();
assert.equal(response.status, 404, 'unpublished post comments cannot be read');
response = await submitComment('비공개 접근', '작성되면 안 됨');
assert.equal(response.status, 403, 'unpublished post comments cannot be written');

console.log('comments and analytics integration: PASS');
