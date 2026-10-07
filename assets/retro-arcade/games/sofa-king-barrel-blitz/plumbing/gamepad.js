/* ============================================================================
   LUCID PLUMBING — gamepads (optional)
   Polls standard-mapping gamepads and feeds their buttons into LP.Input as held
   actions, so games read pads exactly like keys: LP.Input.held('left') etc.

   config.gamepad = {
     buttons: { 0: 'jump', 1: 'jump', 2: 'action', 9: 'start', 8: 'back', 12: 'up', ... },
     stick: true,          left stick also drives left / right / up / down
     dead: 0.45            stick dead zone
   }
   Call LP.Pad.poll() once per update, before the game reads input (js/main.js does).
   ============================================================================ */
'use strict';
(function () {
  const DEFAULT = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  const P = { cfg: null, buttons: DEFAULT, connected: 0 };

  P.init = function (cfg) {
    P.cfg = cfg || null;
    P.buttons = Object.assign({}, DEFAULT, cfg && cfg.buttons);
  };

  P.poll = function () {
    if (!P.cfg || !navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    let n = 0;
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad || !pad.connected) { LP.Input.setVirtual('pad' + i, []); continue; }
      n++;
      const held = new Set();
      pad.buttons.forEach((b, j) => { if ((b.pressed || b.value > 0.5) && P.buttons[j]) held.add(P.buttons[j]); });
      if (P.cfg.stick !== false && pad.axes.length >= 2) {
        const d = P.cfg.dead || 0.45, ax = pad.axes[0], ay = pad.axes[1];
        if (ax < -d) held.add('left'); else if (ax > d) held.add('right');
        if (ay < -d) held.add('up'); else if (ay > d) held.add('down');
      }
      const list = [...held].sort();
      if (list.length) { LP.Input.source = 'pad'; LP.Audio.unlock(); }
      LP.Input.setVirtual('pad' + i, list);
    }
    P.connected = n;
  };

  LP.Pad = P;
})();
