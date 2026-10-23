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

  it('keeps a red important note on a new line within its numbered step', () => {
    const document = markdownToDocument('3. Download the ISO\\\n   {{important}}※ Rufus can create a bootable USB from an ISO image.{{/important}}');
    const rendered = renderDocument(document).html;

    expect(rendered).toContain('<li><p>Download the ISO<br /><span style="color:var(--warning)">※ Rufus can create a bootable USB from an ISO image.</span></p></li>');
  });

  it('preserves source text colors and soft background highlights', () => {
    const document = markdownToDocument([
      '## **{{color:#52643c}}Problem{{/color}}**',
      '### **{{bg:#e5ebdb}}배경{{/bg}}**',
    ].join('\n\n'));
    const rendered = renderDocument(document).html;

    expect(rendered).toContain('<span style="color:var(--matcha-strong)"><strong>Problem</strong></span>');
    expect(rendered).toContain('<span style="background-color:var(--matcha-highlight);padding:0.02em 0.12em;border-radius:2px;box-decoration-break:clone;-webkit-box-decoration-break:clone"><strong>배경</strong></span>');
  });

  it('allows a colored term to keep its inline-code treatment', () => {
    const document = markdownToDocument('`{{color:#a2645a}}externally-managed-environment{{/color}}`');
    const rendered = renderDocument(document).html;

    expect(rendered).toContain('<span style="color:var(--warning)"><code>externally-managed-environment</code></span>');
  });

  it('does not expose color markers inside code containing brackets', () => {
    const document = markdownToDocument('`{{color:#9d9d9d}}scp [옵션] [파일명]{{/color}}`');
    const rendered = renderDocument(document).html;

    expect(rendered).not.toContain('{{color:');
    expect(rendered).toContain('scp [옵션] [파일명]');
  });

  it('preserves ordered numbering when an image or code block splits the list', () => {
    const document = markdownToDocument([
      '1. 첫 번째 단계',
      '',
      '   ![단계 사진](/assets/posts/example/image-01.png)',
      '',
      '2. 두 번째 단계',
      '',
      '```sh',
      'echo done',
      '```',
      '',
      '3. 세 번째 단계',
    ].join('\n'));
    const rendered = renderDocument(document).html;

    expect(rendered).toContain('<ol><li><p>첫 번째 단계</p><figure class="image-center">');
    expect(rendered).toContain('<ol start="3"><li><p>세 번째 단계</p></li></ol>');
  });

  it('renders image titles as attached figure captions', () => {
    const document = markdownToDocument('![Screenshot](/assets/posts/example/image-01.png "Raspberry Pi setup")');
    const rendered = renderDocument(document).html;

    expect(rendered).toContain('<figure class="image-center"><button');
    expect(rendered).toContain('<figcaption>Raspberry Pi setup</figcaption>');
  });
});
