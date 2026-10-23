import { marked } from 'marked';
import type { DoramiDocument, JsonNode } from '../types';

const textNodes = (text: string, marks: NonNullable<JsonNode['marks']> = []): JsonNode[] =>
  text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];

const withMark = (marks: NonNullable<JsonNode['marks']>, type: string, attrs?: Record<string, unknown>) =>
  [...marks, { type, ...(attrs ? { attrs } : {}) }];

function markedText(raw: string, marks: NonNullable<JsonNode['marks']>): JsonNode[] {
  const output: JsonNode[] = [];
  const marker = /\{\{(important|color|bg)(?::(#[0-9a-fA-F]{6}))?\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  let cursor = 0;

  for (const match of raw.matchAll(marker)) {
    const index = match.index ?? 0;
    const [, kind, requestedColor, content] = match;
    const color = kind === 'important' ? '#ef5369' : requestedColor;
    if (index > cursor) output.push(...textNodes(raw.slice(cursor, index), marks));
    if (!color) output.push(...textNodes(match[0], marks));
    else {
      const style = kind === 'bg' ? { backgroundColor: color } : { color };
      output.push(...markedText(content, withMark(marks, 'textStyle', style)));
    }
    cursor = index + match[0].length;
  }

  if (cursor < raw.length) output.push(...textNodes(raw.slice(cursor), marks));
  return output;
}

function safeLink(raw: string): string | null {
  try {
    const value = raw.trim();
    if (value.startsWith('#') && !/[\s\\<>\u0000-\u001f]/.test(value)) return value;
    if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/(?:^|\/)\.\.(?:\/|$)/.test(value)) return value;
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function safeImage(raw: string): string | null {
  const value = raw.trim();
  return /^\/assets\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..') && !value.includes('//')
    ? value
    : null;
}

function inline(tokens: any[] = [], marks: NonNullable<JsonNode['marks']> = []): JsonNode[] {
  const output: JsonNode[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'text':
      case 'escape':
        output.push(...(token.tokens ? inline(token.tokens, marks) : markedText(token.text ?? '', marks)));
        break;
      case 'strong': output.push(...inline(token.tokens, withMark(marks, 'bold'))); break;
      case 'em': output.push(...inline(token.tokens, withMark(marks, 'italic'))); break;
      case 'del': output.push(...inline(token.tokens, withMark(marks, 'strike'))); break;
      case 'codespan': output.push(...markedText(token.text ?? '', withMark(marks, 'code'))); break;
      case 'link': {
        const href = safeLink(token.href ?? '');
        output.push(...inline(token.tokens, href ? withMark(marks, 'link', { href }) : marks));
        break;
      }
      case 'br': output.push({ type: 'hardBreak' }); break;
      case 'image': output.push(...textNodes(token.text || '[이미지]', marks)); break;
      default: output.push(...textNodes(token.text ?? '', marks));
    }
  }
  return output;
}

function blocks(tokens: any[]): JsonNode[] {
  const output: JsonNode[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'space': break;
      case 'heading':
        output.push({ type: 'heading', attrs: { level: Math.min(token.depth, 3) }, content: inline(token.tokens) });
        break;
      case 'paragraph':
      case 'text': {
        const inlineTokens = token.tokens ?? (marked.lexer(token.text ?? '', { gfm: true })[0] as any)?.tokens ?? [];
        if (inlineTokens.length === 1 && inlineTokens[0].type === 'image') {
          const image = inlineTokens[0];
          const src = safeImage(image.href ?? '');
          if (src) output.push({ type: 'image', attrs: { src, alt: image.text || '', title: image.title || null } });
          else output.push({ type: 'paragraph', content: textNodes(image.text || '[이미지]') });
        } else if (
          inlineTokens.length === 1 &&
          inlineTokens[0].type === 'link' &&
          inlineTokens[0].tokens?.length === 1 &&
          inlineTokens[0].tokens[0].type === 'image'
        ) {
          const link = inlineTokens[0];
          const image = link.tokens[0];
          const href = safeLink(link.href ?? '');
          const src = safeImage(image.href ?? '');
          if (href && src) {
            let title = image.text || '';
            let description = image.title || '';
            if (image.title?.startsWith('dorami-card:')) {
              try {
                const metadata = JSON.parse(decodeURIComponent(image.title.slice('dorami-card:'.length)));
                if (typeof metadata.title === 'string') title = metadata.title;
                if (typeof metadata.description === 'string') description = metadata.description;
              } catch {
                // Keep the readable image text and caption if optional card metadata is malformed.
              }
            }
            output.push({
              type: 'linkCard',
              attrs: { href, src, title, description },
            });
          } else output.push({ type: 'paragraph', content: inline(inlineTokens) });
        } else output.push({ type: 'paragraph', content: inline(inlineTokens) });
        break;
      }
      case 'code':
        output.push({ type: 'codeBlock', attrs: { language: token.lang || null }, content: textNodes(token.text ?? '') });
        break;
      case 'list':
        output.push({
          type: token.items?.some((item: any) => item.task) ? 'taskList' : token.ordered ? 'orderedList' : 'bulletList',
          content: (token.items ?? []).map((item: any) => {
            const itemContent = blocks(item.tokens ?? []);
            return {
              type: item.task ? 'taskItem' : 'listItem',
              ...(item.task ? { attrs: { checked: Boolean(item.checked) } } : {}),
              content: itemContent.length ? itemContent : [{ type: 'paragraph' }],
            };
          }),
        });
        break;
      case 'blockquote': output.push({ type: 'blockquote', content: blocks(token.tokens ?? []) }); break;
      case 'hr': output.push({ type: 'horizontalRule' }); break;
      case 'table': {
        const row = (cells: any[], header: boolean): JsonNode => ({
          type: 'tableRow',
          content: cells.map((cell: any) => ({
            type: header ? 'tableHeader' : 'tableCell',
            content: [{ type: 'paragraph', content: inline(cell.tokens ?? []) }],
          })),
        });
        output.push({ type: 'table', content: [row(token.header ?? [], true), ...(token.rows ?? []).map((cells: any[]) => row(cells, false))] });
        break;
      }
      case 'html':
        // Raw HTML is rendered as escaped text, never inserted as executable markup.
        output.push({ type: 'paragraph', content: textNodes(token.text ?? '') });
        break;
      default:
        if (token.text) output.push({ type: 'paragraph', content: textNodes(token.text) });
    }
  }
  return output;
}

export function markdownToDocument(markdown: string): DoramiDocument {
  const content = blocks(marked.lexer(markdown, { gfm: true }));
  return { schemaVersion: 1, content: { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] } };
}
