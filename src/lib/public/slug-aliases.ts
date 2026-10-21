import type { PublishedPost } from '../types';

export type PublicSlugAlias = { slug: string; postId: string; targetSlug?: string };

export function normalizeSlugAliases(
  posts: PublishedPost[],
  aliases: PublicSlugAlias[] | undefined,
): PublicSlugAlias[] {
  const postById = new Map(posts.map((post) => [post.id, post]));
  const canonicalSlugs = new Set(posts.map((post) => post.slug));
  return (aliases ?? []).filter((alias) => {
    const target = postById.get(alias.postId);
    return (
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias.slug) &&
      !canonicalSlugs.has(alias.slug) &&
      Boolean(target) &&
      (!alias.targetSlug || alias.targetSlug === target?.slug)
    );
  });
}
