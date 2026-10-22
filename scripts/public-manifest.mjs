const NODE_TYPES = new Set(['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'taskList', 'taskItem', 'blockquote', 'codeBlock', 'hardBreak', 'horizontalRule', 'table', 'tableRow', 'tableHeader', 'tableCell', 'image', 'details', 'detailsSummary', 'detailsContent', 'callout']);
const MARK_TYPES = new Set(['bold', 'italic', 'strike', 'underline', 'code', 'link', 'highlight', 'textStyle']);

function safeUrl(raw, image = false) {
  const value = String(raw ?? '').trim();
  if (!image && /^#[\w\-.:]+$/.test(value)) return value;
  if (image && /^\/assets\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..') && !value.includes('//')) return value;
  try {
    const parsed = new URL(value);
    if (image) {
      const service = process.env.SUPABASE_URL;
      if (!service) throw new Error('Published media service is not configured.');
      const allowed = new URL(service);
      if (parsed.origin === allowed.origin && parsed.protocol === allowed.protocol &&
          parsed.pathname.startsWith('/storage/v1/object/public/published-media/') &&
          !/%(?:2f|5c)/i.test(parsed.pathname) && !parsed.username && !parsed.password &&
          !parsed.search && !parsed.hash) return parsed.href;
    } else if (parsed.protocol === 'https:' || ['http:', 'mailto:'].includes(parsed.protocol)) return parsed.href;
  } catch { /* invalid URL */ }
  throw new Error(`Unsafe ${image ? 'image' : 'link'} URL in publication.`);
}

function imageWidth(raw) {
  const value = String(raw ?? '').trim();
  const match = /^(\d{1,4})(px|%)$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  return amount > 0 && (match[2] === '%' ? amount <= 100 : amount <= 2000) ? value : null;
}

function safeTag(raw) {
  const tag = String(raw ?? '').trim().normalize('NFC');
  if (!tag || tag.length > 60 || tag === '.' || tag === '..' || /[\u0000-\u001f\u007f/\\?#%]/u.test(tag)) {
    throw new Error('Unsafe tag in publication.');
  }
  return tag;
}

function cleanMarks(marks) {
  if (!Array.isArray(marks)) return undefined;
  return marks.map((mark) => {
    if (!MARK_TYPES.has(mark?.type)) throw new Error('Unsupported mark in publication.');
    if (mark.type === 'link') return { type: 'link', attrs: { href: safeUrl(mark.attrs?.href) } };
    if (mark.type === 'textStyle' && mark.attrs?.color) {
      const color = String(mark.attrs.color);
      if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('Unsafe text color in publication.');
      return { type: 'textStyle', attrs: { color } };
    }
    if (mark.type === 'highlight') return { type: 'highlight' };
    return { type: mark.type };
  });
}

function cleanNode(node, depth = 0) {
  if (depth > 64 || !node || !NODE_TYPES.has(node.type)) throw new Error('Invalid document node in publication.');
  const clean = { type: node.type };
  if (node.type === 'text') {
    clean.text = String(node.text ?? '').slice(0, 1_000_000);
    const marks = cleanMarks(node.marks);
    if (marks?.length) clean.marks = marks;
    return clean;
  }
  if (node.type === 'heading') clean.attrs = { level: Math.min(3, Math.max(1, Number(node.attrs?.level) || 1)) };
  if (node.type === 'codeBlock') clean.attrs = { language: /^[\w+-]{1,30}$/.test(String(node.attrs?.language ?? '')) ? String(node.attrs.language) : null };
  if (node.type === 'image') clean.attrs = {
    src: safeUrl(node.attrs?.src, true),
    alt: String(node.attrs?.alt ?? '').slice(0, 300),
    title: node.attrs?.title == null ? null : String(node.attrs.title).slice(0, 300),
    caption: String(node.attrs?.caption ?? '').slice(0, 500),
    width: imageWidth(node.attrs?.width),
    alignment: ['left', 'center', 'right'].includes(node.attrs?.alignment) ? node.attrs.alignment : 'center',
  };
  if (node.type === 'taskItem') clean.attrs = { checked: Boolean(node.attrs?.checked) };
  if (node.type === 'details') clean.attrs = { open: Boolean(node.attrs?.open) };
  if (Array.isArray(node.content)) clean.content = node.content.map((child) => cleanNode(child, depth + 1));
  return clean;
}

function cleanDocument(value) {
  if (!value || value.schemaVersion !== 1 || value.content?.type !== 'doc' || !Array.isArray(value.content.content)) throw new Error('Published document is invalid.');
  return { schemaVersion: 1, content: cleanNode(value.content) };
}

export function sanitizePublicSnapshot(manifest, deploymentId) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.deploymentId !== deploymentId || !Array.isArray(manifest.categories) || !Array.isArray(manifest.posts)) {
    throw new Error('Manifest schema or deployment ID mismatch.');
  }
  return {
    schemaVersion: 1,
    deploymentId,
    generatedAt: String(manifest.generatedAt),
    categories: manifest.categories.map((item) => ({
      id: String(item.id), name: String(item.name), slug: String(item.slug),
      parentId: item.parentId == null ? null : String(item.parentId), position: Number(item.position),
    })),
    posts: manifest.posts.map((item) => ({
      id: String(item.id), slug: String(item.slug), title: String(item.title), summary: String(item.summary ?? ''),
      categoryId: item.categoryId == null ? null : String(item.categoryId), tags: Array.isArray(item.tags) ? item.tags.map(safeTag) : [],
      document: cleanDocument(item.document), publishedAt: String(item.publishedAt), updatedAt: item.updatedAt == null ? null : String(item.updatedAt),
      commentsEnabled: Boolean(item.commentsEnabled), commentsVisible: Boolean(item.commentsVisible),
      pinned: Boolean(item.pinned), position: Number.isFinite(Number(item.position)) ? Number(item.position) : 0,
      sourceUrl: item.sourceUrl == null ? null : safeUrl(item.sourceUrl),
    })),
    slugAliases: (manifest.slugAliases ?? []).map((item) => ({
      slug: String(item.slug), postId: String(item.postId), targetSlug: String(item.targetSlug),
    })),
    about: manifest.about == null ? null : cleanDocument(manifest.about),
  };
}
