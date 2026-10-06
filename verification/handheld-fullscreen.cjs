const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const nativeEscape = process.env.HANDHELD_NATIVE_ESCAPE === '1';
  const browser = await chromium.launch({ headless: !nativeEscape, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8771/?debug=1');
    await page.waitForFunction(() => window.arcadeDebug);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#arcade').focus();
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition);
    await page.keyboard.press('Enter');
    await page.waitForSelector('#handheld-grid a');
    await page.locator('#handheld-grid a').first().click();
    const iframe = page.locator('#handheld-player iframe');
    await iframe.waitFor();
    const game = await (await iframe.elementHandle()).contentFrame();
    await game.waitForLoadState('load');
    await game.waitForFunction(() => window.LP?.Input);
    assert.equal(await page.evaluate(() => document.fullscreenElement), null);
    await page.keyboard.down('ArrowRight');
    assert(await game.evaluate(() => LP.Input.downKeys.has('ArrowRight')));
    await page.keyboard.up('ArrowRight');
    assert(!(await game.evaluate(() => LP.Input.downKeys.has('ArrowRight'))));
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.fullscreenElement?.id === 'handheld-player');
    console.log('F entered real Fullscreen API on the game container.');
    await page.keyboard.press('f');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert(await iframe.isVisible());
    console.log('F exited fullscreen and retained the selected game.');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.fullscreenElement?.id === 'handheld-player');
    // CDP's synthesized Escape does not exercise Chromium's browser chrome.
    // In native mode send a real OS Escape to the visible test window here.
    if (nativeEscape) console.log('Ready for native Escape in the test browser.');
    else await page.evaluate(() => document.exitFullscreen());
    await page.waitForFunction(() => !document.fullscreenElement, null, { timeout: nativeEscape ? 60000 : 5000 });
    assert(await iframe.isVisible());
    console.log(`${nativeEscape ? 'Native Escape' : 'Fullscreen API exit'} retained the selected game.`);
    for (const viewport of [{ width: 320, height: 700 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(150);
      const bounds = await page.locator('#handheld-player').boundingBox();
      assert.equal(bounds.width, viewport.width); assert.equal(bounds.height, viewport.height);
      assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
      const size = await game.locator('#lp-shell').evaluate(image => ({ width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height, ratio: image.naturalWidth / image.naturalHeight }));
      assert(Math.abs(size.width / size.height - size.ratio) < .01);
    }
    await page.locator('#handheld-back').click();
    assert.equal(await page.locator('iframe').count(), 0);
    assert(await page.locator('#handheld-grid').isVisible());
    assert(await page.locator('#handheld-frame').isVisible());
    assert.deepEqual(errors, []);
    console.log('Browser-fill resize, proportional artwork, unchanged arrow controls, unload and grid restoration passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
