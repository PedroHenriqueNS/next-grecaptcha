# Pitfalls — next-grecaptcha

Gotchas and non-obvious constraints — past failures and how they were (or must be) handled. Each entry dated. Forward-looking rules live in [CONVENTIONS.md](CONVENTIONS.md); this file records the failure modes that motivate them.

## 2026-06-12 — React Strict Mode double-invokes effects

React 18/19 Strict Mode mounts → unmounts → remounts components in development, running effects twice. A naive loader injects two script tags; a naive widget renders twice (grecaptcha throws "reCAPTCHA has already been rendered in this element"). The script loader must be a module-level singleton promise and widget render must be idempotent (track widget IDs, guard re-render).

## 2026-06-12 — Next.js client-side navigation unmounts/remounts widgets

Navigating away and back remounts the component but the Google script is already loaded and the old widget DOM is gone. Clean up with `grecaptcha.reset(widgetId)` on unmount and never re-inject the script — reuse the singleton promise.

## 2026-06-12 — siteverify expects form-encoded bodies, NOT JSON

`POST https://www.google.com/recaptcha/api/siteverify` silently fails (returns `missing-input-secret`/`missing-input-response`) if you send a JSON body. Always `application/x-www-form-urlencoded` (`URLSearchParams`).

## 2026-06-12 — v2 tokens expire after ~2 minutes

A user who solves the checkbox and then dawdles submits a stale token; siteverify returns `timeout-or-duplicate`. Handle the widget's `expired-callback` (clear stored token, surface `onExpired`) and treat `timeout-or-duplicate` as a normal failure path server-side.

## 2026-06-12 — tokens are single-use

The same token verified twice returns `timeout-or-duplicate` on the second call. Don't retry verification with the same token; obtain a fresh one.

## 2026-06-12 — reCAPTCHA v1 no longer exists

Google shut v1 down March 31, 2018; there is no script endpoint or verification API. It cannot be implemented or tested. We ship a descriptive deprecation-error stub for v1-named import paths instead of letting users hit module-not-found.

## 2026-06-12 — "use client" can be stripped by bundlers

Bundlers commonly drop top-of-file directives when concatenating modules. tsup must be configured (banner/esbuild handling) so the directive survives in the client entry output — and `pnpm verify` greps `dist/client*` to prove it.

## 2026-06-12 — hiding the v3 badge has terms attached

Google permits hiding the badge via CSS only if the attribution text ("protected by reCAPTCHA" with Privacy/Terms links) is shown in the user flow. `ReCaptchaBadgeNotice` exists for this; the README must state the rule.
