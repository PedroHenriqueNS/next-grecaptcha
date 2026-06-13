import { describe, expect, it } from "vitest";
import { RecaptchaVerificationError } from "../shared/errors";
import { verifyRecaptchaAction } from "./verifyRecaptchaAction";

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

describe("verifyRecaptchaAction", () => {
  it("accepts a raw token string", async () => {
    const result = await verifyRecaptchaAction("tok", { secretKey: "sec", fetch: fetchReturning(V3_OK) });
    expect(result.hostname).toBe("example.com");
  });

  it("reads the default recaptchaToken field from FormData", async () => {
    const form = new FormData();
    form.set("recaptchaToken", "tok");
    const result = await verifyRecaptchaAction(form, { secretKey: "sec", fetch: fetchReturning(V3_OK) });
    expect(result.success).toBe(true);
  });

  it("supports a custom form field name", async () => {
    const form = new FormData();
    form.set("captcha", "tok");
    const result = await verifyRecaptchaAction(form, {
      secretKey: "sec",
      fetch: fetchReturning(V3_OK),
      formField: "captcha",
    });
    expect(result.success).toBe(true);
  });

  it("throws RecaptchaVerificationError (missing-input-response) when the field is absent", async () => {
    const form = new FormData();
    const error = await verifyRecaptchaAction(form, { secretKey: "sec", fetch: fetchReturning(V3_OK) }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(RecaptchaVerificationError);
    expect((error as RecaptchaVerificationError).errorCodes).toEqual(["missing-input-response"]);
  });
});
