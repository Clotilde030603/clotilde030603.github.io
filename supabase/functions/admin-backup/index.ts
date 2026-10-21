import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { requireOwner, serviceClient } from '../_shared/supabase.ts';

const MAX_BACKUP_BYTES = 40 * 1024 * 1024;

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

function decode(value: string): Uint8Array {
  const binary = atob(value); const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

Deno.serve(async (request) => {
  const options = preflight(request); if (options) return options;
  try {
    const { client } = await requireOwner(request);
    if (request.method === 'GET') {
      const { data, error } = await client.rpc('export_backup');
      if (error) throw error;
      const admin = serviceClient();
      const objects: Array<Record<string, unknown>> = [];
      let totalBytes = 0;
      for (const media of data.mediaAssets ?? []) {
        totalBytes += Number(media.byte_size);
        if (totalBytes > MAX_BACKUP_BYTES) throw new HttpError(413, 'media exceeds the 40 MiB portable backup limit');
        const { data: blob, error: downloadError } = await admin.storage.from(media.bucket_id).download(media.object_path);
        if (downloadError || !blob) throw new HttpError(409, `media object is missing: ${media.object_path}`);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (bytes.byteLength !== Number(media.byte_size)) throw new HttpError(409, `media size differs from metadata: ${media.object_path}`);
        objects.push({ bucketId: media.bucket_id, path: media.object_path, mimeType: media.mime_type, byteSize: bytes.byteLength, base64: encode(bytes) });
      }
      return json(request, { ...data, storageObjects: objects });
    }
    if (request.method === 'POST') {
      const body = await readJson(request, 60 * 1024 * 1024);
      const backup = body.backup;
      if (!backup || typeof backup !== 'object' || Array.isArray(backup)) throw new HttpError(400, 'backup object is required');
      const portable = backup as Record<string, unknown>;
      const storageObjects = Array.isArray(portable.storageObjects) ? portable.storageObjects as Array<Record<string, unknown>> : [];
      const mediaAssets = Array.isArray(portable.mediaAssets) ? portable.mediaAssets as Array<Record<string, unknown>> : [];
      if (storageObjects.length !== mediaAssets.length) throw new HttpError(400, 'backup must contain every media object');
      let totalBytes = 0;
      const decoded = storageObjects.map((object) => {
        if (typeof object.bucketId !== 'string' || typeof object.path !== 'string' || typeof object.mimeType !== 'string' || typeof object.base64 !== 'string')
          throw new HttpError(400, 'invalid storage object');
        const bytes = decode(object.base64);
        totalBytes += bytes.byteLength;
        if (totalBytes > MAX_BACKUP_BYTES || bytes.byteLength !== Number(object.byteSize)) throw new HttpError(400, 'invalid or oversized storage object');
        const metadata = mediaAssets.find((media) => media.bucket_id === object.bucketId && media.object_path === object.path);
        if (!metadata || Number(metadata.byte_size) !== bytes.byteLength || metadata.mime_type !== object.mimeType)
          throw new HttpError(400, 'storage object does not match media metadata');
        return { bucketId: object.bucketId, path: object.path, mimeType: object.mimeType, bytes };
      });
      const admin = serviceClient();
      const uploaded: Array<{ bucketId: string; path: string }> = [];
      for (const object of decoded) {
        const { error: uploadError } = await admin.storage.from(object.bucketId).upload(object.path, object.bytes, { contentType: object.mimeType, upsert: false });
        if (uploadError) {
          for (const prior of uploaded) await admin.storage.from(prior.bucketId).remove([prior.path]);
          throw new HttpError(409, `media restore stopped before database restore: ${object.bucketId}/${object.path}`);
        }
        uploaded.push({ bucketId: object.bucketId, path: object.path });
      }
      const { data, error } = await client.rpc('restore_backup', { p_backup: backup });
      if (error) {
        for (const object of uploaded) await admin.storage.from(object.bucketId).remove([object.path]);
        if (error.code === '55000') throw new HttpError(409, error.message);
        throw error;
      }
      return json(request, { ...data, restoredMedia: decoded.length, mediaRestore: 'complete' }, 201);
    }
    throw new HttpError(405, 'method not allowed');
  } catch (error) { return errorResponse(request, error); }
});
