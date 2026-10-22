import { FourthwallStore, STORE_URL, CART_KEY, money, available, quantityLimit, priceRange } from './merch-api.js';
import { navigate, routeBack, merchPath } from './router.js';

const panel = document.querySelector('#merch-panel');
const content = document.querySelector('#merch-content');
const status = document.querySelector('#merch-status');
const cartButton = document.querySelector('#merch-cart-button');
let store, products = [], screen = 'catalog', selected, busy = false, revision = 0, catalogReady = false, shopRoute = {};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, action, className = '') {
  const node = el('button', className, text); node.type = 'button';
  node.addEventListener('click', action); return node;
}
function officialLink(text = 'Visit our official Fourthwall store') {
  const link = el('a', 'merch-store-link', text); link.href = STORE_URL; return link;
}
function imageURL(image) {
  try { const url = new URL(image?.transformedUrl || image?.url); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
}
function productImage(image, alt, eager = false) {
  const node = el('img'); node.alt = alt; node.loading = eager ? 'eager' : 'lazy'; node.decoding = 'async';
  const url = imageURL(image);
  if (url) node.src = url;
  else node.alt = 'Image unavailable — ' + alt;
  node.addEventListener('error', () => { node.removeAttribute('src'); node.alt = 'Image unavailable — ' + alt; }, { once: true });
  const surface = el('span', 'merch-product-image');
  surface.append(node);
  return surface;
}
function notify(text, error = false) {
  status.replaceChildren(); status.hidden = !text;
  status.classList.toggle('merch-error', error);
  if (text) status.append(el('span', '', text));
  if (error) status.append(officialLink('Shop on Fourthwall'));
}
function cartBadge() {
  const count = store?.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  cartButton.textContent = `Cart (${count})`;
  cartButton.setAttribute('aria-label', `View cart, ${count} items`);
}
function beginView(next, focus = true) {
  screen = next; revision++; content.replaceChildren(); content.scrollTop = 0;
  panel.dataset.screen = next;
  if (focus && !panel.hidden) content.focus({ preventScroll: true });
  return revision;
}
function emptyState(title, copy, retry) {
  const box = el('div', 'merch-empty');
  box.append(el('h2', '', title), el('p', '', copy));
  if (retry) box.append(button('Try again', retry));
  box.append(officialLink()); content.append(box);
}
function loading(text) {
  const node = el('p', 'merch-loading', text); node.setAttribute('role', 'status'); content.append(node);
}
function persistenceNotice() {
  if (!store.storageAvailable) notify('Your browser is blocking cart storage. Keep this page open to retain your cart.');
  else if (store.expired) { notify('Your previous cart expired. Please add your items again.'); store.expired = false; }
}

async function connect() {
  if (store) return store;
  try {
    const response = await fetch('./merch-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const config = await response.json();
    if (typeof config.storefrontToken !== 'string' || !config.storefrontToken.trim()) throw new Error();
    store = new FourthwallStore(config.storefrontToken.trim()); return store;
  } catch { throw new Error('The arcade shop is not connected yet. You can still browse and purchase in our official store.'); }
}
async function loadShop() {
  const version = beginView('catalog', false); notify(''); loading('Loading the latest merch…');
  catalogReady = false;
  try {
    await connect();
    const [catalog, cart] = await Promise.allSettled([store.products(), store.refreshCart()]);
    if (catalog.status === 'rejected') throw catalog.reason;
    products = catalog.value; catalogReady = true; cartBadge();
    if (version !== revision) return;
    renderCatalog(false);
    if (cart.status === 'rejected') notify('Your saved cart could not be refreshed. Open Cart to try again; its ID is preserved.', true);
    else persistenceNotice();
  } catch (error) {
    if (version !== revision) return;
    content.replaceChildren(); emptyState('The shop is taking a breather.', error.message, () => { void loadShop(); });
  }
}
export function showMerch({ merch = {} } = {}) {
  shopRoute = merch;
  const wasHidden = panel.hidden;
  panel.hidden = false;
  if (!wasHidden && merch.product && screen === 'product' && selected?.slug === merch.product && content.querySelector('.merch-gallery')) {
    setImageExpanded(!!merch.expanded);
  } else refreshShop();
}
export function hideMerch() { panel.hidden = true; revision++; }
function refreshShop() {
  if (shopRoute.cart) void viewCart();
  else if (shopRoute.product) void openProduct({ slug: shopRoute.product }, !!shopRoute.expanded);
  else void loadShop();
}
function browseMerch() { if (!busy) routeBack(merchPath()); }
function setImageExpanded(expanded) {
  content.querySelector('.merch-gallery')?.classList.toggle('merch-image-expanded', expanded);
  const imageButton = content.querySelector('.merch-main-image');
  imageButton?.setAttribute('aria-pressed', String(expanded));
  imageButton?.setAttribute('aria-label', expanded ? 'Reduce product image' : 'Enlarge product image');
}

function renderCatalog(focus = true) {
  beginView('catalog', focus);
  if (!catalogReady) { void loadShop(); return; }
  const header = el('div', 'merch-catalog-heading');
  header.append(el('h2', '', 'Wear the confusion'), el('span', 'merch-muted', `${products.length} products · Prices in USD`));
  content.append(header);
  if (!products.length) { emptyState('New merch is on its way.', 'There are no public products available right now.'); return; }
  const grid = el('div', 'merch-grid');
  for (const product of products) {
    const card = button('', () => { if (!busy) navigate(merchPath({ product: product.slug })); }, 'merch-card');
    card.setAttribute('aria-label', `${product.name}, ${priceRange(product)}. View product`);
    card.append(productImage(product.images?.[0], product.name), el('h3', '', product.name));
    const meta = el('div', 'merch-card-meta');
    meta.append(el('span', 'merch-price', priceRange(product)));
    if (product.state?.type !== 'AVAILABLE') meta.append(el('span', 'merch-muted', 'Unavailable'));
    else meta.append(el('span', 'merch-muted', 'View options →'));
    card.append(meta); grid.append(card);
  }
  content.append(grid);
}

// Rebuild a small, inert formatting allowlist; API HTML never enters the live DOM.
function description(html) {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  const host = el('div', 'merch-description');
  const allowed = new Set(['P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'B', 'I', 'H3', 'H4']);
  function copy(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) { parent.append(document.createTextNode(node.textContent)); return; }
    if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG'].includes(node.tagName)) return;
    const target = allowed.has(node.tagName) ? el(node.tagName.toLowerCase()) : document.createDocumentFragment();
    for (const child of node.childNodes) copy(child, target);
    parent.append(target);
  }
  for (const node of parsed.body.childNodes) copy(node, host);
  return host;
}
async function openProduct(product, expanded = false) {
  const version = beginView('product'); notify('');
  content.append(button('← All merch', browseMerch, 'merch-text-button')); loading('Loading product details…');
  try {
    await connect();
    const [details, cart] = await Promise.allSettled([store.product(product.slug), store.refreshCart()]);
    if (version !== revision) return;
    if (details.status === 'rejected') throw details.reason;
    const fresh = details.value;
    selected = fresh;
    products = products.map(p => p.id === fresh.id ? fresh : p);
    renderProduct();
    setImageExpanded(expanded);
    cartBadge();
    if (cart.status === 'rejected') notify('Your saved cart could not be refreshed. Open Cart to try again; its ID is preserved.', true);
  } catch (error) {
    if (version !== revision) return;
    content.replaceChildren(button('← All merch', browseMerch, 'merch-text-button'));
    emptyState('Product unavailable', error.message, refreshShop);
  }
}
function renderProduct() {
  content.replaceChildren(button('← All merch', browseMerch, 'merch-text-button'));
  const product = selected, variants = product.variants || [];
  const layout = el('div', 'merch-detail');
  const gallery = el('div', 'merch-gallery');
  const imageButton = button('', () => {
    if (gallery.classList.contains('merch-image-expanded')) routeBack(merchPath({ product: product.slug }));
    else navigate(merchPath({ product: product.slug, expanded: true }));
  }, 'merch-main-image');
  imageButton.setAttribute('aria-label', 'Enlarge product image'); imageButton.setAttribute('aria-pressed', 'false');
  const thumbs = el('div', 'merch-thumbs'); gallery.append(imageButton, thumbs);
  let galleryKey;
  function showImages(variant) {
    const images = variant?.images?.length ? variant.images : product.images || [];
    const key = images.map(i => i.id || i.url).join('|');
    if (key === galleryKey) return; galleryKey = key;
    imageButton.replaceChildren(productImage(images[0], product.name, true)); thumbs.replaceChildren();
    for (const [index, image] of images.entries()) {
      const thumbnail = button('', () => {
        imageButton.replaceChildren(productImage(image, `${product.name}, image ${index + 1}`, true));
        for (const child of thumbs.children) child.setAttribute('aria-pressed', String(child === thumbnail));
      }, 'merch-thumb');
      thumbnail.setAttribute('aria-label', `View image ${index + 1}`); thumbnail.setAttribute('aria-pressed', String(index === 0));
      thumbnail.append(productImage(image, '', false)); thumbs.append(thumbnail);
    }
  }
  const info = el('div', 'merch-product-info');
  const price = el('div', 'merch-detail-price');
  const availability = el('p', 'merch-availability'); availability.setAttribute('aria-live', 'polite');
  info.append(el('h2', '', product.name), price, availability);
  layout.append(gallery, info); content.append(layout);
  if (!variants.length || product.type === 'BUNDLE') {
    showImages(); price.textContent = priceRange(product);
    availability.textContent = product.state?.type === 'AVAILABLE' ? 'Available in our official store' : 'Currently unavailable';
    const link = officialLink('Choose options on Fourthwall'); link.href = new URL('products/' + encodeURIComponent(product.slug), STORE_URL).href;
    info.append(description(product.description), link); return;
  }
  let current = variants.find(v => available(product, v)) || variants[0];
  const form = el('form', 'merch-options');
  const fields = el('fieldset'); fields.append(el('legend', 'visually-hidden', 'Choose product options'));
  const colorName = v => v.attributes?.color?.name || '';
  const colors = [...new Set(variants.map(colorName).filter(Boolean))];
  const color = el('select'); color.id = 'merch-color';
  if (colors.length) {
    for (const name of colors) { const opt = el('option', '', name); opt.value = name; color.append(opt); }
    color.value = colorName(current);
    const label = el('label', '', 'Color'); label.htmlFor = color.id; label.append(color); fields.append(label);
  }
  const variant = el('select'); variant.id = 'merch-variant';
  const variantLabel = el('label', '', variants.some(v => v.attributes?.size?.name) ? 'Size' : 'Option');
  variantLabel.htmlFor = variant.id; variantLabel.append(variant); fields.append(variantLabel);
  const qty = el('input'); qty.id = 'merch-quantity'; qty.type = 'number'; qty.min = '1'; qty.max = '99'; qty.step = '1'; qty.value = '1'; qty.required = true; qty.inputMode = 'numeric';
  const qtyLabel = el('label', '', 'Quantity'); qtyLabel.htmlFor = qty.id; qtyLabel.append(qty); fields.append(qtyLabel);
  const add = el('button', 'merch-primary', 'Add to Cart'); add.type = 'submit'; fields.append(add); form.append(fields); info.append(form);
  function updateVariant() {
    current = variants.find(v => v.id === variant.value);
    price.textContent = money(current?.unitPrice);
    const canBuy = available(product, current);
    availability.textContent = canBuy ? (current.stock.type === 'LIMITED' ? `${current.stock.inStock} available` : 'Available') : 'This option is currently unavailable';
    qty.max = String(quantityLimit(current));
    if (+qty.value > +qty.max && +qty.max > 0) qty.value = qty.max;
    add.disabled = !canBuy; add.dataset.unavailable = String(!canBuy);
    showImages(current);
  }
  function updateOptions() {
    const previousSize = current?.attributes?.size?.name;
    const choices = variants.filter(v => !colors.length || colorName(v) === color.value);
    variant.replaceChildren();
    for (const choice of choices) {
      const label = choice.attributes?.size?.name || choice.attributes?.description || choice.name || 'Default';
      const opt = el('option', '', label + (available(product, choice) ? '' : ' — unavailable'));
      opt.value = choice.id; variant.append(opt);
    }
    variant.value = (choices.find(v => v.attributes?.size?.name === previousSize && available(product, v))
      || choices.find(v => available(product, v)) || choices[0])?.id || '';
    updateVariant();
  }
  color.addEventListener('change', updateOptions); variant.addEventListener('change', updateVariant);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy || !form.reportValidity() || !available(product, current)) return;
    const quantity = Number(qty.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > quantityLimit(current)) return;
    void cartAction(async () => {
      await store.update('add', [{ variantId: current.id, quantity }]); cartBadge();
      notify(`Added ${quantity} to your cart.`); persistenceNotice();
    }, 'Adding…');
  });
  info.append(description(product.description));
  for (const detail of product.additionalInformation || []) {
    const details = el('details'); details.append(el('summary', '', detail.title), description(detail.bodyHtml)); info.append(details);
  }
  updateOptions();
}

