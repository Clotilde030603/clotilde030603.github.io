import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { hmacHex, serviceClient } from '../_shared/supabase.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function plain(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`);
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  if (normalized.length < min || normalized.length > max) throw new HttpError(400, `${field} length is invalid`);
  if (/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(normalized)) throw new HttpError(400, `${field} contains unsupported markup`);
  return normalized;
}

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    const db = serviceClient();
    if (request.method === 'GET') {
      const postId = new URL(request.url).searchParams.get('postId') ?? '';
      if (!UUID.test(postId)) throw new HttpError(400, 'valid postId is required');
      const { data: post, error: postError } = await db.from('posts')
        .select('id,status,current_publication_id,comments_enabled,comments_visible')
        .eq('id', postId).eq('status', 'published').not('current_publication_id', 'is', null).maybeSingle();
      if (postError) throw postError;
      if (!post) throw new HttpError(404, 'published post not found');
      if (!post.comments_visible) return json(request, { enabled: post.comments_enabled, visible: false, comments: [] });
      const { data, error } = await db.from('comments')
        .select('id,parent_id,nickname,body,website,created_at')
        .eq('post_id', postId).eq('status', 'published').order('created_at', { ascending: true });
      if (error) throw error;
      return json(request, { enabled: post.comments_enabled, visible: true, comments: (data ?? []).map((comment) => ({
        id: comment.id, parentId: comment.parent_id, nickname: comment.nickname, body: comment.body,
        website: comment.website, createdAt: comment.created_at,
      })) });
    }
    if (request.method !== 'POST') throw new HttpError(405, 'method not allowed');
    const body = await readJson(request);
    const postId = typeof body.postId === 'string' ? body.postId : '';
    const parentId = body.parentId == null ? null : String(body.parentId);
    if (!UUID.test(postId) || (parentId && !UUID.test(parentId))) throw new HttpError(400, 'valid postId and parentId are required');
    const nickname = plain(body.nickname, 'nickname', 1, 40);
    const commentBody = plain(body.body, 'body', 1, 2000);
    const website = body.website == null || body.website === '' ? null : String(body.website);
    if (website && (!website.startsWith('https://') || website.length > 300)) throw new HttpError(400, 'website must be an https URL');
    const { data: post, error: postError } = await db.from('posts')
      .select('id').eq('id', postId).eq('status', 'published').eq('comments_enabled', true)
      .not('current_publication_id', 'is', null).maybeSingle();
    if (postError) throw postError;
    if (!post) throw new HttpError(403, 'comments are not available for this post');
    if (parentId) {
      const { data: parent } = await db.from('comments').select('id').eq('id', parentId).eq('post_id', postId).eq('status', 'published').maybeSingle();
      if (!parent) throw new HttpError(400, 'parent comment is not available');
    }
    const clientAddress = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const submissionHash = await hmacHex(`${clientAddress}|${request.headers.get('user-agent') ?? ''}`, 'COMMENT_HASH_SECRET');
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count, error: countError } = await db.from('comments').select('id', { count: 'exact', head: true })
      .eq('submission_hash', submissionHash).gte('created_at', since);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) throw new HttpError(429, 'too many comments; try again later');
    const { data: comment, error } = await db.from('comments')
      .insert({ post_id: postId, parent_id: parentId, nickname, body: commentBody, website, submission_hash: submissionHash, status: 'pending' })
      .select('id,status,created_at').single();
    if (error) throw error;
    return json(request, { comment: { id: comment.id, status: comment.status, createdAt: comment.created_at } }, 202);
  } catch (error) { return errorResponse(request, error); }
});
