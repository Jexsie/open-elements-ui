# Implementation Steps: Markdown toolbar actions

## Step 1: Public type and prop

- [ ] Add `MarkdownToolbarAction` union type to `src/types/index.ts` (14 actions per design)
- [ ] Add `readonly toolbar?: readonly MarkdownToolbarAction[]` to `MarkdownEditorProps` (default documented as `["bold", "italic"]`)
- [ ] Export `MarkdownToolbarAction` from `src/index.ts`
- [ ] Leave `MarkdownViewProps` untouched

**Acceptance criteria:**
- [ ] `pnpm typecheck` passes

**Related behaviors:** Unlink cannot be declared on its own; MarkdownView is unaffected

---

## Step 2: Conditional task-list gate in the factory

- [ ] Add `readonly allowedActions?: readonly MarkdownToolbarAction[]` to `MarkdownExtensionsOptions`
- [ ] Compute `taskListAllowed = (allowedActions ?? []).includes("taskList")`
- [ ] Keep the `tight` attribute on `TaskList` in both cases (round-trip must survive)
- [ ] When not allowed: strip `addKeyboardShortcuts` on `TaskList` and `addInputRules` on `TaskItem` (as spec 001 did)
- [ ] When allowed: keep the default `Mod-Shift-9` shortcut and `[ ] ` input rule
- [ ] Keep `TaskItem` `nested: true` and the styling classes in both cases

**Acceptance criteria:**
- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] Spec 001 round-trip tests still pass unchanged

**Related behaviors:** Without `taskList`, the keyboard shortcut/input rule does nothing; With `taskList`, they work; Existing task lists remain editable/round-trip without the action

---

## Step 3: Toolbar rendering from the allowlist

- [ ] Replace the hardcoded `Toolbar` with an `ACTIONS` record mapping each `MarkdownToolbarAction` to `{ icon, label, isActive, run }`
- [ ] Render one button per action in array order, de-duplicated (first occurrence wins)
- [ ] Give each button both `aria-label` and `title` with the same English string
- [ ] `"link"` keeps the `window.prompt` flow and the contextual Unlink button
- [ ] Render no toolbar element at all when the resolved action list is empty
- [ ] Default the `toolbar` prop to `["bold", "italic"]` and pass it to the factory as `allowedActions`
- [ ] Use lucide icons: Bold, Italic, Strikethrough, Code, Link, Heading1/2/3, List, ListOrdered, ListChecks, Quote, SquareCode, Minus

**Acceptance criteria:**
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm lint` pass

**Related behaviors:** all "Rendering the declared actions" and "Executing actions" scenarios; Every button has an accessible name

---

## Step 4: Factory / extension gate tests

- [ ] Extend `src/lib/__tests__/markdown-extensions.test.ts`
- [ ] Without `taskList`: `Mod-Shift-9` and `[ ] ` create nothing (reuse spec 001 helpers)
- [ ] With `allowedActions: ["taskList"]`: `Mod-Shift-9` and `[ ] ` create a task item
- [ ] With gating: an existing `- [x] Done` still splits on Enter and round-trips unchanged

**Acceptance criteria:**
- [ ] `pnpm test` passes

**Related behaviors:** Task list creation gate (all five scenarios)

---

## Step 5: Component behaviour tests

- [ ] Extend `src/components/__tests__/markdown-editor.test.tsx`
- [ ] Rendering: exactly-declared; order; default (bold+italic only); empty array → no toolbar element; duplicate → one button
- [ ] Executing: H2 transforms block and reports `## Title`; taskList wraps to `- [ ] Call Anna`; active state on bold; Link shows contextual Unlink that disappears on leaving
- [ ] Marks gated at button only: `Mod-b` bolds without the Bold button; typing `**bold**` bolds without the button
- [ ] Accessibility: with all 14 actions, every button has matching `aria-label` + `title` and is findable by accessible name
- [ ] Rendering independent: with `toolbar={["bold"]}`, a loaded heading/blockquote/task list still render as structure

**Acceptance criteria:**
- [ ] `pnpm test` passes

**Related behaviors:** Rendering; Executing; Marks are gated at the button only; Accessibility; Undeclared constructs still render

---

## Step 6: Type-level guarantees

- [ ] Add a type test (e.g. `src/types/__tests__/markdown-toolbar-action.test-d.ts` or `@ts-expect-error` in a `.test.ts`) that `toolbar={["unlink"]}` does not typecheck
- [ ] Assert `MarkdownViewProps` shape is unchanged (structural type assertion)

**Acceptance criteria:**
- [ ] `pnpm typecheck` passes (the `@ts-expect-error` is satisfied)

**Related behaviors:** Unlink cannot be declared on its own; MarkdownView is unaffected

---

## Step 7: Documentation

- [ ] Create `docs/upgrade-to-0.11.md` — breaking change: default toolbar drops to `["bold", "italic"]`; each existing usage must declare the actions it needs; content still renders/round-trips
- [ ] Update `README.md` MarkdownEditor entry to mention the configurable `toolbar` prop

**Acceptance criteria:**
- [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass

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
| Bold stays reachable by shortcut without the button | Frontend | 5 |
| Bold stays reachable by typing without the button | Frontend | 5 |
| Every button has an accessible name | Frontend | 5 |
| Undeclared constructs still render | Frontend | 5 |
| MarkdownView is unaffected | Type | 6 |

Every scenario is assigned. Type-level scenarios (Unlink, MarkdownView) are verified by the typecheck step.
