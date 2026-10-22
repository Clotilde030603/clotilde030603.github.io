import { getCollection } from 'astro:content';
import { buildBlogContent } from './content';

export async function getBlogContent() {
  const posts = await getCollection('posts');
  return buildBlogContent(posts);
}
