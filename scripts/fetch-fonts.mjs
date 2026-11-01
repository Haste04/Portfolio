import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../public/fonts/', import.meta.url);
await mkdir(directory, { recursive: true });
const fonts = [
  { family: 'Inter', query: 'Inter:wght@100..900', slug: 'inter', file: 'inter-latin-variable.woff2' },
  { family: 'Space Grotesk', query: 'Space+Grotesk:wght@300..700', slug: 'spacegrotesk', file: 'space-grotesk-latin-variable.woff2' },
];
for (const font of fonts) {
  const cssResponse = await fetch('https://fonts.googleapis.com/css2?family=' + font.query + '&display=swap', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
  });
  if (!cssResponse.ok) throw new Error('Font CSS: ' + cssResponse.status);
  const css = await cssResponse.text();
  const block = css.match(/\/\* latin \*\/[\s\S]*?src: url\(([^)]+)\)/);
  if (!block?.[1]?.startsWith('https://fonts.gstatic.com/')) throw new Error('No Latin WOFF2 found for ' + font.family);
  const response = await fetch(block[1]);
  if (!response.ok) throw new Error('Font download: ' + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'wOF2') throw new Error('Unexpected font format');
  await writeFile(new URL(font.file, directory), bytes);
  const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/' + font.slug + '/OFL.txt');
  if (!license.ok) throw new Error('License download: ' + license.status);
  await writeFile(new URL(font.slug + '-OFL.txt', directory), await license.text());
  console.log(font.family + ': Latin WOFF2, ' + bytes.length + ' bytes; OFL license saved.');
}
