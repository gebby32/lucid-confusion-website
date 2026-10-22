const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8772/';
const cabinets = ['about-us', 'retro-handheld', 'retro-arcade', 'demo-arcade', 'merch-shop', 'links', 'new-stuff', 'coming-soon', 'contact-us'];
const ready = (page, route, view) => page.waitForFunction(({ route, view }) =>
  document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition
  && location.pathname === route && arcadeDebug.state.view === view, { route, view });
const monitor = page => page.evaluate(() => {
  const d = arcadeDebug, r = document.querySelector('#arcade').getBoundingClientRect();
  const p = d.screens.get(d.state.active).focusPose().target.project(d.camera);
  return { x: r.x + (p.x + 1) * r.width / 2, y: r.y + (1 - p.y) * r.height / 2 };
});
const pause = (page, ms = 450) => page.waitForTimeout(ms);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const mobile = size.width !== 1440;
      const page = await browser.newPage({ viewport: size, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const tap = p => mobile ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y);
      const twice = async p => {
        if (mobile) { await tap(p); await pause(page, 100); await tap(p); }
        else await page.mouse.dblclick(p.x, p.y, { delay: 100 });
      };
      const startTrace = () => page.evaluate(() => { window.gestureRoutes.length = 0; window.gestureViews.length = 0; });
      await page.goto(base + '?debug=1'); await ready(page, '/', 'carousel');
      await page.evaluate(() => {
        window.gestureRoutes = []; window.gestureViews = [];
        const push = history.pushState.bind(history);
        history.pushState = (...args) => { gestureRoutes.push(args[2]); return push(...args); };
        function record() { gestureViews.push(arcadeDebug.state.view); requestAnimationFrame(record); }
        requestAnimationFrame(record);
      });
      const background = { x: size.width - 12, y: 110 };
      for (const [index, cabinet] of cabinets.entries()) {
        const intro = `/${cabinet}/`, content = intro + ([1, 2].includes(index) ? 'games/' : 'view/');
        // Use normal routing to avoid reloading the scene for every cabinet.
        await page.evaluate(async route => (await import('/router.js')).navigate(route), intro.slice(0, -1));
        await ready(page, intro, 'intro');
        const screen = await monitor(page), body = { x: size.width / 2, y: size.height * .86 };
        const length = await page.evaluate(() => history.length);
        assert.equal(await page.locator('#arcade').evaluate(e => getComputedStyle(e).touchAction), 'manipulation');
        const scale = await page.evaluate(() => visualViewport.scale);
        for (const [label, point] of [['monitor', screen], ['cabinet body', body], ['background', background]]) {
          await startTrace(); await twice(point); await ready(page, '/', 'carousel'); await pause(page);
          assert.deepEqual(await page.evaluate(() => gestureRoutes), [], 'Double interaction reuses history Back with no intermediate push');
          assert(!(await page.evaluate(() => gestureViews)).includes('crt'), 'Double never enters the second zoom stage');
          assert.equal(await page.evaluate(() => history.length), length);
          assert.equal(await page.evaluate(() => visualViewport.scale), scale, 'Mobile double-tap does not magnify browser viewport');
          await page.goForward(); await ready(page, intro, 'intro');
          assert.equal(await page.locator('iframe').count(), 0);
          console.log(`${size.width} ${cabinet}: double ${label} returned directly; Forward restored partial zoom`);
        }
        await startTrace(); await tap(background); await pause(page); await ready(page, intro, 'intro');
        assert.deepEqual(await page.evaluate(() => gestureRoutes), [], 'Single background interaction remains a no-op');
        await tap(screen);
        assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'intro', 'Single monitor waits for the double window');
        await ready(page, content, 'crt');
        assert.equal((await page.evaluate(() => gestureRoutes)).length, 1, 'Single advances exactly once');
        // The added stage handler must not turn full CRT background doubles into
        // carousel navigation (existing CRT frame/content handlers stay intact).
        await twice(background); await pause(page); await ready(page, content, 'crt');
        await page.locator(cabinet === 'links' ? '#links-return' : '#screen-return').click();
        await ready(page, intro, 'intro');
        await page.locator('#screen-return').click(); await ready(page, '/', 'carousel');
      }

      const intro = '/retro-arcade/', content = intro + 'games/';
      const open = async () => { await page.evaluate(async () => (await import('/router.js')).navigate('/retro-arcade')); await ready(page, intro, 'intro'); };
      await open();
      const p = await monitor(page);
      // Slow independent singles, keyboard activation, and explicit Back retain
      // their normal meaning. Pending clicks cannot navigate after leaving.
      await tap(p); await page.keyboard.press('Enter'); await ready(page, content, 'crt'); await pause(page);
      await page.goBack(); await ready(page, intro, 'intro');
      await tap(p); await page.locator('#screen-return').click(); await ready(page, '/', 'carousel'); await pause(page);
      await page.goForward(); await ready(page, intro, 'intro');
      await tap(p); await page.goBack(); await ready(page, '/', 'carousel'); await pause(page);
      await page.goForward(); await ready(page, intro, 'intro');
      await tap(p); await page.keyboard.press('Escape'); await ready(page, '/', 'carousel'); await pause(page);
      await page.goForward(); await ready(page, intro, 'intro');
      await tap(p); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await pause(page); await ready(page, intro, 'intro');
      // Second press begins within 400ms but releases outside the first window.
      if (!mobile) {
        await tap(p); await pause(page, 300); await page.mouse.move(p.x, p.y); await page.mouse.down(); await pause(page, 180); await page.mouse.up();
        await ready(page, '/', 'carousel'); await page.goForward(); await ready(page, intro, 'intro');
        await tap(p); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 100, p.y + 10, { steps: 6 }); await page.mouse.up();
        await pause(page); await ready(page, intro, 'intro');
      }
      // Pointer cancellation must never trigger a delayed single.
      await page.locator('#arcade').evaluate(el => el.addEventListener('pointerdown', event => { window.cancelPointerId = event.pointerId; }, { once: true }));
      await page.mouse.move(p.x, p.y); await page.mouse.down();
      await page.locator('#arcade').dispatchEvent('pointercancel', { pointerId: await page.evaluate(() => cancelPointerId), isPrimary: true, pointerType: 'mouse' });
      await page.mouse.up();
      await pause(page); await ready(page, intro, 'intro');
      await page.locator('#screen-return').click(); await ready(page, '/', 'carousel');

      // Real animated transitions: a double tap never queues a second zoom,
      // while a single still performs the normal optical zoom and history flow.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await open(); await startTrace(); await twice(await monitor(page)); await ready(page, '/', 'carousel');
      assert(!(await page.evaluate(() => gestureViews)).includes('crt'));
      await page.goForward(); await ready(page, intro, 'intro'); await tap(await monitor(page)); await ready(page, content, 'crt');
      await page.goBack(); await ready(page, intro, 'intro');
      await page.goBack(); await ready(page, '/', 'carousel');
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // Active games own their gestures; the iframe, URL and fullscreen mode
      // survive a double interaction inside the game.
      for (const [kind, gameRoute] of [['retro', 'retro-arcade/games/sloth-invaders/'], ['handheld', 'retro-handheld/games/bungee-pug/'], ['demo', 'demo-arcade/view/lucid-logic/']]) {
        await page.goto(base + gameRoute + '?debug=1');
        await ready(page, '/' + gameRoute, 'crt');
        const selector = kind === 'demo' ? '#demo-arcade-panel iframe' : `#${kind}-player iframe`;
        const iframe = page.locator(selector), frame = await (await iframe.elementHandle()).contentFrame();
        await frame.waitForLoadState('load');
        await frame.evaluate(() => { window.gestureToken = performance.timeOrigin; });
        const url = page.url();
        const box = await iframe.boundingBox(); await twice({ x: box.x + box.width / 2, y: box.y + box.height / 2 }); await pause(page);
        assert.equal(page.url(), url); assert(!frame.isDetached());
        assert(await frame.evaluate(() => gestureToken === performance.timeOrigin));
        if (kind !== 'demo') {
          await page.locator(`#${kind}-fullscreen`).click();
          assert.equal(await page.locator(`#${kind}-fullscreen`).getAttribute('aria-pressed'), 'true');
          await frame.evaluate(() => window.focus()); await page.keyboard.press('Escape');
          assert.equal(await page.locator(`#${kind}-fullscreen`).getAttribute('aria-pressed'), 'false');
          assert.equal(page.url(), url); assert(!frame.isDetached());
        }
      }
      assert.deepEqual(errors, []);
      console.log(`${size.width}: all nine cabinets, single/double separation, history, cancellation, animated zoom, CRT/game isolation, and fullscreen regression passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
