import { DEFAULT_MIN_SCORE } from "../shared/constants";
import {
  RecaptchaActionMismatchError,
  RecaptchaHostnameError,
  RecaptchaScoreError,
  RecaptchaVerificationError,
} from "../shared/errors";
import type { RecaptchaVerifySuccess } from "../shared/types";
import { verifyRecaptcha, type VerifyRecaptchaOptions } from "./verify";

/** Options for {@link assertRecaptcha}. */
export interface AssertRecaptchaOptions extends VerifyRecaptchaOptions {
  /** Required v3 action; mismatch throws {@link RecaptchaActionMismatchError}. */
  expectedAction?: string;
  /**
   * Minimum acceptable v3 score. When the response carries a score, the
   * default threshold 0.5 (Google's documented default) is enforced. Setting
   * this explicitly also makes a score-less (v2) response throw.
   * @default 0.5
   */
  minScore?: number;
  /** Allowed hostname(s); mismatch throws {@link RecaptchaHostnameError}. */
  expectedHostname?: string | readonly string[];
}

/**
 * Strict variant of {@link verifyRecaptcha} for v3 flows: verifies the token
 * and additionally enforces action, score threshold, and hostname. Throws
 * typed errors with safe messages; returns the success result otherwise.
 */
export async function assertRecaptcha(
  token: string,
  options: AssertRecaptchaOptions = {},
): Promise<RecaptchaVerifySuccess> {
  const result = await verifyRecaptcha(token, options);
  if (!result.success) {
    throw new RecaptchaVerificationError(result.errorCodes);
  }
  if (options.expectedAction !== undefined && result.action !== options.expectedAction) {
    throw new RecaptchaActionMismatchError(options.expectedAction, result.action);
  }
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  if (options.minScore !== undefined && result.score === undefined) {
    throw new RecaptchaScoreError(undefined, options.minScore);
  }
  if (result.score !== undefined && result.score < minScore) {
    throw new RecaptchaScoreError(result.score, minScore);
  }
  if (options.expectedHostname !== undefined) {
    const expected =
      typeof options.expectedHostname === "string" ? [options.expectedHostname] : options.expectedHostname;
    if (!expected.includes(result.hostname)) {
      throw new RecaptchaHostnameError(expected, result.hostname);
    }
  }
  return result;
}
