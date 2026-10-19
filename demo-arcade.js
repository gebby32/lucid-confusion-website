const panel = document.querySelector('#demo-arcade-panel');
let resizeObserver;

const games = [
  {
    title: 'Lucid Logic Circuit Control',
    image: './assets/demo-arcade/lucid-logic.png',
    src: './games/lucid-logic/',
  },
  {
    title: 'Custom Color Cube Puzzle',
    image: './assets/demo-arcade/custom-color-cube.png',
    src: './games/custom-color-cube/',
  },
  {
    title: 'Confusion Derby: Lucid Raceway',
    image: './assets/demo-arcade/confusion-derby.png',
    src: './games/confusion-derby-lucid-raceway/',
  },
];

function fitGame(game, viewport) {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  if (!width || !height) return;
  // Keep each unmodified game usable inside the smaller CRT viewport.
  const scale = Math.min(1, width / 640);
  game.style.width = `${width / scale}px`;
  game.style.height = `${height / scale}px`;
  game.style.transform = `scale(${scale})`;
}

function unloadGame() {
  resizeObserver?.disconnect();
  resizeObserver = null;
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
    tile.addEventListener('click', () => launchGame(game));
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
  const player = document.createElement('div');
  player.className = 'demo-game-player';

  const toolbar = document.createElement('div');
  toolbar.className = 'demo-game-toolbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'demo-games-back';
  back.textContent = 'Back to Games';
  back.addEventListener('click', showGameSelection);
  toolbar.append(back);

  const viewport = document.createElement('div');
  viewport.className = 'demo-game-viewport';
  const frame = document.createElement('iframe');
  frame.title = game.title;
  frame.src = game.src;
  frame.allow = 'fullscreen';
  frame.addEventListener('load', () => {
    if (frame.isConnected && !panel.hidden && !document.querySelector('#crt-content').hidden) {
      frame.contentWindow.focus();
    }
  }, { once: true });
  viewport.append(frame);
  player.append(toolbar, viewport);
  panel.append(player);
  fitGame(frame, viewport);
  resizeObserver = new ResizeObserver(() => fitGame(frame, viewport));
  resizeObserver.observe(viewport);
}

export function showDemoArcade() {
  panel.hidden = false;
  if (!panel.firstElementChild) showGameSelection();
}

export function hideDemoArcade() {
  panel.hidden = true;
  unloadGame();
}

window.addEventListener('pagehide', unloadGame);
window.addEventListener('pageshow', event => {
  if (event.persisted && !panel.hidden && !document.querySelector('#crt-content').hidden) showDemoArcade();
});
