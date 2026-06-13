import { assertServerEnvironment } from "./guard";

assertServerEnvironment();

export { verifyRecaptcha, type VerifyRecaptchaOptions } from "./verify";
export { siteverifyVerifier, type Verifier } from "./verifier";
export { assertRecaptcha, type AssertRecaptchaOptions } from "./assert";
export {
  extractTokenFromRequest,
  withRecaptcha,
  type TokenSource,
  type WithRecaptchaOptions,
} from "./withRecaptcha";
