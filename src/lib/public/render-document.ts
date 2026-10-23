import type { DoramiDocument, JsonNode } from '../types';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

for (const [name, definition] of Object.entries({ bash, css, javascript, json, python, sql, typescript, xml })) {
  hljs.registerLanguage(name, definition);
}

export type HeadingLink = { id: string; level: 1 | 2 | 3; text: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });

const safeUrl = (value: unknown, image = false): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (image && /^\/assets\/[A-Za-z0-9_./-]+$/.test(trimmed) && !trimmed.includes('..') && !trimmed.includes('//')) return trimmed;
  if (!image && trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\') && !/[\u0000-\u001f]/.test(trimmed)) return trimmed;
  if (!image && trimmed.startsWith('#')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (image) {
      return null;
    }
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const imageWidth = (raw: unknown): string | null => {
  const match = /^(\d{1,4})(px|%)$/.exec(String(raw ?? '').trim());
  if (!match) return null;
  const amount = Number(match[1]);
  return amount > 0 && (match[2] === '%' ? amount <= 100 : amount <= 2000) ? match[0] : null;
};

export function safeHref(value: unknown): string | null {
  return safeUrl(value);
}

const nodeText = (node: JsonNode): string =>
  [node.text ?? '', ...(node.content?.map(nodeText) ?? [])].join(' ').replace(/\s+/g, ' ').trim();

const nodeRawText = (node: JsonNode): string =>
  [node.text ?? '', ...(node.content?.map(nodeRawText) ?? [])].join('');

const slugger = () => {
  const used = new Map<string, number>();
  return (text: string) => {
    const base =
      text
        .toLocaleLowerCase('ko')
        .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
        .replace(/^-|-$/g, '') || 'section';
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };
};

function renderMarks(text: string, node: JsonNode): string {
  let rendered = escapeHtml(text);
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') rendered = `<strong>${rendered}</strong>`;
    else if (mark.type === 'italic') rendered = `<em>${rendered}</em>`;
    else if (mark.type === 'strike') rendered = `<s>${rendered}</s>`;
    else if (mark.type === 'underline') rendered = `<u>${rendered}</u>`;
    else if (mark.type === 'code') rendered = `<code>${rendered}</code>`;
    else if (mark.type === 'link') {
      const href = safeUrl(mark.attrs?.href);
      if (href) rendered = `<a href="${escapeHtml(href)}" rel="noreferrer">${rendered}</a>`;
    } else if (mark.type === 'textStyle') {
      const styles: string[] = [];
      const textColors: Record<string, string> = {
        '#52643c': 'var(--matcha-strong)',
        '#697d4f': 'var(--matcha)',
        '#676e65': 'var(--muted)',
        '#a2645a': 'var(--warning)',
      };
      if (typeof mark.attrs?.color === 'string' && textColors[mark.attrs.color.toLowerCase()]) {
        styles.push(`color:${textColors[mark.attrs.color.toLowerCase()]}`);
      }
      const backgroundColors: Record<string, string> = { '#e5ebdb': 'var(--matcha-highlight)' };
      if (typeof mark.attrs?.backgroundColor === 'string' && backgroundColors[mark.attrs.backgroundColor.toLowerCase()]) {
        styles.push(`background-color:${backgroundColors[mark.attrs.backgroundColor.toLowerCase()]};padding:0.02em 0.12em;border-radius:2px;box-decoration-break:clone;-webkit-box-decoration-break:clone`);
      }
      if (styles.length) rendered = `<span style="${styles.join(';')}">${rendered}</span>`;
    } else if (mark.type === 'highlight') {
      rendered = `<mark>${rendered}</mark>`;
    }
  }
  return rendered;
}

export function renderDocument(document: DoramiDocument): { html: string; headings: HeadingLink[] } {
  const headings: HeadingLink[] = [];
  const nextSlug = slugger();

  const render = (node: JsonNode): string => {
    const children = () => (node.content ?? []).map(render).join('');
    if (node.type === 'text') return renderMarks(node.text ?? '', node);
    if (node.type === 'doc') return children();
    if (node.type === 'paragraph') return `<p>${children()}</p>`;
    if (node.type === 'hardBreak') return '<br />';
    if (node.type === 'horizontalRule') return '<hr />';
    if (node.type === 'heading') {
      const rawLevel = Number(node.attrs?.level ?? 2);
      const level = ([1, 2, 3].includes(rawLevel) ? rawLevel : 2) as 1 | 2 | 3;
      const text = nodeText(node);
      const id = nextSlug(text);
      headings.push({ id, level, text });
      return `<h${level} id="${id}">${children()}<a class="heading-anchor" href="#${id}" aria-label="${escapeHtml(text)} 바로가기">#</a></h${level}>`;
    }
    if (node.type === 'bulletList') return `<ul>${children()}</ul>`;
    if (node.type === 'orderedList') {
      const start = Number(node.attrs?.start);
      const startAttribute = Number.isInteger(start) && start > 1 && start <= 100_000 ? ` start="${start}"` : '';
      return `<ol${startAttribute}>${children()}</ol>`;
    }
    if (node.type === 'listItem') return `<li>${children()}</li>`;
    if (node.type === 'taskList') return `<ul class="task-list">${children()}</ul>`;
    if (node.type === 'taskItem') {
      const checked = node.attrs?.checked === true;
      return `<li class="task-item"><input type="checkbox" disabled${checked ? ' checked' : ''} aria-label="${checked ? '완료됨' : '미완료'}" /><div>${children()}</div></li>`;
    }
    if (node.type === 'blockquote') return `<blockquote>${children()}</blockquote>`;
    if (node.type === 'codeBlock') {
      const requested = typeof node.attrs?.language === 'string' ? node.attrs.language.toLowerCase() : 'text';
      const language = /^[a-z0-9+-]{1,30}$/.test(requested) ? requested : 'text';
      const rawCode = nodeRawText(node);
      const code = hljs.getLanguage(language)
        ? hljs.highlight(rawCode, { language, ignoreIllegals: true }).value
        : escapeHtml(rawCode);
      return `<div class="code-block"><div class="code-meta"><span>${escapeHtml(language)}</span><button type="button" data-copy-code>복사</button></div><pre><code class="language-${escapeHtml(language)}">${code}</code></pre></div>`;
    }
    if (node.type === 'linkCard') {
      const href = safeUrl(node.attrs?.href);
      const src = safeUrl(node.attrs?.src, true);
      if (!href || !src) return '';
      const title = escapeHtml(String(node.attrs?.title ?? ''));
      const description = escapeHtml(String(node.attrs?.description ?? ''));
      let host = '';
      try { host = new URL(href).hostname; } catch { /* Local links do not have a host label. */ }
      return `<a class="article-link-card" href="${escapeHtml(href)}" rel="noreferrer"><img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" /><span class="article-link-card-copy"><strong>${title}</strong>${description ? `<span>${description}</span>` : ''}${host ? `<small>${escapeHtml(host)}</small>` : ''}</span></a>`;
    }
    if (node.type === 'image') {
      const src = safeUrl(node.attrs?.src, true);
      if (!src) return '<p class="media-warning">표시할 수 없는 이미지입니다.</p>';
      const alt = typeof node.attrs?.alt === 'string' ? escapeHtml(node.attrs.alt) : '';
      const caption = escapeHtml(String(node.attrs?.caption || node.attrs?.title || ''));
      const width = imageWidth(node.attrs?.width);
      const alignment = ['left', 'center', 'right'].includes(String(node.attrs?.alignment)) ? String(node.attrs?.alignment) : 'center';
      return `<figure class="image-${alignment}"><button class="image-expand" type="button" data-expand-image aria-label="이미지 크게 보기"><img src="${escapeHtml(src)}" alt="${alt}"${width ? ` style="width:${width}"` : ''} loading="lazy" decoding="async" /></button>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
    }
    if (node.type === 'table') {
      const columnCount = node.content?.[0]?.content?.length ?? 0;
      const tableClass = columnCount > 1 ? ' class="table-wide"' : '';
      const scrollHint = columnCount > 1 ? '<p class="table-scroll-hint">표를 좌우로 움직여 내용을 확인할 수 있습니다.</p>' : '';
      return `<div class="table-scroll">${scrollHint}<table${tableClass}>${children()}</table></div>`;
    }
    if (node.type === 'tableRow') return `<tr>${children()}</tr>`;
    if (node.type === 'tableHeader') return `<th>${children()}</th>`;
    if (node.type === 'tableCell') return `<td>${children()}</td>`;
    if (node.type === 'details' || node.type === 'toggle') {
      const [summary, ...rest] = node.content ?? [];
      return `<details><summary>${summary ? render(summary) : '자세히 보기'}</summary>${rest.map(render).join('')}</details>`;
    }
    if (node.type === 'callout') return `<aside class="callout">${children()}</aside>`;
    return children();
  };

  return { html: render(document.content), headings };
}

export function escapeXml(value: string): string {
  return escapeHtml(value);
}
