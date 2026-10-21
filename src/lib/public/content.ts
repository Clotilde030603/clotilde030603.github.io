import snapshotData from '../../data/public-snapshot.json';
import type { Category, PublicSnapshot, PublishedPost } from '../types';
import { normalizeSlugAliases, type PublicSlugAlias } from './slug-aliases';

type SnapshotWithAliases = PublicSnapshot & { slugAliases?: PublicSlugAlias[] };

export const snapshot = snapshotData as SnapshotWithAliases;
export const categories = [...snapshot.categories].sort((a, b) => a.position - b.position);
export const posts = [...snapshot.posts].sort(
  (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
);
export const slugAliases = normalizeSlugAliases(posts, snapshot.slugAliases);

export const categoryById = new Map(categories.map((category) => [category.id, category]));

export function categoryPath(categoryId: string | null): Category[] {
  const path: Category[] = [];
  const seen = new Set<string>();
  let current = categoryId ? categoryById.get(categoryId) : undefined;

  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? categoryById.get(current.parentId) : undefined;
  }

  return path;
}

export function descendantCategoryIds(categoryId: string): Set<string> {
  const ids = new Set([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function postsInCategory(categoryId: string): PublishedPost[] {
  const ids = descendantCategoryIds(categoryId);
  return posts.filter((post) => post.categoryId && ids.has(post.categoryId));
}

export function findPost(slug: string): PublishedPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replaceAll(' ', '');
}

export function plainText(post: PublishedPost): string {
  const visit = (node: PublishedPost['document']['content']): string =>
    [node.text ?? '', ...(node.content?.map(visit) ?? [])].join(' ');
  return `${post.title} ${post.summary} ${visit(post.document.content)}`.replace(/\s+/g, ' ').trim();
}

export const allTags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
  a.localeCompare(b, 'ko'),
);
