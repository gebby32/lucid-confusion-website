/* MAIN — wires the game into Plumbing and starts the loop.
   Picture pipeline per frame:
     1. the retro world renders into the 320x240 LCD canvas (pixel art)
     2. Plumbing scales it up with nearest-neighbour (crisp pixels)
     3. LP.LCD.post (below) then paints, at FULL output resolution:
          title art -> optional scanlines (world only) -> the sloth (hi-res)
          -> the front pixel layer (HUD text, popups, menus), scaled crisp again. */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  G.g = LP.LCD.ctx;
  G.fg = G.canvas(320, 240);
  G.fgc = G.fg.getContext('2d');
  Screens.applySettings();
  const msg = document.getElementById('boot-msg');
  if (msg) msg.remove();

  let scan = null, scanK = 0;
  function scanlines(k) {
    if (k < 3) return null;
    if (scan && scanK === k) return scan;
    scanK = k; scan = document.createElement('canvas'); scan.width = 320 * k; scan.height = 240 * k;
    const g = scan.getContext('2d'), band = Math.max(1, Math.floor(k / 3));
    g.fillStyle = 'rgba(0,0,0,0.28)';
    for (let y = 0; y < 240; y++) g.fillRect(0, y * k + k - band, 320 * k, band);
    return scan;
  }
  LP.LCD.post = (octx, k) => {
    if (Screens.art) Screens.art(octx, k);
    if (LP.Settings.get('scanlines') && !Screens.art) { const s = scanlines(k); if (s) octx.drawImage(s, 0, 0); }
    Sloth.flush(octx, k, LP.FX.sx, LP.FX.sy);
    octx.imageSmoothingEnabled = false;
    octx.drawImage(G.fg, 0, 0, 320 * k, 240 * k);
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
      Sloth.clear();
      G.fgc.clearRect(0, 0, 320, 240);
      G.g = LP.LCD.ctx;
      LP.States.render(LP.LCD.ctx);
    }
  );

  // pause automatically when the tab / window is backgrounded
  const autoPause = () => { if (!LP.Loop.manual && LP.States.is('game') && ['play', 'intro', 'ready'].includes(Game.phase)) LP.States.go('paused'); };
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
  // double-click / double-tap the picture for fullscreen (F2 also works)
  LP.Shell.view.addEventListener('dblclick', () => LP.Shell.toggleFullscreen());

  // ?stage=N jumps straight into a stage (testing)
  const q = new URLSearchParams(location.search);
  Screens.loadScores();
  if (q.has('stage')) {
    Game.newGame(LP.clamp(+q.get('stage') || 1, 1, StageInfo.count));
    LP.States.go('game', 'new');
  } else LP.States.go('title');
  window.GAME = { Game, Player, Lanes, World, Screens, Sloth, Sprites, STAGES, StageInfo };   // console / test access
})();
