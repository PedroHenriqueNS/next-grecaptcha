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
   */
  autoLoadV3?: boolean;
  children: ReactNode;
}

const ReCaptchaConfigContext = createContext<ReCaptchaConfig>({});

/** Returns the nearest provider's config; empty object when there is no provider. */
export function useReCaptchaConfig(): ReCaptchaConfig {
  return useContext(ReCaptchaConfigContext);
}

/** Configures site keys, host, language, and CSP nonce for all descendants. */
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
