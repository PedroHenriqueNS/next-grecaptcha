# packages/next-grecaptcha — Conventions (library scope)

Library-specific rules. Repo-level rules live at [/docs/CONVENTIONS.md](../../../docs/CONVENTIONS.md); when this file and the repo-level file conflict, **this file wins for this package**.

This workspace is pre-scaffold: the directory structure below is the agreed plan; rules here apply from the first scaffold pass onward.

---

## Source layout

```
src/client/   # browser-side only; "use client"; no window access at module scope
src/server/   # secret-handling only; import-time browser guard; global fetch only
src/shared/   # types, grecaptcha.d.ts, RecaptchaError hierarchy, constants
```

- `src/client/` and `src/server/` may import from `src/shared/` — never from each other.
- One component/hook per file. Loader logic lives in `src/client/loader.ts`.

## Entry points

- `./client`, `./server`, and root (`.`) in the exports map; each emits ESM + CJS + .d.ts.
- Root entry must stay React-free and secret-free — adding any import there from `client/` or `server/` is a breaking violation.
- v1-named paths exist only as deprecation-error stubs.

## Public API rules

- Full TSDoc on every exported symbol.
- `verifyRecaptcha` returns a discriminated union; only configuration and `assertRecaptcha` policy failures throw.
- All thrown errors extend `RecaptchaError`.
- Verification implementations sit behind the `Verifier` interface (Enterprise seam).

## Open decisions for scaffold time

- Exact tsup mechanism for preserving `"use client"` (banner vs. esbuild plugin) — decide in Phase 0, record here.
- Whether v3 auto-load in the provider defaults to eager or first-use — decide in Phase 2/3, record here.
- Test file co-location (`*.test.ts` beside source) vs. `tests/` directory — decide in Phase 0, record here.
