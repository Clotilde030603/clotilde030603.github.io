import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left); const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let mismatch = 0; for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method not allowed');
    const token = request.headers.get('x-build-token') ?? '';
    const expected = Deno.env.get('BUILD_MANIFEST_TOKEN') ?? '';
    if (!expected || !token || !constantTimeEqual(token, expected)) throw new HttpError(401, 'invalid build token');
    const body = await readJson(request, 4096);
    const deploymentId = typeof body.deploymentId === 'string' ? body.deploymentId : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!/^[0-9a-f-]{36}$/i.test(deploymentId) || !['building','live','failed'].includes(status))
      throw new HttpError(400, 'valid deploymentId and status are required');
    const db = serviceClient();
    const { data: current, error: currentError } = await db.from('deployments').select('id,status,requested_at').eq('id', deploymentId).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new HttpError(404, 'deployment not found');
    if (current.status === 'superseded') throw new HttpError(409, 'deployment was superseded by a newer public snapshot');
    const { count: newer, error: newerError } = await db.from('deployments').select('id', { count: 'exact', head: true }).gt('requested_at', current.requested_at);
    if (newerError) throw newerError;
    if ((newer ?? 0) > 0) throw new HttpError(409, 'a newer deployment exists');
    const update: Record<string, unknown> = { status };
    if (status === 'live' || status === 'failed') update.completed_at = new Date().toISOString();
    if (Number.isSafeInteger(body.githubRunId)) update.github_run_id = body.githubRunId;
    if (status === 'failed' && typeof body.errorMessage === 'string') update.error_message = body.errorMessage.slice(0, 1000);
    const { data, error } = await db.from('deployments').update(update).eq('id', deploymentId).neq('status','superseded').select('id,status,github_run_id,completed_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'deployment not found');
    return json(request, { deployment: data });
  } catch (error) { return errorResponse(request, error); }
});
