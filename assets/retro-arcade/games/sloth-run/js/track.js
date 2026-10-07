/* TRACK — the road as a list of segments (pseudo-3D, one segment = SEG world units deep).
   A run is built stage by stage: the first stage at the start, and each next stage is appended
   only once the player has CHOSEN a fork, so the road ahead is always exactly what they'll drive.

   Segment
     i, stage            index, owning stage id (colours / scenery)
     y1, y2              world height at the near / far edge (hills)
     curve               bend (+ right)
     ca1, cb1            lateral centres of road A (left) and road B (right) at the near edge, in
                         road half-widths (u). Identical when the road is single; they part at a fork.
     showB               draw road B (false once the road not taken has peeled away)
     shore               { side, d } water beyond d u on that side (or null)
     band                rumble / grass stripe parity
     line                'start' | 'check' | 'goal'  checkered line across the road
     sprites             [{ spr, x, road }]   x = absolute lateral position (u)
     cars                traffic currently inside this segment (maintained by Traffic)
   Stage info (Track.stages[k]): { id, start, end, forkStart, decide, gate, goal, base, next }  */
'use strict';
const Track = (function () {
  const SEG = 200, RUMBLE = 3, D = 1.62;           // D: half the distance between the two road centres at a fork
  const T = { SEG, D, segs: [], stages: [], base: 0 };

  const easeIn = (a, b, p) => a + (b - a) * Math.pow(p, 2);
  const easeInOut = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);

  T.reset = function () { T.segs = []; T.stages = []; T.base = 0; };
  T.find = (z) => T.segs[LP.clamp(Math.floor(z / SEG), 0, T.segs.length - 1)];
  T.lastY = () => (T.segs.length ? T.segs[T.segs.length - 1].y2 : 0);
  T.length = () => T.segs.length * SEG;

  function addSeg(stage, curve, y, opts) {
    const i = T.segs.length, prev = T.segs[i - 1];
    const y1 = prev ? prev.y2 : 0;
    const s = {
      i, stage: stage.id, y1, y2: y, curve, ca1: T.base, cb1: T.base, showB: false,
      shore: null, band: Math.floor(i / RUMBLE) % 2, line: null, sprites: [], cars: [], clip: 0
    };
    if (opts) Object.assign(s, opts);
    T.segs.push(s);
    return s;
  }
  // centres at the far edge come from the next segment (or repeat the near edge)
  T.ca2 = (s) => { const n = T.segs[s.i + 1]; return n ? n.ca1 : s.ca1; };
  T.cb2 = (s) => { const n = T.segs[s.i + 1]; return n ? n.cb1 : s.cb1; };
  T.shore2 = (s) => { const n = T.segs[s.i + 1]; return n && n.shore ? n.shore.d : s.shore ? s.shore.d : 0; };

  // a section: ease into a bend / height, hold it, ease out
  function section(stage, enter, hold, leave, curve, toY) {
    const startY = T.lastY(), n = enter + hold + leave;
    let k = 0;
    for (let i = 0; i < enter; i++, k++) addSeg(stage, easeIn(0, curve, i / enter), easeInOut(startY, toY, (k + 1) / n));
    for (let i = 0; i < hold; i++, k++) addSeg(stage, curve, easeInOut(startY, toY, (k + 1) / n));
    for (let i = 0; i < leave; i++, k++) addSeg(stage, easeInOut(curve, 0, i / leave), easeInOut(startY, toY, (k + 1) / n));
  }
  const straight = (stage, n, toY) => section(stage, 0, n, 0, 0, toY === undefined ? T.lastY() : toY);

  // ---------------------------------------------------------------- scenery
  function place(seg, name, x, road, theme) {
    seg.sprites.push({ spr: typeof name === 'string' ? Scenery.get(name, theme.tint) : name, x, road: road || null });
  }
  function decorate(stage, from, to, r) {
    const rules = stage.decor;
    for (let i = from; i < to; i++) {
      const seg = T.segs[i];
      if (seg.line || seg.noDecor) continue;
      const c = seg.ca1;
      for (const rule of rules) {
        if (rule.curvesOnly && Math.abs(seg.curve) < 1.5) continue;
        const sides = rule.side === 'B' ? [-1, 1] : [rule.side === 'L' ? -1 : 1];
        for (const side of sides) {
          if (rule.every ? (i % rule.every) !== 0 : r() >= rule.chance) continue;
          const name = rule.s[Math.floor(r() * rule.s.length)], hit = Scenery[name].hit;
          // solid things keep a margin from the road edge; thin posts stand just off the rumble strip
          const off = Math.max(rule.off[0] + r() * (rule.off[1] - rule.off[0]), hit > 0.05 ? 1.48 + hit : hit > 0 ? 1.3 : 0);
          if (seg.shore && seg.shore.side === side) {
            if (rule.water ? off < seg.shore.d + 0.8 : off > seg.shore.d - 0.35) continue;
          } else if (rule.water) continue;
          place(seg, name, c + side * off, null, stage);
        }
      }
    }
  }
  // chevron boards on the outside of the sharper bends
  function chevrons(stage, from, to) {
    for (let i = from; i < to; i++) {
      const seg = T.segs[i];
      if (Math.abs(seg.curve) >= 3 && i % 7 === 0 && !seg.line) {
        const out = seg.curve > 0 ? -1 : 1;
        if (seg.shore && seg.shore.side === out && seg.shore.d < 1.8) continue;
        place(seg, seg.curve > 0 ? 'chevronR' : 'chevronL', seg.ca1 + out * 1.5, null, stage);
      }
    }
  }
  function shores(stage, from, to, r) {
    const sh = stage.shore;
    if (!sh) return;
    const ph = r() * 10, ph2 = r() * 10;
    for (let i = from; i < to; i++) {
      const k = i - from;
      const t = 0.5 + 0.35 * Math.sin(k * 0.0045 + ph) + 0.15 * Math.sin(k * 0.017 + ph2);
      T.segs[i].shore = { side: sh.side, d: sh.near + (sh.far - sh.near) * t };
    }
  }

  // ---------------------------------------------------------------- one stage
  // opts: { first: bool }.  Returns the stage info record (also pushed to T.stages).
  T.addStage = function (stage, opts) {
    opts = opts || {};
    const r = Px.rng(stage.id * 7919 + 13), R = stage.road;
    const start = T.segs.length, baseY = T.lastY();
    const info = { id: stage.id, start, base: T.base, baseY, final: Route.isFinal(stage.id) };

    // opening: a calm straight so stage changes and the start line read cleanly
    straight(stage, opts.first ? 40 : 70, baseY);
    if (opts.first) { T.segs[start + 14].line = 'start'; place(T.segs[start + 14], 'gateStart', T.base, null, stage); }

    // body
    let curDir = r() < 0.5 ? -1 : 1;
    while (T.segs.length - start < R.len) {
      const roll = r();
      const hillTarget = r() < R.hilly ? baseY + (r() * 2 - 1) * R.hill * SEG : (r() < 0.5 ? baseY : T.lastY());
      if (roll < R.curvy) {
        if (r() < 0.65) curDir = -curDir;
        const mag = 1 + r() * (R.curve - 1);
        const len = () => 18 + Math.floor(r() * 40);
        section(stage, len(), 20 + Math.floor(r() * 70), len(), curDir * mag, hillTarget);
        if (r() < 0.25 * R.curvy) section(stage, 20, 20 + Math.floor(r() * 30), 20, -curDir * Math.min(R.curve, mag + 1), T.lastY());   // S-bend
      } else {
        section(stage, 20, 30 + Math.floor(r() * 90), 20, 0, hillTarget);
      }
    }
    straight(stage, 40, baseY);           // settle back to the stage height before the finish
    const bodyEnd = T.segs.length;

    if (info.final) {
      straight(stage, 60);
      info.goal = T.segs.length;
      straight(stage, 1);
      T.segs[info.goal].line = 'goal';
      place(T.segs[info.goal], 'gateGoal', T.base, null, stage);
      straight(stage, 700);               // the victory lap into the sunset
      info.end = info.goal;
    } else {
      // ---- the fork: the road widens, splits around a median, and the two roads run side by side
      const nx = Route.next(stage.id);
      info.next = nx.map((s) => s.id);
      straight(stage, 50);
      info.forkStart = T.segs.length;
      const RAMP = 80, PLATEAU = 260, b = T.base;
      for (let k = 0; k < RAMP + PLATEAU; k++) {
        const s = k < RAMP ? easeInOut(0, 1, k / RAMP) : 1;
        addSeg(stage, 0, T.lastY(), { ca1: b - s * D, cb1: b + s * D, showB: true });
      }
      info.decide = info.forkStart + RAMP + 22;
      info.gate = info.decide + 64;
      info.end = info.gate;
      const signAt = T.segs[info.forkStart + 58];
      signAt.sprites.push({ spr: Scenery.get(Scenery.fork(nx[0].short, nx[1].short), stage.tint), x: b, road: null });
      for (let i = info.forkStart + 70; i < T.segs.length; i += 6) place(T.segs[i], i % 12 ? 'flowerBush' : 'post', b, null, stage);
      for (const side of [-1, 1]) {
        const g = T.segs[info.gate];
        place(g, 'gateCheck', b + side * D, side < 0 ? 'A' : 'B', stage);
      }
      T.segs[info.gate].line = 'check';
    }
    shores(stage, start, T.segs.length, r);
    // keep the fork zone dry and the median clear of beach umbrellas
    if (!info.final) for (let i = info.forkStart; i < T.segs.length; i++) if (T.segs[i].shore) T.segs[i].shore.d = Math.max(T.segs[i].shore.d, 4.6);
    decorate(stage, start + 4, info.final ? info.goal + 400 : info.forkStart, r);
    chevrons(stage, start, bodyEnd);
    info.length = (info.end - start) * SEG;
    T.stages.push(info);
    return info;
  };

  // ---------------------------------------------------------------- the choice is made
  // side: -1 left (road A), 1 right (road B).  Drops the unused placeholder road past the
  // checkpoint gate, appends the chosen stage, and lets the other road peel away and vanish.
  T.decide = function (info, side) {
    const nextId = info.next[side < 0 ? 0 : 1], otherRoad = side < 0 ? 'B' : 'A';
    const chosen = info.base + side * D, other = info.base - side * D;
    T.segs.length = info.gate + 1;                 // everything past the gate gets rebuilt
    T.base = chosen;
    const next = T.addStage(STAGES[nextId]);
    // the road not taken peels off and fades away (it lies on side -side of the chosen road)
    const from = info.decide + 10, span = 170, blend = 80;
    let lastGap = 0;
    for (let i = from; i < T.segs.length; i++) {
      const s = T.segs[i], k = i - from;
      if (k > span) {
        s.showB = false; s.ca1 = s.cb1 = chosen;
        if (k > span + blend) break;
        if (s.shore && s.shore.side === -side) s.shore.d = Math.max(s.shore.d, lastGap * (1 - (k - span) / blend));
        continue;
      }
      const o = other - side * easeIn(0, 9, k / span);
      if (side < 0) { s.ca1 = chosen; s.cb1 = o; } else { s.cb1 = chosen; s.ca1 = o; }
      s.showB = true; s.only = side < 0 ? 'A' : 'B';
      lastGap = Math.abs(o - chosen) + 1.5;
      if (s.shore && s.shore.side === -side) s.shore.d = Math.max(s.shore.d, lastGap);
      // no trees growing on the old road; its gate rides along with it
      s.sprites = s.sprites.filter((sp) => sp.road === otherRoad || Math.abs(sp.x - o) > 1.35);
      for (const sp of s.sprites) if (sp.road === otherRoad) sp.x = o;
    }
    return next;
  };

  // lateral centre of a road at a segment's near edge
  T.center = (seg, road) => (road === 'B' ? seg.cb1 : seg.ca1);
  // is lateral x on a driveable surface at this segment?  returns the nearest road centre too
  T.surface = function (seg, x) {
    const a = seg.ca1, b = seg.cb1;
    const da = seg.only === 'B' ? Infinity : Math.abs(x - a), db = seg.showB && seg.only !== 'A' ? Math.abs(x - b) : Infinity;
    const c = da <= db ? a : b, d = Math.min(da, db);
    return { on: d <= 1.0, center: c, d, road: da <= db ? 'A' : 'B' };
  };
  return T;
})();
