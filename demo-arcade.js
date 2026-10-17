const panel = document.querySelector('#demo-arcade-panel');
let resizeObserver;

function fitGame(game) {
  const width = panel.clientWidth, height = panel.clientHeight;
  if (!width || !height) return;
  // Keep the unmodified game's controls from overlapping in a small CRT.
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

export function showDemoArcade() {
  panel.hidden = false;
  if (panel.firstElementChild) return;
  const game = document.createElement('iframe');
  game.title = 'Lucid Logic Circuit Control';
  game.src = './games/lucid-logic/';
  game.addEventListener('load', () => {
    if (game.isConnected && !panel.hidden && !document.querySelector('#crt-content').hidden) {
      game.contentWindow.focus();
    }
  }, { once: true });
  fitGame(game);
  panel.append(game);
  resizeObserver = new ResizeObserver(() => fitGame(game));
  resizeObserver.observe(panel);
}

export function hideDemoArcade() {
  panel.hidden = true;
  unloadGame();
}

window.addEventListener('pagehide', unloadGame);
window.addEventListener('pageshow', event => {
  if (event.persisted && !panel.hidden && !document.querySelector('#crt-content').hidden) showDemoArcade();
});
