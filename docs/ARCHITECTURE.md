# Dorami architecture decision

## Decision

Keep the public address on GitHub Pages. Build the public reading surface as static Astro output. Use Supabase Auth, Postgres, Storage, and Edge Functions as the protected service for owner work, comments, and view events. This is the smallest managed setup that gives the one-person blog server-enforced access without operating a VPS. A hosted Supabase account, region, and plan remain owner decisions; this repository contains no project credentials.

## Trust boundaries

- **Public Pages artifact:** HTML/CSS/JS, published post snapshots, public media references, public search index, RSS, and sitemap only. It must contain no draft, private asset URL, owner data, secret, comment moderation record, or analytics event.
- **Browser owner workspace:** `/admin/` is a separately rendered route. The static JavaScript is public, but every data operation requires an Auth session and server-side owner check. A login alone grants no owner role.
- **Supabase:** RLS protects exposed tables and Storage objects. An immutable owner UUID is provisioned outside the public client. Service credentials stay only in Edge Function secrets. All publishing, comment writes, statistics, and backup export cross an Edge Function that validates identity or public eligibility.
- **Build:** an Edge Function exports a single immutable public manifest for a deployment ID. GitHub Actions authenticates with a dedicated build token, downloads that manifest, then builds and deploys Pages. The build token and dispatcher credential are never passed to the client bundle.

## Data and state

`posts.id` is stable across title, category, and slug changes. `drafts` stores a versioned structured document and mutable metadata with an optimistic version number. `publications` stores immutable copies made only by explicit publish. A published post being edited keeps its previous publication pointer. `slug_aliases` preserves old addresses. Categories have stable IDs and tree order; changing or removing a category never deletes posts. `comments` and `view_events` reference post IDs and only public eligibility is exposed.

The internal document format is `{ schemaVersion: 1, content: TiptapJSON }`. Imports and the renderer share that schema. Raw HTML and arbitrary URLs are not stored as executable content. Private media IDs are resolved to short-lived URLs for owner preview; publication copies referenced media to a public bucket.

## Publication sequence

1. Owner saves the draft and receives a confirmed server version.
2. Owner opens a private preview, then explicitly confirms publish.
3. A protected function copies the saved version into an immutable publication, updates the publication pointer, and creates a deployment record in one database transaction.
4. It dispatches a GitHub Action for that deployment ID. The action fetches only the matching public manifest, builds static pages, and deploys Pages. Owner UI reports requested, building, live, or failed separately.
5. Unpublish immediately denies dynamic public API access such as comments and creates a new Pages deployment without the article. Previously cached or copied public pages cannot be recalled; the owner UI must show that lag and limitation.

## Comments and analytics

Choose own Postgres comments over an external embed: the public read and write functions can check the live published flag, comment policy, limits, and moderation state on every call. Anonymous comments start in a moderation queue; the form states that policy before submission. The owner can approve, mark spam, soft-delete, or purge.

Only public article views send asynchronous events. The server validates the published post, excludes known bots and authenticated owner requests, and deduplicates repeated events within a short window. The dashboard labels its count as **page views**, not people. Event timestamps are stored in UTC and grouped by `Asia/Seoul`; raw event retention starts at 30 days. No browser fingerprint is collected. Collection failure never blocks reading.

## Alternatives considered

Self-hosted API + database + object storage gives more control but requires the owner to manage runtime, TLS, updates, backups, and monitoring. Cloudflare Workers/D1/R2 could also work, but owner identity, relational versioning, and backup workflows would require more custom implementation. Supabase still requires careful RLS testing and external account setup; its managed Auth/DB/Storage reduces day-to-day maintenance for this one-person site.

## External setup and publication gate

The owner must choose a Supabase project and authenticate one owner UUID; configure Auth, Storage, function secrets, GitHub Action secrets, and Pages source. Prices and plan limits require checking at setup time. No public deployment or migration of real posts occurs until separately requested. Source is available on the review branch `codex/dorami-blog`; `main` and the live Pages site remain unchanged.

Official references: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Actions publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access](https://supabase.com/docs/guides/storage/security/access-control), [Edge Function auth](https://supabase.com/docs/guides/functions/auth).
