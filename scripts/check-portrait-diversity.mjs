import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const sourceDir = path.resolve("src-tauri/assets/portrait-sources");
const generatorPath = path.resolve("src-tauri/src/commands/portraits.rs");
const supportedExtensions = new Set([".webp", ".png"]);
const files = (await readdir(sourceDir))
  .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
  .sort();

const generator = await readFile(generatorPath, "utf8");
const included = [...generator.matchAll(/portrait-sources\/(chroma-[^"\\]+\.(?:webp|png))/g)].map(
  (match) => match[1],
);
const includedUnique = new Set(included);

if (includedUnique.size !== 20) {
  throw new Error(
    `Portrait regression: expected exactly 20 active generator sources, found ${includedUnique.size}`,
  );
}

const missing = included.filter((file) => !files.includes(file));
if (missing.length > 0) {
  throw new Error(
    `Portrait regression: embedded portrait source files are missing: ${missing.join(", ")}`,
  );
}

const hashes = new Map();
for (const file of includedUnique) {
  const bytes = await readFile(path.join(sourceDir, file));
  if (bytes.length < 1_000) {
    throw new Error(
      `Portrait regression: source image is unexpectedly small (${file}, ${bytes.length} bytes)`,
    );
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  const duplicate = hashes.get(hash);
  if (duplicate) {
    throw new Error(
      `Portrait regression: duplicate active source images detected (${duplicate}, ${file})`,
    );
  }
  hashes.set(hash, file);
}

if (!generator.includes("runtime-component-recipe-rust-v3-20src")) {
  throw new Error("Portrait regression: 20-source cache/generator version is missing");
}
if (
  !generator.includes("portrait_seed(request)") ||
  !generator.includes("build_recipe(seed, source.id)")
) {
  throw new Error("Portrait regression: deterministic per-player recipe generation is missing");
}

const recipeDimensions = [
  "shirt_rgb",
  "hair_rgb",
  "skin_warmth",
  "exposure",
  "contrast",
  "head_width",
  "jaw_width",
  "head_height",
  "shift_x",
  "shirt_strength",
  "hair_strength",
  "beard_strength",
];
for (const dimension of recipeDimensions) {
  if (!generator.includes(dimension))
    throw new Error(`Portrait regression: missing variation dimension ${dimension}`);
}

console.log(
  `Portrait diversity guard passed: ${includedUnique.size} active unique source faces, ${recipeDimensions.length} recipe dimensions.`,
);
