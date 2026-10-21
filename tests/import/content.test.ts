// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { importHtml, importMarkdown, importNotionZip, importTistoryHtml, safeLink } from '../../src/lib/import/content';

describe('safe import conversion', () => {
  it('keeps supported Markdown structure and marks in the versioned document', () => {
    const imported = importMarkdown('# Test\n\n**strong** and [source](https://example.com)\n\n|A|B|\n|-|-|\n|1|2|', 'Test.md');
    expect(imported.title).toBe('Test');
    expect(imported.document.schemaVersion).toBe(1);
    expect(imported.document.content.content?.map((node) => node.type)).toEqual(['heading', 'paragraph', 'table']);
    expect(imported.document.content.content?.[1].content?.[0].marks?.[0].type).toBe('bold');
  });

  it('does not preserve executable HTML, event handlers, or dangerous URLs', () => {
    const imported = importHtml('<h1>Safe</h1><script>alert(1)</script><p><a href="javascript:alert(2)">link</a><img src="javascript:alert(3)" onerror="alert(4)"></p>');
    const serialized = JSON.stringify(imported.document);
    expect(serialized).not.toContain('alert(');
    expect(serialized).not.toContain('javascript:');
    expect(imported.warnings.map((warning) => warning.code)).toContain('unsafe-html');
    expect(imported.warnings.map((warning) => warning.code)).toContain('unsafe-link');
    expect(safeLink('data:text/html,<script>')).toBeNull();
  });

  it('rejects ZIP path traversal before extracting content', () => {
    const archive = zipSync({ '../evil.md': strToU8('# Bad') });
    expect(() => importNotionZip(archive)).toThrow(/ZIP 경로/);
  });

  it('imports Notion Markdown and images as drafts with missing-asset warnings', () => {
    const archive = zipSync({ 'Notebook/Page.md': strToU8('# Page\n\n![alt](photo.png)\n\n![missing](nope.png)'), 'Notebook/photo.png': new Uint8Array([137, 80, 78, 71]) });
    const bundle = importNotionZip(archive);
    expect(bundle.documents).toHaveLength(1);
    expect(bundle.assets).toHaveLength(1);
    expect(bundle.documents[0].document.content.content?.some((node) => node.type === 'image')).toBe(true);
    expect(bundle.documents[0].warnings.map((warning) => warning.code)).toContain('missing-image');
  });

  it('requires an explicit source URL for Tistory HTML import', () => {
    expect(() => importTistoryHtml('<p>Hello</p>', { title: 'Post', sourceUrl: 'javascript:alert(1)' })).toThrow();
    const imported = importTistoryHtml('<p>Hello</p>', { title: 'Post', sourceUrl: 'https://example.tistory.com/123', originalCreatedAt: '2024-01-02T00:00:00+09:00' });
    expect(imported.sourceUrl).toBe('https://example.tistory.com/123');
    expect(imported.originalCreatedAt).toBe('2024-01-02T00:00:00+09:00');
  });
});
