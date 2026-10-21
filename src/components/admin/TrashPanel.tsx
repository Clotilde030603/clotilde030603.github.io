import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminPost } from '../../lib/admin/types';
import { listPosts } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';

export function TrashPanel({client,onOpen}:{client:SupabaseClient;onOpen:(id:string)=>void}) {
  const [items,setItems]=useState<AdminPost[]>([]);const [error,setError]=useState<string|null>(null);
  async function load(){try{setItems(await listPosts(client,true));}catch(error){setError(messageFromError(error));}}
  useEffect(()=>{void load();},[client]);
  async function restore(id:string){const {error}=await client.from('posts').update({deleted_at:null,status:'draft'}).eq('id',id);if(error)setError(error.message);else await load();}
  async function purge(id:string){if(!window.confirm('글과 초안, 변경 이력을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.'))return;const {error}=await client.from('posts').delete().eq('id',id);if(error)setError(error.message);else await load();}
  return <section className="admin-panel"><header className="panel-header"><div><p className="admin-eyebrow">복구</p><h1>휴지통</h1></div></header><p className="panel-description">복원한 글은 비공개 초안으로 돌아가며 자동 발행되지 않습니다.</p>{error&&<div className="inline-error">{error}</div>}{items.length===0?<div className="empty-state"><h2>휴지통이 비어 있습니다</h2></div>:<div className="template-list">{items.map((item)=>{const draft=Array.isArray(item.drafts)?item.drafts[0]:item.drafts;return <div key={item.id}><strong>{draft?.title??'제목 없음'}</strong><time>{item.deleted_at?new Date(item.deleted_at).toLocaleDateString('ko-KR'):''}</time><span><button onClick={()=>void restore(item.id)}>복원</button><button onClick={()=>onOpen(item.id)}>내용 확인</button><button className="danger-text" onClick={()=>void purge(item.id)}>영구 삭제</button></span></div>;})}</div>}</section>;
}
