// Fourthwall's browser Storefront API; no catalog, price or image cache.
export const STORE_URL = 'https://lucid-confusion-creations-shop.fourthwall.com/';
export const CART_KEY = 'lucid-fourthwall-cart-v1';
const API = 'https://storefront-api.fourthwall.com/v1';
export const CURRENCY = 'USD';

export class StoreError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export function money(price) {
  if (!price || !Number.isFinite(price.value) || !price.currency) return 'Price unavailable';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency }).format(price.value); }
  catch { return 'Price unavailable'; }
}
export function available(product, variant) {
  return product?.state?.type === 'AVAILABLE' && !!variant?.id
    && Number.isFinite(variant.unitPrice?.value)
    && !!variant.stock && (variant.stock.type === 'UNLIMITED'
      || (variant.stock.type === 'LIMITED' && variant.stock.inStock > 0));
}
export function quantityLimit(variant) {
  return variant?.stock?.type === 'LIMITED' ? Math.max(0, Math.min(99, variant.stock.inStock)) : 99;
}
export function priceRange(product) {
  if (product.type === 'BUNDLE') return money(product.price);
  const prices = (product.variants || []).map(v => v.unitPrice).filter(p => Number.isFinite(p?.value));
  if (!prices.length) return 'Price unavailable';
  const low = prices.reduce((a, b) => a.value < b.value ? a : b);
  return (prices.some(p => p.value !== low.value) ? 'From ' : '') + money(low);
}

export class FourthwallStore {
  constructor(token, { fetcher = (url, options) => globalThis.fetch(url, options), storage } = {}) {
    this.token = token; this.fetcher = fetcher; this.storage = storage;
    this.cart = null; this.cartId = null; this.storageAvailable = true;
    this.expired = false; this.busy = false;
    if (!this.storage) {
      try { this.storage = globalThis.localStorage; }
      catch { this.storageAvailable = false; }
    }
  }
  readId() {
    try { this.cartId = this.storage.getItem(CART_KEY) || this.cartId; }
    catch { this.storageAvailable = false; }
    return this.cartId;
  }
  saveId(id) {
    this.cartId = id;
    try { if (id) this.storage.setItem(CART_KEY, id); else this.storage.removeItem(CART_KEY); }
    catch { this.storageAvailable = false; }
  }
  async request(path, body) {
    const url = new URL(API + path);
    url.searchParams.set('storefront_token', this.token);
    url.searchParams.set('currency', CURRENCY);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await this.fetcher(url.href, {
        method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
        cache: 'no-store', referrerPolicy: 'no-referrer',
        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      if (!response.ok) {
        const reason = response.status === 429 ? 'The shop is busy. Please wait a moment and retry.'
          : [400, 409, 422].includes(response.status) ? 'Fourthwall could not update these items. Check the cart, options and available quantities.'
          : [401, 403].includes(response.status) ? 'The shop connection is unavailable. Please use our official store.'
          : 'Could not reach the shop. Please try again or visit our official store.';
        throw new StoreError(reason, response.status);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof StoreError) throw error;
      // Never include the request URL (and its token) in diagnostics.
      throw new StoreError(body === undefined
        ? 'The shop did not respond. Please try again or visit our official store.'
        : 'The update could not be confirmed. View or refresh your cart before trying again.');
    } finally { clearTimeout(timer); }
  }
  async products() {
    const products = new Map();
    let page = 0;
    while (true) {
      const data = await this.request(`/collections/all/products?page=${page}&size=50`);
      if (!Array.isArray(data.results) || typeof data.paging?.hasNextPage !== 'boolean') throw new StoreError('The product list could not be read. Please try again.');
      for (const product of data.results) {
        if (!product.access || product.access.type === 'PUBLIC') products.set(product.id, product);
      }
      if (!data.paging.hasNextPage) return [...products.values()];
      if (!data.results.length || ++page > 1000) throw new StoreError('The full product list could not load. Please try again.');
    }
  }
  product(slug) { return this.request('/products/' + encodeURIComponent(slug)); }
  acceptCart(cart) {
    if (!cart?.id || !Array.isArray(cart.items)) throw new StoreError('The cart could not be read. Please refresh your cart.');
    this.cart = cart; this.saveId(cart.id); return cart;
  }
  async refreshCart() {
    const id = this.readId();
    if (!id) { this.cart = null; return null; }
    try { return this.acceptCart(await this.request('/carts/' + encodeURIComponent(id))); }
    catch (error) {
      if (error.status !== 404 && error.status !== 410) throw error;
      this.saveId(null); this.cart = null; this.expired = true; return null;
    }
  }
  async exclusive(action) {
    if (this.busy) throw new StoreError('A cart update is already in progress.');
    this.busy = true;
    try {
      // Coordinate cart creation and mutations in other tabs where supported.
      return globalThis.navigator?.locks
        ? await navigator.locks.request(CART_KEY, action) : await action();
    } finally { this.busy = false; }
  }
  async update(operation, items) {
    return this.exclusive(async () => {
      await this.refreshCart();
      if (!this.cart && operation !== 'add') throw new StoreError('Your previous cart has expired. Please add your items again.');
      if (!this.cart) this.acceptCart(await this.request('/carts', { currency: CURRENCY, items: [] }));
      // Do not retry POSTs: a lost response might still have changed the cart.
      const cart = await this.request(`/carts/${encodeURIComponent(this.cart.id)}/${operation}`, { items });
      return this.acceptCart(cart);
    });
  }
  async checkoutURL() {
    return this.exclusive(async () => {
      const cart = await this.refreshCart();
      if (!cart?.items.length) throw new StoreError('Your cart is empty. Add an item to continue.');
      const url = new URL('checkout/', STORE_URL);
      url.searchParams.set('cartCurrency', CURRENCY); url.searchParams.set('cartId', cart.id);
      return url.href;
    });
  }
}
