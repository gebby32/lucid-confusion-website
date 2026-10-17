const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./lucid-logic-build.json');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const output = process.env.VERIFICATION_OUTPUT;
const ready = (page, route) => page.waitForFunction(route => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && (location.pathname.replace(/\/$/, '') || '/') === route, route);
const root = path.join(__dirname, '../games/lucid-logic');
const files = fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter(e => e.isFile());
assert.equal(files.length, manifest.length);
for (const file of manifest) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file.path))).digest('hex'), file.sha256, file.path + ' matches the verified build');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
  try {
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const mobile = size.width !== 1440;
      const context = await browser.newContext({ viewport: size, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], requests = [], failures = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => requests.push(r.url()));
      page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
      const activate = locator => mobile ? locator.tap() : locator.click();
      const game = () => page.frameLocator('#demo-arcade-panel iframe');
      const start = async () => {
        await activate(game().getByRole('button', { name: /^Start Lucid Logic/ }));
        await game().getByRole('button', { name: 'Level 1. Enter a level number', exact: true }).waitFor();
      };
      const board = () => game().locator('.light').evaluateAll(es => es.map(e => e.getAttribute('aria-pressed') === 'true'));
      const checkFit = async () => {
        const fit = await game().locator('body').evaluate(body => {
          const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
          return { width: innerWidth, height: innerHeight, scrollX: body.scrollWidth > innerWidth, scrollY: body.scrollHeight > innerHeight, board: rect(document.querySelector('.board')), stage: rect(document.querySelector('.stage')), buttons: [...document.querySelectorAll('.console-face button')].map(e => { const r = rect(e); return { ...r, hit: e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; }) };
        });
        assert(!fit.scrollX && !fit.scrollY, 'Game viewport does not scroll or crop its controls');
        assert(Math.abs(fit.board.width - fit.board.height) < 1, 'Light grid remains square');
        assert(Math.abs(fit.stage.width / fit.stage.height - 1.5) < .01, 'Game retains its native console aspect ratio');
        for (const r of fit.buttons) {
          assert(r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.x + r.width <= fit.width + 1 && r.y + r.height <= fit.height + 1, 'Every control fits inside the iframe');
          assert(r.hit, 'Every control receives pointer input without overlap');
        }
        const crt = await page.locator('#crt-content').boundingBox(), iframe = await page.locator('#demo-arcade-panel iframe').boundingBox();
        assert(Math.abs(crt.width / crt.height - 4 / 3) < .01, 'Existing 4:3 CRT remains unchanged');
        assert(iframe.x > crt.x && iframe.y > crt.y && iframe.x + iframe.width < crt.x + crt.width && iframe.y + iframe.height < crt.y + crt.height, 'Game stays inside the border aperture');
      };

      await page.goto(base + '/?debug=1'); await ready(page, '/');
      await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await ready(page, '/demo-arcade');
      assert(!requests.some(url => url.includes('/games/lucid-logic/')), 'No game assets load in the carousel or preview');
      const introHistory = await page.evaluate(() => history.length);
      if (!mobile) await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.keyboard.press('Enter'); await ready(page, '/demo-arcade/view');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('iframe').count(), 1, 'Only one playable game is mounted');
      assert.equal(await page.evaluate(() => history.length), introHistory + 1, 'Iframe does not add a browser history step');
      assert(!(await page.locator('#crt-placeholder').isVisible()));
      assert((await page.locator('#crt-content').evaluate(e => getComputedStyle(e).backgroundImage)).includes('4%20Demo%20Arcade.png'));
      assert.equal(await page.locator('#arcade canvas').evaluate(e => getComputedStyle(e).visibility), 'hidden');
      await game().locator('.welcome-start img').evaluate(img => img.decode());
      if (output) await page.screenshot({ path: `${output}/demo-welcome-${size.width}.png` });
      await start(); await checkFit();
      const original = await board();
      await activate(game().locator('.light').nth(0));
      const flipped = original.map((on, i) => [0, 1, 5].includes(i) ? !on : on);
      assert.deepEqual(await board(), flipped, 'Pressing a corner flips only it and its two neighbors');
      await activate(game().getByRole('button', { name: 'Restart this level' }));
      assert.deepEqual(await board(), original);
      await activate(game().getByRole('button', { name: 'Mute sound' }));
      await game().getByRole('button', { name: 'Enable sound' }).waitFor();
      await activate(game().getByRole('button', { name: 'Enable sound' }));
      await activate(game().getByRole('button', { name: 'Toggle power' }));
      assert(await game().locator('.light').first().isDisabled());
      await activate(game().getByRole('button', { name: 'Toggle power' }));
      await activate(game().getByRole('button', { name: 'How to play' }));
      await game().getByRole('dialog').waitFor();
      assert((await game().getByRole('dialog').innerText()).includes('Switch off all 25 lights'));
      await page.keyboard.press('Escape');
      await game().getByRole('dialog').waitFor({ state: 'hidden' });
      assert.equal(new URL(page.url()).pathname, '/demo-arcade/view/', 'Game dialog keys do not exit the cabinet');
      await activate(game().locator('.light').nth(12));
      await game().getByRole('button', { name: 'Level 2. Enter a level number', exact: true }).waitFor();
      await activate(game().getByRole('button', { name: 'Previous level' }));
      assert.equal(await game().locator('[aria-label="Record 1 moves"]').count(), 1, 'Solving level one records the score and advances');
      await activate(game().getByRole('button', { name: 'Next level' }));
      await activate(game().getByRole('button', { name: 'Start new game at level 1' }));
      await activate(game().getByRole('button', { name: 'Level 1. Enter a level number', exact: true }));
      await game().getByRole('dialog').locator('input').fill('7');
      await activate(game().getByRole('button', { name: /Go to level/ }));
      await game().getByRole('button', { name: 'Level 7. Enter a level number', exact: true }).waitFor();
      await game().locator('.light').first().focus(); await page.keyboard.press('ArrowRight');
      assert(await game().locator('.light').nth(1).evaluate(e => e === document.activeElement));
      await page.keyboard.press('Space');
      assert.equal(await game().locator('[aria-label="Moves 1"]').count(), 1, 'Keyboard controls work inside the iframe');
      if (output) await page.screenshot({ path: `${output}/demo-game-${size.width}.png` });
      if (size.width === 390) {
        const beforeResize = await board();
        await page.setViewportSize({ width: 844, height: 390 }); await checkFit();
        assert.deepEqual(await board(), beforeResize, 'Orientation change keeps the current game');
        await page.setViewportSize(size);
      }

      const oldFrame = await page.locator('#demo-arcade-panel iframe').elementHandle().then(e => e.contentFrame());
      if (!mobile) await page.emulateMedia({ reducedMotion: 'no-preference' });
      await activate(page.locator('#screen-return'));
      await page.waitForFunction(() => !document.querySelector('#demo-arcade-panel iframe'));
      assert(oldFrame.isDetached(), 'Exiting destroys the browsing context and its audio/timers');
      await ready(page, '/demo-arcade'); await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.evaluate(() => history.length), introHistory + 1);
      await page.goForward({ waitUntil: 'commit' }); await ready(page, '/demo-arcade/view'); await start();
      assert.equal(await game().locator('[aria-label="Record 1 moves"]').count(), 1, 'Saved records survive a clean iframe reload');
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/demo-arcade'); assert.equal(await page.locator('iframe').count(), 0);
      await page.goForward({ waitUntil: 'commit' }); await ready(page, '/demo-arcade/view');
      await page.locator('#screen-return').focus(); await page.keyboard.press('Escape'); await ready(page, '/demo-arcade');
      await activate(page.locator('#screen-return')); await ready(page, '/');
      await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await ready(page, '/merch-shop');
      await page.keyboard.press('Enter'); await ready(page, '/merch-shop/view');
      assert(await page.locator('#crt-placeholder').isVisible()); assert.equal(await page.locator('iframe').count(), 0);
      await page.goto(base + '/demo-arcade/view/?debug=1'); await ready(page, '/demo-arcade/view'); await start();
      await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click(); await page.waitForURL('**/privacy/');
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/demo-arcade/view');
      // Playwright can lose its child-frame handle after BFCache restoration.
      // Inspect the same-origin DOM and use real pointer input on the new iframe.
      await page.waitForFunction(() => document.querySelector('#demo-arcade-panel iframe')?.contentDocument.querySelector('.welcome-start'));
      const restored = await page.locator('#demo-arcade-panel iframe').boundingBox();
      if (mobile) await page.touchscreen.tap(restored.x + restored.width / 2, restored.y + restored.height / 2);
      else await page.mouse.click(restored.x + restored.width / 2, restored.y + restored.height / 2);
      await page.waitForFunction(() => document.querySelector('#demo-arcade-panel iframe')?.contentDocument.querySelectorAll('.light').length === 25);
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/demo-arcade'); assert.equal(await page.locator('iframe').count(), 0);
      assert.deepEqual(errors, []); assert.deepEqual(failures, []);
      await context.close();
      console.log(`${size.width}: game start, puzzle solution, controls, aspect/fit, keyboard/touch, clean unload, history, deep link, document return and neighboring cabinet passed`);
    }
  } finally { await browser.close(); }
  console.log(`${manifest.length} game files match the supplied build byte for byte.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
