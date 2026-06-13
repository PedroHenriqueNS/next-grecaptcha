# Stack — next-grecaptcha

## Languages & runtime targets

- **TypeScript** (strict mode, no `any`) — entire codebase.
- Server code targets **Node 18+, Edge runtime, and Next.js middleware**: global `fetch` only, no Node-only APIs.
- Client code targets browsers via React 18/19 under Next.js ≥13.4 (App Router and Pages Router).

## Runtime dependencies

**None.** This is a hard rule. Peer dependencies only:

| Peer | Range |
|---|---|
| react | ≥18 |
| react-dom | ≥18 |
| next | ≥13.4 |

## Dev tooling

| Tool | Role |
|---|---|
| pnpm workspaces | monorepo management |
| tsup | library build — ESM + CJS + .d.ts per entry, `"use client"` preserved in client output |
| tsc `--noEmit` | typecheck across workspaces |
| vitest | test runner |
| @testing-library/react + jsdom | client component tests (mocking `window.grecaptcha`) |
| eslint | linting |
| Next.js (examples/app-router) | integration verification target (`next build` in `pnpm verify`) |

> TODO: pin exact dev-dependency versions at Phase 0 scaffold time.

## External services

- `https://www.google.com/recaptcha/api.js` (or `https://www.recaptcha.net/...`) — client script.
- `https://www.google.com/recaptcha/api/siteverify` (or recaptcha.net) — server verification, form-encoded POST.
- Google's documented automated-testing key pair (from the reCAPTCHA FAQ) powers the example app without registration; the test secret makes siteverify always pass.

## Why these choices

- **Own loader instead of `next/script` or wrappers:** wrappers break under Strict Mode/client navigation and hide the grecaptcha API; owning the loader is the project's core value proposition (see [PRD.md](PRD.md)).
- **tsup:** simplest path to dual-format + dts output with directive preservation control.
- **Zero deps:** a security-adjacent package handling secrets should have a minimal supply chain.
