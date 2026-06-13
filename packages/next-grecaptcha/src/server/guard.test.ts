// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("server entry browser guard", () => {
  it("throws RecaptchaBrowserImportError when imported where window exists", async () => {
    await expect(import("./index")).rejects.toThrow(/must only run on the server/);
  });
});
