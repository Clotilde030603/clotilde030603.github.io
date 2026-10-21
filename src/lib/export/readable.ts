import { strToU8, zipSync } from 'fflate';
import type { DoramiDocument, JsonNode, PublicSnapshot, PublishedPost } from '../types';
import { renderDocument } from '../public/render-document';

export type ReadableExport = { markdown: string; html: string; warnings: string[] };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character);
const escapeMarkdown = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1');

function safeUrl(raw: unknown, image = false): string | null {
  if (typeof raw !== 'string') return null;
  if (!image && /^#[\w:.-]+$/.test(raw)) return raw;
  if (image && /^\/(?!\/)[\w\-./%]+$/.test(raw) && !raw.includes('..')) return raw;
  try {
    const url = new URL(raw);
    return ['https:', ...(image ? [] : ['http:', 'mailto:'])].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function inline(node: JsonNode): string {
  if (node.type === 'hardBreak') return '  \n';
  if (node.type !== 'text') return (node.content ?? []).map(inline).join('');
  let value = escapeMarkdown(node.text ?? '');
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') value = `**${value}**`;
    else if (mark.type === 'italic') value = `*${value}*`;
    else if (mark.type === 'strike') value = `~~${value}~~`;
    else if (mark.type === 'code') value = `\`${(node.text ?? '').replace(/`/g, '\\`')}\``;
    else if (mark.type === 'link') {
      const href = safeUrl(mark.attrs?.href);
      if (href) value = `[${value}](${href.replace(/\)/g, '%29')})`;
    }
  }
  return value;
}

function rawText(node: JsonNode): string {
  return [node.text ?? '', ...(node.content ?? []).map(rawText)].join('');
}

