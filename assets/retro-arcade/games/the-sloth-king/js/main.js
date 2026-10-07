/* MAIN — wires the game into Plumbing and starts the loop.
   Picture pipeline per frame:
     1. the game renders into the 320x240 LCD canvas (pixel art, crisp)
     2. Plumbing scales it up with nearest-neighbour
     3. LP.LCD.post paints, at FULL output resolution: the untouched title art (title screen
        only) -> optional scanlines -> the front pixel layer (menus over the title art). */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  G.g = LP.LCD.ctx;
  G.fg = G.canvas(320, 240);
  G.fgc = G.fg.getContext('2d');
  LP.Audio.applySettings();
  LP.Shell.setFit(LP.Settings.get('fit'));
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
    if (LP.Settings.get('scanlines') && !LP.States.is('title')) { const s = scanlines(k); if (s) octx.drawImage(s, 0, 0); }
    octx.imageSmoothingEnabled = false;
    octx.drawImage(G.fg, 0, 0, 320 * k, 240 * k);
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
      G.fgc.clearRect(0, 0, 320, 240);
      LP.States.render(LP.LCD.ctx);
    }
  );

  // pause automatically when the tab / window is backgrounded
  const autoPause = () => { if (!LP.Loop.manual && LP.States.is('play') && Game.phase === 'play') LP.States.go('pause'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  let lastW = 0, lastH = 0;
  const refit = () => {
    const vv = window.visualViewport, w = vv ? vv.width : innerWidth, h = vv ? vv.height : innerHeight;
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; LP.Shell.fit(); }
  };
  if (window.ResizeObserver) new ResizeObserver(refit).observe(document.documentElement);
  setInterval(refit, 250);
  LP.Shell.view.addEventListener('dblclick', () => LP.Shell.toggleFullscreen());

  // test helpers: ?act=N jumps straight into act N (1-10)
  const q = new URLSearchParams(location.search);
  if (q.has('act')) { Game.newRun(); Game.start(LP.clamp((+q.get('act') || 1) - 1, 0, LEVELS.length - 1)); LP.States.go('play'); }
  else if (q.has('scene')) { Game.newRun(); Scenes.play(q.get('scene'), () => LP.States.go('title')); }
  else LP.States.go('title');
  window.GAME = { Game, Player, World, LEVELS, Flow, Scenes, Screens, Bosses, SetPieces, GameAudio };
})();
