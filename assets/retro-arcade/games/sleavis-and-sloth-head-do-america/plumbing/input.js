/* ============================================================================
   LUCID PLUMBING — unified input
   Keyboard + mouse + multi-touch, all mapped to arbitrary ACTION NAMES from the
   game config (config.keys, config.controls). Plumbing never interprets actions.

   Every key and every pointer is tracked separately; an action is held while ANY
   source holds it, so "thumb on RIGHT + other thumb on ATTACK + keyboard JUMP" all
   combine. Press edges are LATCHED until the game has run an update (or consumes
   them), so taps shorter than a frame or made during hit-stop are never lost.

   Game-facing API:
     LP.Input.held(a)          true while any source holds action a
     LP.Input.pressed(a)       true in the update after a was pressed (latched edge)
     LP.Input.released(a)      true in the update after a was released
     LP.Input.consume(a)       returns pressed(a) and clears it (and its buffer)
     LP.Input.recent(a, n)     pressed within the last n updates and not consumed (input buffer)
     LP.Input.any()            any action pressed this update
     LP.Input.source           'key' | 'mouse' | 'touch' | 'pen' | 'pad' — last source used
     LP.Input.setVirtual(id, [actions])   hold actions from another source (see gamepad.js)

   Control zone types (native artwork pixels):
     { type:'circle', action, x, y, r, group? }
     { type:'rect',   action, x, y, width, height, group? }
     { type:'poly',   action, points:[[x,y],...], group? }
     { type:'dpad',   x, y, r, dead:0.15, threshold:0.4 | {left,right,up,down},
                      diagonals:true, drift:1.9, actions:{ up:'jump', ... } }
   group: a thumb may roll/slide between zones sharing a group (face buttons).
   No group: direct press only (menu / power) — sliding off cancels, sliding on never presses.
   ============================================================================ */
