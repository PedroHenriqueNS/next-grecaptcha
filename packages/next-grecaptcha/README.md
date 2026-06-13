# next-grecaptcha

Google reCAPTCHA v2 (checkbox + invisible) and v3 for Next.js. The library owns
the entire lifecycle: it injects and manages the Google `api.js` script itself,
calls `grecaptcha.render` explicitly so you keep full control over widget
placement, and provides a typed server-side siteverify client. Zero runtime
dependencies — `react`, `react-dom`, and `next` are peer dependencies only.

Supports:

- **v2 checkbox** — visible widget; token is valid for ~2 minutes after the user checks the box.
- **v2 invisible** — programmatically triggered; useful for seamless form submit flows.
- **v3** — background score-based verification; no user interaction required.

---

## Install

```bash
npm install next-grecaptcha
# pnpm
pnpm add next-grecaptcha
# yarn
yarn add next-grecaptcha
```

**Peer dependencies** (install separately if not already present):

```bash
npm install react@>=18 react-dom@>=18 next@>=13.4
```

---

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `RECAPTCHA_SECRET_KEY` | **Server only** — never expose to the browser | Sent to Google's siteverify API. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Public (client-safe by design) | v2 site key for `<ReCaptchaCheckbox>` / `<ReCaptchaInvisible>`. |
| `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` | Public (client-safe by design) | v3 site key for `useReCaptchaV3`. |

The secret key must **never** appear in any client entry point. The library's
`next-grecaptcha/server` subpath is guarded: importing it in a browser context
throws `RecaptchaBrowserImportError` at module evaluation time.

---

## Entry points

| Import path | Contents | Safe in |
| --- | --- | --- |
| `next-grecaptcha` | Shared types, error classes, constants. No React, no secret handling. | Anywhere — client components, server components, API routes, middleware. |
| `next-grecaptcha/client` | `"use client"` components and hooks: `ReCaptchaProvider`, `ReCaptchaCheckbox`, `ReCaptchaInvisible`, `useReCaptchaV3`, `ReCaptchaBadgeNotice`. | Client components and pages only. |
| `next-grecaptcha/server` | Verification helpers: `verifyRecaptcha`, `assertRecaptcha`, `withRecaptcha`, `withRecaptchaApiRoute`, `verifyRecaptchaAction`. Throws if imported in a browser. | Server components, API routes, Server Actions, Pages Router API routes. |
| `next-grecaptcha/v1` | Deprecation stub — throws `RecaptchaV1Error` on import (reCAPTCHA v1 was shut down in 2018). See *Why no v1?* below. | — |

---

## Quickstart: v2 checkbox

### 1. Wrap your app with `<ReCaptchaProvider>`

```tsx
// app/layout.tsx
import type { ReactNode } from "react";
import { ReCaptchaProvider } from "next-grecaptcha/client";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReCaptchaProvider siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}>
          {children}
        </ReCaptchaProvider>
      </body>
    </html>
  );
}
```

### 2. Render the checkbox widget

```tsx
// app/contact/page.tsx
"use client";
import { useRef, useState } from "react";
import { ReCaptchaCheckbox, type ReCaptchaCheckboxHandle } from "next-grecaptcha/client";

export default function ContactPage() {
  const widgetRef = useRef<ReCaptchaCheckboxHandle>(null);
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");

  async function submit() {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "x-recaptcha-token": token },
    });
    setResult(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <main>
      <ReCaptchaCheckbox ref={widgetRef} onToken={setToken} onExpired={() => setToken("")} />
      <button disabled={!token} onClick={submit}>Submit</button>
      <button onClick={() => { widgetRef.current?.reset(); setToken(""); }}>Reset</button>
      <pre>{result}</pre>
    </main>
  );
}
```

By default the token is read from the `x-recaptcha-token` request header.

### 3. Verify in an App Router Route Handler

