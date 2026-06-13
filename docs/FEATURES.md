# Features — next-grecaptcha

One section per feature. Status: planned / in-progress / shipped.

## Script loader (client) — planned

Singleton-promise loader injecting exactly one `<script>` tag regardless of how many components mount. URL built from options: host (`google.com` | `recaptcha.net`), `render=explicit` (v2) or `render=<siteKey>` (v3), `hl` language, CSP `nonce`, generated `onload=` callback (cleaned up after firing). API: `loadRecaptchaScript(options): Promise<Grecaptcha>`. Idempotent under Strict Mode and client-side navigation.

## ReCaptchaProvider — planned

React context configuring siteKey(s), version, host, language, nonce, and v3 auto-load. All consumers accept prop-level overrides.

## ReCaptchaCheckbox (v2 checkbox) — planned

Container div + explicit `grecaptcha.render` with sitekey, theme (`light`|`dark`), size (`normal`|`compact`), tabindex and the three callbacks. Props `onToken(token)`, `onExpired()`, `onErrored()`; `reset()` and `getResponse()` via ref. Multiple independent widgets per page; expired-callback handles the ~2-minute token TTL.

## ReCaptchaInvisible (v2 invisible) — planned

Explicit render with `size:"invisible"` and badge position (`bottomright`|`bottomleft`|`inline`). `execute(): Promise<string>` via ref — resolved in the render callback, rejected on error-callback; supports `reset()`.

## useReCaptchaV3 hook — planned

Returns `{ executeRecaptcha(action), isReady }`. Validates action names (A–Z a–z 0–9 / _ only), throwing a typed error otherwise. Wraps `grecaptcha.ready` + `grecaptcha.execute`.

## ReCaptchaBadgeNotice — planned

Small unstyled component rendering Google's required attribution wording (with Privacy Policy and Terms links) for sites that hide the v3 badge via CSS. README documents that hiding the badge is only allowed when this notice appears in the user flow.

## verifyRecaptcha (server) — planned

Typed `siteverify` client: form-encoded POST, google.com or recaptcha.net host, secret from options or `RECAPTCHA_SECRET_KEY`, discriminated-union result with Google's documented error codes, never throws on verification failure. Global `fetch` only.

## assertRecaptcha (server) — planned

Strict v3 variant enforcing expectedAction, minScore (default 0.5), expectedHostname(s); throws `RecaptchaScoreError` / `RecaptchaActionMismatchError` / `RecaptchaHostnameError`.

## Next.js adapters (server) — planned

`withRecaptcha(handler, options)` for App Router Route Handlers (token from configurable JSON field / form field / header, default `x-recaptcha-token`; 400/403 JSON on failure; verification result attached to handler call); an equivalent Pages Router API-route wrapper; `verifyRecaptchaAction(formData | token, options)` for Server Actions.

## v1 deprecation stub — planned

Any v1-named import path throws a descriptive error explaining the March 2018 shutdown and pointing to v2/v3.

## Example app (examples/app-router) — planned

Pages demoing checkbox, invisible, and v3 forms, each posting to a Route Handler (plus one Server Action) that verifies the token, using Google's documented automated-testing key pair so it runs without registration.

## Deferred

- reCAPTCHA Enterprise adapter — `Verifier` interface seam only; see [ROADMAP.md](ROADMAP.md).
