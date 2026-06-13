# AGENTS.md — next-grecaptcha

Primary source of truth for any AI agent (and human contributor) working on this repository.

## Project overview

`next-grecaptcha` is an npm package providing a complete, self-owned Google reCAPTCHA integration for Next.js: v2 checkbox, v2 invisible, and v3 score-based, with first-class client-side React components/hooks and server-side token verification. We own the entire integration — our own script loader, explicit widget rendering via the `grecaptcha` JS API, and our own typed `siteverify` client. No auto-injected scripts, no `next/script`, no wrapper libraries. reCAPTCHA v1 is permanently out of scope (Google shut it down March 31, 2018).

## Tech stack

TypeScript (strict), React ≥18 / Next.js ≥13.4 as peer dependencies, tsup for builds (ESM + CJS + .d.ts), vitest + @testing-library/react (jsdom) for tests, pnpm workspaces. **Zero runtime dependencies.** Details in [docs/STACK.md](docs/STACK.md).

## Repository structure

```
packages/next-grecaptcha/     # the library
  src/client/                 # browser-side code ("use client")
  src/server/                 # secret-handling code (browser-import guard)
  src/shared/                 # types, constants, error classes
examples/app-router/          # Next.js App Router demo — integration verification target
docs/                         # living documentation (see below)
```

Entry points (package.json exports map):
- `next-grecaptcha/client` → components + hooks (`"use client"` must survive bundling)
- `next-grecaptcha/server` → verification utilities (throws at import time in a browser)
- `next-grecaptcha` (root) → shared types + errors only; zero React, zero secret code

## Development workflow

- `pnpm install` — install all workspaces
- `pnpm build` — build the library (tsup)
- `pnpm typecheck` — `tsc --noEmit` across workspaces
- `pnpm test` — vitest run
- `pnpm lint` — eslint
- `pnpm verify` — build + typecheck + test + example `next build` (the full gate)

Run `pnpm verify` after each phase and show the output as evidence. Iterate on single test files; run the full suite before claiming a phase done. Commit at the end of each phase with a descriptive message.

## Coding conventions

Canonical rules live in [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — that file wins over anything written here. Highlights:
- TypeScript strict mode, no `any`; full TSDoc on the public API.
- One component/hook per file; small files.
- ES modules in source.
- The reCAPTCHA SECRET KEY must never be importable from any client entry point.
- Never weaken a verification check to make it pass; fix the root cause.

## Commit and PR conventions

- Descriptive, conventional-style messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- One commit per completed phase minimum.
- No AI attribution lines (no `Co-Authored-By: Claude`, no "Generated with" footers) in commits or PR bodies.

## Testing expectations

vitest + @testing-library/react under jsdom, mocking `window.grecaptcha` and `fetch`. Minimum coverage targets are listed in [docs/CONVENTIONS.md](docs/CONVENTIONS.md#testing); the full verification gate is in [docs/ROADMAP.md](docs/ROADMAP.md#final-verification-gate).

## Known pitfalls

See [docs/PITFALLS.md](docs/PITFALLS.md). Top items: React Strict Mode double-invokes effects (loader/render must be idempotent); Next.js client navigation unmounts/remounts widgets; `siteverify` expects form-encoded bodies, not JSON; v2 tokens expire (~2 min).

## Documentation maintenance

These files are living documents. When you make changes to this project, update the relevant docs in the same commit:

- Architectural change → update `docs/ARCHITECTURE.md`
- New feature or feature change → update `docs/FEATURES.md`
- Discovered a gotcha → add to `docs/PITFALLS.md`
- Stack change (new dep, version bump, service) → update `docs/STACK.md`
- Scope or requirements change → update `docs/PRD.md` and `docs/SUMMARY.md`
- New coding rule, banned shortcut, or workflow convention → add to `docs/CONVENTIONS.md` (THE source of truth — never bury rules in commit messages, AGENTS.md prose, or private notes)
- Phase reached or priorities shifted → update `docs/ROADMAP.md`

If you skip a doc update, note why in the commit message.
