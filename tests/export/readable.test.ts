import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import type { PublicSnapshot } from '../../src/lib/types';
import { exportPublishedPost, zipPublishedReadable } from '../../src/lib/export/readable';

const snapshot: PublicSnapshot = {
  schemaVersion: 1,
  deploymentId: '11111111-1111-4111-8111-111111111111',
  generatedAt: '2026-10-21T00:00:00Z',
  categories: [], slugAliases: [], about: null,
  posts: [{
    id: '22222222-2222-4222-8222-222222222222', slug: 'public-post', title: '공개 글', summary: '', categoryId: null, tags: [],
    publishedAt: '2026-10-21T00:00:00Z', updatedAt: null, commentsEnabled: true, commentsVisible: true,
    document: { schemaVersion: 1, content: { type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: '안전 <script> 문장' }] },
      { type: 'codeBlock', attrs: { language: 'python' }, content: [{ type: 'text', text: 'print("hello")' }] },
      { type: 'callout', content: [{ type: 'paragraph', content: [{ type: 'text', text: '주의' }] }] },
    ] } },
  }],
};

describe('readable export', () => {
  it('produces escaped HTML, readable Markdown, and an honest loss warning', () => {
    const exported = exportPublishedPost(snapshot.posts[0]);
    expect(exported.markdown).toContain('안전 &lt;script&gt; 문장');
    expect(exported.markdown).toContain('```python');
    expect(exported.html).toContain('&lt;script&gt;');
    expect(exported.html).not.toContain('<script>');
    expect(exported.warnings.join(' ')).toContain('콜아웃');
  });

  it('packages published content only, even when caller has private fields', () => {
    const input = structuredClone(snapshot) as PublicSnapshot & { drafts?: unknown };
    input.drafts = [{ title: '비밀 초안' }];
    const files = unzipSync(zipPublishedReadable(input));
    expect(Object.keys(files).sort()).toEqual(['README.txt', 'posts/public-post.html', 'posts/public-post.md']);
    expect(strFromU8(files['README.txt'])).toContain('초안과 관리자 데이터는 포함하지 않습니다');
    expect(JSON.stringify(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, strFromU8(value)])))).not.toContain('비밀 초안');
  });
});
