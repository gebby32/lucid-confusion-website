// Run with NODE_PATH pointing to Playwright; PREVIEW_URL may target local or production.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const item = require('./handheld-oct19-source.json').find(i => i.id === 'soup-squirrel-the-ninja-squire');
const catalog = require('../assets/handhelds/catalog.json');
const entry = catalog.find(i => i.id === item.id);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(item.file), html = bytes.toString();
assert.equal(hash(bytes), item.sha256);
assert.equal(hash(fs.readFileSync(item.source)), item.sha256, 'Unmodified completed source build');
assert.notEqual(item.sha256, item.replacedSha256);
assert.deepEqual(fs.readdirSync(path.dirname(item.file)).sort(), ['index.html', 'thumbnail.webp'], 'No obsolete runtime files');
assert.equal(hash(fs.readFileSync(item.thumbnail)), 'a516425bc51631f55140a390da4dfa50fdfe3169739f6fee0cc9b9f7f8653326');
assert.equal(new URL(entry.url, 'http://localhost').searchParams.get('v'), item.sha256.slice(0, 12));
const sourceRoot = path.join(path.dirname(item.source), 'website');
const sourceHtml = fs.readFileSync(path.join(sourceRoot, 'index.html'), 'utf8');
const scripts = [...sourceHtml.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
for (const script of scripts) assert(html.includes(fs.readFileSync(path.join(sourceRoot, script), 'utf8').replace(/<\/script/g, '<\\/script')), script);
assert(html.includes(fs.readFileSync(path.join(sourceRoot, 'css/style.css'), 'utf8')));
const assets = JSON.parse(html.match(/window.LP_ASSETS = (\{[\s\S]*?\});<\/script>/)[1]);
for (const [name, data] of Object.entries(assets)) assert.deepEqual(Buffer.from(data.split(',')[1], 'base64'), fs.readFileSync(path.join(sourceRoot, name)), name);
assert.equal(hash(Buffer.from(assets['assets/handheld.webp'].split(',')[1], 'base64')), item.artSha256);
assert(!/<(?:script|link)\b[^>]*\s(?:src|href)=/.test(html), 'All dependencies embedded');
console.log(`Source verified: ${bytes.length} bytes, ${scripts.length} scripts, ${Object.keys(assets).length} embedded images; console art and thumbnail unchanged`);

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const route = '/retro-handheld/games/' + item.id;
const ready = (page, pathname) => page.waitForFunction(p => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && location.pathname.replace(/\/$/, '') === p, pathname);
const titleReady = frame => frame.waitForFunction(() => window.GAME && LP.States.current === 'title', null, { timeout: 45000 });

// A real HTTP cache test: prime a fresh, hour-long old catalog and game response,
// then switch the server to the update. Do not use interception (it disables cache).
async function warmCache(browser) {
  const root = path.resolve(__dirname, '..'), requests = [];
  let updated = false;
  const oldCatalog = catalog.map(g => g.id === item.id ? { ...g, url: g.url.split('?')[0] } : g);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push({ url: req.url, updated, headers: req.headers });
    if (url.pathname === '/warm.html') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Cache test</title>'); return; }
    if (url.pathname === '/assets/handhelds/catalog.json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ETag: updated ? '"new-catalog"' : '"old-catalog"' });
      res.end(JSON.stringify(updated ? catalog : oldCatalog)); return;
    }
    if (!updated && url.pathname === '/' + item.file) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' }); res.end('<title>Old cached game</title>'); return;
    }
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const target = fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
      res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
      res.end(fs.readFileSync(target));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/warm.html');
    await page.evaluate(async file => { await (await fetch('/assets/handhelds/catalog.json')).text(); await (await fetch('/' + file)).text(); }, item.file);
    updated = true;
    await page.goto(origin + '/retro-handheld/games/?debug=1');
    await ready(page, '/retro-handheld/games');
    await page.locator(`#handheld-grid a[data-game="${item.id}"]`).click();
    await ready(page, route);
    const frame = await (await page.locator('#handheld-player iframe').elementHandle()).contentFrame();
    await titleReady(frame);
    assert.equal(frame.url(), new URL(entry.url, origin).href);
    assert.equal(await frame.evaluate(() => Levels.total), 10, 'New build bypasses old cached game');
    const revalidation = requests.find(r => r.updated && r.url === '/assets/handhelds/catalog.json');
    assert(revalidation, 'Fresh cached catalog revalidated');
    assert.equal(revalidation.headers['if-none-match'], '"old-catalog"');
    assert(requests.some(r => r.updated && r.url.endsWith('?v=' + item.sha256.slice(0, 12))));
    console.log('Warm browser cache: old catalog revalidated and old game bypassed');
  } finally { await context.close(); await new Promise(resolve => server.close(resolve)); }
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    await warmCache(browser);
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      for (const url of [item.file, entry.url]) {
        const response = await context.request.get(new URL(url, base).href);
        assert(response.ok()); assert.equal(hash(await response.body()), item.sha256, 'Canonical and versioned URLs serve identical new build');
      }
      await context.addInitScript(() => {
        window.testPad = { connected: true, axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })) };
        Object.defineProperty(navigator, 'getGamepads', { value: () => [window.testPad] });
      });
      const page = await context.newPage(), errors = [], gameRequests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
      page.on('requestfailed', r => errors.push(r.failure().errorText + ' ' + r.url()));
      page.on('request', r => { if (r.frame().parentFrame() && !r.url().startsWith('data:')) gameRequests.push(r.url()); });
      await page.goto(base + route.slice(1) + '/?debug=1');
      await ready(page, route);
      const frame = await (await page.locator('#handheld-player iframe').elementHandle()).contentFrame();
      await titleReady(frame);
      assert.equal(await frame.evaluate(() => Levels.total), 10);
      assert.equal(await frame.evaluate(() => Cheats.LIST.length), 21);
      await page.keyboard.press('Enter');
      await frame.waitForFunction(() => LP.States.current === 'menu');
      for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight']) {
        await page.keyboard.press(key); await page.waitForTimeout(90);
      }
      await frame.waitForFunction(() => Cheats.unlocked);
      await page.keyboard.press('Enter');
      await frame.waitForFunction(() => LP.States.current === 'cheats');
      await page.keyboard.press('z'); await frame.waitForFunction(() => Cheats.on('invincible'));
      await page.keyboard.press('z'); await frame.waitForFunction(() => !Cheats.on('invincible'));

      const pad = async (button, axis = 0, duration = 120) => {
        await frame.evaluate(({ button, axis }) => { testPad.axes[0] = axis; if (button !== null) testPad.buttons[button] = { pressed: true, value: 1 }; }, { button, axis });
        await page.waitForTimeout(duration);
        await frame.evaluate(() => { testPad.axes[0] = 0; testPad.buttons.forEach(b => { b.pressed = false; b.value = 0; }); });
        await page.waitForTimeout(60);
      };
      const levels = [];
      // Exercise the shipped level shortcuts, without editing game code or progression.
      for (let level = 1; level <= 10; level++) {
        const levelUrl = new URL(entry.url, base).href + '&level=' + level;
        // Replace only this test's iframe document, without adding child history entries.
        await frame.evaluate(url => location.replace(url), levelUrl);
        await frame.waitForURL(levelUrl);
        await frame.waitForFunction(() => window.GAME && LP.States.current === 'playing' && GAME.Game.hero.onGround);
        assert.equal(await frame.evaluate(() => GAME.Game.level), level - 1);
        const x = await frame.evaluate(() => GAME.Game.hero.x);
        await pad(null, 1, 220);
        assert(await frame.evaluate(x => GAME.Game.hero.x > x, x), 'Gamepad stick moves hero');
        if (level === 1) {
          const y = await frame.evaluate(() => GAME.Game.hero.y);
          await pad(0); assert(await frame.evaluate(y => GAME.Game.hero.y < y, y), 'Gamepad jump');
          await pad(2, 0, 50); assert(await frame.evaluate(() => GAME.Game.hero.atkId > 0), 'Gamepad punch');
          await pad(9); await frame.waitForFunction(() => LP.States.current === 'paused');
          await pad(9); await frame.waitForFunction(() => LP.States.current === 'playing');
        }
        levels.push(await frame.evaluate(() => GAME.Game.lvl.name));
      }
      assert(gameRequests.every(url => new URL(url).pathname === '/' + item.file), 'Portable game requests no external dependencies');
      await page.locator('#handheld-back').click(); await ready(page, '/retro-handheld/games');
      assert(frame.isDetached());
      assert.deepEqual(errors, []);
      console.log(`${mobile ? 'mobile emulation' : 'desktop'}: byte hashes, 21-cheat menu, simulated gamepad, clean unload, all 10 worlds passed: ${levels.join('; ')}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
