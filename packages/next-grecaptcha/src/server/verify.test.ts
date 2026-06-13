import { afterEach, describe, expect, it, vi } from "vitest";
import { RecaptchaConfigError } from "../shared/errors";
import type { RecaptchaErrorCode } from "../shared/types";
import { verifyRecaptcha } from "./verify";

/** Injectable fetch that records calls and returns the given JSON payload. */
function fakeFetch(payload: unknown, status = 200) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = (async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { fn, calls };
}

const SUCCESS_V2 = { success: true, challenge_ts: "2026-06-12T12:00:00Z", hostname: "example.com" };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyRecaptcha", () => {
  it("POSTs a form-encoded body with secret/response to the google.com endpoint", async () => {
    const { fn, calls } = fakeFetch(SUCCESS_V2);
    await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(calls[0]!.init.method).toBe("POST");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/x-www-form-urlencoded");
    const body = calls[0]!.init.body as URLSearchParams;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get("secret")).toBe("sec");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBeNull();
  });

  it("forwards remoteip and uses the recaptcha.net host when configured", async () => {
    const { fn, calls } = fakeFetch(SUCCESS_V2);
    await verifyRecaptcha("tok", { secretKey: "sec", remoteIp: "1.2.3.4", host: "recaptcha.net", fetch: fn });
    expect(calls[0]!.url).toBe("https://www.recaptcha.net/recaptcha/api/siteverify");
    expect((calls[0]!.init.body as URLSearchParams).get("remoteip")).toBe("1.2.3.4");
  });

  it("maps a v2 success response", async () => {
    const { fn } = fakeFetch(SUCCESS_V2);
    const result = await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
    expect(result).toEqual({
      success: true,
      challengeTs: "2026-06-12T12:00:00Z",
      hostname: "example.com",
    });
  });

  it("maps a v3 success response with score and action", async () => {
    const { fn } = fakeFetch({ ...SUCCESS_V2, score: 0.9, action: "login" });
    const result = await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
    expect(result).toEqual({
      success: true,
      challengeTs: "2026-06-12T12:00:00Z",
      hostname: "example.com",
      score: 0.9,
      action: "login",
    });
  });

  const ALL_CODES: RecaptchaErrorCode[] = [
    "missing-input-secret",
    "invalid-input-secret",
    "missing-input-response",
    "invalid-input-response",
    "bad-request",
    "timeout-or-duplicate",
  ];
  for (const code of ALL_CODES) {
    it(`passes through the "${code}" error code`, async () => {
      const { fn } = fakeFetch({ success: false, "error-codes": [code] });
      const result = await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
      expect(result).toEqual({ success: false, errorCodes: [code] });
    });
  }

  it("returns missing-input-response for an empty token without calling fetch", async () => {
    const { fn, calls } = fakeFetch(SUCCESS_V2);
    const result = await verifyRecaptcha("", { secretKey: "sec", fetch: fn });
    expect(result).toEqual({ success: false, errorCodes: ["missing-input-response"] });
    expect(calls).toHaveLength(0);
  });

  it("returns bad-request when the HTTP response is not ok", async () => {
    const { fn } = fakeFetch({}, 500);
    const result = await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
    expect(result).toEqual({ success: false, errorCodes: ["bad-request"] });
  });

  it("resolves the secret from RECAPTCHA_SECRET_KEY when options.secretKey is absent", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "env-secret");
    const { fn, calls } = fakeFetch(SUCCESS_V2);
    await verifyRecaptcha("tok", { fetch: fn });
    expect((calls[0]!.init.body as URLSearchParams).get("secret")).toBe("env-secret");
  });

  it("throws RecaptchaConfigError when no secret is available", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    await expect(verifyRecaptcha("tok")).rejects.toBeInstanceOf(RecaptchaConfigError);
  });

  it("returns bad-request when a 200 response body is not valid JSON", async () => {
    const fn = (async () =>
      new Response("<html>not json</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch;
    const result = await verifyRecaptcha("tok", { secretKey: "sec", fetch: fn });
    expect(result).toEqual({ success: false, errorCodes: ["bad-request"] });
  });

  it("never includes the secret in a propagated error", async () => {
    const SECRET = "SENTINEL-SECRET-DO-NOT-LEAK";
    const throwingFetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    let caught: unknown;
    try {
      await verifyRecaptcha("tok", { secretKey: SECRET, fetch: throwingFetch });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    const serialized = `${(caught as Error).message}\n${(caught as Error).stack ?? ""}`;
    expect(serialized).not.toContain(SECRET);
  });
});
