import { routes } from './routes.js';

const canonical = path => path.replace(/\/+$/, '') || '/';
export const gamePath = (cabinet, title) => `/${cabinet}/games/${title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
let current, render, pending = false, revision = 0, busy = false, traversing = false;
const marker = 'lucid-routing-v1';
// Match GitHub Pages' directory URLs. Redirecting a slashless URL on refresh
// can discard history.state, which would incorrectly seed the parents again.
const url = path => (path === '/' ? path : path + '/') + location.search;
const entry = path => ({ lucidRouter: marker, path });

async function restore() {
  if (busy || !render) return;
  busy = true;
  document.documentElement.dataset.routing = 'busy';
  try {
    do {
      pending = false;
      const version = revision;
      await render(routes[current], () => version !== revision);
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
  document.title = routes[path].title ? `${routes[path].title} | Lucid Confusion Creations` : 'Lucid Confusion Creations';
  revision++; pending = true;
  void restore();
}
export function navigate(path) {
  if (traversing || !routes[path] || current === path) return;
  history.pushState(entry(path), '', url(path));
  update(path);
}
export function routeBack(path = routes[current]?.parent) {
  if (traversing || !path || path === current) return;
  // Every entry is built from its actual parent chain, including fresh deep links.
  let cursor = current, steps = 0;
  while (cursor && cursor !== path) { cursor = routes[cursor]?.parent; steps++; }
  if (cursor === path) { traversing = true; history.go(-steps); }
  else navigate(path);
}
export async function startRouter(adapter) {
  render = adapter;
  let path = canonical(location.pathname);
  if (!routes[path]) path = '/';
  // Reloads retain their existing history; a fresh external deep entry receives
  // one synthetic ancestor per meaningful level, leaving the previous site intact.
  if (history.state?.lucidRouter !== marker || history.state.path !== path) {
    const chain = [];
    for (let cursor = path; cursor; cursor = routes[cursor].parent) chain.unshift(cursor);
    history.replaceState(entry('/'), '', url('/'));
    for (const ancestor of chain.slice(1)) history.pushState(entry(ancestor), '', url(ancestor));
  } else history.replaceState(entry(path), '', url(path));
  window.addEventListener('popstate', () => {
    traversing = false;
    const destination = canonical(location.pathname);
    if (routes[destination]) update(destination);
  });
  update(path);
}
