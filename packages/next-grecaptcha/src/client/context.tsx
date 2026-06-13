"use client";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { RecaptchaHost } from "../shared/constants";
import { loadRecaptchaScript } from "./loader";

/** Configuration shared with all next-grecaptcha components below the provider. */
export interface ReCaptchaConfig {
  /** v2 site key for <ReCaptchaCheckbox> / <ReCaptchaInvisible>. */
  siteKey?: string;
  /** v3 site key for useReCaptchaV3. */
  v3SiteKey?: string;
  /** reCAPTCHA host domain. @default "google.com" — use `"recaptcha.net"` in regions where google.com is blocked. */
  host?: RecaptchaHost;
  /** Widget/badge language (`hl`). */
  hl?: string;
  /** CSP nonce for the injected script tag. */
  nonce?: string;
}

export interface ReCaptchaProviderProps extends ReCaptchaConfig {
  /**
   * Load the v3 script eagerly on mount when `v3SiteKey` is set (Google recommends
   * running v3 in the background of pages for analytics). @default true
   * @remarks Once the reCAPTCHA v3 script has loaded, changing `v3SiteKey` has no effect
   * because only one reCAPTCHA script is loaded per page; a full page reload is required
   * to switch keys.
   */
  autoLoadV3?: boolean;
  children: ReactNode;
}

const ReCaptchaConfigContext = createContext<ReCaptchaConfig>({});

/**
 * Returns the nearest provider's config; empty object when there is no provider.
 * @example const { siteKey } = useReCaptchaConfig();
 */
export function useReCaptchaConfig(): ReCaptchaConfig {
  return useContext(ReCaptchaConfigContext);
}

/**
 * Configures site keys, host, language, and CSP nonce for all descendants.
 * @example
 * ```tsx
 * <ReCaptchaProvider siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
 *   <App />
 * </ReCaptchaProvider>
 * ```
 */
export function ReCaptchaProvider({
  siteKey,
  v3SiteKey,
  host,
  hl,
  nonce,
  autoLoadV3 = true,
  children,
}: ReCaptchaProviderProps) {
  const value = useMemo(
    () => ({ siteKey, v3SiteKey, host, hl, nonce }),
    [siteKey, v3SiteKey, host, hl, nonce],
  );
  useEffect(() => {
    if (!v3SiteKey || !autoLoadV3) return;
    void loadRecaptchaScript({ render: v3SiteKey, host, hl, nonce }).catch((error: unknown) => {
      console.error("[next-grecaptcha] v3 script auto-load failed:", error);
    });
  }, [v3SiteKey, autoLoadV3, host, hl, nonce]);
  return <ReCaptchaConfigContext.Provider value={value}>{children}</ReCaptchaConfigContext.Provider>;
}
