const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalog = JSON.parse(fs.readFileSync('assets/handhelds/catalog.json'));
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:61863/';
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage(), errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (/\/handhelds\/[^/]+\/index.html/.test(r.url())) requests.push(r.url()); });
      await page.goto(url + '?debug=1');
      await page.waitForFunction(() => window.arcadeDebug);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('#arcade').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
      await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition);
      await page.keyboard.press('Enter'); await page.waitForSelector('#handheld-grid a');
      assert.equal(requests.length, 0);
      async function open(index = 0) {
        const prior = requests.length;
        if (mobile) await page.locator('#handheld-grid a').nth(index).tap(); else await page.locator('#handheld-grid a').nth(index).click();
        const iframe = page.locator('#handheld-player iframe'); await iframe.waitFor();
        const game = await (await iframe.elementHandle()).contentFrame();
        await game.waitForLoadState('load');
        assert.equal(requests.length, prior + 1);
        assert.equal(await game.title(), catalog[index].title);
        return game;
      }
      async function returned() {
        await page.waitForFunction(() => !document.querySelector('#handheld-player iframe'));
        assert.equal(await page.evaluate(() => document.fullscreenElement), null);
        assert(await page.locator('#handheld-grid').isVisible());
        assert(await page.locator('#handheld-frame').isVisible());
      }
      let game = await open();
      async function doubleClickStays() {
        await game.evaluate(() => { window.__doubleClicks = []; window.__doubleClickArrivals = []; window.addEventListener('dblclick', e => window.__doubleClickArrivals.push(e.defaultPrevented), true); window.addEventListener('dblclick', e => window.__doubleClicks.push(e.defaultPrevented)); });
        await game.locator('body').dblclick({ position: { x: 15, y: 15 } });
        assert.equal(await page.locator('iframe').count(), 1);
        assert.deepEqual(await game.evaluate(() => window.__doubleClickArrivals), [false]);
        // The original game may prevent browser selection/zoom itself. It must
        // still receive the event, without any website interception or exit.
        assert.equal((await game.evaluate(() => window.__doubleClicks)).length, 1);
      }
      await doubleClickStays();
      const style = await page.locator('#handheld-back').evaluate(e => ({ font: getComputedStyle(e).fontSize, width: e.offsetWidth, height: e.offsetHeight }));
      assert.equal(style.font, '24px'); assert(style.width < 290 && style.height >= 44 && style.height < 60);
      const toolbar = await page.locator('.handheld-toolbar').boundingBox(), iframe = await page.locator('iframe').boundingBox();
      assert(toolbar.y + toolbar.height <= iframe.y + 1);
      // HTML inputs and editable regions inside the iframe retain Backspace.
      for (const tag of ['input', 'textarea', 'div']) {
        await game.evaluate(tag => { const e = document.createElement(tag); e.id = 'control-test'; if (tag === 'div') { e.contentEditable = 'true'; e.textContent = 'ABC'; } else e.value = 'ABC'; document.body.append(e); e.focus(); }, tag);
        await page.keyboard.press('Backspace'); assert(await page.locator('iframe').count());
        await game.evaluate(() => document.querySelector('#control-test').remove());
      }
      await game.evaluate(() => { window.__escapeReceived = 0; window.addEventListener('keydown', e => { if (e.key === 'Escape') window.__escapeReceived++; }); window.focus(); });
      await page.keyboard.press('Escape'); assert.equal(await game.evaluate(() => window.__escapeReceived), 1);
      assert.equal(await page.locator('iframe').count(), 1);
      await page.keyboard.press('f'); await page.waitForFunction(() => document.fullscreenElement?.id === 'handheld-player');
      await page.keyboard.press('f'); await page.waitForFunction(() => !document.fullscreenElement);
      if (mobile) await page.locator('#handheld-back').tap(); else await page.locator('#handheld-back').click(); await returned();
      for (const method of ['button', 'Backspace']) {
        game = await open();
        await page.keyboard.press('f'); await page.waitForFunction(() => document.fullscreenElement?.id === 'handheld-player');
        await doubleClickStays();
        if (method === 'button') await page.locator('#handheld-back').click();
        else await page.keyboard.press('Backspace');
        await returned(); console.log(`${mobile ? 'touch' : 'desktop'}: ${method} exits fullscreen, unloads, restores grid`);
      }
      if (!mobile) {
        for (let i = 0; i < catalog.length; i++) {
          game = await open(i);
          const protectedEntry = await game.evaluate(() => {
            const candidates = [window.LP?.States, window.FRUCTOSE?.S, ...['CP','GK','GC','LT','MC','SM','SW','TT','CK','MH'].flatMap(n => [window[n]?.App, window[n]?.app, window[n]?.Game, window[n]?.G])];
            const target = candidates.find(s => s && (typeof s.state === 'string' || typeof s.current === 'string')) || (window.SM?.Input);
            if (!target) return false;
            const key = target === window.SM?.Input ? 'textMode' : typeof target.current === 'string' ? 'current' : 'state';
            const previous = target[key]; target[key] = key === 'textMode' ? true : 'entry';
            // Stop after the host capture guard, before game logic touches a
            // synthetic entry state. This only tests the host's read-only guard.
            const shield = e => e.stopImmediatePropagation();
            document.addEventListener('keydown', shield, { once: true, capture: true });
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true }));
            target[key] = previous;
            return true;
          });
          assert.equal(await page.locator('iframe').count(), 1);
          await game.evaluate(() => window.focus());
          await page.keyboard.press('Backspace');
          if (['sewer-halo', 'the-nudibranch'].includes(catalog[i].id)) {
            assert.equal(await page.locator('iframe').count(), 1);
            await page.locator('#handheld-back').click();
          }
          await returned(); console.log(`${catalog[i].title}: entry guard ${protectedEntry ? 'checked' : 'private state; keyboard reserved'}, return checked`);
        }
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
