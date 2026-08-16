# Design: Component showcase

**GitHub Issue:** — (to be created)
**Target release:** tooling only — no published version bump

## Summary

The library ships 58 exports across roughly 30 components and is consumed by two applications, but there is no way to look at a component without building an app around it. The Markdown components make that gap concrete: specs 001–003 are implemented and their unit tests pass, yet nobody has seen a task list render inside a `prose` container, and the interactive-checkbox behaviour from spec 003 is verified by calling `onReadOnlyChecked` directly under jsdom rather than by clicking anything.

This spec adds a Storybook-based showcase: a browsable, interactive catalogue of the components, with Tailwind wired up so they look the way they will look in a consuming app, and a self-hosted deployment on Coolify so the two consumer teams can reach it.

## Goals

- Every component can be opened in isolation, with its props adjustable at runtime.
- Components render with real Tailwind styling, including the `prose` typography `MarkdownView` depends on.
- The asynchronous behaviour of `MarkdownView.onChange` — latency, success, failure, rollback — is explorable without a backend.
- Interaction scenarios from specs 002 and 003 run as automated checks in a real browser.
- The showcase is reachable as a deployed site on our Coolify instance.
- Nothing about the published npm package changes.

## Non-goals

- **No stories for all components yet.** This spec establishes the infrastructure and the pattern using `MarkdownEditor` and `MarkdownView`. The remaining components follow incrementally and do not need their own spec.
- **No changes to existing tests.** The vitest suites stay exactly as they are; Storybook interaction tests are additive. Some overlap is accepted in exchange for not putting a green suite at risk.
- **No MSW / HTTP mocking.** See *Mocking a save without a server*.
- **No visual regression testing.** Chromatic or equivalent snapshotting is a separate decision.
- **No change to `package.json` `dependencies` or `peerDependencies`.** Everything lands in `devDependencies`.

## Technical approach

### Storybook 10 with the Vite builder

`storybook` and `@storybook/react-vite` at 10.5.8 — the current major, despite the initial discussion saying "Storybook 9". Addons: `@storybook/addon-docs` for autodocs and `@storybook/addon-a11y`, the latter specifically because spec 002 introduced `aria-label` on up to fourteen icon-only toolbar buttons and nothing verifies them today. Controls, actions and viewport are part of core in this major and need no separate packages.

Vite 7.3.2 and `@vitejs/plugin-react` are already installed as vitest dependencies, so the builder has what it needs.

**Rationale for Storybook over a hand-built playground:** with ~30 components, a custom demo page becomes a worse Storybook — navigation, prop controls and state variants all hand-rolled. The decisive argument is the interaction tests: `play` functions drive real clicks in a real browser, which is exactly what the checkbox behaviour in spec 003 needs and what jsdom cannot give.

### Stories live outside `src/`

Stories go into a top-level `stories/` directory, not next to their components.

**Rationale:** `package.json` declares `files: ["dist", "src"]`, so everything under `src/` is published, and the README states consumers compile the raw `.tsx` themselves. A colocated `markdown-editor.stories.tsx` would therefore ship to consumers and break their `tsc` run with unresolvable `@storybook/*` imports. Excluding stories from `tsconfig.build.json` would keep them out of `dist/` but not out of the tarball. A directory outside `src/` avoids the whole class of problem and needs no exclude rules.

```
stories/
├── markdown-editor.stories.tsx
├── markdown-view.stories.tsx
└── support/
    └── use-mock-save.ts
```

### Tailwind, for the first time in this repo

Tailwind is currently installed nowhere. `src/styles/brand.css` uses v4 `@theme` syntax but is only ever copied to `dist/`, never compiled. Components reference utility classes and `prose prose-sm` (`markdown-view.tsx:116`) that only exist once a consumer compiles them.

The showcase installs `tailwindcss` 4.3.3, `@tailwindcss/vite` and `@tailwindcss/typography` 0.5.20, with a single stylesheet loaded by Storybook's preview:

```css
/* .storybook/preview.css */
@import "tailwindcss";
@import "../src/styles/brand.css";
@plugin "@tailwindcss/typography";
@source "../src";
@source "../stories";
```

The `@source "../src"` line is the point: it is the same content-scanning configuration the consuming apps must have, and spec 001 recorded it as an unverified precondition. If the showcase renders correctly, that assumption is confirmed; if task list checkboxes come out with `prose` bullets attached, the assumption was wrong and it surfaces here rather than in an app.

**Rationale for `@tailwindcss/typography`:** `MarkdownView` hardcodes `prose prose-sm`. Without the plugin, headings, lists and blockquotes render unstyled and the showcase would misrepresent what consumers see.

### Mocking a save without a server

The components speak callbacks, not HTTP. `MarkdownView.onChange` returns `void | Promise<void>`, and everything spec 003 specifies — optimistic flip, disabled state while pending, rollback on rejection — hangs off that Promise. A mock save is therefore a function, not a server:

