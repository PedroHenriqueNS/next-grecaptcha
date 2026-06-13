import type { RecaptchaErrorCode } from "./types";

/** Base class for every error thrown by next-grecaptcha. */
export class RecaptchaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Missing/invalid configuration (e.g. no secret key, no site key). */
export class RecaptchaConfigError extends RecaptchaError {}

/** The reCAPTCHA script failed to load or the widget errored. */
export class RecaptchaLoadError extends RecaptchaError {}

/** A v3 action name contains characters outside A–Z a–z 0–9 / _. */
export class RecaptchaActionNameError extends RecaptchaError {}

/** `assertRecaptcha`: siteverify returned `success: false`. */
export class RecaptchaVerificationError extends RecaptchaError {
  readonly errorCodes: RecaptchaErrorCode[];
  constructor(errorCodes: RecaptchaErrorCode[]) {
    super(`reCAPTCHA verification failed: ${errorCodes.join(", ") || "unknown"}`);
    this.errorCodes = errorCodes;
  }
}

/** `assertRecaptcha`: score below threshold, or no score present on the response. */
export class RecaptchaScoreError extends RecaptchaError {
  readonly score: number | undefined;
  readonly minScore: number;
  constructor(score: number | undefined, minScore: number) {
    super(
      score === undefined
        ? `reCAPTCHA response contains no score (expected a v3 token); required minimum is ${minScore}`
        : `reCAPTCHA score ${score} is below the required minimum ${minScore}`,
    );
    this.score = score;
    this.minScore = minScore;
  }
}

/** `assertRecaptcha`: the token's action does not match the expected action. */
export class RecaptchaActionMismatchError extends RecaptchaError {
  readonly expectedAction: string;
  readonly action: string | undefined;
  constructor(expectedAction: string, action: string | undefined) {
    super(`reCAPTCHA action mismatch: expected "${expectedAction}", got "${action ?? "<none>"}"`);
    this.expectedAction = expectedAction;
    this.action = action;
  }
}

/** `assertRecaptcha`: the token's hostname is not in the expected set. */
export class RecaptchaHostnameError extends RecaptchaError {
  readonly expectedHostnames: readonly string[];
  readonly hostname: string | undefined;
  constructor(expectedHostnames: readonly string[], hostname: string | undefined) {
    super(
      `reCAPTCHA hostname mismatch: expected one of [${expectedHostnames.join(", ")}], got "${hostname ?? "<none>"}"`,
    );
    this.expectedHostnames = expectedHostnames;
    this.hostname = hostname;
  }
}

/** `next-grecaptcha/server` was imported in a browser environment. */
export class RecaptchaBrowserImportError extends RecaptchaError {}

/** Any import of a reCAPTCHA v1 path. v1 was shut down by Google on 2018-03-31. */
export class RecaptchaV1Error extends RecaptchaError {}
