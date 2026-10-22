import { errorResponse, HttpError, json, preflight, readJson } from '../_shared/http.ts';
import { validImageMagic } from '../_shared/net.ts';
import { requireOwner, serviceClient } from '../_shared/supabase.ts';

const MAX_BACKUP_BYTES = 40 * 1024 * 1024;
const ALLOWED_BUCKETS = new Set(['draft-media', 'published-media']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function validateObjectPath(value: string): void {
  if (value.length < 1 || value.length > 1024 || value.startsWith('/') || value.endsWith('/') || !/^[A-Za-z0-9_./-]+$/.test(value))
    throw new HttpError(400, 'invalid storage object path');
  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..'))
    throw new HttpError(400, 'invalid storage object path');
}

function validateMediaMetadata(media: Record<string, unknown>): { bucketId: string; path: string; mimeType: string; byteSize: number } {
  const bucketId = media.bucket_id;
  const path = media.object_path;
  const mimeType = media.mime_type;
  const byteSize = Number(media.byte_size);
  const visibility = media.visibility;
  if (typeof bucketId !== 'string' || !ALLOWED_BUCKETS.has(bucketId)) throw new HttpError(400, 'invalid media bucket');
  if (typeof path !== 'string') throw new HttpError(400, 'invalid media object path');
  validateObjectPath(path);
  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) throw new HttpError(400, 'invalid media MIME type');
  if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > 20 * 1024 * 1024) throw new HttpError(400, 'invalid media byte size');
  if ((bucketId === 'draft-media' && visibility !== 'private') || (bucketId === 'published-media' && visibility !== 'public'))
    throw new HttpError(400, 'media visibility does not match bucket');
  return { bucketId, path, mimeType, byteSize };
}

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
      const metadataByObject = new Map<string, ReturnType<typeof validateMediaMetadata>>();
      for (const media of mediaAssets) {
        const metadata = validateMediaMetadata(media);
        const key = `${metadata.bucketId}\u0000${metadata.path}`;
        if (metadataByObject.has(key)) throw new HttpError(400, 'duplicate media object metadata');
        metadataByObject.set(key, metadata);
      }
      let totalBytes = 0;
      const seenObjects = new Set<string>();
      const decoded = storageObjects.map((object) => {
        if (typeof object.bucketId !== 'string' || typeof object.path !== 'string' || typeof object.mimeType !== 'string' || typeof object.base64 !== 'string')
          throw new HttpError(400, 'invalid storage object');
        if (!ALLOWED_BUCKETS.has(object.bucketId)) throw new HttpError(400, 'invalid storage object bucket');
        validateObjectPath(object.path);
        if (!ALLOWED_MIME_TYPES.has(object.mimeType)) throw new HttpError(400, 'invalid storage object MIME type');
        const key = `${object.bucketId}\u0000${object.path}`;
        if (seenObjects.has(key)) throw new HttpError(400, 'duplicate storage object');
        seenObjects.add(key);
        let bytes: Uint8Array;
        try { bytes = decode(object.base64); }
        catch { throw new HttpError(400, 'invalid storage object encoding'); }
        if (!validImageMagic(object.mimeType, bytes.subarray(0, 12))) throw new HttpError(400, 'storage object signature does not match its image type');
        totalBytes += bytes.byteLength;
        if (totalBytes > MAX_BACKUP_BYTES || bytes.byteLength !== Number(object.byteSize)) throw new HttpError(400, 'invalid or oversized storage object');
        const metadata = metadataByObject.get(key);
        if (!metadata || metadata.byteSize !== bytes.byteLength || metadata.mimeType !== object.mimeType)
          throw new HttpError(400, 'storage object does not match media metadata');
        return { bucketId: object.bucketId, path: object.path, mimeType: object.mimeType, bytes };
      });
      if (seenObjects.size !== metadataByObject.size) throw new HttpError(400, 'backup must contain every media object');
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