```ts
// app/api/contact/route.ts
import { withRecaptcha } from "next-grecaptcha/server";

export const POST = withRecaptcha(
  async (_req, { recaptcha }) => Response.json({ ok: true, recaptcha }),
  { secretKey: process.env.RECAPTCHA_SECRET_KEY },
);
```

`withRecaptcha` extracts the token, calls siteverify, and passes the typed
`RecaptchaVerifySuccess` result to your handler. It responds `400` when the
token is missing and `403` when verification fails — no try/catch needed.

---

## Quickstart: v2 invisible

The invisible widget is triggered programmatically via an imperative handle.
Send the token as a JSON field instead of a header:

```tsx
// app/checkout/page.tsx
"use client";
import { useRef, useState } from "react";
import { ReCaptchaInvisible, type ReCaptchaInvisibleHandle } from "next-grecaptcha/client";

export default function CheckoutPage() {
  const widgetRef = useRef<ReCaptchaInvisibleHandle>(null);
  const [result, setResult] = useState("");

  async function submit() {
    try {
      const token = await widgetRef.current!.execute();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResult(JSON.stringify(await res.json(), null, 2));
    } catch (error) {
      setResult(String(error));
    }
  }

  return (
    <main>
      <ReCaptchaInvisible ref={widgetRef} badge="bottomleft" />
      <button onClick={submit}>Place order</button>
      <pre>{result}</pre>
    </main>
  );
}
```

```ts
// app/api/checkout/route.ts
import { withRecaptcha } from "next-grecaptcha/server";

export const POST = withRecaptcha(
  async (_req, { recaptcha }) => Response.json({ ok: true, recaptcha }),
  {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    tokenFrom: { jsonField: "token" },
  },
);
```

`tokenFrom` controls where the wrapper looks for the token. Options:
- `{ header: "x-recaptcha-token" }` — **default**; reads a request header.
- `{ jsonField: "token" }` — reads a top-level field of a JSON body.
- `{ formField: "recaptchaToken" }` — reads a field from form-data / urlencoded body.

---

## Quickstart: v3

v3 is score-based and runs entirely in the background — no widget is rendered.
Pass `v3SiteKey` to the provider (alongside or instead of `siteKey`):

```tsx
// app/layout.tsx
<ReCaptchaProvider
  siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
  v3SiteKey={process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY}
>
  {children}
</ReCaptchaProvider>
```

Execute a scored action in a client component:

```tsx
// app/signup/page.tsx
"use client";
import { useState } from "react";
import { useReCaptchaV3 } from "next-grecaptcha/client";

export default function SignupPage() {
  const { executeRecaptcha, isReady } = useReCaptchaV3();
  const [result, setResult] = useState("");

  async function submit() {
    try {
      const token = await executeRecaptcha("signup_submit");
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResult(JSON.stringify(await res.json(), null, 2));
    } catch (error) {
      setResult(String(error));
    }
  }

  return (
    <main>
      <button disabled={!isReady} onClick={submit}>Sign up</button>
      <pre>{result}</pre>
    </main>
  );
}
```

Verify with `assertRecaptcha` on the server to enforce the action name and score:

```ts
// app/api/signup/route.ts
import { assertRecaptcha } from "next-grecaptcha/server";

export async function POST(req: Request): Promise<Response> {
  const { token } = (await req.json()) as { token?: string };
  // assertRecaptcha throws typed errors on failure; catch RecaptchaError for safe messages.
  const result = await assertRecaptcha(token ?? "", {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    expectedAction: "signup_submit",
    minScore: 0.5, // Google's documented default threshold
  });
  return Response.json({ ok: true, hostname: result.hostname, score: result.score });
}
```

