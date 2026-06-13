import { describe, expect, it } from "vitest";
import {
  RecaptchaActionMismatchError,
  RecaptchaHostnameError,
  RecaptchaScoreError,
  RecaptchaVerificationError,
} from "../shared/errors";
import { assertRecaptcha } from "./assert";

function fetchReturning(payload: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

const V3_OK = {
  success: true,
  challenge_ts: "2026-06-12T12:00:00Z",
  hostname: "example.com",
  score: 0.9,
  action: "login",
};
const opts = (payload: unknown) => ({ secretKey: "sec", fetch: fetchReturning(payload) });

describe("assertRecaptcha", () => {
  it("returns the success result when all checks pass", async () => {
    const result = await assertRecaptcha("tok", {
      ...opts(V3_OK),
      expectedAction: "login",
      expectedHostname: "example.com",
    });
    expect(result.score).toBe(0.9);
  });

  it("throws RecaptchaVerificationError with the codes on verification failure", async () => {
    const error = await assertRecaptcha("tok", opts({ success: false, "error-codes": ["timeout-or-duplicate"] })).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(RecaptchaVerificationError);
    expect((error as RecaptchaVerificationError).errorCodes).toEqual(["timeout-or-duplicate"]);
  });

  it("throws RecaptchaScoreError below the default 0.5 threshold", async () => {
    await expect(assertRecaptcha("tok", opts({ ...V3_OK, score: 0.3 }))).rejects.toBeInstanceOf(
      RecaptchaScoreError,
    );
  });

  it("respects a custom minScore", async () => {
    await expect(
      assertRecaptcha("tok", { ...opts({ ...V3_OK, score: 0.6 }), minScore: 0.7 }),
    ).rejects.toBeInstanceOf(RecaptchaScoreError);
    await expect(
      assertRecaptcha("tok", { ...opts({ ...V3_OK, score: 0.6 }), minScore: 0.5 }),
    ).resolves.toMatchObject({ score: 0.6 });
  });

  it("passes a scoreless (v2) response unless minScore was explicitly set", async () => {
    const v2 = { success: true, challenge_ts: "2026-06-12T12:00:00Z", hostname: "example.com" };
    await expect(assertRecaptcha("tok", opts(v2))).resolves.toMatchObject({ hostname: "example.com" });
    await expect(assertRecaptcha("tok", { ...opts(v2), minScore: 0.5 })).rejects.toBeInstanceOf(
      RecaptchaScoreError,
    );
  });

  it("throws RecaptchaActionMismatchError on action mismatch", async () => {
    const error = await assertRecaptcha("tok", { ...opts(V3_OK), expectedAction: "signup" }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(RecaptchaActionMismatchError);
    expect((error as RecaptchaActionMismatchError).expectedAction).toBe("signup");
    expect((error as RecaptchaActionMismatchError).action).toBe("login");
  });

  it("throws RecaptchaHostnameError when the hostname is not in the expected set", async () => {
    await expect(
      assertRecaptcha("tok", { ...opts(V3_OK), expectedHostname: ["other.com", "www.other.com"] }),
    ).rejects.toBeInstanceOf(RecaptchaHostnameError);
    await expect(
      assertRecaptcha("tok", { ...opts(V3_OK), expectedHostname: ["other.com", "example.com"] }),
    ).resolves.toBeTruthy();
  });
});
