import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const schema = readFileSync(new URL('../../supabase/migrations/202610210001_initial_schema.sql', import.meta.url), 'utf8');
const restore = readFileSync(new URL('../../supabase/migrations/202610210002_backup_restore.sql', import.meta.url), 'utf8');
const ordering = readFileSync(new URL('../../supabase/migrations/202610210007_manifest_order_and_category_move.sql', import.meta.url), 'utf8');

describe('protected backend schema contract', () => {
  it('uses an exact owner UUID allowlist and enables RLS on private state', () => {
    expect(schema).toContain('create table public.owner_accounts');
    expect(schema).toContain('where user_id = check_user_id');
    for (const table of ['drafts', 'draft_versions', 'publications', 'comments', 'view_events', 'deployments']) {
      expect(schema).toContain(`alter table public.${table} enable row level security`);
    }
    expect(schema).not.toMatch(/auth\.role\(\)\s*=\s*'authenticated'/);
  });

  it('separates optimistic draft saves from immutable publication snapshots', () => {
    expect(schema).toContain('where post_id = p_post_id and version = p_expected_version');
    expect(schema).toContain("using errcode = '40001'");
    expect(schema).toContain('create table public.publications');
    expect(schema).toContain("insert into public.publications(");
    expect(schema).toContain("create policy owner_read_publications");
    expect(schema).not.toMatch(/owner_all on public\.publications/);
  });

  it('freezes a public-only manifest per deployment', () => {
    expect(schema).toContain('manifest jsonb not null');
    expect(schema).toContain("where p.status='published' and p.deleted_at is null");
    const manifestFunction = schema.slice(schema.indexOf('create or replace function public.build_public_manifest'), schema.indexOf('revoke all on function public.build_public_manifest'));
    expect(manifestFunction).not.toContain('public.drafts');
    expect(manifestFunction).not.toContain('view_events');
    expect(manifestFunction).not.toContain('owner_accounts');
    expect(manifestFunction).toContain("'slugAliases'");
    expect(manifestFunction).toContain("'targetSlug'");
  });

  it('restores backups without automatically republishing content', () => {
    expect(restore).toContain("else 'unpublished'::public.post_status");
    expect(restore).toContain("'publicationState','unpublished'");
    expect(restore).not.toContain('current_publication_id) values');
  });

  it('publishes real curated order fields and moves categories through the guarded tree', () => {
    expect(ordering).toContain("'pinned',live_pinned");
    expect(ordering).toContain("'position',live_position");
    expect(ordering).toContain("create or replace function public.move_category");
    expect(ordering).toContain("pg_advisory_xact_lock(hashtext('dorami-category-tree'))");
  });
});
