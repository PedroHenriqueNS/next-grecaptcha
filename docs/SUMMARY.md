# Executive summary — next-grecaptcha

`next-grecaptcha` is an npm package that gives Next.js apps a complete Google reCAPTCHA integration: v2 checkbox, v2 invisible, and v3 score-based verification, with React components/hooks on the client and a typed `siteverify` client on the server. Unlike wrapper libraries, it owns the entire integration — its own script loader, explicit `grecaptcha.render` calls, and zero runtime dependencies — making it safe under React Strict Mode and Next.js client-side navigation. The package ships three entry points (`/client`, `/server`, root) with strict separation so the secret key is unreachable from any client bundle.

**Current status:** pre-scaffold — documentation initialized, implementation not yet started.

**Top priorities:** confirm the API surface against Google's official docs, then execute Phases 0–5 per [ROADMAP.md](ROADMAP.md), ending with the full verification gate and an adversarial review.

First reads: [PRD.md](PRD.md) → [ARCHITECTURE.md](ARCHITECTURE.md) → [ROADMAP.md](ROADMAP.md).
