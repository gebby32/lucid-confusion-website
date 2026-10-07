/* CONTROLS — one place that turns keyboard, mouse and gamepad into game intent.
   Plumbing (LP.Input / LP.Pad) supplies the digital actions and menu navigation;
   this adds the analogue parts: mouse aim + buttons + wheel, both sticks, both triggers.
     on foot   move: WASD / arrows / left stick      aim: mouse / right stick (else facing)
               fire: left click / Ctrl / K / RT      melee: right click / Space / LT
     driving   steer: A D / left stick               gas: W / RT     brake+reverse: S / LT
               handbrake: Space / B                  drive-by: left click / Ctrl / K / X */
'use strict';
const Ctl = (function () {
  const C = {
    mx: G.W / 2, my: G.H / 2, mDown: false, rDown: false, mPress: false, rPress: false, wheel: 0, mouseT: 99,
    pad: null, lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0, rtPress: false, ltPress: false, _rt: 0, _lt: 0,
    aimMode: 'mouse', padT: 99
  };
  C.init = function () {
    window.addEventListener('mousemove', (e) => {
      const p = LP.Shell.toArt(e.clientX, e.clientY);
      C.mx = p[0]; C.my = p[1]; C.mouseT = 0; C.aimMode = 'mouse';
    });
    window.addEventListener('mousedown', (e) => {
      LP.Audio.unlock();
      const p = LP.Shell.toArt(e.clientX, e.clientY); C.mx = p[0]; C.my = p[1];
      C.mouseT = 0; C.aimMode = 'mouse';
      if (e.button === 0) { C.mDown = true; C.mPress = true; }
      if (e.button === 2) { C.rDown = true; C.rPress = true; }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) C.mDown = false; if (e.button === 2) C.rDown = false; });
    window.addEventListener('wheel', (e) => { C.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    window.addEventListener('blur', () => { C.mDown = C.rDown = false; });
  };
  const dz = (v, d) => (Math.abs(v) < d ? 0 : (v - Math.sign(v) * d) / (1 - d));
  // once per update, before the game reads anything
  C.poll = function (dt) {
    C.mouseT += dt; C.padT += dt;
    let pad = null;
    try { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) { pad = p; break; } } catch (e) { /* no pads */ }
    C.pad = pad;
    if (pad) {
      const ax = pad.axes;
      C.lx = dz(ax[0] || 0, 0.18); C.ly = dz(ax[1] || 0, 0.18);
      C.rx = dz(ax[2] || 0, 0.25); C.ry = dz(ax[3] || 0, 0.25);
      const b = pad.buttons;
      C.lt = b[6] ? b[6].value || (b[6].pressed ? 1 : 0) : 0;
      C.rt = b[7] ? b[7].value || (b[7].pressed ? 1 : 0) : 0;
      C.rtPress = C.rt > 0.4 && C._rt <= 0.4; C.ltPress = C.lt > 0.4 && C._lt <= 0.4;
      C._rt = C.rt; C._lt = C.lt;
      if (Math.hypot(C.rx, C.ry) > 0.3) { C.aimMode = 'stick'; C.padT = 0; }
      if (Math.hypot(C.lx, C.ly) > 0.3 || C.rt > 0.2 || C.lt > 0.2) C.padT = 0;
    } else { C.lx = C.ly = C.rx = C.ry = C.lt = C.rt = 0; C.rtPress = C.ltPress = false; }
  };
  // after the game has read this step's presses
  C.endStep = function () { C.mPress = false; C.rPress = false; C.wheel = 0; };

  const I = () => LP.Input;
  C.moveVec = function () {
    let x = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0), y = (I().held('down') ? 1 : 0) - (I().held('up') ? 1 : 0);
    if (Math.abs(C.lx) + Math.abs(C.ly) > 0.05) { x = C.lx; y = C.ly; }
    const m = Math.hypot(x, y);
    return m > 1 ? [x / m, y / m] : [x, y];
  };
  C.steer = function () {
    const k = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0);
    return k || C.lx;
  };
  C.gas = function () { return Math.max(I().held('up') ? 1 : 0, C.rt); };
  C.brake = function () { return Math.max(I().held('down') ? 1 : 0, C.lt); };
  C.hand = function () { return I().held('hand') || I().held('padb') || C.rDown; };
  // fire held: mouse / Ctrl / K, or RT on foot, or X while driving
  C.fireHeld = function (driving) { return C.mDown || I().held('fire') || (driving ? I().held('padx') : C.rt > 0.4); };
  C.firePressed = function (driving) { return C.mPress || I().pressed('fire') || (driving ? I().pressed('padx') : C.rtPress); };
  C.meleePressed = function () { return C.rPress || I().pressed('hand') || C.ltPress; };
  C.reloadPressed = function () { return I().pressed('reload') || I().pressed('padx'); };
  // aim direction from the player's screen position, or null to use facing
  C.aim = function (sx, sy, fromMouseFire) {
    if (C.aimMode === 'stick' && Math.hypot(C.rx, C.ry) > 0.3) return Math.atan2(C.ry, C.rx);
    if (C.aimMode === 'mouse' && (C.mouseT < 6 || fromMouseFire) && !(C.padT < C.mouseT)) return Math.atan2(C.my - sy, C.mx - sx);
    return null;
  };
  C.usingMouse = () => C.aimMode === 'mouse' && C.mouseT < 6 && !(C.padT < C.mouseT);
  return C;
})();
