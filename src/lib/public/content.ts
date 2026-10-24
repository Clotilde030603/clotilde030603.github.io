import type { CollectionEntry } from 'astro:content';
import { markdownToDocument } from '../markdown/to-document';
import type { Category, PublishedPost } from '../types';

type PostEntry = CollectionEntry<'posts'>;

export type BlogContent = {
  categories: Category[];
  posts: PublishedPost[];
  allTags: string[];
};

const EMPTY_CATEGORY_PATHS = ['보안/보안 동향', '교육·회고/대회 후기'];

const categorySlugPart = (value: string) =>
  value.normalize('NFC').toLocaleLowerCase('ko').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || 'category';

function categoryNames(value: string | undefined): string[] {
  return (value ?? '').split('/').map((part) => part.trim()).filter(Boolean);
}

export function buildBlogContent(entries: PostEntry[]): BlogContent {
  const publishedEntries = entries.filter((entry) => !entry.data.draft);
  const categoryByPath = new Map<string, Omit<Category, 'position'>>();
  const addCategoryPath = (parts: string[]) => {
    for (let index = 0; index < parts.length; index += 1) {
      const path = parts.slice(0, index + 1);
      const id = path.join('/');
      if (!categoryByPath.has(id)) {
        categoryByPath.set(id, {
          id,
          name: path[path.length - 1],
          slug: path.map(categorySlugPart).join('--'),
          parentId: index ? path.slice(0, -1).join('/') : null,
        });
      }
    }
  };

  if (publishedEntries.length > 0) {
    EMPTY_CATEGORY_PATHS.forEach((path) => addCategoryPath(categoryNames(path)));
  }
  for (const entry of publishedEntries) {
    addCategoryPath(categoryNames(entry.data.category));
  }

  const categories = [...categoryByPath.values()]
    .sort((left, right) => left.id.localeCompare(right.id, 'ko'))
    .map((category, position) => ({ ...category, position }));
  const byCategoryId = new Map(categories.map((category) => [category.id, category]));
  const usedSlugs = new Set<string>();
  for (const category of categories) {
    if (usedSlugs.has(category.slug)) throw new Error(`카테고리 URL이 겹칩니다: ${category.id}`);
    usedSlugs.add(category.slug);
  }

  const posts: PublishedPost[] = publishedEntries.map((entry) => {
    const slug = entry.id;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`글 파일명은 영문 소문자와 숫자, 하이픈만 사용해 주세요: ${entry.id}`);
    }
    const parts = categoryNames(entry.data.category);
    const categoryId = parts.length ? parts.join('/') : null;
    const category = categoryId ? byCategoryId.get(categoryId) : undefined;
    const categoryPath = parts.flatMap((_, index) => {
      const item = byCategoryId.get(parts.slice(0, index + 1).join('/'));
      return item ? [item] : [];
    });
    return {
      id: slug,
      slug,
      title: entry.data.title,
      summary: entry.data.summary,
      categoryId,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      categoryPath,
      categoryOrder: categoryPath.map((item) => String(item.position).padStart(6, '0')).join('.') || 'zzzz',
      tags: [...new Set(entry.data.tags.map((tag) => tag.trim()).filter(Boolean))],
      document: markdownToDocument(entry.body ?? ''),
      publishedAt: entry.data.date.toISOString(),
      updatedAt: entry.data.updated?.toISOString() ?? null,
      pinned: entry.data.pinned,
      position: 0,
      sourceUrl: entry.data.sourceUrl ?? null,
    };
  }).sort((left, right) => Number(right.pinned) - Number(left.pinned) || Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  posts.forEach((post, index) => { post.position = index; });
  const allTags = [...new Set(posts.flatMap((post) => post.tags))].sort((left, right) => left.localeCompare(right, 'ko'));
  return { categories, posts, allTags };
}

export function postsInCategory(categoryId: string, categories: Category[], posts: PublishedPost[]): PublishedPost[] {
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
  return posts.filter((post) => post.categoryId && ids.has(post.categoryId));
}

export function categoryPath(categoryId: string | null, categories: Category[]): Category[] {
  const path: Category[] = [];
  const byId = new Map(categories.map((category) => [category.id, category]));
  const seen = new Set<string>();
  let current = categoryId ? byId.get(categoryId) : undefined;
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value)).replaceAll(' ', '');
}

export function plainText(post: PublishedPost): string {
  const visit = (node: PublishedPost['document']['content']): string =>
    [node.text ?? '', ...(node.content?.map(visit) ?? [])].join(' ');
  return `${post.title} ${post.summary} ${visit(post.document.content)}`.replace(/\s+/g, ' ').trim();
}