```ts
// stories/support/use-mock-save.ts
export function useMockSave({ latencyMs, failNext }: MockSaveOptions) { … }
```

exposed through Storybook args so latency and "the next save fails" are switchable from the Controls panel while clicking around.

**Rationale for not using MSW:** an HTTP layer would add a mock `fetch` boundary that no component in this library crosses. It would test the story's own plumbing, not the component. If a future component talks HTTP directly, MSW gets added then.

### Interaction tests

`play` functions cover the scenarios that jsdom verifies only indirectly:

| Scenario | From |
|----------|------|
| Declared toolbar actions render, in order; `toolbar={[]}` renders no toolbar | 002 |
| Without `"taskList"`, `Mod-Shift-9` and typing `[ ] ` create nothing; with it, both work | 002 |
| Every toolbar button is findable by its accessible name | 002 |
| Clicking a checkbox reports updated Markdown with exactly one marker changed | 003 |
| All checkboxes are disabled while a save is pending, and further clicks are ignored | 003 |
| A rejected save reverts the document | 003 |

These duplicate parts of the existing vitest suites on purpose. The vitest versions assert the logic; the `play` versions assert that a user's actual click reaches it.

### Deployment to Coolify

A multi-stage `Dockerfile` at the repository root builds the static Storybook and serves it with nginx:

```dockerfile
FROM node:24-alpine AS build
# corepack + pnpm, pnpm install --frozen-lockfile, pnpm build-storybook
FROM nginx:alpine
COPY --from=build /app/storybook-static /usr/share/nginx/html
```

Coolify is configured as an Application pointing at this repository with the Dockerfile build pack, auto-deploying on push to `main`.

**Rationale for a Dockerfile over Coolify's static build pack:** the static build pack keeps the build command and publish directory in Coolify's UI, outside version control and invisible to anyone reading the repository. A Dockerfile is versioned, reviewable, and reproducible locally with `docker run`. Node is pinned to 24 to match `.nvmrc`.

A `.dockerignore` excludes `node_modules`, `dist` and `storybook-static` so the build context stays small and the image never picks up a stale local build.

### Access control via Authentik forward auth

The showcase is not public. Access is enforced in the proxy, not in the application — the static build needs no awareness of it.

Authentik gets a **Proxy Provider** in *Forward auth (single application)* mode, bound to an Application and served by the embedded outpost. In Coolify, the deployed application carries custom Traefik labels attaching a `forwardauth` middleware pointing at the outpost's `/outpost.goauthentik.io/auth/traefik` endpoint, plus a router exposing `/outpost.goauthentik.io/` on the same host.

**Rationale for SSO over basic auth:** in Coolify both are configured the same way — a Traefik middleware label on the application — so SSO costs essentially nothing extra. What it buys is group-based access for the two consumer teams instead of a shared password, and no credential to rotate or leak.

**Environment-dependent, to confirm before implementing:** whether the Coolify instance proxies with Traefik or Caddy (Caddy uses a `forward_auth` directive instead of labels), and whether Authentik and the showcase container share a Docker network — if not, the forward-auth address has to be Authentik's public URL.

### Scripts

```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

CI is left alone. Adding `build-storybook` to `ci.yml` would roughly double pipeline time to guard tooling; if stories start breaking silently, it gets added then.

## Dependencies

All in `devDependencies`: `storybook`, `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y` (10.5.8), `tailwindcss`, `@tailwindcss/vite` (4.3.3), `@tailwindcss/typography` (0.5.20).

## Risks

- **Tailwind's `@source` scanning of `src/`** may miss classes built dynamically through `cn()`. Anything that renders wrong in the showcase is a genuine finding about the consuming apps, not a showcase bug.
- **Installing Tailwind at the repository root** is new here. It must not leak into the published package: it stays a devDependency and no build script consumes it.
## Verified compatibility

Checked against the registry rather than assumed:

| | `@storybook/react-vite@10.5.8` |
|---|---|
| `vite` | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` — installed 7.3.2 |
| `react` / `react-dom` | `^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` — installed 19.2.5 |
| `typescript` | `>= 4.9.x` — installed 5.x |
| `engines` | none declared; `.nvmrc` pins Node 24 |

Storybook 9.1.20 would also work, but declares React 19 only through a `^19.0.0-beta` range and does not know Vite 8. There is no compatibility reason to stay on 9.

The interaction-test utilities are imported from `storybook/test`, a subpath export of the core package. `@storybook/test` is not published for 10.x.

## Open questions

- Which hostname does the showcase get on the Coolify instance, and who configures the DNS entry?
- Does the Coolify instance proxy with Traefik or Caddy, and can Authentik reach the showcase container over a shared Docker network? Both determine the exact shape of the forward-auth configuration.
