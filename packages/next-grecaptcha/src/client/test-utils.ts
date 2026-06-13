import type { Grecaptcha, RecaptchaRenderParameters } from "../shared/grecaptcha";

export interface MockWidget {
  container: HTMLElement;
  params: RecaptchaRenderParameters;
}

export interface GrecaptchaMockState {
  grecaptcha: Grecaptcha;
  widgets: MockWidget[];
  renderCalls: number;
  resetCalls: Array<number | undefined>;
}

/** Installs a fake `window.grecaptcha` and returns live, inspectable state. */
export function installGrecaptchaMock(): GrecaptchaMockState {
  const widgets: MockWidget[] = [];
  const live = { widgets, renderCalls: 0, resetCalls: [] } as unknown as GrecaptchaMockState;
  const execute = ((widgetIdOrSiteKey?: number | string, options?: { action: string }) => {
    if (typeof widgetIdOrSiteKey === "string") {
      return Promise.resolve(`v3-token-${options?.action ?? "none"}`);
    }
    const widget = widgets[widgetIdOrSiteKey ?? 0];
    queueMicrotask(() => widget?.params.callback?.(`invisible-token-${widgetIdOrSiteKey ?? 0}`));
    return undefined;
  }) as Grecaptcha["execute"];
  const grecaptcha: Grecaptcha = {
    render(container, params) {
      live.renderCalls += 1;
      const el =
        typeof container === "string"
          ? (document.getElementById(container) as HTMLElement)
          : container;
      el.appendChild(document.createElement("iframe")); // simulate Google's widget DOM
      widgets.push({ container: el, params });
      return widgets.length - 1;
    },
    reset(widgetId) {
      live.resetCalls.push(widgetId);
    },
    getResponse(widgetId) {
      return `response-${widgetId ?? 0}`;
    },
    execute,
    ready(cb) {
      cb();
    },
  };
  live.grecaptcha = grecaptcha;
  window.grecaptcha = grecaptcha;
  return live;
}
