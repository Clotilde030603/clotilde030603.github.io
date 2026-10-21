const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://127.0.0.1:4321,https://clotilde030603.github.io')
  .split(',').map((value) => value.trim()).filter(Boolean);

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigin = configuredOrigins.includes(origin) ? origin : configuredOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin') ?? '';
  return configuredOrigins.includes(origin);
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function preflight(request: Request): Response | null {
  return request.method === 'OPTIONS' ? new Response(null, { status: 204, headers: corsHeaders(request) }) : null;
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > maxBytes) throw new HttpError(413, 'request body is too large');
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, 'request body is too large');
  try {
    const parsed = JSON.parse(text || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    return parsed;
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof HttpError) return json(request, { error: error.message }, error.status);
  console.error(error);
  return json(request, { error: 'internal server error' }, 500);
}
