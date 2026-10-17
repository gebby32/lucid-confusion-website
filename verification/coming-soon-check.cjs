const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const output = process.env.VERIFICATION_OUTPUT;
const ready = (page, path) => page.waitForFunction(path => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && (location.pathname.replace(/\/$/, '') || '/') === path, path);
const stopped = page => page.waitForFunction(() => { const v = document.querySelector('#coming-soon-panel video'); return v.paused && v.currentTime === 0; });

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
      await page.addInitScript(() => {
        window.previewDraws = [];
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
          if (this.canvas.width === 1024 && this.canvas.height === 768 && this.fillStyle === '#39ff6a') window.previewDraws.push({ text, y, color: this.fillStyle, time: performance.now() });
          return fillText.call(this, text, x, y, ...rest);
        };
      });
      await page.goto(base + '/?debug=1'); await ready(page, '/');
      await page.locator('#arcade').focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.keyboard.press('Enter'); await ready(page, '/coming-soon');
      assert(!requests.some(url => url.includes('/assets/videos/')), 'Video stays unloaded in the preview');
      assert.equal(await page.locator('#announcement').textContent(), 'Coming Soon. <click to continue>');
      const draws = await page.evaluate(() => previewDraws);
      for (const [y, text] of [[260, 'Coming Soon'], [385, '<click to continue>']]) {
        const line = draws.filter(d => d.y === y);
        assert.equal(line.at(-1).text, text);
        const partial = line.filter(d => d.text.length > 0 && d.text.length < text.length);
        assert(partial.length > 4 && partial.every(d => text.startsWith(d.text)), 'Green text types progressively');
        assert(line.at(-1).time - partial[0].time > 300);
      }
      assert(!draws.some(d => d.text.includes('Stay tuned') || d.text.includes('Coming soon.')));
      if (output) await page.screenshot({ path: `${output}/coming-soon-preview-${size.width}.png` });
      await page.locator('#arcade').focus(); await page.keyboard.press('Enter'); await ready(page, '/coming-soon/view');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const panel = page.locator('#coming-soon-panel'), video = panel.locator('video');
      await page.waitForFunction(() => document.querySelector('#coming-soon-panel video').readyState >= 2);
      const metadata = await video.evaluate(v => ({ width: v.videoWidth, height: v.videoHeight, duration: v.duration, controls: v.controls, inline: v.playsInline, autoplay: v.autoplay, preload: v.preload, paused: v.paused, error: v.error, fit: getComputedStyle(v).objectFit, position: getComputedStyle(v).objectPosition }));
      assert(metadata.controls && metadata.inline && !metadata.autoplay && metadata.paused);
      assert.equal(metadata.preload, 'metadata'); assert.equal(metadata.error, null);
      assert(metadata.width > 0 && metadata.height > 0 && metadata.duration > 5);
      assert.equal(metadata.fit, 'contain'); assert.equal(metadata.position, '50% 50%');
      assert(!(await page.locator('#crt-placeholder').isVisible()));
      const border = page.locator('#crt-content'), borderBefore = await border.boundingBox();
      const backBefore = await page.locator('#screen-return').boundingBox();
      assert((await border.evaluate(e => getComputedStyle(e).backgroundImage)).includes('3%20Coming%20Soon.png'));
      assert.equal(await page.locator('#arcade canvas').evaluate(e => getComputedStyle(e).visibility), 'hidden');
      assert.equal(await panel.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(0, 0, 0)');
      assert(await panel.evaluate(e => e.scrollHeight === e.clientHeight && e.scrollWidth === e.clientWidth));
      const box = await video.boundingBox(), panelBox = await panel.boundingBox();
      assert(Math.abs(box.x + box.width / 2 - panelBox.x - panelBox.width / 2) < 1);
      assert(Math.abs(box.y + box.height / 2 - panelBox.y - panelBox.height / 2) < 1);
      assert(box.x > borderBefore.x && box.y > borderBefore.y && box.x + box.width < borderBefore.x + borderBefore.width && box.y + box.height < borderBefore.y + borderBefore.height);

      // Native keyboard playback, pausing, and seeking use the actual video element.
      await video.evaluate(v => { v.muted = true; }); await video.focus(); await page.keyboard.press('Space');
      await page.waitForFunction(() => { const v = document.querySelector('#coming-soon-panel video'); return !v.paused && v.currentTime > .2; });
      await page.keyboard.press('Space'); assert(await video.evaluate(v => v.paused));
      await video.evaluate(v => { v.currentTime = 5; });
      await page.waitForFunction(() => { const v = document.querySelector('#coming-soon-panel video'); return !v.seeking && v.currentTime >= 5; });
      assert.deepEqual(await border.boundingBox(), borderBefore); assert.deepEqual(await page.locator('#screen-return').boundingBox(), backBefore);
      assert.equal(await page.evaluate(() => scrollY), 0);
      if (output) await page.screenshot({ path: `${output}/coming-soon-video-${size.width}.png` });
      await video.dblclick();
      assert.equal(new URL(page.url()).pathname, '/coming-soon/view/', 'Video gestures never trigger cabinet frame navigation');
      if (await page.evaluate(() => !!document.fullscreenElement)) await page.evaluate(() => document.exitFullscreen());
      await video.evaluate(v => v.play());
      if (!mobile) await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (mobile) await page.locator('#screen-return').tap(); else await page.locator('#screen-return').click();
      await stopped(page); await ready(page, '/coming-soon'); assert(!(await panel.isVisible()));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goForward({ waitUntil: 'commit' }); await ready(page, '/coming-soon/view'); await stopped(page);
      await video.evaluate(async v => { await v.play(); await v.requestFullscreen(); });
      await page.waitForFunction(() => document.fullscreenElement?.tagName === 'VIDEO');
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/coming-soon'); await stopped(page);
      assert.equal(await page.evaluate(() => document.fullscreenElement), null);
      await page.goForward({ waitUntil: 'commit' }); await ready(page, '/coming-soon/view'); await stopped(page);
      await video.evaluate(v => v.play()); await page.keyboard.press('Escape'); await ready(page, '/coming-soon'); await stopped(page);
      await page.locator('#screen-return').click(); await ready(page, '/');
      await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await ready(page, '/contact-us');
      await page.keyboard.press('Enter'); await ready(page, '/contact-us/view');
      assert(!(await panel.isVisible())); assert(await page.locator('#contact-panel').isVisible()); await stopped(page);
      await page.goto(base + '/coming-soon/view/?debug=1'); await ready(page, '/coming-soon/view'); await stopped(page);
      await video.evaluate(async v => { v.muted = true; await v.play(); });
      await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click(); await page.waitForURL('**/privacy/');
      await page.goBack({ waitUntil: 'commit' }); await ready(page, '/coming-soon/view'); await stopped(page);
      assert(await panel.isVisible()); assert.deepEqual(errors, []);
      await context.close();
      console.log(`${size.width}: typed preview, centered ${metadata.width}x${metadata.height} video, native controls, playback/seeking, fixed border, fullscreen cleanup, Back/Forward, deep link and document return passed`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