`assertRecaptcha` options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `secretKey` | `string` | `process.env.RECAPTCHA_SECRET_KEY` | Secret key for siteverify. |
| `host` | `"google.com" \| "recaptcha.net"` | `"google.com"` | siteverify host. |
| `remoteIp` | `string` | — | User's IP, forwarded as `remoteip`. |
| `expectedAction` | `string` | — | Required v3 action; mismatch throws `RecaptchaActionMismatchError`. |
| `minScore` | `number` | `0.5` | Minimum acceptable score. Only enforced when the response carries a score (i.e. v3 tokens); explicitly setting `minScore` also makes a score-less (v2) response throw `RecaptchaScoreError`. |
| `expectedHostname` | `string \| readonly string[]` | — | Allowed hostname(s); mismatch throws `RecaptchaHostnameError`. |

Google's documentation states: "By default, you can use a threshold of 0.5." The
constant `DEFAULT_MIN_SCORE` exported from `next-grecaptcha` equals `0.5`.

---

## Pages Router

Client components and hooks (`ReCaptchaProvider`, `ReCaptchaCheckbox`, etc.) are
plain React client components and work identically inside `pages/` — just import
from `next-grecaptcha/client` as usual.

For API routes use `withRecaptchaApiRoute`, which adapts the same verification
logic to the `(req: NextApiRequest, res: NextApiResponse)` signature:

```ts
// pages/api/contact.ts
import { withRecaptchaApiRoute } from "next-grecaptcha/server";

export default withRecaptchaApiRoute(async (req, res, recaptcha) => {
  res.status(200).json({ ok: true, hostname: recaptcha.hostname });
});
```

The wrapper responds `400` on a missing token and `403` on failed verification.
The third argument is the typed `RecaptchaVerifySuccess` result. All `tokenFrom`
options work identically to `withRecaptcha` (App Router).

---

## Server Actions

Use `verifyRecaptchaAction` inside a `"use server"` action. It reads the token
from `FormData` (default field: `"recaptchaToken"`) and runs `assertRecaptcha`,
throwing typed `RecaptchaError` subclasses on failure.

```ts
// app/server-action/actions.ts
"use server";
import { RecaptchaError } from "next-grecaptcha";
import { verifyRecaptchaAction } from "next-grecaptcha/server";

export interface ActionState {
  ok: boolean;
  message: string;
}

export async function submitWithRecaptcha(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    const result = await verifyRecaptchaAction(formData, {
      secretKey: process.env.RECAPTCHA_SECRET_KEY,
    });
    return { ok: true, message: `verified for hostname "${result.hostname}"` };
  } catch (error) {
    if (error instanceof RecaptchaError) return { ok: false, message: error.message };
    throw error;
  }
}
```

Pair it with a client component that puts the token in a hidden form field:

```tsx
// app/server-action/CheckboxField.tsx
"use client";
import { useActionState, useState } from "react";
import { ReCaptchaCheckbox } from "next-grecaptcha/client";
import { submitWithRecaptcha, type ActionState } from "./actions";

export function CheckboxField() {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    submitWithRecaptcha,
    null,
  );
  const [token, setToken] = useState("");

  return (
    <form action={formAction}>
      <ReCaptchaCheckbox onToken={setToken} onExpired={() => setToken("")} />
      <input type="hidden" name="recaptchaToken" value={token} />
      <button type="submit" disabled={!token}>Submit via Server Action</button>
      {state && <p>{state.ok ? "OK: " : "Failed: "}{state.message}</p>}
    </form>
  );
}
```

The hidden field name `"recaptchaToken"` matches `verifyRecaptchaAction`'s default
`formField`. Override it with `{ formField: "myField" }` in the options if needed.

---

## v3 badge and attribution rules

Google's reCAPTCHA terms allow you to **hide the floating badge** by applying:

```css
.grecaptcha-badge {
  visibility: hidden;
}
```

However, hiding the badge is only permitted when you include reCAPTCHA branding
visibly in the user flow. Use `<ReCaptchaBadgeNotice>` to render the required
attribution text:

