// Verify real screen history without creating a cart or placing an order.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:8771/').replace(/\/$/, '');
const root = '/merch-shop/view/';
const ready = page => page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition);
async function screen(page, kind) {
  await ready(page);
  if (kind === 'catalog') await page.waitForSelector('.merch-card');
  if (kind === 'product') await page.waitForSelector('#merch-variant');
  if (kind === 'cart') await page.getByRole('heading', { name: 'Your cart', exact: true }).waitFor();
  assert.equal(await page.locator('#merch-panel').getAttribute('data-screen'), kind);
}
async function path(page, value) {
  await page.waitForFunction(value => location.pathname === value && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition, value);
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    let productQuery;
    for (const viewport of [{ width: 1920, height: 906 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/privacy/');
      await page.goto(base + root + '?debug=1'); await screen(page, 'catalog');
      const startingLength = await page.evaluate(() => history.length);
      // The first row should use the available width, with no reserved empty columns.
      const grid = await page.locator('.merch-grid').boundingBox();
      const cards = await page.locator('.merch-card').evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, right: rect.right, width: rect.width };
      }));
      const row = cards.filter(card => Math.abs(card.y - cards[0].y) < 1);
      assert(Math.abs(row.at(-1).right - (grid.x + grid.width)) < 2, 'Cards fill the row');
      assert(cards[0].width >= 240, 'Cards are larger than the former 205px minimum');
      const left = await page.locator('#screen-return').boundingBox();
      const right = await page.locator('#merch-arcade-return').boundingBox();
      const toolbar = await page.locator('.merch-toolbar').boundingBox();
      assert(left.x >= 0 && right.x + right.width <= viewport.width);
      assert(left.x + left.width < right.x, 'Return controls do not overlap');
      if (viewport.width > 900) {
        assert(left.y > 15 && left.y + left.height <= toolbar.y, 'Cabinet button fits in the header');
        assert(right.y > 15 && right.y + right.height <= toolbar.y, 'Arcade button fits in the header');
      } else {
        assert(left.height >= 44 && right.height >= 44, 'Compact returns retain touch targets');
        const browse = await page.locator('#merch-browse').boundingBox();
        assert(left.y + left.height <= browse.y && right.y + right.height <= browse.y, 'Compact controls have their own row');
      }
      await page.locator('.merch-card').first().click(); await screen(page, 'product');
      productQuery = new URL(page.url()).searchParams.get('product'); assert(productQuery);
      assert.equal(await page.evaluate(() => history.length), startingLength + 1);
      await page.selectOption('#merch-color', { index: 1 });
      const variant = await page.locator('#merch-variant').inputValue();
      await page.locator('.merch-main-image').click(); await page.waitForSelector('.merch-image-expanded');
      assert.equal(new URL(page.url()).searchParams.get('image'), 'expanded');
      await page.goBack(); await page.waitForSelector('.merch-image-expanded', { state: 'detached' }); await screen(page, 'product');
      assert.equal(await page.locator('#merch-variant').inputValue(), variant, 'Image Back preserves the selected option');
      await page.locator('#merch-cart-button').click(); await screen(page, 'cart');
      assert.equal(new URL(page.url()).searchParams.get('cart'), '1');
      const length = await page.evaluate(() => history.length);
      await page.reload(); await screen(page, 'cart');
      assert.equal(await page.evaluate(() => history.length), length, 'Reload retains the current screen without duplicate ancestors');
      await page.goBack(); await screen(page, 'product');
      await page.goBack(); await screen(page, 'catalog');
      await page.goBack(); await path(page, '/merch-shop/');
      await page.goBack(); await path(page, '/');
      await page.goBack(); await page.waitForURL('**/privacy/');
      // Forward restores exactly the same individual screens.
      await page.goForward(); await path(page, '/');
      await page.goForward(); await path(page, '/merch-shop/');
      await page.goForward(); await screen(page, 'catalog');
      await page.goForward(); await screen(page, 'product');
      await page.goForward(); await screen(page, 'cart');
      await page.locator('#screen-return').click(); await path(page, '/merch-shop/');
      await page.goForward(); await screen(page, 'catalog');
      await page.locator('.merch-card').first().click(); await screen(page, 'product');
      await page.locator('#merch-cart-button').click(); await screen(page, 'cart');
      await page.locator('#merch-arcade-return').click(); await path(page, '/');
      assert.equal(await page.evaluate(() => arcadeDebug.state.view), 'carousel');
      await page.goForward(); await path(page, '/merch-shop/');
      assert(await page.locator('#merch-arcade-return').isHidden());
      console.log(`PASS ${viewport.width}: full card row, return controls, image/product/cart Back and Forward, reload, direct cabinet and carousel returns.`);
      await context.close();
    }
    for (const query of ['product=' + encodeURIComponent(productQuery), 'product=' + encodeURIComponent(productQuery) + '&image=expanded', 'cart=1']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/privacy/');
      const response = await page.goto(base + root + '?debug=1&' + query); assert.equal(response.status(), 200);
      await screen(page, query === 'cart=1' ? 'cart' : 'product');
      const length = await page.evaluate(() => history.length);
      await page.reload(); await screen(page, query === 'cart=1' ? 'cart' : 'product');
      assert.equal(await page.evaluate(() => history.length), length);
      if (query.includes('expanded')) { await page.goBack(); await screen(page, 'product'); assert(!new URL(page.url()).searchParams.has('image')); }
      await page.goBack(); await screen(page, 'catalog');
      await page.goBack(); await path(page, '/merch-shop/');
      await page.goBack(); await path(page, '/');
      await page.goBack(); await page.waitForURL('**/privacy/');
      await context.close();
    }
    const page = await browser.newPage({ reducedMotion: 'reduce' }); page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + root + '?debug=1'); await screen(page, 'catalog');
    await page.route('**/v1/products/**', async route => { await new Promise(resolve => setTimeout(resolve, 1200)); await route.continue(); });
    await page.locator('.merch-card').first().click();
    await page.waitForFunction(() => new URLSearchParams(location.search).has('product'));
    await page.goBack(); await screen(page, 'catalog');
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('#merch-panel').getAttribute('data-screen'), 'catalog');
    assert.equal(await page.locator('.merch-detail').count(), 0, 'Late product results cannot undo Back');
    assert.deepEqual(errors, []);
    console.log('PASS: fresh product/image/cart links seed each screen once; delayed product responses cannot undo Back; no page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
