import { routes } from './routes.js';

const canonical = path => path.replace(/\/+$/, '') || '/';
export const gamePath = (cabinet, title) => `/${cabinet}/games/${title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
let current, render, trail = [], pending = false, revision = 0, busy = false, traversing = false;
const marker = 'lucid-routing-v1';
const merchBase = '/merch-shop/view';
export function merchPath({ product, cart = false, expanded = false } = {}) {
  const query = new URLSearchParams();
  if (cart) query.set('cart', '1');
  else if (product) {
    query.set('product', product);
    if (expanded) query.set('image', 'expanded');
  }
  return merchBase + (query.size ? '?' + query : '');
}
function destination(input) {
  const parsed = new URL(input, location.origin), path = canonical(parsed.pathname);
  const route = routes[path];
  if (!route) return null;
  if (path === merchBase) {
    const cart = parsed.searchParams.get('cart') === '1';
    const product = cart ? null : parsed.searchParams.get('product');
    const expanded = !!product && parsed.searchParams.get('image') === 'expanded';
    if (cart || product) return {
      path: merchPath({ product, cart, expanded }),
      route: { ...route, parent: expanded ? merchPath({ product }) : merchBase, merch: { product, cart, expanded }, title: cart ? 'Your cart | Merch Shop' : route.title }
    };
  }
  return { path, route };
}
// Match GitHub Pages' directory URLs. Redirecting a slashless URL on refresh
// can discard history.state, which would incorrectly seed the parents again.
const url = path => {
  const parsed = new URL(path, location.origin), query = new URLSearchParams(location.search);
  for (const key of ['product', 'cart', 'image']) query.delete(key);
  for (const [key, value] of parsed.searchParams) query.set(key, value);
  return (parsed.pathname === '/' ? '/' : canonical(parsed.pathname) + '/') + (query.size ? '?' + query : '');
};
const entry = path => ({ lucidRouter: marker, path, trail: [...trail] });

async function restore() {
  if (busy || !render) return;
  busy = true;
  document.documentElement.dataset.routing = 'busy';
  try {
    do {
      pending = false;
      const version = revision;
      await render(destination(current).route, () => version !== revision);
    } while (pending);
  } catch (error) {
    console.error('Could not restore arcade route', error);
    document.querySelector('#announcement').textContent = 'This section could not load. Reload to retry.';
  } finally {
    busy = false;
    document.documentElement.dataset.routing = 'ready';
  }
}
function update(path) {
  current = path;
  const route = destination(path).route;
  document.title = route.title ? `${route.title} | Lucid Confusion Creations` : 'Lucid Confusion Creations';
  revision++; pending = true;
  void restore();
}
export function navigate(path) {
  const next = destination(path);
  if (traversing || !next || current === next.path) return;
  path = next.path;
  trail = [...trail, path];
  history.pushState(entry(path), '', url(path));
  update(path);
}
export function routeBack(path = destination(current)?.route.parent) {
  if (traversing || !path || path === current) return;
  // Use the visited entries, not logical depth: a cart can follow any product.
  const index = trail.lastIndexOf(path, trail.length - 2);
  if (index >= 0) { traversing = true; history.go(index - (trail.length - 1)); }
  else navigate(path);
}
export async function startRouter(adapter) {
  render = adapter;
  const path = destination(location.href)?.path || '/';
  // Reloads retain their existing history; a fresh external deep entry receives
  // one synthetic ancestor per meaningful level, leaving the previous site intact.
  if (history.state?.lucidRouter !== marker || history.state.path !== path) {
    const chain = [];
    for (let cursor = path; cursor; cursor = destination(cursor).route.parent) chain.unshift(cursor);
    trail = ['/'];
    history.replaceState(entry('/'), '', url('/'));
    for (const ancestor of chain.slice(1)) {
      trail.push(ancestor); history.pushState(entry(ancestor), '', url(ancestor));
    }
  } else {
    trail = Array.isArray(history.state.trail) ? history.state.trail : [path];
    history.replaceState(entry(path), '', url(path));
  }
  window.addEventListener('popstate', () => {
    traversing = false;
    const next = destination(location.href);
    if (next) {
      trail = Array.isArray(history.state?.trail) ? history.state.trail : [next.path];
      update(next.path);
    }
  });
  update(path);
}
