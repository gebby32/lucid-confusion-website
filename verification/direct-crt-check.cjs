const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8773/';
const output = process.env.VERIFICATION_OUTPUT;
const ready = page => page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition);
async function monitor(page) {
  return page.evaluate(() => {
    const d = arcadeDebug, r = document.querySelector('#arcade').getBoundingClientRect();
    const p = d.screens.get(d.state.active).focusPose().target.project(d.camera);
    return { x: r.x + (p.x + 1) * r.width / 2, y: r.y + (1 - p.y) * r.height / 2 };
  });
}
async function camera(page) { return page.evaluate(() => ({ p: arcadeDebug.camera.position.toArray(), q: arcadeDebug.camera.quaternion.toArray(), zoom: arcadeDebug.camera.zoom, view: arcadeDebug.camera.view })); }
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{width:1920,height:916},{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      const mobile = viewport.width < 1000;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '?debug=1'); await ready(page);
      const resting = await camera(page);
      await page.evaluate(() => {
        const d = arcadeDebug;
        const ring = d.ring.matrix.toArray(), models = d.models.map(m => m.matrix.toArray());
        window.motionErrors = []; window.motionFrames = 0; window.recordMotion = true;
        const sample = () => {
          if (!recordMotion) return;
          if (d.state.view === 'cabinet') motionErrors.push('Obsolete cabinet state');
          if (JSON.stringify(d.ring.matrix.toArray()) !== JSON.stringify(ring) || d.models.some((m,i) => JSON.stringify(m.matrix.toArray()) !== JSON.stringify(models[i]))) motionErrors.push('Cabinet geometry/transform changed');
          motionFrames++; requestAnimationFrame(sample);
        }; requestAnimationFrame(sample);
      });
      // A single actual CRT click/tap enters the intro directly.
      const point = await monitor(page);
      if (mobile) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
      await page.waitForFunction(() => arcadeDebug.state.view === 'intro'); await ready(page);
      await page.waitForFunction(() => arcadeDebug.screens.get(arcadeDebug.state.active).mode === 'texture');
      assert.deepEqual(await page.evaluate(() => { recordMotion=false; return motionErrors; }), []);
      assert(await page.evaluate(() => motionFrames > 5));
      assert(await page.locator('#crt-content').isHidden());
      const introCamera = await camera(page);
      const crtPoint = await monitor(page);
      assert(crtPoint.x > 0 && crtPoint.x < viewport.width && crtPoint.y > 0 && crtPoint.y < viewport.height);
      if (output) { await page.waitForTimeout(1400); await page.screenshot({path:`${output}/direct-crt-${viewport.width}.png`}); }
      if (mobile) await page.touchscreen.tap(crtPoint.x, crtPoint.y); else await page.mouse.click(crtPoint.x, crtPoint.y);
      await page.waitForFunction(() => arcadeDebug.state.view === 'crt'); await ready(page);
      assert(await page.locator('#retro-grid').isVisible());
      assert.deepEqual(await camera(page), introCamera, 'Intro to content needs no second camera pose');
      await page.goBack(); await ready(page);
      assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'intro');
      await page.locator('#screen-return').click(); await ready(page);
      assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'carousel');
      assert.deepEqual(await camera(page), resting, 'Resting carousel camera is restored exactly');
      // A side-cabinet body click also enters directly, without rotating the ring.
      if (!mobile) {
        const side = await page.evaluate(async () => {
          const T = await import('/assets/vendor/three/three.module.min.js'), d = arcadeDebug;
          const rect = document.querySelector('#arcade').getBoundingClientRect(), ray = new T.Raycaster();
          for (let y=.45;y<.9;y+=.04) for (let x=.1;x<.9;x+=.04) {
            ray.setFromCamera(new T.Vector2(x*2-1,1-y*2),d.camera);
            let obj=ray.intersectObjects(d.models,true).find(h=>!h.object.userData.groundShadow)?.object;
            while(obj&&obj.userData.cabinetIndex===undefined)obj=obj.parent;
            if(obj && [1,3].includes(obj.userData.cabinetIndex)) return {x:rect.x+x*rect.width,y:rect.y+y*rect.height,index:obj.userData.cabinetIndex,ring:d.ring.matrix.toArray()};
          } throw new Error('No visible side cabinet');
        });
        await page.mouse.click(side.x,side.y); await ready(page);
        assert.equal(await page.evaluate(()=>arcadeDebug.state.view),'intro');
        assert.equal(await page.evaluate(()=>arcadeDebug.state.active),side.index);
        assert.deepEqual(await page.evaluate(()=>arcadeDebug.ring.matrix.toArray()),side.ring);
        await page.locator('#screen-return').click(); await ready(page);
      }
      // Every cabinet retains its intro and content, including direct URLs.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const slug of ['about-us','retro-handheld','retro-arcade','demo-arcade','merch-shop','links','new-stuff','coming-soon','contact-us']) {
        await page.goto(base + slug + '/?debug=1'); await ready(page);
        assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'intro');
        await page.waitForFunction(() => arcadeDebug.screens.get(arcadeDebug.state.active).mode === 'texture');
        const p = await monitor(page);
        if (mobile) await page.touchscreen.tap(p.x,p.y); else await page.mouse.click(p.x,p.y);
        await page.waitForFunction(() => arcadeDebug.state.view === 'crt'); await ready(page);
        await page.locator(slug === 'links' ? '#links-return' : '#screen-return').click(); await ready(page);
        assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'carousel');
        assert.equal(new URL(page.url()).pathname, '/');
      }
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}x${viewport.height}: direct CRT click/tap, unchanged geometry, one camera pose, nine intros/content/returns passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
