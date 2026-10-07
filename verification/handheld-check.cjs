// Usage: NODE_PATH=<directory containing playwright> node verification/handheld-check.cjs [output-directory]
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.argv[2];
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/handhelds/catalog.json')));
const snapshot = async (page, name) => { if (output) await page.screenshot({ path: path.join(output, `${name}.png`) }); };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const mobile of [false, true]) {
      const label = mobile ? 'mobile' : 'desktop';
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage(), errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => { if (!request.url().startsWith('data:')) requests.push(request.url()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      page.on('requestfailed', request => errors.push(`${request.failure().errorText} ${request.url()}`));
      await page.goto((process.env.PREVIEW_URL || 'http://127.0.0.1:8771/')+'?debug=1');
      await page.waitForFunction(() => window.arcadeDebug);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(requests.filter(url => url.includes('/assets/handhelds/')).length, 0);
      assert.equal(requests.filter(url => url.includes('Retro%20Handheld%20Arcade.png')).length, 0);
      await page.locator('#arcade').focus();
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition && arcadeDebug.screens.get(1).mode === 'texture');
      assert.equal(await page.locator('#handheld-grid a').count(), 0);
      assert.equal(await page.locator('iframe').count(), 0);
      assert.equal(requests.filter(url => url.includes('/assets/handhelds/')).length, 0);
      assert.equal(await page.locator('#announcement').textContent(), 'RETRO GAMES. CLICK TO VIEW.');
      await snapshot(page, `handheld-teaser-${label}`);
      const point = await page.evaluate(() => {
        const v = arcadeDebug.screens.get(1).focusPose().target.project(arcadeDebug.camera), r = document.querySelector('#arcade').getBoundingClientRect();
        return { x: r.x + (v.x + 1) * r.width / 2, y: r.y + (1 - v.y) * r.height / 2 };
      });
      if (mobile) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
      await page.waitForFunction(count => arcadeDebug.state.view === 'crt' && !arcadeDebug.state.zoomTransition && document.querySelectorAll('#handheld-grid a').length === count, catalog.length);
      assert.deepEqual(await page.locator('#handheld-grid a span').allTextContents(), catalog.map(game => game.title));
      assert.equal(await page.locator('iframe').count(), 0);
      assert(!requests.some(url => /\/assets\/handhelds\/[^/]+\/index.html/.test(url)));
      const frame = await page.locator('#handheld-frame').boundingBox(), panel = await page.locator('#handheld-panel').boundingBox();
      assert(Math.abs(frame.width / frame.height - 4 / 3) < .001);
      assert(panel.x >= frame.x + frame.width * .05 && panel.y >= frame.y + frame.height * .13);
      assert(panel.x + panel.width <= frame.x + frame.width * .95 && panel.y + panel.height <= frame.y + frame.height * .87);
      assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
      assert(await page.locator('#handheld-grid').evaluate(element => element.scrollWidth === element.clientWidth));
      await snapshot(page, `handheld-grid-${label}`);
      for (let i = 0; i < catalog.length; i++) {
        const game = catalog[i], link = page.locator('#handheld-grid a').nth(i);
        await link.scrollIntoViewIfNeeded();
        await link.locator('img').evaluate(image => image.decode());
        const before = requests.length;
        if (mobile) await link.tap(); else await link.click();
        const iframe = page.locator('#handheld-player iframe');
        await iframe.waitFor({ state: 'visible' });
        const gameFrame = await (await iframe.elementHandle()).contentFrame();
        await gameFrame.waitForLoadState('load');
        await gameFrame.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0) && document.querySelector('canvas'));
        if (game.id === 'the-circus') await gameFrame.waitForFunction(() => window.THREE && document.querySelector('#lp-3d'), { timeout: 30000 });
        assert.equal(await gameFrame.title(), fs.readFileSync(game.url.slice(2),'utf8').match(/<title>(.*?)<\/title>/s)[1]);
        assert(!(await page.locator('#handheld-frame').isVisible()));
        assert(!(await page.locator('#arcade').isVisible()));
        const playerBounds = await page.locator('#handheld-player').boundingBox();
        const viewport = page.viewportSize();
        assert.equal(playerBounds.x, 0); assert.equal(playerBounds.y, 0);
        assert.equal(playerBounds.width, viewport.width); assert.equal(playerBounds.height, viewport.height);
        assert.equal(await page.evaluate(() => document.fullscreenElement), null);
        const gameRequests = requests.slice(before).filter(url => /\/assets\/handhelds\/[^/]+\/index.html/.test(url));
        assert.deepEqual(gameRequests, [new URL(game.url, page.url()).href]);
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => arcadeDebug.state.active), 1);
        assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'crt');
        await snapshot(page, `handheld-${game.id}-${label}`);
        assert.equal(await page.locator('#handheld-back').getAttribute('aria-label'), 'Back to Cabinet');
        await page.locator('#handheld-back').click();
        assert.equal(await page.locator('iframe').count(), 0);
        assert(await page.locator('#handheld-grid').isVisible());
        assert.equal(await page.locator('#screen-return').textContent(), 'Back to Cabinet');
        console.log(`${label}: ${game.title} launched on demand and returned`);
      }
      await page.locator('#screen-return').click();
      await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition);
      assert.equal(await page.locator('#handheld-grid a').count(), 0);
      await page.locator('#screen-return').click();
      await page.waitForFunction(() => arcadeDebug.state.view === 'carousel');
      assert.deepEqual(errors, []);
      console.log(`${label}: lazy loading, all games, contained layout, and Back navigation passed without browser errors`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
