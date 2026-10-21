import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminCategory,
  AdminPost,
  AnalyticsSummary,
  CommentRecord,
  DraftRecord,
  EditableDraft,
} from './types';
import { AuthorizationError, VersionConflictError } from './errors';

function throwIfError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === '40001' || /version|stale|conflict/i.test(error.message)) {
    throw new VersionConflictError(
      '다른 탭이나 기기에서 이 글을 먼저 저장했습니다. 서버본을 확인한 뒤 다시 저장해 주세요.',
    );
  }
  throw new Error(error.message);
}

export async function verifyOwner(client: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  throwIfError(authError);
  if (!user) return false;
  const { data, error } = await client.rpc('is_owner');
  if (error) {
    if (error.code === '42501' || error.code === 'PGRST116') return false;
    throwIfError(error);
  }
  return data === true;
}

export async function loadPostSettings(client: SupabaseClient, postId: string) {
  const { data, error } = await client.from('posts')
    .select('id,slug,status,comments_enabled,comments_visible,current_publication_id')
    .eq('id', postId).single();
  throwIfError(error);
  return data as { id:string; slug:string; status:string; comments_enabled:boolean; comments_visible:boolean; current_publication_id:string|null };
}

export async function updatePostSettings(client: SupabaseClient, postId: string, values: { slug:string; comments_enabled:boolean; comments_visible:boolean }) {
  const { error } = await client.from('posts').update(values).eq('id', postId);
  throwIfError(error);
}

export async function listCategories(client: SupabaseClient): Promise<AdminCategory[]> {
  const { data, error } = await client
    .from('categories')
    .select('id,name,slug,parent_id,position')
    .order('position');
  throwIfError(error);
  return (data ?? []) as AdminCategory[];
}

export async function listPosts(client: SupabaseClient, trash = false): Promise<AdminPost[]> {
  let query = client
    .from('posts')
    .select(
      'id,slug,status,current_publication_id,comments_enabled,comments_visible,pinned,position,deleted_at,drafts(post_id,title,summary,category_id,tags,document,cover_media_id,original_created_at,source_url,version,updated_at)',
    )
    .order('pinned', { ascending: false })
    .order('position');
  query = trash ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as unknown as AdminPost[];
}

export async function createDraft(
  client: SupabaseClient,
  title = '제목 없음',
  categoryId: string | null = null,
): Promise<string> {
  const { data, error } = await client.rpc('create_draft_post', {
    p_title: title,
    p_category_id: categoryId,
  });
  throwIfError(error);
  if (!data) throw new Error('새 글 ID를 받지 못했습니다.');
  return String(data);
}

