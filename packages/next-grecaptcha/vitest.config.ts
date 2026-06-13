import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // client/dom tests opt into jsdom via `// @vitest-environment jsdom` docblocks
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.ts"],
  },
});
