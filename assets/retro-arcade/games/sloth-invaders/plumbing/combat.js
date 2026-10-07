/* ============================================================================
   LUCID PLUMBING — tiny collision + timed-tag helpers
   Entity-agnostic. No damage model, no entity base class, no combat states:
   damage, reactions and interactions stay in the game's own code.

   LP.Hit.overlap(a, b)            boxes {x, y, w, h}
   LP.Hit.circles(a, b)            circles {x, y, r}
   LP.Hit.rectCircle(box, circle)
   LP.Hit.box(x, y, facing, ox, oy, w, h)   box offset from (x, y), mirrored when facing < 0
   LP.Hit.dist(ax, ay, bx, by)
   LP.Hit.knockback(obj, dir, force, lift)  sets obj.vx (and obj.vy) only

   LP.Status — timed tags on any object (seconds). Plumbing never knows what a tag
   means: 'invulnerable', 'stunned', 'soaked'... are entirely the game's business.
   LP.Status.add(obj, 'stunned', 0.5)   (keeps the longer of old / new time)
   LP.Status.has(obj, 'stunned')  .left(obj, name)  .remove(obj, name)  .clear(obj)
   LP.Status.tick(obj, dt) -> array of tag names that expired this tick
   ============================================================================ */
'use strict';
(function () {
  const Hit = {
    overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    circles: (a, b) => { const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r; return dx * dx + dy * dy <= r * r; },
    rectCircle(b, c) {
      const nx = LP.clamp(c.x, b.x, b.x + b.w), ny = LP.clamp(c.y, b.y, b.y + b.h), dx = c.x - nx, dy = c.y - ny;
      return dx * dx + dy * dy <= c.r * c.r;
    },
    // ox/oy/w/h are written for a right-facing owner; facing < 0 mirrors the box.
    box: (x, y, facing, ox, oy, w, h) => ({ x: facing < 0 ? x - ox - w : x + ox, y: y + oy, w, h }),
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    knockback(obj, dir, force, lift) { obj.vx = (dir < 0 ? -1 : 1) * force; if (lift) obj.vy = -lift; }
  };

  const NONE = [];
  const Status = {
    add(obj, name, seconds) { const s = obj._status || (obj._status = {}); s[name] = Math.max(s[name] || 0, seconds); },
    has: (obj, name) => !!(obj._status && obj._status[name] > 0),
    left: (obj, name) => (obj._status && obj._status[name]) || 0,
    remove(obj, name) { if (obj._status) delete obj._status[name]; },
    clear(obj) { obj._status = {}; },
    tick(obj, dt) {
      const s = obj._status;
      let out = NONE;
      if (s) for (const k in s) { s[k] -= dt; if (s[k] <= 0) { delete s[k]; if (out === NONE) out = []; out.push(k); } }
      return out;
    }
  };

  LP.Hit = Hit;
  LP.Status = Status;
})();
