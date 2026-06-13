import { RecaptchaConfigError, RecaptchaError } from "../shared/errors";
import type { RecaptchaVerifySuccess } from "../shared/types";
import { assertRecaptcha, type AssertRecaptchaOptions } from "./assert";

/**
 * Where the wrapper looks for the client's token. Set exactly one property.
 * When multiple fields are set, precedence is `jsonField` > `formField` > `header`.
 */
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
  return req.headers.get(tokenFrom?.header ?? "x-recaptcha-token")?.trim() || null;
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
 *
 * The returned function is typed `(req, ctx: unknown) => Promise<Response>` so
 * that it satisfies Next.js 15's generated route type-check (which requires the
 * second argument to be structurally compatible with `{ params: Promise<any> }`)
 * while still accepting callers that pass a plain `{}` context.  At runtime the
 * ctx value is spread into the inner handler as-is; no params are read.
 *
 * Dynamic-route handlers should supply an explicit type parameter so TypeScript
 * knows the shape of `ctx.params`:
 * ```ts
 * export const GET = withRecaptcha<{ params: Promise<{ id: string }> }>(
 *   async (_req, { recaptcha, params }) => {
 *     const { id } = await params;
 *     return Response.json({ id, recaptcha });
 *   },
 *   { secretKey: process.env.RECAPTCHA_SECRET_KEY! },
 * );
 * ```
 */
export function withRecaptcha<C extends object = object>(
  handler: RouteHandlerWithRecaptcha<C>,
  options: WithRecaptchaOptions = {},
): (req: Request, ctx: unknown) => Promise<Response> {
  const inner = async (req: Request, ctx: C): Promise<Response> => {
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
  // Cast is safe: the runtime body ignores the ctx type annotation; callers
  // that supply an explicit C (e.g. dynamic routes) pass a well-typed value,
  // while the `unknown` outer signature satisfies Next.js 15's ParamCheck.
  return inner as (req: Request, ctx: unknown) => Promise<Response>;
}
