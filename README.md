# Dorami

Dorami is Clotilde's personal security blog. The intended public address is [clotilde030603.github.io](https://clotilde030603.github.io). This repository contains the public reading site and a separate owner workspace for writing and managing content.

**Current state:** the implementation is being verified locally. The existing GitHub repository has not been pushed or publicly deployed by this work, and no Tistory or Notion posts have been migrated or published.

## How it is built

- Astro builds public articles, categories, search, RSS, sitemap, and the `/admin/` shell for GitHub Pages.
- React and Tiptap provide the owner editor and management screens.
- Supabase Auth, Postgres, Storage, and Edge Functions hold private drafts, immutable published revisions, media, comments, and owner-only analytics. GitHub Pages alone does not store protected data.
- A manual `workflow_dispatch` GitHub Action can build one immutable public manifest and deploy it to Pages after the protected service is configured. Pushing source alone does not trigger that workflow.

The approved appearance uses SUIT, a light matcha palette, the supplied rabbit identity, and a reduced-motion option. The current public snapshot is empty until a real publication is explicitly made. Synthetic example content exists only under `tests/fixtures/` for local visual checks.

## Local development

```sh
npm ci
npx supabase start
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the **local API URL and publishable key only** from `npx supabase status -o env`. See [backend setup](docs/BACKEND_SETUP.md) for owner provisioning, function secrets, and production setup. Never put a service-role key or secret in a `PUBLIC_*` variable.

On a fresh test database only, `npx supabase db reset` applies all migrations; it deletes existing local data. Do not use it as a normal restart command.

## Verification

```sh
npm run check
npm test
npm run build
npx supabase test db
```

The browser UI and Edge Functions also require the local stack and an owner test account. The [implementation plan](docs/IMPLEMENTATION_PLAN.md), [architecture decision](docs/ARCHITECTURE.md), and [verification record](docs/VERIFICATION.md) track the acceptance criteria and remaining external dependencies.

## Publication boundary

The live blog and the original Tistory site remain untouched. Hosted Supabase project setup, GitHub secrets, Pages configuration, and real post migration require a separate owner decision. The workflow is manual so no source push can silently publish content.
