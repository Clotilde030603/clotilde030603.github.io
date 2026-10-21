import { unzipSync } from 'fflate';
import { marked } from 'marked';
import type { DoramiDocument, JsonNode } from '../types';

export type ImportWarning = { code: string; message: string; path?: string };
export type ImportedAsset = { path: string; bytes: Uint8Array; mimeType: string };
export type ImportedDocument = {
  sourcePath: string;
  title: string;
  document: DoramiDocument;
  warnings: ImportWarning[];
  imagePaths: string[];
};
export type ImportBundle = {
  documents: ImportedDocument[];
  assets: ImportedAsset[];
  warnings: ImportWarning[];
};

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 500;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const MAX_EXPANSION_RATIO = 100;

const document = (content: JsonNode[]): DoramiDocument => ({
  schemaVersion: 1,
  content: { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] },
});

const textNode = (text: string, marks: JsonNode['marks'] = []): JsonNode[] =>
  text ? [{ type: 'text', text, ...(marks?.length ? { marks } : {}) }] : [];

const appendMark = (marks: NonNullable<JsonNode['marks']>, type: string, attrs?: Record<string, unknown>) =>
  [...marks, { type, ...(attrs ? { attrs } : {}) }];

export function safeLink(raw: string): string | null {
  try {
    const value = raw.trim();
    if (value.startsWith('#') && /^#[\w\-.:]+$/.test(value)) return value;
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function imageSource(raw: string, sourcePath: string, imagePaths: string[], warnings: ImportWarning[]): string | null {
  const value = raw.trim();
  if (/^https:\/\//i.test(value)) return value;
  if (/^[a-z][\w+.-]*:/i.test(value) || value.startsWith('//')) {
    warnings.push({ code: 'unsafe-image', message: `이미지 주소를 제외했습니다: ${value.slice(0, 80)}`, path: sourcePath });
    return null;
  }
  const base = sourcePath.split('/').slice(0, -1);
  const normalized = normalizeArchivePath([...base, value].join('/'));
  if (!normalized) {
    warnings.push({ code: 'unsafe-image', message: '안전하지 않은 상대 이미지 경로를 제외했습니다.', path: sourcePath });
    return null;
  }
  imagePaths.push(normalized);
  return `import-asset:${encodeURIComponent(normalized)}`;
}

function inlineNodes(tokens: any[] | undefined, warnings: ImportWarning[], sourcePath: string, marks: NonNullable<JsonNode['marks']> = []): JsonNode[] {
  const out: JsonNode[] = [];
  for (const token of tokens ?? []) {
    switch (token.type) {
      case 'text':
      case 'escape':
        out.push(...(token.tokens ? inlineNodes(token.tokens, warnings, sourcePath, marks) : textNode(token.text ?? '', marks)));
        break;
      case 'strong':
        out.push(...inlineNodes(token.tokens, warnings, sourcePath, appendMark(marks, 'bold')));
        break;
      case 'em':
        out.push(...inlineNodes(token.tokens, warnings, sourcePath, appendMark(marks, 'italic')));
        break;
      case 'del':
        out.push(...inlineNodes(token.tokens, warnings, sourcePath, appendMark(marks, 'strike')));
        break;
      case 'codespan':
        out.push(...textNode(token.text ?? '', appendMark(marks, 'code')));
        break;
      case 'link': {
        const href = safeLink(token.href ?? '');
        if (!href) warnings.push({ code: 'unsafe-link', message: '안전하지 않은 링크를 일반 텍스트로 가져왔습니다.', path: sourcePath });
        out.push(...inlineNodes(token.tokens, warnings, sourcePath, href ? appendMark(marks, 'link', { href }) : marks));
        break;
      }
      case 'br':
        out.push({ type: 'hardBreak' });
        break;
      case 'image':
        out.push(...textNode(token.text || '[이미지]', marks));
        warnings.push({ code: 'inline-image', message: '문장 안 이미지는 이미지 자리 표시자로 가져왔습니다.', path: sourcePath });
        break;
      default:
        out.push(...textNode(token.text ?? '', marks));
    }
  }
  return out;
}

function markdownBlocks(tokens: any[], warnings: ImportWarning[], sourcePath: string, imagePaths: string[]): JsonNode[] {
  const out: JsonNode[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        break;
      case 'heading':
        if (token.depth > 3) warnings.push({ code: 'heading-depth', message: `H${token.depth}을 H3으로 가져왔습니다.`, path: sourcePath });
        out.push({ type: 'heading', attrs: { level: Math.min(token.depth, 3) }, content: inlineNodes(token.tokens, warnings, sourcePath) });
        break;
      case 'paragraph':
      case 'text': {
        const inline = token.tokens ?? (marked.lexer(token.text ?? '', { gfm: true })[0] as any)?.tokens;
        if (inline?.length === 1 && inline[0].type === 'image') {
          const image = inline[0];
          const src = imageSource(image.href ?? '', sourcePath, imagePaths, warnings);
          if (src) out.push({ type: 'image', attrs: { src, alt: image.text || '', title: image.title || null } });
        } else {
          out.push({ type: 'paragraph', content: inlineNodes(inline, warnings, sourcePath) });
        }
        break;
      }
      case 'code':
        out.push({ type: 'codeBlock', attrs: { language: token.lang || null }, content: textNode(token.text ?? '') });
        break;
      case 'list': {
        const items = (token.items ?? []).map((item: any) => {
          const content = markdownBlocks(item.tokens ?? [], warnings, sourcePath, imagePaths);
          return { type: item.task ? 'taskItem' : 'listItem', ...(item.task ? { attrs: { checked: Boolean(item.checked) } } : {}), content: content.length ? content : [{ type: 'paragraph' }] };
        });
        out.push({ type: token.items?.some((item: any) => item.task) ? 'taskList' : token.ordered ? 'orderedList' : 'bulletList', content: items });
        break;
      }
      case 'blockquote':
        out.push({ type: 'blockquote', content: markdownBlocks(token.tokens ?? [], warnings, sourcePath, imagePaths) });
        break;
      case 'hr':
        out.push({ type: 'horizontalRule' });
        break;
      case 'table': {
        const row = (cells: any[], header: boolean): JsonNode => ({ type: 'tableRow', content: cells.map((cell: any) => ({ type: header ? 'tableHeader' : 'tableCell', content: [{ type: 'paragraph', content: inlineNodes(cell.tokens, warnings, sourcePath) }] })) });
        out.push({ type: 'table', content: [row(token.header ?? [], true), ...(token.rows ?? []).map((cells: any[]) => row(cells, false))] });
        break;
      }
      case 'html': {
        const parsed = importHtml(token.text ?? '', sourcePath);
        out.push(...(parsed.document.content.content ?? []));
        warnings.push(...parsed.warnings);
        imagePaths.push(...parsed.imagePaths);
        break;
      }
      default:
        warnings.push({ code: 'unsupported-block', message: `지원하지 않는 블록 ${token.type}을(를) 확인하세요.`, path: sourcePath });
        if (token.text) out.push({ type: 'paragraph', content: textNode(token.text) });
    }
  }
  return out;
}

export function importMarkdown(markdown: string, sourcePath = 'pasted.md'): ImportedDocument {
  const warnings: ImportWarning[] = [];
  const imagePaths: string[] = [];
  const tokens = marked.lexer(markdown, { gfm: true });
  const titleToken = tokens.find((token: any) => token.type === 'heading' && token.depth === 1) as any;
  const title = (titleToken?.text || fileTitle(sourcePath)).trim();
  return { sourcePath, title, document: document(markdownBlocks(tokens, warnings, sourcePath, imagePaths)), warnings, imagePaths };
}

const SKIP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'meta', 'link']);

function htmlInline(node: Node, warnings: ImportWarning[], sourcePath: string, marks: NonNullable<JsonNode['marks']> = []): JsonNode[] {
  if (node.nodeType === Node.TEXT_NODE) return textNode(node.textContent ?? '', marks);
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) {
    warnings.push({ code: 'unsafe-html', message: `<${tag}> 요소를 제거했습니다.`, path: sourcePath });
    return [];
  }
  if (tag === 'br') return [{ type: 'hardBreak' }];
  let next = marks;
  if (tag === 'strong' || tag === 'b') next = appendMark(marks, 'bold');
  if (tag === 'em' || tag === 'i') next = appendMark(marks, 'italic');
  if (tag === 's' || tag === 'del') next = appendMark(marks, 'strike');
  if (tag === 'u') next = appendMark(marks, 'underline');
  if (tag === 'code') next = appendMark(marks, 'code');
  if (tag === 'a') {
    const href = safeLink(element.getAttribute('href') ?? '');
    if (href) next = appendMark(marks, 'link', { href });
    else warnings.push({ code: 'unsafe-link', message: '안전하지 않은 링크를 제거했습니다.', path: sourcePath });
  }
  return Array.from(element.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath, next));
}

