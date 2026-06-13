# PRD — next-grecaptcha

## Problem

Existing reCAPTCHA wrappers for React/Next.js (e.g. react-google-recaptcha) auto-inject scripts, break under React 18/19 Strict Mode double-effects and Next.js client-side navigation, leak no type safety into server verification, and add runtime dependencies. Next.js teams need a reCAPTCHA integration that is idempotent, App Router-aware, secret-safe, and fully typed end to end.

## Target users

Next.js developers (App Router and Pages Router) who need bot protection on forms and API endpoints using Google reCAPTCHA v2 (checkbox or invisible) or v3 (score-based).

## Goals

1. First-class client API: provider, checkbox component, invisible component, v3 hook, badge-attribution notice — all SSR-safe and Strict Mode-safe.
2. First-class server API: typed `siteverify` client (`verifyRecaptcha`), strict v3 assertion (`assertRecaptcha`), and thin Next.js adapters (Route Handlers, Pages API routes, Server Actions).
3. Hard secret isolation: the secret key is unreachable from any client entry point; the server entry throws at import time in a browser.
4. Zero runtime dependencies; react/react-dom/next are peers only.
5. Works on Node 18+, Edge runtime, and Next.js middleware (global `fetch` only).
6. recaptcha.net host option for regions where google.com is blocked; CSP nonce support; `hl` language support.

## Non-goals (out of scope)

- reCAPTCHA v1 — shut down by Google March 31, 2018; we ship a descriptive deprecation-error stub and README note only.
- reCAPTCHA Enterprise — a `Verifier` interface seam is left for it, but no implementation now.
- Android/iOS SDKs, non-Next.js frameworks, UI styling beyond what Google renders.
- Publishing to npm (package is prepared, not published).

## Success metrics

- `pnpm verify` (build + typecheck + full tests + example `next build`) fully green.
- `"use client"` directive provably survives bundling in the client entry output.
- Import-graph proofs: server entry throws under jsdom; root entry pulls zero React.
- `pnpm pack` tarball resolves all three entry points under both `require()` and ESM `import`.
- Adversarial review pass finds no correctness gaps against the spec.

## Constraints

- Google's documented APIs are the authority; where this spec and Google's docs disagree, the docs win (discrepancies flagged in the plan).
- `siteverify` requires `application/x-www-form-urlencoded` bodies.
- v2 tokens expire after ~2 minutes; v3 badge may only be hidden if the attribution notice is shown.
