import { errorResponse,HttpError,json,preflight,readJson } from '../_shared/http.ts';
import { requireOwner,serviceClient } from '../_shared/supabase.ts';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async(request)=>{
  const options=preflight(request);if(options)return options;
  const created:Array<{id:string,path:string}>=[];
  try{
    if(request.method!=='POST')throw new HttpError(405,'method not allowed');
    const {client}=await requireOwner(request);const body=await readJson(request,4096);
    const publicationId=typeof body.publicationId==='string'?body.publicationId:'';const mode=body.mode==='current'?'current':'new';const postId=typeof body.postId==='string'?body.postId:'';
    if(!UUID.test(publicationId)||(mode==='current'&&!UUID.test(postId)))throw new HttpError(400,'valid publication target is required');
    const db=serviceClient();const {data:publication,error:publicationError}=await db.from('publications').select('*').eq('id',publicationId).maybeSingle();
    if(publicationError)throw publicationError;if(!publication)throw new HttpError(404,'publication not found');if(mode==='current'&&publication.post_id!==postId)throw new HttpError(400,'publication does not belong to post');
    const mediaIds=new Set<string>();if(publication.cover_media_id)mediaIds.add(publication.cover_media_id);
    const collect=(node:unknown)=>{if(Array.isArray(node))return node.forEach(collect);if(!node||typeof node!=='object')return;const record=node as Record<string,unknown>;if(typeof record.mediaId==='string')mediaIds.add(record.mediaId);for(const value of Object.values(record))collect(value);};collect(publication.document);
    const mapping=new Map<string,{id:string,url:string}>();
    if(mediaIds.size){const {data:assets,error:assetError}=await db.from('media_assets').select('*').in('id',[...mediaIds]);if(assetError)throw assetError;if((assets??[]).length!==mediaIds.size||assets?.some((asset)=>asset.bucket_id!=='published-media'||asset.visibility!=='public'))throw new HttpError(409,'publication media is incomplete');
      for(const asset of assets??[]){const {data:blob,error:downloadError}=await db.storage.from('published-media').download(asset.object_path);if(downloadError||!blob)throw new HttpError(409,`published media missing: ${asset.object_path}`);
        const newId=crypto.randomUUID();const filename=asset.object_path.split('/').pop()?.replace(/[^A-Za-z0-9._-]/g,'-')||'asset';const path=`restores/${newId}/${filename}`;
        const {error:uploadError}=await db.storage.from('draft-media').upload(path,blob,{contentType:asset.mime_type,upsert:false});if(uploadError)throw uploadError;
        const {error:insertError}=await db.from('media_assets').insert({id:newId,bucket_id:'draft-media',object_path:path,visibility:'private',mime_type:asset.mime_type,byte_size:asset.byte_size,alt_text:asset.alt_text,width:asset.width,height:asset.height});if(insertError){await db.storage.from('draft-media').remove([path]);throw insertError;}
        created.push({id:newId,path});const {data:signed,error:signedError}=await db.storage.from('draft-media').createSignedUrl(path,600);if(signedError)throw signedError;mapping.set(asset.id,{id:newId,url:signed.signedUrl});
      }
    }
    const transform=(node:unknown):unknown=>{if(Array.isArray(node))return node.map(transform);if(!node||typeof node!=='object')return node;const source=node as Record<string,unknown>;const result:Record<string,unknown>={};for(const [key,value]of Object.entries(source))result[key]=transform(value);if(typeof source.mediaId==='string'){const replacement=mapping.get(source.mediaId);if(!replacement)throw new HttpError(409,'publication media clone is incomplete');result.mediaId=replacement.id;result.src=replacement.url;}return result;};
    const privateDocument=transform(publication.document);const privateCover=publication.cover_media_id?mapping.get(publication.cover_media_id)?.id??null:null;
    const {data,error}=mode==='current'
      ?await client.rpc('restore_publication_as_draft',{p_post_id:postId,p_publication_id:publicationId,p_private_document:privateDocument,p_private_cover_media_id:privateCover})
      :await client.rpc('restore_publication_to_draft',{p_publication_id:publicationId,p_private_document:privateDocument,p_private_cover_media_id:privateCover});
    if(error)throw error;
    return json(request,{mode,postId:mode==='current'?postId:data,clonedMedia:created.length,draft:data},201);
  }catch(error){if(created.length){const db=serviceClient();await db.storage.from('draft-media').remove(created.map((item)=>item.path));await db.from('media_assets').delete().in('id',created.map((item)=>item.id));}return errorResponse(request,error);}
});
