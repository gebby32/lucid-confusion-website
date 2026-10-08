const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8773/';
const output = process.env.VERIFICATION_OUTPUT;
const baseline = !!process.env.BASELINE;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, isMobile: viewport.width !== 1440, hasTouch: viewport.width !== 1440 });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '?debug=1');
      await page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready');
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        const THREE = await import('/assets/vendor/three/three.module.min.js');
        const d = arcadeDebug;
        const world = d.screens.get(d.state.active).focusPose().target;
        const startRingZ = d.ring.position.z;
        window.sampleFocus = () => {
          const rect = document.querySelector('#arcade').getBoundingClientRect();
          const p = world.clone(); p.z += d.ring.position.z - startRingZ; p.project(d.camera);
          return { x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2, t: performance.now(), transition: d.state.zoomTransition };
        };
        window.focusSamples = [sampleFocus()]; window.shifts = [];
        new PerformanceObserver(list => shifts.push(...list.getEntries().map(e => e.value))).observe({ type: 'layout-shift' });
        window.rootGeometry = { room: document.querySelector('.arcade-room').getBoundingClientRect().toJSON(), footer: document.querySelector('.site-footer').getBoundingClientRect().toJSON(), scroll: document.documentElement.scrollHeight };
        window.sampleUntil = performance.now() + 1600;
        function sample() { focusSamples.push(sampleFocus()); if (performance.now() < sampleUntil) requestAnimationFrame(sample); }
        requestAnimationFrame(sample);
      });
      if (output) await page.screenshot({ path: `${output}/${baseline ? 'before' : 'after'}-root-${viewport.width}.png` });
      await page.locator('#arcade').focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready');
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => {
        const samples = focusSamples;
        const first = samples.findIndex(s => s.transition);
        const start = samples[Math.max(0, first - 1)], end = sampleFocus();
        const ys = samples.slice(Math.max(0, first - 1)).map(s => s.y);
        const room = document.querySelector('.arcade-room').getBoundingClientRect();
        const stage = document.querySelector('#arcade').getBoundingClientRect();
        const footer = document.querySelector('.site-footer');
        const links = [...footer.querySelectorAll('a')].map(a => {
          const r = a.getBoundingClientRect();
          return { clickable: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === a, href: a.href };
        });
        return { firstStep: first >= 0 ? Math.abs(samples[first].y - start.y) : 0,
          overshoot: Math.max(0, Math.max(...ys) - Math.max(start.y, end.y), Math.min(start.y, end.y) - Math.min(...ys)),
          startY: start.y, endY: end.y, footerBackground: getComputedStyle(footer).backgroundColor,
          canvasBottom: stage.bottom, roomBottom: room.bottom, links, shifts,
          stable: JSON.stringify(rootGeometry) === JSON.stringify({ room: room.toJSON(), footer: footer.getBoundingClientRect().toJSON(), scroll: document.documentElement.scrollHeight }),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      if (output) await page.screenshot({ path: `${output}/${baseline ? 'before' : 'after'}-focus-${viewport.width}.png` });
      console.log(viewport.width, JSON.stringify(metrics));
      if (!baseline) {
        assert(metrics.firstStep < 8, 'No initial vertical jump');
        assert(metrics.overshoot < 3, 'No vertical bounce past either endpoint');
        assert(Math.abs(metrics.canvasBottom - metrics.roomBottom) < 1, 'Canvas continues behind footer');
        assert.equal(metrics.footerBackground, 'rgba(0, 0, 0, 0)');
        assert(metrics.stable, 'Room/footer geometry and document height stay fixed');
        assert(!metrics.overflow);
        assert(metrics.shifts.every(value => value === 0), 'No layout shift during focus');
        // Short landscape deliberately scrolls within its existing 600px room.
        if (viewport.height >= 600) assert(metrics.links.every(link => link.clickable));
        else { await page.locator('.site-footer').scrollIntoViewIfNeeded(); await page.locator('.site-footer a').first().click({ trial: true }); }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
