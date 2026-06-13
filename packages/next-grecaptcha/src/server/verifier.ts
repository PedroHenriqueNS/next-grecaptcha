import type { RecaptchaVerifyResult } from "../shared/types";
import { verifyRecaptcha, type VerifyRecaptchaOptions } from "./verify";

/**
 * Verification seam. The default implementation calls the public siteverify
 * API; a future reCAPTCHA Enterprise adapter (Google Cloud createAssessment)
 * can implement this interface without breaking changes.
 */
export interface Verifier<TOptions = VerifyRecaptchaOptions> {
  verify(token: string, options?: TOptions): Promise<RecaptchaVerifyResult>;
}

/** Default {@link Verifier} backed by the public siteverify API. */
export const siteverifyVerifier: Verifier = {
  verify: (token, options) => verifyRecaptcha(token, options),
};
