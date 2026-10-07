/* PLAYER — the sloth: clean grid hops in four directions, riding platforms and belts,
   forgiving collision, and a death animation per hazard. Input: a tap during a hop is
   buffered and fires on landing; holding a direction keeps hopping after a short pause.
   Rows: 0 = home row, 1..N = lanes, N+1 = start. x is the sloth's centre (screen px). */
'use strict';
const Player = (function () {
  const CFG = GAME_CONFIG.sloth;
  const DIRS = ['up', 'down', 'left', 'right'];

  const P = {
    x: 160, row: 12, dir: 'up', hop: null, queued: null, repeatT: 0, dead: null, maxRow: 12,
    item: null, startRow: 12, startX: 160, t: 0, bonkT: 0, frozen: true, homeT: 0,

    lane(row) { return Lanes.list[row - 1] || null; },
    reset(row) {
      P.row = P.maxRow = row; P.x = P.startX = 160; P.dir = 'up'; P.hop = null; P.queued = null;
      P.dead = null; P.item = null; P.repeatT = 0; P.bonkT = 0; P.homeT = 0;
    },
    // feet position in world pixels (bottom of the row), including the hop arc
    feet() {
      if (P.dead && P.dead.wy !== undefined) return [P.dead.x, P.dead.wy];
      if (!P.hop) return [P.x, P.row * 16 + 14];
      const h = P.hop, p = h.t / h.dur;
      return [LP.lerp(h.x0, h.x1, p), LP.lerp(h.r0, h.r1, p) * 16 + 14 - Math.sin(p * Math.PI) * 4];
    },

    update() {
      P.t++;
      if (P.bonkT > 0) P.bonkT--;
      if (P.dead) return P.updateDead();
      if (P.homeT > 0) return;
      const I = LP.Input;
      for (const d of DIRS) if (I.consume(d)) P.queued = d;
      if (P.frozen) { P.queued = null; return; }

      if (P.hop) {
        const h = P.hop;
        h.x0 += h.carry; if (h.carryEnd) h.x1 += h.carry;
        h.t++;
        // traffic can still hit a sloth in mid-air
        const p = h.t / h.dur, row = Math.round(LP.lerp(h.r0, h.r1, p)), lane = P.lane(row), x = LP.lerp(h.x0, h.x1, p);
        if (lane && lane.type !== 'water') { const k = Lanes.hazard(lane, x - CFG.hitW / 2, x + CFG.hitW / 2, x); if (k && k !== 'splash') { P.x = x; P.row = row; return P.die(k); } }
        if (h.t >= h.dur) P.land();
        return;
      }

      // standing
      const lane = P.lane(P.row);
      if (lane) {
        if (lane.type === 'water') {
          const it = Lanes.platform(lane, P.x);
          if (!it) return P.die('splash');
          if (P.item !== it) P.item = it;
          P.x += lane.sp;
          Game.touchLeaf(lane, it);
        } else if (lane.type === 'belt') P.x += lane.sp;
        if (P.x < Lanes.PF0 + 2 || P.x > Lanes.PF1 - 2) return P.die('drift');
        const k = Lanes.hazard(lane, P.x - CFG.hitW / 2, P.x + CFG.hitW / 2, P.x);
        if (k) return P.die(k);
        if (lane.type === 'ice' && Lanes.stand(lane, P.x)) return P.die('splash');
      }

      if (P.repeatT > 0) P.repeatT--;
      let d = P.queued; P.queued = null;
      if (!d && P.repeatT <= 0) for (const k of DIRS) if (I.held(k)) { d = k; break; }
      if (d) P.tryHop(d);
    },

    tryHop(d) {
      P.dir = d;
      let tx = P.x, tr = P.row;
      if (d === 'left') tx -= 16; else if (d === 'right') tx += 16; else if (d === 'up') tr--; else tr++;
      if (tr > P.startRow) return P.bonk();
      if (d === 'left' || d === 'right') {
        tx = LP.clamp(tx, 16, 304);
        if (Math.abs(tx - P.x) < 1) return P.bonk();
      }
      let slot = null;
      if (tr === 0) {
        slot = Game.slotAt(P.x);
        if (!slot) return P.bonk();
        tx = slot.x;
      } else {
        const lane = P.lane(tr);
        const moving = lane && ((lane.type === 'water' && lane.sp) || lane.type === 'belt');
        if (!moving) tx = Lanes.colX(Lanes.nearestCol(tx));
      }
      const here = P.lane(P.row);
      let carry = 0;
      if (here && (here.type === 'belt' || (here.type === 'water' && P.item))) carry = here.sp;
      const carryEnd = tr === P.row;                       // a sideways hop stays on the moving thing
      P.hop = { x0: P.x, x1: tx, r0: P.row, r1: tr, t: 0, dur: CFG.hop, carry, carryEnd, slot };
      P.item = null;
      LP.Audio.play('hop', { d });
    },
    bonk() {
      if (P.bonkT) return;
      P.bonkT = 12; LP.Audio.play('bonk');
    },

    land() {
      const h = P.hop;
      P.hop = null; P.x = h.x1; P.row = h.r1; P.repeatT = CFG.repeat;
      if (P.row === 0) return Game.reachHome(h.slot);
      if (P.row < P.maxRow) { P.maxRow = P.row; Game.forward(); }
      const lane = P.lane(P.row);
      if (!lane) return;
      if (lane.type === 'water') {
        const it = Lanes.platform(lane, P.x);
        if (!it) return P.die('splash');
        P.item = it;
        LP.Audio.play(it.kind === 'turtle' || it.kind === 'gator' ? 'plip' : 'thunk');
      }
      if (lane.check) Game.checkpoint(P.row);
    },

    // ------------------------------------------------------------------ dying
    die(kind) {
      if (P.dead) return;
      const [x, wy] = P.feet();
      const lane = P.lane(P.row);
      P.dead = { kind, t: 0, x, wy, vx: 0, vy: 0, rot: 0, lane, dirX: lane ? (lane.dir || 1) : 1 };
      P.hop = null; P.item = null;
      const D = P.dead;
      if (kind === 'train') { D.vx = (lane ? lane.dir : 1) * 3.2; D.vy = -5.5; }
      if (kind === 'launch') { D.vx = LP.rand(-0.6, 0.6); D.vy = -6.5; }
      if (kind === 'drift') D.x = LP.clamp(x, 12, 308);
      Game.onDeath(kind, D);
    },
    updateDead() {
      const D = P.dead;
      D.t++;
      switch (D.kind) {
        case 'train': case 'launch':
          D.x += D.vx; D.wy += D.vy; D.vy += 0.28; D.rot += 0.22 * (D.vx >= 0 ? 1 : -1);
          break;
        case 'splash': case 'drift': case 'chomp':
          if (D.t < 40) D.wy += 0.45;
          break;
        case 'fall':
          if (D.t < 30) D.wy += 0.9;
          break;
      }
      if (D.t >= 84) Game.afterDeath();
    },

    // ------------------------------------------------------------------ drawing
    render() {
      const H = CFG.drawH;
      if (P.dead) return P.renderDead();
      const [x, wy] = P.feet();
      const sy = World.sy(wy);
      // pixel shadow on the ground (the only part of the sloth that is pixel art)
      const shadowY = P.hop ? World.sy(LP.lerp(P.hop.r0, P.hop.r1, P.hop.t / P.hop.dur) * 16 + 14) : sy;
      G.ellipse(x, shadowY, 5, 1.5, 'rgba(0,0,0,0.35)');
      let sxs = 1, sys = 1 + Math.sin(P.t * 0.08) * 0.015, rot = 0;
      if (P.hop) { const s = Math.sin(P.hop.t / P.hop.dur * Math.PI); sys = 1 + s * 0.08; sxs = 1 - s * 0.05; }
      else if (P.repeatT > CFG.repeat - 3) { sys = 0.93; sxs = 1.05; }                       // landing squash
      if (P.bonkT > 6) rot = (P.bonkT % 2 ? 0.05 : -0.05);
      const lane = P.lane(P.row);
      const bob = !P.hop && lane && lane.type === 'water' ? Math.round(Math.sin(P.t * 0.12)) * 0.5 : 0;
      Sloth.queue({ dir: P.dir, x, y: sy + bob, h: H, sx: sxs, sy: sys, rot, alpha: P.frozen && Game.phase === 'ready' && (P.t >> 3) % 2 ? 0.55 : 1 });
    },
    renderDead() {
      const D = P.dead, H = CFG.drawH, t = D.t, sy = World.sy(D.wy);
      const fade = t > 60 ? 1 - (t - 60) / 24 : 1;
      switch (D.kind) {
        case 'squash': case 'press':
          Sloth.queue({ dir: P.dir, x: D.x, y: sy, h: H, sy: Math.max(0.2, 1 - t * 0.2), sx: Math.min(1.55, 1 + t * 0.14), alpha: fade });
          break;
        case 'splash': case 'drift': case 'chomp': {
          const water = World.sy(P.row * 16 + 12);
          Sloth.queue({ dir: P.dir, x: D.x, y: sy, h: H, clipY: water, rot: Math.sin(t * 0.3) * 0.08, alpha: fade });
          break;
        }
        case 'fall':
          Sloth.queue({ dir: P.dir, x: D.x, y: sy, h: H, clipY: World.sy(P.row * 16 + 6), alpha: fade });
          break;
        case 'train': case 'launch':
          Sloth.queue({ dir: P.dir, x: D.x, y: sy, h: H, rot: D.rot, white: t < 6 ? 1 - t / 6 : 0 });
          break;
        case 'saw':
          Sloth.queue({ dir: P.dir, x: D.x, y: sy - Math.min(10, t * 0.5), h: H * Math.max(0.2, 1 - t / 70), rot: t * 0.3, white: (t >> 2) % 2 ? 0.8 : 0, alpha: fade });
          break;
        case 'time':
          Sloth.queue({ dir: 'down', x: D.x + Math.min(1, t / 20) * 6, y: sy, h: H, rot: Math.min(1, t / 20) * Math.PI / 2, alpha: fade });
          break;
        default:
          Sloth.queue({ dir: P.dir, x: D.x, y: sy, h: H, white: (t >> 2) % 2, alpha: fade });
      }
    }
  };
  return P;
})();
