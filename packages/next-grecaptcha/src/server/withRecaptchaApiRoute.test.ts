import { describe, expect, it } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { withRecaptchaApiRoute } from "./withRecaptchaApiRoute";

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

function fakeReqRes(init: { headers?: Record<string, string | string[]>; body?: unknown }) {
  const req = { headers: init.headers ?? {}, body: init.body } as unknown as NextApiRequest;
  const sent: { status?: number; json?: unknown } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(payload: unknown) {
      sent.json = payload;
    },
  } as unknown as NextApiResponse;
  return { req, res, sent };
}

describe("withRecaptchaApiRoute (Pages Router)", () => {
  it("verifies the header token and calls the handler with the result", async () => {
    const { req, res, sent } = fakeReqRes({ headers: { "x-recaptcha-token": "tok" } });
    const handler = withRecaptchaApiRoute(
      async (_req, response, recaptcha) => {
        response.status(200).json({ handled: true, score: recaptcha.score });
      },
      { secretKey: "sec", fetch: fetchReturning(V3_OK) },
    );
    await handler(req, res);
    expect(sent).toEqual({ status: 200, json: { handled: true, score: 0.9 } });
  });

  it("responds 400 when the token is missing", async () => {
    const { req, res, sent } = fakeReqRes({});
    const handler = withRecaptchaApiRoute(async () => {}, {
      secretKey: "sec",
      fetch: fetchReturning(V3_OK),
    });
    await handler(req, res);
    expect(sent.status).toBe(400);
  });

  it("responds 403 when verification fails", async () => {
    const { req, res, sent } = fakeReqRes({ headers: { "x-recaptcha-token": "bad" } });
    const handler = withRecaptchaApiRoute(async () => {}, {
      secretKey: "sec",
      fetch: fetchReturning({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    await handler(req, res);
    expect(sent).toEqual({
      status: 403,
      json: { error: "recaptcha-verification-failed", reason: "RecaptchaVerificationError" },
    });
  });

  it("extracts the token from the parsed body when jsonField is configured", async () => {
    const { req, res, sent } = fakeReqRes({ body: { captcha: "tok" } });
    const handler = withRecaptchaApiRoute(
      async (_req, response) => {
        response.status(200).json({ handled: true });
      },
      { secretKey: "sec", fetch: fetchReturning(V3_OK), tokenFrom: { jsonField: "captcha" } },
    );
    await handler(req, res);
    expect(sent.status).toBe(200);
  });

  it("handles array-valued headers (takes the first value)", async () => {
    const { req, res, sent } = fakeReqRes({ headers: { "x-recaptcha-token": ["tok", "extra"] } });
    const handler = withRecaptchaApiRoute(
      async (_req, response) => {
        response.status(200).json({ handled: true });
      },
      { secretKey: "sec", fetch: fetchReturning(V3_OK) },
    );
    await handler(req, res);
    expect(sent.status).toBe(200);
  });
});
