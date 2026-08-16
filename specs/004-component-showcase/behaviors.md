# Behaviors: Component showcase

## Running the showcase

### The dev server starts and lists the stories

- **Given** a checkout with dependencies installed
- **When** `pnpm storybook` is run
- **Then** a dev server starts on port 6006
- **And** the sidebar lists entries for `MarkdownEditor` and `MarkdownView`

### Components render with brand styling

- **Given** the showcase is running
- **When** any story is opened
- **Then** the Open Elements brand tokens from `src/styles/brand.css` are in effect
- **And** utility classes used by the components resolve to actual styles rather than being absent

### Task lists render without a duplicated bullet

- **Given** a `MarkdownView` story rendering `- [x] Done\n- [ ] Open`
- **When** the story is displayed
- **Then** each item shows a checkbox and no `prose` list bullet next to it

### Markdown blocks render as typography

- **Given** a `MarkdownView` story containing a heading, a blockquote, a code block and an ordered list
- **When** the story is displayed
- **Then** each block is visually distinguishable, confirming that `@tailwindcss/typography` is active

## MarkdownEditor stories

### The default toolbar shows two actions

- **Given** the story that renders `MarkdownEditor` without a `toolbar` prop
- **When** it is displayed
- **Then** exactly Bold and Italic are offered

### The declared toolbar is rendered in order

- **Given** the story with `toolbar={["h1", "h2", "bulletList", "taskList", "link"]}`
- **When** it is displayed
- **Then** those five buttons appear in that order and no others

### Toolbar actions are adjustable at runtime

- **Given** an open `MarkdownEditor` story
- **When** the `toolbar` arg is changed in the Controls panel
- **Then** the rendered toolbar updates to match without a page reload

### The serialized Markdown is visible while editing

- **Given** the round-trip story
- **When** the user edits the document
- **Then** the current Markdown produced by `onChange` is displayed next to the editor

### Content the toolbar does not offer still renders

- **Given** the story with `toolbar={["bold"]}` loaded with a heading, a blockquote and a task list
- **When** it is displayed
- **Then** all three render as their structures, demonstrating that the toolbar does not gate the schema

## MarkdownView save mock

### A successful save keeps the new state

- **Given** a `MarkdownView` story with the mock save set to succeed after a delay
- **When** the user ticks a checkbox
- **Then** the checkbox flips immediately
- **And** after the delay it stays ticked and the checkboxes become interactive again

### A pending save disables every checkbox

- **Given** a `MarkdownView` story with the mock save latency set high enough to observe
- **When** the user ticks a checkbox
- **Then** all checkboxes in the story are disabled and visually muted until the save settles

### A click during a pending save is ignored

- **Given** a story with a pending mock save
- **When** the user clicks another checkbox
- **Then** its state does not change

### A failing save reverts the checkbox

- **Given** a `MarkdownView` story with "next save fails" enabled
- **When** the user ticks a checkbox and the mock save rejects
- **Then** the checkbox returns to its previous state
- **And** the checkboxes become interactive again

### Latency and failure are switchable without editing code

- **Given** an open `MarkdownView` story
- **When** the latency and failure args are changed in the Controls panel
- **Then** the next save behaves accordingly

### Without `onChange` the checkboxes are inert

- **Given** the read-only `MarkdownView` story
- **When** the user clicks a checkbox
- **Then** it reverts and nothing is reported

## Interaction tests

### Toolbar interaction checks pass

- **Given** the `MarkdownEditor` stories carrying `play` functions
- **When** the interaction tests run
- **Then** the declared-actions, empty-toolbar and accessible-name checks all pass in a real browser

### The task list creation gate is verified by real input

- **Given** the story with `toolbar={["bold", "italic"]}`
- **When** the `play` function presses `Mod-Shift-9` and types `[ ] `
- **Then** no task item is created
- **And** the corresponding story with `"taskList"` declared does create one for the same input

### The checkbox lifecycle is verified by real clicks

- **Given** the `MarkdownView` stories carrying `play` functions
- **When** the interaction tests run
- **Then** clicking, the disabled-while-pending state and the rollback on failure are each asserted after an actual click

### The existing vitest suites are untouched

- **Given** the repository after this spec is implemented
- **When** `pnpm test` is run
- **Then** it passes
- **And** no existing test file has been modified or removed

## Accessibility

### Toolbar buttons expose accessible names

- **Given** a `MarkdownEditor` story declaring all fourteen actions
- **When** the a11y addon analyses the story
- **Then** no violation is reported for buttons lacking an accessible name

## Build and deployment

### The static build succeeds

- **Given** a clean checkout with dependencies installed
- **When** `pnpm build-storybook` is run
- **Then** it completes without error and produces `storybook-static/` containing an `index.html`

### The published package is unaffected

- **Given** the repository after this spec is implemented
- **When** `pnpm build` is run and the package contents are inspected
- **Then** `dist/` contains no story files
- **And** `dependencies` and `peerDependencies` are unchanged
- **And** no `@storybook/*` import is reachable from anything under `src/`

### The container image serves the showcase

- **Given** the `Dockerfile` at the repository root
- **When** the image is built and run locally
- **Then** requesting the root path returns the Storybook entry page

### The build context excludes local artefacts

- **Given** a working copy containing `node_modules`, `dist` and `storybook-static`
- **When** the image is built
- **Then** none of those directories are copied into the build context

### Coolify redeploys on push to main

- **Given** the Coolify application configured against this repository with the Dockerfile build pack
- **When** a commit is pushed to `main`
- **Then** a deployment is triggered and the updated showcase is served

## Access control

### An unauthenticated visitor is sent to Authentik

- **Given** the deployed showcase with the forward-auth middleware attached
- **When** a visitor without a session requests any path
- **Then** they are redirected to the Authentik login flow instead of receiving the page

### A member of the permitted group reaches the showcase

- **Given** a user in the group bound to the showcase application in Authentik
- **When** they complete the login flow
- **Then** they are returned to the requested path and the showcase renders

### A user outside the permitted group is refused

- **Given** an authenticated Authentik user who is not in the bound group
- **When** they request the showcase
- **Then** access is denied and the page is not served

### Assets and the story iframe are covered by the same session

- **Given** an authenticated visitor
- **When** the showcase loads `iframe.html` and its static assets
- **Then** all of them are served without a further login prompt
