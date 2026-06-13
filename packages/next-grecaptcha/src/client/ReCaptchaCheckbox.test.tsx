// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReCaptchaProvider } from "./context";
import { __resetRecaptchaLoaderForTests } from "./loader";
import { installGrecaptchaMock, type GrecaptchaMockState } from "./test-utils";
import { ReCaptchaCheckbox, type ReCaptchaCheckboxHandle } from "./ReCaptchaCheckbox";

let mock: GrecaptchaMockState;

beforeEach(() => {
  __resetRecaptchaLoaderForTests();
  document.head.replaceChildren();
  mock = installGrecaptchaMock(); // grecaptcha pre-installed → loader resolves immediately
});
afterEach(() => {
  cleanup();
  delete (window as { grecaptcha?: unknown }).grecaptcha;
  vi.restoreAllMocks();
});

describe("ReCaptchaCheckbox", () => {
  it("renders the widget explicitly with sitekey/theme/size/tabindex", async () => {
    render(<ReCaptchaCheckbox siteKey="K2" theme="dark" size="compact" tabIndex={3} />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    expect(mock.widgets[0]!.params).toMatchObject({
      sitekey: "K2",
      theme: "dark",
      size: "compact",
      tabindex: 3,
    });
  });

  it("fires onToken / onExpired / onErrored from the widget callbacks", async () => {
    const onToken = vi.fn();
    const onExpired = vi.fn();
    const onErrored = vi.fn();
    render(
      <ReCaptchaCheckbox siteKey="K2" onToken={onToken} onExpired={onExpired} onErrored={onErrored} />,
    );
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    act(() => mock.widgets[0]!.params.callback?.("tok-1"));
    act(() => mock.widgets[0]!.params["expired-callback"]?.());
    act(() => mock.widgets[0]!.params["error-callback"]?.());
    expect(onToken).toHaveBeenCalledWith("tok-1");
    expect(onExpired).toHaveBeenCalledOnce();
    expect(onErrored).toHaveBeenCalledOnce();
  });

  it("exposes reset() and getResponse() via ref", async () => {
    const ref = createRef<ReCaptchaCheckboxHandle>();
    render(<ReCaptchaCheckbox ref={ref} siteKey="K2" />);
    await waitFor(() => expect(mock.widgets).toHaveLength(1));
    expect(ref.current!.getResponse()).toBe("response-0");
    ref.current!.reset();
    expect(mock.resetCalls).toContain(0);
  });

  it("supports multiple independent widgets on one page", async () => {
    const tokens: string[] = [];
    render(
      <>
        <ReCaptchaCheckbox siteKey="A" onToken={(t) => tokens.push(`a:${t}`)} />
        <ReCaptchaCheckbox siteKey="B" onToken={(t) => tokens.push(`b:${t}`)} />
      </>,
    );
    await waitFor(() => expect(mock.widgets).toHaveLength(2));
    act(() => mock.widgets[1]!.params.callback?.("t2"));
    act(() => mock.widgets[0]!.params.callback?.("t1"));
    expect(tokens).toEqual(["b:t2", "a:t1"]);
    expect(mock.widgets[0]!.params.sitekey).toBe("A");
    expect(mock.widgets[1]!.params.sitekey).toBe("B");
  });

  it("is idempotent under React Strict Mode double-effects", async () => {
    const { container } = render(
      <StrictMode>
        <ReCaptchaCheckbox siteKey="K2" />
      </StrictMode>,
    );
    await waitFor(() => expect(container.querySelectorAll("iframe")).toHaveLength(1));
    // the first effect's widget was reset + DOM cleared by cleanup; exactly one live widget remains
    expect(document.querySelectorAll("script")).toHaveLength(0); // grecaptcha pre-installed, no script needed
  });

  it("uses the provider siteKey, overridable per prop", async () => {
    render(
      <ReCaptchaProvider siteKey="FROM_PROVIDER">
        <ReCaptchaCheckbox />
        <ReCaptchaCheckbox siteKey="OVERRIDE" />
      </ReCaptchaProvider>,
    );
    await waitFor(() => expect(mock.widgets).toHaveLength(2));
    const keys = mock.widgets.map((w) => w.params.sitekey).sort();
    expect(keys).toEqual(["FROM_PROVIDER", "OVERRIDE"]);
  });

  it("throws RecaptchaConfigError without a site key", () => {
    expect(() => render(<ReCaptchaCheckbox />)).toThrow(/site key/);
  });
});
