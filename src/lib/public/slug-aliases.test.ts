import { describe, expect, it } from 'vitest';
import type { PublishedPost } from '../types';
import { normalizeSlugAliases } from './slug-aliases';

const post = { id: 'post-1', slug: 'current-title' } as PublishedPost;

describe('public slug aliases', () => {
  it('keeps an old slug pointing at a current published post', () => {
    expect(normalizeSlugAliases([post], [{ slug: 'old-title', postId: post.id }])).toEqual([
      { slug: 'old-title', postId: post.id },
    ]);
  });

  it('rejects unsafe, colliding, unpublished, or stale-target aliases', () => {
    expect(normalizeSlugAliases([post], [
      { slug: '../unsafe', postId: post.id },
      { slug: post.slug, postId: post.id },
      { slug: 'missing-post', postId: 'missing' },
      { slug: 'stale-target', postId: post.id, targetSlug: 'another-title' },
    ])).toEqual([]);
  });
});
