# Implementation Steps: Markdown toolbar actions

## Step 1: Public type and prop

- [x] Add `MarkdownToolbarAction` union type to `src/types/index.ts` (14 actions per design)
- [x] Add `readonly toolbar?: readonly MarkdownToolbarAction[]` to `MarkdownEditorProps` (default documented as `["bold", "italic"]`)
- [x] Export `MarkdownToolbarAction` from `src/index.ts`
- [x] Leave `MarkdownViewProps` untouched

**Acceptance criteria:**
- [x] `pnpm typecheck` passes

**Related behaviors:** Unlink cannot be declared on its own; MarkdownView is unaffected

---

## Step 2: Conditional task-list gate in the factory

- [x] Add `readonly allowedActions?: readonly MarkdownToolbarAction[]` to `MarkdownExtensionsOptions`
- [x] Compute `taskListAllowed = (allowedActions ?? []).includes("taskList")`
- [x] Keep the `tight` attribute on `TaskList` in both cases (round-trip must survive)
- [x] When not allowed: strip `addKeyboardShortcuts` on `TaskList` and `addInputRules` on `TaskItem` (as spec 001 did)
- [x] When allowed: keep the default `Mod-Shift-9` shortcut and `[ ] ` input rule
- [x] Keep `TaskItem` `nested: true` and the styling classes in both cases

**Acceptance criteria:**
- [x] `pnpm typecheck` and `pnpm build` pass
- [x] Spec 001 round-trip tests still pass unchanged

**Related behaviors:** Without `taskList`, the keyboard shortcut/input rule does nothing; With `taskList`, they work; Existing task lists remain editable/round-trip without the action

---

## Step 3: Toolbar rendering from the allowlist

- [x] Replace the hardcoded `Toolbar` with an `ACTIONS` record mapping each `MarkdownToolbarAction` to `{ icon, label, isActive, run }`
- [x] Render one button per action in array order, de-duplicated (first occurrence wins)
- [x] Give each button both `aria-label` and `title` with the same English string
- [x] `"link"` keeps the `window.prompt` flow and the contextual Unlink button
- [x] Render no toolbar element at all when the resolved action list is empty
- [x] Default the `toolbar` prop to `["bold", "italic"]` and pass it to the factory as `allowedActions`
- [x] Use lucide icons: Bold, Italic, Strikethrough, Code, Link, Heading1/2/3, List, ListOrdered, ListChecks, Quote, SquareCode, Minus

**Acceptance criteria:**
- [x] `pnpm typecheck`, `pnpm build`, `pnpm lint` pass

**Related behaviors:** all "Rendering the declared actions" and "Executing actions" scenarios; Every button has an accessible name

---

## Step 4: Factory / extension gate tests

- [x] Extend `src/lib/__tests__/markdown-extensions.test.ts`
- [x] Without `taskList`: `Mod-Shift-9` and `[ ] ` create nothing (reuse spec 001 helpers)
- [x] With `allowedActions: ["taskList"]`: `Mod-Shift-9` and `[ ] ` create a task item
- [x] With gating: an existing `- [x] Done` still splits on Enter and round-trips unchanged

**Acceptance criteria:**
- [x] `pnpm test` passes

**Related behaviors:** Task list creation gate (all five scenarios)

---

## Step 5: Component behaviour tests

- [x] Extend `src/components/__tests__/markdown-editor.test.tsx`
- [x] Rendering: exactly-declared; order; default (bold+italic only); empty array → no toolbar element; duplicate → one button
- [x] Executing: H2 transforms block and reports `## Title`; taskList wraps to `- [ ] Call Anna`; active state on bold; Link shows contextual Unlink that disappears on leaving
- [x] Marks gated at button only: `Mod-b` bolds without the Bold button (component); the typing `**bold**` variant is covered at the extension level in Step 4 (literal content cannot be injected through the component's markdown-parsed `value`)
- [x] Accessibility: with all 14 actions, every button has matching `aria-label` + `title` and is findable by accessible name
- [x] Rendering independent: with `toolbar={["bold"]}`, a loaded heading/blockquote/task list still render as structure

**Acceptance criteria:**
- [x] `pnpm test` passes

**Related behaviors:** Rendering; Executing; Marks are gated at the button only; Accessibility; Undeclared constructs still render

---

## Step 6: Type-level guarantees

- [x] Add a type test (e.g. `src/types/__tests__/markdown-toolbar-action.test-d.ts` or `@ts-expect-error` in a `.test.ts`) that `toolbar={["unlink"]}` does not typecheck
- [x] Assert `MarkdownViewProps` shape is unchanged (structural type assertion)

**Acceptance criteria:**
- [x] `pnpm typecheck` passes (the `@ts-expect-error` is satisfied)

**Related behaviors:** Unlink cannot be declared on its own; MarkdownView is unaffected

---

## Step 7: Documentation

- [x] Create `docs/upgrade-to-0.11.md` — breaking change: default toolbar drops to `["bold", "italic"]`; each existing usage must declare the actions it needs; content still renders/round-trips
- [x] Update `README.md` MarkdownEditor entry to mention the configurable `toolbar` prop

**Acceptance criteria:**
- [x] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass

**Related behaviors:** none (documentation)

---

## Behavior Coverage

| Scenario | Layer | Covered in Step |
|----------|-------|-----------------|
| The toolbar renders exactly what was declared | Frontend | 5 |
| Order follows the array | Frontend | 5 |
| Omitting the prop yields the default | Frontend | 5 |
| An empty array renders no toolbar | Frontend | 5 |
| A duplicate entry renders once | Frontend | 5 |
| A block action transforms the current block | Frontend | 5 |
| A list action wraps the current block | Frontend | 5 |
| An active action is marked as active | Frontend | 5 |
| Link keeps its contextual Unlink button | Frontend | 5 |
| Unlink cannot be declared on its own | Type | 6 |
| Without `taskList`, the keyboard shortcut does nothing | Frontend | 4 |
| Without `taskList`, the input rule does nothing | Frontend | 4 |
| With `taskList`, the keyboard shortcut works | Frontend | 4 |
| With `taskList`, the input rule works | Frontend | 4 |
| Existing task lists remain editable without the action | Frontend | 4 |
| Existing task lists still round-trip without the action | Frontend | 4 |
| Bold stays reachable by shortcut without the button | Frontend | 5 (component) + 4 (extension) |
| Bold stays reachable by typing without the button | Frontend | 4 (extension) |
| Every button has an accessible name | Frontend | 5 |
| Undeclared constructs still render | Frontend | 5 |
| MarkdownView is unaffected | Type | 6 |

Every scenario is assigned. Type-level scenarios (Unlink, MarkdownView) are verified by the typecheck step.
