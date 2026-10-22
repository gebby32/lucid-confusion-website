// Live storefront verification: creates a disposable cart, never places an order.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8772/';
const output = path.join(__dirname, 'merch-output'); fs.mkdirSync(output, { recursive: true });
const ready = page => page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition);
const catalog = async page => { await page.waitForSelector('.merch-card'); assert.equal(await page.locator('.merch-card').count(), expected.length); };
const images = async page => {
  await page.locator('.merch-card img').evaluateAll(imgs => Promise.all(imgs.filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.top < innerHeight && rect.bottom > 0;
  }).map(img => img.decode())));
};
const monitor = page => page.evaluate(() => {
  const d = arcadeDebug, r = document.querySelector('#arcade').getBoundingClientRect();
  const p = d.screens.get(d.state.active).focusPose().target.project(d.camera);
  return { x: r.x + (p.x + 1) * r.width / 2, y: r.y + (1 - p.y) * r.height / 2 };
});
let expected;
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    if (!process.env.MERCH_LAYOUT_ONLY) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage(), errors = [], mutations = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const source = message.location().url;
      if (source && new URL(source).pathname === '/favicon.ico') return;
      errors.push(message.text().replace(/ptkn_[\w-]+/g, '[redacted]') + (source ? ' at ' + new URL(source).pathname : ''));
    });
    page.on('request', request => {
      if (request.method() === 'POST' && request.url().includes('storefront-api.fourthwall.com')) mutations.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() });
    });
    await page.goto(base + '?debug=1', { waitUntil: 'domcontentloaded' }); await ready(page);
    expected = await page.evaluate(async () => {
      const { FourthwallStore } = await import('/merch-api.js');
      const config = await (await fetch('/merch-config.json')).json();
      return (await new FourthwallStore(config.storefrontToken).products()).map(p => ({ id: p.id, name: p.name, slug: p.slug }));
    });
    await page.locator('#arcade').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    // Let the carousel settle before clicking the real projected monitor.
    await page.waitForTimeout(1400);
    let point = await monitor(page); await page.mouse.click(point.x, point.y); await ready(page);
    await page.waitForFunction(() => arcadeDebug.state.view === 'intro');
    assert((await page.locator('#announcement').innerText()).includes('Merch Shop. <click to continue>'));
    await page.waitForTimeout(1900); await page.screenshot({ path: output + '/intro-1280.png' });
    point = await monitor(page); await page.mouse.click(point.x, point.y);
    await page.waitForSelector('#merch-panel:not([hidden])'); await ready(page); await catalog(page); await images(page);
    await page.screenshot({ path: output + '/catalog-1280.png' });
    assert.deepEqual(await page.locator('.merch-card h3').allTextContents(), expected.map(p => p.name));
    assert(await page.locator('#crt-placeholder').isHidden());
    console.log(`PASS: two actual click zoom stages, green continue message, ${expected.length} live public products.`);

    await page.locator('.merch-card').first().click(); await page.waitForSelector('#merch-color');
    await page.locator('.merch-main-image img').evaluate(img => img.decode());
    const originalImage = await page.locator('.merch-main-image img').getAttribute('src');
    await page.selectOption('#merch-color', { index: 1 }); await page.selectOption('#merch-variant', { index: 1 });
    await page.locator('.merch-main-image img').evaluate(img => img.decode());
    assert.notEqual(await page.locator('.merch-main-image img').getAttribute('src'), originalImage);
    const firstVariant = await page.locator('#merch-variant').inputValue();
    const firstName = await page.locator('.merch-product-info h2').innerText();
    await page.locator('.merch-thumb').nth(1).click();
    await page.locator('.merch-main-image img').evaluate(img => img.decode());
    await page.locator('.merch-main-image').click(); await page.waitForSelector('.merch-image-expanded');
    await page.keyboard.press('Escape'); await page.waitForSelector('.merch-image-expanded', { state: 'detached' });
    await page.locator('#merch-quantity').fill('2');
    await page.screenshot({ path: output + '/product-1280.png' });
    await page.locator('.merch-options').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await page.waitForFunction(() => document.querySelector('#merch-cart-button').textContent === 'Cart (2)');
    assert.equal(mutations.filter(m => m.path.endsWith('/add')).length, 1, 'Double submit adds only once');
    assert.deepEqual(mutations.at(-1).body.items, [{ variantId: firstVariant, quantity: 2 }]);
    const cartId = await page.evaluate(() => localStorage.getItem('lucid-fourthwall-cart-v1'));
    assert(cartId);
    await page.locator('#merch-browse').click(); await catalog(page);
    await page.locator('.merch-card').nth(2).click(); await page.waitForSelector('#merch-variant');
    const secondName = await page.locator('.merch-product-info h2').innerText();
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#merch-cart-button').textContent === 'Cart (3)');
    await page.locator('#merch-cart-button').click(); await page.waitForSelector('.merch-cart-item');
    assert.equal(await page.locator('.merch-cart-item').count(), 2);
    assert.equal(await page.evaluate(() => localStorage.getItem('lucid-fourthwall-cart-v1')), cartId);
    await page.locator('.merch-cart-item').filter({ hasText: firstName }).locator('input').fill('3');
    await page.locator('.merch-cart-item').filter({ hasText: firstName }).getByRole('button', { name: 'Update', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#merch-cart-button').textContent === 'Cart (4)');
    await page.locator('.merch-cart-item').filter({ hasText: secondName }).getByRole('button', { name: 'Remove', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#merch-cart-button').textContent === 'Cart (3)');
    assert.equal(await page.locator('.merch-cart-item').count(), 1);
    await page.locator('#merch-browse').click(); await page.locator('.merch-card').nth(2).click(); await page.waitForSelector('#merch-variant');
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#merch-cart-button').textContent === 'Cart (4)');
    await page.reload({ waitUntil: 'domcontentloaded' }); await ready(page); await page.waitForSelector('#merch-variant');
    assert.equal(await page.evaluate(() => localStorage.getItem('lucid-fourthwall-cart-v1')), cartId);
    await page.locator('#merch-cart-button').click(); await page.waitForSelector('.merch-cart-item');
    assert.equal(await page.locator('.merch-cart-item').count(), 2);
    assert.equal(await page.locator('.merch-cart-item').filter({ hasText: firstName }).locator('input').inputValue(), '3');
    await page.screenshot({ path: output + '/cart-1280.png' });
    assert.equal(mutations.filter(m => m.path === '/v1/carts').length, 1);
    console.log('PASS: real color/size IDs, variant images, image viewer, duplicate guard, two products, quantity change, removal and refresh persist one cart.');

    assert.deepEqual(errors, [], 'No local console errors before checkout');
    await page.getByRole('button', { name: 'Checkout securely →', exact: true }).click();
    await page.waitForURL(url => url.hostname === 'lucid-confusion-creations-shop.fourthwall.com', { timeout: 45000 });
    const checkout = new URL(page.url()); assert.equal(checkout.searchParams.get('cartId'), cartId);
    assert.equal(checkout.searchParams.get('cartCurrency'), 'USD');
    await page.waitForLoadState('domcontentloaded');
    const blockedHeadless = (await page.locator('body').innerText()).includes('403 Forbidden');
    if (!blockedHeadless) {
      await page.getByText(firstName, { exact: false }).first().waitFor({ timeout: 45000 });
      await page.getByText(secondName, { exact: false }).first().waitFor({ timeout: 45000 });
    }
    await page.screenshot({ path: output + '/checkout.png', fullPage: true });
    fs.writeFileSync(output + '/live-summary.json', JSON.stringify({ products: expected.map(p => p.name), cartItems: 2, quantities: [3, 1], checkoutHost: checkout.hostname, purchasePlaced: false }, null, 2));
    console.log(blockedHeadless ? 'PASS: complete cart handed to official checkout URL. Headless browser receives 403; verify checkout contents in the in-app browser.' : 'PASS: official Fourthwall checkout renders BOTH products from the single cart. No purchase placed.');
    // External checkout scripts may emit their own telemetry errors; retain only local checks below.
    const localErrors = errors.filter(error => !/favicon|analytics|tracking|ERR_BLOCKED_BY_CLIENT/i.test(error));
    console.log('Browser error messages observed:', localErrors.length);
    if (localErrors.length) console.log(localErrors.slice(0, 3));
    await context.close();
    }

    if (!expected) {
      const { FourthwallStore } = await import('../merch-api.js');
      const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../merch-config.json'), 'utf8'));
      expected = await new FourthwallStore(config.storefrontToken).products();
    }

    if (!process.env.MERCH_CART_ONLY) {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 2560, height: 1440 }, { width: 3440, height: 1440 }, { width: 856, height: 654 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      const mobile = viewport.width < 900;
      const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const p = await ctx.newPage(), pageErrors = []; p.on('pageerror', e => pageErrors.push(e.message));
      p.on('response', r => { if (r.status() >= 400) console.log('HTTP status during layout:', r.status(), new URL(r.url()).pathname); });
      await p.goto(base + 'merch-shop/view/?debug=1', { waitUntil: 'domcontentloaded' }); await ready(p); await catalog(p); await images(p);
      assert(await p.locator('#merch-content').evaluate(e => e.scrollWidth === e.clientWidth), 'No horizontal content overflow');
      const frame = await p.locator('.merch-monitor').boundingBox();
      assert(frame.x >= 0 && Math.abs(frame.y) < 1);
      assert(frame.x + frame.width <= viewport.width + 1 && frame.y + frame.height <= viewport.height + 1);
      assert(Math.abs(frame.height - viewport.height) < 1, 'Shop fills the viewport from top to bottom');
      assert(Math.abs(frame.width - viewport.width) < 1, 'Shop fills the display width, including ultrawide screens');
      await p.screenshot({ path: output + `/catalog-${viewport.width}.png` });
      await p.locator('.merch-card').first().click(); await p.waitForSelector('#merch-variant');
      await p.locator('.merch-main-image img').evaluate(i => i.decode());
      await p.locator('#merch-quantity').scrollIntoViewIfNeeded();
      assert(await p.locator('#merch-quantity').isVisible());
      await p.screenshot({ path: output + `/options-${viewport.width}.png` });
      await p.locator('#screen-return').click(); await ready(p); assert.equal(new URL(p.url()).pathname, '/merch-shop/');
      await p.goForward(); await ready(p); await catalog(p);
      await p.goBack(); await ready(p); await p.locator('#screen-return').click(); await ready(p);
      assert.equal(new URL(p.url()).pathname, '/');
      assert(!await p.evaluate(() => document.body.classList.contains('merch-open')));
      assert.deepEqual(pageErrors, []);
      console.log(`PASS ${viewport.width}x${viewport.height}: frame, layout, usable options, Back to Cabinet/Arcade, browser history, no page errors.`);
      await ctx.close();
    }

    const failure = await browser.newPage({ reducedMotion: 'reduce' });
    await failure.route('**/v1/collections/all/products?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await failure.goto(base + 'merch-shop/view/?debug=1', { waitUntil: 'domcontentloaded' }); await ready(failure);
    await failure.getByText('The shop is taking a breather.').waitFor();
    assert.equal(await failure.locator('.merch-card').count(), 0);
    assert.equal(await failure.locator('.merch-store-link').getAttribute('href'), 'https://lucid-confusion-creations-shop.fourthwall.com/');
    await failure.locator('#screen-return').click(); await ready(failure);
    await failure.locator('#screen-return').click(); await ready(failure); assert.equal(new URL(failure.url()).pathname, '/');
    console.log('PASS: API failure has no stale products, offers official shop link, and preserves arcade navigation.');
    await failure.close();
    }
  } catch (error) {
    for (const context of browser.contexts()) for (const page of context.pages()) {
      if (page.url().startsWith(base)) {
        console.log('Failure state:', await page.locator('#merch-panel').innerText());
        await page.screenshot({ path: output + '/failure.png' });
      }
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message.replace(/ptkn_[\w-]+/g, '[redacted]')); process.exitCode = 1; });