function htmlBlocks(nodes: NodeListOf<ChildNode> | ChildNode[], warnings: ImportWarning[], sourcePath: string, imagePaths: string[]): JsonNode[] {
  const out: JsonNode[] = [];
  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) out.push({ type: 'paragraph', content: textNode(node.textContent.trim()) });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) {
      warnings.push({ code: 'unsafe-html', message: `<${tag}> 요소를 제거했습니다.`, path: sourcePath });
      continue;
    }
    if (/^h[1-6]$/.test(tag)) {
      const depth = Number(tag[1]);
      if (depth > 3) warnings.push({ code: 'heading-depth', message: `${tag.toUpperCase()}을 H3으로 가져왔습니다.`, path: sourcePath });
      out.push({ type: 'heading', attrs: { level: Math.min(depth, 3) }, content: Array.from(element.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath)) });
    } else if (tag === 'p') {
      const onlyImage = element.children.length === 1 && element.children[0].tagName.toLowerCase() === 'img' && !element.textContent?.trim();
      if (onlyImage) {
        const image = element.children[0];
        const src = imageSource(image.getAttribute('src') ?? '', sourcePath, imagePaths, warnings);
        if (src) out.push({ type: 'image', attrs: { src, alt: image.getAttribute('alt') || '', title: image.getAttribute('title') || null } });
      } else out.push({ type: 'paragraph', content: Array.from(element.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath)) });
    } else if (tag === 'img') {
      const src = imageSource(element.getAttribute('src') ?? '', sourcePath, imagePaths, warnings);
      if (src) out.push({ type: 'image', attrs: { src, alt: element.getAttribute('alt') || '', title: element.getAttribute('title') || null } });
    } else if (tag === 'pre') {
      const code = element.querySelector('code');
      const language = code?.className.match(/(?:language|lang)-([\w+-]+)/)?.[1] ?? null;
      out.push({ type: 'codeBlock', attrs: { language }, content: textNode(element.textContent ?? '') });
    } else if (tag === 'blockquote') {
      out.push({ type: 'blockquote', content: htmlBlocks(element.childNodes as NodeListOf<ChildNode>, warnings, sourcePath, imagePaths) });
    } else if (tag === 'ul' || tag === 'ol') {
      out.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: Array.from(element.children).filter((child) => child.tagName.toLowerCase() === 'li').map((li) => ({ type: 'listItem', content: [{ type: 'paragraph', content: Array.from(li.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath)) }] })) });
    } else if (tag === 'table') {
      const rows = Array.from(element.querySelectorAll('tr')).map((tr) => ({ type: 'tableRow', content: Array.from(tr.children).filter((cell) => ['td', 'th'].includes(cell.tagName.toLowerCase())).map((cell) => ({ type: cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell', content: [{ type: 'paragraph', content: Array.from(cell.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath)) }] })) }));
      out.push({ type: 'table', content: rows });
    } else if (tag === 'hr') out.push({ type: 'horizontalRule' });
    else if (tag === 'details') {
      const summary = element.querySelector('summary')?.textContent || '접기';
      out.push({ type: 'details', attrs: { open: element.hasAttribute('open') }, content: [{ type: 'detailsSummary', content: textNode(summary) }, { type: 'detailsContent', content: htmlBlocks(element.childNodes as NodeListOf<ChildNode>, warnings, sourcePath, imagePaths).filter((child) => child.type !== 'paragraph' || child.content?.[0]?.text !== summary) }] });
      warnings.push({ code: 'details-review', message: '토글의 열림 상태와 내부 배치를 확인하세요.', path: sourcePath });
    } else if (['div', 'article', 'section', 'main', 'body', 'figure'].includes(tag)) {
      out.push(...htmlBlocks(element.childNodes as NodeListOf<ChildNode>, warnings, sourcePath, imagePaths));
    } else {
      if (element.textContent?.trim()) out.push({ type: 'paragraph', content: Array.from(element.childNodes).flatMap((child) => htmlInline(child, warnings, sourcePath)) });
      warnings.push({ code: 'unsupported-html', message: `<${tag}> 배치를 일반 본문으로 가져왔습니다.`, path: sourcePath });
    }
  }
  return out;
}

export function importHtml(html: string, sourcePath = 'pasted.html'): ImportedDocument {
  if (typeof DOMParser === 'undefined') throw new Error('HTML 가져오기는 브라우저에서 실행해야 합니다.');
  const warnings: ImportWarning[] = [];
  const imagePaths: string[] = [];
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const title = parsed.querySelector('h1')?.textContent?.trim() || parsed.title?.trim() || fileTitle(sourcePath);
  const root = parsed.querySelector('article') || parsed.body;
  return { sourcePath, title, document: document(htmlBlocks(root.childNodes as NodeListOf<ChildNode>, warnings, sourcePath, imagePaths)), warnings, imagePaths };
}

export function importTistoryHtml(html: string, metadata: { title: string; sourceUrl: string; originalCreatedAt?: string }): ImportedDocument & { sourceUrl: string; originalCreatedAt?: string } {
  const sourceUrl = safeLink(metadata.sourceUrl);
  if (!sourceUrl || !sourceUrl.startsWith('https://')) throw new Error('티스토리 원본 주소는 HTTPS URL이어야 합니다.');
  const imported = importHtml(html, metadata.sourceUrl);
  imported.title = metadata.title.trim() || imported.title;
  imported.warnings.push({ code: 'tistory-source-review', message: '실제 티스토리 백업 형식 검증 전에는 HTML 본문과 이미지 변환을 검토하세요.', path: metadata.sourceUrl });
  return { ...imported, sourceUrl, ...(metadata.originalCreatedAt ? { originalCreatedAt: metadata.originalCreatedAt } : {}) };
}

function fileTitle(path: string): string {
  const name = path.split('/').at(-1) ?? '가져온 글';
  const cleaned = name.replace(/\.(md|markdown|html?)$/i, '').replace(/ [a-f\d]{32}$/i, '');
  try { return decodeURIComponent(cleaned); } catch { return cleaned; }
}

function normalizeArchivePath(path: string): string | null {
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.includes('\\') || path.includes('\0')) return null;
  const parts = path.split('/');
  const normalized: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!normalized.length) return null;
      normalized.pop();
    } else normalized.push(part);
  }
  return normalized.length ? normalized.join('/') : null;
}

