import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsSummary } from '../../lib/admin/types';
import { loadAnalytics } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';

function isoDate(date:Date){return date.toISOString().slice(0,10);}
export function AnalyticsPanel({client}:{client:SupabaseClient}) {
  const now=new Date(); const start=new Date(now); start.setDate(start.getDate()-29);
  const [from,setFrom]=useState(isoDate(start)); const [to,setTo]=useState(isoDate(now)); const [data,setData]=useState<AnalyticsSummary|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  async function load(){setLoading(true);setError(null);try{setData(await loadAnalytics(client,from,to));}catch(error){setError(messageFromError(error));setData(null);}finally{setLoading(false);}}
  useEffect(()=>{void load();},[client]);
  const max=Math.max(1,...(data?.daily.map((row)=>row.pageViews)??[0]));
  return <section className="admin-panel"><header className="panel-header"><div><p className="admin-eyebrow">운영자 전용</p><h1>방문 통계</h1></div><form className="date-range" onSubmit={(event)=>{event.preventDefault();void load();}}><label>시작일<input type="date" value={from} onChange={(event)=>setFrom(event.target.value)}/></label><label>종료일<input type="date" value={to} onChange={(event)=>setTo(event.target.value)}/></label><button className="button">조회</button></form></header>
    <p className="panel-description">공개 글의 유효한 페이지 조회 이벤트만 집계합니다. 사람 수나 정확한 순방문자 수로 해석하지 않습니다. 보고 시간대는 Asia/Seoul입니다.</p>
    {error&&<div className="inline-error" role="alert">통계 조회 실패: {error}</div>}
    {loading?<div className="panel-state">실제 집계값을 불러오는 중…</div>:data&&<><div className="analytics-summary"><span>선택 기간 페이지 조회</span><strong>{data.totalPageViews.toLocaleString('ko-KR')}</strong><small>{data.from} – {data.to}</small></div>
      {data.daily.length===0?<div className="empty-state"><h2>집계된 데이터가 없습니다</h2><p>설정 오류나 조회 실패가 아니라, 선택 기간에 저장된 조회 이벤트가 없습니다.</p></div>:<div className="chart" aria-label="날짜별 페이지 조회 막대 그래프">{data.daily.map((row)=><div className="chart-row" key={row.date}><time>{row.date.slice(5)}</time><span className="chart-track"><i style={{width:String(Math.max(2,row.pageViews/max*100))+'%'}} /></span><b>{row.pageViews}</b></div>)}</div>}
      {data.posts.length>0&&<div className="stats-table"><div><strong>글</strong><strong>페이지 조회</strong></div>{data.posts.map((row)=><div key={row.postId}><span>{row.title}</span><span>{row.pageViews.toLocaleString('ko-KR')}</span></div>)}</div>}</>}
  </section>;
}
