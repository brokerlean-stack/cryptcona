import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("Standalone output was not generated; skipping artifact copy.");
  process.exit(0);
}

const copies = [
  [join(root, "public"), join(standaloneDir, "public")],
  [join(root, ".next", "static"), join(standaloneDir, ".next", "static")],
];

for (const [source, target] of copies) {
  if (!existsSync(source)) continue;
  mkdirSync(dirname(target), { recursive: true });
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

// Hosting supplies runtime secrets. Never ship the workstation's environment files.
for (const name of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  rmSync(join(standaloneDir, name), { force: true });
}

console.log("Standalone artifacts prepared.");
