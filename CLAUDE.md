# Project: next-grecaptcha
npm package implementing Google reCAPTCHA v2 (checkbox + invisible) and v3 for Next.js.
Monorepo: `packages/next-grecaptcha` (the library) + `examples/app-router` (demo/verification app).

# Commands
- pnpm install — install all workspaces
- pnpm build — build the library (tsup)
- pnpm typecheck — tsc --noEmit across workspaces
- pnpm test — vitest run
- pnpm lint — eslint
- pnpm verify — runs build + typecheck + test + example `next build` (the full gate)

# Hard rules
- The reCAPTCHA SECRET KEY must never be importable from any client entry point. Server code lives
  only under `src/server/` and is exported only via the `./server` subpath.
- Client entry output MUST preserve the "use client" directive after bundling. `pnpm verify` greps for it.
- Zero runtime dependencies. react/react-dom/next are peerDependencies only.
- We load and manage the Google script ourselves (own loader + explicit `grecaptcha.render`).
  Never use `next/script`, react-google-recaptcha, or any third-party wrapper.
- reCAPTCHA v1 is permanently out of scope: Google shut it down in March 2018; the API no longer exists.

# Style
- TypeScript strict mode. No `any`. Exported public API must be fully typed and documented with TSDoc.
- ES modules in source. Build emits ESM + CJS + .d.ts via tsup.
- Prefer small files: one component/hook per file.

# Workflow
- Run `pnpm verify` after completing each phase; show the output as evidence.
- Prefer running single test files during iteration; run the full suite before claiming a phase done.
- Commit at the end of each phase with a descriptive message.

# Gotchas
- React 18/19 Strict Mode double-invokes effects: the script loader and widget render must be idempotent.
- Next.js client-side navigation unmounts/remounts widgets: clean up with `grecaptcha.reset(widgetId)`
  and never re-inject the script.
- siteverify expects application/x-www-form-urlencoded, NOT JSON.
- v2 tokens expire (~2 min): handle `expired-callback`.