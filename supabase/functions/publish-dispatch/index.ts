import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { requireOwner, serviceClient } from '../_shared/supabase.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method not allowed');
    const { client } = await requireOwner(request);
    const body = await readJson(request, 4096);
    const postId = typeof body.postId === 'string' ? body.postId : '';
    const action = body.action === 'unpublish' ? 'unpublish' : body.action === 'about' ? 'about' : 'publish';
    const expectedVersion = Number(body.expectedVersion);
    if ((action !== 'about' && !UUID.test(postId)) || (action !== 'unpublish' && (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1)))
      throw new HttpError(400, 'valid target and expectedVersion are required');
    let createdMedia: Array<{ id: string; bucket: string; path: string }> = [];
    let publishedDocument: unknown = null;
    let publishedCoverId: string | null = null;
    try { if (action === 'publish' || action === 'about') {
      const { data: draft, error: draftError } = action === 'about'
        ? await client.from('about_draft').select('version,document').eq('id',1).single()
        : await client.from('drafts').select('version,document,cover_media_id').eq('post_id', postId).single();
      if (draftError) throw draftError;
      if (draft.version !== expectedVersion) throw new HttpError(409, 'draft version conflict');
      if (JSON.stringify(draft.document).includes('import-asset:')) throw new HttpError(409, 'upload every imported asset before publishing');
      const mediaIds = new Set<string>();
      if ('cover_media_id' in draft && draft.cover_media_id) mediaIds.add(draft.cover_media_id);
      const collect = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (!node || typeof node !== 'object') return;
        const record = node as Record<string, unknown>;
        if (typeof record.mediaId === 'string') mediaIds.add(record.mediaId);
        for (const value of Object.values(record)) collect(value);
      };
      collect(draft.document);
      const admin = serviceClient();
      const mapping = new Map<string, { id: string; url: string }>();
      if (mediaIds.size) {
        const { data: media, error: mediaError } = await admin.from('media_assets').select('*').in('id', [...mediaIds]).order('created_at', { ascending: true });
        if (mediaError) throw mediaError;
        if ((media ?? []).length !== mediaIds.size || media?.some((item) => !((item.bucket_id === 'draft-media'&&item.visibility==='private')||(item.bucket_id==='published-media'&&item.visibility==='public'))))
          throw new HttpError(409, 'draft references missing or invalid media');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        for (const item of media ?? []) {
          if(item.bucket_id==='published-media'){
            const encoded=item.object_path.split('/').map(encodeURIComponent).join('/');
            mapping.set(item.id,{id:item.id,url:`${supabaseUrl}/storage/v1/object/public/published-media/${encoded}`});
            continue;
          }
          const filename = item.object_path.split('/').pop()?.replace(/[^A-Za-z0-9._-]/g, '-') || 'asset';
          const publicationScope = action === 'about' ? 'about' : postId;
          const publicPath = `${publicationScope}/${item.id}/${filename}`;
          let { data: publicAsset } = await admin.from('media_assets').select('id,object_path').eq('bucket_id','published-media').eq('object_path',publicPath).maybeSingle();
          if (publicAsset) {
            const { data: existingObject, error: existingError } = await admin.storage.from('published-media').download(publicPath);
            if (existingError || !existingObject) {
              await admin.from('media_assets').delete().eq('id',publicAsset.id);
              publicAsset = null;
            }
          }
          if (!publicAsset) {
            const { data: blob, error: downloadError } = await admin.storage.from('draft-media').download(item.object_path);
            if (downloadError || !blob) throw new HttpError(409, `private media is unavailable: ${item.object_path}`);
            const { error: uploadError } = await admin.storage.from('published-media').upload(publicPath, blob, { contentType: item.mime_type, upsert: false });
            if (uploadError) throw uploadError;
            const publicId = crypto.randomUUID();
            const { data: inserted, error: insertError } = await admin.from('media_assets').insert({
              id: publicId,bucket_id:'published-media',object_path:publicPath,visibility:'public',mime_type:item.mime_type,
              byte_size:item.byte_size,alt_text:item.alt_text,width:item.width,height:item.height,
            }).select('id,object_path').single();
            if (insertError) { await admin.storage.from('published-media').remove([publicPath]); throw insertError; }
            publicAsset = inserted; createdMedia.push({ id: inserted.id, bucket: 'published-media', path: publicPath });
          }
          const encodedPath = publicAsset.object_path.split('/').map(encodeURIComponent).join('/');
          mapping.set(item.id, { id: publicAsset.id, url: `${supabaseUrl}/storage/v1/object/public/published-media/${encodedPath}` });
        }
      }
      const transform = (node: unknown): unknown => {
        if (Array.isArray(node)) return node.map(transform);
        if (!node || typeof node !== 'object') return node;
        const result: Record<string, unknown> = {};
        const source = node as Record<string, unknown>;
        for (const [key,value] of Object.entries(source)) result[key] = transform(value);
        if (typeof source.mediaId === 'string') {
          const replacement = mapping.get(source.mediaId);
          if (!replacement) throw new HttpError(409, 'media promotion is incomplete');
          result.mediaId = replacement.id; result.src = replacement.url;
        } else if (typeof source.src === 'string') {
          throw new HttpError(409, 'every image must be imported into private media before publishing');
        }
        return result;
      };
      publishedDocument = transform(draft.document);
      publishedCoverId = 'cover_media_id' in draft && draft.cover_media_id ? mapping.get(draft.cover_media_id)?.id ?? null : null;
    } } catch (promotionError) {
      if (createdMedia.length) {
        const admin = serviceClient();
        await admin.storage.from('published-media').remove(createdMedia.map((item) => item.path));
        await admin.from('media_assets').delete().in('id', createdMedia.map((item) => item.id));
      }
      throw promotionError;
    }
    const { data, error } = action === 'publish'
      ? await client.rpc('publish_post', { p_post_id: postId, p_expected_version: expectedVersion, p_published_document: publishedDocument, p_published_cover_media_id: publishedCoverId })
      : action === 'about'
        ? await client.rpc('publish_about', { p_expected_version: expectedVersion, p_published_document: publishedDocument })
        : await client.rpc('unpublish_post', { p_post_id: postId });
    if (error) {
      if (createdMedia.length) {
        const admin = serviceClient();
        await admin.storage.from('published-media').remove(createdMedia.map((item) => item.path));
        await admin.from('media_assets').delete().in('id', createdMedia.map((item) => item.id));
      }
      if (error.code === '40001') throw new HttpError(409, error.message);
      throw error;
    }
    const result = action === 'publish' || action === 'about' ? (Array.isArray(data) ? data[0] : data) : { publication_id: null, deployment_id: data };
    const deploymentId = result?.deployment_id;
    if (!deploymentId) throw new Error('publish transaction did not return a deployment');
    const token = Deno.env.get('GITHUB_ACTIONS_TOKEN');
    const repository = Deno.env.get('GITHUB_REPOSITORY') ?? 'Clotilde030603/clotilde030603.github.io';
    const workflow = Deno.env.get('GITHUB_WORKFLOW_FILE') ?? 'pages.yml';
    if (!token) return json(request, { ...result, dispatchConfigured: false, status: 'requested' }, 202);
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: JSON.stringify({ ref: 'main', inputs: { deployment_id: deploymentId } }),
    });
    if (!response.ok) {
      const message = `GitHub dispatch failed (${response.status})`;
      await serviceClient().from('deployments').update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() }).eq('id', deploymentId);
      throw new HttpError(502, message);
    }
    return json(request, { ...result, dispatchConfigured: true, status: 'requested' }, 202);
  } catch (error) { return errorResponse(request, error); }
});
