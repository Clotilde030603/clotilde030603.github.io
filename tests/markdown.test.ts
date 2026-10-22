import { describe, expect, it } from 'vitest';
import { markdownToDocument } from '../src/lib/markdown/to-document';
import { renderDocument } from '../src/lib/public/render-document';

describe('Markdown publishing', () => {
  it('renders standard Markdown structures through the safe document renderer', () => {
    const document = markdownToDocument('# 제목\n\n**강조**와 [안전한 링크](https://example.com).\n\n- 하나\n- 둘\n\n```js\nalert(1)\n```');
    const { html, headings } = renderDocument(document);
    expect(headings[0].text).toBe('제목');
    expect(html).toContain('<strong>강조</strong>');
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('<ul>');
    expect(html).toContain('language-js');
  });

  it('escapes raw HTML and rejects unsafe links and remote images', () => {
    const document = markdownToDocument('<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n![tracker](https://tracker.example/pixel.png)');
    const { html } = renderDocument(document);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('tracker.example');
  });

  it('allows images from the blog asset directory', () => {
    const document = markdownToDocument('![설명](/assets/posts/photo.png)');
    expect(renderDocument(document).html).toContain('src="/assets/posts/photo.png"');
  });
});
