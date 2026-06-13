/**
 * Root entry of next-grecaptcha: shared types, constants, and error classes ONLY.
 * Importing this entry pulls in zero React and zero secret-handling code.
 * Components/hooks: `next-grecaptcha/client`. Verification: `next-grecaptcha/server`.
 */
export {
  ACTION_NAME_PATTERN,
  DEFAULT_MIN_SCORE,
  scriptBaseUrl,
  siteverifyUrl,
  TOKEN_TTL_SECONDS,
} from "./shared/constants";
export type { RecaptchaHost } from "./shared/constants";
export {
  RecaptchaActionMismatchError,
  RecaptchaActionNameError,
  RecaptchaBrowserImportError,
  RecaptchaConfigError,
  RecaptchaError,
  RecaptchaHostnameError,
  RecaptchaLoadError,
  RecaptchaScoreError,
  RecaptchaV1Error,
  RecaptchaVerificationError,
} from "./shared/errors";
export type {
  RecaptchaErrorCode,
  RecaptchaVerifyFailure,
  RecaptchaVerifyResult,
  RecaptchaVerifySuccess,
} from "./shared/types";
export type { Grecaptcha, RecaptchaRenderParameters } from "./shared/grecaptcha";
