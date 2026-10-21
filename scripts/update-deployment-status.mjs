const [deploymentId, status] = process.argv.slice(2);
if (!deploymentId || !/^[0-9a-f-]{36}$/i.test(deploymentId)) throw new Error('A deployment UUID is required.');
if (!['building', 'live', 'failed'].includes(status)) throw new Error('Invalid deployment status.');
const serviceUrl = process.env.SUPABASE_URL;
const buildToken = process.env.BUILD_MANIFEST_TOKEN;
if (!serviceUrl || !buildToken) throw new Error('SUPABASE_URL and BUILD_MANIFEST_TOKEN are required.');
const origin = new URL(serviceUrl);
if (origin.protocol !== 'https:' && origin.hostname !== '127.0.0.1' && origin.hostname !== 'localhost') throw new Error('Status service must use HTTPS.');
const body = { deploymentId, status, githubRunId: Number(process.env.GITHUB_RUN_ID) || undefined };
if (status === 'failed') body.errorMessage = 'GitHub Pages workflow failed. Review the workflow run for details.';
let lastError;
for (let attempt = 0; attempt < 3; attempt += 1) {
  try {
    const response = await fetch(new URL('/functions/v1/deployment-status', origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-build-token': buildToken },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Status update failed: ${response.status}`);
    process.stdout.write(`Deployment ${deploymentId} is ${status}.\n`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1_000 * (attempt + 1)));
  }
}
throw lastError;
