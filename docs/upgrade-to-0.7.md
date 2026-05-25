# Upgrade prompt: `@open-elements/ui` 0.6.x → 0.7.0

`@open-elements/ui` 0.7.0 is a purely additive release. It promotes the prop-driven translation UI (a translate icon button and its dialog) into the shared design system. No `peerDependencies` changed, no exports were removed, no APIs were renamed.

The point of upgrading is twofold:

1. Get the version bump in so the consumer is on the latest line.
2. Find and delete local copies of the translate button / dialog in the consumer repo, replacing them with imports from `@open-elements/ui`.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.7.0` and replace any local copy of the translate button / dialog with imports from the library.

### What changed in 0.7.0

Two new components are exported from `@open-elements/ui`. They are **prop-driven**: the library owns the UI and states, while the consuming app owns the translation backend and the feature toggle.

| Export            | Purpose                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TranslateButton` | Translate icon button placed next to a piece of text. Renders `null` when the text is empty/whitespace/`null`, while the config probe is still in flight (`configured === null`), or when the backend feature is not configured (`configured !== true`). Clicking opens a `TranslateDialog` with the text. Sizes `"sm"` \| `"md"` (default `"md"`). |
| `TranslateDialog` | Prop-driven dialog. When `open` flips to true it calls `onTranslate(sourceText, targetLanguage)`, where `targetLanguage` is `"de"` if the active `useLanguage()` language is `"de"`, else `"en"`. Renders loading / error / success states and a copy button that flashes a "copied" confirmation for ~2 seconds.                                  |

Exported types: `TranslateButtonProps`, `TranslateButtonTranslations`, `TranslateDialogProps`, `TranslateDialogTranslations`, `TranslateResult`.

Contract the app must satisfy:

- **`onTranslate: (text: string, targetLanguage: string) => Promise<TranslateResult>`** — the app owns the actual translation backend. `TranslateResult` is `{ translatedText: string }`.
- **`configured: boolean | null`** (on `TranslateButton`) — whether the backend translation feature is enabled. `null` means the feature-toggle probe is still in flight; the button stays hidden until the answer is known to avoid a flash. The app owns this concern (it hits its own feature-toggle endpoint).
- **`translations`** — all visible strings are passed in (`button`, and the dialog's `title` / `loading` / `error` / `copy` / `copied` / `close`). Nothing is hardcoded.

`TranslateDialog` reads the active language via the library's `useLanguage()`, so it must be rendered inside `<LanguageProvider>` — the same provider already required by the rest of the library's i18n. This is **not** new in 0.7.0; it is an existing prerequisite.

There are **no** breaking changes, **no** removed exports, and **no** dependency manifest changes. If you only bump the version and run `pnpm install`, everything will still work.

### Steps

1. **Find the consumer's frontend package.json.** Usually `package.json` at repo root or under `frontend/`. Confirm `@open-elements/ui` is listed.

2. **Bump `@open-elements/ui` to `^0.7.0`** in that `package.json`, then run:

   ```bash
   pnpm install
   ```

3. **Search for a local re-implementation** of the translate button / dialog. The `open-crm` repo is the most likely candidate — this UI started life there. Grep the source directory:

   ```bash
   for name in "TranslateButton" "TranslateDialog" "onTranslate" "translatedText"; do
     echo "=== $name ==="
     grep -rn "$name" src --include="*.ts" --include="*.tsx" 2>/dev/null
   done
   ```

   For each match, decide:
   - **Local file defines the component** (`export function TranslateButton`, `export function TranslateDialog`) → candidate for deletion. Continue with step 4.
   - **Local file imports from `@open-elements/ui`** → already migrated, skip.
   - **Local file imports from a relative path** (`./translate-button`, `../components/...`) → the import target is the candidate; rewrite to `@open-elements/ui`.

4. **For each candidate local component, verify behavioural parity** before deleting. Open the local file alongside the library version and confirm:
   - Same prop shape, especially `onTranslate(text, targetLanguage) => Promise<{ translatedText }>`.
   - Same `configured` semantics: hidden while `null` (probe in flight) and while not configured; visible only when `configured === true`.
   - Same target-language logic: `"de"` when the active language is `"de"`, else `"en"`.
   - Same "hide on empty/whitespace text" behaviour for the button.
   - Same copy behaviour: writes to the clipboard and flashes a "copied" state for ~2 seconds.
   - If your local copy resolves the target language differently (e.g. more than two languages, or a region-specific code like `"en-US"`), **stop and ask the user** before switching — the library version maps to `"de"`/`"en"` only.

   If parity holds:
   - Delete the local component file(s) (and their test files, if any).
   - Rewrite all imports to `import { TranslateButton, TranslateDialog } from "@open-elements/ui";`.

   If parity does **not** hold (the local copy has extra props, different language handling, custom analytics hooks, etc.), leave it alone and add a TODO comment pointing at the new library export so the divergence is visible.

5. **Type-only re-exports.** If consumer code imports `TranslateButtonProps`, `TranslateDialogProps`, `TranslateResult`, `TranslateButtonTranslations`, or `TranslateDialogTranslations` from a local path, switch those imports to `@open-elements/ui` too.

6. **Verify nothing broke.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

7. **Commit** with a clear message, e.g.:

   ```
   chore(deps): upgrade @open-elements/ui to 0.7.0

   Replace local TranslateButton/TranslateDialog with the promoted exports from the design system.
   ```

   If you only did the version bump and found no local duplicates, say so:

   ```
   chore(deps): upgrade @open-elements/ui to 0.7.0

   No consumer changes required — purely additive release.
   ```

### Guard rails

- **Do not** change the public API of the consumer app while doing this upgrade. Swapping a local translate dialog for the library one is fine; renaming consumer-facing props or changing UX is out of scope.
- **Do not** delete a local component just because its name matches a new export. Verify behavioural parity first (step 4) — translation flows often have app-specific backends.
- **Do not** move the `onTranslate` backend into the library. The library is intentionally backend-agnostic; the app keeps owning the translation request and the feature toggle.
- **Do not** remove `peerDependencies` — `peerDependencies` did not change in 0.7.0. If you find peer-dep cleanup work to do, it belongs in the 0.5.0 upgrade pass (`docs/upgrade-to-0.5.md`), not this one.
- **Do not** bump unrelated dependency versions in the same change.

### Don't do this

- Do not hardcode translation strings. All visible text goes through the `translations` prop.
- Do not edit `@open-elements/ui` from the consumer side. If a local component has extra behaviour the library version lacks, open an issue against the UI lib instead of monkey-patching.
- Do not bundle this upgrade with feature work in the same PR. Keep the dependency bump and the local-duplicate cleanup focused.
