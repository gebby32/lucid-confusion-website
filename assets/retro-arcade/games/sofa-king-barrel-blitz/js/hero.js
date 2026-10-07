/* HERO — the sloth in overalls.
   Lumbering walk, quick sure-footed climbing, a floaty fixed-arc jump (predictable,
   classic), generous ladder grabs, forgiving edges and coyote time.
   States: ground · air · climb · stun (flopped flat) · dead · win.
   Feet at (x, y). Calls Game.heroDie(cause) / Game.heroLanded(...) for the rules. */
'use strict';
const Hero = {
  create(def) {
    const p = World.floor;
    return {
      x: def.spawn.x, y: World.surf(p, def.spawn.x), vx: 0, vy: 0, face: def.spawn.f || 1,
      state: 'ground', plat: p, lad: null, jumping: false, jumpId: 0, combo: 0, apexY: 0, coyote: 0,
      dist: 0, climbDist: 0, idleT: 0, stun: 0, invul: GAME_CONFIG.hero.spawnInvul, tier: 0, maxTier: 0,
      deadT: 0, crown: false, stepT: 0, slip: false
    };
  },

  box(h) { return { x: h.x - 4, y: h.y - 13, w: 8, h: 11 }; },          // smaller than the sprite: favours the sloth

  // dt real seconds; belts/conveyors move with the world (ts = sloth-time scale)
  update(h, dt, ts) {
    if (h.invul > 0) h.invul -= dt;
    switch (h.state) {
      case 'ground': Hero.ground(h, ts); break;
      case 'air': Hero.air(h); break;
      case 'climb': Hero.climb(h); break;
      case 'stun':
        h.stun -= dt;
        Hero.belt(h, ts); Hero.stick(h);
        if (h.stun <= 0 && h.state === 'stun') h.state = 'ground';
        break;
      case 'dead': h.deadT += dt; break;
      case 'win': h.deadT += dt; break;
    }
    if (h.state === 'ground' || h.state === 'climb') h.tier = (h.state === 'climb' ? h.lad.lo : h.plat).tier;
  },

  move() { const I = LP.Input; return (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); },

  ground(h, ts) {
    const I = LP.Input, T = GAME_CONFIG.hero, mv = Hero.move();
    // ladders: up from the bottom, down from the top
    if (I.held('up')) { const L = World.ladderUp(h.x, h.y); if (L) return Hero.startClimb(h, L, -1); }
    if (I.held('down')) { const L = World.ladderDown(h.x, h.y, h.plat); if (L) return Hero.startClimb(h, L, 1); }
    if (I.recent('jump', 6)) { I.consume('jump'); return Hero.jump(h, mv); }
    if (mv) h.face = mv;
    const puddle = World.puddleAt(h.plat, h.x);
    h.slip = !!puddle;
    h.vx = LP.approach(h.vx, mv * T.walk, puddle ? 0.035 : T.accel);
    if (puddle && !mv && Math.abs(h.vx) > 0.05 && Math.random() < 0.3) G.dust(h.x, h.y, 1, '#9ad0ff');
    const ox = h.x;
    h.x = LP.clamp(h.x + h.vx, 10, 310);
    Hero.belt(h, ts);
    h.dist += Math.abs(h.x - ox);
    if (Math.abs(h.vx) > 0.1) {
      h.idleT = 0;
      if ((h.stepT += Math.abs(h.x - ox)) > 9) { h.stepT = 0; LP.Audio.play('step'); }
    } else h.idleT += 1 / 60;
    Hero.stick(h);
  },

  belt(h, ts) {
    if (h.plat && h.plat.belt) h.x = LP.clamp(h.x + h.plat.belt.dir * World.beltSpeed * ts, 10, 310);
  },

  // keep the feet on the surface; walk across touching segments; fall off real edges
  stick(h) {
    const p = h.plat, edge = GAME_CONFIG.hero.edge;
    if (h.x >= p.x0 - edge && h.x <= p.x1 + edge) { h.y = World.surf(p, h.x); return; }
    const q = World.next(p, h.x > p.x1 ? 1 : -1) || World.platAt(h.x, h.y, 4);
    if (q) { h.plat = q; h.y = World.surf(q, h.x); return; }
    // walked off: drop, but jumping still works for a few frames
    h.state = 'air'; h.jumping = false; h.vy = 0.2; h.vx *= 0.55; h.apexY = h.y; h.coyote = GAME_CONFIG.hero.coyote;
  },

  jump(h, mv) {
    const T = GAME_CONFIG.hero;
    h.state = 'air'; h.jumping = true; h.coyote = 0;
    h.vy = -T.jumpV; h.vx = mv * T.walk;                      // committed arc, classic and predictable
    if (mv) h.face = mv;
    h.jumpId++; h.combo = 0; h.apexY = h.y; h.idleT = 0;
    LP.Audio.play('jump');
  },

  air(h) {
    const T = GAME_CONFIG.hero, I = LP.Input;
    if (h.coyote > 0) {
      h.coyote--;
      if (!h.jumping && I.recent('jump', 6)) { I.consume('jump'); h.y = h.apexY; return Hero.jump(h, Hero.move()); }
    }
    h.vy = Math.min(h.vy + T.gravity, T.maxFall);
    const nx = h.x + h.vx;
    if (nx < 10 || nx > 310) h.vx = 0;
    h.x = LP.clamp(nx, 10, 310);
    const oy = h.y;
    h.y += h.vy;
    if (h.y < h.apexY) h.apexY = h.y;
    if (h.vy > 0) {
      const q = World.landing(h.x, oy, h.y, null, 2);
      if (q) return Hero.land(h, q);
    }
    if (h.y > 250) Game.heroDie('fall');
  },

  land(h, q) {
    const T = GAME_CONFIG.hero, drop = World.surf(q, h.x) - h.apexY;
    h.plat = q; h.y = World.surf(q, h.x); h.vy = 0; h.state = 'ground';
    h.vx = h.jumping ? 0 : h.vx;
    h.jumping = false; h.stepT = 0;
    if (drop > T.deathFall) { Game.heroDie('fall'); return; }
    if (drop > T.flopFall) {
      h.state = 'stun'; h.stun = 0.75; h.vx = 0;
      LP.Audio.play('flop'); G.dust(h.x, h.y, 6); LP.FX.shake(1, 6);
      return;
    }
    LP.Audio.play('land');
    G.dust(h.x, h.y, 2);
  },

  startClimb(h, L, dir) {
    h.state = 'climb'; h.lad = L; h.x = L.x; h.vx = 0; h.idleT = 0;
    h.y += dir * 1.5;
  },

  climb(h) {
    const I = LP.Input, T = GAME_CONFIG.hero, L = h.lad;
    const dy = (I.held('down') ? 1 : 0) - (I.held('up') ? 1 : 0), mv = Hero.move();
    h.y += dy * T.climb;
    if (dy) { h.climbDist += T.climb; if (h.climbDist % 8 < T.climb) LP.Audio.play('climb'); }
    if (h.y <= L.top) { h.y = L.top; h.plat = L.up; h.state = 'ground'; return; }
    if (h.y >= L.bot) { h.y = L.bot; h.plat = L.lo; h.state = 'ground'; return; }
    // step off near either end
    if (mv && L.top - h.y > -4) { h.y = L.top; h.plat = L.up; h.state = 'ground'; }
    else if (mv && L.bot - h.y < 4) { h.y = L.bot; h.plat = L.lo; h.state = 'ground'; }
  },

  // knocked about by a King stomp (harmless unless something else gets you)
  jolt(h) {
    if (h.state !== 'ground') return;
    h.state = 'air'; h.jumping = false; h.vy = -1.15; h.vx = 0; h.apexY = h.y;
  },

  // ------------------------------------------------------------------ draw
  draw(h) {
    const S = Sprites.hero, t = LP.Loop.time;
    if (h.invul > 0 && h.state !== 'dead' && Math.floor(h.invul * 15) % 2) return;
    const left = h.face < 0;
    let img = S.stand, ox = 8, oy = 16;
    switch (h.state) {
      case 'ground':
        if (Math.abs(h.vx) > 0.1 && !h.slip) {
          const f = Math.floor(h.dist / 5) % 4;
          img = f === 0 ? S.walkA : f === 2 ? S.walkB : S.stand;
        } else if (h.idleT > 5) img = S.blink;
        else img = Math.floor(t * 0.6) % 6 === 0 && (t * 0.6) % 1 < 0.12 ? S.blink : S.stand;
        break;
      case 'air': img = S.jump; break;
      case 'climb': img = Math.floor(h.climbDist / 6) % 2 ? S.climbB : S.climbA; break;
      case 'stun': img = left ? S.flatL : S.flatR; oy = 14; break;
      case 'win': img = Math.floor(h.deadT * 4) % 2 ? S.jump : S.stand; break;
      case 'dead':
        if (h.deadT < 0.5) img = S.hurt;
        else if (h.deadT < 1.6) img = S.spin[Math.floor(h.deadT * 10) % 4];
        else { img = left ? S.flatL : S.flatR; oy = 14; }
        break;
    }
    const bob = h.state === 'ground' && img === S.walkB ? 0 : 0;
    G.draw(img, h.x - ox, h.y - oy + bob, left && h.state !== 'climb' && h.state !== 'dead' && h.state !== 'stun');
    if (h.crown) Hero.drawCrown(h.x - 3 + (left ? -1 : 1), h.y - 19 - (img === S.jump ? 0 : 0));
    // dizzy stars / snoozing
    if (h.state === 'stun' || (h.state === 'dead' && h.deadT > 1.6)) {
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + i * 2.1;
        G.px(h.x + Math.cos(a) * 6, h.y - 10 + Math.sin(a) * 2, i % 2 ? '#ffe040' : '#fff');
      }
    }
    if (h.state === 'ground' && h.idleT > 5) {
      const k = (h.idleT * 1.5) % 3;
      Font.draw(LP.LCD.ctx, 'Z', h.x + 4 + k * 3, h.y - 20 - k * 5, '#9ad8ff', { face: 'small' });
    }
  },

  drawCrown(x, y) {
    G.rect(x, y + 2, 7, 2, '#ffd21a'); G.px(x, y + 1, '#ffd21a'); G.px(x + 3, y, '#ffd21a'); G.px(x + 3, y + 1, '#ffd21a'); G.px(x + 6, y + 1, '#ffd21a');
    G.px(x + 3, y + 2, '#e8103a');
  }
};
