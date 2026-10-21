import type { PublishedPost } from '../types';
import type { PublicSlugAlias } from './slug-aliases';

export type PublicPostPath = {
  params: { slug: string };
  props: { post: PublishedPost; redirectTo: string | null };
};

export function buildPublicPostPaths(
  posts: PublishedPost[],
  aliases: PublicSlugAlias[],
): PublicPostPath[] {
  const postById = new Map(posts.map((post) => [post.id, post]));
  return [
    ...posts.map((post) => ({
      params: { slug: post.slug },
      props: { post, redirectTo: null },
    })),
    ...aliases.flatMap((alias) => {
      const post = postById.get(alias.postId);
      return post
        ? [{
            params: { slug: alias.slug },
            props: { post, redirectTo: `/posts/${encodeURIComponent(post.slug)}/` },
          }]
        : [];
    }),
  ];
}
