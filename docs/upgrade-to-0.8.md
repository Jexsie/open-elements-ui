# Upgrade prompt: `@open-elements/ui` 0.7.x → 0.8.0

`@open-elements/ui` 0.8.0 has **no consumer-facing code changes**. Compared to 0.7.0 there are no new components, no removed or renamed exports, and no changes to `dependencies` or `peerDependencies`. The release bundles repository-internal tooling work (CI pipeline, pinned Node/pnpm versions, an OIDC-based release workflow).

The only thing that reaches consumers is a newly declared `engines` field:

```json
"engines": {
  "node": ">=20"
}
```

If your app runs on Node 20 or newer, this is a no-op. On Node < 20, npm/pnpm will now emit an engines warning (or fail the install if you run with `engine-strict=true`).

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.8.0`. This is a version bump only — there is no component or API migration to perform.

### What changed in 0.8.0

- **Nothing in the public API.** Exports, component props, and types are identical to 0.7.0.
- **No dependency manifest changes.** `dependencies` and `peerDependencies` are unchanged.
- **New `engines.node: ">=20"` declaration.** The package now states it supports Node 20+. This is a compatibility declaration, not a code change.

Everything else in the release (CI workflow, `.nvmrc`, the `packageManager` pin, the release pipeline) lives in the library's repository and is **not** shipped to consumers.

### Steps

1. **Find the consumer's frontend package.json.** Usually `package.json` at repo root or under `frontend/`. Confirm `@open-elements/ui` is listed.

2. **Check your Node version.** Run:

   ```bash
   node -v
   ```

   If this is Node 20 or newer, continue. If it is older than 20, decide whether to bump your runtime first — after the upgrade you will otherwise see an engines warning on install (and a hard failure if you use `engine-strict=true`).

3. **Bump `@open-elements/ui` to `^0.8.0`** in that `package.json`, then run:

   ```bash
   pnpm install
   ```

4. **Verify nothing broke.** All three must pass — they should pass without any source changes:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

5. **Commit** with a clear message:

   ```
   chore(deps): upgrade @open-elements/ui to 0.8.0

   No consumer changes required — version bump only (adds Node >=20 engines declaration).
   ```

### Guard rails

- **Do not** search for or rewrite any imports — no exports changed in 0.8.0. There are no local duplicates to replace.
- **Do not** remove or change `peerDependencies` — the manifest did not change in 0.8.0. Peer-dep cleanup, if any, belongs in the 0.5.0 upgrade pass (`docs/upgrade-to-0.5.md`).
- **Do not** copy the library's `.nvmrc`, `packageManager`, or CI/release workflows into the consumer repo. Those are the library's build-time concerns; pin your own toolchain as your project requires.
- **Do not** bump unrelated dependency versions in the same change.

### Don't do this

- Do not treat the new `engines.node` constraint as a reason to pin your app to an exact Node version. It is a lower-bound range (`>=20`); your app keeps its own toolchain policy.
- Do not edit `@open-elements/ui` from the consumer side.
- Do not bundle this upgrade with feature work in the same PR.
