import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/next-grecaptcha/dist");
const bundles = readdirSync(dir).filter(
  (f) => f.startsWith("client") && (f.endsWith(".js") || f.endsWith(".cjs")),
);
if (bundles.length === 0) {
  console.error(`check-use-client: no client bundles found in ${dir}`);
  process.exit(1);
}
let failed = false;
for (const f of bundles) {
  const head = readFileSync(join(dir, f), "utf8").slice(0, 300);
  if (head.includes('"use client"')) {
    console.log(`check-use-client: OK ${f}`);
  } else {
    console.error(`check-use-client: MISSING "use client" in ${f}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
