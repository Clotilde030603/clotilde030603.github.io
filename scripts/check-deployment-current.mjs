import { appendFile } from 'node:fs/promises';

const deploymentId = process.argv[2];
const serviceUrl = process.env.SUPABASE_URL;
const buildToken = process.env.BUILD_MANIFEST_TOKEN;
if (!deploymentId || !/^[0-9a-f-]{36}$/i.test(deploymentId) || !serviceUrl || !buildToken) throw new Error('Deployment and manifest credentials are required.');
const origin = new URL(serviceUrl);
if (origin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('Manifest service must use HTTPS.');
const response = await fetch(new URL('/functions/v1/admin-manifest', origin), {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-build-token': buildToken },
  body: JSON.stringify({ deploymentId }),
  signal: AbortSignal.timeout(20_000),
});
if (response.status !== 200 && response.status !== 409) throw new Error(`Publication eligibility check failed: ${response.status}`);
const current = response.status === 200;
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `current=${current}\n`);
process.stdout.write(current ? 'Publication is current.\n' : 'Publication was superseded; skipping deploy.\n');
