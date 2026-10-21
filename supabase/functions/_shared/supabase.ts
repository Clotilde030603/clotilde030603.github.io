import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import { HttpError } from './http.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(request: Request): SupabaseClient {
  const authorization = request.headers.get('authorization');
  if (!authorization) throw new HttpError(401, 'authentication required');
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireOwner(request: Request): Promise<{ userId: string; client: SupabaseClient }> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'authentication required');
  const admin = serviceClient();
  const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice(7));
  if (userError || !userData.user) throw new HttpError(401, 'invalid authentication');
  const { data, error } = await admin.from('owner_accounts').select('user_id').eq('user_id', userData.user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(403, 'owner access required');
  return { userId: userData.user.id, client: userClient(request) };
}

export async function hmacHex(value: string, secretName: string): Promise<string> {
  const secret = env(secretName);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
