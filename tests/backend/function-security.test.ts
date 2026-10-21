import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const functionSource = (name: string) => readFileSync(new URL(`../../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8');

describe('edge function boundaries', () => {
  it('comments verify current publication state and default to moderation', () => {
    const source = functionSource('public-comments');
    expect(source).toContain(".eq('status', 'published')");
    expect(source).toContain(".eq('comments_enabled', true)");
    expect(source).toContain("status: 'pending'");
    expect(source).toContain('too many comments');
    expect(source).toContain('createdAt: comment.created_at');
    expect(source).toContain('parentId: comment.parent_id');
  });

  it('view collection rejects non-public IDs and stores only a keyed session hash', () => {
    const source = functionSource('record-view');
    expect(source).toContain(".eq('status', 'published')");
    expect(source).toContain("hmacHex(sessionId, 'ANALYTICS_HASH_SECRET')");
    expect(source).toContain('isAllowedOrigin(request)');
    expect(source).toContain("hmacHex(`rate:${address}`, 'ANALYTICS_HASH_SECRET')");
    expect(source).toContain('view event rate limit exceeded');
    expect(source).not.toContain('remote_addr');
  });

  it('CI manifests require a separate build token and return stored manifests', () => {
    const source = functionSource('admin-manifest');
    expect(source).toContain("request.headers.get('x-build-token')");
    expect(source).toContain("Deno.env.get('BUILD_MANIFEST_TOKEN')");
    expect(source).toContain("select('id,status,manifest,requested_at')");
    expect(source).toContain("query=query.eq('status','live')");
  });

  it('portable backups include and validate every media binary', () => {
    const source = functionSource('admin-backup');
    expect(source).toContain('storageObjects');
    expect(source).toContain('backup must contain every media object');
    expect(source).toContain('storage object does not match media metadata');
    expect(source).toContain('mediaRestore');
  });

  it('publication promotes private media and rewrites the canonical mediaId field', () => {
    const source = functionSource('publish-dispatch');
    expect(source).toContain("record.mediaId");
    expect(source).toContain("result.mediaId = replacement.id");
    expect(source).toContain("storage.from('published-media').upload");
    expect(source).not.toContain('mediaAssetId');
  });

  it('publication restore clones public media back into protected draft storage', () => {
    const source = functionSource('restore-publication');
    expect(source).toContain("storage.from('published-media').download");
    expect(source).toContain("storage.from('draft-media').upload");
    expect(source).toContain("visibility:'private'");
    expect(source).toContain("client.rpc('restore_publication_to_draft'");
  });

  it('dispatches About publication without exposing a GitHub credential to the client', () => {
    const source = functionSource('publish-dispatch');
    expect(source).toContain("body.action === 'about'");
    expect(source).toContain("client.rpc('publish_about'");
    expect(source).toContain("Deno.env.get('GITHUB_ACTIONS_TOKEN')");
  });

  it('remote imports enforce HTTPS DNS, redirect, size, MIME, and signature checks', () => {
    const source = functionSource('import-remote-image');
    const network = readFileSync(new URL('../../supabase/functions/_shared/net.ts', import.meta.url), 'utf8');
    expect(network).toContain("url.protocol!=='https:'");
    expect(network).toContain('defaultTrustedHosts');
    expect(network).toContain("Deno.env.get('REMOTE_IMAGE_TRUSTED_HOSTS')");
    expect(network).toContain('trusted allowlist');
    expect(network).toContain("Deno.resolveDns(host,'A')");
    expect(network).toContain('isPublicAddress(address)');
    expect(source).toContain("redirect:'manual'");
    expect(source).toContain('MAX_BYTES=10*1024*1024');
    expect(source).toContain('validImageMagic');
    expect(source).toContain("storage.from('draft-media').upload");
  });
});
