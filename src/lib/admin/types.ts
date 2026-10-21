import type { DoramiDocument } from '../types';

export type SaveState =
  | 'clean'
  | 'changed'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'failed'
  | 'conflict';

export type AdminSection =
  | 'posts'
  | 'about'
  | 'editor'
  | 'categories'
  | 'media'
  | 'templates'
  | 'comments'
  | 'analytics'
  | 'deployments'
  | 'import'
  | 'backup'
  | 'trash';

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number;
};

export type PostStatus = 'draft' | 'published' | 'editing' | 'unpublished' | 'trashed';

export type AdminPost = {
  id: string;
  slug: string;
  status: PostStatus;
  current_publication_id: string | null;
  comments_enabled: boolean;
  comments_visible: boolean;
  pinned: boolean;
  position: number;
  deleted_at: string | null;
  drafts: DraftRecord | DraftRecord[] | null;
};

export type DraftRecord = {
  post_id: string;
  title: string;
  summary: string;
  category_id: string | null;
  tags: string[];
  document: DoramiDocument;
  cover_media_id: string | null;
  original_created_at: string | null;
  source_url: string | null;
  version: number;
  updated_at: string;
};

export type EditableDraft = Omit<DraftRecord, 'updated_at'> & { updated_at?: string };

export type CommentRecord = {
  id: string;
  post_id: string;
  parent_id: string | null;
  nickname: string;
  body: string;
  status: 'pending' | 'published' | 'spam' | 'deleted';
  created_at: string;
};

export type AnalyticsSummary = {
  timezone: string;
  from: string;
  to: string;
  totalPageViews: number;
  daily: Array<{ date: string; pageViews: number }>;
  posts: Array<{ postId: string; title: string; pageViews: number }>;
};

export type AdminConfig = {
  url: string;
  publishableKey: string;
};

export const EMPTY_DOCUMENT: DoramiDocument = {
  schemaVersion: 1,
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
};
