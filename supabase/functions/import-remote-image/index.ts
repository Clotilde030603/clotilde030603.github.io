import { errorResponse,HttpError,json,preflight,readJson } from '../_shared/http.ts';
import { requireOwner,serviceClient } from '../_shared/supabase.ts';
import { validateRemoteHttps,validImageMagic } from '../_shared/net.ts';

const MAX_BYTES=10*1024*1024;
const types=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['image/gif','gif']]);

async function download(initial:string):Promise<{bytes:Uint8Array,mime:string}> {
  let url=await validateRemoteHttps(initial);
  for(let redirects=0;redirects<=3;redirects+=1) {
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(10_000),headers:{Accept:'image/jpeg,image/png,image/webp,image/gif'}});
    if([301,302,303,307,308].includes(response.status)) {
      if(redirects===3) throw new HttpError(400,'too many remote redirects');
      const location=response.headers.get('location'); if(!location) throw new HttpError(400,'invalid remote redirect');
      url=await validateRemoteHttps(new URL(location,url).toString()); continue;
    }
    if(!response.ok) throw new HttpError(422,`remote image returned ${response.status}`);
    await validateRemoteHttps(url.toString());
    const mime=(response.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();
    if(!types.has(mime)) throw new HttpError(415,'remote response is not a supported image');
    const declared=Number(response.headers.get('content-length')??'0');
    if(declared>MAX_BYTES) throw new HttpError(413,'remote image exceeds 10 MiB');
    if(!response.body) throw new HttpError(422,'remote image body is empty');
    const chunks:Uint8Array[]=[]; let size=0; const reader=response.body.getReader();
    while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>MAX_BYTES){await reader.cancel();throw new HttpError(413,'remote image exceeds 10 MiB');} chunks.push(value); }
    const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    if(!validImageMagic(mime,bytes)) throw new HttpError(415,'remote image signature does not match its type');
    return {bytes,mime};
  }
  throw new HttpError(400,'remote image redirect failed');
}

Deno.serve(async(request)=>{
  const options=preflight(request);if(options)return options;
  try {
    if(request.method!=='POST') throw new HttpError(405,'method not allowed');
    await requireOwner(request); const body=await readJson(request,4096);
    if(typeof body.url!=='string'||body.url.length>2048) throw new HttpError(400,'remote image URL is required');
    const altText=typeof body.altText==='string'?body.altText.slice(0,500):'';
    const downloaded=await download(body.url); const id=crypto.randomUUID(); const extension=types.get(downloaded.mime)!;
    const path=`remote/${id}.${extension}`; const db=serviceClient();
    const {error:uploadError}=await db.storage.from('draft-media').upload(path,downloaded.bytes,{contentType:downloaded.mime,upsert:false});
    if(uploadError)throw uploadError;
    const {data:media,error:metadataError}=await db.from('media_assets').insert({id,bucket_id:'draft-media',object_path:path,visibility:'private',mime_type:downloaded.mime,byte_size:downloaded.bytes.byteLength,alt_text:altText}).select('*').single();
    if(metadataError){await db.storage.from('draft-media').remove([path]);throw metadataError;}
    const {data:signed,error:signedError}=await db.storage.from('draft-media').createSignedUrl(path,600);
    if(signedError){await db.from('media_assets').delete().eq('id',id);await db.storage.from('draft-media').remove([path]);throw signedError;}
    return json(request,{media,signedUrl:signed.signedUrl},201);
  } catch(error){return errorResponse(request,error);}
});
