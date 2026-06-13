/** The complete set of error codes the siteverify API documents. */
export type RecaptchaErrorCode =
  | "missing-input-secret"
  | "invalid-input-secret"
  | "missing-input-response"
  | "invalid-input-response"
  | "bad-request"
  | "timeout-or-duplicate";

/** Successful siteverify outcome. `score`/`action` are present for v3 tokens only. */
export interface RecaptchaVerifySuccess {
  success: true;
  /** ISO 8601 timestamp of the challenge load (siteverify `challenge_ts`). */
  challengeTs: string;
  /** Hostname of the site where the reCAPTCHA was solved. */
  hostname: string;
  /** v3 only: score for this request (0.0–1.0). */
  score?: number;
  /** v3 only: the action name this token was created for. */
  action?: string;
}

/** Failed siteverify outcome with Google's documented error codes. */
export interface RecaptchaVerifyFailure {
  success: false;
  errorCodes: RecaptchaErrorCode[];
}

/** Discriminated union returned by `verifyRecaptcha` — discriminate on `success`. */
export type RecaptchaVerifyResult = RecaptchaVerifySuccess | RecaptchaVerifyFailure;
