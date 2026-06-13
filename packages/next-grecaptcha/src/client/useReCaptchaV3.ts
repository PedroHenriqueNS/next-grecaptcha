"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACTION_NAME_PATTERN } from "../shared/constants";
import { RecaptchaActionNameError, RecaptchaConfigError } from "../shared/errors";
import type { Grecaptcha } from "../shared/grecaptcha";
import { useReCaptchaConfig } from "./context";
import { loadRecaptchaScript } from "./loader";

export interface UseReCaptchaV3Options {
  /** v3 site key; falls back to the provider's `v3SiteKey`. */
  siteKey?: string;
}

export interface UseReCaptchaV3Result {
  /**
   * Runs a v3 assessment for the action and resolves with the token.
   * Action names may contain only A–Z, a–z, 0–9, slashes, and underscores.
   * Lazily loads the script if the provider has not loaded it yet.
   * @throws {RecaptchaActionNameError} If the action name is empty or contains invalid characters.
   * @throws {RecaptchaConfigError} If no v3 site key is available.
   * @throws {RecaptchaLoadError} If the reCAPTCHA script fails to load on the lazy path.
   */
  executeRecaptcha: (action: string) => Promise<string>;
  /** True once the reCAPTCHA library is loaded and ready. */
  isReady: boolean;
}

/**
 * React hook for Google reCAPTCHA v3 (score-based, no user interaction).
 * Reads the v3 site key from the nearest `<ReCaptchaProvider>` (`v3SiteKey`);
 * `options.siteKey` overrides it when provided.
 * @returns `{ executeRecaptcha, isReady }` — call `executeRecaptcha(action)` to obtain a token.
 */
export function useReCaptchaV3(options?: UseReCaptchaV3Options): UseReCaptchaV3Result {
  const config = useReCaptchaConfig();
  const siteKey = options?.siteKey ?? config.v3SiteKey;
  const { host, hl, nonce } = config;
  const [isReady, setIsReady] = useState(false);
  const grecaptchaRef = useRef<Grecaptcha | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    void loadRecaptchaScript({ render: siteKey, host, hl, nonce })
      .then((g) => {
        g.ready(() => {
          if (cancelled) return;
          grecaptchaRef.current = g;
          setIsReady(true);
        });
      })
      .catch((error: unknown) => {
        console.error("[next-grecaptcha] v3 script load failed:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [siteKey, host, hl, nonce]);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string> => {
      if (!ACTION_NAME_PATTERN.test(action)) {
        throw new RecaptchaActionNameError(
          `Invalid reCAPTCHA action "${action}". Actions may contain only ` +
            "alphanumeric characters, slashes, and underscores.",
        );
      }
      if (!siteKey) {
        throw new RecaptchaConfigError(
          "useReCaptchaV3 needs a v3 site key: pass options.siteKey or set v3SiteKey on <ReCaptchaProvider>.",
        );
      }
      const g = grecaptchaRef.current ?? (await loadRecaptchaScript({ render: siteKey, host, hl, nonce }));
      await new Promise<void>((resolve) => g.ready(resolve));
      return g.execute(siteKey, { action });
    },
    [siteKey, host, hl, nonce],
  );

  return { executeRecaptcha, isReady };
}
