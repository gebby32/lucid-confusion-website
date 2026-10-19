import { navigate, routeBack } from './router.js';

const panel = document.querySelector('#demo-arcade-panel');
const crtContent = document.querySelector('#crt-content');
let resizeObserver;
let activeGame;
let activeFrame;
let activeViewport;

const games = [
  {
    id: 'lucid-logic',
    title: 'Lucid Logic Circuit Control',
    image: './assets/demo-arcade/lucid-logic.png',
    src: './games/lucid-logic/',
  },
  {
    id: 'custom-color-cube',
    title: 'Custom Color Cube Puzzle',
    image: './assets/demo-arcade/custom-color-cube.png',
    src: './games/custom-color-cube/',
  },
  {
    id: 'confusion-derby-lucid-raceway',
    title: 'Confusion Derby: Lucid Raceway',
    image: './assets/demo-arcade/confusion-derby.png',
    src: './games/confusion-derby-lucid-raceway/',
  },
];

const selectionPath = '/demo-arcade/view';
const gamePath = game => `${selectionPath}/${game.id}`;

function imageButton(className, label, source, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `demo-image-button ${className}`;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  const image = document.createElement('img');
  image.src = source;
  image.alt = label;
  image.draggable = false;
  button.append(image);
  return button;
}

function fitGame() {
  if (!activeFrame || !activeViewport) return;
  const width = activeViewport.clientWidth, height = activeViewport.clientHeight;
  if (!width || !height) return;
  // Keep each unmodified game usable inside the smaller CRT viewport.
  const scale = Math.min(1, width / 640);
  activeFrame.style.width = `${width / scale}px`;
  activeFrame.style.height = `${height / scale}px`;
  activeFrame.style.transform = `scale(${scale})`;
}

function setExpanded(expanded) {
  crtContent.classList.toggle('demo-game-expanded', expanded);
  panel.querySelector('.demo-game-player')?.classList.toggle('expanded', expanded);
  requestAnimationFrame(fitGame);
}

function unloadGame() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  activeGame = null;
  activeFrame = null;
  activeViewport = null;
  setExpanded(false);
  // Removing the browsing context stops the game's audio, timers and input.
  panel.replaceChildren();
}

function showGameSelection() {
  unloadGame();
  const grid = document.createElement('div');
  grid.className = 'demo-game-grid';
  grid.setAttribute('aria-label', 'Choose a Demo Arcade game');

  for (const game of games) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'demo-game-tile';
    tile.setAttribute('aria-label', `Play ${game.title}`);
    const image = document.createElement('img');
    image.src = game.image;
    image.alt = game.title;
    image.draggable = false;
    tile.append(image);
    tile.addEventListener('click', () => navigate(gamePath(game)));
    grid.append(tile);
  }

  const comingSoon = document.createElement('div');
  comingSoon.className = 'demo-game-tile demo-coming-soon';
  comingSoon.setAttribute('aria-label', 'Coming Soon');
  comingSoon.innerHTML = '<span>COMING</span><strong>SOON</strong>';
  grid.append(comingSoon);
  panel.append(grid);
  grid.querySelector('button')?.focus({ preventScroll: true });
}

function launchGame(game) {
  unloadGame();
  activeGame = game;
  const player = document.createElement('div');
  player.className = 'demo-game-player';

  const toolbar = document.createElement('div');
  toolbar.className = 'demo-game-toolbar';
  const backToGames = imageButton(
    'demo-games-back',
    'Back to Games',
    './assets/demo-arcade/back-to-games.png',
    () => routeBack(selectionPath),
  );
  const expand = imageButton(
    'demo-game-expand',
    'Full Screen',
    './assets/demo-arcade/full-screen.png',
    () => navigate(`${gamePath(game)}/fullscreen`),
  );
  const collapse = imageButton(
    'demo-game-collapse',
    'Back',
    './assets/demo-arcade/back.png',
    () => routeBack(gamePath(game)),
  );
  toolbar.append(backToGames, expand, collapse);

  activeViewport = document.createElement('div');
  activeViewport.className = 'demo-game-viewport';
  activeFrame = document.createElement('iframe');
  activeFrame.title = game.title;
  activeFrame.src = game.src;
  activeFrame.allow = 'fullscreen';
  activeFrame.addEventListener('load', () => {
    if (activeFrame?.isConnected && !panel.hidden && !crtContent.hidden) {
      activeFrame.contentWindow.focus();
    }
  }, { once: true });
  activeViewport.append(activeFrame);
  player.append(toolbar, activeViewport);
  panel.append(player);
  fitGame();
  resizeObserver = new ResizeObserver(fitGame);
  resizeObserver.observe(activeViewport);
}

export function showDemoArcade(route) {
  panel.hidden = false;
  const game = games.find(entry => entry.id === route.demoGame);
  if (!game) {
    if (!panel.querySelector('.demo-game-grid')) showGameSelection();
    return;
  }
  if (activeGame?.id !== game.id || !activeFrame?.isConnected) launchGame(game);
  setExpanded(!!route.demoExpanded);
}

export function hideDemoArcade() {
  panel.hidden = true;
  unloadGame();
}

window.addEventListener('pagehide', unloadGame);
window.addEventListener('pageshow', event => {
  if (!event.persisted || panel.hidden || crtContent.hidden) return;
  const match = location.pathname.match(/^\/demo-arcade\/view\/([^/]+)(\/fullscreen)?\/?$/);
  showDemoArcade({ demoGame: match?.[1], demoExpanded: !!match?.[2] });
});
