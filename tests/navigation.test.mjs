import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const expectedIds = ['home', 'about', 'education', 'projects', 'tech-stack', 'experience', 'contact'];
const root = resolve('dist');
const artifacts = resolve('.cache/verification');
const errors = [];
const widths = [];
let hostContext;
let browser;
let server;
let base;
const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.pdf': 'application/pdf' };

before(async () => {
  assert.ok(existsSync(join(root, 'index.html')), 'Run npm run build before browser tests.');
  await mkdir(artifacts, { recursive: true });
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  base = 'http://127.0.0.1:' + server.address().port;
  hostContext = await chromium.launchPersistentContext(resolve('.cache/browser-profile'), {
    channel: 'msedge', headless: true,
    viewport: { width: 1366, height: 900 },
    args: ['--no-first-run', '--disable-background-networking'],
  });
  browser = hostContext.browser();
});

after(async () => {
  if (browser) {
    await writeFile(join(artifacts, 'browser-results.json'), JSON.stringify({
      browser: browser.version(), widths, pageErrors: errors,
    }, null, 2));
  }
  await hostContext?.close();
  if (server) await new Promise((done) => server.close(done));
});

async function openPage(t, options = {}) {
  const context = await browser.newContext({colorScheme:'dark', viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce', ...options });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  page.setDefaultNavigationTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test('the built page exposes seven ordered sections and working navigation destinations', async (t) => {
  const page = await openPage(t);
  assert.deepEqual(await page.locator('main > section').evaluateAll((nodes) => nodes.map((node) => node.id)), expectedIds);
  assert.deepEqual(await page.locator('[data-section]').evaluateAll((nodes) => nodes.map((node) => node.id)), expectedIds, 'Only primary sections may enter the navigation observer');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('main > section h2').count(), 6);
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.title(), 'Haggai Estavilla — Software Developer');
  for (const id of expectedIds) {
    assert.equal(await page.locator('main > section#' + id).count(), 1);
    assert.equal(await page.locator('a[href="#' + id + '"]').count() >= 2, true);
  }
  assert.deepEqual(await page.locator('.desktop-navigation a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))), expectedIds.map((id) => '#' + id));
});

test('active navigation follows forward and reverse scrolling without changing the hash', async (t) => {
  const page = await openPage(t);
  for (const id of ['education', 'projects', 'contact', 'tech-stack', 'about', 'home']) {
    await page.locator('#' + id).evaluate((section) => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForFunction((id) => document.querySelector('.desktop-navigation a[aria-current="location"]')?.getAttribute('href') === '#' + id, id);
    assert.equal(await page.locator('.desktop-navigation a[aria-current="location"]').count(), 1);
    assert.equal(new URL(page.url()).hash, '');
  }
});

test('mobile selection closes the menu and moves focus to the destination', async (t) => {
  const page = await openPage(t, { viewport: { width: 390, height: 844 } });
  await page.locator('.mobile-navigation > summary').click();
  assert.equal(await page.locator('.mobile-navigation').getAttribute('open') !== null, true);
  await page.locator('.mobile-navigation a[href="#projects"]').click();
  await page.waitForURL('**/#projects');
  assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'projects');
  assert.equal(await page.locator('.mobile-navigation > summary').getAttribute('aria-expanded'), 'false');
});

test('Escape closes the keyboard-operated mobile menu and restores visible focus', async (t) => {
  const page = await openPage(t, { viewport: { width: 320, height: 720 } });
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.mobile-navigation > summary').evaluate((element) => element === document.activeElement), true);
  assert.equal(await page.locator('.mobile-navigation > summary').evaluate((element) => getComputedStyle(element).outlineStyle), 'solid');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.mobile-navigation a[href="#home"]').evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
  assert.equal(await page.locator('.mobile-navigation > summary').evaluate((element) => element === document.activeElement), true);
});

test('native mobile disclosure and anchors remain usable without JavaScript', async (t) => {
  const page = await openPage(t, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await page.locator('.mobile-navigation > summary').click();
  assert.equal(await page.locator('.mobile-navigation a:visible').count(), 7);
  await page.locator('.mobile-navigation a[href="#contact"]').click();
  await page.waitForURL('**/#contact');
  const position = await page.locator('#contact').boundingBox();
  assert.ok(position.y >= 0 && position.y < 220, 'Contact must be visible below the navigation.');
});

test('reduced motion disables smooth scrolling; the default preference enables it', async (t) => {
  const reduced = await openPage(t);
  assert.equal(await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
  const full = await openPage(t, { reducedMotion: 'no-preference' });
  assert.equal(await full.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'smooth');
});

test('direct fragments, hash changes and resize keep navigation state consistent', async (t) => {
  const page = await openPage(t);
  await page.goto(base + '/#education');
  await page.waitForFunction(() => document.querySelector('.desktop-navigation a[aria-current]')?.getAttribute('href') === '#education');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-navigation > summary').click();
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
  await page.evaluate(() => { location.hash = 'contact'; });
  await page.waitForFunction(() => document.querySelector('.desktop-navigation a[aria-current]')?.getAttribute('href') === '#contact');
});

test('six responsive widths have no horizontal overflow, clipped headings or nav collisions', async (t) => {
  for (const [width, height] of [[1920,1080], [1366,900], [1024,768], [768,1024], [390,844], [320,720]]) {
    const page = await openPage(t, { viewport: { width, height } });
    const report = await page.evaluate(() => {
      const nav = document.querySelector('.floating-navigation').getBoundingClientRect();
      const headings = [...document.querySelectorAll('h1, h2')].map((heading) => {
        const rect = heading.getBoundingClientRect();
        return { left: rect.left, right: rect.right, fontSize: parseFloat(getComputedStyle(heading.querySelector('.hero-name') ?? heading).fontSize), scrollWidth: heading.scrollWidth, clientWidth: heading.clientWidth };
      });
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, headings,
        nav: { left: nav.left, right: nav.right, bottom: nav.bottom }, heroTop: document.querySelector('h1').getBoundingClientRect().top,
        fonts: document.fonts.check('600 32px "Space Grotesk"') && document.fonts.check('400 16px "Inter"') };
    });
    widths.push(report);
    assert.ok(report.scrollWidth <= width, 'Horizontal overflow at ' + width);
    assert.ok(report.nav.left >= 0 && report.nav.right <= width, 'Navigation exceeds viewport at ' + width);
    assert.ok(report.heroTop > report.nav.bottom, 'Navigation overlaps hero at ' + width);
    assert.ok(report.fonts, 'Local fonts did not load at ' + width);
    for (const heading of report.headings) {
      assert.ok(heading.left >= 0 && heading.right <= width + 1, 'Heading outside viewport at ' + width);
      assert.ok(heading.scrollWidth <= heading.clientWidth + 1, 'Heading text clips at ' + width);
      assert.ok(heading.fontSize >= 32, 'Heading too small at ' + width);
    }
    await page.screenshot({ path: join(artifacts, 'foundation-' + width + '.png') });
    if (width === 390) await page.screenshot({ path: join(artifacts, 'foundation-mobile-full.png'), fullPage: true, timeout: 15000 });
    await page.close();
  }
});

test('original source libraries are not requested and page resources remain self-hosted', async (t) => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.ok(requests.every((url) => url.startsWith(base)), 'External runtime request found');
  assert.ok(requests.every((url) => !/\/mr-fresh\/(base|expressions|poses)\/|\/project-assets\//.test(url)), 'Original source library requested');
  assert.deepEqual(errors, []);
});

test('keyboard users can tab out of the mobile menu without a focus trap', async (t) => {
  const page = await openPage(t, { viewport: { width: 390, height: 844 } });
  await page.locator('.mobile-navigation > summary').focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 7; i++) await page.keyboard.press('Tab');
  assert.equal(await page.locator('.mobile-navigation a[href="#contact"]').evaluate((node) => node === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-navigation-visibility]').evaluate((node) => node === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-theme-toggle]').evaluate((node) => node === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.wordmark').evaluate((node) => node === document.activeElement), true);
  assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
});

test('body and navigation text meet normal-text contrast requirements', async (t) => {
  const page = await openPage(t);
  const pairs = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const nav = getComputedStyle(document.querySelector('.desktop-navigation'));
    return [
      [body.color, body.backgroundColor],
      [getComputedStyle(document.querySelector('.desktop-navigation a[href="#about"]')).color, nav.backgroundColor],
      [getComputedStyle(document.querySelector('.desktop-navigation a[aria-current]')).color, nav.backgroundColor],
    ];
  });
  const luminance = (color) => {
    const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => value / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const [foreground, background] of pairs) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, 'Insufficient text contrast');
  }
});

