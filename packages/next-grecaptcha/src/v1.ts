export {};

import { RecaptchaV1Error } from "./shared/errors";

throw new RecaptchaV1Error(
  "reCAPTCHA v1 was permanently shut down by Google on March 31, 2018. " +
    "No script endpoint or verification API exists for it anymore, so next-grecaptcha cannot " +
    "(and will never) implement it. Migrate to v2 (<ReCaptchaCheckbox>/<ReCaptchaInvisible> from " +
    '"next-grecaptcha/client") or v3 (useReCaptchaV3). See the "Why no v1?" section of the README.',
);
