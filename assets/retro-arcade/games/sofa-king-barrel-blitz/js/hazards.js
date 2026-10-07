/* HAZARDS — everything Sofa King throws.
   Barrels roll downhill, drop through openings, sometimes take ladders down (more
   likely when the sloth is below), and kicked barrels hop small gaps. Wild barrels
   bounce down through the tiers toward the sloth. Oddballs each move their own way:
   tumbling appliances, hopping ducks, flopping fish, bouncing tires and trash cans.
   All motion is scaled by ts (sloth time). Positions are bottom-centre (x, y). */
'use strict';
const Hazards = (function () {
  const KINDS = {
    barrel: { w: 10, h: 10, mode: 'roll', ladders: true, pts: 'barrel' },
    wild: { w: 10, h: 10, mode: 'wild', pts: 'wild' },
    toilet: { w: 12, h: 12, mode: 'tumble', pts: 'odd', speed: 0.72, snd: 'flush' },
    microwave: { w: 12, h: 9, mode: 'tumble', pts: 'odd', speed: 0.78, snd: 'ding' },
    chair: { w: 10, h: 12, mode: 'tumble', pts: 'odd', speed: 0.85, bounce: 60, bounceV: 1.2, snd: 'clatter' },
    duck: { w: 9, h: 7, mode: 'hop', pts: 'duck', speed: 1.0, hopV: 1.25, wait: 5, snd: 'squeak' },
    can: { w: 10, h: 12, mode: 'roll', ladders: true, pts: 'odd', speed: 0.95, bounce: 70, bounceV: 1.4, snd: 'clatter' },
    tv: { w: 12, h: 11, mode: 'tumble', pts: 'odd', speed: 0.72, snd: 'static' },
    fish: { w: 12, h: 6, mode: 'hop', pts: 'odd', speed: 0.9, hopV: 1.6, wait: 12, snd: 'fishflop' },
    toolbox: { w: 12, h: 8, mode: 'tumble', pts: 'industrial', speed: 0.8, snd: 'clatter' },
    tire: { w: 12, h: 12, mode: 'roll', pts: 'industrial', speed: 1.08, bounce: 52, bounceV: 2.0, snd: 'boing' }
  };
  const ODD = new Set(['toilet', 'microwave', 'chair', 'duck', 'can', 'tv', 'fish']);
  const GRAV = 0.12;

  const H = { list: [], KINDS, ODD, thudT: 0, rollT: 0 };

  H.reset = function () { H.list.length = 0; };
  H.count = () => H.list.length;

  H.spawn = function (kind, x, y, dir, o) {
    const K = KINDS[kind], d = Game.diff;
    const z = {
      kind, K, x, y, dir, w: K.w, h: K.h, state: 'air', plat: null, vx: dir * 0.9, vy: -0.7,
      speed: d.speed * (K.speed || 1), rot: 0, wait: 0, bt: K.bounce ? K.bounce * LP.rand(0.6, 1.2) : 0,
      seen: new Set(), pass: new Set(), jumped: -1, fast: false, force: 0, lad: null, bounced: false, age: 0
    };
    if (o && o.kicked) { z.state = 'roll'; z.plat = World.platAt(x, y, 3) || World.plats[World.plats.length - 1]; z.y = World.surf(z.plat, x); z.speed *= 1.75; z.fast = true; z.vx = dir * z.speed; }
    if (K.mode === 'wild') { z.state = 'wild'; z.vx = dir * 1.0; z.vy = -1.3; }
    H.list.push(z);
    if (K.snd && ODD.has(kind)) LP.Audio.play(K.snd);
    return z;
  };

  // ------------------------------------------------------------------ update
  H.update = function (ts) {
    if (H.thudT > 0) H.thudT -= ts;
    for (const z of H.list) {
      z.age += ts;
      if (z.state === 'roll') ground(z, ts);
      else if (z.state === 'air') air(z, ts);
      else if (z.state === 'ladder') ladder(z, ts);
      else if (z.state === 'wild') wild(z, ts);
      if (z.force > 0) z.force -= ts;
    }
    LP.prune(H.list, (z) => z.dead || z.x < -20 || z.x > 340 || z.y > 270);
    // a low rolling rumble while barrels are about
    if (H.list.some((z) => z.state === 'roll' && z.K.mode === 'roll') && (H.rollT -= ts) <= 0) { H.rollT = 16; LP.Audio.play('roll'); }
  };

  function ground(z, ts) {
    const p = z.plat, K = z.K;
    if (z.force <= 0) {
      if (p.belt) z.dir = p.belt.dir;
      else { const s = World.slopeDir(p); if (s) z.dir = s; }
    }
    const v = p.belt && z.force <= 0 ? World.beltSpeed + z.speed * 0.55 : z.speed;
    // hoppers: duck and fish
    if (K.mode === 'hop') {
      if ((z.wait -= ts) > 0) return;
      z.state = 'air'; z.vy = -K.hopV; z.vx = z.dir * v; z.bounced = true;
      if (K.snd && Math.random() < 0.5) LP.Audio.play(K.snd);
      return;
    }
    // bouncers: tires, cans, chairs
    if (K.bounce && (z.bt -= ts) <= 0) {
      z.bt = K.bounce * LP.rand(0.8, 1.2);
      z.state = 'air'; z.vy = -K.bounceV; z.vx = z.dir * v; z.bounced = true;
      if (K.snd === 'boing') LP.Audio.play('boing');
      return;
    }
    const ox = z.x;
    z.x += z.dir * v * ts; z.vx = z.dir * v;
    z.rot += v * ts * z.dir;
    if (K.ladders && !z.fast) ladders(z, ox);
    if (z.state !== 'roll') return;
    if (z.x < p.x0 || z.x > p.x1) {
      const q = World.next(p, z.dir);
      if (q) z.plat = q;
      else {
        const gap = z.fast && World.across(p, z.dir);
        z.state = 'air'; z.bounced = !!gap;
        if (gap) { z.vy = -1.5; z.vx = z.dir * v; }                 // kicked barrels skip small gaps
        else { z.vy = 0.15; z.vx = z.dir * v * 0.35; }
        return;
      }
    }
    z.y = World.surf(z.plat, z.x);
  }

  function ladders(z, ox) {
    const hero = Game.hero, d = Game.diff;
    for (const L of World.ladders) {
      if (L.up !== z.plat || z.seen.has(L)) continue;
      if ((ox - L.x) * (z.x - L.x) > 0) continue;               // not crossing this ladder top
      z.seen.add(L);
      if (hero.state === 'climb' && hero.lad === L) continue;    // never drop onto a sloth already on it
      let p = d.ladder;
      if (hero.y > z.y + 8 && Math.abs(hero.x - L.x) < 64) p += 0.3;   // the King aims
      if (Math.random() < p) { z.state = 'ladder'; z.lad = L; z.x = L.x; z.wait = 12; return; }   // teeters at the top first
    }
  }

  function ladder(z, ts) {
    if (z.wait > 0) { z.wait -= ts; return; }
    z.y += Math.max(0.6, z.speed * 0.75) * ts;
    if (z.y >= z.lad.bot) {
      z.y = z.lad.bot; z.plat = z.lad.lo; z.state = 'roll';
      const s = World.slopeDir(z.plat);
      z.dir = s || (Math.random() < 0.5 ? -1 : 1);
      thud(z);
    }
  }

  function air(z, ts) {
    z.vy = Math.min(z.vy + GRAV * ts, 3.2);
    const oy = z.y;
    z.x += z.vx * ts; z.y += z.vy * ts;
    z.rot += z.vx * ts * 0.5;
    if (z.x < 12 && z.vx < 0 && z.y < 220) z.vx = -z.vx * 0.5;
    if (z.x > 308 && z.vx > 0 && z.y < 220) z.vx = -z.vx * 0.5;
    if (z.vy > 0) {
      const q = World.landing(z.x, oy, z.y, null, 1);
      if (q) land(z, q);
    }
  }

  function land(z, q) {
    z.y = World.surf(q, z.x);
    if (z.vy > 1.5 && !z.bounced) {                                  // one little bounce after a drop
      z.vy = -z.vy * 0.3; z.vx *= 0.5; z.bounced = true; thud(z);
      return;
    }
    z.state = 'roll'; z.plat = q; z.vy = 0; z.bounced = false;
    const s = World.slopeDir(q);
    if (z.force <= 0) z.dir = q.belt ? q.belt.dir : s || Math.sign(z.vx) || z.dir;
    if (z.K.mode === 'hop') z.wait = z.K.wait;
    if (z.age > 20) thud(z);
  }

  function wild(z, ts) {
    z.vy = Math.min(z.vy + 0.1 * ts, 2.6);
    const oy = z.y;
    z.x += z.vx * ts; z.y += z.vy * ts; z.rot += z.vx * ts * 0.8;
    if (z.x < 14) z.vx = Math.abs(z.vx);
    if (z.x > 306) z.vx = -Math.abs(z.vx);
    if (z.vy <= 0) return;
    const q = World.landing(z.x, oy, z.y, z.pass, 0);
    if (!q) return;
    z.y = World.surf(q, z.x);
    if (q === World.floor) { z.state = 'roll'; z.plat = q; z.dir = Math.sign(z.vx) || 1; z.vy = 0; thud(z, true); return; }
    // bounce, then crash down through this platform next time
    z.pass.add(q);
    z.vy = -1.7;
    const hx = Game.hero.x;
    z.vx = LP.clamp((hx - z.x) / 50, -0.9, 0.9) || (Math.random() < 0.5 ? -0.6 : 0.6);
    thud(z, true);
  }

  function thud(z, big) {
    G.dust(z.x, z.y, big ? 3 : 2, '#a08870');
    if (H.thudT <= 0) { H.thudT = 5; LP.Audio.play(big ? 'thudBig' : 'thud'); }
  }

  // King stomp: everything grounded hops and reverses for a moment
  H.stomp = function () {
    for (const z of H.list) {
      if (z.state !== 'roll') continue;
      z.dir = -z.dir; z.force = 70;
      z.state = 'air'; z.vy = -1.4; z.vx = z.dir * z.speed * 0.6; z.bounced = true;
    }
  };

  // hydraulic press came down between x0..x1 at surface y
  H.crushAt = function (x0, x1, y) {
    for (const z of H.list) {
      if (z.x < x0 || z.x > x1 || Math.abs(z.y - y) > 14) continue;
      z.dead = true;
      G.burst(z.x, z.y - 5, 10, '#b8682c', { speed: 1.8 });
      LP.Audio.play('crunch');
      Game.addScore(GAME_CONFIG.rules.points.crush, z.x, z.y - 14);
    }
  };

  // vanish in a puff (stage clear / death reset)
  H.poof = function () {
    for (const z of H.list) G.burst(z.x, z.y - 5, 6, '#e0e0e0', { speed: 1.2, life: 18 });
    H.list.length = 0;
  };

  H.box = (z) => ({ x: z.x - z.w / 2 + 2, y: z.y - z.h + 3, w: z.w - 4, h: z.h - 4 });   // forgiving

  // ------------------------------------------------------------------ draw
  H.draw = function () {
    for (const z of H.list) {
      let img, flip = false;
      const q = Math.floor(Math.abs(z.rot) / 3.5) % 8, dirQ = z.rot < 0 ? (8 - q) % 8 : q;
      switch (z.kind) {
        case 'barrel':
          img = z.state === 'ladder' ? Sprites.barrelUp : Sprites.barrel[dirQ];
          if (z.state === 'ladder' && z.wait > 0) { G.draw(img, z.x - 5 + (Math.floor(z.wait / 2) % 2), z.y - 12); continue; }   // teetering
          break;
        case 'wild': img = Sprites.wild[dirQ]; break;
        case 'tire': img = Sprites.tire[dirQ % 4]; break;
        case 'duck': img = Sprites.items.duck; flip = z.dir < 0; break;
        case 'fish': img = Sprites.fishFlop[z.state === 'air' ? Math.floor(z.age / 6) % 2 : 0]; flip = z.dir < 0; break;
        default: {
          const turn = z.K.mode === 'tumble' ? Math.floor(Math.abs(z.rot) / 7) : Math.floor(Math.abs(z.rot) / 5);
          img = Sprites.tumble[z.kind][(z.rot < 0 ? 4 - (turn % 4) : turn) % 4];
        }
      }
      G.draw(img, z.x - (img.width >> 1), z.y - img.height, flip);
    }
  };

  return H;
})();
