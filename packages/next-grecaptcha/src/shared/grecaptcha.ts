/** Parameters accepted by `grecaptcha.render` (docs/display + docs/invisible). */
export interface RecaptchaRenderParameters {
  sitekey: string;
  /** @default "light" */
  theme?: "light" | "dark";
  /** @default "normal" — use "invisible" for invisible reCAPTCHA. */
  size?: "normal" | "compact" | "invisible";
  /** @default 0 */
  tabindex?: number;
  /** Invisible only. @default "bottomright" */
  badge?: "bottomright" | "bottomleft" | "inline";
  /** For plugin owners: separate widget ID space. @default false */
  isolated?: boolean;
  /** Fired with the response token after a successful challenge. */
  callback?: (token: string) => void;
  /** Fired when the response token expires (~2 minutes). */
  "expired-callback"?: () => void;
  /** Fired on errors (usually network connectivity). */
  "error-callback"?: () => void;
}

/** The `window.grecaptcha` API surface this package uses. */
export interface Grecaptcha {
  /** Explicitly renders a widget into the container. Returns the widget ID. */
  render(container: string | HTMLElement, parameters: RecaptchaRenderParameters): number;
  /** Resets the widget (first widget when ID omitted). */
  reset(widgetId?: number): void;
  /** Returns the widget's current response token ("" when unsolved). */
  getResponse(widgetId?: number): string;
  /** v2 invisible: programmatically invoke the challenge; token arrives via `callback`. */
  execute(widgetId?: number): void;
  /** v3: execute an assessment for the action; resolves with the token. */
  execute(siteKey: string, options: { action: string }): Promise<string>;
  /** Runs the callback once the reCAPTCHA library is ready. */
  ready(callback: () => void): void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}
