# Dorami implementation plan

The approved sources are the supplied v2 requirements, design prompt, typography mockup, and rabbit reference. This repository is the existing `clotilde030603.github.io` site. Its public title is Dorami. The work stays local until the owner separately requests public deployment.

## Delivery stages

1. **Architecture and data boundary.** Document how the GitHub Pages client reaches a protected API, where drafts and private media live, how owner authorization works, and how a published revision stays separate from a draft. Record external hosting decisions and secrets as setup items.
2. **Public reading.** Build the approved header, category tree, list, article view, search, paging, RSS entry, responsive layout, and rabbit animation. Public queries must return only published revisions.
3. **Owner workspace.** Implement owner login, post and category management, a structured block editor, autosave with conflict checks, private preview, explicit publish/unpublish, versions, trash, templates, media, and backup/restore.
4. **Import.** Support Notion Markdown/HTML ZIP and pasted content as drafts with warnings; provide Tistory HTML import and validate a real backup parser only when an actual backup format is available.
5. **Comments and analytics.** Store and moderate comments only for published posts. Accept validated public view events and expose aggregates only to the owner. No likes or public counts.
6. **Verification.** Run API authorization/state tests, import security tests, browser flows, mobile and keyboard checks, and screenshot comparison against the approved mockup. Record each A01–A26 outcome and any external dependency.

## Publication boundary

Local preview and tests may use synthetic example data labelled as examples. Do not publish an example post, migrate real posts, change the existing Tistory source, push a live Pages build, or enable public hosting in this work. Any completed source can be reviewed before that separate step.

## Completion evidence

The project is complete only when its working implementation and A01–A26 have been verified against persistent storage and a configured protected service. A screen mockup, browser storage, or unconfigured external integration does not count as completed behavior. Track setup or source-data gaps explicitly.
