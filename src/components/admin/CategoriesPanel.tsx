import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminCategory } from '../../lib/admin/types';
import { messageFromError } from '../../lib/admin/errors';
import { reorderWithinGroup } from '../../lib/admin/reorder';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');
}

export function CategoriesPanel({ client, categories, onRefresh }: { client: SupabaseClient; categories: AdminCategory[]; onRefresh: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting,setDeleting]=useState<AdminCategory|null>(null);const [moveTo,setMoveTo]=useState('');const [notice,setNotice]=useState<string|null>(null);
  const[dragging,setDragging]=useState<string|null>(null);
  async function create() {
    setBusy(true); setError(null);
    try {
      const normalized = slugify(slug || name);
      if (!normalized) throw new Error('영문 주소를 입력해 주세요.');
      const { error } = await client.from('categories').insert({ name: name.trim(), slug: normalized, parent_id: parentId || null, position: categories.length });
      if (error) throw error;
      setName(''); setSlug(''); setParentId(''); await onRefresh();
    } catch (error) { setError(messageFromError(error)); }
    finally { setBusy(false); }
  }
  async function rename(category: AdminCategory) {
    const next = window.prompt('새 카테고리 이름', category.name)?.trim();
    if (!next || next === category.name) return;
    const { error } = await client.from('categories').update({ name: next }).eq('id', category.id);
    if (error) setError(error.message); else await onRefresh();
  }
  async function move(category: AdminCategory, direction: -1 | 1) {
    const siblings = categories.filter((item) => item.parent_id === category.parent_id).sort((a,b) => a.position-b.position);
    const index = siblings.findIndex((item) => item.id === category.id);
    const target = siblings[index + direction];
    if (!target) return;
    [siblings[index],siblings[index+direction]]=[siblings[index+direction],siblings[index]];
    const result=await client.rpc('reorder_categories',{p_parent_id:category.parent_id,p_category_ids:siblings.map((item)=>item.id)});
    if (result.error) setError(result.error.message);
    else await onRefresh();
  }
  async function remove(){if(!deleting)return;if(!window.confirm('카테고리를 삭제하고 소속 글과 하위 분류를 선택한 대상으로 이동할까요?'))return;setBusy(true);setError(null);try{const {data,error}=await client.rpc('delete_category',{p_category_id:deleting.id,p_move_to_id:moveTo||null});if(error)throw error;const result=(Array.isArray(data)?data[0]:data)??{};setNotice('초안 '+Number(result.movedDrafts??result.moved_drafts??0)+'개와 하위 분류 '+Number(result.movedChildren??result.moved_children??0)+'개를 이동했습니다.'+(result.requiresPublicationRefresh||result.requires_publication_refresh?' 공개본 분류 반영을 위한 Pages 갱신이 필요합니다.':''));setDeleting(null);setMoveTo('');await onRefresh();}catch(error){setError(messageFromError(error));}finally{setBusy(false);}}
  async function dragReorder(sourceId:string,targetId:string){const order=reorderWithinGroup(categories,sourceId,targetId,(item)=>item.parent_id);if(!order){setError('같은 상위 분류 안에서만 드래그로 순서를 바꿀 수 있습니다.');return;}const target=categories.find((item)=>item.id===targetId);const result=await client.rpc('reorder_categories',{p_parent_id:target?.parent_id??null,p_category_ids:order});if(result.error)setError(result.error.message);else{setError(null);await onRefresh();}}
  async function moveParent(category:AdminCategory,newParentId:string){setBusy(true);setError(null);try{const result=await client.rpc('move_category',{p_category_id:category.id,p_new_parent_id:newParentId||null});if(result.error){if(result.error.code==='23514')throw new Error('자기 하위 분류로 이동할 수 없거나 계층 깊이 제한을 넘었습니다.');if(result.error.code==='P0002')throw new Error('이동할 카테고리 또는 상위 분류를 찾을 수 없습니다.');if(result.error.code==='22023')throw new Error('같은 카테고리를 상위 분류로 지정할 수 없습니다.');throw result.error;}setNotice('“'+category.name+'”의 상위 분류를 변경했습니다.');await onRefresh();}catch(error){setError(messageFromError(error));}finally{setBusy(false);}}
  return <section className="admin-panel"><header className="panel-header"><div><p className="admin-eyebrow">분류</p><h1>카테고리</h1></div></header>
    <p className="panel-description">카테고리는 계층과 순서를 저장합니다. 서버가 순환 부모 관계와 과도한 깊이를 거절합니다.</p>
    <div className="category-create"><label>이름<input value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} /></label><label>영문 주소<input value={slug} onChange={(event) => setSlug(event.target.value)} /></label><label>상위 분류<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">없음</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="button button--primary" disabled={busy || !name.trim()} onClick={() => void create()}>추가</button></div>
    {error && <div className="inline-error" role="alert">{error}</div>}{notice&&<div className="inline-success" role="status">{notice}</div>}
    {deleting&&<div className="delete-category"><strong>“{deleting.name}” 삭제</strong><label>글과 하위 분류 이동 대상<select value={moveTo} onChange={(event)=>setMoveTo(event.target.value)}><option value="">미분류 / 최상위</option>{categories.filter((item)=>item.id!==deleting.id).map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="button" onClick={()=>setDeleting(null)}>취소</button><button className="button button--primary" disabled={busy} onClick={()=>void remove()}>안전하게 삭제</button></div>}
    {categories.length === 0 ? <div className="empty-state"><h2>카테고리가 없습니다</h2><p>위 입력란에서 첫 분류를 추가할 수 있습니다.</p></div> : <div className="category-admin-list">{categories.map((category) => <div key={category.id} draggable className={dragging===category.id?'is-dragging':''} style={{ paddingLeft: category.parent_id ? 24 : 0 }} onDragStart={(event)=>{setDragging(category.id);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',category.id);}} onDragEnd={()=>setDragging(null)} onDragOver={(event)=>{event.preventDefault();event.dataTransfer.dropEffect='move';}} onDrop={(event)=>{event.preventDefault();const source=event.dataTransfer.getData('text/plain')||dragging;if(source)void dragReorder(source,category.id);setDragging(null);}}><span>{category.parent_id && '└ '}{category.name}</span><small>/{category.slug}</small><label className="category-parent">상위<select value={category.parent_id??''} disabled={busy} onChange={(event)=>void moveParent(category,event.target.value)}><option value="">최상위</option>{categories.filter((item)=>item.id!==category.id).map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div><button onClick={() => void move(category,-1)} aria-label={category.name+' 위로 이동'}>↑</button><button onClick={() => void move(category,1)} aria-label={category.name+' 아래로 이동'}>↓</button><button onClick={() => void rename(category)}>이름 변경</button><button className="danger-text" onClick={()=>setDeleting(category)}>삭제</button></div></div>)}</div>}
  </section>;
}