const mimeFor = (path: string): string | null => {
  const extension = path.split('.').at(-1)?.toLowerCase();
  return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' } as Record<string, string>)[extension ?? ''] ?? null;
};

export function importNotionZip(bytes: Uint8Array): ImportBundle {
  if (bytes.byteLength > MAX_ZIP_BYTES) throw new Error('ZIP 파일이 50MB 제한을 넘었습니다.');
  let count = 0;
  let total = 0;
  const files = unzipSync(bytes, {
    filter(file) {
      count += 1;
      total += file.originalSize;
      if (count > MAX_FILES) throw new Error('ZIP 파일 수 제한을 넘었습니다.');
      if (!normalizeArchivePath(file.name)) throw new Error('안전하지 않은 ZIP 경로가 있습니다.');
      if (file.originalSize > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES) throw new Error('ZIP 압축 해제 크기 제한을 넘었습니다.');
      if (file.size > 0 && file.originalSize / file.size > MAX_EXPANSION_RATIO) throw new Error('ZIP 압축 비율이 비정상적입니다.');
      return /\.(md|markdown|html?|png|jpe?g|gif|webp)$/i.test(file.name);
    },
  });
  const assets: ImportedAsset[] = [];
  const documents: ImportedDocument[] = [];
  const warnings: ImportWarning[] = [];
  const decoder = new TextDecoder('utf-8');
  for (const [path, content] of Object.entries(files)) {
    const mimeType = mimeFor(path);
    if (mimeType) {
      assets.push({ path, bytes: content, mimeType });
    } else if (/\.(md|markdown)$/i.test(path)) {
      documents.push(importMarkdown(decoder.decode(content), path));
    } else if (/\.html?$/i.test(path)) {
      documents.push(importHtml(decoder.decode(content), path));
    }
  }
  const assetPaths = new Set(assets.map((asset) => asset.path));
  for (const imported of documents) {
    for (const path of imported.imagePaths) if (!assetPaths.has(path)) imported.warnings.push({ code: 'missing-image', message: `이미지 파일을 찾지 못했습니다: ${path}`, path: imported.sourcePath });
  }
  if (!documents.length) warnings.push({ code: 'no-documents', message: '가져올 Markdown 또는 HTML 문서를 찾지 못했습니다.' });
  return { documents, assets, warnings };
}
