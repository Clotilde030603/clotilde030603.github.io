import { getCollection } from 'astro:content';
import { buildBlogContent } from './content';

export async function getBlogContent() {
  const [posts, about] = await Promise.all([getCollection('posts'), getCollection('about')]);
  return buildBlogContent(posts, about);
}
