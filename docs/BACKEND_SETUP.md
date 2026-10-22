# Dorami protected backend

The public GitHub Pages build contains only an immutable public snapshot. Supabase is the canonical store for private drafts, revisions, owner-only media, comments, deployment state, and page-view events. No hosted project or public deployment is configured by this repository.

## Local setup

1. Start Docker Desktop or another Docker-compatible runtime.
2. Run `npx supabase start`. Use `npx supabase db reset` only against a fresh disposable local test database: it deletes all local database content before reapplying migrations. Run `npx supabase test db` for the pgTAP authorization/state tests.
3. Copy the local API URL and publishable key into `.env.local` as `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put the service-role key or any function secret in a `PUBLIC_*` variable.
4. Serve functions with the secrets below. Local function configuration lives in `supabase/config.toml`.

The migrations create private `draft-media` and public `published-media` buckets. Both accept JPEG, PNG, WebP, or GIF up to 20 MiB. A draft stores private media IDs; publication is responsible for copying used files to the public bucket.

## Owner provisioning

Sign-up is disabled. Create the single Auth user from a trusted Supabase dashboard/admin path, copy its immutable Auth UUID, and insert that exact UUID into `owner_accounts` using the SQL editor while acting as project administrator:

```sql
insert into public.owner_accounts(user_id)
values ('00000000-0000-4000-8000-000000000000');
```

Replace the example UUID. Do not base owner access on an email string, JWT login state, or a client-side flag. All owner policies call `is_owner(auth.uid())`; any other authenticated user receives no owner data.

## Function secrets

Configure these as Supabase Edge Function secrets:

| Secret | Purpose |
| --- | --- |
| `COMMENT_HASH_SECRET` | Keyed, short-lived comment rate-limit identifier. |
| `ANALYTICS_HASH_SECRET` | HMACs the random first-party session ID; raw IDs/IPs are not stored. |
| `BUILD_MANIFEST_TOKEN` | Shared only with the GitHub Action that downloads one deployment manifest. |
| `GITHUB_ACTIONS_TOKEN` | Optional fine-grained credential restricted to dispatching the Pages workflow. |
| `GITHUB_REPOSITORY` | Defaults to `Clotilde030603/clotilde030603.github.io`. |
| `GITHUB_WORKFLOW_FILE` | Defaults to the tracked `pages.yml`. |
| `ALLOWED_ORIGINS` | Comma-separated site/admin origins. |
| `REMOTE_IMAGE_TRUSTED_HOSTS` | Optional comma-separated exact HTTPS hosts added to the built-in Tistory/Kakao CDN allowlist. Do not add arbitrary user-controlled hosts. |

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. The service role is used only inside functions.

The Pages GitHub Action separately needs repository secrets `SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the same `BUILD_MANIFEST_TOKEN`. The build exposes only the URL and publishable key as `PUBLIC_*`; it must never receive the service-role key.

## Data contract

- `posts.id` is the stable identity used by comments and analytics. Slug/title/category changes do not sever those records.
- Changing a non-draft slug automatically records the former value in `slug_aliases`. A slug reserved by another post's alias cannot be reused. Deployment manifests expose only aliases for currently published posts as `{slug,postId,targetSlug}`.
- `drafts` is the current private working copy. Its structured document is `{schemaVersion:1,content:TiptapJSON}`.
- Image nodes use `attrs.mediaId` as the canonical stable asset reference. `attrs.src` may be a short-lived signed private URL while editing; publication rewrites both fields to the promoted public asset. `mediaAssetId` and `dorami-media:` are not supported contracts.
- `save_draft(...)` updates only when `p_expected_version` matches and raises SQLSTATE `40001` on conflict. A successful call increments the server version and creates `draft_versions` history.
- `publications` is append-only to the browser. `publish-dispatch` promotes private media, then calls `publish_post(post_id, expected_version, published_document, published_cover_id)` to copy the exact saved metadata with the safe public document, change the public pointer, and freeze the full public snapshot in `deployments.manifest` transactionally.
- `unpublish_post(post_id)` clears the dynamic public pointer immediately and freezes a removal deployment. A Pages copy remains reachable until that deployment finishes; already cached/copied public content cannot be recalled.
- Drafts, publication history, deployment manifests, and raw view events are owner-read-only through RLS. Writes occur through checked RPCs or trusted functions.

