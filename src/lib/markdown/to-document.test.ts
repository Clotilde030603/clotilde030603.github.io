import { describe, expect, it } from 'vitest';
import { markdownToDocument } from './to-document';
import { renderDocument } from '../public/render-document';

describe('markdownToDocument links', () => {
  it('preserves secure, legacy HTTP, local, and Unicode anchor links', () => {
    const document = markdownToDocument([
      '[HTTPS](https://example.com/guide)',
      '[HTTP](http://example.com/legacy)',
      '[Local](/posts/example/)',
      '[목차](#개인정보-보호)',
      '[Unsafe](javascript:alert(1))',
    ].join(' '));
    const links = (document.content.content ?? []).flatMap((paragraph) => paragraph.content ?? [])
      .flatMap((node) => node.marks ?? [])
      .filter((mark) => mark.type === 'link')
      .map((mark) => mark.attrs?.href);

    expect(links).toEqual([
      'https://example.com/guide',
      'http://example.com/legacy',
      '/posts/example/',
      '#개인정보-보호',
    ]);
  });

  it('renders a linked preview image as a local link card', () => {
    const metadata = encodeURIComponent(JSON.stringify({ title: 'Guide [title]', description: 'A short guide description' }));
    const document = markdownToDocument(`[![Link preview](/assets/posts/example/link-preview-01.png "dorami-card:${metadata}")](<https://example.com/guide>)`);
    expect(document.content.content?.[0]).toMatchObject({
      type: 'linkCard',
      attrs: {
        href: 'https://example.com/guide',
        src: '/assets/posts/example/link-preview-01.png',
        title: 'Guide [title]',
        description: 'A short guide description',
      },
    });
    const rendered = renderDocument(document).html;
    expect(rendered).toContain('class="article-link-card" href="https://example.com/guide"');
    expect(rendered).toContain('src="/assets/posts/example/link-preview-01.png"');
    expect(rendered).toContain('A short guide description');
  });
});
