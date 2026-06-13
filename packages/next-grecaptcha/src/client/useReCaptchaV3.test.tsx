// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecaptchaActionNameError, RecaptchaConfigError } from "../shared/errors";
import { ReCaptchaProvider } from "./context";
import { __resetRecaptchaLoaderForTests } from "./loader";
import { installGrecaptchaMock } from "./test-utils";
import { useReCaptchaV3 } from "./useReCaptchaV3";

beforeEach(() => {
  __resetRecaptchaLoaderForTests();
  document.head.replaceChildren();
  installGrecaptchaMock();
});
afterEach(() => {
  delete (window as { grecaptcha?: unknown }).grecaptcha;
  vi.restoreAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <ReCaptchaProvider v3SiteKey="V3KEY">{children}</ReCaptchaProvider>
);

describe("useReCaptchaV3", () => {
  it("becomes ready and executes with the configured site key", async () => {
    const { result } = renderHook(() => useReCaptchaV3(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.executeRecaptcha("login")).resolves.toBe("v3-token-login");
  });

  it("accepts a prop-level site key override", async () => {
    const { result } = renderHook(() => useReCaptchaV3({ siteKey: "OTHER" }), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await expect(result.current.executeRecaptcha("checkout/pay")).resolves.toBe("v3-token-checkout/pay");
  });

  it("rejects invalid action names with RecaptchaActionNameError", async () => {
    const { result } = renderHook(() => useReCaptchaV3(), { wrapper });
    await expect(result.current.executeRecaptcha("bad action!")).rejects.toBeInstanceOf(
      RecaptchaActionNameError,
    );
    await expect(result.current.executeRecaptcha("")).rejects.toBeInstanceOf(RecaptchaActionNameError);
  });

  it("rejects with RecaptchaConfigError when no v3 site key is configured", async () => {
    const { result } = renderHook(() => useReCaptchaV3());
    await expect(result.current.executeRecaptcha("login")).rejects.toBeInstanceOf(RecaptchaConfigError);
    expect(result.current.isReady).toBe(false);
  });
});
