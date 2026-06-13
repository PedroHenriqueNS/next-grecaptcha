# next-grecaptcha — Conventions

Canonical home for project coding rules. Every rule that applies across the codebase lives here — naming, call-site patterns, error shapes, banned shortcuts, library choices, branching and PR workflow, anything else.

When a rule conflicts with what's in `AGENTS.md`, `CLAUDE.md`, the spec docs, or any inline comment, **this file wins**. The other files should be updated to match.

New conventions land HERE in the same PR that establishes them — never in commit messages, AI-assistant private notes, or buried inline comments.

---

## Languages and code style

- TypeScript strict mode everywhere. **No `any`** — use `unknown` + narrowing or precise types.
- Exported public API must be fully typed and documented with TSDoc.
- ES modules in source. Build emits ESM + CJS + .d.ts via tsup.
- Prefer small files: one component/hook per file.
- No `window` access at module scope anywhere in `src/client/` (SSR safety).

## Hard rules (banned shortcuts)

- The reCAPTCHA SECRET KEY must never be importable from any client entry point. Server code lives only under `src/server/`, exported only via the `./server` subpath, guarded by an import-time browser check we implement ourselves (zero deps).
- The `"use client"` directive MUST survive bundling in the client entry output; `pnpm verify` greps for it.
- **Zero runtime dependencies.** react/react-dom/next are peerDependencies only (react ≥18, react-dom ≥18, next ≥13.4).
- We load and manage the Google script ourselves (own singleton loader + explicit `grecaptcha.render`). **Never** `next/script`, react-google-recaptcha, or any third-party wrapper.
- `siteverify` requests are `application/x-www-form-urlencoded` — never JSON.
- Server code uses global `fetch` only — no Node-only APIs (must run on Node 18+, Edge, middleware).
- reCAPTCHA v1 is permanently out of scope (Google shut it down March 2018); only the deprecation-error stub references it.
- Never weaken a verification check to make it pass; address the root cause.

## Error shapes

- All public errors extend a base `RecaptchaError` (in `src/shared/`).
- `verifyRecaptcha` returns a discriminated union and never throws on verification failure; configuration problems (missing secret) and `assertRecaptcha` policy failures throw typed errors with safe messages.
- `RecaptchaErrorCode` is exactly Google's documented set: `missing-input-secret` | `invalid-input-secret` | `missing-input-response` | `invalid-input-response` | `bad-request` | `timeout-or-duplicate`.

## Branching and PR workflow

- Work in phases (see [ROADMAP.md](ROADMAP.md)); each phase ends with its verification checks green and a descriptive commit.
- Single-branch (main) development is fine for the initial build; feature branches once published.
- No AI attribution in commit messages or PR bodies.

## Conventional Commits

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`. Scope by area when useful: `client`, `server`, `shared`, `loader`, `example`, e.g. `feat(client): add ReCaptchaCheckbox`.

## Testing

- vitest + @testing-library/react, jsdom environment, mocking `window.grecaptcha` (client) and `fetch` (server).
- Iterate on single test files; run the full suite before claiming a phase done.
- Minimum client coverage: loader idempotence (two mounts → one script tag), Strict Mode double-effect safety, checkbox token/expired/error callbacks, invisible `execute()` resolution and rejection, v3 action-name validation, multiple widgets, provider overrides.
- Minimum server coverage: success, every error code, score threshold, action mismatch, hostname mismatch, form-encoded request body, env secret resolution, browser-import guard throwing.
- Entry-point proofs: server entry throws under jsdom; root entry imports in plain Node with no React in its module graph; packed tarball resolves all three entries under `require()` and `import`.

## Documentation maintenance

Same map as in [AGENTS.md](../AGENTS.md#documentation-maintenance): architecture → ARCHITECTURE.md, features → FEATURES.md, gotchas → PITFALLS.md, stack → STACK.md, scope → PRD.md + SUMMARY.md, new rules → this file, phases → ROADMAP.md. Update docs in the same commit as the change.

---

## Where conventions live

| Scope | File |
|---|---|
| This file | Repo-wide coding rules |
| Library-specific rules | [`packages/next-grecaptcha/docs/CONVENTIONS.md`](../packages/next-grecaptcha/docs/CONVENTIONS.md) |
| Example-app rules | [`examples/app-router/docs/CONVENTIONS.md`](../examples/app-router/docs/CONVENTIONS.md) |
| Past failures + fixes | [`docs/PITFALLS.md`](PITFALLS.md) |

Per-scope files override this one for their scope when they conflict. When establishing a new convention (in code review, brainstorming, direct user instruction), add it HERE in the same PR.
