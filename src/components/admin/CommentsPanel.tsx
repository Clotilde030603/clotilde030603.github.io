import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommentRecord } from '../../lib/admin/types';
import { listComments, purgeComment, setCommentStatus } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';

const statusLabels: Record<CommentRecord['status'], string> = {
  pending: '검토 대기', published: '공개', spam: '스팸', deleted: '삭제됨',
};

export function CommentsPanel({ client }: { client: SupabaseClient }) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function refresh() { setLoading(true); setError(null); try { setComments(await listComments(client)); } catch (error) { setError(messageFromError(error)); } finally { setLoading(false); } }
  useEffect(() => { void refresh(); }, [client]);
  async function change(id: string, status: CommentRecord['status']) { try { await setCommentStatus(client, id, status); await refresh(); } catch (error) { setError(messageFromError(error)); } }
  async function purge(id: string) { if (!window.confirm('이 댓글을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return; try { await purgeComment(client, id); await refresh(); } catch (error) { setError(messageFromError(error)); } }
  return <section className="admin-panel">
    <header className="panel-header"><div><p className="admin-eyebrow">운영</p><h1>댓글 관리</h1></div><button className="button" onClick={() => void refresh()}>새로고침</button></header>
    <p className="panel-description">댓글은 공개 중인 글에서만 방문자에게 표시됩니다. 삭제와 스팸 처리는 서버 권한 검사 후 반영됩니다.</p>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {loading ? <div className="panel-state">댓글을 불러오는 중…</div> : comments.length === 0 ? <div className="empty-state"><h2>검토할 댓글이 없습니다</h2><p>실제 댓글이 작성되면 이곳에 나타납니다.</p></div> : <div className="comment-list">{comments.map((comment) => <article key={comment.id} className="comment-row"><header><strong>{comment.nickname}</strong><span>{statusLabels[comment.status]}</span><time>{new Date(comment.created_at).toLocaleString('ko-KR')}</time></header><p>{comment.body}</p><footer><button onClick={() => void change(comment.id, 'published')}>승인</button><button onClick={() => void change(comment.id, 'spam')}>스팸</button><button onClick={() => void change(comment.id, 'deleted')}>숨기기</button><button className="danger-text" onClick={() => void purge(comment.id)}>영구 삭제</button></footer></article>)}</div>}
  </section>;
}
