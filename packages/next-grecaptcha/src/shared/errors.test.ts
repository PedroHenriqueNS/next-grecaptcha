import { describe, expect, it } from "vitest";
import {
  RecaptchaActionMismatchError,
  RecaptchaActionNameError,
  RecaptchaBrowserImportError,
  RecaptchaConfigError,
  RecaptchaError,
  RecaptchaHostnameError,
  RecaptchaLoadError,
  RecaptchaScoreError,
  RecaptchaV1Error,
  RecaptchaVerificationError,
} from "./errors";

describe("error hierarchy", () => {
  it("all errors extend RecaptchaError and Error with correct name", () => {
    const e = new RecaptchaScoreError(0.1, 0.5);
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(RecaptchaError);
    expect(e.name).toBe("RecaptchaScoreError");
    expect(e.score).toBe(0.1);
    expect(e.minScore).toBe(0.5);
    expect(e.message).toMatch(/0\.1/);
  });

  it("action mismatch carries expected and actual", () => {
    const e = new RecaptchaActionMismatchError("login", "signup");
    expect(e).toBeInstanceOf(RecaptchaError);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("RecaptchaActionMismatchError");
    expect(e.expectedAction).toBe("login");
    expect(e.action).toBe("signup");
  });

  it("verification error carries error codes", () => {
    const e = new RecaptchaVerificationError(["timeout-or-duplicate"]);
    expect(e.errorCodes).toEqual(["timeout-or-duplicate"]);
  });

  it("RecaptchaHostnameError with known hostname", () => {
    const e = new RecaptchaHostnameError(["a.com", "b.com"], "evil.com");
    expect(e).toBeInstanceOf(RecaptchaError);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("RecaptchaHostnameError");
    expect(e.expectedHostnames).toEqual(["a.com", "b.com"]);
    expect(e.hostname).toBe("evil.com");
    expect(e.message).toContain("a.com, b.com");
  });

  it("RecaptchaHostnameError with undefined hostname contains <none>", () => {
    const e = new RecaptchaHostnameError(["a.com", "b.com"], undefined);
    expect(e.hostname).toBeUndefined();
    expect(e.message).toContain("<none>");
  });

  it.each([
    ["RecaptchaConfigError", new RecaptchaConfigError("bad config")],
    ["RecaptchaLoadError", new RecaptchaLoadError("load failed")],
    ["RecaptchaActionNameError", new RecaptchaActionNameError("bad action")],
    ["RecaptchaBrowserImportError", new RecaptchaBrowserImportError("browser import")],
    ["RecaptchaV1Error", new RecaptchaV1Error("v1 is gone")],
  ])("%s is instanceof RecaptchaError and Error with matching name", (className, instance) => {
    expect(instance).toBeInstanceOf(RecaptchaError);
    expect(instance).toBeInstanceOf(Error);
    expect(instance.name).toBe(className);
  });

  it("RecaptchaVerificationError with empty error codes contains 'unknown'", () => {
    const e = new RecaptchaVerificationError([]);
    expect(e.message).toContain("unknown");
    expect(e.errorCodes).toEqual([]);
  });
});
