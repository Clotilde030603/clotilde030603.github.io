export type JsonNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

export type DoramiDocument = {
  schemaVersion: 1;
  content: JsonNode;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
};

export type PublishedPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryPath: Category[];
  categoryOrder: string;
  tags: string[];
  document: DoramiDocument;
  publishedAt: string;
  updatedAt: string | null;
  pinned: boolean;
  position: number;
  sourceUrl: string | null;
};
