import './verify-source-assets.mjs';
import { prepareAboutSources } from './prepare-about.mjs';
await prepareAboutSources();
import sharp from 'sharp';
import { prepareBrand } from './prepare-brand.mjs';
await prepareBrand();
import { prepareThemeAssets } from './prepare-theme-assets.mjs';
await prepareThemeAssets();
import { fileURLToPath } from 'node:url';
import { copyFile, mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { projects } from '../src/data/projects.ts';
import { assets, assetUrl } from '../src/scripts/mascot/assets.ts';

const outputs = [];
async function optimize(source, target, width) {
  const destination = new URL('../' + target, import.meta.url);
  // Only generated targets in public/assets or .cache/local-media are permitted.
  if (!target.startsWith('public/assets/') && !target.startsWith('.cache/local-media/')) throw new Error('Invalid generated target');
  await mkdir(new URL('.', destination), { recursive: true });
  const metadata = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 5 }).toFile(fileURLToPath(destination));
  outputs.push({ source, target, width: metadata.width, height: metadata.height, bytes: (await stat(destination)).size });
}
for (const project of projects) {
  if (project.publication === 'pending') {
    await optimize(project.media.source, '.cache/local-media/' + project.id + '.webp', 1280);
  } else {
    for (const width of [640, 1280]) await optimize(project.media.source, 'public/assets/projects/' + project.id + '-' + width + '.webp', width);
  }
}
for (const [id, asset] of Object.entries(assets)) {
  for (const width of [512, 960]) await optimize(asset.source, 'public' + assetUrl(id, width), width);
}
await mkdir(new URL('../public/downloads/', import.meta.url), { recursive: true });
const original = new URL('../Estavilla Resume.pdf', import.meta.url);
const copied = new URL('../public/downloads/Estavilla Resume.pdf', import.meta.url);
await copyFile(original, copied);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (hash(await readFile(original)) !== hash(await readFile(copied))) throw new Error('Resume copy is not identical');
await mkdir(new URL('../.cache/', import.meta.url), { recursive: true });
await writeFile(new URL('../.cache/asset-preparation.json', import.meta.url), JSON.stringify(outputs, null, 2));
console.log('Prepared ' + outputs.length + ' image derivatives and a byte-identical resume copy.');