```tsx
import { ReCaptchaBadgeNotice } from "next-grecaptcha/client";

// Long form (default): includes Google Privacy Policy and Terms of Service links.
<ReCaptchaBadgeNotice />

// Minimal form: renders the single sentence required by the reCAPTCHA FAQ.
<ReCaptchaBadgeNotice withLinks={false} />
```

`withLinks={true}` (default) renders:

> This site is protected by reCAPTCHA and the Google [Privacy Policy](https://policies.google.com/privacy) and [Terms of Service](https://policies.google.com/terms) apply.

`withLinks={false}` renders:

> This site is protected by reCAPTCHA.

The component is unstyled — pass `className` to position and style it yourself.
Place it somewhere visible to users on any page where reCAPTCHA runs.

---

## recaptcha.net (regions where google.com is blocked)

In regions where `google.com` is inaccessible (e.g., mainland China), set
`host="recaptcha.net"` on the provider and `host: "recaptcha.net"` in every
server-side verification call:

```tsx
// app/layout.tsx
<ReCaptchaProvider
  siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
  host="recaptcha.net"
>
  {children}
</ReCaptchaProvider>
```

```ts
// app/api/contact/route.ts
import { withRecaptcha } from "next-grecaptcha/server";

export const POST = withRecaptcha(
  async (_req, { recaptcha }) => Response.json({ ok: true, recaptcha }),
  {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    host: "recaptcha.net",
  },
);
```

The `RecaptchaHost` type exported from `next-grecaptcha` is `"google.com" | "recaptcha.net"`.

---

## CSP / nonce

Pass a `nonce` to `<ReCaptchaProvider>` and it will be applied to the injected
`<script>` tag. Google supports nonce-based CSP via `strict-dynamic`:

```tsx
<ReCaptchaProvider siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} nonce={nonce}>
  {children}
</ReCaptchaProvider>
```

If you use a host allowlist instead of `strict-dynamic`, add these directives:

```
script-src https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
frame-src  https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;
```

(Replace `www.google.com` with `www.recaptcha.net` if you use `host="recaptcha.net"`.)

---

## Token expiry

v2 tokens are **valid for approximately 2 minutes** and are **single-use**.
Google's siteverify returns `timeout-or-duplicate` when a token has expired or
has already been consumed.

- Always handle `onExpired` on `<ReCaptchaCheckbox>` / `<ReCaptchaInvisible>` to
  clear stale tokens and prompt the user to re-verify.
- Treat `timeout-or-duplicate` in the `errorCodes` array as a normal, expected
  failure — do not log it as an error. Re-prompt the user instead.

```tsx
<ReCaptchaCheckbox
  onToken={(t) => setToken(t)}
  onExpired={() => setToken("")}
/>
```

---

## Testing keys

Google publishes an always-pass key pair for automated testing of v2 widgets:

| | Value |
| --- | --- |
| **Site key** | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` |
| **Secret key** | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` |

With these keys the widget shows a test badge and **siteverify always returns
`success: true`** — never use them in production.

v3 has **no official test keys**. Create a dedicated v3 key pair in the
[reCAPTCHA admin console](https://www.google.com/recaptcha/admin) for testing.
Note that scores may be inaccurate without real user traffic; a staging
environment with real users gives the most reliable signal.

---

## Why no v1?

Google permanently shut down reCAPTCHA v1 on **March 31, 2018**. The script
endpoint and siteverify API no longer exist. `next-grecaptcha` will never
implement v1.

Importing `next-grecaptcha/v1` throws a `RecaptchaV1Error` at module evaluation
time with a descriptive message pointing you to v2 (`<ReCaptchaCheckbox>` /
`<ReCaptchaInvisible>`) or v3 (`useReCaptchaV3`).

---

## Roadmap

The server verification layer is built around a `Verifier` interface (exported
from `next-grecaptcha/server` as `siteverifyVerifier`). A reCAPTCHA Enterprise
adapter can implement this interface and be passed to the verification helpers
without any breaking changes to existing code. Enterprise support is not yet
implemented.
