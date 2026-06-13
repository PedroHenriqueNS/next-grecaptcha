# next-grecaptcha (monorepo)

Google reCAPTCHA v2 (checkbox + invisible) and v3 for Next.js — own script
loader, explicit widget rendering, typed server-side verification, zero
runtime dependencies.

- **Package:** [`packages/next-grecaptcha`](packages/next-grecaptcha/README.md) — full documentation
- **Demo:** [`examples/app-router`](examples/app-router) — `pnpm --filter example-app-router dev`

## Development

| Command | What it does |
| --- | --- |
| `pnpm install` | install all workspaces |
| `pnpm verify` | build + typecheck + tests + example build + "use client" check |
| `pnpm verify:pack` | pack tarball and smoke-test all entry points (require + import) |
