/** Hosts that serve the reCAPTCHA script and siteverify API. Use `"recaptcha.net"` where google.com is blocked. */
export type RecaptchaHost = "google.com" | "recaptcha.net";

const HOSTNAMES: Record<RecaptchaHost, string> = {
  "google.com": "www.google.com",
  "recaptcha.net": "www.recaptcha.net",
};

/** Base URL of the reCAPTCHA api.js script for the given host (default google.com). */
export function scriptBaseUrl(host: RecaptchaHost = "google.com"): string {
  return `https://${HOSTNAMES[host]}/recaptcha/api.js`;
}

/** siteverify endpoint URL for the given host (default google.com). */
export function siteverifyUrl(host: RecaptchaHost = "google.com"): string {
  return `https://${HOSTNAMES[host]}/recaptcha/api/siteverify`;
}

/** Google's documented default v3 score threshold ("By default, you can use a threshold of 0.5"). */
export const DEFAULT_MIN_SCORE = 0.5;

/** reCAPTCHA tokens are valid for two minutes and are single-use (Google docs/verify). */
export const TOKEN_TTL_SECONDS = 120;

/** v3 action names: "Actions might contain only alphanumeric characters, slashes, and underscores." */
export const ACTION_NAME_PATTERN = /^[A-Za-z0-9/_]+$/;
