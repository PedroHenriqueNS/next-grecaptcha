"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { RecaptchaHost } from "../shared/constants";
import { RecaptchaConfigError, RecaptchaError, RecaptchaLoadError } from "../shared/errors";
import type { Grecaptcha } from "../shared/grecaptcha";
import { useReCaptchaConfig } from "./context";
import { loadRecaptchaScript } from "./loader";

/** Imperative handle exposed through the component ref. */
export interface ReCaptchaInvisibleHandle {
  /**
   * Programmatically invokes the invisible challenge. Resolves with the
   * response token (delivered by the widget callback); rejects when the
   * widget's error-callback fires, on reset, or on unmount.
   */
  execute(): Promise<string>;
  /** Resets the widget; any in-flight execute() is rejected. */
  reset(): void;
}

export interface ReCaptchaInvisibleProps {
  /** v2 site key; falls back to the provider's `siteKey`. */
  siteKey?: string;
  /** Badge position. @default "bottomright" */
  badge?: "bottomright" | "bottomleft" | "inline";
  /** @default 0 */
  tabIndex?: number;
  /** Widget language; falls back to the provider's `hl`. */
  hl?: string;
  className?: string;
  /** Fired when a previously obtained token expires (~2 minutes). */
  onExpired?: () => void;
}

interface ReadyWidget {
  g: Grecaptcha;
  id: number;
}

/**
 * Google reCAPTCHA v2 invisible, rendered explicitly with `size: "invisible"`.
 * Drive it through the ref: `await ref.current.execute()` returns the token.
 */
export const ReCaptchaInvisible = forwardRef<ReCaptchaInvisibleHandle, ReCaptchaInvisibleProps>(
  function ReCaptchaInvisible({ siteKey, badge, tabIndex, hl, className, onExpired }, ref) {
    const config = useReCaptchaConfig();
    const resolvedKey = siteKey ?? config.siteKey;
    if (!resolvedKey) {
      throw new RecaptchaConfigError(
        "ReCaptchaInvisible needs a site key: pass the siteKey prop or set it on <ReCaptchaProvider>.",
      );
    }
    const host: RecaptchaHost | undefined = config.host;
    const language = hl ?? config.hl;
    const nonce = config.nonce;

    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<ReadyWidget | null>(null);
    const readyWaitersRef = useRef<Array<(w: ReadyWidget) => void>>([]);
    const pendingRef = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);
    const onExpiredRef = useRef(onExpired);
    onExpiredRef.current = onExpired;

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let cancelled = false;
      void loadRecaptchaScript({ render: "explicit", host, hl: language, nonce })
        .then((g) => {
          if (cancelled || widgetRef.current) return;
          const mount = document.createElement("div");
          container.appendChild(mount);
          const id = g.render(mount, {
            sitekey: resolvedKey,
            size: "invisible",
            badge,
            tabindex: tabIndex,
            callback: (token) => {
              pendingRef.current?.resolve(token);
              pendingRef.current = null;
            },
            "expired-callback": () => onExpiredRef.current?.(),
            "error-callback": () => {
              pendingRef.current?.reject(
                new RecaptchaLoadError("reCAPTCHA reported an error during the invisible challenge."),
              );
              pendingRef.current = null;
            },
          });
          const readyWidget = { g, id };
          widgetRef.current = readyWidget;
          for (const waiter of readyWaitersRef.current.splice(0)) waiter(readyWidget);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          pendingRef.current?.reject(
            error instanceof Error ? error : new RecaptchaLoadError("reCAPTCHA script failed to load."),
          );
          pendingRef.current = null;
        });
      return () => {
        cancelled = true;
        const widget = widgetRef.current;
        if (widget) {
          try {
            widget.g.reset(widget.id);
          } catch {
            // widget DOM already gone — nothing to reset
          }
          widgetRef.current = null;
        }
        pendingRef.current?.reject(new RecaptchaError("ReCaptchaInvisible unmounted."));
        pendingRef.current = null;
        readyWaitersRef.current = [];
        container.replaceChildren();
      };
    }, [resolvedKey, badge, tabIndex, host, language, nonce]);

    useImperativeHandle(
      ref,
      () => ({
        execute() {
          return new Promise<string>((resolve, reject) => {
            if (pendingRef.current) {
              reject(new RecaptchaError("An execute() call is already in progress."));
              return;
            }
            pendingRef.current = { resolve, reject };
            const run = (widget: ReadyWidget) => {
              try {
                widget.g.execute(widget.id);
              } catch (error) {
                pendingRef.current = null;
                reject(error instanceof Error ? error : new RecaptchaError("execute() failed."));
              }
            };
            if (widgetRef.current) run(widgetRef.current);
            else readyWaitersRef.current.push(run);
          });
        },
        reset() {
          pendingRef.current?.reject(new RecaptchaError("The reCAPTCHA widget was reset."));
          pendingRef.current = null;
          const widget = widgetRef.current;
          if (widget) widget.g.reset(widget.id);
        },
      }),
      [],
    );

    return <div ref={containerRef} className={className} />;
  },
);
