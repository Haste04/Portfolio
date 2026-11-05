import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const baseline = JSON.parse(
  readFileSync(new URL("../docs/source-assets.json", import.meta.url), "utf8"),
);
for (const asset of baseline) {
  const bytes = readFileSync(asset.path.replaceAll("\\", "/"));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    asset.sha256,
    asset.path + " changed",
  );
}
for (const directory of ["mr-fresh", "project-assets"]) {
  const current = readdirSync(directory, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).replaceAll("\\", "/"));
  const expected = baseline.filter((asset) =>
    asset.path.replaceAll("\\", "/").startsWith(directory + "/"),
  );
  assert.equal(
    current.length,
    expected.length,
    directory + " file count changed",
  );
}
console.log(
  "PASS: all " +
    baseline.length +
    " original resources match their SHA-256 baseline; source-library file counts unchanged.",
);
