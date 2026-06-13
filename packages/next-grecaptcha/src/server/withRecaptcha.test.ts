import { afterEach, describe, expect, it, vi } from "vitest";
import { RecaptchaConfigError } from "../shared/errors";
import { withRecaptcha } from "./withRecaptcha";

afterEach(() => {
  vi.unstubAllEnvs();
});

const V3_OK = {
  success: true,
  challenge_ts: "2026-06-12T12:00:00Z",
  hostname: "example.com",
  score: 0.9,
  action: "login",
};

function fetchReturning(payload: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

const okHandler = withRecaptcha(
  async (_req, ctx) => Response.json({ handled: true, score: ctx.recaptcha.score }),
  { secretKey: "sec", fetch: fetchReturning(V3_OK) },
);

describe("withRecaptcha (App Router)", () => {
  it("verifies the token from the default x-recaptcha-token header and calls the handler", async () => {
    const req = new Request("http://test/api", {
      method: "POST",
      headers: { "x-recaptcha-token": "tok" },
    });
    const res = await okHandler(req, {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ handled: true, score: 0.9 });
  });

  it("returns 400 JSON when the token is missing", async () => {
    const res = await okHandler(new Request("http://test/api", { method: "POST" }), {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "recaptcha-token-missing" });
  });

  it("returns 403 JSON when verification fails", async () => {
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      secretKey: "sec",
      fetch: fetchReturning({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    const req = new Request("http://test/api", { method: "POST", headers: { "x-recaptcha-token": "bad" } });
    const res = await handler(req, {});
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "recaptcha-verification-failed",
      reason: "RecaptchaVerificationError",
    });
  });

  it("returns 403 when the score is below the threshold", async () => {
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      secretKey: "sec",
      fetch: fetchReturning({ ...V3_OK, score: 0.1 }),
    });
    const req = new Request("http://test/api", { method: "POST", headers: { "x-recaptcha-token": "tok" } });
    const res = await handler(req, {});
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe("RecaptchaScoreError");
  });

  it("extracts the token from a JSON field when configured", async () => {
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      secretKey: "sec",
      fetch: fetchReturning(V3_OK),
      tokenFrom: { jsonField: "captcha" },
    });
    const req = new Request("http://test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ captcha: "tok", other: 1 }),
    });
    expect((await handler(req, {})).status).toBe(200);
    const noToken = new Request("http://test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ other: 1 }),
    });
    expect((await handler(noToken, {})).status).toBe(400);
  });

  it("extracts the token from a form field when configured", async () => {
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      secretKey: "sec",
      fetch: fetchReturning(V3_OK),
      tokenFrom: { formField: "g-recaptcha-response" },
    });
    const form = new FormData();
    form.set("g-recaptcha-response", "tok");
    const req = new Request("http://test/api", { method: "POST", body: form });
    expect((await handler(req, {})).status).toBe(200);
  });

  it("supports a custom header name", async () => {
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      secretKey: "sec",
      fetch: fetchReturning(V3_OK),
      tokenFrom: { header: "x-captcha" },
    });
    const req = new Request("http://test/api", { method: "POST", headers: { "x-captcha": "tok" } });
    expect((await handler(req, {})).status).toBe(200);
  });

  it("lets RecaptchaConfigError (server misconfiguration) propagate", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", ""); // ensure no ambient secret
    const handler = withRecaptcha(async () => Response.json({ handled: true }), {
      fetch: fetchReturning(V3_OK), // no secretKey, no env
    });
    const req = new Request("http://test/api", { method: "POST", headers: { "x-recaptcha-token": "tok" } });
    await expect(handler(req, {})).rejects.toBeInstanceOf(RecaptchaConfigError);
  });
});
