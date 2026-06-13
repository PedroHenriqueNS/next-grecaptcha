import { describe, expect, it } from "vitest";
import {
  ACTION_NAME_PATTERN,
  DEFAULT_MIN_SCORE,
  scriptBaseUrl,
  siteverifyUrl,
  TOKEN_TTL_SECONDS,
} from "./constants";

describe("constants", () => {
  it("builds script URLs per host", () => {
    expect(scriptBaseUrl()).toBe("https://www.google.com/recaptcha/api.js");
    expect(scriptBaseUrl("recaptcha.net")).toBe("https://www.recaptcha.net/recaptcha/api.js");
  });

  it("builds siteverify URLs per host", () => {
    expect(siteverifyUrl()).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(siteverifyUrl("recaptcha.net")).toBe("https://www.recaptcha.net/recaptcha/api/siteverify");
  });

  it("documents Google defaults", () => {
    expect(DEFAULT_MIN_SCORE).toBe(0.5);
    expect(TOKEN_TTL_SECONDS).toBe(120);
  });

  it("action pattern allows only alphanumerics, slashes, underscores", () => {
    expect(ACTION_NAME_PATTERN.test("login")).toBe(true);
    expect(ACTION_NAME_PATTERN.test("checkout/pay_now")).toBe(true);
    expect(ACTION_NAME_PATTERN.test("bad action")).toBe(false);
    expect(ACTION_NAME_PATTERN.test("bad-action")).toBe(false);
    expect(ACTION_NAME_PATTERN.test("")).toBe(false);
  });
});