Owner RPCs:

```text
create_draft_post(p_title?, p_category_id?) -> post UUID
save_draft(p_post_id, p_expected_version, p_title, p_summary, p_category_id,
           p_tags, p_document, p_cover_media_id?, p_original_created_at?, p_source_url?) -> draft
publish_post(p_post_id, p_expected_version, p_published_document, p_published_cover_media_id?) -> {publication_id, deployment_id}
unpublish_post(p_post_id) -> deployment UUID
restore_draft_version(p_post_id, p_version) -> new current draft version
restore_publication_to_draft(p_publication_id,p_private_document,p_private_cover_media_id?) -> distinct new private post UUID (internal; UI uses restore-publication Edge)
analytics_summary(p_from, p_to) -> {timezone:'Asia/Seoul',metric:'page_views',total,daily,posts}
delete_category(p_category_id,p_move_to_id?) -> {movedDrafts,movedChildren,affectedPublications,requiresPublicationRefresh}
export_backup() / restore_backup(p_backup)
```

## Edge API

- `public-comments GET ?postId=<uuid>` returns `{enabled,visible,comments:[{id,parentId,nickname,body,website,createdAt}],hasMore}` only for a currently published post and returns at most 200 recent comments. `POST` accepts `{postId,parentId?,nickname,body,website?}` and returns `{comment:{id,status,createdAt}}` after storing a `pending` comment with length, markup, parent, publication, policy, and rate-limit checks. The rate-limit key is an HMAC of Supabase Edge's `cf-connecting-ip`; the count and insert execute atomically in a service-role-only Postgres function. Owner RLS can approve, mark spam, soft-delete, or purge comments.
- `record-view POST {postId,sessionId}` accepts only configured browser origins and records a page view only for a current publication. The five-minute post/session bucket removes rapid duplicates. A separate keyed HMAC of Supabase Edge's `cf-connecting-ip` enforces 60 accepted attempts per minute through an atomic service-role-only Postgres function without storing the raw address; changing fabricated session IDs cannot bypass that bound. Localhost, common bots, and authenticated owner views are ignored. This is a page-view metric, not a claim about unique people. UTC events are reported on `Asia/Seoul` date boundaries.
- `publish-dispatch POST {action?:'publish'|'unpublish',postId,expectedVersion?}` promotes every referenced private media object to `published-media`, rewrites media IDs/URLs in a separate publication document, performs the database transition, and optionally dispatches `pages.yml`. Unresolved import assets, missing private objects, unsafe media URLs, and stale versions stop publication. Missing GitHub setup is returned as `dispatchConfigured:false`; it is not reported as a live deployment. The admin UI should use this endpoint rather than calling `publish_post` directly.
- `admin-manifest POST {deploymentId?,liveOnly?}` accepts either an owner JWT or `x-build-token`. It returns `{deployment,manifest}`. CI must verify `manifest.deploymentId` matches its input before building. Owner public-export flows use `liveOnly:true`; when no live deployment exists, the endpoint returns 404 instead of exporting requested/failed/superseded data.
- `deployment-status POST {deploymentId,status,githubRunId?,errorMessage?}` requires `x-build-token` and lets only CI mark the stored deployment `building`, `live`, or `failed`.
- `admin-backup GET` returns a `dorami-backup` v1 object plus `storageObjects` containing every media binary as bounded base64. `POST {backup}` validates all metadata/binaries, restores only into an empty target, uploads every file first, then commits the database restore, and keeps every restored post unpublished. Backups over 40 MiB of media are rejected rather than silently omitting files. A failed upload removes objects written by that attempt before any database row is restored; a failed database transaction likewise removes the preuploaded objects.
- `admin-media GET ?mediaId=<uuid>` returns current, historical, published, About, and template references. `POST {mediaId,replacementMediaId}` requires an already-uploaded distinct private asset and transactionally rewrites only current drafts/About/templates with version bumps; histories/publications and the old object remain intact. `DELETE` removes only an object with no current or historical references.
- `import-remote-image POST {url,altText?}` accepts owner requests only. Hosts must match the exact built-in Tistory/Kakao CDN allowlist or `REMOTE_IMAGE_TRUSTED_HOSTS`; HTTPS/DNS/private ranges/redirects, MIME signature, response time, and a 10 MiB streaming ceiling are enforced before the object enters `draft-media`.
- `restore-publication POST {publicationId,mode:'new'}` is the protected restore path. It clones every published media object to a fresh private Storage object and ID, rewrites the restored document and cover to short-lived private URLs, then creates a distinct unpublished draft transactionally. `mode:'current'` additionally requires `postId` and restores into that post's working draft. A failure removes every object and metadata row created by that attempt; immutable publications remain unchanged.

