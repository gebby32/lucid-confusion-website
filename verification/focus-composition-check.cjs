const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8773/';
const output = process.env.VERIFICATION_OUTPUT;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{ width: 1920, height: 916 }, { width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '?debug=1'); await page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready');
      for (let i = 0; i < 9; i++) {
        await page.locator('#arcade').focus(); await page.keyboard.press('Enter');
        await page.waitForFunction(() => arcadeDebug.state.view === 'cabinet' && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready');
        const bounds = await page.evaluate(async () => {
          const T = await import('/assets/vendor/three/three.module.min.js');
          const d = arcadeDebug, rect = document.querySelector('#arcade').getBoundingClientRect();
          const project = index => {
            const root = d.screens.get((index + 9) % 9).root, xs = [], ys = [];
            root.traverse(object => {
              const positions = object.geometry?.attributes.position;
              if (!positions) return;
              for (let i = 0; i < positions.count; i++) {
                const p = new T.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(d.camera);
                xs.push(rect.x + (p.x + 1) * rect.width / 2); ys.push(rect.y + (1 - p.y) * rect.height / 2);
              }
            });
            return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), ground: new T.Box3().setFromObject(root).min.y };
          };
          return { center: project(d.state.active), sides: [project(d.state.active - 1), project(d.state.active + 1)] };
        });
        assert(bounds.center.left >= 12 && bounds.center.right <= viewport.width - 12, 'Center fits horizontally');
        assert(bounds.center.top >= viewport.height * .04 && bounds.center.bottom <= viewport.height - 46, 'Entire center fits actual viewport with footer clearance');
        if (viewport.width / viewport.height >= 1.5 && viewport.height >= 600) {
          for (const side of bounds.sides) assert(side.left >= viewport.width * .035 && side.right <= viewport.width * .965, 'Desktop neighbors have outer breathing room');
        }
        for (const model of [bounds.center, ...bounds.sides]) assert(Math.abs(model.ground) < .00001, 'Cabinets remain on their ground plane');
        if (output && i === 8) await page.screenshot({ path: `${output}/composition-handheld-${viewport.width}.png` });
        await page.keyboard.press('Escape'); await page.waitForFunction(() => arcadeDebug.state.view === 'carousel' && document.documentElement.dataset.routing === 'ready');
        await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight');
      }
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}x${viewport.height}: all nine cabinets fit, desktop neighbors have clearance, ground plane preserved, navigation passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
