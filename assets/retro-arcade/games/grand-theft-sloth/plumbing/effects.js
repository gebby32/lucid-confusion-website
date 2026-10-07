/* ============================================================================
   LUCID PLUMBING — generic effects
   Cheap, repeatedly useful juice. The GAME decides when, how big, and how it looks.

   LP.FX.shake(pixels, frames)    screen shake; apply with ctx.translate(LP.FX.sx, LP.FX.sy)
   LP.FX.hitstop(frames)          freeze gameplay updates (LP.Loop), input stays latched
   LP.FX.flash(frames)            invert the LCD (impact flash)
   LP.FX.spawn({ x, y, vx, vy, g, drag, life, shade, size, floor, bounce, draw(ctx, p) })
   LP.FX.burst(x, y, n, opts)     radial debris;  LP.FX.dust(x, y, n, opts) small puffs
   LP.FX.popup(x, y, text, opts)  floating score / text
   LP.FX.update()                 call from the game's update (frozen by hit-stop with it)
   LP.FX.draw(camX, camY)         call from the game's render
   Particles and popups are in world coordinates; pass the camera to draw().
   ============================================================================ */
'use strict';
(function () {
  const FX = { parts: [], pops: [], max: 300, sx: 0, sy: 0, shakeMag: 0, shakeT: 0, shakeLen: 1 };

  FX.shake = function (mag, frames) {
    frames = frames || 10;
    if (mag >= FX.shakeMag * FX.shakeT / FX.shakeLen) { FX.shakeMag = mag; FX.shakeT = FX.shakeLen = frames; }
  };
  FX.hitstop = (frames) => LP.Loop.hitstop(frames);
  FX.flash = (frames) => { LP.LCD.invert = Math.max(LP.LCD.invert, frames || 2); };

  // Called by LP.Loop every step — keeps shaking / flashing through hit-stop.
  FX.tickScreen = function () {
    if (FX.shakeT > 0) {
      const m = FX.shakeMag * FX.shakeT / FX.shakeLen;
      FX.sx = Math.round(LP.rand(-m, m)); FX.sy = Math.round(LP.rand(-m, m));
      FX.shakeT--;
    } else { FX.sx = FX.sy = 0; FX.shakeMag = 0; }
    if (LP.LCD.invert > 0) LP.LCD.invert--;
  };

  FX.spawn = function (o) {
    const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0.15, drag: 0.98, life: 30, shade: 3, size: 1, floor: null, bounce: 0.4, t: 0 }, o);
    if (FX.parts.length >= FX.max) FX.parts.shift();
    FX.parts.push(p);
    return p;
  };
  // n pieces flying out in all directions. opts: speed (default 2), lift (extra upward push), + any spawn field
  FX.burst = function (x, y, n, opts) {
    opts = opts || {};
    const sp = opts.speed || 2, lift = opts.lift === undefined ? 1 : opts.lift;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(sp * 0.3, sp);
      FX.spawn(Object.assign({ life: LP.randi(18, 34) }, opts, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - lift }));
    }
  };
  // little puffs (landing, skidding). opts.dir pushes them sideways.
  FX.dust = function (x, y, n, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      FX.spawn(Object.assign({ vx: LP.rand(-0.6, 0.6) + (opts.dir || 0) * 0.6, vy: -LP.rand(0.1, 0.6), g: -0.01, drag: 0.9, life: LP.randi(12, 22), shade: 1, size: 2 },
        opts, { x: x + LP.rand(-3, 3), y: y - 1 }));
    }
  };
  // opts: life (frames), shade, outline, scale
  FX.popup = function (x, y, text, opts) {
    opts = opts || {};
    FX.pops.push({ x, y, text: String(text), t: 0, life: opts.life || 45, shade: opts.shade === undefined ? 3 : opts.shade,
      outline: opts.outline === undefined ? 0 : opts.outline, scale: opts.scale || 1 });
    if (FX.pops.length > 16) FX.pops.shift();
  };

  FX.update = function () {
    LP.prune(FX.parts, (p) => {
      if (++p.t >= p.life) return true;
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy;
      if (p.floor !== null && p.y > p.floor) { p.y = p.floor; p.vy *= -p.bounce; p.vx *= 0.7; }
      return false;
    });
    LP.prune(FX.pops, (p) => { if (p.t++ < 16) p.y -= 0.6; return p.t >= p.life; });
  };

  FX.draw = function (camX, camY) {
    camX = camX || 0; camY = camY || 0;
    const L = LP.LCD;
    for (const p of FX.parts) {
      if (p.t > p.life - 6 && p.t % 2) continue;          // blink out
      if (p.draw) p.draw(L.ctx, p, p.x - camX, p.y - camY);
      else L.rect(p.x - camX - (p.size >> 1), p.y - camY - (p.size >> 1), p.size, p.size, p.shade);
    }
    for (const p of FX.pops) {
      if (p.t > p.life - 10 && p.t % 4 < 2) continue;
      L.text(p.text, p.x - camX, p.y - camY, p.shade, { align: 'center', outline: p.outline, scale: p.scale });
    }
  };

  FX.clear = function () { FX.parts.length = 0; FX.pops.length = 0; FX.shakeT = 0; FX.shakeMag = 0; FX.sx = FX.sy = 0; if (LP.LCD) LP.LCD.invert = 0; };

  LP.FX = FX;
})();
