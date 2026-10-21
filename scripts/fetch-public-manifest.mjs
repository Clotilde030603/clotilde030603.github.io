import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sanitizePublicSnapshot } from './public-manifest.mjs';

const deploymentId = process.argv[2];
const serviceUrl = process.env.SUPABASE_URL;
const buildToken = process.env.BUILD_MANIFEST_TOKEN;
if (!deploymentId || !/^[0-9a-f-]{36}$/i.test(deploymentId)) throw new Error('A deployment UUID is required.');
if (!serviceUrl || !buildToken) throw new Error('SUPABASE_URL and BUILD_MANIFEST_TOKEN are required.');
const origin = new URL(serviceUrl);
if (origin.protocol !== 'https:' && origin.hostname !== '127.0.0.1' && origin.hostname !== 'localhost') {
  throw new Error('Manifest service must use HTTPS outside local development.');
}
const response = await fetch(new URL('/functions/v1/admin-manifest', origin), {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-build-token': buildToken },
  body: JSON.stringify({ deploymentId }),
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
const payload = await response.json();
const publicSnapshot = sanitizePublicSnapshot(payload?.manifest, deploymentId);
const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(root, '../src/data/public-snapshot.json');
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(publicSnapshot, null, 2)}\n`, 'utf8');
process.stdout.write(`Prepared ${publicSnapshot.posts.length} published posts for deployment ${deploymentId}.\n`);
