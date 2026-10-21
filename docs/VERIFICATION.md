# Dorami verification record

Date: 2026-10-21 (Asia/Seoul). Scope: local source, local Supabase, and synthetic test content only. **No public Pages deployment or real post migration was performed.** “Local pass” below does not assert that the hosted account, secrets, or live URL have been configured.

## Checks run

- Type and Astro diagnostics: `npm run check`.
- Client and security unit tests: `npm test`.
- Static build: `npm run build` using the empty production snapshot.
- Database policy and state tests: `npx supabase test db` against real local Postgres.
- Edge integration: synthetic media promotion and rollback, backup/restore and retry, comment moderation and visibility, and page-view aggregation.
- Browser: public home and synthetic long-article preview at 1280px and 360px, actual local owner sign-in via Mailpit, persistent draft save/reload, mobile overflow, SUIT font loading, and reduced-motion rabbit state.

Synthetic visual fixtures live only in `tests/fixtures/`. They are not included in `src/data/public-snapshot.json` or the public build.

## Acceptance matrix

| ID | Local result | Evidence and remaining limit |
| --- | --- | --- |
| A01 | Local pass | Owner browser login, draft save, reload, and last server version restored. One edit caused one save RPC after the autosave regression fix. |
| A02 | Local pass | Postgres RLS denies anonymous draft reads; static public snapshot contains no drafts. Hosted permissions remain to be configured. |
| A03 | Local pass / hosted pending | Explicit publish creates an immutable publication in local DB. No live Pages deploy was requested. |
| A04 | Local pass | DB tests confirm saving a draft does not change the current publication. |
| A05 | Local pass with pointer caveat | Category cycle, transactional reorder and safe move-on-delete pass in DB. Admin has drag and keyboard move controls; a browser-dispatched drag event reordered real local rows through the RPC. The automation's physical drag gesture timed out, so a manual pointer check remains. |
| A06 | Local pass | Stable post ID and slug alias tests preserve old links after a slug change. Public latest/curated sorting and pinned ordering were checked in a synthetic browser preview. |
| A07 | Partial | Editor and renderer support structured Korean text, highlighted code, table, toggle, image attributes and media. A simple Korean draft reopened from the server in browser; all block variants have not been browser round-tripped. |
| A08 | Fixture pass / real sample pending | Synthetic Notion ZIP with Markdown and images imports as drafts with missing-image warnings. No real Notion export was supplied. |
| A09 | Awaiting real sample | HTML/paste fallback exists; actual Tistory backup format and representative post were not supplied. Original site remains unchanged. |
| A10 | Local pass | Browser offline mode showed 연결 끊김, kept the new summary in the per-post recovery copy, then saved after reconnection; reload returned the same server content. Recovery choice after a separate conflict was not exercised. |
| A11 | Local pass | Optimistic version conflict is tested on real Postgres; stale writes are rejected. |
| A12 | Local pass | Full JSON backup with media binaries restores into an empty target as unpublished; forced second-upload failure leaves zero DB rows and retry succeeds. |
| A13 | Local pass | Public home/article and authenticated admin list/editor at 360px had no page horizontal overflow. The long Korean title remained readable in the admin list. |
| A14 | Local pass | Reduced motion and manual pause retain a static rabbit working pose in browser. |
| A15 | Local pass | Import tests reject ZIP traversal, executable HTML, and unsafe links; manifest sanitizer rejects executable nodes and URLs. |
| A16 | Local pass / hosted pending | Build manifest selects public fields only; synthetic private sentinels are excluded in tests. Hosted artifact audit remains pending. |
| A17 | Local pass | Edge integration submits pending comment, owner approves/deletes, and public re-read reflects storage. |
| A18 | Local pass | Edge integration blocks new comments while preserving or hiding existing comments per setting. |
| A19 | Local pass | Unpublished post comment GET/POST are denied by API, not only hidden in UI. |
| A20 | Local pass | Comments use stable post UUID; title/category/slug changes do not change the key. |
| A21 | Local pass | Anonymous analytics RPC denied by Postgres policy. |
| A22 | Local pass | One accepted public view produced one owner-only `Asia/Seoul` aggregate; browser count is labelled page views. |
| A23 | Local pass | Local preview and authenticated owner view events were ignored. |
| A24 | Local pass | Synthetic article remained readable when the comments API was unavailable. |
| A25 | Partial | UI has distinct no-data/configuration/failure states; hosted failure behavior remains unverified. |
| A26 | Local pass | Public home and article were compared in browser with the approved typography/layout; comments sit below the article, with no likes or public counts. |

## External prerequisites

1. A hosted Supabase project, region and plan selection, plus one owner Auth UUID and secrets.
2. GitHub repository write access, Actions secrets, and Pages publishing source setup.
3. A real Notion export ZIP and Tistory backup or representative HTML for migration fidelity checks.
4. A separate explicit request before live deployment or real post publication.

Current GitHub connector access to `Clotilde030603/clotilde030603.github.io` is read-only, and the local GitHub CLI credential for that account is invalid. The code remains on the local `codex/dorami-blog` branch until access and the separate publication decision are resolved.
