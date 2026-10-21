import { useCallback, useEffect, useState } from 'react';
import type { AdminCategory, AdminPost, AdminSection } from '../../lib/admin/types';
import { createDraft, listCategories, listPosts, loadDraft, saveDraft, unpublishPost } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';
import { useOwnerSession } from '../../lib/admin/useOwnerSession';
import { reorderWithinGroup } from '../../lib/admin/reorder';
import { AdminShell } from './AdminShell';
import { AboutPanel } from './AboutPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { BackupPanel } from './BackupPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { CommentsPanel } from './CommentsPanel';
import { EditorWorkspace } from './EditorWorkspace';
import { DeploymentsPanel } from './DeploymentsPanel';
import { ImportPanel } from './ImportPanel';
import { LoginForm } from './LoginForm';
import { MediaPanel } from './MediaPanel';
import { PostsPanel } from './PostsPanel';
import { SetupRequired } from './SetupRequired';
import { TemplatesPanel } from './TemplatesPanel';
import { TrashPanel } from './TrashPanel';

export function AdminApp({ initialSection = 'posts', initialPostId = null }: { initialSection?: AdminSection; initialPostId?: string | null }) {
  const owner = useOwnerSession();
  const requestedPost = initialPostId ?? (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('post'));
  const [section, setSection] = useState<AdminSection>(requestedPost ? 'editor' : initialSection);
  const [postId, setPostId] = useState<string | null>(requestedPost);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCategories = useCallback(async () => {
    if (!owner.client || !owner.isOwner) return;
    setCategories(await listCategories(owner.client));
  }, [owner.client, owner.isOwner]);
  const refreshPosts = useCallback(async () => {
    if (!owner.client || !owner.isOwner) return;
    setLoading(true); setError(null);
    try { setPosts(await listPosts(owner.client)); }
    catch (error) { setError(messageFromError(error)); }
    finally { setLoading(false); }
  }, [owner.client, owner.isOwner]);

  useEffect(() => {
    if (!owner.isOwner) return;
    void refreshCategories().catch((error) => setError(messageFromError(error)));
    void refreshPosts();
  }, [owner.isOwner, refreshCategories, refreshPosts]);

  function navigate(next: AdminSection) {
    setSection(next); setPostId(null);
    window.history.replaceState(null, '', next === 'posts' ? '/admin/' : '/admin/' + next + '/');
  }
  function openEditor(id: string) {
    setPostId(id); setSection('editor');
    window.history.replaceState(null, '', '/admin/?post=' + encodeURIComponent(id));
  }
  async function newPost() {
    if (!owner.client) return;
    setError(null);
    try { openEditor(await createDraft(owner.client)); }
    catch (error) { setError(messageFromError(error)); }
  }
  async function postAction(action:'unpublish'|'trash'|'duplicate'|'pin'|'up'|'down',post:AdminPost){
    if(!owner.client)return;setError(null);
    try{
      if(action==='unpublish'){if(!window.confirm('공개를 해제할까요? 새 Pages 배포가 완료될 때까지 기존 정적 페이지가 잠시 남을 수 있습니다.'))return;await unpublishPost(owner.client,post.id);navigate('deployments');return;}
      if(action==='trash'){if(!window.confirm('글을 휴지통으로 옮길까요? 공개 글이면 먼저 공개 해제가 필요합니다.'))return;if(post.status==='published')throw new Error('공개 글은 먼저 공개 해제해 주세요.');const result=await owner.client.from('posts').update({status:'trashed',deleted_at:new Date().toISOString()}).eq('id',post.id);if(result.error)throw result.error;}
      if(action==='pin'){const result=await owner.client.from('posts').update({pinned:!post.pinned}).eq('id',post.id);if(result.error)throw result.error;}
      if(action==='duplicate'){const source=await loadDraft(owner.client,post.id);const id=await createDraft(owner.client,source.title+' 복사본',source.category_id);const target=await loadDraft(owner.client,id);await saveDraft(owner.client,{...target,title:source.title+' 복사본',summary:source.summary,category_id:source.category_id,tags:source.tags,document:source.document,source_url:source.source_url,original_created_at:source.original_created_at,version:target.version});openEditor(id);return;}
      if(action==='up'||action==='down'){const selectedDraft=Array.isArray(post.drafts)?post.drafts[0]:post.drafts;const categoryId=selectedDraft?.category_id??null;const ordered=posts.filter((item)=>{const d=Array.isArray(item.drafts)?item.drafts[0]:item.drafts;return(d?.category_id??null)===categoryId;}).sort((a,b)=>a.position-b.position);const index=ordered.findIndex((item)=>item.id===post.id);const targetIndex=index+(action==='up'?-1:1);if(targetIndex<0||targetIndex>=ordered.length)return;[ordered[index],ordered[targetIndex]]=[ordered[targetIndex],ordered[index]];const result=await owner.client.rpc('reorder_posts',{p_category_id:categoryId,p_post_ids:ordered.map((item)=>item.id)});if(result.error)throw result.error;}
      await refreshPosts();
    }catch(error){setError(messageFromError(error));}
  }
  async function dragReorderPosts(sourceId:string,targetId:string){if(!owner.client)return;const order=reorderWithinGroup(posts,sourceId,targetId,(post)=>{const draft=Array.isArray(post.drafts)?post.drafts[0]:post.drafts;return draft?.category_id??null;});if(!order){setError('같은 카테고리 안에서만 글 순서를 바꿀 수 있습니다.');return;}const target=posts.find((post)=>post.id===targetId);const draft=target&&(Array.isArray(target.drafts)?target.drafts[0]:target.drafts);const result=await owner.client.rpc('reorder_posts',{p_category_id:draft?.category_id??null,p_post_ids:order});if(result.error)setError(result.error.message);else await refreshPosts();}

  if (!owner.configured) return <SetupRequired />;
  if (owner.loading) return <main className="admin-gate"><div className="loading-mark"><img src="/rabbit-mark.svg" alt="" /><span>운영자 세션 확인 중…</span></div></main>;
  if (!owner.session || !owner.isOwner) return <LoginForm client={owner.client!} authorizationError={owner.error} />;

  let content;
  if (section === 'editor' && postId) content = <EditorWorkspace client={owner.client!} postId={postId} categories={categories} onClose={() => { navigate('posts'); void refreshPosts(); }} onRestoredPublication={openEditor} />;
  else if (section === 'posts') content = <PostsPanel posts={posts} loading={loading} error={error} onOpen={openEditor} onCreate={() => void newPost()} onAction={(action,post)=>void postAction(action,post)} onReorder={(source,target)=>void dragReorderPosts(source,target)} />;
  else if (section === 'about') content = <AboutPanel client={owner.client!} onDeployment={()=>navigate('deployments')} />;
  else if (section === 'categories') content = <CategoriesPanel client={owner.client!} categories={categories} onRefresh={refreshCategories} />;
  else if (section === 'comments') content = <CommentsPanel client={owner.client!} />;
  else if (section === 'analytics') content = <AnalyticsPanel client={owner.client!} />;
  else if (section === 'deployments') content = <DeploymentsPanel client={owner.client!} />;
  else if (section === 'backup') content = <BackupPanel client={owner.client!} />;
  else if (section === 'import') content = <ImportPanel client={owner.client!} onImported={openEditor} />;
  else if (section === 'media') content = <MediaPanel client={owner.client!} />;
  else if (section === 'templates') content = <TemplatesPanel client={owner.client!} onCreated={openEditor} />;
  else content = <TrashPanel client={owner.client!} onOpen={openEditor} />;

  return <AdminShell section={section} user={owner.user!} categories={categories} onNavigate={navigate} onNewPost={() => void newPost()} onSignOut={() => void owner.client!.auth.signOut()}>{content}</AdminShell>;
}
