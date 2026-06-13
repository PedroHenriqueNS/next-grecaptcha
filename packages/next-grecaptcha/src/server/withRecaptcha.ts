import { RecaptchaConfigError, RecaptchaError } from "../shared/errors";
import type { RecaptchaVerifySuccess } from "../shared/types";
import { assertRecaptcha, type AssertRecaptchaOptions } from "./assert";

/** Where the wrapper looks for the client's token. Set exactly one property. */
export interface TokenSource {
  /** Request header name. @default "x-recaptcha-token" */
  header?: string;
  /** Top-level field of a JSON body. */
  jsonField?: string;
  /** Field of a form-data / urlencoded body. */
  formField?: string;
}

/** Options for {@link withRecaptcha} and the Pages Router/Server Action helpers. */
export interface WithRecaptchaOptions extends AssertRecaptchaOptions {
  /** @default { header: "x-recaptcha-token" } */
  tokenFrom?: TokenSource;
}

/** Extracts the reCAPTCHA token from a Fetch API Request per the TokenSource. */
export async function extractTokenFromRequest(
  req: Request,
  tokenFrom?: TokenSource,
): Promise<string | null> {
  if (tokenFrom?.jsonField) {
    try {
      const data = (await req.clone().json()) as Record<string, unknown>;
      const value = data[tokenFrom.jsonField];
      return typeof value === "string" && value ? value : null;
    } catch {
      return null;
    }
  }
  if (tokenFrom?.formField) {
    try {
      const form = await req.clone().formData();
      const value = form.get(tokenFrom.formField);
      return typeof value === "string" && value ? value : null;
    } catch {
      return null;
    }
  }
  return req.headers.get(tokenFrom?.header ?? "x-recaptcha-token");
}

type RouteHandlerWithRecaptcha<C> = (
  req: Request,
  ctx: C & { recaptcha: RecaptchaVerifySuccess },
) => Response | Promise<Response>;

/**
 * Wraps an App Router Route Handler with reCAPTCHA verification. Responds
 * 400 JSON when the token is missing and 403 JSON when verification fails;
 * otherwise calls the handler with the verification result attached to the
 * context. {@link RecaptchaConfigError} (server misconfiguration) is rethrown.
 */
export function withRecaptcha<C extends object = Record<string, never>>(
  handler: RouteHandlerWithRecaptcha<C>,
  options: WithRecaptchaOptions = {},
): (req: Request, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    const token = await extractTokenFromRequest(req, options.tokenFrom);
    if (!token) {
      return Response.json({ error: "recaptcha-token-missing" }, { status: 400 });
    }
    try {
      const recaptcha = await assertRecaptcha(token, options);
      return await handler(req, { ...ctx, recaptcha });
    } catch (error) {
      if (error instanceof RecaptchaConfigError) throw error;
      if (error instanceof RecaptchaError) {
        return Response.json(
          { error: "recaptcha-verification-failed", reason: error.name },
          { status: 403 },
        );
      }
      throw error;
    }
  };
}
