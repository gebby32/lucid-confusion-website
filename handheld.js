import { navigate, routeBack, gamePath } from './router.js';
import { typePreviewText } from './assets/arcade/preview-text.js';
import { createGameFullscreen } from './game-fullscreen.js';
const frame = document.querySelector('#handheld-frame');
const panel = document.querySelector('#handheld-panel');
const grid = document.querySelector('#handheld-grid');
const player = document.querySelector('#handheld-player');
const status = document.querySelector('#handheld-status');
const back = document.querySelector('#screen-return');
const gameViewport = document.querySelector('#handheld-game-viewport');
const gameBack = document.querySelector('#handheld-back');
const fullscreenStatus = document.querySelector('#handheld-fullscreen-status');
let shown = false, generation = 0, selected = null, selectedLink = null;
let catalogPromise;
let returning = false;
const fullscreen = createGameFullscreen({ player, viewport: gameViewport, status: fullscreenStatus, button: document.querySelector('#handheld-fullscreen'), handheld: true });

export const isHandheldPlaying = () => selected !== null;

function typingInitials(gameWindow) {
  // These original games accept F as a typed initial. Read their state without
  // changing their controls or source; never consume F during initials entry.
  return gameWindow?.MC?.G?.state === 'entry'
    || gameWindow?.SW?.App?.state === 'entry'
    || gameWindow?.CK?.Input?.textMode
    || gameWindow?.MH?.Input?.textMode;
}

function textEntryActive(event) {
  const element = event.target;
  if (element.isContentEditable || element.closest?.('input, textarea, select, [role="textbox"], [role="searchbox"], [role="combobox"]')) return true;
  const win = gameViewport.querySelector('iframe')?.contentWindow;
  if (!win) return false;
  // Also protect the original canvas-based initials screens, including games
  // that use a cursor rather than ordinary HTML inputs.
  const namespaces = ['CP', 'GK', 'GC', 'LT', 'MC', 'SM', 'SW', 'TT', 'CK', 'MH'];
  const entry = state => /^(entry|initials|name|name-entry|nameEntry)$/.test(state || '');
  if (entry(win.LP?.States?.current) || entry(win.FRUCTOSE?.S?.state)) return true;
  return namespaces.some(name => {
    const game = win[name];
    return game?.Input?.textMode || game?.input?.textMode
      || [game?.App, game?.app, game?.Game, game?.G].some(state => entry(state?.state));
  });
}

function returnKey(event) {
  if (!selected || event.key !== 'Backspace' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || textEntryActive(event)) return;
  // User-approved exceptions: private initials entry or native Backspace
  // gameplay actions. Reserve the key and retain button return.
  if (['sewer-halo', 'the-nudibranch', 'sloth-kart-racing', 'star-sloth-69', 'the-legend-of-emcee', 'soup-squirrel-the-ninja-squire', 'phoenix-thundercock-star-commander'].includes(selected.id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  backToHandhelds();
}

window.addEventListener('keydown', returnKey, true);

function fullscreenKey(event) {
  if (!selected || returning || event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey
    || event.key.toLowerCase() !== 'f'
    || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  const gameWindow = gameViewport.querySelector('iframe')?.contentWindow;
  if (typingInitials(gameWindow)) return;
  event.preventDefault();
  fullscreen.toggle();
}
window.addEventListener('keydown', fullscreenKey);
gameBack.addEventListener('click', () => backToHandhelds());

function stopGame() {
  // Reset presentation before unloading the game on navigation only.
  fullscreen.reset();
  gameViewport.replaceChildren(); player.hidden = true; selected = null;
  document.body.classList.remove('handheld-playing');
  fullscreenStatus.textContent = '';
}

function loadFrame() {
  if (!frame.hasAttribute('src')) frame.src = './assets/arcade/art/Retro%20Handheld%20Arcade.png';
  return frame.decode();
}

export async function handheldTeaser(draw) {
  await loadFrame();
  const canvas = document.createElement('canvas');
  canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
  typePreviewText(canvas, context => context.drawImage(frame, 0, 0), [
    { text: 'Retro Handheld Games', y: canvas.height * .47, size: 76 },
    { text: '<click to continue>', y: canvas.height * .58, size: 54 },
  ], draw);
}

export async function showHandhelds() {
  if (shown) {
    if (selected) gameViewport.querySelector('iframe')?.contentWindow?.focus();
    return;
  }
  shown = true;
  const current = ++generation;
  status.textContent = 'Loading games…'; status.hidden = false;
  try {
    catalogPromise ||= fetch('./assets/handhelds/catalog.json', { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    }).catch(error => { catalogPromise = null; throw error; });
    const games = await catalogPromise;
    if (!shown || current !== generation) return;
    const items = games.map(game => {
      const link = document.createElement('a');
      link.href = gamePath('retro-handheld', game.title) + '/';
      link.dataset.game = game.id;
      const image = document.createElement('img');
      image.src = game.image; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
      image.width = game.width; image.height = game.height;
      const title = document.createElement('span'); title.textContent = game.title;
      link.append(image, title);
      link.addEventListener('click', event => {
        if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (selected) return;
        navigate(gamePath('retro-handheld', game.title));
      });
      return link;
    });
    grid.replaceChildren(...items); status.hidden = true;
    grid.focus({ preventScroll: true });
  } catch {
    if (shown && current === generation) status.textContent = 'Games could not load. Go back and try again.';
  }
}

export function backToHandhelds() {
  if (!selected) return false;
  routeBack();
  return true;
}

export async function stopHandheld() {
  returning = true;
  try {
    stopGame();
    grid.hidden = false;
    selectedLink?.focus({ preventScroll: true });
  } finally { returning = false; }
}

export function hideHandhelds() {
  shown = false; generation++;
  stopGame(); selectedLink = null;
  grid.replaceChildren(); grid.hidden = false; status.hidden = true;
}

export async function launchHandheld(id) {
  await showHandhelds();
  const game = (await catalogPromise).find(game => game.id === id);
  const link = [...grid.querySelectorAll("a")].find(link => link.dataset.game === id);
  if (!game || !link || selected?.id === id) return;
  await stopHandheld();
  selected = game; selectedLink = link;
  const backImage = gameBack.querySelector('img');
  if (!backImage.hasAttribute('src')) backImage.src = './assets/arcade/art/back-to-arcade-transparent.png';
  const iframe = document.createElement('iframe');
  iframe.title = game.title; iframe.allow = 'autoplay; fullscreen; gamepad';
  iframe.src = game.url;
  iframe.addEventListener('load', () => {
    if (selected !== game) return;
    fullscreen.attach(iframe);
    // Bubble listener runs after the game's own handlers, so handled
    // keys stay with the game. The iframe is our same-origin portable file.
    iframe.contentWindow.addEventListener('keydown', fullscreenKey);
    iframe.contentWindow.addEventListener('keydown', returnKey, true);
    iframe.contentWindow.focus();
  });
  grid.hidden = true; player.hidden = false;
  document.body.classList.add('handheld-playing');
  gameViewport.replaceChildren(iframe);
}
