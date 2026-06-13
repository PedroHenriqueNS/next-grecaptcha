import { describe, expect, it } from "vitest";

describe("v1 stub", () => {
  it("throws a descriptive shutdown error at import time", async () => {
    await expect(import("./v1")).rejects.toThrow(
      /reCAPTCHA v1 was permanently shut down by Google on March 31, 2018/,
    );
  });
});
