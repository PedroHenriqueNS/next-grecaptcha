# Roadmap — next-grecaptcha

Phased plan. Each phase ends with its verification checks green and a descriptive commit. Never weaken a check to make it pass.

## Pre-phase: docs research & plan review — in-flight

Read Google's authoritative docs (display, invisible, v3, verify, FAQ, language codes), confirm the API surface, flag any spec/docs discrepancies, and present an implementation plan for user review **before writing code**.

## Phase 0 — Scaffold + tooling

pnpm workspace setup, package.json exports map, tsup config, vitest config, eslint, root `verify` script, CLAUDE.md (already present). Gate: `pnpm verify` runs end to end (trivially green).

## Phase 1 — Shared types + loader

`src/shared/` (types, `grecaptcha.d.ts`, error classes, constants) + `src/client/loader.ts`. Gate: loader idempotence tests (two mounts → one script tag, Strict Mode safety), root-entry purity test.

## Phase 2 — v2 components

`ReCaptchaProvider`, `ReCaptchaCheckbox`, `ReCaptchaInvisible`. Gate: token/expired/error callback tests, `execute()` resolve/reject, multiple widgets, provider overrides.

## Phase 3 — v3 hook + badge notice

`useReCaptchaV3`, `ReCaptchaBadgeNotice`, v1 deprecation stub. Gate: action-name validation tests, ready/execute wrapping.

## Phase 4 — Server verification + adapters

`verifyRecaptcha`, `assertRecaptcha`, `withRecaptcha` (App Router), Pages Router wrapper, `verifyRecaptchaAction`, `Verifier` seam, browser-import guard. Gate: full server test matrix (every error code, thresholds, mismatches, form-encoded body, env secret, guard throws under jsdom).

## Phase 5 — Example app + README

`examples/app-router` demo pages (checkbox, invisible, v3 → Route Handlers + one Server Action) using Google's test keys; full README (install, env vars, quickstarts, Pages Router docs, badge rules, recaptcha.net, CSP, token expiry, "Why no v1?", Enterprise roadmap note). Gate: example `next build` green.

## Final — verification gate

The task is not done until ALL pass, with outputs shown as evidence:

1. `pnpm verify` fully green.
2. `grep -r '"use client"' packages/next-grecaptcha/dist/client*` proves the directive survived bundling.
3. A test proves `import "next-grecaptcha/server"` under jsdom throws the browser guard error.
4. From a scratch dir, the `pnpm pack` tarball installs and all three entry points resolve under both `require()` and ESM `import`.
5. A test asserts the root entry imports in plain Node with no React in its module graph.
6. Adversarial pass in a fresh subagent: diff vs. spec — public API complete and typed, secret unreachable from client entries (import-graph trace), loader provably idempotent, siteverify form-encoded, error codes match Google's set. Fix correctness gaps only.

## Deferred / future

- **reCAPTCHA Enterprise** — `Verifier` interface seam exists; a Google Cloud `createAssessment` adapter can be added without breaking changes. Not scheduled.
- npm publishing — package prepared but not published.
