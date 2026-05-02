# Upgrade prompt: `@open-elements/ui` 0.5.x → 0.6.0

`@open-elements/ui` 0.6.0 is a purely additive release. It promotes six components that were hardened inside `open-crm` into the shared design system. No `peerDependencies` changed, no exports were removed, no APIs were renamed.

The point of upgrading is twofold:

1. Get the version bump in so the consumer is on the latest line.
2. Find and delete local copies of these components in the consumer repo, replacing them with imports from `@open-elements/ui`.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.6.0` and replace any local copies of the newly promoted components with imports from the library.

### What changed in 0.6.0

Six new components are exported from `@open-elements/ui`. They use semantic tokens (`primary`, `destructive`, `muted-foreground`) so brand overrides keep working from `brand.css`.

| Export                  | Purpose                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ActionIconButton`      | Tiny inline icon button with `default` \| `success` tones. Auto-`stopPropagation`, no chrome. Building block for the buttons below.                                                                                                  |
| `CopyToClipboardButton` | Composes `ActionIconButton` with a 2 s `Copy` ↔ `Check` feedback animation.                                                                                                                                                          |
| `MailtoButton`          | Opens a `mailto:` URL via `ActionIconButton`.                                                                                                                                                                                        |
| `ExternalLinkButton`    | Opens a URL in a new tab with `noopener,noreferrer`.                                                                                                                                                                                 |
| `TooltipIconButton`     | Ghost icon `Button` wrapped in `Tooltip`, `default` \| `destructive` tones. Includes the disabled-button-needs-`<span>` Tooltip workaround and an `asChild` variant for navigation use cases. Also exports `TooltipIconButtonProps`. |
| `TablePagination`       | `Select` + per-page label + plural-aware total + prev/next (only when `totalPages > 1`). Owns the `localStorage` write for the page-size preference. Also exports `PaginationTranslations`.                                          |

There are **no** breaking changes, **no** removed exports, and **no** dependency manifest changes. If you only bump the version and run `pnpm install`, everything will still work.

### Steps

1. **Find the consumer's frontend package.json.** Usually `package.json` at repo root or under `frontend/`. Confirm `@open-elements/ui` is listed.

2. **Bump `@open-elements/ui` to `^0.6.0`** in that `package.json`, then run:

   ```bash
   pnpm install
   ```

3. **Search for local re-implementations** that should be replaced by the new exports. The `open-crm` repo is the most likely candidate — these components started life there. For each component, grep the source directory:

   ```bash
   for name in "ActionIconButton" "CopyToClipboardButton" "MailtoButton" \
               "ExternalLinkButton" "TooltipIconButton" "TablePagination"; do
     echo "=== $name ==="
     grep -rn "$name" src --include="*.ts" --include="*.tsx" 2>/dev/null
   done
   ```

   For each match, decide:
   - **Local file defines the component** (`export function ActionIconButton`, etc.) → this is a candidate for deletion. Continue with step 4.
   - **Local file imports from `@open-elements/ui`** → already migrated, skip.
   - **Local file imports from a relative path** (`./action-icon-button`, `../components/...`) → the import target is the candidate; rewrite to `@open-elements/ui`.

4. **For each candidate local component, verify behavioural parity** before deleting. Open the local file alongside the library version and confirm:
   - Same props, same defaults (`tone = "default"`, etc.).
   - Same className strings / tone tokens.
   - Same side effects (e.g. `event.stopPropagation()`, `noopener,noreferrer`, `localStorage.setItem`).
   - For `TooltipIconButton`: does the local version support the disabled-`<span>` workaround and the `asChild` variant? If your local copy is simpler, the library version is a strict superset — safe to switch.
   - For `TablePagination`: does the local version own the `localStorage` write, hide prev/next when `totalPages <= 1`, and use plural-aware totals via `{count}` interpolation? If yes → drop-in. If your local copy uses a different pluralisation strategy or a different storage key shape, **stop and ask the user** before changing behaviour.

   If parity holds:
   - Delete the local component file (and its test file, if any).
   - Rewrite all imports to `import { Foo } from "@open-elements/ui";`.

   If parity does **not** hold (the local copy has extra props, different tones, custom analytics hooks, etc.), leave it alone and add a TODO comment pointing at the new library export so the divergence is visible.

5. **Type-only re-exports.** If consumer code imports `TooltipIconButtonProps` or `PaginationTranslations` from a local path, switch those imports to `@open-elements/ui` too — both types are exported from the library.

6. **Verify nothing broke.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

7. **Commit** with a clear message, e.g.:

   ```
   chore(deps): upgrade @open-elements/ui to 0.6.0

   Replace local <list> with the promoted exports from the design system.
   ```

   If you only did the version bump and found no local duplicates, say so:

   ```
   chore(deps): upgrade @open-elements/ui to 0.6.0

   No consumer changes required — purely additive release.
   ```

### Guard rails

- **Do not** change the public API of the consumer app while doing this upgrade. Replacing a local `TooltipIconButton` with the library one is fine; renaming consumer-facing props or changing UX is out of scope.
- **Do not** delete a local component just because its name matches a new export. Verify behavioural parity first (step 4).
- **Do not** remove `peerDependencies` — `peerDependencies` did not change in 0.6.0. If you find peer-dep cleanup work to do, it belongs in the 0.5.0 upgrade pass (`docs/upgrade-to-0.5.md`), not this one.
- **Do not** bump unrelated dependency versions in the same change.

### Don't do this

- Do not refactor existing components that consume the new exports. Just swap the import; styling and layout stay as-is.
- Do not edit `@open-elements/ui` from the consumer side. If a local component has extra behaviour that the library version lacks, open an issue against the UI lib instead of monkey-patching.
- Do not bundle this upgrade with feature work in the same PR. Keep the dependency bump and the local-duplicate cleanup focused.
