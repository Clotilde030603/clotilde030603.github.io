import { describe, expect, it } from 'vitest';
import { sanitizePublicSnapshot } from '../scripts/public-manifest.mjs';

const deploymentId = '8ec3049e-a361-4f19-a5a7-c77523723bdc';
const valid = () => ({
  schemaVersion: 1,
  deploymentId,
  generatedAt: '2026-10-21T00:00:00Z',
  categories: [],
  posts: [{
    id: 'post-1', slug: 'hello', title: 'Hello', summary: '', categoryId: null, tags: [],
    document: { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Public' }] }] } },
    publishedAt: '2026-10-21T00:00:00Z', updatedAt: null, commentsEnabled: true, commentsVisible: true,
  }],
  slugAliases: [],
  about: null,
});

describe('public publication manifest', () => {
  it('selects only public fields, even if a function accidentally sends private fields', () => {
    const source = valid() as any;
    source.secret = 'server-secret';
    source.posts[0].draft = { private: 'never publish' };
    const sanitized = sanitizePublicSnapshot(source, deploymentId);
    expect(JSON.stringify(sanitized)).not.toContain('server-secret');
    expect(JSON.stringify(sanitized)).not.toContain('never publish');
    expect(sanitized.posts[0].title).toBe('Hello');
  });

  it('rejects a different deployment snapshot', () => {
    expect(() => sanitizePublicSnapshot(valid(), 'e95b6855-b88e-4c31-a803-ed5de30606ae')).toThrow(/mismatch/);
  });

  it('rejects executable nodes and unsafe links before a Pages build', () => {
    const source = valid() as any;
    source.posts[0].document.content.content.push({ type: 'html', content: [{ type: 'text', text: '<script>' }] });
    expect(() => sanitizePublicSnapshot(source, deploymentId)).toThrow(/node/);
    source.posts[0].document.content.content.pop();
    source.posts[0].document.content.content[0].content[0].marks = [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }];
    expect(() => sanitizePublicSnapshot(source, deploymentId)).toThrow(/URL/);
  });

  it('selects published slug aliases for old article URLs', () => {
    const source = valid() as any;
    source.slugAliases = [{ slug: 'old-hello', postId: 'post-1', targetSlug: 'hello', privateNote: 'do not publish' }];
    const sanitized = sanitizePublicSnapshot(source, deploymentId);
    expect(sanitized.slugAliases).toEqual([{ slug: 'old-hello', postId: 'post-1', targetSlug: 'hello' }]);
  });

  it('retains only a published About document', () => {
    const source = valid() as any;
    source.about = { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '공개 소개' }] }] }, privateDraft: '비공개 소개' };
    const sanitized = sanitizePublicSnapshot(source, deploymentId);
    expect(JSON.stringify(sanitized.about)).toContain('공개 소개');
    expect(JSON.stringify(sanitized.about)).not.toContain('비공개 소개');
  });

  it('keeps safe image presentation fields and rejects unsafe styling', () => {
    const source = valid() as any;
    const previous = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = 'https://dorami.supabase.co';
    try {
      const src = 'https://dorami.supabase.co/storage/v1/object/public/published-media/post/photo.png';
      source.posts[0].document.content.content.push({ type: 'image', attrs: { src, alt: '토끼', caption: '설명', width: '80%', alignment: 'right', style: 'position:fixed' } });
      const node = sanitizePublicSnapshot(source, deploymentId).posts[0].document.content.content[1];
      expect(node.attrs).toEqual({ src, alt: '토끼', title: null, caption: '설명', width: '80%', alignment: 'right' });
      source.posts[0].document.content.content[1].attrs.src = 'https://tracker.example/pixel.png';
      expect(() => sanitizePublicSnapshot(source, deploymentId)).toThrow(/Unsafe image URL/);
    } finally {
      if (previous === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previous;
    }
  });

  it('carries the operator pin and order fields into the public-only snapshot', () => {
    const source = valid() as any;
    source.posts[0].pinned = true;
    source.posts[0].position = 3;
    const sanitized = sanitizePublicSnapshot(source, deploymentId);
    expect(sanitized.posts[0].pinned).toBe(true);
    expect(sanitized.posts[0].position).toBe(3);
  });

  it('rejects tags that would create unexpected static paths', () => {
    const source = valid() as any;
    source.posts[0].tags = ['../admin'];
    expect(() => sanitizePublicSnapshot(source, deploymentId)).toThrow(/Unsafe tag/);
    source.posts[0].tags = ['웹 보안'];
    expect(sanitizePublicSnapshot(source, deploymentId).posts[0].tags).toEqual(['웹 보안']);
  });
});
