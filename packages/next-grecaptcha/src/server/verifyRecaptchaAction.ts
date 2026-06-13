import type { RecaptchaVerifySuccess } from "../shared/types";
import { assertRecaptcha, type AssertRecaptchaOptions } from "./assert";

/** Options for {@link verifyRecaptchaAction}. */
export interface VerifyRecaptchaActionOptions extends AssertRecaptchaOptions {
  /** FormData field holding the token. @default "recaptchaToken" */
  formField?: string;
}

/**
 * Ergonomic verification for Server Actions: accepts the action's FormData
 * (reading the token from `formField`) or a raw token string, then runs
 * {@link assertRecaptcha}. Throws the same typed errors; catch RecaptchaError
 * to return a form-friendly failure state.
 */
export async function verifyRecaptchaAction(
  input: FormData | string,
  options: VerifyRecaptchaActionOptions = {},
): Promise<RecaptchaVerifySuccess> {
  let token: string;
  if (typeof input === "string") {
    token = input;
  } else {
    const value = input.get(options.formField ?? "recaptchaToken");
    token = typeof value === "string" ? value : "";
  }
  return assertRecaptcha(token, options);
}
