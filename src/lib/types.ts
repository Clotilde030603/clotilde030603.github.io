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
  tags: string[];
  document: DoramiDocument;
  publishedAt: string;
  updatedAt: string | null;
  commentsEnabled: boolean;
  commentsVisible: boolean;
  pinned?: boolean;
  position?: number;
  sourceUrl?: string | null;
};

export type PublicSnapshot = {
  schemaVersion: 1;
  deploymentId: string | null;
  generatedAt: string | null;
  categories: Category[];
  posts: PublishedPost[];
  slugAliases: Array<{ slug: string; postId: string; targetSlug: string }>;
  about: DoramiDocument | null;
};
