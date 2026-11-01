/** Offline runtime assets only. Run manually with --fetch to reproduce; --verify never uses the network. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siCommit = 'ed9a5192b24ad2f169bf1009931da0df27d5a49a';
const dotnetCommit = '91845f6ddf2123b3bb1bfd1b6a386d9ce02b43aa';
const authCommit = '6bca388f46636d1598a430ba6624e1201e70f213';
const powerCommit = '24f1db8bdfab951c25db591772140d2f4ec5bc1e';
const raw = (repo, commit, path) => `https://raw.githubusercontent.com/${repo}/${commit}/${path}`;
const si = (path) => raw('simple-icons/simple-icons', siCommit, path);
const cache = '.cache/technology-gallery/icon-sources';
const sha = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const read = (path) => readFile(resolve(root, path));
const text = async (path) => (await read(path)).toString('utf8');
const ids = [...(await text('src/data/technologies.ts')).split('] as const;')[0].matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
assert.equal(ids.length, 24);
const allowed = (path) => path === 'src/data/technology-icons.json' || path === 'src/data/technology-details.ts' || path === 'docs/technology-icon-sources.md' || path.startsWith('public/technology-icons/') || path.startsWith(`${cache}/`);
async function put(path, value) {
  assert(allowed(path), `Out-of-scope write: ${path}`);
  const absolute = resolve(root, path);
  assert(!relative(root, absolute).startsWith('..'));
  await mkdir(dirname(absolute), { recursive: true });
  // These are generated files owned exclusively by this script; no original input is written.
  await writeFile(absolute, value);
}
const fetched = new Map();
async function download(url, target) {
  const response = await fetch(url, { headers: { 'User-Agent': 'portfolio-technology-assets' }, signal: AbortSignal.timeout(30000) });
  assert(response.ok, `${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await put(`${cache}/${target}`, bytes);
  fetched.set(target, { sourceURL: url, sha256: sha(bytes), bytes: bytes.length });
  return bytes;
}
const definitions = {
  javascript: ['A programming language used to add behavior to web pages and build applications.', 'https://tc39.es/ecma262/'],
  typescript: ['A language that extends JavaScript with a type system and compiles to JavaScript.', 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html'],
  python: ['A general-purpose programming language with dynamic typing and a standard library.', 'https://docs.python.org/3/tutorial/'],
  go: ['A compiled programming language with garbage collection and built-in concurrency features.', 'https://go.dev/doc/faq'],
  php: ['A scripting language used to generate web content on a server.', 'https://www.php.net/manual/en/introduction.php'],
  sql: ['A database language for defining data structures and querying and modifying stored data.', 'https://www.iso.org/standard/76583.html'],
  csharp: ['A programming language for building applications on the .NET platform.', 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/overview'],
  c: ['A programming language with functions, pointers, and explicit memory management.', 'https://www.open-std.org/jtc1/sc22/wg14/'],
  java: ['A programming language and platform for applications that run on the Java Virtual Machine.', 'https://dev.java/learn/'],
  astro: ['A web framework that renders content on the server and supports optional client-side components.', 'https://docs.astro.build/en/concepts/why-astro/'],
  react: ['A library for building user interfaces from reusable components.', 'https://react.dev/'],
  'react-native': ['A framework for building native applications using React and platform UI components.', 'https://reactnative.dev/docs/getting-started'],
  nextjs: ['A React framework that adds routing, rendering, and server features for web applications.', 'https://nextjs.org/docs'],
  tailwind: ['A CSS framework that provides utility classes for styling interfaces.', 'https://tailwindcss.com/docs/styling-with-utility-classes'],
  fastapi: ['A Python framework for building web APIs using standard Python type hints.', 'https://fastapi.tiangolo.com/'],
  mysql: ['A relational database management system that stores and queries data using SQL.', 'https://dev.mysql.com/doc/refman/8.4/en/what-is-mysql.html'],
  sqlite: ['An embedded SQL database engine that reads and writes database files without a separate server.', 'https://www.sqlite.org/about.html'],
  upstash: ['A managed Redis-compatible database service with Redis protocol and HTTP API access.', 'https://upstash.com/docs/redis/overall/getstarted'],
  gemini: ['An API for using Google generative models to process inputs and generate content.', 'https://ai.google.dev/gemini-api/docs'],
  nextauth: ['An authentication library for Next.js applications with sign-in providers and session handling.', 'https://next-auth.js.org/getting-started/introduction'],
  git: ['A distributed version control system for tracking changes to files and source code.', 'https://git-scm.com/docs/git'],
  github: ['A platform for hosting Git repositories and collaborating through issues and pull requests.', 'https://docs.github.com/en/get-started/start-your-journey/what-is-github'],
  vercel: ['A platform for deploying web applications with hosting, delivery, and server functions.', 'https://vercel.com/docs'],
  powerbi: ['A business analytics platform for connecting data sources and creating reports and visualizations.', 'https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview'],
};
const fallbacks = { javascript: 'JS', typescript: 'TS', python: 'Python', go: 'Go', php: 'PHP', sql: 'SQL', csharp: 'C#', c: 'C', java: 'Java', astro: 'Astro', react: 'React', 'react-native': 'RN', nextjs: 'Next.js', tailwind: 'Tailwind', fastapi: 'FastAPI', mysql: 'MySQL', sqlite: 'SQLite', upstash: 'Upstash', gemini: 'Gemini', nextauth: 'NextAuth', git: 'Git', github: 'GitHub', vercel: 'Vercel', powerbi: 'Power BI' };
const simple = {
  javascript: ['JavaScript', 'javascript'], typescript: ['TypeScript', 'typescript'], python: ['Python', 'python'], go: ['Go', 'go'], php: ['PHP', 'php'], c: ['C', 'c'], astro: ['Astro', 'astro'], react: ['React', 'react'], 'react-native': ['React', 'react'], nextjs: ['Next.js', 'nextdotjs'], tailwind: ['Tailwind CSS', 'tailwindcss'], fastapi: ['FastAPI', 'fastapi'], mysql: ['MySQL', 'mysql'], sqlite: ['SQLite', 'sqlite'], upstash: ['Upstash', 'upstash'], gemini: ['Google Gemini', 'googlegemini'], git: ['Git', 'git'], github: ['GitHub', 'github'], vercel: ['Vercel', 'vercel'],
};
function safeSvg(svg) {
  assert(/<svg\b/.test(svg) && /viewBox=/.test(svg), 'SVG requires root and viewBox');
  assert(!/<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|image|a|iframe|object|embed|audio|video|animate\w*|set|use)\b|\son[a-z]+\s*=|javascript:|@import/i.test(svg), 'Unsafe SVG markup');
  for (const match of svg.matchAll(/(?:href|src)\s*=\s*["']([^"']*)["']/gi)) assert(match[1].startsWith('#'), 'External SVG reference');
  for (const match of svg.matchAll(/url\(\s*["']?([^\s)"']+)/gi)) assert(match[1].startsWith('#'), 'External SVG paint or filter');
  const allowedTags = new Set(['svg','title','path','g','defs','mask','linearGradient','stop','filter','feFlood','feColorMatrix','feOffset','feGaussianBlur','feBlend','metadata','rdf:RDF','cc:Work','dc:format','dc:type','dc:title']);
  for (const match of svg.matchAll(/<\/?([A-Za-z][\w:.-]*)\b/g)) assert(allowedTags.has(match[1]), `Unexpected SVG element ${match[1]}`);
}
async function filesUnder(path) {
  const output = [];
  for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) output.push(...await filesUnder(child)); else output.push(child);
  }
  return output;
}
async function verify() {
  const manifest = JSON.parse(await text('src/data/technology-icons.json'));
  assert.deepEqual(Object.keys(manifest).sort(), [...ids].sort());
  const detailsSource = await text('src/data/technology-details.ts');
  const ts = await import('typescript');
  const detailsJs = ts.transpileModule(detailsSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { technologyDetails } = await import(`data:text/javascript;base64,${Buffer.from(detailsJs).toString('base64')}`);
  assert.deepEqual(Object.keys(technologyDetails).sort(), [...ids].sort());
  const provenance = JSON.parse(await text('public/technology-icons/provenance.json'));
  const uniqueAssets = new Set();
  for (const id of ids) {
    const item = manifest[id];
    assert.deepEqual(Object.keys(item).sort(), ['fallback','hex','source','src']);
    assert.equal(typeof item.fallback, 'string'); assert(item.fallback.length > 0 && item.fallback.length <= 12);
    assert(item.hex === null || /^#[0-9A-F]{6}$/.test(item.hex));
    const detail = technologyDetails[id];
    assert.equal(typeof detail.description, 'string'); assert(detail.description.length > 25 && detail.description.length < 160);
    assert(/^https:\/\//.test(detail.documentation));
    if (item.src === null) { assert(['sql','java'].includes(id)); assert.equal(item.source, null); continue; }
    assert(/^\/technology-icons\/[a-z0-9-]+\.(svg|png)$/.test(item.src));
    assert(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\//.test(item.source));
    const path = `public${item.src}`;
    const bytes = await read(path);
    assert.equal(sha(bytes), provenance.icons[id].localSha256);
    assert.equal(bytes.length, provenance.icons[id].localBytes);
    const sourceBytes = await read(`${cache}/${provenance.icons[id].rawFile}`);
    assert.equal(sha(sourceBytes), provenance.icons[id].sourceSha256);
    if (path.endsWith('.svg')) {
      const svg = bytes.toString('utf8'); safeSvg(svg);
      const paths = (value) => [...value.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
      assert.deepEqual(paths(svg), paths(sourceBytes.toString('utf8')), `Altered source paths: ${id}`);
    } else {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(sha(bytes), sha(sourceBytes));
    }
    uniqueAssets.add(path);
  }
  for (const [path, file] of Object.entries(provenance.supportingFiles)) {
    const bytes = await read(path); assert.equal(sha(bytes), file.sha256);
  }
  for (const name of ['src/data/technologies.ts', 'src/data/projects.ts']) {
    const baseline = JSON.parse(await text('.cache/technology-gallery/baseline.json')).find((entry) => entry.file === name);
    assert.equal(sha(await read(name)), baseline.sha256, `Original changed: ${name}`);
  }
  const iconBytes = (await Promise.all([...uniqueAssets].map(async (path) => (await stat(resolve(root, path))).size))).reduce((a, b) => a + b, 0);
  const deliverables = ['src/data/technology-icons.json','src/data/technology-details.ts','docs/technology-icon-sources.md','scripts/fetch-technology-icons.mjs', ...await filesUnder('public/technology-icons')];
  const totalBytes = (await Promise.all(deliverables.map(async (path) => (await stat(resolve(root, path))).size))).reduce((a, b) => a + b, 0);
  console.log(json({ ids: ids.length, descriptions: Object.keys(technologyDetails).length, imageEntries: ids.filter((id) => manifest[id].src).length, svgFiles: [...uniqueAssets].filter((path) => path.endsWith('.svg')).length, pngFiles: [...uniqueAssets].filter((path) => path.endsWith('.png')).length, iconBytes, deliverableFiles: deliverables.length, totalBytes, rawDownloadBytes: (await Promise.all((await filesUnder(cache)).map(async (path) => (await stat(resolve(root, path))).size))).reduce((a,b) => a+b,0), fallbacks: ids.filter((id) => !manifest[id].src), originals: 'technologies.ts and projects.ts match baseline SHA-256', checks: 'coverage, schema, source/local hashes, SVG element allowlist, external-reference rejection, exact source paths, PNG signature, supporting-license hashes' }));
}
if (process.argv.includes('--verify')) { await verify(); }
else {
  assert(process.argv.includes('--fetch'), 'Use --fetch (network + generated writes) or --verify (offline, read-only).');
  const metadataBytes = await download(si('data/simple-icons.json'), 'simple-icons-data.json');
  const metadata = JSON.parse(metadataBytes);
  const packageData = JSON.parse(await download(si('package.json'), 'simple-icons-package.json'));
  assert.equal(packageData.version, '16.35.0');
  const provenance = { auditedOn: '2026-10-24', algorithm: 'SHA-256', simpleIcons: { version: '16.35.0', commit: siCommit, release: 'https://github.com/simple-icons/simple-icons/releases/tag/16.35.0', metadataURL: si('data/simple-icons.json'), metadataSha256: sha(metadataBytes) }, icons: {}, supportingFiles: {}, notes: ['Original technology IDs, categories and project associations are read-only.', 'Source SVG path data is preserved exactly; only root fill and the React Native title differ for Simple Icons.', 'A null license field means upstream did not specify a per-icon license; it does not assert that the brand mark is CC0.', 'NextAuth uses the original locally hosted official PNG, not the unrelated docs/static/img/logo.svg Docusaurus mascot.'] };
  async function support(url, filename) {
    const bytes = await download(url, filename);
    const path = `public/technology-icons/licenses/${filename}`;
    await put(path, bytes);
    provenance.supportingFiles[path] = fetched.get(filename);
  }
  await support(si('LICENSE.md'), 'simple-icons-LICENSE.md');
  await support(si('DISCLAIMER.md'), 'simple-icons-DISCLAIMER.md');
  await support(raw('voodootikigod/logo.js', '1544bdeed6d618a6cfe4f0650d04ab8d9cfa76d9', 'LICENSE'), 'javascript-MIT.txt');
  await support('https://creativecommons.org/licenses/by/3.0/legalcode.txt', 'git-CC-BY-3.0.txt');
  await support('https://creativecommons.org/licenses/by-sa/4.0/legalcode.txt', 'php-CC-BY-SA-4.0.txt');
  await support(raw('dotnet/brand', dotnetCommit, 'LICENSE'), 'dotnet-CC0.txt');
  await support(raw('dotnet/brand', dotnetCommit, 'README.md'), 'dotnet-README.md');
  await support(raw('dotnet/brand', dotnetCommit, 'logo/language-icons/README.md'), 'dotnet-language-icons-README.md');
  await support(raw('nextauthjs/next-auth', authCommit, 'LICENSE'), 'nextauth-ISC.txt');
  await support(raw('microsoft/PowerBI-Icons', powerCommit, 'LICENSE'), 'powerbi-CC-BY-4.0.txt');
  await support(raw('microsoft/PowerBI-Icons', powerCommit, 'LICENSE-CODE'), 'powerbi-MIT.txt');
  await support(raw('microsoft/PowerBI-Icons', powerCommit, 'README.md'), 'powerbi-README.md');
  const manifest = {};
  const rawIcons = new Map();
  for (const id of ids) {
    if (!simple[id]) continue;
    const [title, slug] = simple[id];
    const entry = metadata.find((item) => item.title === title);
    assert(entry, `Missing source metadata: ${id}`);
    const sourceURL = si(`icons/${slug}.svg`);
    if (!rawIcons.has(slug)) rawIcons.set(slug, await download(sourceURL, `${slug}.svg`));
    const original = rawIcons.get(slug);
    safeSvg(original.toString('utf8'));
    const originalHex = `#${entry.hex}`;
    const hex = ['nextjs','github','vercel'].includes(id) ? '#FFFFFF' : originalHex;
    let svg = original.toString('utf8').replace('<svg ', `<svg fill="${hex}" `);
    if (id === 'react-native') svg = svg.replace('<title>React</title>', '<title>React Native</title>');
    safeSvg(svg);
    const src = `/technology-icons/${id}.svg`;
    await put(`public${src}`, svg);
    manifest[id] = { src, source: sourceURL, hex, fallback: fallbacks[id] };
    const iconLicense = entry.license?.type ?? null;
    provenance.icons[id] = { provider: 'Simple Icons', version: '16.35.0', commit: siCommit, sourceURL, sourceSha256: sha(original), sourceBytes: original.length, rawFile: `${slug}.svg`, localSha256: sha(svg), localBytes: Buffer.byteLength(svg), originalHex, displayHex: hex, license: iconLicense, collectionLicense: 'CC0-1.0', upstreamMetadata: entry, modifications: [hex === originalHex ? 'Added original brand hex as root fill for external img rendering.' : 'Added white root fill for the monochrome mark on a dark background.', ...(id === 'react-native' ? ['Reused React geometry; changed title to React Native, matching its distinct caption and upstream alias.'] : [])], attribution: id === 'git' ? 'Git Logo by Jason Long; CC BY 3.0; monochrome geometry adapted by Simple Icons; brand-color fill added locally.' : id === 'php' ? 'PHP logo by Colin Viebrock; CC BY-SA 4.0; monochrome adaptation by Simple Icons; brand-color fill added locally. This adapted SVG remains CC BY-SA 4.0.' : id === 'javascript' ? 'JavaScript community logo by Christopher Williams; MIT; adapted by Simple Icons; brand-color fill added locally.' : null };
  }
  const officialAssets = [
    { id: 'csharp', repo: 'dotnet/brand', commit: dotnetCommit, path: 'logo/language-icons/csharp-72.svg', file: 'csharp.svg', hex: '#512BD4', colors: ['#927BE5','#512BD4','#FFFFFF'], license: 'CC0-1.0', attribution: 'Official C# language icon from dotnet/brand. Kept completely unmodified in accordance with language-icon instructions.' },
    { id: 'powerbi', repo: 'microsoft/PowerBI-Icons', commit: powerCommit, path: 'SVG/Power-BI.svg', file: 'powerbi.svg', hex: '#F6D751', colors: ['#FFFFFF','#E6AD10','#C87E0E','#F6D751','#F9E589'], license: 'CC-BY-4.0', attribution: 'Power BI icon by Microsoft and contributors; CC BY 4.0. Original SVG, unmodified. Used to identify the documented Microsoft product; no affiliation or endorsement.' },
    { id: 'nextauth', repo: 'nextauthjs/next-auth', commit: authCommit, path: 'docs/static/img/logo/logo-sm.png', file: 'nextauth.png', hex: null, colors: null, license: 'ISC', attribution: 'NextAuth.js official logo; Copyright (c) 2018-2021, Iain Collins; ISC. Original PNG, unmodified, from next-auth@4.24.11.' },
  ];
  for (const entry of officialAssets) {
    const sourceURL = raw(entry.repo, entry.commit, entry.path);
    const bytes = await download(sourceURL, entry.file);
    if (entry.file.endsWith('.svg')) safeSvg(bytes.toString('utf8'));
    const src = `/technology-icons/${entry.file}`;
    await put(`public${src}`, bytes);
    manifest[entry.id] = { src, source: sourceURL, hex: entry.hex, fallback: fallbacks[entry.id] };
    provenance.icons[entry.id] = { provider: entry.repo, commit: entry.commit, sourceURL, sourceSha256: sha(bytes), sourceBytes: bytes.length, rawFile: entry.file, localSha256: sha(bytes), localBytes: bytes.length, originalHex: entry.hex, originalColors: entry.colors, displayHex: entry.hex, license: entry.license, modifications: [], attribution: entry.attribution };
  }
  const fallbackReasons = {
    sql: { reason: 'SQL is a generic standardized database language, not one database brand. No single canonical SQL mark was identified; another database logo would misrepresent it.', checked: ['https://www.iso.org/standard/76583.html', si('data/simple-icons.json')] },
    java: { reason: 'Java is absent from Simple Icons 16.35.0. Oracle Java logo and Dev.java affinity terms are limited permissions, not an open artwork license; affinity marks require an active Dev.java link and prohibit resizing/animation. Use plain Java text rather than a substitute mascot or unlicensed coffee-cup mark.', checked: [si('data/simple-icons.json'),'https://www.oracle.com/legal/trademarks.html','https://dev.java/community/affinity/'] },
  };
  for (const id of Object.keys(fallbackReasons)) {
    manifest[id] = { src: null, source: null, hex: null, fallback: fallbacks[id] };
    provenance.icons[id] = { ...fallbackReasons[id], sourceURL: null, sourceSha256: null, originalHex: null, license: null };
  }
  const orderedManifest = Object.fromEntries(ids.map((id) => [id, manifest[id]]));
  provenance.icons = Object.fromEntries(ids.map((id) => [id, provenance.icons[id]]));
  provenance.rawDownloads = Object.fromEntries(fetched);
  await put('src/data/technology-icons.json', json(orderedManifest));
  const details = Object.fromEntries(ids.map((id) => [id, { description: definitions[id][0], documentation: definitions[id][1] }]));
  await put('src/data/technology-details.ts', `import type { TechnologyId } from './technologies';\n\n// Neutral technical definitions; official documentation is linked per entry.\nexport const technologyDetails = ${JSON.stringify(details, null, 2)} satisfies Record<TechnologyId, { description: string; documentation: string }>;\n`);
  await put('public/technology-icons/provenance.json', json(provenance));
  const table = ids.map((id) => { const item = provenance.icons[id]; return `| ${id} | ${manifest[id].src ?? 'Text fallback'} | ${item.originalHex ?? '-'} | ${manifest[id].hex ?? '-'} | ${item.license ?? (manifest[id].src ? 'Not specified per icon; see disclaimer' : '-')} |`; }).join('\n');
  const sources = ids.filter((id) => manifest[id].src).map((id) => { const item = provenance.icons[id]; return `- **${id}**: [pinned source](${item.sourceURL}); source SHA-256 \`${item.sourceSha256}\`; local SHA-256 \`${item.localSha256}\` (${item.localBytes} bytes).`; }).join('\n');
  const docs = `# Technology icon sources\n\nAudited 2026-10-24. This supplement preserves all 24 existing technology IDs, categories, and project associations. All runtime images are local; no icon package or runtime network access is required. Descriptions are neutral technical definitions linked to official documentation in src/data/technology-details.ts. They assert no proficiency, experience, or project usage.\n\n## Pinned sources and geometry\n\nSimple Icons **16.35.0** was verified against its [official release](https://github.com/simple-icons/simple-icons/releases/tag/16.35.0), annotated tag 37ada29537474766bd71595af691abfe295798ef and commit **${siCommit}**, including that commit's package version and data/simple-icons.json. The 18 distinct Simple Icons marks serve 19 IDs because React Native reuses React geometry, with a React Native title/caption, matching the official upstream duplicate alias. Source SVG path data is preserved exactly. Only a root fill is added for standalone image rendering. Next.js, GitHub, and Vercel use white monochrome variants on the dark gallery; original source hex values remain recorded. All other Simple Icons fills use their source brand hex. The C mark is the established community C-language mark carried by Simple Icons, not an ISO/WG14 institutional logo.\n\nC# uses the [official .NET language icon](${raw('dotnet/brand',dotnetCommit,'logo/language-icons/csharp-72.svg')}) at commit ${dotnetCommit}, byte-for-byte, including its purple gradient. Its [language-icon instructions](${raw('dotnet/brand',dotnetCommit,'logo/language-icons/README.md')}) and repository CC0 license are preserved.\n\nPower BI uses [Microsoft's genuine SVG](${raw('microsoft/PowerBI-Icons',powerCommit,'SVG/Power-BI.svg')}) at commit ${powerCommit}, byte-for-byte, including its viewBox, mask, gradient, filter and aspect ratio. Microsoft and contributors license repository content under CC BY 4.0; the original LICENSE, LICENSE-CODE and README legal notices are preserved. Credit: **Microsoft and contributors, Power BI icon, CC BY 4.0, unmodified**. This documents the named product; it does not imply endorsement. The manifest hex #F6D751 is an actual source-gradient color, not a claim that this multicolor artwork has one official flat color.\n\nNextAuth uses the **official original PNG** locally as /technology-icons/nextauth.png, the approved official-image alternative to an SVG. It is pinned to next-auth@4.24.11, commit ${authCommit}, with the ISC LICENSE and Iain Collins copyright preserved. The repository's docs configuration selects img/logo/logo-xs.png; logo-sm.png is the larger version in the same official logo directory. docs/static/img/logo.svg is an unrelated Docusaurus dinosaur and is deliberately excluded. No vector tracing, fabricated shield, embedded raster SVG wrapper, recoloring, or remote image request is used. Its multicolor artwork has no verified single original brand hex, so hex is null.\n\n## License and attribution preservation\n\nOriginal full texts live under public/technology-icons/licenses/. Simple Icons' CC0 LICENSE and entire DISCLAIMER are unchanged. CC0 for the collection does not automatically establish rights to every brand mark: all original per-icon metadata, source/guideline links and license fields are retained in provenance.json. A missing upstream per-icon license stays null and is not relabeled CC0. Trademark rights remain with their owners.\n\n- JavaScript: community logo by **Christopher Williams**, MIT; original pinned MIT copyright/license included.\n- Git: logo by **Jason Long**, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); monochrome adaptation by Simple Icons and local brand-color root fill. Full license included.\n- PHP: logo by **Colin Viebrock**, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); monochrome adaptation by Simple Icons and local brand-color root fill. This adapted SVG remains under CC BY-SA 4.0. Full license included. [Official PHP attribution](https://www.php.net/download-logos.php).\n- C#: original official artwork from dotnet/brand, CC0; full license, repository README and specific language-icon instructions included. Keep it unmodified.\n- NextAuth: **Copyright (c) 2018-2021, Iain Collins**, ISC; original full license included.\n- Power BI: **Microsoft and contributors**, CC BY 4.0; original full license and legal notices included.\n\n## Colors and assets\n\n| Technology ID | Local asset | Original hex | Display hex | Per-icon license |\n| --- | --- | --- | --- | --- |\n${table}\n\n## Honest text fallbacks\n\n- **SQL**: ${fallbackReasons.sql.reason} [SQL standard](https://www.iso.org/standard/76583.html).\n- **Java**: ${fallbackReasons.java.reason} [Oracle trademark guidance](https://www.oracle.com/legal/trademarks.html), [official affinity terms](https://dev.java/community/affinity/). No invented or third-party logo was used.\n\nC#, Java and Power BI were confirmed absent from the pinned Simple Icons metadata. Official dotnet/brand, Microsoft PowerBI-Icons, Microsoft Power Platform guidance and Oracle/Dev.java sources were checked before choosing official artwork or text.\n\n## Source and output hashes\n\nThe machine-readable public/technology-icons/provenance.json retains sourceURL, source SHA-256, local SHA-256, original colors, all selected upstream metadata/license fields, exact commits, byte counts and modifications. Raw downloads are in .cache/technology-gallery/icon-sources/.\n\n${sources}\n\n## Definition sources\n\nEach description's documentation field is its official source. These primary references were inspected: Ecma/TC39 for JavaScript; TypeScript handbook; Python tutorial; Go FAQ/specification; PHP manual; ISO SQL framework; Microsoft C# tour; WG14 C committee/draft; Oracle/Dev.java language and JVM tutorials; Astro concepts; React; React Native; Next.js; Tailwind; FastAPI; MySQL; SQLite; Upstash; Google Gemini API; NextAuth v4; Git manual; GitHub Docs; Vercel Docs; and Microsoft Power BI overview. Definitions contain no personal or project claims.\n\n## Reproduction and offline validation\n\nRun node scripts/fetch-technology-icons.mjs --fetch only as an explicit maintenance operation with network/write permission; it writes only these generated asset/data/provenance files and its raw-download cache. It never edits existing technologies.ts, projects.ts, dependencies, UI or tests. Run node scripts/fetch-technology-icons.mjs --verify for offline read-only coverage, schema, SHA-256, exact path-data, SVG allowlist/reference, PNG signature and original-data baseline checks. XML parsing and isolated TypeScript checks can be performed without launching the application. No browser, build, app test, Git command, or deployment is part of this asset task.\n`;
  await put('docs/technology-icon-sources.md', docs);
  await put('public/technology-icons/README.md', '# Local technology assets\n\nProvenance, source/local SHA-256, original colors and upstream per-icon metadata: [provenance.json](provenance.json). Full original licenses/disclaimers: [licenses/](licenses/). Human-readable decisions and attributions: [../../docs/technology-icon-sources.md](../../docs/technology-icon-sources.md) in the source workspace.\n\nGit logo: Jason Long, CC BY 3.0. PHP logo: Colin Viebrock, CC BY-SA 4.0 (adaptation retains that license). JavaScript community logo: Christopher Williams, MIT. Power BI icon: Microsoft and contributors, CC BY 4.0, unmodified. NextAuth logo: Iain Collins, ISC, unmodified. C# language icon: dotnet/brand, CC0, unmodified. Simple Icons collection: CC0, subject to the preserved per-icon metadata and disclaimer.\n');
  await verify();
}