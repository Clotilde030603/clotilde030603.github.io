import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { requireOwner, serviceClient } from '../_shared/supabase.ts';

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
    const buildToken = request.headers.get('x-build-token') ?? '';
    const expectedToken = Deno.env.get('BUILD_MANIFEST_TOKEN') ?? '';
    if (!expectedToken || !buildToken || !constantTimeEqual(buildToken, expectedToken)) await requireOwner(request);
    const body = await readJson(request, 4096);
    const deploymentId = typeof body.deploymentId === 'string' ? body.deploymentId : null;
    const liveOnly = body.liveOnly === true;
    const db = serviceClient();
    let query = db.from('deployments').select('id,status,manifest,requested_at').order('requested_at', { ascending: false }).limit(1);
    if (deploymentId) query = query.eq('id', deploymentId);
    else if(liveOnly) query=query.eq('status','live');
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, liveOnly?'no live deployment manifest exists':'deployment manifest not found');
    if (deploymentId && data.status === 'superseded') throw new HttpError(409, 'deployment was superseded by a newer public snapshot');
    return json(request, { deployment: { id: data.id, status: data.status, requestedAt: data.requested_at }, manifest: data.manifest });
  } catch (error) { return errorResponse(request, error); }
});
