/* LANES — builds a stage's lanes from js/stages.js and simulates them.
   Every moving thing is a PURE FUNCTION OF THE STAGE CLOCK t (frames): item x, dive state,
   gator jaws, trains, presses... so play is deterministic and tools/bot.js can look ahead
   exactly by asking "what is in lane L at x at frame t?". Only thin ice keeps state
   (it cracks under a sloth that stands still).

   Geometry: the screen is 320 wide; the playfield is x 8..312 (19 columns, centres 16+16c).
   A lane's items live on a loop of L px; screen x = loopPos - off, where off >= the widest
   item and L >= 320 + off, so wrapping always happens off screen. */
'use strict';
const Lanes = (function () {
  const COLS = 19, PF0 = 8, PF1 = 312;
  const colX = (c) => 16 + 16 * c;
  const mod = (a, n) => ((a % n) + n) % n;

  // pattern letters -> kinds. w = cells per item (fixed), run = a run of letters is one item
  const KINDS = {
    road: {
      c: { id: 'car', w: 1 }, s: { id: 'sports', w: 1 }, x: { id: 'taxi', w: 1 }, p: { id: 'police', w: 1 },
      m: { id: 'moto', w: 1, inset: 3 }, k: { id: 'tractor', w: 1 }, T: { id: 'truck', w: 2 }, B: { id: 'bus', w: 3 },
      l: { id: 'limo', w: 3 }, d: { id: 'dozer', w: 2 }, R: { id: 'roller', w: 2 }, M: { id: 'mixer', w: 2 },
      D: { id: 'dump', w: 2 }, n: { id: 'snake', w: 2, inset: 4 }, u: { id: 'plow', w: 2 }, g: { id: 'penguin', w: 1, inset: 3 },
      e: { id: 'sled', w: 1 }, z: { id: 'zamboni', w: 2 }, f: { id: 'forklift', w: 1 }, o: { id: 'robot', w: 1, inset: 3 },
      i: { id: 'icecream', w: 2 }, w: { id: 'mower', w: 1, inset: 3 }, v: { id: 'dog', w: 1, inset: 3 }, q: { id: 'swamptruck', w: 2 }
    },
    water: {
      L: { id: 'log', run: true }, t: { id: 'turtle', run: true }, T: { id: 'turtle', run: true, dive: true },
      r: { id: 'raft', run: true }, p: { id: 'pad', w: 1 }, P: { id: 'pad', w: 1, dive: true }, G: { id: 'gator', w: 3 },
      f: { id: 'floe', run: true }, F: { id: 'floe', run: true, dive: true }, b: { id: 'barrel', w: 1 },
      c: { id: 'crate', run: true }, B: { id: 'barge', run: true }
    },
    belt: { s: { id: 'saw', w: 1, inset: 3 }, g: { id: 'gear', w: 2, inset: 3 } }
  };
  // timed hazard kinds: frames of warning, frames active (deadly)
  const TIMED = { press: { warn: 36, on: 26 }, manhole: { warn: 34, on: 80 }, geyser: { warn: 40, on: 30 }, steam: { warn: 30, on: 40 } };
  const DEATH = { press: 'press', manhole: 'fall', geyser: 'launch', steam: 'launch' };

  function parse(def, kinds) {
    let pat = def.pat, items = [];
    const runs = [];
    // collect runs of identical letters
    for (let i = 0; i < pat.length;) {
      const ch = pat[i];
      if (ch === '.' || !kinds[ch]) { i++; continue; }
      let j = i; while (j < pat.length && pat[j] === ch) j++;
      runs.push([ch, i, j - i]); i = j;
    }
    let maxCells = 1;
    for (const [ch, , n] of runs) maxCells = Math.max(maxCells, kinds[ch].run ? n : kinds[ch].w);
    const unit = pat.length;
    let reps = 1;
    if (def.sp) while (unit * reps < COLS + 1 + maxCells) reps++;
    else while (unit * reps < COLS) reps++;
    for (let r = 0; r < reps; r++) {
      for (const [ch, start, n] of runs) {
        const k = kinds[ch], base = r * unit + start;
        if (k.run) items.push({ ch, kind: k.id, cell: base, cells: n, dive: !!k.dive, inset: k.inset || 2 });
        else for (let c = 0; c + k.w <= n; c += k.w) items.push({ ch, kind: k.id, cell: base + c, cells: k.w, dive: !!k.dive, inset: k.inset || 2 });
      }
    }
    if (!def.sp) items = items.filter((it) => it.cell + it.cells <= COLS);
    return { items, cells: def.sp ? unit * reps : COLS, maxCells };
  }

  function build(def, i, stage) {
    const lane = {
      i, row: i + 1, def, type: def.type, th: def.th || stage.theme, sp: def.sp || 0, dir: (def.sp || 0) < 0 ? -1 : 1,
      surf: def.surf || null, items: [], check: !!def.check
    };
    const kinds = KINDS[def.type];
    if (kinds) {
      const p = parse(def, kinds);
      lane.L = p.cells * 16; lane.off = p.maxCells * 16;
      lane.diveP = def.dive || 260;
      p.items.forEach((it, n) => {
        it.x0 = it.cell * 16; it.w = it.cells * 16; it.n = n; it.x = 0;
        it.doff = Math.floor(mod(n * 0.37 + i * 0.21, 1) * lane.diveP);          // stagger dives
        it.joff = Math.floor(mod(n * 0.53 + i * 0.17, 1) * 160);                   // stagger gator jaws
        it.hue = (n * 7 + i * 3) % 6;                                                 // car colour pick
        lane.items.push(it);
      });
    }
    if (def.type === 'rail') {
      lane.every = def.every; lane.tsp = Math.abs(def.sp || 7); lane.dir = (def.sp || 7) < 0 ? -1 : 1;
      lane.cars = def.cars || 5; lane.trainW = (lane.cars + 1) * 32; lane.toff = def.off || 0;
      lane.dur = Math.ceil((320 + lane.trainW + 8) / lane.tsp);
      lane.train = null; lane.warn = false;
    }
    if (def.type === 'timed') {
      lane.kind = def.kind; lane.per = def.per; lane.cfg = TIMED[def.kind];
      lane.cells = [];
      for (let c = 0; c < COLS; c++) {
        const ch = def.pat[c % def.pat.length];
        if (ch >= '0' && ch <= '9') lane.cells.push({ col: c, ph: Math.floor(+ch * def.per / 10), state: 0, local: 0 });
      }
    }
    if (def.type === 'ice') {
      lane.ice = [];
      for (let c = 0; c < COLS; c++) lane.ice.push({ crack: 0, hole: 0 });
    }
    return lane;
  }

  // ---------------------------------------------------------------- pure time functions
  function itemX(lane, it, t) {
    if (!lane.sp) return PF0 + it.x0;
    return mod(it.x0 + lane.sp * t, lane.L) - lane.off;
  }
  // 0 surfaced, 1 sinking (still safe), 2 under (unsafe), 3 rising (safe)
  function diveState(lane, it, t) {
    if (!it.dive) return 0;
    const P = lane.diveP, ph = mod(t + it.doff, P), up = P - 120;
    if (ph < up) return 0;
    if (ph < up + 30) return 1;
    if (ph < up + 90) return 2;
    return 3;
  }
  const diveFrac = (lane, it, t) => { const P = lane.diveP, ph = mod(t + it.doff, P), up = P - 120; return ph < up ? 0 : (ph - up) / 120; };
  const jawsOpen = (it, t) => mod(t + it.joff, 160) < 70;
  // the gator's head cell (front, in its direction of travel)
  function headSpan(lane, it, x) { return lane.dir > 0 ? [x + it.w - 16, x + it.w] : [x, x + 16]; }

  function trainAt(lane, t) {
    const local = mod(t + lane.toff, lane.every);
    if (local >= lane.dur) return null;
    const x = lane.dir > 0 ? -lane.trainW + local * lane.tsp : 320 - local * lane.tsp;
    return { x, w: lane.trainW, local };
  }
  const trainWarn = (lane, t) => { const local = mod(t + lane.toff, lane.every); return local >= lane.every - 80 || local < lane.dur; };

  function timedState(lane, cell, t) {
    const local = mod(t + cell.ph, lane.per), c = lane.cfg;
    if (local >= lane.per - c.on) return 2;            // active
    if (local >= lane.per - c.on - c.warn) return 1;   // warning
    return 0;
  }

  // ---------------------------------------------------------------- queries
  const L = {
    COLS, PF0, PF1, colX, KINDS, TIMED, list: [], t: 0,
    itemX, diveState, diveFrac, jawsOpen, headSpan, trainAt, trainWarn, timedState,
    nearestCol(x) { return LP.clamp(Math.round((x - 16) / 16), 0, COLS - 1); },

    load(stage) {
      L.list = stage.lanes.map((d, i) => build(d, i, stage));
      L.t = 0;
      L.update(0);
      return L.list;
    },

    // advance render state to frame t (positions, train, timers, thin ice)
    update(t) {
      L.t = t;
      for (const lane of L.list) {
        for (const it of lane.items) { it.x = itemX(lane, it, t); it.ds = diveState(lane, it, t); }
        if (lane.type === 'rail') {
          const was = lane.warn, hadTrain = !!lane.train;
          lane.train = trainAt(lane, t); lane.warn = trainWarn(lane, t);
          lane.bell = lane.warn && !was; lane.horn = !!lane.train && !hadTrain;
        }
        if (lane.type === 'timed') for (const c of lane.cells) { const s = timedState(lane, c, t); c.fire = s === 2 && c.state !== 2; c.state = s; c.local = mod(t + c.ph, lane.per); }
        if (lane.type === 'ice') for (const c of lane.ice) {
          if (c.hole > 0) { if (--c.hole === 0) c.crack = 0; }
          else if (c.crack > 0 && !c.stood) c.crack = Math.max(0, c.crack - 0.004);
          c.stood = false;
        }
      }
    },

    // A sloth standing on thin ice: crack it. Returns true when it breaks.
    stand(lane, x) {
      const c = lane.ice[L.nearestCol(x)];
      c.stood = true;
      if (c.hole) return true;
      c.crack += 1 / 75;
      if (c.crack >= 1) { c.hole = 240; c.crack = 1; return true; }
      return false;
    },

    // The platform under centre x in a water lane (null = water). at = frame (defaults to now).
    platform(lane, cx, at) {
      const t = at === undefined ? L.t : at;
      for (const it of lane.items) {
        const x = at === undefined ? it.x : itemX(lane, it, t);
        if (cx < x - 2 || cx > x + it.w + 2) continue;
        if (diveState(lane, it, t) === 2) continue;
        return it;
      }
      return null;
    },

    // What kills a sloth occupying [x0, x1] (centre cx) in this lane at frame t? -> death kind or null.
    // Water lanes only report the gator's jaws; sinking is decided by platform().
    hazard(lane, x0, x1, cx, at) {
      const t = at === undefined ? L.t : at;
      switch (lane.type) {
        case 'road': case 'belt':
          for (const it of lane.items) {
            const x = at === undefined ? it.x : itemX(lane, it, t);
            if (x1 > x + it.inset && x0 < x + it.w - it.inset) return lane.type === 'belt' ? 'saw' : 'squash';
          }
          return null;
        case 'water':
          for (const it of lane.items) {
            if (it.kind !== 'gator' || !jawsOpen(it, t)) continue;
            const x = at === undefined ? it.x : itemX(lane, it, t), h = headSpan(lane, it, x);
            if (cx > h[0] + 1 && cx < h[1] - 1) return 'chomp';
          }
          return null;
        case 'rail': {
          const tr = at === undefined ? lane.train : trainAt(lane, t);
          if (tr && x1 > tr.x + 2 && x0 < tr.x + tr.w - 2) return 'train';
          return null;
        }
        case 'timed':
          for (const c of lane.cells) {
            if (timedState(lane, c, t) !== 2) continue;
            const cx0 = colX(c.col) - 8;
            if (cx > cx0 + 1 && cx < cx0 + 15) return DEATH[lane.kind];
          }
          return null;
        case 'ice': {
          const c = lane.ice[L.nearestCol(cx)];
          return c.hole ? 'splash' : null;
        }
      }
      return null;
    },

    // Horizontal speed of whatever carries a sloth in this lane (platform or belt), px / frame.
    carry(lane, item) {
      if (lane.type === 'belt') return lane.sp;
      if (lane.type === 'water' && item) return lane.sp;
      return 0;
    },
    moving(lane) { return lane.type === 'water' || lane.type === 'belt'; }
  };
  return L;
})();
