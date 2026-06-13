"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { RecaptchaHost } from "../shared/constants";
import { RecaptchaConfigError } from "../shared/errors";
import type { Grecaptcha } from "../shared/grecaptcha";
import { useReCaptchaConfig } from "./context";
import { loadRecaptchaScript } from "./loader";

/** Imperative handle exposed through the component ref. */
export interface ReCaptchaCheckboxHandle {
  /** Resets the widget so the user can solve it again. */
  reset(): void;
  /** Returns the current response token ("" when unsolved or expired). */
  getResponse(): string;
}

export interface ReCaptchaCheckboxProps {
  /** v2 site key; falls back to the provider's `siteKey`. */
  siteKey?: string;
  /** @default "light" */
  theme?: "light" | "dark";
  /** @default "normal" */
  size?: "normal" | "compact";
  /** @default 0 */
  tabIndex?: number;
  /** Widget language; falls back to the provider's `hl`. */
  hl?: string;
  /** CSS class applied to the container `<div>`. */
  className?: string;
  /** Fired with the response token when the user solves the challenge. */
  onToken?: (token: string) => void;
  /** Fired when the token expires (~2 minutes after solving). */
  onExpired?: () => void;
  /** Fired on widget errors (usually connectivity) and script load failure. */
  onErrored?: () => void;
}

/**
 * Google reCAPTCHA v2 checkbox, rendered explicitly via `grecaptcha.render`.
 * Multiple independent instances per page are supported. SSR-safe: renders an
 * empty container on the server and mounts the widget in an effect.
 */
export const ReCaptchaCheckbox = forwardRef<ReCaptchaCheckboxHandle, ReCaptchaCheckboxProps>(
  function ReCaptchaCheckbox(
    { siteKey, theme, size, tabIndex, hl, className, onToken, onExpired, onErrored },
    ref,
  ) {
    const config = useReCaptchaConfig();
    const resolvedKey = siteKey ?? config.siteKey;
    if (!resolvedKey) {
      throw new RecaptchaConfigError(
        "ReCaptchaCheckbox needs a site key: pass the siteKey prop or set it on <ReCaptchaProvider>.",
      );
    }
    const host: RecaptchaHost | undefined = config.host;
    const language = hl ?? config.hl;
    const nonce = config.nonce;

    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<{ g: Grecaptcha; id: number } | null>(null);
    const callbacksRef = useRef({ onToken, onExpired, onErrored });
    callbacksRef.current = { onToken, onExpired, onErrored };

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let cancelled = false;
      void loadRecaptchaScript({ render: "explicit", host, hl: language, nonce })
        .then((g) => {
          if (cancelled || widgetRef.current) return;
          // fresh mount node per effect run: idempotent under Strict Mode double-effects
          const mount = document.createElement("div");
          container.appendChild(mount);
          const id = g.render(mount, {
            sitekey: resolvedKey,
            theme,
            size,
            tabindex: tabIndex,
            callback: (token) => callbacksRef.current.onToken?.(token),
            "expired-callback": () => callbacksRef.current.onExpired?.(),
            "error-callback": () => callbacksRef.current.onErrored?.(),
          });
          widgetRef.current = { g, id };
        })
        .catch(() => callbacksRef.current.onErrored?.());
      return () => {
        cancelled = true;
        const widget = widgetRef.current;
        if (widget) {
          try {
            widget.g.reset(widget.id);
          } catch {
            // widget DOM already gone (client-side navigation) — nothing to reset
          }
          widgetRef.current = null;
        }
        container.replaceChildren();
      };
    }, [resolvedKey, theme, size, tabIndex, host, language, nonce]);

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          const widget = widgetRef.current;
          if (widget) widget.g.reset(widget.id);
        },
        getResponse() {
          const widget = widgetRef.current;
          return widget ? widget.g.getResponse(widget.id) : "";
        },
      }),
      [],
    );

    return <div ref={containerRef} className={className} />;
  },
);
