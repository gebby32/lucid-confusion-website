/* MAIN — wires the game into Plumbing and starts the loop.
   Picture pipeline per frame:
     1. the NES world renders into the 256x192 LCD canvas (pixel art)
     2. Plumbing scales it up with nearest-neighbour (crisp pixels)
     3. LP.LCD.post (below) then paints, at FULL output resolution:
          title / select art -> optional scanlines (world only) -> Slub & Slob (hi-res)
          -> the front pixel layer (HUD, text, popups), scaled crisp again. */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  Sprites.init();
  G.g = LP.LCD.ctx;
  G.fg = G.canvas(256, 192);
  G.fgc = G.fg.getContext('2d');
  Screens.applySettings();
  const msg = document.getElementById('boot-msg');
  if (msg) msg.remove();

  let scan = null, scanK = 0;
  function scanlines(k) {
    if (k < 3) return null;
    if (scan && scanK === k) return scan;
    scanK = k; scan = document.createElement('canvas'); scan.width = 256 * k; scan.height = 192 * k;
    const g = scan.getContext('2d'), band = Math.max(1, Math.floor(k / 3));
    g.fillStyle = 'rgba(0,0,0,0.28)';
    for (let y = 0; y < 192; y++) g.fillRect(0, y * k + k - band, 256 * k, band);
    return scan;
  }
  LP.LCD.post = (octx, k) => {
    if (Screens.art) Screens.art(octx, k);
    if (LP.Settings.get('scanlines') && !Screens.art) { const s = scanlines(k); if (s) octx.drawImage(s, 0, 0); }
    Sloths.flush(octx, k, LP.FX.sx, LP.FX.sy);
    octx.imageSmoothingEnabled = false;
    octx.drawImage(G.fg, 0, 0, 256 * k, 192 * k);
  };

  LP.Loop.start(
    (dt) => {
      LP.Pad.poll();
      const I = LP.Input;
      if (!LP.States.is('entry')) {                        // letters are letters while typing initials
        if (I.consume('mute')) LP.Audio.toggleMute();
        if (I.consume('fullscreen')) LP.Shell.toggleFullscreen();
      }
      LP.States.update(dt);
    },
    () => {
      Sloths.clear();
      G.fgc.clearRect(0, 0, 256, 192);
      G.g = LP.LCD.ctx;
      LP.States.render(LP.LCD.ctx);
    }
  );

  // pause automatically when the tab / window is backgrounded
  const autoPause = () => { if (LP.States.is('game')) LP.States.go('paused'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  // keep the picture fitted even when a browser / embed skips 'resize' events
  let lastW = 0, lastH = 0;
  const refit = () => {
    const vv = window.visualViewport, w = vv ? vv.width : innerWidth, h = vv ? vv.height : innerHeight;
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; LP.Shell.fit(); }
  };
  if (window.ResizeObserver) new ResizeObserver(refit).observe(document.documentElement);
  setInterval(refit, 250);
  // double-click / double-tap the picture for fullscreen (F2 also works; F11 = browser fullscreen)
  LP.Shell.view.addEventListener('dblclick', () => LP.Shell.toggleFullscreen());

  // ?level=N jumps straight into a level (testing); ?2p for two players
  const q = new URLSearchParams(location.search);
  if (q.has('level')) {
    Game.newGame(q.has('2p') ? 2 : 1, q.get('who') === 'slob' ? 'slob' : 'slub', LP.clamp(+q.get('level') || 1, 1, 100));
    LP.States.go('game', 'new');
  } else LP.States.go('title');
  window.GAME = { Game, Players, Enemies, Bubbles, Bosses, World, Items, Screens, Sloths, LEVELS };   // console / test access
})();
