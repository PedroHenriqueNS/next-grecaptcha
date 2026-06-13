import type { NextApiRequest, NextApiResponse } from "next";
import { RecaptchaConfigError, RecaptchaError } from "../shared/errors";
import type { RecaptchaVerifySuccess } from "../shared/types";
import { assertRecaptcha } from "./assert";
import type { TokenSource, WithRecaptchaOptions } from "./withRecaptcha";

function extractTokenFromApiRequest(req: NextApiRequest, tokenFrom?: TokenSource): string | null {
  const bodyField = tokenFrom?.jsonField ?? tokenFrom?.formField;
  if (bodyField) {
    // Next.js has already parsed JSON and urlencoded bodies into req.body
    const body = req.body as Record<string, unknown> | undefined;
    const value = body?.[bodyField];
    return typeof value === "string" && value ? value : null;
  }
  const headerName = (tokenFrom?.header ?? "x-recaptcha-token").toLowerCase();
  const raw = req.headers[headerName];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

type ApiRouteHandlerWithRecaptcha = (
  req: NextApiRequest,
  res: NextApiResponse,
  recaptcha: RecaptchaVerifySuccess,
) => unknown | Promise<unknown>;

/**
 * Pages Router equivalent of {@link withRecaptcha}: wraps an API route
 * handler, responding 400/403 JSON on missing token / failed verification and
 * passing the verification result as a third argument otherwise.
 *
 * **Token extraction (Pages Router):** `tokenFrom.jsonField` and
 * `tokenFrom.formField` are interchangeable here — both read the same
 * pre-parsed `req.body` that Next.js populates for JSON and
 * `application/x-www-form-urlencoded` bodies. This requires Next's default
 * body parser to be enabled; a route with `export const config = { api: {
 * bodyParser: false } }` or a raw `multipart/form-data` body will not
 * populate `req.body` and the token will not be found. The App Router
 * {@link withRecaptcha} differs: it parses the JSON or form body itself.
 *
 * **403 response shape:** `{ error: "recaptcha-verification-failed", reason }`
 * where `reason` is the failing error's class name (e.g.
 * `"RecaptchaScoreError"`, `"RecaptchaVerificationError"`) — a stable value
 * clients can switch on.
 */
export function withRecaptchaApiRoute(
  handler: ApiRouteHandlerWithRecaptcha,
  options: WithRecaptchaOptions = {},
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req, res) => {
    const token = extractTokenFromApiRequest(req, options.tokenFrom);
    if (!token) {
      res.status(400).json({ error: "recaptcha-token-missing" });
      return;
    }
    try {
      const recaptcha = await assertRecaptcha(token, options);
      await handler(req, res, recaptcha);
    } catch (error) {
      if (error instanceof RecaptchaConfigError) throw error;
      if (error instanceof RecaptchaError) {
        res.status(403).json({ error: "recaptcha-verification-failed", reason: error.name });
        return;
      }
      throw error;
    }
  };
}