'use strict';
(function () {
  const I = {
    zones: [], keys: {}, el: null, drift: 1.25, haptics: 0,
    downKeys: new Map(), ptrs: new Map(),
    heldSet: new Set(), pressedSet: new Set(), releasedSet: new Set(),
    lastPress: {}, steps: 0, source: 'key', lastArt: null, _bound: false
  };

  I.held = (a) => I.heldSet.has(a);
  I.pressed = (a) => I.pressedSet.has(a);
  I.released = (a) => I.releasedSet.has(a);
  I.any = () => I.pressedSet.size > 0;
  I.recent = (a, n) => I.lastPress[a] !== undefined && I.steps - I.lastPress[a] <= n;
  I.consume = function (a) {
    const was = I.pressedSet.delete(a);
    delete I.lastPress[a];
    return was;
  };
  // Called by LP.Loop after each update that actually ran.
  I.endStep = function () { I.pressedSet.clear(); I.releasedSet.clear(); I.steps++; };
  I.clearPresses = function () { I.pressedSet.clear(); I.releasedSet.clear(); I.lastPress = {}; };
  I.releaseAll = function () { I.downKeys.clear(); I.ptrs.clear(); recompute(); };
  // Extra input sources (gamepads, on-screen buttons...): id -> array of held actions ([] releases).
  I.setVirtual = function (id, actions) {
    const key = 'virtual:' + id, old = I.downKeys.get(key) || [];
    if (old.length === actions.length && old.every((a, i) => a === actions[i])) return;
    if (actions.length) I.downKeys.set(key, actions.slice()); else I.downKeys.delete(key);
    recompute();
  };

  function recompute() {
    const now = new Set();
    for (const acts of I.downKeys.values()) for (const a of acts) now.add(a);
    for (const p of I.ptrs.values()) for (const a of p.actions) now.add(a);
    for (const a of now) if (!I.heldSet.has(a)) { I.pressedSet.add(a); I.lastPress[a] = I.steps; }
    for (const a of I.heldSet) if (!now.has(a)) I.releasedSet.add(a);
    I.heldSet = now;
  }

  // ------------------------------------------------------------------ zone geometry
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // grow > 1 tolerates thumb drift (circles / rects / d-pad grow; polygons are exact)
  function inside(z, x, y, grow) {
    if (z.type === 'circle' || z.type === 'dpad') return Math.hypot(x - z.x, y - z.y) <= z.r * grow;
    if (z.type === 'rect') {
      const mx = z.width * (grow - 1) / 2, my = z.height * (grow - 1) / 2;
      return x >= z.x - mx && x <= z.x + z.width + mx && y >= z.y - my && y <= z.y + z.height + my;
    }
    if (z.type === 'poly') return inPoly(x, y, z.points);
    return false;
  }
  function center(z) {
    if (z.type === 'rect') return [z.x + z.width / 2, z.y + z.height / 2];
    if (z.type === 'poly') { let x = 0, y = 0; for (const p of z.points) { x += p[0]; y += p[1]; } return [x / z.points.length, y / z.points.length]; }
    return [z.x, z.y];
  }
  // nearest zone (by centre) that contains the point
  function zoneAt(x, y, zones, grow) {
    let best = null, bd = Infinity;
    for (const z of zones) if (inside(z, x, y, grow)) { const c = center(z), d = Math.hypot(x - c[0], y - c[1]); if (d < bd) { bd = d; best = z; } }
    return best;
  }
  function dpadActions(z, x, y) {
    const out = [], dx = x - z.x, dy = y - z.y, d = Math.hypot(dx, dy);
    if (d < z.r * (z.dead === undefined ? 0.15 : z.dead)) return out;
    const ux = dx / d, uy = dy / d, t = z.threshold === undefined ? 0.4 : z.threshold;
    const T = typeof t === 'number' ? { left: t, right: t, up: t, down: t } : Object.assign({ left: 0.4, right: 0.4, up: 0.4, down: 0.4 }, t);
    const A = Object.assign({ left: 'left', right: 'right', up: 'up', down: 'down' }, z.actions);
    let h = ux < -T.left ? A.left : ux > T.right ? A.right : null;
    let v = uy < -T.up ? A.up : uy > T.down ? A.down : null;
    if (h && v && z.diagonals === false) { if (Math.abs(ux) > Math.abs(uy)) v = null; else h = null; }
    if (h) out.push(h);
    if (v) out.push(v);
    return out;
  }
  function actionsFor(z, x, y) { return z.type === 'dpad' ? dpadActions(z, x, y) : [].concat(z.action); }
  I.zoneAt = (x, y) => zoneAt(x, y, I.zones, 1);
  I.actionsAt = (x, y) => { const z = I.zoneAt(x, y); return z ? actionsFor(z, x, y) : []; };

  // ------------------------------------------------------------------ pointers
  function onDown(e) {
    LP.Audio.unlock();
    const [x, y] = LP.Shell.toArt(e.clientX, e.clientY);
    I.lastArt = [x, y];
    const z = zoneAt(x, y, I.zones, 1);
    if (!z) return;
    e.preventDefault();
    try { I.el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    I.source = e.pointerType || 'mouse';
    I.ptrs.set(e.pointerId, { zone: z, actions: actionsFor(z, x, y), dead: false });
    recompute();
    if (I.haptics && e.isTrusted && e.pointerType === 'touch' && navigator.vibrate) { try { navigator.vibrate(I.haptics); } catch (err) { /* ok */ } }
  }
  function onMove(e) {
    const [x, y] = LP.Shell.toArt(e.clientX, e.clientY);
    I.lastArt = [x, y];
    const p = I.ptrs.get(e.pointerId);
    if (!p || p.dead) return;
    e.preventDefault();
    const z = p.zone;
    if (z.type === 'dpad') {
      p.actions = inside(z, x, y, z.drift || 1.9) ? dpadActions(z, x, y) : [];
    } else if (z.group) {
      const nz = zoneAt(x, y, I.zones.filter((o) => o.group === z.group), I.drift);
      if (nz) { p.zone = nz; p.actions = [].concat(nz.action); } else p.actions = [];
    } else if (!inside(z, x, y, I.drift)) {
      p.actions = []; p.dead = true;
    }
    recompute();
  }
  function onUp(e) { if (I.ptrs.delete(e.pointerId)) recompute(); }

  // ------------------------------------------------------------------ init
  I.init = function (cfg) {
    I.zones = cfg.controls || [];
    I.drift = (cfg.input && cfg.input.drift) || 1.25;
    I.haptics = (cfg.shell && cfg.shell.haptics) || 0;          // full-screen (monitor) games have no shell
    I.keys = {};
    for (const code in cfg.keys || {}) I.keys[code] = [].concat(cfg.keys[code]);
    I.downKeys.clear(); I.ptrs.clear(); I.heldSet = new Set(); I.clearPresses();

    I.el = LP.Shell.view;
    const opt = { passive: false };
    I.el.addEventListener('pointerdown', onDown, opt);
    I.el.addEventListener('pointermove', onMove, opt);
    I.el.addEventListener('pointerup', onUp);
    I.el.addEventListener('pointercancel', onUp);
    I.el.addEventListener('lostpointercapture', onUp);
    I.el.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, opt);   // iOS double-tap zoom

    if (I._bound) return;
    I._bound = true;
    window.addEventListener('keydown', (e) => {
      LP.Audio.unlock();
      const acts = I.keys[e.code];
      if (!acts) return;
      e.preventDefault();
      if (e.repeat) return;
      I.source = 'key';
      I.downKeys.set(e.code, acts); recompute();
    });
    window.addEventListener('keyup', (e) => { if (I.downKeys.delete(e.code)) recompute(); });
    window.addEventListener('blur', I.releaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) I.releaseAll(); });
    // no context menus, text selection, scrolling, pinch or double-tap zoom on the game page
    const stop = (e) => { if (e.cancelable) e.preventDefault(); };
    document.addEventListener('contextmenu', stop);
    document.addEventListener('touchmove', stop, opt);
    document.addEventListener('gesturestart', stop, opt);
    document.addEventListener('dblclick', stop, opt);
  };

  LP.Input = I;
})();
