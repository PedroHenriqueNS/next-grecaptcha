import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const pkgDir = resolve("packages/next-grecaptcha");
const work = mkdtempSync(join(tmpdir(), "next-grecaptcha-pack-"));
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32", // pnpm/npm are .cmd shims on Windows
  });

run("pnpm", ["pack", "--pack-destination", work], pkgDir);
const tarball = readdirSync(work).find((f) => f.endsWith(".tgz"));
if (!tarball) {
  console.error("pack-smoke: no tarball produced");
  process.exit(1);
}
run("npm", ["init", "-y"], work);
run("npm", ["install", join(work, tarball), "react", "react-dom"], work);

writeFileSync(
  join(work, "check.cjs"),
  `
const assert = require("node:assert");
const root = require("next-grecaptcha");
const server = require("next-grecaptcha/server");
const client = require("next-grecaptcha/client");
assert(typeof root.RecaptchaError === "function", "root cjs broken");
assert(typeof server.verifyRecaptcha === "function", "server cjs broken");
assert(client.ReCaptchaCheckbox, "client cjs broken");
let v1Threw = false;
try { require("next-grecaptcha/v1"); } catch (e) { v1Threw = /2018/.test(String(e)); }
assert(v1Threw, "v1 stub did not throw the shutdown error");
console.log("CJS OK");
`,
);
run("node", ["check.cjs"], work);

writeFileSync(
  join(work, "check.mjs"),
  `
import assert from "node:assert";
import { RecaptchaError } from "next-grecaptcha";
import { verifyRecaptcha } from "next-grecaptcha/server";
import { ReCaptchaCheckbox } from "next-grecaptcha/client";
assert(typeof RecaptchaError === "function", "root esm broken");
assert(typeof verifyRecaptcha === "function", "server esm broken");
assert(ReCaptchaCheckbox, "client esm broken");
let v1Threw = false;
try { await import("next-grecaptcha/v1"); } catch (e) { v1Threw = /2018/.test(String(e)); }
assert(v1Threw, "v1 stub did not throw the shutdown error");
console.log("ESM OK");
`,
);
run("node", ["check.mjs"], work);
console.log("pack-smoke: all entry points resolve under require() and import");
