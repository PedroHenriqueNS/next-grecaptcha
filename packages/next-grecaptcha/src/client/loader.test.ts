// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installGrecaptchaMock } from "./test-utils";
import {
  __resetRecaptchaLoaderForTests,
  buildScriptUrl,
  loadRecaptchaScript,
} from "./loader";

function getScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll("script"));
}

/** Simulates Google's api.js arriving: installs grecaptcha and fires the onload callback. */
function simulateScriptLoad(): void {
  const script = getScripts()[0];
  if (!script) throw new Error("no script injected");
  const cbName = new URL(script.src).searchParams.get("onload");
  if (!cbName) throw new Error("no onload param");
  installGrecaptchaMock();
  const cb = (window as unknown as Record<string, (() => void) | undefined>)[cbName];
  if (!cb) throw new Error(`onload callback "${cbName}" not found on window`);
  cb();
}

beforeEach(() => {
  __resetRecaptchaLoaderForTests();
  delete (window as { grecaptcha?: unknown }).grecaptcha;
  document.head.replaceChildren();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildScriptUrl", () => {
  it("builds v2 explicit and v3 URLs with hl", () => {
    expect(buildScriptUrl({ render: "explicit" })).toBe(
      "https://www.google.com/recaptcha/api.js?render=explicit",
    );
    expect(buildScriptUrl({ render: "SITEKEY", host: "recaptcha.net", hl: "pt-BR" })).toBe(
      "https://www.recaptcha.net/recaptcha/api.js?render=SITEKEY&hl=pt-BR",
    );
  });
});

describe("loadRecaptchaScript", () => {
  it("injects exactly one script tag for concurrent calls and resolves both", async () => {
    const p1 = loadRecaptchaScript({ render: "explicit" });
    const p2 = loadRecaptchaScript({ render: "explicit" });
    expect(p1).toBe(p2);
    expect(getScripts()).toHaveLength(1);
    simulateScriptLoad();
    const [g1, g2] = await Promise.all([p1, p2]);
    expect(g1).toBe(g2);
    expect(g1).toBe(window.grecaptcha);
  });

  it("cleans up the generated onload global after firing", async () => {
    const p = loadRecaptchaScript({ render: "explicit" });
    const cbName = new URL(getScripts()[0]!.src).searchParams.get("onload")!;
    simulateScriptLoad();
    await p;
    expect((window as unknown as Record<string, unknown>)[cbName]).toBeUndefined();
  });

  it("applies async/defer and the CSP nonce attribute", () => {
    void loadRecaptchaScript({ render: "explicit", nonce: "abc123" }).catch(() => {});
    const script = getScripts()[0]!;
    expect(script.async).toBe(true);
    expect(script.defer).toBe(true);
    expect(script.getAttribute("nonce")).toBe("abc123");
  });

  it("warns and reuses the singleton when called again with different options", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const p1 = loadRecaptchaScript({ render: "explicit" });
    const p2 = loadRecaptchaScript({ render: "explicit", hl: "de" });
    expect(getScripts()).toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
    simulateScriptLoad();
    expect(await p2).toBe(await p1);
  });

  it("resolves immediately when window.grecaptcha already exists", async () => {
    const mock = installGrecaptchaMock();
    const g = await loadRecaptchaScript({ render: "explicit" });
    expect(g).toBe(mock.grecaptcha);
    expect(getScripts()).toHaveLength(0);
  });

  it("rejects with RecaptchaLoadError and allows retry when the script errors", async () => {
    const p = loadRecaptchaScript({ render: "explicit" });
    getScripts()[0]!.dispatchEvent(new Event("error"));
    await expect(p).rejects.toThrow(/Failed to load/);
    expect(getScripts()).toHaveLength(0); // failed tag removed
    void loadRecaptchaScript({ render: "explicit" }).catch(() => {}); // singleton reset → re-injects
    expect(getScripts()).toHaveLength(1);
  });
});
