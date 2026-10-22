import { describe, expect, it } from 'vitest';
import type { DoramiDocument } from '../types';
import { renderDocument, safeHref } from './render-document';

describe('renderDocument', () => {
  it('escapes text and blocks executable URLs', () => {
    const document: DoramiDocument = {
      schemaVersion: 1,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '<script>alert(1)</script>' },
              {
                type: 'text',
                text: 'bad link',
                marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
              },
            ],
          },
          { type: 'image', attrs: { src: 'data:text/html,<script>alert(1)</script>' } },
        ],
      },
    };

    const { html } = renderDocument(document);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('data:text');
    expect(html).toContain('표시할 수 없는 이미지');
  });

  it('keeps code whitespace and creates stable unique heading anchors', () => {
    const document: DoramiDocument = {
      schemaVersion: 1,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '테스트 제목' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '테스트 제목' }] },
          { type: 'codeBlock', attrs: { language: 'py' }, content: [{ type: 'text', text: 'a = 1\n  b = 2' }] },
        ],
      },
    };
    const result = renderDocument(document);
    expect(result.headings.map((heading) => heading.id)).toEqual(['테스트-제목', '테스트-제목-2']);
    expect(result.html.replace(/<[^>]+>/g, '')).toContain('a = 1\n  b = 2');
    expect(result.html).toContain('language-py');
  });
});

describe('safeHref', () => {
  it('allows expected public links only', () => {
    expect(safeHref('https://example.com/post')).toBe('https://example.com/post');
    expect(safeHref('https://example.com/post?a=1&b=2')).toBe('https://example.com/post?a=1&b=2');
    expect(safeHref('/local/path')).toBe('/local/path');
    expect(safeHref('/\\evil.example/path')).toBeNull();
    expect(safeHref('//evil.example')).toBeNull();
    expect(safeHref('javascript:alert(1)')).toBeNull();
  });
});

it('renders local image captions and alignment without accepting arbitrary style', () => {
  const src = '/assets/posts/photo.png';
  const document: DoramiDocument = { schemaVersion: 1, content: { type: 'doc', content: [
    { type: 'image', attrs: { src, alt: '토끼', caption: '<설명>', width: '80%', alignment: 'right', style: 'position:fixed' } },
  ] } };
  const html = renderDocument(document).html;
  expect(html).toContain('class="image-right"');
  expect(html).toContain('width:80%');
  expect(html).toContain('&lt;설명&gt;');
  expect(html).not.toContain('position:fixed');
});

it('does not fetch reader-tracking images from another host', () => {
  const document: DoramiDocument = { schemaVersion: 1, content: { type: 'doc', content: [
    { type: 'image', attrs: { src: 'https://tracker.example/pixel.png' } },
  ] } };
  const html = renderDocument(document).html;
  expect(html).toContain('표시할 수 없는 이미지');
  expect(html).not.toContain('tracker.example');
});
