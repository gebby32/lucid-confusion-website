const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const output = process.env.VERIFICATION_OUTPUT;
const ready = (page, path) => page.waitForFunction(path => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && (location.pathname.replace(/\/$/, '') || '/') === path, path);
const stopped = page => page.waitForFunction(() => [...document.querySelectorAll('#new-stuff-panel video')].every(v => v.paused && v.currentTime === 0));

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
  try {
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const mobile = size.width !== 1440;
      const context = await browser.newContext({ viewport: size, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => requests.push(r.url()));
      await page.goto(base + '/?debug=1'); await ready(page, '/');
      await page.locator('#arcade').focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter'); await ready(page, '/new-stuff');
      assert(!requests.some(url => url.includes('/assets/videos/')), 'Videos stay unloaded in the carousel and preview');
      await page.keyboard.press('Enter'); await ready(page, '/new-stuff/view');
      const panel = page.locator('#new-stuff-panel'), videos = panel.locator('video');
      await page.waitForFunction(() => [...document.querySelectorAll('#new-stuff-panel video')].every(v => v.readyState >= 1));
      assert.deepEqual(await panel.locator('h2').allTextContents(), ['Sloths vs Penguins', 'OmniStash']);
      const metadata = await videos.evaluateAll(vs => vs.map(v => ({ controls: v.controls, preload: v.preload, autoplay: v.autoplay, paused: v.paused, ratio: v.videoWidth / v.videoHeight, error: v.error, fit: getComputedStyle(v).objectFit })));
      for (const video of metadata) {
        assert(video.controls && !video.autoplay && video.paused); assert.equal(video.preload, 'metadata');
        assert.equal(video.error, null); assert.equal(video.fit, 'contain'); assert.equal(video.ratio, 4 / 3);
      }
      assert.equal(await panel.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(0, 0, 0)');
      assert((await panel.locator('h2').evaluateAll(es => es.map(e => getComputedStyle(e).color))).every(c => c === 'rgb(57, 255, 106)'));
      const layout = await panel.evaluate(e => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return { scrollable: e.scrollHeight > e.clientHeight, client: e.clientWidth, padding: parseFloat(s.paddingLeft) + parseFloat(s.paddingRight), x: r.x, width: r.width, videos: [...e.querySelectorAll('video')].map(v => { const b = v.getBoundingClientRect(); return { width: b.width, height: b.height }; }) };
      });
      assert(layout.scrollable);
      for (const v of layout.videos) { assert(Math.abs(v.width / v.height - 4 / 3) < .01); assert(Math.abs(v.width - (layout.client - layout.padding)) < 1); }
      const border = page.locator('#crt-content'), borderBefore = await border.boundingBox();
      const backBefore = await page.locator('#screen-return').boundingBox();
      const background = await border.evaluate(e => getComputedStyle(e).backgroundImage);
      assert(background.includes('2%20New%20Stuff.png'));
      if (output) await page.screenshot({ path: `${output}/new-stuff-first-${size.width}.png` });
      await videos.nth(1).scrollIntoViewIfNeeded();
      assert((await panel.evaluate(e => e.scrollTop)) > 0);
      assert.deepEqual(await border.boundingBox(), borderBefore);
      assert.deepEqual(await page.locator('#screen-return').boundingBox(), backBefore);
      assert.equal(await page.evaluate(() => scrollY), 0);
      assert.equal(await border.evaluate(e => getComputedStyle(e).backgroundImage), background);
      if (output) await page.screenshot({ path: `${output}/new-stuff-second-${size.width}.png` });

      // Real media playback advances, switches exclusively, and retains native seeking.
      await videos.first().evaluate(async v => { v.muted = true; await v.play(); });
      await page.waitForFunction(() => document.querySelector('#new-stuff-panel video').currentTime > .2);
      await videos.nth(1).evaluate(async v => { v.muted = true; await v.play(); });
      await page.waitForFunction(() => { const [a, b] = document.querySelectorAll('#new-stuff-panel video'); return a.paused && !b.paused && b.currentTime > .2; });
      await videos.nth(1).evaluate(v => { v.currentTime = 5; });
      await page.waitForFunction(() => document.querySelectorAll('#new-stuff-panel video')[1].currentTime >= 5);
      await videos.first().evaluate(v => v.play());
      await page.waitForFunction(() => { const [a, b] = document.querySelectorAll('#new-stuff-panel video'); return !a.paused && b.paused; });

      // Pointer gestures inside the player panel must never trigger the frame's return gesture.
      await panel.locator('h2').first().dblclick();
      assert.equal(new URL(page.url()).pathname, '/new-stuff/view/');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (mobile) await page.locator('#screen-return').tap(); else await page.locator('#screen-return').click();
      await stopped(page); await ready(page, '/new-stuff');
      assert(!(await panel.isVisible()));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goForward(); await ready(page, '/new-stuff/view'); await stopped(page);
      assert.equal(await panel.evaluate(e => e.scrollTop), 0);
      await videos.first().evaluate(v => v.play());
      await page.goBack(); await stopped(page); await ready(page, '/new-stuff');
      await page.goForward(); await ready(page, '/new-stuff/view'); await stopped(page);
      await videos.first().evaluate(async v => { await v.play(); await v.requestFullscreen(); });
      await page.waitForFunction(() => document.fullscreenElement?.tagName === 'VIDEO');
      await page.goBack(); await stopped(page); await ready(page, '/new-stuff');
      assert.equal(await page.evaluate(() => document.fullscreenElement), null);
      await page.goForward(); await ready(page, '/new-stuff/view'); await stopped(page);
      await videos.first().evaluate(v => v.play()); await page.keyboard.press('Escape');
      await stopped(page); await ready(page, '/new-stuff');
      await page.locator('#screen-return').click(); await ready(page, '/');
      await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter'); await ready(page, '/coming-soon');
      await page.keyboard.press('Enter'); await ready(page, '/coming-soon/view');
      assert(!(await panel.isVisible())); assert(await page.locator('#coming-soon-panel').isVisible()); await stopped(page);
      await page.goto(base + '/new-stuff/view/?debug=1'); await ready(page, '/new-stuff/view'); await stopped(page);
      assert(await page.locator('#new-stuff-panel').isVisible());
      await page.locator('#new-stuff-panel video').first().evaluate(async v => { v.muted = true; await v.play(); });
      await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
      await page.waitForURL('**/privacy/');
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/new-stuff/view'); await stopped(page);
      assert(await page.locator('#new-stuff-panel').isVisible(), 'Returning from another document restores the video panel without playback');
      assert.deepEqual(errors, []); await context.close();
      console.log(`${size.width}: metadata, 4:3 video layout, fixed border, scrolling, playback exclusivity, seeking, fullscreen cleanup, stopped navigation, deep link and neighboring cabinet passed`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