export async function loadDraft(client: SupabaseClient, postId: string): Promise<DraftRecord> {
  const { data, error } = await client
    .from('drafts')
    .select(
      'post_id,title,summary,category_id,tags,document,cover_media_id,original_created_at,source_url,version,updated_at',
    )
    .eq('post_id', postId)
    .single();
  throwIfError(error);
  if (!data) throw new Error('초안을 찾을 수 없습니다.');
  const draft=data as DraftRecord;
  const ids=new Set<string>();
  const collect=(value:unknown)=>{if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object'){const record=value as Record<string,unknown>;if(typeof record.mediaId==='string')ids.add(record.mediaId);Object.values(record).forEach(collect);}};collect(draft.document);
  if(!ids.size)return draft;
  const media=await client.from('media_assets').select('id,object_path').in('id',[...ids]).eq('bucket_id','draft-media');
  throwIfError(media.error);
  const paths=(media.data??[]).map((row)=>row.object_path as string);const signed=paths.length?await client.storage.from('draft-media').createSignedUrls(paths,3600):{data:[],error:null};
  throwIfError(signed.error);
  const urls=new Map<string,string>();(media.data??[]).forEach((row,index)=>{const url=signed.data?.[index]?.signedUrl;if(url)urls.set(String(row.id),url);});
  const replace=(value:unknown):unknown=>{if(Array.isArray(value))return value.map(replace);if(value&&typeof value==='object'){const record={...(value as Record<string,unknown>)};if(typeof record.mediaId==='string'&&urls.has(record.mediaId))record.src=urls.get(record.mediaId);for(const[key,item]of Object.entries(record))record[key]=replace(item);return record;}return value;};
  return {...draft,document:replace(draft.document) as DraftRecord['document']};
}

export async function saveDraft(
  client: SupabaseClient,
  draft: EditableDraft,
): Promise<DraftRecord> {
  const { data, error } = await client.rpc('save_draft', {
    p_post_id: draft.post_id,
    p_expected_version: draft.version,
    p_title: draft.title,
    p_summary: draft.summary,
    p_category_id: draft.category_id,
    p_tags: draft.tags,
    p_document: draft.document,
    p_cover_media_id: draft.cover_media_id,
    p_original_created_at: draft.original_created_at,
    p_source_url: draft.source_url,
  });
  throwIfError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('저장된 초안 버전을 받지 못했습니다.');
  return row as DraftRecord;
}

export async function publishDraft(client: SupabaseClient, postId: string, version: number) {
  const { data, error } = await client.functions.invoke('publish-dispatch', {
    body: { postId, expectedVersion: version },
  });
  throwIfError(error);
  if (!data?.publicationId && !data?.publication_id) {
    throw new Error('발행 요청 결과를 확인할 수 없습니다.');
  }
  return data as {
    publicationId?: string;
    publication_id?: string;
    deploymentId?: string;
    deployment_id?: string;
  };
}

export async function unpublishPost(client: SupabaseClient, postId: string): Promise<string> {
  const { data, error } = await client.functions.invoke('publish-dispatch', {
    body: { postId, action: 'unpublish' },
  });
  throwIfError(error);
  const deploymentId = data?.deployment_id ?? data?.deploymentId;
  if (!deploymentId) throw new Error('공개 해제 배포 ID를 받지 못했습니다.');
  return String(deploymentId);
}

export async function listComments(client: SupabaseClient): Promise<CommentRecord[]> {
  const { data, error } = await client
    .from('comments')
    .select('id,post_id,parent_id,nickname,body,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (data ?? []) as CommentRecord[];
}

export async function setCommentStatus(
  client: SupabaseClient,
  id: string,
  status: CommentRecord['status'],
) {
  const { error } = await client.from('comments').update({ status }).eq('id', id);
  throwIfError(error);
}

export async function purgeComment(client: SupabaseClient, id: string) {
  const { error } = await client.from('comments').delete().eq('id', id);
  throwIfError(error);
}

export async function loadAnalytics(
  client: SupabaseClient,
  from: string,
  to: string,
): Promise<AnalyticsSummary> {
  const { data, error } = await client.rpc('analytics_summary', {
    p_from: from,
    p_to: to,
  });
  throwIfError(error);
  const value = data as Record<string, unknown> | null;
  return {
    timezone: String(value?.timezone ?? 'Asia/Seoul'),
    from,
    to,
    totalPageViews: Number(value?.total ?? value?.totalPageViews ?? value?.total_page_views ?? 0),
    daily: Array.isArray(value?.daily) ? value.daily.map((row: any) => ({ date: String(row.day ?? row.date), pageViews: Number(row.views ?? row.pageViews ?? 0) })) : [],
    posts: Array.isArray(value?.posts) ? value.posts.map((row: any) => ({ postId: String(row.postId ?? row.post_id), title: String(row.title ?? ''), pageViews: Number(row.views ?? row.pageViews ?? 0) })) : [],
  };
}

export async function downloadBackup(client: SupabaseClient): Promise<Blob> {
  const { data, error } = await client.functions.invoke('admin-backup', { method: 'GET' });
  throwIfError(error);
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export async function restoreBackup(client: SupabaseClient, backup: unknown) {
  const { data, error } = await client.functions.invoke('admin-backup', {
    method: 'POST',
    body: { backup } as Record<string, unknown>,
  });
  throwIfError(error);
  return data;
}

export async function requireOwner(client: SupabaseClient) {
  if (!(await verifyOwner(client))) {
    throw new AuthorizationError('이 계정에는 Dorami 운영자 권한이 없습니다.');
  }
}
