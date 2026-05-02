# Upgrade prompt: `@open-elements/ui` 0.4.x → 0.5.0

`@open-elements/ui` 0.5.0 reorganises its dependency manifest: implementation-detail libraries moved from `peerDependencies` to regular `dependencies` so they install transitively. Consumer apps that listed those libs only to satisfy the peer-dep constraint can now drop them.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.5.0` and remove dependencies that are now transitive.

### What changed in 0.5.0

These libs moved from `peerDependencies` to regular `dependencies` inside `@open-elements/ui`. Consumers no longer need to declare them — they install transitively:

- `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`
- `tiptap-markdown`
- `date-fns`
- `react-day-picker`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`

These remain `peerDependencies` and must stay in the consumer's `package.json`:

- `react`, `react-dom` (Singleton)
- `@base-ui/react`, `radix-ui` (shared React Context — version mismatch breaks providers like `TooltipProvider`)
- `lucide-react` (consumers use icons directly)

### Steps

1. **Find the consumer's frontend package.json.** Usually `package.json` at repo root or under `frontend/`. Confirm `@open-elements/ui` is listed.

2. **Bump `@open-elements/ui` to `^0.5.0`** in that `package.json`.

3. **For each of the 11 libs above, grep the source directory for direct imports** (typically `src/`, exclude `node_modules` and `dist`):

   ```bash
   for pkg in "@tiptap/core" "@tiptap/react" "@tiptap/starter-kit" \
              "@tiptap/extension-link" "@tiptap/extension-placeholder" \
              "tiptap-markdown" "date-fns" "react-day-picker" \
              "clsx" "tailwind-merge" "class-variance-authority"; do
     count=$(grep -rn "from \"$pkg" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
     echo "$pkg: $count direct imports"
   done
   ```

   - **0 direct imports** → remove from `package.json` (both `dependencies` and `devDependencies`).
   - **>0 direct imports** → keep as a direct dependency. The lib is consumer-owned, the new transitive availability is just a bonus.
   - Type-only imports (`import type { ... }`) and `.d.ts` augmentation files count as usage — keep them.

4. **Look for a dead `tiptap-markdown` type augmentation.** Search for:

   ```bash
   grep -rln "declare module \"@tiptap/core\"" src
   ```

   If a file like `src/types/tiptap-markdown.d.ts` exists AND nothing in `src/` calls `editor.storage.markdown`, the augmentation is dead — `@open-elements/ui` 0.5.0 ships its own internal augmentation. Verify:

   ```bash
   grep -rn "storage\.markdown\|storage\[\"markdown" src
   ```

   If only the augmentation file itself matches, delete the augmentation file.

5. **Run `pnpm install`** to refresh the lockfile.

6. **Verify nothing broke.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

   If a typecheck error mentions a removed dep, restore that dep — the grep missed an import (e.g. dynamic `import()` or a re-export through a barrel file).

7. **Commit** with a clear message, e.g.:

   ```
   chore(deps): upgrade @open-elements/ui to 0.5.0, drop now-transitive deps

   <list the deps you removed>
   ```

### Guard rails

- **Do not** remove `react`, `react-dom`, `@base-ui/react`, `radix-ui`, or `lucide-react` — these stay as peer dependencies.
- **Do not** remove a lib that `package.json` lists if `src/` imports it directly (even once). Transitive availability does not justify dropping a direct dependency declaration.
- **Do not** bump unrelated dependency versions in the same change.
- If `pnpm install` warns about missing peer dependencies after your changes, you removed too much — restore the missing peer.

### Don't do this

- Do not add a `.npmrc` with `auto-install-peers=true` to "fix" peer warnings. Declare peers explicitly.
- Do not move `react`/`react-dom` to regular dependencies in the consumer; they stay where they are.
- Do not edit `@open-elements/ui` from the consumer side. If something is missing, open an issue against the UI lib.
