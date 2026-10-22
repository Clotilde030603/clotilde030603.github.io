import { errorResponse, HttpError, isAllowedOrigin, json, preflight, readJson } from '../_shared/http.ts';
import { hmacHex, serviceClient } from '../_shared/supabase.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT = /bot|crawler|spider|slurp|preview|headless|lighthouse/i;

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method not allowed');
    const origin = request.headers.get('origin') ?? '';
    if (!isAllowedOrigin(request)) throw new HttpError(403, 'origin is not allowed');
    if (/localhost|127\.0\.0\.1/.test(origin) || BOT.test(request.headers.get('user-agent') ?? '')) return json(request, { recorded: false }, 202);
    const body = await readJson(request, 4096);
    const postId = typeof body.postId === 'string' ? body.postId : '';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    if (!UUID.test(postId) || !UUID.test(sessionId)) throw new HttpError(400, 'valid postId and sessionId are required');
    const db = serviceClient();
    const authorization = request.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      const { data: user } = await db.auth.getUser(authorization.slice(7));
      if (user.user) {
        const { data: owner } = await db.from('owner_accounts').select('user_id').eq('user_id', user.user.id).maybeSingle();
        if (owner) return json(request, { recorded: false }, 202);
      }
    }
    const { data: post, error: postError } = await db.from('posts').select('id')
      .eq('id', postId).eq('status', 'published').not('current_publication_id', 'is', null).maybeSingle();
    if (postError) throw postError;
    if (!post) throw new HttpError(404, 'published post not found');
    const sessionHash = await hmacHex(sessionId, 'ANALYTICS_HASH_SECRET');
    const address = request.headers.get('cf-connecting-ip')?.trim().slice(0, 128) || 'unavailable';
    const requestHash = await hmacHex(`rate:${address}`, 'ANALYTICS_HASH_SECRET');
    const bucketMs = Math.floor(Date.now() / 300_000) * 300_000;
    const { data, error } = await db.rpc('record_public_view', {
      p_post_id: postId, p_session_hash: sessionHash, p_request_hash: requestHash,
      p_dedupe_bucket: new Date(bucketMs).toISOString(),
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.rate_limited) throw new HttpError(429, 'view event rate limit exceeded');
    return json(request, { recorded: Boolean(result?.recorded) }, 202);
  } catch (error) { return errorResponse(request, error); }
});
