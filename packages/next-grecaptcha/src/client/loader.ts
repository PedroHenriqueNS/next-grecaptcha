import { scriptBaseUrl, type RecaptchaHost } from "../shared/constants";
import { RecaptchaLoadError } from "../shared/errors";
import type { Grecaptcha } from "../shared/grecaptcha";

/** Options controlling the injected reCAPTCHA script URL. */
export interface LoadRecaptchaOptions {
  /** `"explicit"` for v2 (we call grecaptcha.render ourselves) or the v3 site key. */
  render: "explicit" | (string & {});
  /** @default "google.com" — use "recaptcha.net" where google.com is blocked. */
  host?: RecaptchaHost;
  /** Widget/badge language (`hl` query parameter). */
  hl?: string;
  /** CSP nonce set on the injected script tag. */
  nonce?: string;
}

let loadPromise: Promise<Grecaptcha> | null = null;
let loadedUrl: string | null = null;

/** Builds the api.js URL (without the onload param, which is generated per load). */
export function buildScriptUrl(options: LoadRecaptchaOptions): string {
  const url = new URL(scriptBaseUrl(options.host));
  url.searchParams.set("render", options.render);
  if (options.hl) url.searchParams.set("hl", options.hl);
  return url.toString();
}

/**
 * Loads Google's reCAPTCHA api.js exactly once per page, no matter how many
 * components mount (idempotent under React Strict Mode double-effects and
 * Next.js client-side navigation). Subsequent calls reuse the same promise;
 * calls with different options warn and reuse the already-loaded script,
 * because only one api.js can run per page.
 */
export function loadRecaptchaScript(options: LoadRecaptchaOptions): Promise<Grecaptcha> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new RecaptchaLoadError(
        "loadRecaptchaScript can only run in the browser; call it from an effect.",
      ),
    );
  }
  const url = buildScriptUrl(options);
  if (loadPromise) {
    if (loadedUrl !== url) {
      console.warn(
        `[next-grecaptcha] reCAPTCHA script already loading from ${loadedUrl ?? "<unknown>"}; ` +
          `ignoring different options (${url}). Only one reCAPTCHA script is supported per page.`,
      );
    }
    return loadPromise;
  }
  if (window.grecaptcha) {
    loadedUrl = url;
    loadPromise = Promise.resolve(window.grecaptcha);
    return loadPromise;
  }
  loadedUrl = url;
  loadPromise = new Promise<Grecaptcha>((resolve, reject) => {
    const callbackName = `__nextGrecaptchaOnload_${Math.random().toString(36).slice(2)}`;
    const w = window as unknown as Record<string, unknown>;
    w[callbackName] = () => {
      delete w[callbackName];
      if (window.grecaptcha) {
        resolve(window.grecaptcha);
      } else {
        reject(
          new RecaptchaLoadError("reCAPTCHA script loaded but window.grecaptcha is missing."),
        );
      }
    };
    const script = document.createElement("script");
    script.src = `${url}&onload=${callbackName}`;
    script.async = true;
    script.defer = true;
    if (options.nonce) script.setAttribute("nonce", options.nonce);
    script.addEventListener("error", () => {
      delete w[callbackName];
      script.remove();
      loadPromise = null; // allow a retry
      loadedUrl = null;
      reject(new RecaptchaLoadError(`Failed to load the reCAPTCHA script from ${url}`));
    });
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** Test-only: clears the module-level singleton between tests. */
export function __resetRecaptchaLoaderForTests(): void {
  loadPromise = null;
  loadedUrl = null;
}
