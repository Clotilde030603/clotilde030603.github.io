import { useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { importHtml, importMarkdown, importNotionZip, importTistoryHtml, type ImportBundle, type ImportedDocument } from '../../lib/import/content';
import { createDraft, loadDraft, saveDraft } from '../../lib/admin/api';
import { messageFromError } from '../../lib/admin/errors';

type Prepared = { documents: ImportedDocument[]; assets: ImportBundle['assets']; warnings: ImportBundle['warnings']; source: string };
const empty: Prepared = { documents: [], assets: [], warnings: [], source: '' };

export function ImportPanel({ client, onImported }: { client: SupabaseClient; onImported: (postId: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<Prepared>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [format, setFormat] = useState<'markdown' | 'html' | 'tistory'>('markdown');
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');

  async function prepareFile(file: File) {
    setError(null);
    try {
      if (/\.zip$/i.test(file.name)) {
        const bundle = importNotionZip(new Uint8Array(await file.arrayBuffer()));
        setPrepared({ ...bundle, source: 'Notion ZIP' });
      } else {
        const text = await file.text();
        const doc = /\.html?$/i.test(file.name) ? importHtml(text, file.name) : importMarkdown(text, file.name);
        setPrepared({ documents: [doc], assets: [], warnings: [], source: file.name });
      }
    } catch (error) { setError(messageFromError(error)); }
  }

  function preparePaste() {
    setError(null);
    try {
      let doc: ImportedDocument;
      if (format === 'tistory') doc = importTistoryHtml(paste, { title, sourceUrl });
      else doc = format === 'html' ? importHtml(paste, '붙여넣기.html') : importMarkdown(paste, '붙여넣기.md');
      setPrepared({ documents: [doc], assets: [], warnings: [], source: format });
    } catch (error) { setError(messageFromError(error)); }
  }

  async function uploadAssets(assets: ImportBundle['assets']) {
    const mapping = new Map<string, { id: string; src: string }>();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('로그인이 만료되었습니다.');
    for (const asset of assets) {
      const safeName = asset.path.split('/').at(-1)?.replace(/[^a-zA-Z0-9._-]/g, '-') || 'asset';
      const path = user.id + '/imports/' + crypto.randomUUID() + '-' + safeName;
      const { error: uploadError } = await client.storage.from('draft-media').upload(path, asset.bytes, { contentType: asset.mimeType, upsert: false });
      if (uploadError) throw uploadError;
      const { data, error: rowError } = await client.from('media_assets').insert({
        bucket_id: 'draft-media', object_path: path, visibility: 'private',
        mime_type: asset.mimeType, byte_size: asset.bytes.byteLength, alt_text: '',
      }).select('id').single();
      if (rowError) throw rowError;
      const signed = await client.storage.from('draft-media').createSignedUrl(path, 3600);
      if (signed.error) throw signed.error;
      mapping.set(asset.path, { id: String(data.id), src: signed.data.signedUrl });
    }
    return mapping;
  }

  function replaceAssets(value: unknown, mapping: Map<string, { id: string; src: string }>): unknown {
    if (Array.isArray(value)) return value.map((item) => replaceAssets(item, mapping));
    if (value && typeof value === 'object') {
      const object = { ...(value as Record<string, unknown>) };
      if (typeof object.src === 'string' && object.src.startsWith('import-asset:')) {
        const path = decodeURIComponent(object.src.slice('import-asset:'.length));
        const media = mapping.get(path);
        if (media) { object.src = media.src; object.mediaId = media.id; }
      }
      for (const [key, item] of Object.entries(object)) object[key] = replaceAssets(item, mapping);
      return object;
    }
    return value;
  }

  async function resolveRemoteImages(document:ImportedDocument['document'],sourcePath:string){const cloned=structuredClone(document);const nodes:Array<Record<string,any>>=[];const walk=(value:any)=>{if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'){if(value.type==='image'&&typeof value.attrs?.src==='string'&&/^https:\/\//i.test(value.attrs.src)&&!value.attrs.mediaId)nodes.push(value);Object.values(value).forEach(walk);}};walk(cloned);const warnings:Array<{code:string;message:string;path?:string}>=[];let cursor=0;async function worker(){while(cursor<nodes.length){const node=nodes[cursor++];const url=node.attrs.src;try{const result=await client.functions.invoke('import-remote-image',{body:{url,altText:node.attrs.alt??''}});if(result.error)throw result.error;if(!result.data?.media?.id||!result.data?.signedUrl)throw new Error('미디어 응답이 불완전합니다.');node.attrs={...node.attrs,mediaId:String(result.data.media.id),src:String(result.data.signedUrl)};}catch(error){warnings.push({code:'remote-image-failed',message:'원격 이미지를 가져오지 못했습니다: '+url+' — '+messageFromError(error),path:sourcePath});}}}await Promise.all(Array.from({length:Math.min(3,nodes.length)},()=>worker()));return{document:cloned,warnings};}

  async function importAsDrafts() {
    setBusy(true); setError(null);
    let jobId:string|null=null;
    try {
      const source=prepared.source==='Notion ZIP'?'notion-markdown':format==='tistory'?'tistory-html':format==='html'?'paste-html':'notion-markdown';
      const job=await client.from('import_jobs').insert({source,status:'processing',original_name:prepared.source}).select('id').single();if(job.error)throw job.error;jobId=String(job.data.id);
      const mapping = await uploadAssets(prepared.assets);
      let first = '';const persistedWarnings:Array<{import_job_id:string;item_path:string;code:string;message:string}>=[];
      for (const item of prepared.documents) {
        const localDocument=replaceAssets(item.document,mapping) as typeof item.document;const remote=await resolveRemoteImages(localDocument,item.sourcePath);
        const postId = await createDraft(client, item.title);
        const draft = await loadDraft(client, postId);
        await saveDraft(client, {
          ...draft, title: item.title,
          document: remote.document,
          source_url: format === 'tistory' ? sourceUrl : null, version: draft.version,
        });
        for(const warning of[...item.warnings,...remote.warnings])persistedWarnings.push({import_job_id:jobId,item_path:warning.path??item.sourcePath,code:warning.code,message:warning.message});
        if (!first) first = postId;
      }
      if(persistedWarnings.length){const savedWarnings=await client.from('import_warnings').insert(persistedWarnings);if(savedWarnings.error)throw savedWarnings.error;}
      await client.from('import_jobs').update({status:'completed',completed_at:new Date().toISOString(),result:{documents:prepared.documents.length,assets:prepared.assets.length,warnings:persistedWarnings.length}}).eq('id',jobId);
      setPrepared(empty);
      if (first) onImported(first);
    } catch (error) { if(jobId)await client.from('import_jobs').update({status:'failed',completed_at:new Date().toISOString(),result:{error:messageFromError(error)}}).eq('id',jobId);setError(messageFromError(error)); }
    finally { setBusy(false); }
  }

  const allWarnings = [...prepared.warnings, ...prepared.documents.flatMap((item) => item.warnings)];
  return <section className="admin-panel">
    <header className="panel-header"><div><p className="admin-eyebrow">초안으로 가져오기</p><h1>가져오기</h1></div></header>
    <p className="panel-description">가져온 문서는 모두 비공개 초안으로 저장됩니다. 자동으로 발행하지 않으며, 변환 경고와 이미지 상태를 먼저 확인합니다.</p>
    <div className="import-grid">
      <section><h2>파일 가져오기</h2><p>Notion Markdown/HTML ZIP, Markdown 또는 HTML 파일</p><input ref={fileInput} hidden type="file" accept=".zip,.md,.markdown,.html,.htm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepareFile(file); event.target.value = ''; }} /><button className="button" onClick={() => fileInput.current?.click()}>파일 선택</button></section>
      <section><h2>붙여넣기</h2><div className="segmented"><button className={format === 'markdown' ? 'is-active' : ''} onClick={() => setFormat('markdown')}>Markdown</button><button className={format === 'html' ? 'is-active' : ''} onClick={() => setFormat('html')}>HTML</button><button className={format === 'tistory' ? 'is-active' : ''} onClick={() => setFormat('tistory')}>티스토리 HTML</button></div>{format === 'tistory' && <><input value={title} placeholder="원본 글 제목" onChange={(event) => setTitle(event.target.value)} /><input value={sourceUrl} type="url" placeholder="https://… 원본 주소" onChange={(event) => setSourceUrl(event.target.value)} /></>}<textarea value={paste} rows={9} placeholder="복사한 내용을 붙여넣으세요" onChange={(event) => setPaste(event.target.value)} /><button className="button" disabled={!paste.trim()} onClick={preparePaste}>변환 미리 보기</button></section>
    </div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {prepared.documents.length > 0 && <section className="import-review"><header><div><p className="admin-eyebrow">{prepared.source}</p><h2>가져오기 전 확인</h2></div><span>{prepared.documents.length}개 문서 · {prepared.assets.length}개 이미지</span></header><ul>{prepared.documents.map((doc) => <li key={doc.sourcePath}><strong>{doc.title}</strong><small>{doc.sourcePath}</small></li>)}</ul>{allWarnings.length > 0 && <div className="warning-list"><h3>변환 경고 {allWarnings.length}건</h3>{allWarnings.map((warning, index) => <p key={index}>{warning.message}</p>)}</div>}<p className="import-note">가져온 이미지 주소는 비공개 미디어 ID로 보존됩니다. 편집기에서 확인되지 않는 이미지는 교체해야 발행할 수 있습니다.</p><button className="button button--primary" disabled={busy} onClick={() => void importAsDrafts()}>{busy ? '서버에 초안 저장 중…' : '모두 비공개 초안으로 가져오기'}</button></section>}
  </section>;
}
