# examples/app-router — Conventions (example-app scope)

Rules for the demo/verification app. Repo-level rules live at [/docs/CONVENTIONS.md](../../../docs/CONVENTIONS.md); when this file and the repo-level file conflict, **this file wins for this app**.

This workspace is pre-scaffold: rules here apply from the first scaffold pass onward.

---

## Purpose discipline

- This app is the **integration verification target** — every library feature gets a demo page, and `next build` of this app is part of `pnpm verify`.
- It consumes the library exactly as a real user would: via the `next-grecaptcha/client` and `next-grecaptcha/server` entry points (workspace dependency), never via relative imports into `packages/next-grecaptcha/src`.

## Keys & secrets

- Use only Google's documented automated-testing key pair (from the reCAPTCHA FAQ) so the app runs without registration. Never commit a real site key or secret key.
- The README notes that the test secret makes siteverify always pass.

## Page/route layout

- One page per mode: checkbox, invisible, v3 — each posting to its own Route Handler; plus one Server Action demo.
- App Router only. Pages Router support is demonstrated via library unit tests + README docs, not here.

## Styling

- No UI styling beyond what Google renders and minimal layout; this is a verification target, not a showcase.

## Open decisions for scaffold time

- Next.js version to pin for the example — decide in Phase 0/5, record here.
- Whether the v3 demo shows the returned score in the UI — decide in Phase 5, record here.
