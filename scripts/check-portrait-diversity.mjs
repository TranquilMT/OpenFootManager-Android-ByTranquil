import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const sourceDir = path.resolve('src-tauri/assets/portrait-sources');
const generatorPath = path.resolve('src-tauri/src/commands/portraits.rs');
const files = (await readdir(sourceDir)).filter((name) => name.endsWith('.webp')).sort();

if (files.length < 20) {
  throw new Error(`Portrait regression: expected at least 20 source faces, found ${files.length}`);
}

const hashes = new Set();
for (const file of files) {
  const bytes = await readFile(path.join(sourceDir, file));
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hashes.has(hash)) throw new Error(`Portrait regression: duplicate source image detected (${file})`);
  hashes.add(hash);
}

const generator = await readFile(generatorPath, 'utf8');
const included = [...generator.matchAll(/portrait-sources\/(chroma-[^"\\]+\.webp)/g)].map((match) => match[1]);
const includedUnique = new Set(included);
if (includedUnique.size < files.length) {
  const missing = files.filter((file) => !includedUnique.has(file));
  throw new Error(`Portrait regression: generator does not include every portrait source: ${missing.join(', ')}`);
}

if (!generator.includes('portrait_seed(request)') || !generator.includes('build_recipe(seed, source.id)')) {
  throw new Error('Portrait regression: deterministic per-player recipe generation is missing');
}

const recipeDimensions = ['shirt_rgb','hair_rgb','skin_warmth','exposure','contrast','head_width','jaw_width','head_height','shift_x','shirt_strength','hair_strength','beard_strength'];
for (const dimension of recipeDimensions) {
  if (!generator.includes(dimension)) throw new Error(`Portrait regression: missing variation dimension ${dimension}`);
}

console.log(`Portrait diversity guard passed: ${files.length} unique source faces, ${recipeDimensions.length} recipe dimensions.`);
