/* CONTROLS — keyboard + Xbox-style pad turned into game intent.
   Plumbing (LP.Input / LP.Pad) gives the digital actions; this adds the analogue
   left stick and the triggers, and one place to ask "which way is the player pushing".
     Ctl.move()      [x, y] in -1..1, y down = toward the camera / screen bottom
     Ctl.gas()/brake()   0..1 (W / S, or RT / LT)
     Ctl.steer()     -1..1 */
'use strict';
const Ctl = (function () {
  const C = { pad: null, lx: 0, ly: 0, lt: 0, rt: 0, mPress: false, mx: 0, my: 0, mouseT: 99 };
  const dz = (v, d) => (Math.abs(v) < d ? 0 : (v - Math.sign(v) * d) / (1 - d));
  C.init = function () {
    window.addEventListener('mousemove', (e) => { const p = LP.Shell.toArt(e.clientX, e.clientY); C.mx = p[0]; C.my = p[1]; C.mouseT = 0; });
    window.addEventListener('mousedown', (e) => { LP.Audio.unlock(); const p = LP.Shell.toArt(e.clientX, e.clientY); C.mx = p[0]; C.my = p[1]; C.mouseT = 0; if (e.button === 0) C.mPress = true; });
  };
  C.poll = function (dt) {
    C.mouseT += dt;
    let pad = null;
    try { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) { pad = p; break; } } catch (e) { /* none */ }
    C.pad = pad;
    if (pad) {
      C.lx = dz(pad.axes[0] || 0, 0.2); C.ly = dz(pad.axes[1] || 0, 0.2);
      const b = pad.buttons;
      C.lt = b[6] ? (b[6].value || (b[6].pressed ? 1 : 0)) : 0;
      C.rt = b[7] ? (b[7].value || (b[7].pressed ? 1 : 0)) : 0;
    } else { C.lx = C.ly = C.lt = C.rt = 0; }
  };
  C.endStep = function () { C.mPress = false; };
  const I = () => LP.Input;
  C.move = function () {
    let x = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0), y = (I().held('down') ? 1 : 0) - (I().held('up') ? 1 : 0);
    if (Math.abs(C.lx) + Math.abs(C.ly) > 0.05) { x = C.lx; y = C.ly; }
    const m = Math.hypot(x, y);
    return m > 1 ? [x / m, y / m] : [x, y];
  };
  C.steer = () => { const k = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0); return k || C.lx; };
  C.gas = () => Math.max(I().held('up') ? 1 : 0, I().held('gas') ? 1 : 0, C.rt);
  C.brake = () => Math.max(I().held('down') ? 1 : 0, I().held('brake') ? 1 : 0, C.lt);
  // "advance the dialogue" — any of the face buttons
  C.advance = () => I().pressed('confirm') || I().pressed('use') || I().pressed('punch') || C.mPress;
  return C;
})();
