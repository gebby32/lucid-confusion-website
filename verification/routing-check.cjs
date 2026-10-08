const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const ready = (page, path) => page.waitForFunction(path => (location.pathname.replace(/\/+$/, '') || '/') === path && document.documentElement.dataset.routing === 'ready' && window.arcadeDebug && !arcadeDebug.state.zoomTransition, path);
const back = async (page, path) => { await page.goBack(); await ready(page, path); };
const forward = async (page, path) => { await page.goForward(); await ready(page, path); };
const errors = [];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(base + '/?debug=1'); await ready(page, '/');
      async function open(index, path) {
        await page.locator('#arcade').focus();
        let active = await page.evaluate(() => arcadeDebug.state.active);
        while (active !== index) { await page.keyboard.press('ArrowRight'); active = (active + 1) % 9; }
        await page.keyboard.press('Enter'); await ready(page, path);
        assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'cabinet');
      }
      await open(0, '/about-us');
      await page.keyboard.press('Enter'); await ready(page, '/about-us/view');
      assert(await page.locator('#about-story').isVisible());
      await back(page, '/about-us'); await back(page, '/');
      await forward(page, '/about-us'); await forward(page, '/about-us/view');
      await back(page, '/about-us'); await back(page, '/');
      for (const [index, cabinet, kind, game] of [[1, 'retro-handheld', 'handheld', 'sloth-kart-racing'], [2, 'retro-arcade', 'retro', 'sloth-invaders']]) {
        const focus = '/' + cabinet, grid = focus + '/games', gamePath = grid + '/' + game;
        await open(index, focus); await page.keyboard.press('Enter'); await ready(page, grid);
        const link = page.locator(`#${kind}-grid a[data-game="${game}"]`);
        assert.equal(await link.getAttribute('href'), gamePath + '/');
        if (mobile) await link.tap(); else await link.click();
        await ready(page, gamePath);
        const iframe = page.locator(`#${kind}-player iframe`);
        const frame = await (await iframe.elementHandle()).contentFrame(); await frame.waitForLoadState('load');
        assert.equal(await page.locator('iframe').count(), 1);
        await frame.evaluate(() => window.focus()); await page.keyboard.press('f');
        await page.waitForFunction(() => !!document.fullscreenElement);
        await back(page, grid);
        assert(frame.isDetached()); assert.equal(await page.locator('iframe').count(), 0);
        assert.equal(await page.evaluate(() => document.fullscreenElement), null);
        assert(await page.locator(`#${kind}-grid`).isVisible());
        await back(page, focus); await back(page, '/');
        await forward(page, focus); await forward(page, grid); await forward(page, gamePath);
        assert.equal(await page.locator('iframe').count(), 1);
        await page.locator(`#${kind}-back`).click(); await ready(page, grid);
        await page.locator('#screen-return').click(); await ready(page, focus);
        await back(page, '/');
      }
      await open(5, '/links'); await page.keyboard.press('Enter'); await ready(page, '/links/view');
      await page.locator('[data-beach]').click(); await ready(page, '/links/beach');
      await back(page, '/links/view'); await forward(page, '/links/beach');
      await page.locator('#links-beach').click(); await ready(page, '/links/view');
      await forward(page, '/links/beach');
      await page.locator('#links-return').click(); await ready(page, '/links');
      await back(page, '/');
      assert.equal(await page.locator('iframe').count(), 0);
      console.log(`${mobile ? 'Mobile touch' : 'Desktop'}: About, both game cabinets, Links, parent controls, fullscreen cleanup, browser Back/Forward passed`);
      await context.close();
    }
    // A real earlier document makes it possible to prove that root Back leaves.
    for (const path of ['/retro-handheld/games/sloth-kart-racing', '/retro-arcade/games/sloth-invaders', '/about-us/view', '/links/beach']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/privacy/');
      const response = await page.goto(base + path + '?debug=1'); assert.equal(response.status(), 200);
      await ready(page, path);
      const length = await page.evaluate(() => history.length);
      const reload = await page.reload(); assert.equal(reload.status(), 200); await ready(page, path);
      assert.equal(await page.evaluate(() => history.length), length, 'Refresh must not seed duplicate parents');
      if (path.includes('/games/')) {
        assert.equal(await page.locator('iframe').count(), 1);
        await back(page, path.slice(0, path.lastIndexOf('/')));
        assert.equal(await page.locator('iframe').count(), 0);
      } else if (path === '/links/beach') await back(page, '/links/view');
      await back(page, '/' + path.split('/')[1]); await back(page, '/');
      await page.goBack(); await page.waitForURL('**/privacy/');
      console.log(`Fresh direct link + refresh + parent history + root exit: ${path}`);
      await context.close();
    }
    // Every published game gets a distinct real static entry and a clean slug.
    for (const [cabinet, catalog] of [['retro-handheld', 'handhelds'], ['retro-arcade', 'retro-arcade']]) {
      const games = JSON.parse(fs.readFileSync(`assets/${catalog}/catalog.json`)).filter(game => game.url);
      for (const game of games) {
        const slug = game.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const response = await fetch(`${base}/${cabinet}/games/${slug}`);
        assert.equal(response.status, 200); assert((await response.text()).includes('/route-bootstrap.js'));
      }
      console.log(`${cabinet}: all ${games.length} published game URLs serve static entry documents`);
    }
    assert.deepEqual(errors, []);
    console.log('Routing checks passed with no browser errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
