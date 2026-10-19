/* MAIN — boots Plumbing, the 3D renderer and the two supplied models, wires the picture
   pipeline and starts the loop.
   Per frame (LP.LCD.post, output resolution): the title art (title screens) OR the 3D
   frame (chunky world + crisp idiots) -> optional scanlines -> the 480x360 pixel HUD. */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  G.fg = G.canvas(G.W, G.H); G.fgc = G.fg.getContext('2d');
  G.g = G.fgc;
  Ctl.init();
  R3.init();
  Screens.applySettings();
  Story.chapters = CHAPTERS;
  const msg = document.getElementById('boot-msg'); if (msg) msg.remove();

  let scan = null, scanK = 0;
  LP.LCD.post = (octx, k) => {
    if (Screens.art) Screens.art(octx, k);
    else if (R3.render(k)) octx.drawImage(R3.canvas, 0, 0);
    if (LP.Settings.get('scanlines') && k >= 3) {
      if (!scan || scanK !== k) {
        scanK = k; scan = document.createElement('canvas'); scan.width = G.W * k; scan.height = G.H * k;
        const g = scan.getContext('2d'), band = Math.max(1, Math.floor(k / 3)); g.fillStyle = 'rgba(0,0,0,0.25)';
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
      Ctl.endStep();
    },
    () => {
      G.fgc.clearRect(0, 0, G.W, G.H);
      G.g = G.fgc;
      LP.States.render(LP.LCD.ctx);
    }
  );
  const autoPause = () => { if (!LP.Loop.manual && LP.States.is('play')) LP.States.go('pause'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  let lw = 0, lh = 0;
  setInterval(() => { const w = innerWidth, h = innerHeight; if (w !== lw || h !== lh) { lw = w; lh = h; LP.Shell.fit(); } }, 250);
  LP.States.go('boot');
  // parse the models after the first frame so the title art is up immediately
  setTimeout(() => Heroes.load(), 60);
  window.GAME = { R3, Stage, Game, Story, Modes, MiniGames, Heroes, HUD, Props, Areas, CHAPTERS };
})();
