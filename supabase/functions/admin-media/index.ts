import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { requireOwner, serviceClient } from '../_shared/supabase.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    const {client}=await requireOwner(request);
    const body=request.method==='POST'?await readJson(request,4096):{};
    const mediaId = typeof body.mediaId==='string'?body.mediaId:new URL(request.url).searchParams.get('mediaId') ?? '';
    if (!UUID.test(mediaId)) throw new HttpError(400, 'valid mediaId is required');
    const db = serviceClient();
    const { data: media, error: mediaError } = await db.from('media_assets').select('*').eq('id',mediaId).maybeSingle();
    if (mediaError) throw mediaError; if (!media) throw new HttpError(404,'media not found');
    const [{ data: drafts, error: draftError }, { data: publications, error: publicationError },{data:draftVersions,error:draftVersionError},{data:aboutDraft,error:aboutError},{data:aboutVersions,error:aboutVersionError},{data:aboutPublications,error:aboutPublicationError},{data:templates,error:templateError}] = await Promise.all([
      db.from('drafts').select('post_id,title,document,cover_media_id,version'),
      db.from('publications').select('id,post_id,title,document,cover_media_id'),
      db.from('draft_versions').select('id,post_id,version,snapshot'),
      db.from('about_draft').select('version,document').eq('id',1).maybeSingle(),
      db.from('about_versions').select('id,version,document'),
      db.from('about_publications').select('id,draft_version,document'),
      db.from('templates').select('id,name,document'),
    ]);
    for(const error of [draftError,publicationError,draftVersionError,aboutError,aboutVersionError,aboutPublicationError,templateError])if(error)throw error;
    const referencesDocument=(node:unknown):boolean=>{if(Array.isArray(node))return node.some(referencesDocument);if(!node||typeof node!=='object')return false;const record=node as Record<string,unknown>;return record.mediaId===mediaId||Object.values(record).some(referencesDocument);};
    const draftUses = (drafts ?? []).filter((row) => row.cover_media_id===mediaId || referencesDocument(row.document)).map((row) => ({postId:row.post_id,title:row.title}));
    const publicationUses = (publications ?? []).filter((row) => row.cover_media_id===mediaId || JSON.stringify(row.document).includes(mediaId)).map((row) => ({publicationId:row.id,postId:row.post_id,title:row.title}));
    const historyUses=(draftVersions??[]).filter((row)=>JSON.stringify(row.snapshot).includes(mediaId)).map((row)=>({versionId:row.id,postId:row.post_id,version:row.version}));
    const aboutCurrent=Boolean(aboutDraft&&referencesDocument(aboutDraft.document));
    const aboutHistory=(aboutVersions??[]).filter((row)=>JSON.stringify(row.document).includes(mediaId)).map((row)=>({versionId:row.id,version:row.version}));
    const aboutPublished=(aboutPublications??[]).filter((row)=>JSON.stringify(row.document).includes(mediaId)).map((row)=>({publicationId:row.id,draftVersion:row.draft_version}));
    const templateUses=(templates??[]).filter((row)=>referencesDocument(row.document)).map((row)=>({id:row.id,name:row.name}));
    const usage = { drafts:draftUses, publications:publicationUses, draftHistory:historyUses, aboutCurrent, aboutHistory, aboutPublished, templates:templateUses };
    if (request.method==='GET') return json(request,{media,usage});
    if(request.method==='POST'){
      const replacementMediaId=typeof body.replacementMediaId==='string'?body.replacementMediaId:'';
      if(!UUID.test(replacementMediaId)||replacementMediaId===mediaId)throw new HttpError(400,'a distinct replacementMediaId is required');
      const {data:replacement,error:replacementError}=await db.from('media_assets').select('*').eq('id',replacementMediaId).maybeSingle();
      if(replacementError)throw replacementError;if(!replacement||replacement.bucket_id!=='draft-media'||replacement.visibility!=='private')throw new HttpError(409,'replacement must be a private draft asset');
      const {data:signed,error:signedError}=await db.storage.from('draft-media').createSignedUrl(replacement.object_path,600);if(signedError)throw signedError;
      const replaceDocument=(node:unknown):unknown=>{if(Array.isArray(node))return node.map(replaceDocument);if(!node||typeof node!=='object')return node;const source=node as Record<string,unknown>;const result:Record<string,unknown>={};for(const [key,value]of Object.entries(source))result[key]=replaceDocument(value);if(source.mediaId===mediaId){result.mediaId=replacementMediaId;result.src=signed.signedUrl;}return result;};
      const draftUpdates=(drafts??[]).filter((row)=>row.cover_media_id===mediaId||referencesDocument(row.document)).map((row)=>({postId:row.post_id,expectedVersion:row.version,document:replaceDocument(row.document)}));
      const aboutUpdate=aboutCurrent?{expectedVersion:aboutDraft.version,document:replaceDocument(aboutDraft.document)}:null;
      const templateUpdates=(templates??[]).filter((row)=>referencesDocument(row.document)).map((row)=>({id:row.id,document:replaceDocument(row.document)}));
      const {data:result,error:replaceError}=await client.rpc('replace_private_media',{p_old_media_id:mediaId,p_new_media_id:replacementMediaId,p_updates:{drafts:draftUpdates,about:aboutUpdate,templates:templateUpdates}});
      if(replaceError){if(replaceError.code==='40001')throw new HttpError(409,replaceError.message);throw replaceError;}
      return json(request,{replacement:result,oldMediaRetained:true,signedUrl:signed.signedUrl});
    }
    if (request.method!=='DELETE') throw new HttpError(405,'method not allowed');
    if (draftUses.length || publicationUses.length||historyUses.length||aboutCurrent||aboutHistory.length||aboutPublished.length||templateUses.length) throw new HttpError(409,'media is still referenced');
    const { data: backupObject, error: downloadError } = await db.storage.from(media.bucket_id).download(media.object_path);
    if (downloadError || !backupObject) throw new HttpError(409,'media object is unavailable');
    const { error: storageError } = await db.storage.from(media.bucket_id).remove([media.object_path]);
    if (storageError) throw storageError;
    const { error: deleteError } = await db.from('media_assets').delete().eq('id',mediaId);
    if (deleteError) {
      await db.storage.from(media.bucket_id).upload(media.object_path,backupObject,{contentType:media.mime_type,upsert:false});
      throw deleteError;
    }
    return json(request,{deleted:true,mediaId});
  } catch(error) { return errorResponse(request,error); }
});
