/* MAIN — wires the game into Plumbing and starts the loop. */
'use strict';
(function () {
  LP.boot(GAME_CONFIG);
  LP.Pad.init(GAME_CONFIG.gamepad);
  Screens.applySettings();
  const msg = document.getElementById('boot-msg');
  if (msg) msg.remove();

  LP.Loop.start(
    (dt) => {
      LP.Pad.poll();
      const I = LP.Input;
      if (!LP.States.is('entry')) {                        // M / F are letters while typing initials
        if (I.consume('mute')) LP.Audio.toggleMute();
        if (I.consume('fullscreen')) LP.Shell.toggleFullscreen();
      }
      LP.States.update(dt);
    },
    () => LP.States.render(LP.LCD.ctx)
  );

  // pause automatically when the tab / window is backgrounded
  const autoPause = () => { if (LP.States.is('game')) LP.States.go('paused'); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);

  LP.States.go('title');
  window.GAME = { Game, Hero, Hazards, King, World, Screens, STAGES };   // console / test access
})();
