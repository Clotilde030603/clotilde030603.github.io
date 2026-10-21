import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EMPTY_DOCUMENT } from '../../lib/admin/types';
import { createDraft, loadDraft, saveDraft } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';
import { BlockEditor } from './BlockEditor';

type Template={id:string;name:string;document:typeof EMPTY_DOCUMENT;updated_at:string};
export function TemplatesPanel({client,onCreated}:{client:SupabaseClient;onCreated:(id:string)=>void}) {
  const [items,setItems]=useState<Template[]>([]);const [name,setName]=useState('');const [error,setError]=useState<string|null>(null);
  const[editing,setEditing]=useState<Template|null>(null);
  async function load(){const {data,error}=await client.from('templates').select('id,name,document,updated_at').order('updated_at',{ascending:false});if(error)setError(error.message);else setItems((data??[]) as Template[]);}
  useEffect(()=>{void load();},[client]);
  async function create(){const {error}=await client.from('templates').insert({name:name.trim(),document:EMPTY_DOCUMENT});if(error)setError(error.message);else{setName('');await load();}}
  async function apply(item:Template){try{const id=await createDraft(client,item.name);const draft=await loadDraft(client,id);await saveDraft(client,{...draft,document:item.document,version:draft.version});onCreated(id);}catch(error){setError(messageFromError(error));}}
  async function remove(item:Template){if(!window.confirm('템플릿 “'+item.name+'”을 삭제할까요?'))return;const {error}=await client.from('templates').delete().eq('id',item.id);if(error)setError(error.message);else await load();}
  async function saveTemplate(){if(!editing)return;const{error}=await client.from('templates').update({name:editing.name,document:editing.document}).eq('id',editing.id);if(error)setError(error.message);else{setEditing(null);await load();}}
  async function duplicate(item:Template){const{error}=await client.from('templates').insert({name:item.name+' 복사본',document:item.document});if(error)setError(error.message);else await load();}
  return <section className="admin-panel"><header className="panel-header"><div><p className="admin-eyebrow">글쓰기</p><h1>템플릿</h1></div></header><p className="panel-description">자주 쓰는 문서 구조를 저장하고 새 비공개 초안에 적용합니다.</p><div className="simple-create"><input value={name} placeholder="새 템플릿 이름" onChange={(event)=>setName(event.target.value)}/><button className="button button--primary" disabled={!name.trim()} onClick={()=>void create()}>빈 템플릿 추가</button></div>{error&&<div className="inline-error">{error}</div>}{items.length===0?<div className="empty-state"><h2>저장된 템플릿이 없습니다</h2></div>:<div className="template-list">{items.map((item)=><div key={item.id}><strong>{item.name}</strong><time>{new Date(item.updated_at).toLocaleDateString('ko-KR')}</time><span><button onClick={()=>setEditing(item)}>본문 편집</button><button onClick={()=>void duplicate(item)}>복제</button><button onClick={()=>void apply(item)}>새 초안에 적용</button><button className="danger-text" onClick={()=>void remove(item)}>삭제</button></span></div>)}</div>}{editing&&<div className="modal-backdrop"><section className="preview-modal template-editor"><header><input value={editing.name} onChange={(event)=>setEditing({...editing,name:event.target.value})}/><button className="button" onClick={()=>setEditing(null)}>취소</button><button className="button button--primary" onClick={()=>void saveTemplate()}>템플릿 저장</button></header><BlockEditor document={editing.document} onChange={(document)=>setEditing({...editing,document})}/></section></div>}</section>;
}