async function cartAction(action, label = 'Updating cart…') {
  if (busy) return;
  busy = true;
  panel.setAttribute('aria-busy', 'true');
  const controls = [...panel.querySelectorAll('button, input, select, fieldset')];
  const previouslyDisabled = new Set(controls.filter(node => node.disabled));
  for (const control of controls) control.disabled = true;
  notify(label);
  try { await action(); }
  catch (error) { notify(error.message, true); }
  finally {
    busy = false; panel.removeAttribute('aria-busy');
    for (const control of controls) control.disabled = previouslyDisabled.has(control);
    cartBadge();
  }
}
async function viewCart() {
  const version = beginView('cart'); notify(''); loading('Refreshing your cart…');
  try {
    await connect(); await store.refreshCart();
    if (version !== revision) return;
    renderCart(); persistenceNotice();
  } catch (error) {
    if (version !== revision) return;
    content.replaceChildren(button('← Continue shopping', browseMerch, 'merch-text-button'));
    emptyState('Your cart could not be refreshed.', error.message, () => { void viewCart(); });
  }
}
function renderCart() {
  if (screen !== 'cart' || panel.hidden) return;
  content.replaceChildren(button('← Continue shopping', browseMerch, 'merch-text-button'), el('h2', '', 'Your cart'));
  cartBadge();
  if (!store.cart?.items.length) { emptyState('A little empty in here.', 'Find something that feels like you.'); return; }
  const items = store.cart.items, list = el('div', 'merch-cart-list');
  for (const [index, item] of items.entries()) {
    const variant = item.variant;
    const row = el('article', 'merch-cart-item');
    row.append(productImage(variant.images?.[0], variant.product?.name || variant.name));
    const info = el('div', 'merch-cart-item-info');
    info.append(el('h3', '', variant.product?.name || variant.name), el('p', 'merch-muted', variant.attributes?.description || variant.name), el('p', 'merch-price', money(variant.unitPrice) + ' each'));
    if (item.groupedBy?.type === 'BUNDLE') info.append(el('p', 'merch-muted', 'Bundle item — edit this bundle on Fourthwall.'));
    const form = el('form', 'merch-cart-controls');
    const qty = el('input'); qty.type = 'number'; qty.min = '1'; qty.max = String(Math.max(item.quantity, quantityLimit(variant))); qty.step = '1'; qty.required = true; qty.value = item.quantity; qty.inputMode = 'numeric'; qty.id = `merch-cart-qty-${index}`;
    const label = el('label', '', 'Quantity'); label.htmlFor = qty.id; label.append(qty);
    const update = el('button', '', 'Update'); update.type = 'submit';
    const remove = button('Remove', () => {
      void cartAction(async () => {
        await store.update('remove', [{ variantId: variant.id, quantity: item.quantity }]);
        renderCart(); notify('Item removed.');
      });
    }, 'merch-text-button');
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (busy || !form.reportValidity() || !Number.isInteger(+qty.value)) return;
      void cartAction(async () => {
        await store.update('change', [{ variantId: variant.id, quantity: +qty.value }]);
        renderCart(); notify('Cart updated.');
      });
    });
    form.append(label, update, remove);
    if (item.groupedBy?.type === 'BUNDLE') { qty.disabled = true; update.disabled = true; remove.disabled = true; }
    info.append(form); row.append(info); list.append(row);
  }
  content.append(list);
  const summary = el('div', 'merch-cart-summary');
  const currency = items[0].variant.unitPrice?.currency;
  const canTotal = items.every(i => !i.groupedBy && Number.isFinite(i.variant.unitPrice?.value) && i.variant.unitPrice.currency === currency);
  if (canTotal) {
    const subtotal = items.reduce((sum, i) => sum + Math.round(i.variant.unitPrice.value * 100) * i.quantity, 0) / 100;
    summary.append(el('p', 'merch-subtotal', 'Subtotal ' + money({ value: subtotal, currency })));
  }
  summary.append(el('p', 'merch-muted', 'Shipping, taxes and any discounts are calculated at checkout.'));
  summary.append(button('Checkout securely →', () => {
    void cartAction(async () => {
      const url = await store.checkoutURL(); window.location.assign(url);
    }, 'Opening secure checkout…');
  }, 'merch-primary'));
  summary.append(el('p', 'merch-muted', 'Your entire cart continues to Fourthwall for payment and fulfillment.'));
  content.append(summary);
}
document.querySelector('#merch-browse').addEventListener('click', browseMerch);
cartButton.addEventListener('click', () => { if (!busy) navigate(merchPath({ cart: true })); });
document.querySelector('#merch-arcade-return').addEventListener('click', () => routeBack('/'));
document.querySelector('#merch-refresh').addEventListener('click', () => { if (!busy) refreshShop(); });
// Shop keyboard activity must not trigger the cabinet's double-tap handler.
panel.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (panel.querySelector('.merch-image-expanded')) {
    event.stopPropagation(); panel.querySelector('.merch-main-image').click();
  } else if (screen !== 'catalog' && !busy) { event.stopPropagation(); routeBack(); }
});
window.addEventListener('storage', event => {
  if (event.key === CART_KEY && store && !busy && !panel.hidden) {
    store.cartId = event.newValue;
    if (screen === 'cart') void viewCart();
    else store.refreshCart().then(cartBadge).catch(() => notify('Cart changed in another tab. Open Cart to refresh.', true));
  }
});
