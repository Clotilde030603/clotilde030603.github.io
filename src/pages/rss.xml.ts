import type { APIRoute } from 'astro';
import { categoryById, posts } from '../lib/public/content';
import { escapeXml, renderDocument } from '../lib/public/render-document';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://clotilde030603.github.io');
  const items = posts
    .map((post) => {
      const url = new URL(`/posts/${encodeURIComponent(post.slug)}/`, base).toString();
      const category = post.categoryId ? categoryById.get(post.categoryId)?.name : null;
      const html = renderDocument(post.document).html.replaceAll(']]>', ']]&gt;');
      return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${escapeXml(url)}</link>
  <guid isPermaLink="true">${escapeXml(url)}</guid>
  <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
  ${category ? `<category>${escapeXml(category)}</category>` : ''}
  <description>${escapeXml(post.summary)}</description>
  <content:encoded><![CDATA[${html}]]></content:encoded>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Dorami</title>
  <link>${escapeXml(base.toString())}</link>
  <description>보안 기술, 개인정보, 개발과 배움을 기록하는 Dorami 블로그</description>
  <language>ko</language>
  ${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