test('active navigation crosses the section boundary during small scroll steps', async (t) => {
  for (const width of [1024, 768]) {
    const page = await openPage(t, { viewport: { width, height: 1024 } });
    await page.evaluate(async () => {
      const sectionTop = document.getElementById('about').getBoundingClientRect().top + scrollY;
      scrollTo({ top: sectionTop - (innerHeight * 0.35 + 0.4), behavior: 'instant' });
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
    await page.evaluate(() => scrollBy({ top: 2.4, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.desktop-navigation a[aria-current]')?.getAttribute('href') === '#about');
    await page.close();
  }
});

test('Phase 2 renders four contribution-scoped projects with native inline case studies', async (t) => {
  const page = await openPage(t);
  assert.equal(await page.locator('[data-project]').count(), 4);
  assert.deepEqual(await page.locator('[data-project] h3').allTextContents(), ['Anthea', 'Lifevent', 'Seek First Books', 'PhilCHAN Cebu']);
  assert.equal(await page.locator('.case-study').count(), 4);
  for (const card of await page.locator('[data-project]').all()) {
    await page.locator('[data-orbit-item="'+await card.getAttribute('data-project')+'"]').click();
    const summary = card.locator('.case-study > summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await card.locator('.case-study').getAttribute('open') !== null, true);
    assert.equal(await card.locator('.case-study-content').isVisible(), true);
    await page.keyboard.press('Enter');
  }
  assert.equal(await page.locator('[data-project="lifevent"] a[href*="github.com"]').count(), 0);
  assert.match(await page.locator('[data-project="lifevent"]').textContent(), /login/i);
  assert.match(await page.locator('[data-project="lifevent"]').textContent(), /rate limiting/i);
  assert.equal(await page.getByText('FuelWatch', { exact: false }).count(), 0);
});

test('project destinations are correct and restricted client media stays out of production', async (t) => {
  const page = await openPage(t);
  const expected = [
    ['anthea', 'https://anthea-ruby.vercel.app/', 'https://github.com/Haste04/Anthea'],
    ['lifevent', 'https://phlifevent.vercel.app/', null],
    ['seek-first-books', 'https://seek-alpha.vercel.app/', 'https://github.com/Haste04/Bookkeeping-Landing-Page'],
  ];
  for (const [id, live, github] of expected) {
    assert.equal(await page.locator('[data-project="' + id + '"] a[data-live]').getAttribute('href'), live);
    if (github) assert.equal(await page.locator('[data-project="' + id + '"] a[data-source]').getAttribute('href'), github);
  }
  assert.equal(await page.locator('[data-project="philchan-cebu"] img').count(), 0);
  assert.equal(await page.locator('[data-project="philchan-cebu"] [data-media-withheld]').count(), 1);
  assert.equal(await page.locator('[data-project="philchan-cebu"] a[data-live], [data-project="philchan-cebu"] a[data-source]').count(), 0);
  assert.equal((await page.request.get(base + '/__local-media/philchan-cebu.webp')).status(), 404);
  const html = await readFile(join(root, 'index.html'), 'utf8');
  assert.ok(!html.includes('https://philchan-cebu.vercel.app/'));
});

test('technology activation and direct switching reveal matching projects without forced scrolling', async (t) => {
  const page = await openPage(t);
  const astro = page.locator('button[data-technology="astro"]');
  await astro.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.addEventListener('pointerdown', () => { window.__techPointerY = scrollY; }, { once: true }));
  await astro.click();
  assert.equal(await page.locator('[data-connection="astro"]').isVisible(), true);
  assert.deepEqual(await page.locator('[data-project][data-related="true"] h3').allTextContents(), ['Seek First Books', 'PhilCHAN Cebu']);
  const position = await page.evaluate(() => ({ before:window.__techPointerY, after:scrollY }));
  assert.ok(Math.abs(position.after - position.before) < 3, 'Technology selection scroll change: ' + JSON.stringify(position));
  await page.locator('[data-tech-switch]').selectOption('gemini');
  assert.deepEqual(await page.locator('[data-project][data-related="true"] h3').allTextContents(), ['Anthea']);
  await page.locator('[data-tech-switch]').selectOption('mysql');
  assert.equal(await page.locator('[data-connection="mysql"]').isVisible(), true);
  assert.equal(await page.locator('[data-connection="mysql"] [data-tech-projects] a').count(), 0);
  assert.match(await page.locator('[data-connection="mysql"]').textContent(), /toolkit/i);
});

test('About, project case studies and technology relationships work without JavaScript', async (t) => {
  const page = await openPage(t, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  assert.equal(await page.locator('#about .photo-story').count(), 4);
  assert.equal(await page.locator('#about details,#about summary').count(), 0);
  assert.ok(await page.locator('#about .story-detail').first().isVisible());
  await page.locator('.case-study').first().locator('summary').click();
  assert.equal(await page.locator('.case-study[open]').count(), 1);
  await page.locator('#technology-astro summary').click();
  assert.equal(await page.locator('#technology-astro').isVisible(), true);
  assert.equal(await page.locator('#technology-astro a[href="#project-seek-first-books"]').count(), 1);
});

test('contact links and the actual resume download preserve the original PDF bytes', async (t) => {
  const page = await openPage(t);
  assert.equal(await page.locator('#contact a[href="mailto:haggaiestavilla04@gmail.com"]').count(), 1);
  assert.equal(await page.locator('#contact a[href="https://www.linkedin.com/in/haggai-estavilla-027702236/"]').count(), 1);
  assert.equal(await page.locator('#contact a[href="https://github.com/Haste04"]').count(), 1);
  assert.equal(await page.locator('#contact a[href="#home"]').count(), 1);
  const link = page.locator('#contact a[download]');
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const saved = join(artifacts, 'downloaded-resume.pdf');
  await download.saveAs(saved);
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(await readFile(saved)), hash(await readFile('Estavilla Resume.pdf')));
  assert.equal(hash(await readFile('public/downloads/Estavilla Resume.pdf')), hash(await readFile('Estavilla Resume.pdf')));
});

test('responsive content images load with intrinsic dimensions and completed-page screenshots are captured', async (t) => {
  for (const [width, height] of [[1920,1080], [1366,900], [1024,768], [768,1024], [390,844], [320,720]]) {
    const page = await openPage(t, { viewport: { width, height } });
    // Phase 3 keeps an outgoing image layer for short pose transitions.
    assert.equal(await page.locator('#fresh-companion').count(), 1);
    assert.equal(await page.locator('#home [data-fresh-layer]:not([hidden]) img').count(), 1);
    const hero = await page.locator('.hero-heading').boundingBox();
    const mascot = await page.locator('.mascot-stage').boundingBox();
    if (width >= 1024) assert.ok(mascot.x > hero.x + hero.width - 1, 'Desktop hero should be split');
    if (width < 768) assert.ok(mascot.y > hero.y + hero.height, 'Mobile mascot should follow typography');
    // Moving mascot framing is checked separately in mascot-browser.test.mjs.
    for (const image of await page.locator('.project-image').all()) {
      const id=await image.evaluate(n=>n.closest('[data-project]').dataset.project);
      await page.locator('[data-orbit-item="'+id+'"]').click();
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction((node) => node.complete && node.naturalWidth > 0, await image.elementHandle());
      await image.evaluate((node) => node.decode());
      const info = await image.evaluate((node) => { const style = getComputedStyle(node); const box = node.getBoundingClientRect(); const x = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth); const y = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth); return { loaded: node.naturalWidth > 0, width: node.getAttribute('width'), height: node.getAttribute('height'), source: node.currentSrc, ratio: Number(node.getAttribute('width')) / Number(node.getAttribute('height')), displayed: (box.width - x) / (box.height - y) }; });
      assert.ok(info.loaded && info.width && info.height);
      assert.ok(Math.abs(info.ratio - info.displayed) < 0.02, 'Image proportions at ' + width + ': ' + JSON.stringify(info));
    }
    assert.equal(await page.locator('.project-image[loading="lazy"]').count(), 3);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Content overflows at ' + width);
    await page.locator('#home').evaluate((node) => node.scrollIntoView({ behavior: 'instant' }));
    await page.screenshot({ path: join(artifacts, 'phase2-' + width + '.png') });
    if ([1366,390].includes(width)) await page.screenshot({ path: join(artifacts, 'phase2-full-' + width + '.png'), fullPage: true, timeout: 15000 });
    if (width === 1366) await page.locator('#projects').screenshot({ path: join(artifacts, 'phase2-projects-desktop.png') });
    await page.close();
  }
});

test('restricted client preview is available only from the local development server', { timeout: 120000 }, async (t) => {
  const probe = createServer();
  await new Promise((done) => probe.listen(0, '127.0.0.1', done));
  const port = probe.address().port;
  await new Promise((done) => probe.close(done));
  // A second server must not race the user's live server for Vite's dependency cache.
  const previewConfig=join(artifacts,'local-preview.config.mjs');
  await writeFile(previewConfig,"import base from '../../astro.config.mjs';\nexport default {...base,vite:{...base.vite,cacheDir:"+JSON.stringify(join(artifacts,'vite-preview'))+"}};\n");
  const dev = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--config', '.cache/verification/local-preview.config.mjs', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'], {
    cwd: process.cwd(), env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  dev.stdout.on('data', (data) => { logs = (logs + data).slice(-5000); });
  dev.stderr.on('data', (data) => { logs = (logs + data).slice(-5000); });
  t.after(async () => {
    if (dev.exitCode === null) {
      dev.kill();
      await Promise.race([new Promise((done) => dev.once('exit', done)), new Promise((done) => setTimeout(done, 3000))]);
    }
  });
  const local = 'http://127.0.0.1:' + port;
  let ready = false, readinessError = '';
  const startupDeadline = Date.now() + 60000;
  while (Date.now() < startupDeadline) {
    if (dev.exitCode !== null) throw new Error('Dev server exited: ' + logs);
    try { const response=await fetch(local, { signal: AbortSignal.timeout(5000) }); if (response.ok) { ready = true; break; } readinessError='HTTP '+response.status+' '+(await response.text()).slice(0,500); } catch(error) { readinessError=String(error)+' '+String(error.cause??''); }
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.ok(ready, 'Local preview did not start: ' + readinessError + '\n' + logs);
  for (const path of ['/project-assets/philchan-cebu/homepage.png', '/@fs/' + resolve('project-assets/philchan-cebu/homepage.png').replaceAll('\\', '/'), '/@fs/' + resolve('.cache/local-media/philchan-cebu.webp').replaceAll('\\', '/')]) {
    assert.equal((await fetch(local + path, { headers: { Accept: 'image/webp,image/png' } })).status, 403, 'Restricted source URL must be denied: ' + path);
  }
  const response = await fetch(local + '/__local-media/philchan-cebu.webp');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/webp');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  const page = await openPage(t);
  for (const [width, height] of [[1366,900], [390,844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(local, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.project-image').count(), 4);
    await page.locator('[data-orbit-item="philchan-cebu"]').click();
    const image = page.locator('[data-project="philchan-cebu"] img[data-local-only]');
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction((node) => node.complete && node.naturalWidth > 0, await image.elementHandle());
    await image.evaluate((node) => node.decode());
    assert.equal(await page.locator('[data-project="philchan-cebu"] a[data-live]').getAttribute('href'), 'https://philchan-cebu.vercel.app/');
    assert.equal(await page.locator('[data-project="philchan-cebu"] a[data-source]').getAttribute('href'), 'https://github.com/Haste04/Philchan-Cebu');
    await page.locator('[data-project="philchan-cebu"]').screenshot({ path: join(artifacts, 'phase2-philchan-local-' + width + '.png') });
  }
});

test('keyboard activation can reach the selected technology project links', async (t) => {
  const page = await openPage(t);
  await page.locator('button[data-technology="astro"]').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-tech-back]').evaluate(n=>n===document.activeElement),true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-tech-switch]').evaluate(n=>n===document.activeElement),true);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#project-seek-first-books');
  assert.equal(await page.locator('[data-connection="astro"]').isVisible(), true);
});

test('Back to Top returns to the document top with the masthead clear of navigation', async (t) => {
  const page = await openPage(t, { viewport: { width: 390, height: 844 } });
  await page.locator('#contact a[href="#home"]').click();
  await page.waitForURL('**/#home');
  assert.equal(await page.evaluate(() => scrollY), 0);
  const clear = await page.evaluate(() => document.querySelector('.wordmark').getBoundingClientRect().top > document.querySelector('.floating-navigation').getBoundingClientRect().bottom);
  assert.equal(clear, true);
});

test('navigation can hide and restore at all six widths while section tracking and the shared mascot remain active',async t=>{
 for(const width of [1920,1366,1024,768,390,320]){
  const p=await openPage(t,{viewport:{width,height:900}});
  const toggle=p.getByRole('button',{name:'Hide navigation bar',exact:true});
  assert.ok(await toggle.isVisible());assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  if(width<768)await p.locator('.mobile-navigation summary').click();
  await toggle.click();
  const show=p.getByRole('button',{name:'Show navigation bar',exact:true});
  assert.ok(await show.isVisible());assert.equal(await show.getAttribute('aria-expanded'),'false');
  const restoreBounds=await show.boundingBox();assert.ok(restoreBounds.x>=0&&restoreBounds.x<width/4,'Show belongs at the upper-left edge: '+JSON.stringify(restoreBounds));
  assert.equal(await p.locator('.desktop-navigation').isVisible(),false);assert.equal(await p.locator('.mobile-navigation').isVisible(),false);
  assert.equal(await p.locator('.mobile-navigation').evaluate(n=>n.open),false,'hiding closes the expanded mobile menu');
  await p.locator('#education').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
  await p.waitForFunction(()=>document.querySelector('.desktop-navigation [aria-current]')?.getAttribute('href')==='#education');
  await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='education');
  assert.equal(await p.locator('#fresh-companion').count(),1);
  await show.click();
  assert.equal(await p.getByRole('button',{name:'Hide navigation bar',exact:true}).getAttribute('aria-expanded'),'true');
  assert.ok(await p.locator(width>=768?'.desktop-navigation':'.mobile-navigation').isVisible());
  assert.equal(await p.locator('.desktop-navigation [aria-current]').getAttribute('href'),'#education');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const bounds=await p.locator('[data-navigation-visibility]').boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44&&bounds.x>=0&&bounds.x+bounds.width<=width);
  if(width===1366||width===390){await p.locator('[data-navigation]').screenshot({path:'.cache/navigation-visibility/shown-'+width+'.png'});await p.locator('[data-navigation-visibility]').click();await p.locator('[data-navigation]').screenshot({path:'.cache/navigation-visibility/hidden-'+width+'.png'});}
  await p.close();
 }
});
test('navigation visibility is keyboard accessible and remains hidden across responsive changes until restored',async t=>{
 const p=await openPage(t,{viewport:{width:390,height:844}});
 const toggle=p.locator('[data-navigation-visibility]');await toggle.focus();await p.keyboard.press('Space');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(n=>n===document.activeElement),true);
 assert.notEqual(await toggle.evaluate(n=>getComputedStyle(n).outlineStyle),'none');
 await p.keyboard.press('Tab');assert.equal(await p.locator('[data-theme-toggle]').evaluate(n=>n===document.activeElement),true,'theme remains accessible outside hidden navigation');
 assert.equal(await p.locator('[data-navigation-content]').evaluate(n=>n.contains(document.activeElement)),false,'hidden links leave the tab order');
 await p.keyboard.press('Tab');assert.equal(await p.locator('.wordmark').evaluate(n=>n===document.activeElement),true);
 await p.setViewportSize({width:1366,height:900});assert.equal(await p.locator('.desktop-navigation').isVisible(),false);
 await toggle.focus();await p.keyboard.press('Enter');assert.ok(await p.locator('.desktop-navigation').isVisible());
 await p.locator('.desktop-navigation a[href="#projects"]').click();await p.waitForURL('**/#projects');
 await p.locator('[data-orbit-next]').click();assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-selected-project'),'lifevent');
});

test('navigation slides up to hide and in from the left to show on desktop and mobile',async t=>{
 for(const width of [1366,390]){
  const p=await openPage(t,{viewport:{width,height:900},reducedMotion:'no-preference'});
  const toggle=p.locator('[data-navigation-visibility]'),content=p.locator('[data-navigation-content]');
  await toggle.evaluate(n=>n.click());
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  const up=await content.evaluate(n=>{
   const animation=n.getAnimations()[0];if(!animation)return null;
   const frames=animation.effect.getKeyframes();animation.pause();animation.currentTime=150;
   return {from:frames[0].transform,to:frames.at(-1).transform,y:new DOMMatrixReadOnly(getComputedStyle(n).transform).m42,inert:n.inert,ariaHidden:n.getAttribute('aria-hidden'),hidden:n.hidden};
  });
  assert.ok(up,'hiding has an actual finite animation');
  assert.match(up.to,/translateY\(-/);assert.ok(up.y<-10,'bar travels upward');assert.equal(up.inert,true);assert.equal(up.ariaHidden,'true');assert.equal(up.hidden,false,'bar remains rendered until its exit finishes');
  await content.evaluate(n=>n.getAnimations()[0].finish());
  await p.waitForFunction(()=>document.querySelector('[data-navigation-content]').hidden);
  assert.ok(await toggle.isVisible());
  await toggle.evaluate(n=>n.click());
  const down=await content.evaluate(n=>{
   const animation=n.getAnimations()[0];if(!animation)return null;
   const frames=animation.effect.getKeyframes();animation.pause();animation.currentTime=150;
   const matrix=new DOMMatrixReadOnly(getComputedStyle(n).transform);return {from:frames[0].transform,to:frames.at(-1).transform,x:matrix.m41,y:matrix.m42,hidden:n.hidden};
  });
  assert.ok(down);assert.match(down.from,/translateX\(-/);assert.equal(down.to,'translateX(0px)');assert.ok(down.x<-10,'returning bar slides in from the left');assert.ok(Math.abs(down.y)<1,'entry stays horizontal');assert.equal(down.hidden,false);
  await content.evaluate(n=>n.getAnimations()[0].finish());
  await p.waitForFunction(()=>document.querySelector('[data-navigation]').dataset.navigationMotion==='idle');
  assert.equal(await content.evaluate(n=>getComputedStyle(n).transform),'none');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.close();
 }
});
test('navigation slide cancels stale transitions on rapid reversal and respects Pause and reduced motion',async t=>{
 const p=await openPage(t,{reducedMotion:'no-preference'}),content=p.locator('[data-navigation-content]');
 await p.locator('[data-navigation-visibility]').evaluate(n=>{n.click();n.click();n.click()});
 await p.waitForFunction(()=>document.querySelector('[data-navigation-content]').hidden);
 assert.equal(await p.locator('[data-navigation-visibility]').getAttribute('aria-expanded'),'false');
 await p.locator('[data-navigation-visibility]').evaluate(n=>n.click());
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
 assert.equal(await content.evaluate(n=>n.getAnimations().length),0);
 assert.equal(await content.evaluate(n=>n.hidden),false);
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.locator('[data-navigation-visibility]').evaluate(n=>n.click());
 assert.equal(await content.evaluate(n=>n.hidden),true);assert.equal(await content.evaluate(n=>n.getAnimations().length),0);
 await p.locator('[data-navigation-visibility]').evaluate(n=>n.click());
 assert.equal(await content.evaluate(n=>n.hidden),false);assert.equal(await content.evaluate(n=>n.getAnimations().length),0);
});
