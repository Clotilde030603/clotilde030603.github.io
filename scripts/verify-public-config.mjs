const serviceUrl = process.env.PUBLIC_SUPABASE_URL;
const publishableKey = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!serviceUrl || !publishableKey) throw new Error('Public Supabase URL and publishable key are required for deployment.');
const parsed = new URL(serviceUrl);
if (parsed.protocol !== 'https:') throw new Error('Hosted public Supabase URL must use HTTPS.');
if (publishableKey.length < 16) throw new Error('Public Supabase publishable key appears incomplete.');
process.stdout.write('Public service configuration is present.\n');
