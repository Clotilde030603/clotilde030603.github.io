import { describe, expect, it, vi } from 'vitest';
import { loadAnalytics, restoreBackup, saveDraft, verifyOwner } from '../../src/lib/admin/api';
import { VersionConflictError } from '../../src/lib/admin/errors';
import { EMPTY_DOCUMENT } from '../../src/lib/admin/types';

const draft = {
  post_id: '00000000-0000-0000-0000-000000000001',
  title: '테스트',
  summary: '',
  category_id: null,
  tags: [],
  document: EMPTY_DOCUMENT,
  cover_media_id: null,
  original_created_at: null,
  source_url: null,
  version: 3,
};

describe('admin API contract', () => {
  it('sends the expected optimistic version and structured document', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ ...draft, version: 4, updated_at: '2026-10-21T00:00:00Z' }], error: null });
    const saved = await saveDraft({ rpc } as never, draft);
    expect(rpc).toHaveBeenCalledWith('save_draft', expect.objectContaining({
      p_post_id: draft.post_id,
      p_expected_version: 3,
      p_document: EMPTY_DOCUMENT,
    }));
    expect(saved.version).toBe(4);
  });

  it('surfaces a stale server version as a conflict', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: '40001', message: 'draft version conflict' } });
    await expect(saveDraft({ rpc } as never, draft)).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('checks the server owner RPC after authentication', async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'owner-id' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    };
    await expect(verifyOwner(client as never)).resolves.toBe(false);
    expect(client.rpc).toHaveBeenCalledWith('is_owner');
  });

  it('maps the analytics RPC response without inventing visitor counts', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { total: 7, daily: [{ day: '2026-10-21', views: 7 }], posts: [{ postId: 'p1', title: '글', views: 7 }] }, error: null });
    const result = await loadAnalytics({ rpc } as never, '2026-10-01', '2026-10-21');
    expect(result.totalPageViews).toBe(7);
    expect(result.daily).toEqual([{ date: '2026-10-21', pageViews: 7 }]);
    expect(result.posts[0].pageViews).toBe(7);
  });

  it('wraps restore payload in the Edge Function contract', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { restored: true }, error: null });
    await restoreBackup({ functions: { invoke } } as never, { schemaVersion: 1 });
    expect(invoke).toHaveBeenCalledWith('admin-backup', { method: 'POST', body: { backup: { schemaVersion: 1 } } });
  });
});
