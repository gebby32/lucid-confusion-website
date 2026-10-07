/* MAIN — boots Plumbing, builds the city, wires the picture pipeline and starts the loop.
   Per frame: world/HUD draw into the 480x360 LCD canvas -> Plumbing scales it crisp ->
   LP.LCD.post paints the hi-res title art (title/ending), optional scanlines, then the
   front pixel layer (title menus). */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  G.g = LP.LCD.ctx;
  G.fg = G.canvas(G.W, G.H); G.fgc = G.fg.getContext('2d');
  Ctl.init();
  World.init();
  Screens.applySettings();
  const msg = document.getElementById('boot-msg'); if (msg) msg.remove();

  let scan = null, scanK = 0;
  LP.LCD.post = (octx, k) => {
    if (Screens.art) Screens.art(octx, k);
    if (LP.Settings.get('scanlines') && k >= 3 && !Screens.art) {
      if (!scan || scanK !== k) {
        scanK = k; scan = document.createElement('canvas'); scan.width = G.W * k; scan.height = G.H * k;
        const g = scan.getContext('2d'), band = Math.max(1, Math.floor(k / 3)); g.fillStyle = 'rgba(0,0,0,0.28)';
        for (let y = 0; y < G.H; y++) g.fillRect(0, y * k + k - band, G.W * k, band);
      }
      octx.drawImage(scan, 0, 0);
    }
    octx.imageSmoothingEnabled = false;
    octx.drawImage(G.fg, 0, 0, G.W * k, G.H * k);
  };

  LP.Loop.start(
    (dt) => {
      LP.Pad.poll(); Ctl.poll(dt);
      const I = LP.Input;
      if (I.consume('mute')) LP.Audio.toggleMute();
      if (I.consume('fullscreen')) LP.Shell.toggleFullscreen();
      LP.States.update(dt);
      GameAudio.update(dt, LP.States.is('play') || LP.States.is('dead'));
      Ctl.endStep();
    },
    () => {
      G.fgc.clearRect(0, 0, G.W, G.H);
      G.g = LP.LCD.ctx;
      LP.States.render(LP.LCD.ctx);
    }
  );
  const autoPause = () => { if (!LP.Loop.manual && LP.States.is('play')) LP.States.go('pause'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  let lw = 0, lh = 0;
  setInterval(() => { const w = innerWidth, h = innerHeight; if (w !== lw || h !== lh) { lw = w; lh = h; LP.Shell.fit(); } }, 250);
  LP.States.go('title');
  window.GAME = { World, City, Cars, Peds, Weapons, Police, Player, Missions, HUD, Game, Screens, GameAudio };
})();
