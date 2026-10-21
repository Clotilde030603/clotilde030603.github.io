import { describe, expect, it } from 'vitest';
import type { PublishedPost } from '../types';
import { buildPublicPostPaths } from './post-paths';

describe('static post paths', () => {
  it('creates a canonical article route and an old-slug redirect route', () => {
    const post = { id: 'post-1', slug: 'current-title' } as PublishedPost;
    expect(buildPublicPostPaths([post], [
      { slug: 'old-title', postId: post.id, targetSlug: post.slug },
    ])).toEqual([
      { params: { slug: 'current-title' }, props: { post, redirectTo: null } },
      {
        params: { slug: 'old-title' },
        props: { post, redirectTo: '/posts/current-title/' },
      },
    ]);
  });
});