function markdownBlocks(nodes: JsonNode[], warnings: Set<string>, indent = ''): string {
  const chunks: string[] = [];
  for (const node of nodes) {
    const content = node.content ?? [];
    if (node.type === 'paragraph') chunks.push(`${indent}${content.map(inline).join('')}`);
    else if (node.type === 'heading') chunks.push(`${'#'.repeat(Math.min(3, Math.max(1, Number(node.attrs?.level) || 1)))} ${content.map(inline).join('')}`);
    else if (node.type === 'codeBlock') {
      const code = rawText(node);
      const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
      const fence = '`'.repeat(longest + 1);
      const language = typeof node.attrs?.language === 'string' && /^[\w+-]{1,30}$/.test(node.attrs.language) ? node.attrs.language : '';
      chunks.push(`${fence}${language}\n${code}\n${fence}`);
    } else if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList') {
      chunks.push(content.map((item, index) => {
        const prefix = node.type === 'orderedList' ? `${index + 1}. ` : node.type === 'taskList' ? `- [${item.attrs?.checked ? 'x' : ' '}] ` : '- ';
        const lines = markdownBlocks(item.content ?? [], warnings).split('\n');
        return indent + prefix + lines.map((line, lineIndex) => lineIndex ? ' '.repeat(prefix.length) + line : line).join('\n');
      }).join('\n'));
    } else if (node.type === 'blockquote') {
      chunks.push(markdownBlocks(content, warnings).split('\n').map((line) => `> ${line}`).join('\n'));
    } else if (node.type === 'horizontalRule') chunks.push('---');
    else if (node.type === 'image') {
      const src = safeUrl(node.attrs?.src, true);
      if (src) chunks.push(`![${escapeMarkdown(String(node.attrs?.alt ?? ''))}](${src})`);
      else warnings.add('일부 이미지 주소가 안전하지 않아 읽기용 내보내기에서 제외되었습니다.');
      if (node.attrs?.caption || node.attrs?.title) chunks.push(`*${escapeMarkdown(String(node.attrs.caption || node.attrs.title))}*`);
      if (node.attrs?.width || node.attrs?.alignment) warnings.add('이미지 너비와 정렬은 Markdown에서 보존되지 않습니다.');
    } else if (node.type === 'table') {
      const rows = content.filter((row) => row.type === 'tableRow').map((row) => (row.content ?? []).map((cell) => rawText(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ')));
      if (rows.length) {
        chunks.push(`| ${rows[0].join(' | ')} |\n| ${rows[0].map(() => '---').join(' | ')} |${rows.slice(1).map((row) => `\n| ${row.join(' | ')} |`).join('')}`);
      }
      if (content.some((row) => (row.content ?? []).some((cell) => Number(cell.attrs?.colspan) > 1 || Number(cell.attrs?.rowspan) > 1))) warnings.add('병합된 표 셀은 Markdown에서 단순한 셀로 변환됩니다.');
    } else if (node.type === 'details' || node.type === 'toggle') {
      warnings.add('토글의 접힘 상태는 Markdown에서 보존되지 않습니다.');
      chunks.push(markdownBlocks(content, warnings, indent));
    } else if (node.type === 'callout') {
      warnings.add('콜아웃 스타일은 Markdown 인용으로 변환됩니다.');
      chunks.push(markdownBlocks(content, warnings).split('\n').map((line) => `> ${line}`).join('\n'));
    } else if (node.type === 'doc' || node.type === 'listItem' || node.type === 'taskItem') chunks.push(markdownBlocks(content, warnings, indent));
    else if (node.type === 'hardBreak') chunks.push('  ');
    else {
      warnings.add(`지원되지 않는 ${node.type} 블록은 텍스트로 변환되었습니다.`);
      if (rawText(node)) chunks.push(escapeMarkdown(rawText(node)));
    }
  }
  return chunks.filter(Boolean).join('\n\n');
}

export function exportReadableDocument(document: DoramiDocument, title: string, metadata?: { publishedAt?: string; sourceUrl?: string | null }): ReadableExport {
  if (document.schemaVersion !== 1 || document.content.type !== 'doc') throw new Error('지원하지 않는 문서 형식입니다.');
  const warnings = new Set<string>();
  const body = markdownBlocks(document.content.content ?? [], warnings);
  const header = [`# ${escapeMarkdown(title)}`];
  if (metadata?.publishedAt) header.push(`발행: ${metadata.publishedAt}`);
  if (metadata?.sourceUrl && safeUrl(metadata.sourceUrl)) header.push(`원문: ${metadata.sourceUrl}`);
  const markdown = `${header.join('\n\n')}\n\n${body}\n`;
  const rendered = renderDocument(document).html
    .replace(/<button type="button" data-copy-code>복사<\/button>/g, '')
    .replace(/<button class="image-expand"[^>]*><img([^>]*)\/><\/button>/g, '<img$1/>');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><main><h1>${escapeHtml(title)}</h1>${rendered}</main></body></html>\n`;
  return { markdown, html, warnings: [...warnings] };
}

export function exportPublishedPost(post: PublishedPost): ReadableExport {
  return exportReadableDocument(post.document, post.title, { publishedAt: post.publishedAt, sourceUrl: post.sourceUrl });
}

export function zipPublishedReadable(snapshot: PublicSnapshot): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const allWarnings: string[] = [];
  for (const post of snapshot.posts) {
    const exported = exportPublishedPost(post);
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) ? post.slug : post.id;
    files[`posts/${slug}.md`] = strToU8(exported.markdown);
    files[`posts/${slug}.html`] = strToU8(exported.html);
    allWarnings.push(...exported.warnings.map((warning) => `${post.title}: ${warning}`));
  }
  if (snapshot.about) {
    const about = exportReadableDocument(snapshot.about, '소개');
    files['about.md'] = strToU8(about.markdown);
    files['about.html'] = strToU8(about.html);
    allWarnings.push(...about.warnings.map((warning) => `소개: ${warning}`));
  }
  files['README.txt'] = strToU8(`Dorami 공개 글 읽기용 내보내기\n초안과 관리자 데이터는 포함하지 않습니다.\n\n표현 손실 안내:\n${allWarnings.length ? [...new Set(allWarnings)].join('\n') : '없음'}\n`);
  return zipSync(files, { level: 6 });
}
