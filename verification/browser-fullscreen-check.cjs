const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8772/';
const output = process.env.VERIFICATION_OUTPUT;
const sections = [
  { id: 'retro', route: 'retro-arcade', catalog: 'assets/retro-arcade/catalog.json' },
  { id: 'handheld', route: 'retro-handheld', catalog: 'assets/handhelds/catalog.json' },
];
const slug = title => title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ready = page => page.waitForFunction(() => document.documentElement.dataset.routing === 'ready');
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    if (output) fs.mkdirSync(output, { recursive: true });
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }].filter(size => !process.env.TEST_WIDTH || size.width === Number(process.env.TEST_WIDTH))) {
      const mobile = size.width !== 1440;
      const context = await browser.newContext({ viewport: size, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], documents = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (r.resourceType() === 'document') documents.push(r.url()); });
      const activate = locator => mobile ? locator.tap() : locator.click();
      for (const section of sections) {
        const games = JSON.parse(fs.readFileSync(section.catalog)).filter(g => g.url);
        await page.goto(`${base}${section.route}/games/${slug(games[0].title)}/?debug=1`);
        await ready(page);
        for (const [index, item] of games.entries()) {
          if (index) {
            await activate(page.locator(`#${section.id}-grid a[data-game="${item.id}"]`));
            await ready(page);
          }
          const frameElement = page.locator(`#${section.id}-game-viewport iframe`);
          const frame = await (await frameElement.elementHandle()).contentFrame();
          await frame.waitForLoadState('load');
          await frame.waitForFunction(() => document.querySelector('canvas#lp-lcd, canvas#screen, canvas#lcd'));
          const expand = page.locator(`#${section.id}-fullscreen`);
          await expand.waitFor();
          await page.waitForFunction(id => !document.querySelector(`#${id}-fullscreen`).disabled, section.id);
          await settle(page);
          const buttonRect = await expand.boundingBox(), backRect = await page.locator(`#${section.id}-back`).boundingBox();
          assert(buttonRect.x > backRect.x + backRect.width, 'Fullscreen is opposite Back without overlap');
          assert(Math.abs(buttonRect.y - backRect.y) < 1, 'Buttons share the top edge');
          assert.equal(await expand.locator('img').getAttribute('src'), 'assets/demo-arcade/full-screen.png');
          const normal = await frameElement.boundingBox(), url = page.url();
          const historyLength = await page.evaluate(() => history.length);
          const beforeDocuments = documents.length;
          if (index === 0) {
            const playing = section.id === 'retro' ? 'game' : 'playing';
            for (let attempt = 0; attempt < 10; attempt++) {
              if (await frame.evaluate(state => LP.States.current === state, playing)) break;
              await frame.evaluate(() => window.focus());
              await page.keyboard.press('Enter'); await page.waitForTimeout(400);
            }
            assert.equal(await frame.evaluate(() => LP.States.current), playing, 'Representative game reaches active gameplay');
            await frame.evaluate(() => {
              LP.Loop.manual = true; LP.Loop.step(180);
              window.__activeState = { actor: Game.hero || Game.player, score: Game.score, level: Game.level, wave: Game.wave, frame: LP.Loop.frame, state: LP.States.current };
            });
          }
          await frame.evaluate(() => {
            window.__fullscreenProbe = { doc: document, canvas: document.querySelector('canvas#lp-lcd, canvas#screen, canvas#lcd'), origin: performance.timeOrigin, states: window.LP?.States, keys: [] };
            window.addEventListener('keydown', event => __fullscreenProbe.keys.push(event.key));
          });
          const statePreserved = async () => {
            assert(await frame.evaluate(() => __fullscreenProbe.doc === document && __fullscreenProbe.canvas === document.querySelector('canvas#lp-lcd, canvas#screen, canvas#lcd') && __fullscreenProbe.origin === performance.timeOrigin && __fullscreenProbe.states === window.LP?.States), 'Original document, canvas, state object and timer origin survive');
            assert.equal(documents.length, beforeDocuments, 'Fullscreen never requests a game document');
            assert.equal(page.url(), url);
            assert.equal(await page.evaluate(() => history.length), historyLength);
            assert.equal(await page.evaluate(() => document.fullscreenElement), null, 'Never uses native fullscreen');
            if (index === 0) assert(await frame.evaluate(() => __activeState.actor === (Game.hero || Game.player) && __activeState.score === Game.score && __activeState.level === Game.level && __activeState.wave === Game.wave && __activeState.frame === LP.Loop.frame && __activeState.state === LP.States.current), 'Active player, score, level, timer and gameplay state survive');
          };
          const checkExpanded = async () => {
            assert(await page.locator(`#${section.id}-player`).evaluate(e => e.classList.contains('game-expanded')));
            const viewport = await page.locator(`#${section.id}-game-viewport`).boundingBox();
            assert.equal(viewport.x, 0); assert.equal(viewport.y, 0);
            assert.equal(viewport.width, page.viewportSize().width); assert.equal(viewport.height, page.viewportSize().height);
            if (mobile && section.id === 'handheld') {
              assert.equal(await frameElement.evaluate(e => e.style.clipPath), '', 'Touch retains the entire console');
              const rect = await frameElement.boundingBox();
              assert.equal(rect.width, viewport.width); assert.equal(rect.height, viewport.height);
              const art = await frame.evaluate(() => {
                const e = document.querySelector('#lp-shell, #shell, img#device');
                if (!e) return null;
                const r = e.getBoundingClientRect();
                // Some original shells intentionally trim transparent artwork
                // margins. Their configured view, including all buttons, fits.
                let visible = window.LP?.Shell?.view?.getBoundingClientRect() || document.querySelector('#clip')?.getBoundingClientRect() || r;
                const crop = window.SW?.CONFIG?.CROP;
                if (crop) { const k = r.width / e.naturalWidth; visible = { x: r.x + crop.x * k, y: r.y + crop.y * k, width: crop.w * k, height: crop.h * k }; }
                return { x: visible.x, y: visible.y, w: r.width, h: r.height, visibleW: visible.width, visibleH: visible.height, natural: e.naturalWidth / e.naturalHeight, vw: innerWidth, vh: innerHeight };
              });
              if (art && art.w && art.h) {
                assert(Math.abs(art.w / art.h - art.natural) < .02, 'Console artwork keeps its aspect ratio');
                assert(art.x >= -2 && art.y >= -2 && art.x + art.visibleW <= art.vw + 2 && art.y + art.visibleH <= art.vh + 2, 'Complete configured console view fits');
              }
            } else {
              const fit = await frameElement.evaluate(e => {
                const screen = e.contentWindow.LP?.Shell?.screen || e.contentDocument.querySelector('canvas#screen, canvas#lcd, canvas#lp-lcd');
                const r = screen.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(e).transform);
                return { x: m.e + r.x * m.a, y: m.f + r.y * m.d, w: r.width * m.a, h: r.height * m.d, sx: m.a, sy: m.d, clip: e.style.clipPath };
              });
              assert(fit.clip.startsWith('inset('), 'Console and non-playable margins are clipped');
              assert.equal(fit.sx, fit.sy, 'Scaling is proportional');
              assert(fit.x >= -.1 && fit.y >= -.1 && fit.x + fit.w <= viewport.width + .1 && fit.y + fit.h <= viewport.height + .1, 'Playable area fits without cropping');
              assert(Math.abs(fit.w - viewport.width) < .1 || Math.abs(fit.h - viewport.height) < .1, 'Playable area maximizes one viewport dimension');
            }
            await statePreserved();
          };
          await activate(expand); await settle(page); await checkExpanded();
          await page.keyboard.down('ArrowRight');
          assert((await frame.evaluate(() => __fullscreenProbe.keys)).includes('ArrowRight'));
          if (await frame.evaluate(() => !!window.LP?.Input)) assert(await frame.evaluate(() => LP.Input.downKeys.has('ArrowRight')), 'Game receives held direction');
          await page.keyboard.up('ArrowRight');
          if (mobile && section.id === 'handheld' && await frame.evaluate(() => !!window.LP?.Input)) {
            const target = await frame.evaluate(() => {
              const z = LP.Input.zones.find(z => z.type === 'dpad' || z.action === 'right' || z.id === 'right');
              if (!z) return null;
              const [x, y] = LP.Shell.toClient(z.x + (z.type === 'dpad' ? z.r * .6 : (z.width || 0) / 2), z.y + (z.height || 0) / 2);
              window.__touchInputReceived = false;
              LP.Input.el.addEventListener('pointerdown', () => { window.__touchInputReceived = LP.Input.held('right'); }, { once: true });
              return { x, y };
            });
            assert(target, 'Original directional touch region found');
            await page.touchscreen.tap(target.x, target.y); assert(await frame.evaluate(() => __touchInputReceived), 'Original console touch control remains active');
          }
          if (index === 0) await frame.evaluate(() => LP.Loop.draw());
          if (output && ['bungee-pug', 'chrome-possum', 'sloth-invaders', 'static-weasel', 'the-circus'].includes(item.id)) await page.screenshot({ path: path.join(output, `${item.id}-expanded-${size.width}.png`) });
          const escapeBefore = await frame.evaluate(() => __fullscreenProbe.keys.filter(k => k === 'Escape').length);
          await frame.evaluate(() => window.focus()); await page.keyboard.press('Escape'); await settle(page);
          assert.equal(await expand.getAttribute('aria-pressed'), 'false');
          assert.equal(await frame.evaluate(() => __fullscreenProbe.keys.filter(k => k === 'Escape').length), escapeBefore, 'Exit Escape does not also trigger a game action');
          assert.deepEqual(await frameElement.boundingBox(), normal, 'Normal view restores exactly');
          await statePreserved();
          await page.keyboard.press('Escape');
          assert.equal(await frame.evaluate(() => __fullscreenProbe.keys.filter(k => k === 'Escape').length), escapeBefore + 1, 'Normal Escape still reaches game');
          await activate(expand); await settle(page); await checkExpanded();
          await activate(expand); await settle(page); await statePreserved();
          await activate(expand); await settle(page);
          if (index === 0) {
            for (const resized of [{ width: 320, height: 700 }, { width: 820, height: 1180 }, size]) {
              await page.setViewportSize(resized); await settle(page); await checkExpanded();
            }
            await frame.evaluate(() => { LP.Loop.manual = false; });
            await frame.waitForFunction(() => LP.Loop.frame > __activeState.frame);
          }
          await activate(page.locator(`#${section.id}-back`)); await ready(page);
          assert(frame.isDetached(), 'Back still unloads the game');
          assert(await page.locator(`#${section.id}-grid`).isVisible());
          assert(!(await expand.isVisible()), 'Fullscreen hidden on game selection');
          assert.equal(await page.locator('.game-expanded').count(), 0);
          if (index === 0) {
            await page.goForward(); await ready(page);
            await page.locator(`#${section.id}-game-viewport iframe`).waitFor();
            assert.equal(await expand.getAttribute('aria-pressed'), 'false', 'History forward launches a normal game view');
            await page.goBack(); await ready(page);
          }
          console.log(`${size.width}x${size.height} ${item.id}: fullscreen, scaling, input, Escape, state and Back passed`);
        }
        await activate(page.locator('#screen-return')); await ready(page);
        await activate(page.locator('#screen-return')); await ready(page);
        assert.equal(await page.locator('.game-fullscreen:visible').count(), 0, 'Fullscreen hidden on carousel');
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
  console.log('All 33 games passed for each selected viewport.');
})().catch(e => { console.error(e); process.exitCode = 1; });
