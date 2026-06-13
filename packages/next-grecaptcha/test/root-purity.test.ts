import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const distCjs = fileURLToPath(new URL("../dist/index.cjs", import.meta.url));

describe("root entry purity", () => {
  it.skipIf(!existsSync(distCjs))(
    "dist/index.cjs loads in plain node with no react in the module graph",
    () => {
      const script = [
        `const m = require(${JSON.stringify(distCjs)});`,
        `if (typeof m.RecaptchaError !== "function") throw new Error("RecaptchaError missing");`,
        `if (typeof m.siteverifyUrl !== "function") throw new Error("siteverifyUrl missing");`,
        `const offenders = Object.keys(require.cache).filter((p) => /node_modules[\\/\\\\](react|react-dom)[\\/\\\\]/.test(p));`,
        `if (offenders.length) throw new Error("react in module graph: " + offenders.join(", "));`,
        `console.log("ROOT_PURITY_OK");`,
      ].join("\n");
      const out = execFileSync(process.execPath, ["-e", script], { encoding: "utf8" });
      expect(out).toContain("ROOT_PURITY_OK");
    },
  );
});
