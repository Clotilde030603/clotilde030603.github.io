import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Deployment={id:string;kind:'publish'|'unpublish';status:'requested'|'building'|'live'|'failed'|'superseded';requested_at:string;completed_at:string|null;error_message:string|null;github_run_id:number|null};
const labels={requested:'요청됨',building:'빌드 중',live:'공개 반영 완료',failed:'실패',superseded:'새 배포로 대체됨'};
export function DeploymentsPanel({client}:{client:SupabaseClient}){
  const [items,setItems]=useState<Deployment[]>([]);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);const {data,error}=await client.from('deployments').select('id,kind,status,requested_at,completed_at,error_message,github_run_id').order('requested_at',{ascending:false}).limit(50);if(error)setError(error.message);else{setError(null);setItems((data??[]) as Deployment[]);}setLoading(false);}
  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),15000);return()=>clearInterval(timer);},[client]);
  return <section className="admin-panel"><header className="panel-header"><div><p className="admin-eyebrow">GitHub Pages</p><h1>배포 상태</h1></div><button className="button" onClick={()=>void load()}>새로고침</button></header><p className="panel-description">발행 요청과 실제 공개 반영은 별도 상태입니다. ‘공개 반영 완료’가 되어야 Pages에 보입니다.</p>{error&&<div className="inline-error">{error}</div>}{loading?<div className="panel-state">배포 상태를 확인하는 중…</div>:items.length===0?<div className="empty-state"><h2>배포 기록이 없습니다</h2></div>:<div className="deployment-list">{items.map((item)=><div key={item.id}><span>{item.kind==='publish'?'발행':'공개 해제'}</span><strong className={'deployment-'+item.status}>{labels[item.status]}</strong><time>{new Date(item.requested_at).toLocaleString('ko-KR')}</time><small>{item.error_message??(item.github_run_id?'GitHub 실행 #'+item.github_run_id:'')}</small></div>)}</div>}</section>;
}
