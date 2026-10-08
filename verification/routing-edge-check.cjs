const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const ready = (page, path) => page.waitForFunction(path => location.pathname === path && document.documentElement.dataset.routing === 'ready' && window.arcadeDebug && !arcadeDebug.state.zoomTransition, path);
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/?debug=1'); await ready(page, '/');
    const initialLength = await page.evaluate(() => history.length);
    await page.locator('#arcade').focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => arcadeDebug.state.zoomTransition);
    await page.goBack(); await page.goForward(); await page.goBack(); await ready(page, '/');
    assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'carousel');
    assert.equal(await page.evaluate(() => history.length), initialLength + 1);
    await page.goForward(); await ready(page, '/retro-arcade');
    await page.locator('#arcade').focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => arcadeDebug.state.zoomTransition);
    await page.goBack(); await ready(page, '/retro-arcade');
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'cabinet');
    // Leaving focus using rotation should consume one history entry, even when
    // many pointermove events arrive before the popstate event is dispatched.
    await page.mouse.move(400, 450); await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(400 + i * 20, 450);
    await page.mouse.up(); await ready(page, '/');
    assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'carousel');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Check every existing cabinet content state by fresh URL, including stubs.
    for (const cabinet of ['about-us', 'demo-arcade', 'merch-shop', 'new-stuff', 'coming-soon', 'contact-us', 'links']) {
      const path = '/' + cabinet + '/view';
      const response = await page.goto(base + path + '/?debug=1'); assert.equal(response.status(), 200);
      await ready(page, path);
      assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'crt');
      assert((await page.title()).includes('Lucid Confusion Creations'));
      await page.goBack(); await ready(page, '/' + cabinet);
      await page.goBack(); await ready(page, '/');
    }
    // A delayed catalog must not reopen a game after Back exits its route.
    await page.route('**/assets/handhelds/catalog.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 800)); await route.continue();
    });
    await page.goto(base + '/retro-handheld/games/sloth-kart-racing?debug=1');
    await page.waitForFunction(() => window.arcadeDebug && location.pathname.includes('sloth-kart-racing'));
    await page.goBack(); await page.goBack(); await ready(page, '/retro-handheld');
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'cabinet');
    assert.deepEqual(errors, []);
    console.log('Animated rapid Back/Forward, no duplicate entries, drag return, all cabinet deep links, trailing-slash normalization, delayed catalog cancellation passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
