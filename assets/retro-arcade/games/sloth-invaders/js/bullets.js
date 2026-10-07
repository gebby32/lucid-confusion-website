/* BULLETS — everything the sloths throw at Earth, plus falling pickups.
   Ordinary energy fire is the real threat; the unusual ordnance (acorns, space bananas,
   tiny flaming couches, coffee mugs, very small meteors) is rarer, slower and can be
   shot out of the sky for points. Hitboxes are a pixel slimmer than the art. */
'use strict';
const Bullets = {
  list: [], pickups: [],
  KINDS: {
    zap: { w: 3, h: 7, hb: [0, 1, 3, 6] },
    drop: { w: 3, h: 6, hb: [0, 1, 3, 5] },
    needle: { w: 1, h: 7, hb: [0, 1, 1, 6], fast: 1.25 },
    orb: { w: 3, h: 6, hb: [0, 1, 3, 5] },
    acorn: { w: 5, h: 5, hb: [1, 1, 3, 4], comedy: true, name: 'ACORN' },
    banana: { w: 6, h: 6, hb: [1, 1, 4, 4], comedy: true, name: 'BANANA' },
    couch: { w: 7, h: 5, hb: [1, 1, 5, 4], comedy: true, name: 'COUCH' },
    mug: { w: 6, h: 5, hb: [1, 1, 4, 4], comedy: true, name: 'MUG' },
    meteor: { w: 5, h: 5, hb: [1, 1, 3, 4], comedy: true, name: 'METEOR' }
  },
  COMEDY: ['acorn', 'banana', 'couch', 'mug', 'meteor'],

  reset() { Bullets.list = []; Bullets.pickups = []; },
  enemyCount() { return Bullets.list.length; },

  fire(kind, x, y, speed, vx) {
    const K = Bullets.KINDS[kind];
    const b = { kind, K, x: x - K.w / 2, y, vx: vx || 0, vy: speed * (K.fast || 1), t: 0, seed: Math.random() * 6 };
    Bullets.list.push(b);
    GameAudio.enemyShot(kind);
    return b;
  },
  comedy(x, y, def, kind) {
    kind = kind || (def && def.hyper && LP.chance(0.6) ? 'mug' : LP.pick(Bullets.COMEDY));
    const sp = def ? def.bulletSpeed : 1.5;
    const mult = { acorn: 0.9, banana: 0.8, couch: 0.65, mug: 1, meteor: 1.1 }[kind];
    const px = Game.player ? Game.player.x : 192;
    const vx = kind === 'meteor' ? LP.clamp((px - x) / 160, -0.5, 0.5) : 0;
    return Bullets.fire(kind, x, y, sp * mult, vx);
  },
  box(b) { const h = b.K.hb; return { x: b.x + h[0], y: b.y + h[1], w: h[2], h: h[3] }; },

  update(dt) {
    LP.prune(Bullets.list, (b) => {
      b.t += dt;
      const y0 = b.y;
      if (b.kind === 'banana') b.x += Math.sin(b.t * 3 + b.seed) * 0.5;
      else if (b.kind === 'acorn') b.x += Math.sin(b.t * 9 + b.seed) * 0.25;
      b.x += b.vx; b.y += b.vy;
      if (b.kind === 'mug' && Math.floor(b.t * 60) % 6 === 0) LP.FX.spawn({ x: b.x + 2, y: b.y - 1, vx: LP.rand(-0.2, 0.2), vy: -0.3, g: 0, life: 14, color: '#c8d0e0', size: 1, draw: G._part });
      if ((b.kind === 'meteor' || b.kind === 'couch') && Math.floor(b.t * 60) % 3 === 0)
        LP.FX.spawn({ x: b.x + b.K.w / 2 + LP.rand(-1, 1), y: b.y, vx: 0, vy: -0.2, g: 0, life: 10, color: LP.pick(['#ff8a1a', '#ffd040', '#ff3a32']), size: 1, draw: G._part });
      // ice bunkers take the hit
      const h = b.K.hb, c = Barriers.sweep(b.x + h[0], b.x + h[0] + h[2] - 1, y0 + h[1] + h[3], b.y + h[1] + h[3]);
      if (c) { Barriers.carve(c.b, c.lx, c.ly, 1); GameAudio.crunch(); return true; }
      if (b.y > 204) { Bullets.splash(b); return true; }
      return b.x < -10 || b.x > 394;
    });
    LP.prune(Bullets.pickups, (p) => { p.t += dt; p.y += 0.55; return p.y > 200; });
  },

  // shots that reach the ground leave a little scorch / splat
  splash(b) {
    const x = b.x + b.K.w / 2;
    G.burst(x, 204, b.K.comedy ? 6 : 3, b.K.comedy ? '#ffd040' : '#b8ff40', { speed: 0.9, life: 12, lift: 0.8 });
  },

  drop(kind, x, y) { Bullets.pickups.push({ kind, x: x - 4, y, t: 0 }); },

  draw() {
    const g = LP.LCD.ctx, S = Sprites;
    for (const b of Bullets.list) {
      const f = Math.floor(b.t * 12) % 2, x = Math.round(b.x), y = Math.round(b.y);
      let img;
      switch (b.kind) {
        case 'zap': img = S.zap[f]; break;
        case 'drop': case 'orb': img = S.drop[f]; break;
        case 'needle': img = S.needle[f]; break;
        case 'banana': img = S.banana[Math.floor(b.t * 10) % 4]; break;
        case 'couch': img = S.couch[f]; break;
        default: img = S[b.kind];
      }
      g.drawImage(img, x, y);
    }
    for (const p of Bullets.pickups) {
      g.drawImage(S.pickups[p.kind][Math.floor(p.t * 6) % 2], Math.round(p.x), Math.round(p.y));
    }
  }
};
