import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminCategory, DraftRecord, EditableDraft } from '../../lib/admin/types';
import { EMPTY_DOCUMENT } from '../../lib/admin/types';
import { loadDraft, loadPostSettings, publishDraft, saveDraft, updatePostSettings } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';
import { useAutosave } from '../../lib/admin/useAutosave';
import { BlockEditor } from './BlockEditor';
import { SaveStatus } from './SaveStatus';

export function EditorWorkspace({ client, postId, categories, onClose, onRestoredPublication }: {
  client: SupabaseClient; postId: string; categories: AdminCategory[]; onClose:()=>void;onRestoredPublication?:(postId:string)=>void;
}) {
  const [draft, setDraft] = useState<EditableDraft | null>(null);
  const [dirtyToken, setDirtyToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishState, setPublishState] = useState<'idle'|'publishing'|'requested'|'failed'>('idle');
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<{slug:string;comments_enabled:boolean;comments_visible:boolean;status:string}|null>(null);
  const [recovery, setRecovery] = useState<{savedAt:string;draft:EditableDraft}|null>(null);
  const [history,setHistory]=useState<Array<{id:string;version:number;reason:string;created_at:string}>>([]);const [historyOpen,setHistoryOpen]=useState(false);
  const[publications,setPublications]=useState<Array<{id:string;draft_version:number;title:string;published_at:string}>>([]);
  const recoveryKey = 'dorami-recovery:' + postId;

  useEffect(() => {
    let active = true; setLoading(true); setLoadError(null);
    Promise.all([loadDraft(client, postId),loadPostSettings(client,postId)]).then(([value,post])=>{ if(active){ setDraft(value); setSettings(post); try { const cached=JSON.parse(localStorage.getItem(recoveryKey)??'null'); if(cached?.savedAt && new Date(cached.savedAt)>new Date(value.updated_at)) setRecovery(cached); } catch { localStorage.removeItem(recoveryKey); } setLoading(false); } })
      .catch((error)=>{ if(active){ setLoadError(messageFromError(error)); setLoading(false); } });
    return ()=>{ active=false; };
  }, [client, postId, recoveryKey]);

  const persist = useCallback(async (value: EditableDraft)=>{
    if (settings) await updatePostSettings(client,postId,{slug:settings.slug,comments_enabled:settings.comments_enabled,comments_visible:settings.comments_visible});
    return saveDraft(client, value);
  }, [client,postId,settings]);
  const onSaved = useCallback((stored: DraftRecord)=>{
    setDraft((current)=>{ if(!current)return stored; const unchanged=JSON.stringify({...current,version:stored.version,updated_at:stored.updated_at})===JSON.stringify(stored); if(unchanged){localStorage.removeItem(recoveryKey);setRecovery(null);} return { ...current, version: stored.version, updated_at: stored.updated_at }; });
  }, [recoveryKey]);
  const autosave = useAutosave({ draft, dirtyToken, enabled:Boolean(draft), save:persist, onSaved });

  const update = useCallback((patch: Partial<EditableDraft>)=>{
    setDraft((current)=>{ if(!current)return current; const next={...current,...patch}; try{localStorage.setItem(recoveryKey,JSON.stringify({savedAt:new Date().toISOString(),draft:next}));}catch{/* Recovery storage is optional; server save remains canonical. */} return next; });
    setDirtyToken((value)=>value+1);
  }, [recoveryKey]);
  const updateSettings = useCallback((patch: Partial<NonNullable<typeof settings>>)=>{
    setSettings((current)=>current?{...current,...patch}:current);
    setDirtyToken((value)=>value+1);
  }, []);
  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있습니다.');
    if (file.size > 20 * 1024 * 1024) throw new Error('이미지는 20MB 이하여야 합니다.');
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('로그인이 만료되었습니다.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = user.id + '/editor/' + crypto.randomUUID() + '-' + safeName;
    const uploaded = await client.storage.from('draft-media').upload(path, file, { contentType: file.type });
    if (uploaded.error) throw uploaded.error;
    const row = await client.from('media_assets').insert({ bucket_id:'draft-media', object_path:path, visibility:'private', mime_type:file.type, byte_size:file.size, alt_text:file.name }).select('id').single();
    if (row.error) throw row.error;
    const signed = await client.storage.from('draft-media').createSignedUrl(path, 3600);
    if (signed.error) throw signed.error;
    return { mediaId: String(row.data.id), src: signed.data.signedUrl };
  }, [client]);
  const importRemoteImage=useCallback(async(url:string)=>{const result=await client.functions.invoke('import-remote-image',{body:{url}});if(result.error)throw result.error;if(!result.data?.media?.id||!result.data?.signedUrl)throw new Error('가져온 이미지 정보를 받지 못했습니다.');return{mediaId:String(result.data.media.id),src:String(result.data.signedUrl)};},[client]);

  async function requestPublish() {
    if (!draft) return;
    if (!settings || settings.slug.startsWith('draft-')) {
      setPublishState('failed'); setPublishMessage('공개 주소를 먼저 정해 주세요.'); setPublishConfirm(false); return;
    }
    if (JSON.stringify(draft.document).includes('import-asset:')) {
      setPublishState('failed'); setPublishMessage('가져온 이미지의 공개 준비가 끝나지 않았습니다. 미디어를 확인하거나 교체한 뒤 발행해 주세요.'); setPublishConfirm(false); return;
    }
    setPublishState('publishing'); setPublishMessage(null);
    const saved = await autosave.saveNow();
    if (!saved && autosave.state !== 'saved' && autosave.state !== 'clean') {
      setPublishState('failed'); setPublishMessage('초안 저장이 확인되지 않아 발행하지 않았습니다.'); return;
    }
    try {
      await updatePostSettings(client,postId,{slug:settings.slug,comments_enabled:settings.comments_enabled,comments_visible:settings.comments_visible});
      const latest = await loadDraft(client, postId);
      const result = await publishDraft(client, postId, latest.version);
      const deployment = result.deploymentId ?? result.deployment_id;
      setPublishState('requested');
      setPublishMessage(deployment ? '발행 요청을 접수했습니다. 배포 상태에서 공개 반영 완료를 확인해 주세요.' : '공개본을 만들었습니다. 배포 상태 확인이 필요합니다.');
      setPublishConfirm(false);
    } catch(error) {
      setPublishState('failed'); setPublishMessage(messageFromError(error));
    }
  }
  async function openHistory(){const[result,published]=await Promise.all([client.from('draft_versions').select('id,version,reason,created_at').eq('post_id',postId).order('version',{ascending:false}).limit(50),client.from('publications').select('id,draft_version,title,published_at').eq('post_id',postId).order('published_at',{ascending:false}).limit(50)]);if(result.error||published.error){setLoadError(result.error?.message??published.error?.message??'이력 조회 실패');return;}setHistory(result.data??[]);setPublications(published.data??[]);setHistoryOpen(true);}
  async function restoreVersion(version:number){if(!window.confirm('이 버전을 새 비공개 수정본으로 복원할까요? 공개본은 바뀌지 않습니다.'))return;const result=await client.rpc('restore_draft_version',{p_post_id:postId,p_version:version});if(result.error){setLoadError(result.error.message);return;}const restored=Array.isArray(result.data)?result.data[0]:result.data;setDraft(restored);setHistoryOpen(false);}
  async function restorePublication(publicationId:string){if(!window.confirm('이 공개본을 별도 비공개 초안으로 복원할까요? 현재 공개 글은 바뀌지 않습니다.'))return;const result=await client.functions.invoke('restore-publication',{body:{publicationId,mode:'new'}});if(result.error){setLoadError(result.error.message);return;}if(!result.data?.postId){setLoadError('복원된 초안 ID를 받지 못했습니다.');return;}setHistoryOpen(false);onRestoredPublication?.(String(result.data.postId));}

  if (loading) return <div className="panel-state">초안을 안전하게 불러오는 중…</div>;
  if (loadError) return <div className="panel-state panel-state--error"><p>{loadError}</p><button className="button" onClick={onClose}>글 목록으로</button></div>;
  if (!draft) return null;

  return (
    <div className="workspace">
      <header className="workspace-topbar">
        <button type="button" className="text-button" onClick={onClose}>← 글 목록</button>
        <span className="draft-label">비공개 초안</span>
        <div className="workspace-topbar__actions">
          <SaveStatus state={autosave.state} />
          <button type="button" className="button" onClick={()=>void autosave.saveNow()}>저장</button>
          <button type="button" className="button" onClick={()=>void openHistory()}>이력</button>
          <button type="button" className="button" onClick={()=>setPreview(true)}>미리 보기</button>
          <button type="button" className="button button--primary" onClick={()=>setPublishConfirm(true)}>발행</button>
        </div>
      </header>
      {(autosave.message || publishMessage) && (
        <div className={autosave.state==='conflict'||autosave.state==='failed'||publishState==='failed'?'workspace-notice is-error':'workspace-notice'} role="status">
          {autosave.message ?? publishMessage}
        </div>
      )}
      {recovery && <div className="recovery-banner" role="alert"><span>서버본보다 새로운 기기 복구본이 있습니다. {new Date(recovery.savedAt).toLocaleString('ko-KR')}</span><button onClick={()=>{setDraft(recovery.draft);setDirtyToken((value)=>value+1);setRecovery(null);}}>복구본 사용</button><button onClick={()=>{localStorage.removeItem(recoveryKey);setRecovery(null);}}>서버본 유지</button></div>}
      <div className="editor-canvas">
        <div className="breadcrumbs">글 <span>/</span> {draft.title || '제목 없음'}</div>
        <input className="document-title" aria-label="글 제목" value={draft.title} placeholder="제목 없음" onChange={(event)=>update({title:event.target.value})} />
        <div className="document-properties">
          <label><span>공개 주소</span><input value={settings?.slug.startsWith('draft-')?'':settings?.slug??''} placeholder="영문-주소" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event)=>updateSettings({slug:event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})} /></label>
          <label><span>카테고리</span><select value={draft.category_id ?? ''} onChange={(event)=>update({category_id:event.target.value||null})}><option value="">미분류</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label><span>태그</span><input value={draft.tags.join(', ')} placeholder="쉼표로 구분" onChange={(event)=>update({tags:event.target.value.split(',').map((tag)=>tag.trim()).filter(Boolean)})} /></label>
          <label className="property-wide"><span>요약</span><input value={draft.summary} placeholder="목록에 표시할 한 줄 요약" onChange={(event)=>update({summary:event.target.value})} /></label>
          <label className="property-check"><input type="checkbox" checked={settings?.comments_enabled??true} onChange={(event)=>updateSettings({comments_enabled:event.target.checked})}/><span>댓글 작성 허용</span></label>
          <label className="property-check"><input type="checkbox" checked={settings?.comments_visible??true} onChange={(event)=>updateSettings({comments_visible:event.target.checked})}/><span>기존 댓글 표시</span></label>
        </div>
        <BlockEditor document={draft.document ?? EMPTY_DOCUMENT} onChange={(document)=>update({document})} onUploadImage={uploadImage} onImportRemoteImage={importRemoteImage} />
      </div>
      <footer className="workspace-footer"><span>초안은 운영자에게만 보입니다.</span><span>{draft.updated_at ? '마지막 서버 저장 '+new Date(draft.updated_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}) : '아직 서버에 저장되지 않음'}</span></footer>
      {preview && <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setPreview(false);}}><section className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header><div><p>비공개 미리 보기</p><h2 id="preview-title">{draft.title || '제목 없음'}</h2></div><button type="button" className="button" onClick={()=>setPreview(false)}>닫기</button></header><p className="preview-summary">{draft.summary}</p><BlockEditor document={draft.document ?? EMPTY_DOCUMENT} onChange={()=>{}} readOnly /><p className="preview-warning">미리 보기에서는 실제 댓글 작성이나 방문 통계를 연결하지 않습니다.</p></section></div>}
      {publishConfirm && <div className="modal-backdrop"><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><p className="admin-eyebrow">공개 반영 확인</p><h2 id="publish-title">저장된 초안을 발행할까요?</h2><dl><div><dt>제목</dt><dd>{draft.title || '제목 없음'}</dd></div><div><dt>주소</dt><dd>/{settings?.slug.startsWith('draft-')?'주소 미설정':settings?.slug}</dd></div><div><dt>분류</dt><dd>{categories.find((category)=>category.id===draft.category_id)?.name ?? '미분류'}</dd></div></dl><p>발행하면 별도의 공개본과 배포 요청이 생성됩니다. 이후 초안을 저장해도 다시 발행하기 전까지 기존 공개본은 바뀌지 않습니다.</p><div className="modal-actions"><button type="button" className="button" onClick={()=>setPublishConfirm(false)}>취소</button><button type="button" className="button button--primary" disabled={publishState==='publishing'} onClick={()=>void requestPublish()}>{publishState==='publishing'?'발행 요청 중…':'저장 후 발행'}</button></div></section></div>}
      {historyOpen&&<div className="modal-backdrop"><section className="preview-modal version-modal"><header><h2>글 변경 이력</h2><button className="button" onClick={()=>setHistoryOpen(false)}>닫기</button></header><div className="version-list"><h3>비공개 초안 버전</h3>{history.map((item)=><div key={item.id}><span>버전 {item.version} · {item.reason}</span><time>{new Date(item.created_at).toLocaleString('ko-KR')}</time><button onClick={()=>void restoreVersion(item.version)}>비공개 수정본으로 복원</button></div>)}</div><div className="version-list"><h3>불변 공개본</h3>{publications.length===0?<p>발행 이력이 없습니다.</p>:publications.map((item)=><div key={item.id}><span>{item.title} · 초안 버전 {item.draft_version}</span><time>{new Date(item.published_at).toLocaleString('ko-KR')}</time><button onClick={()=>void restorePublication(item.id)}>새 비공개 초안으로 복원</button></div>)}</div><p className="preview-warning">복원은 별도 비공개 초안을 만들며 자동 발행하지 않습니다. 현재 공개본은 삭제·변경하지 않습니다.</p></section></div>}
    </div>
  );
}
