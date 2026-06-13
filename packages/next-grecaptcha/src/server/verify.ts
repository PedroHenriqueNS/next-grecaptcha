import { siteverifyUrl, type RecaptchaHost } from "../shared/constants";
import { RecaptchaConfigError } from "../shared/errors";
import type { RecaptchaErrorCode, RecaptchaVerifyResult } from "../shared/types";

/** Options for {@link verifyRecaptcha}. */
export interface VerifyRecaptchaOptions {
  /** Secret key; falls back to `process.env.RECAPTCHA_SECRET_KEY`. */
  secretKey?: string;
  /** The end user's IP address, forwarded as `remoteip`. */
  remoteIp?: string;
  /** @default "google.com" — use "recaptcha.net" where google.com is blocked. */
  host?: RecaptchaHost;
  /** Injectable fetch implementation (testing/instrumentation). @default globalThis.fetch */
  fetch?: typeof globalThis.fetch;
}

/** Raw siteverify JSON shape (snake_case / kebab-case per Google docs). */
interface SiteverifyRawResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verifies a reCAPTCHA token against Google's siteverify API with a
 * form-urlencoded POST (the API does not accept JSON bodies). Never throws on
 * verification failure — returns a discriminated union; throws
 * {@link RecaptchaConfigError} only when no secret key is configured.
 *
 * Uses only global `fetch`: works on Node 18+, the Edge runtime, and Next.js middleware.
 */
export async function verifyRecaptcha(
  token: string,
  options: VerifyRecaptchaOptions = {},
): Promise<RecaptchaVerifyResult> {
  const secret = options.secretKey ?? process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new RecaptchaConfigError(
      "No reCAPTCHA secret key: pass options.secretKey or set the RECAPTCHA_SECRET_KEY environment variable.",
    );
  }
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }
  const body = new URLSearchParams({ secret, response: token });
  if (options.remoteIp) body.set("remoteip", options.remoteIp);
  const doFetch = options.fetch ?? globalThis.fetch;
  const response = await doFetch(siteverifyUrl(options.host), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    return { success: false, errorCodes: ["bad-request"] };
  }
  const data = (await response.json()) as SiteverifyRawResponse;
  if (data.success) {
    return {
      success: true,
      challengeTs: data.challenge_ts ?? "",
      hostname: data.hostname ?? "",
      ...(data.score !== undefined ? { score: data.score } : {}),
      ...(data.action !== undefined ? { action: data.action } : {}),
    };
  }
  return { success: false, errorCodes: (data["error-codes"] ?? []) as RecaptchaErrorCode[] };
}