Published post manifest entries include the live `pinned` and `position` values from `posts`. Static consumers must use those fields for curated ordering instead of deriving an order from publication timestamps.

Public comment/view calls are independent of article rendering. Their failure must be shown as a local status and must never prevent the static body from being read.

## Deployment status

Database publish success means a deployment was **requested**, not that Pages is live. The workflow should update `deployments.status` through a trusted server route as it moves through `building`, `live`, or `failed`. The current source includes the immutable manifest and dispatch boundary; no production secrets, Pages setting, hosted project, or real post has been created.

Stored deployment status values are `requested`, `building`, `live`, `failed`, and `superseded`. `superseded` is terminal and means CI must cancel that older snapshot without deploying it.

Publish and unpublish take a database advisory lock, mark older requested/building deployments `superseded`, and then freeze the new snapshot. `admin-manifest` and `deployment-status` return HTTP 409 for a superseded deployment; the status endpoint also rejects an older deployment when a newer row exists. CI must treat 409 as a clean cancellation and never deploy or mark that snapshot live. An unpublish transaction clears the post pointer before its manifest is built, so the removed article is absent from that snapshot.

## Verification and current limits

- `npx vitest run tests/backend` checks security-sensitive source contracts without a running service.
- `npx supabase test db` runs `supabase/tests/database/dorami_backend.test.sql` against real Postgres and verifies owner authorization, optimistic conflicts, draft/public separation, frozen manifests, category-cycle rejection, analytics, backup shape, unpublish, and anonymous draft denial.
- Edge integration scripts additionally require `DORAMI_TEST_SUPABASE_URL`, `DORAMI_TEST_ANON_KEY`, `DORAMI_TEST_SERVICE_ROLE_KEY`, `DORAMI_TEST_OWNER_EMAIL`, and `DORAMI_TEST_OWNER_PASSWORD` in the local shell. The repository contains no fallback password. Use a disposable local-only Auth identity and never reuse production credentials.
- The current local run applied all four migrations and `npx supabase test db` passed 22/22 real Postgres tests. `tests/backend/media-publish.integration.mjs` passed unresolved-import rejection, two-object promotion compensation, public rewrite, and successful retry. `tests/backend/backup-restore.integration.mjs` passed forced second-upload failure, pre-database compensation, and clean retry with both media rows/objects restored. `tests/backend/comments-analytics.integration.mjs` passed pending comment submission, owner approval/deletion, write blocking with optional existing-comment visibility, unpublish denial, one real page-view aggregate, anonymous analytics denial, and preview/owner exclusion.
- `pg_cron` removes raw view events after 30 days each day at 03:17 Asia/Seoul (18:17 UTC); aggregates are calculated from retained raw events in this initial version.
- Notion/Tistory import parsing is client-side work; server import job/warning tables record results but do not invent an unsupported Tistory backup parser.
