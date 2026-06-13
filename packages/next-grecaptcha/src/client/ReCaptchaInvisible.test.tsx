// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRecaptchaLoaderForTests } from "./loader";
import { installGrecaptchaMock, type GrecaptchaMockState } from "./test-utils";
import { ReCaptchaInvisible, type ReCaptchaInvisibleHandle } from "./ReCaptchaInvisible";

let mock: GrecaptchaMockState;

beforeEach(() => {
  __resetRecaptchaLoaderForTests();
  document.head.replaceChildren();
  mock = installGrecaptchaMock();
});
afterEach(() => {
  cleanup();
  delete (window as { grecaptcha?: unknown }).grecaptcha;
  vi.restoreAllMocks();
});

describe("ReCaptchaInvisible", () => {
  it("renders with size invisible and the badge position", async () => {
    render(<ReCaptchaInvisible siteKey="K2" badge="bottomleft" />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    expect(mock.widgets[0]!.params).toMatchObject({ sitekey: "K2", size: "invisible", badge: "bottomleft" });
  });

  it("execute() resolves with the token from the render callback", async () => {
    const ref = createRef<ReCaptchaInvisibleHandle>();
    render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    // the mock's execute() fires the widget callback on a microtask
    const token = await act(async () => ref.current!.execute());
    expect(token).toBe("invisible-token-0");
  });

  it("execute() rejects when the error-callback fires", async () => {
    const ref = createRef<ReCaptchaInvisibleHandle>();
    render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    // make execute() trigger the error callback instead of the token callback
    mock.grecaptcha.execute = ((widgetId?: number | string) => {
      if (typeof widgetId === "string") return Promise.resolve("");
      queueMicrotask(() => mock.widgets[widgetId ?? 0]?.params["error-callback"]?.());
      return undefined;
    }) as typeof mock.grecaptcha.execute;
    await expect(act(async () => ref.current!.execute())).rejects.toThrow(/error/i);
  });

  it("execute() works when called before the widget is ready (queued)", async () => {
    const ref = createRef<ReCaptchaInvisibleHandle>();
    render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    // call immediately, before waitFor — the call must queue until render completes
    const tokenPromise = act(async () => ref.current!.execute());
    await expect(tokenPromise).resolves.toBe("invisible-token-0");
  });

  it("reset() resets the widget and rejects an in-flight execute", async () => {
    const ref = createRef<ReCaptchaInvisibleHandle>();
    render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    mock.grecaptcha.execute = ((..._args: unknown[]) => undefined) as typeof mock.grecaptcha.execute; // never calls back
    const pending = ref.current!.execute();
    const expectation = expect(pending).rejects.toThrow(/reset/);
    act(() => ref.current!.reset());
    await expectation;
    expect(mock.resetCalls).toContain(0);
  });

  it("rejects a queued execute() when unmounted before the widget is ready", async () => {
    const ref = createRef<ReCaptchaInvisibleHandle>();
    const { unmount } = render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    const pending = ref.current!.execute(); // queued — widget not ready (loader resolves later)
    const expectation = expect(pending).rejects.toThrow(/unmount/i);
    act(() => unmount());
    await expectation;
  });

  it("rejects a queued execute() when the script fails to load", async () => {
    delete (window as { grecaptcha?: unknown }).grecaptcha;
    __resetRecaptchaLoaderForTests();
    const ref = createRef<ReCaptchaInvisibleHandle>();
    render(<ReCaptchaInvisible ref={ref} siteKey="K2" />);
    const pending = ref.current!.execute(); // queued before the (doomed) load resolves
    const expectation = expect(pending).rejects.toThrow(/load/i);
    const script = document.querySelector("script");
    script!.dispatchEvent(new Event("error"));
    await expectation;
  });

  it("calls onExpired when the widget token expires", async () => {
    const onExpired = vi.fn();
    render(<ReCaptchaInvisible siteKey="K2" onExpired={onExpired} />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    act(() => mock.widgets[0]!.params["expired-callback"]?.());
    expect(onExpired).toHaveBeenCalledOnce();
  });
});
