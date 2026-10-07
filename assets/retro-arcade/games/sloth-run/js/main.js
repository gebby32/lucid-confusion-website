/* MAIN — wires the game into Plumbing and starts the loop.
   Picture pipeline per frame:
     1. the world renders into the 400x300 LCD canvas (pixel art, crisp)
     2. Plumbing scales it up with nearest-neighbour
     3. LP.LCD.post (below) then paints, at FULL output resolution:
          hi-res title art (title / ending) -> optional scanlines (world only)
          -> the front pixel layer (HUD, menus), scaled up crisp again. */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  G.g = LP.LCD.ctx;
  G.fg = G.canvas(400, 300);
  G.fgc = G.fg.getContext('2d');
  Screens.applySettings();
  const msg = document.getElementById('boot-msg');
  if (msg) msg.remove();

  let scan = null, scanK = 0;
  function scanlines(k) {
    if (k < 3) return null;
    if (scan && scanK === k) return scan;
    scanK = k; scan = document.createElement('canvas'); scan.width = 400 * k; scan.height = 300 * k;
    const g = scan.getContext('2d'), band = Math.max(1, Math.floor(k / 3));
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < 300; y++) g.fillRect(0, y * k + k - band, 400 * k, band);
    return scan;
  }
  LP.LCD.post = (octx, k) => {
    if (Screens.art) Screens.art(octx, k);
    if (LP.Settings.get('scanlines') && !LP.States.is('title')) { const s = scanlines(k); if (s) octx.drawImage(s, 0, 0); }
    octx.imageSmoothingEnabled = false;
    octx.drawImage(G.fg, 0, 0, 400 * k, 300 * k);
  };

  LP.Loop.start(
    (dt) => {
      LP.Pad.poll();
      const I = LP.Input;
      if (!LP.States.is('entry')) {
        if (I.consume('mute')) LP.Audio.toggleMute();
        if (I.consume('fullscreen')) LP.Shell.toggleFullscreen();
      }
      LP.States.update(dt);
    },
    () => {
      G.g = LP.LCD.ctx;
      LP.States.render(LP.LCD.ctx);
    }
  );

  // pause automatically when the tab / window is backgrounded
  const autoPause = () => { if (!LP.Loop.manual && LP.States.is('race') && ['count', 'drive'].includes(Race.phase)) LP.States.go('pause'); };
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
  LP.Shell.view.addEventListener('dblclick', () => LP.Shell.toggleFullscreen());

  // test helpers:  ?race  jumps straight into a run;  ?auto  lets the autopilot drive it;
  const q = new URLSearchParams(location.search);
  Screens.loadScores();
  // ?stage=N starts the run on stage N (0-9) for testing
  if (q.has('race') || q.has('auto') || q.has('stage')) { Race.start({ auto: q.has('auto'), stage: LP.clamp(+q.get('stage') || 0, 0, 9) }); LP.States.go('race'); }
  else LP.States.go('title');
  window.GAME = { Race, Track, Road, Traffic, Auto, Screens, STAGES, Route, Cars, Scenery, Backgrounds, GameAudio };   // console / test access
})();
