# Dorami

Dorami is Clotilde's personal security blog. The intended public address is [clotilde030603.github.io](https://clotilde030603.github.io). This repository contains the public reading site and a separate owner workspace for writing and managing content.

The initial public site can be deployed from `main` with the manual `bootstrap-pages.yml` workflow. It shows an empty post list until the protected service and a real publication are configured. No Tistory or Notion posts are migrated or published by the starter deployment.

## How it is built

- Astro builds public articles, categories, search, RSS, sitemap, and the `/admin/` shell for GitHub Pages.
- React and Tiptap provide the owner editor and management screens.
- Supabase Auth, Postgres, Storage, and Edge Functions hold private drafts, immutable published revisions, media, comments, and owner-only analytics. GitHub Pages alone does not store protected data.
- The manual `bootstrap-pages.yml` workflow deploys the initial empty public site without private credentials. After the protected service is configured, a separate manual `pages.yml` workflow builds one immutable publication manifest and deploys it to Pages. Pushing source alone triggers neither workflow.

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

The starter deployment contains no imported or real posts. Hosted Supabase project setup, GitHub secrets, and real post migration remain separate setup work. Both workflows are manual so a source push cannot silently publish content.
