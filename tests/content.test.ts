import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { buildBlogContent, postsInCategory } from '../src/lib/public/content';

function post(id: string, category: string, draft = false): CollectionEntry<'posts'> {
  return {
    id,
    collection: 'posts',
    data: {
      title: id,
      date: new Date('2026-10-22T00:00:00.000Z'),
      updated: undefined,
      summary: '요약',
      category,
      tags: ['보안'],
      pinned: false,
      draft,
      sourceUrl: undefined,
    },
    body: '## 본문\n\nMarkdown 글입니다.',
  } as unknown as CollectionEntry<'posts'>;
}

describe('Markdown blog content', () => {
  it('builds nested category pages, tags, and sanitized post documents from frontmatter', () => {
    const content = buildBlogContent([post('first-post', '보안/웹 해킹')]);
    const postEntry = content.posts[0];

    expect(content.categories.map((category) => category.name)).toEqual(['교육·회고', '대회 후기', '보안', '보안 동향', '웹 해킹']);
    expect(postEntry.slug).toBe('first-post');
    expect(postEntry.categorySlug).toBe('보안--웹-해킹');
    expect(postEntry.tags).toEqual(['보안']);
    expect(content.allTags).toEqual(['보안']);
    expect(postsInCategory('보안', content.categories, content.posts)).toHaveLength(1);
    expect(postsInCategory('보안/보안 동향', content.categories, content.posts)).toEqual([]);
    expect(postsInCategory('교육·회고/대회 후기', content.categories, content.posts)).toEqual([]);
  });

  it('omits draft files from the public pages', () => {
    const content = buildBlogContent([post('_template', '기록', true)]);
    expect(content.posts).toEqual([]);
    expect(content.categories).toEqual([]);
  });
});
