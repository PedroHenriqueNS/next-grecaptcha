import { defineConfig, type Options } from "tsup";

const shared: Pick<Options, "format" | "dts" | "sourcemap" | "target" | "external" | "clean"> = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom", "next"],
  clean: false, // dist is wiped by the build script; clean:true here races parallel configs
};

export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", v1: "src/v1.ts" },
  },
  {
    ...shared,
    entry: { client: "src/client/index.ts" },
    banner: { js: '"use client";' },
  },
]);
