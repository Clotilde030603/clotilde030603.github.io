import type { APIRoute } from 'astro';
import { getBlogContent } from '../lib/public/load-content';
import { escapeXml } from '../lib/public/render-document';

export const GET: APIRoute = async ({ site }) => {
  const { allTags, categories, posts } = await getBlogContent();
  const base = site ?? new URL('https://clotilde030603.github.io');
  const paths = [
    '/',
    '/about/',
    '/search/',
    ...categories.map((category) => `/category/${encodeURIComponent(category.slug)}/`),
    ...allTags.map((tag) => `/tag/${encodeURIComponent(tag)}/`),
    ...posts.map((post) => `/posts/${encodeURIComponent(post.slug)}/`),
  ];
  const urls = paths
    .map((path) => `<url><loc>${escapeXml(new URL(path, base).toString())}</loc></url>`)
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  );
};
