/* CITY — Lethargy City, generated deterministically from a hand-placed road plan.
   168 x 160 tiles of 16 px. Five districts:
     NEON MILE (north-west downtown), RUSTWATER DOCKS (east), PAWN ROW (south-west),
     MIDTOWN (precinct, hospital, park), PALM STRIP (hotels + the beach).
   Provides: tile queries, buildings (drawn as fake-3D blocks leaning away from the
   camera), props, static lights, the road graph traffic / police drive on, landmark
   zones for missions, the ground (lazily rendered 256 px chunks that also keep
   skid marks and scorch marks), and the radar map. */
'use strict';
const City = (function () {
  const T = 16, MW = 168, MH = 160, WPX = MW * T, HPX = MH * T, CH = 256;
  const TL = { WATER: 0, ROAD: 1, WALK: 2, BLD: 3, GRASS: 4, SAND: 5, ALLEY: 6, PIER: 7, PLAZA: 8, YARD: 9, LOT: 10 };
  const EMPTY = 255;
  const PK = 1 / 640;                       // building lean: offset = (centre - camera) * height * PK
  const tiles = new Uint8Array(MW * MH).fill(EMPTY);
  const bidx = new Int16Array(MW * MH).fill(-1);
  const rh = new Int8Array(MW * MH).fill(-1), rv = new Int8Array(MW * MH).fill(-1);
  const idx = (x, y) => y * MW + x;
  const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const get = (x, y) => (inMap(x, y) ? tiles[idx(x, y)] : TL.WATER);
  const set = (x, y, t) => { if (inMap(x, y)) tiles[idx(x, y)] = t; };
  const fill = (x0, y0, w, h, t) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, t); };
  function hash(x, y, k) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // ------------------------------------------------------------------ the road plan
  const HR = [
    { name: 'NORTH SHORE DR', y: 5, w: 4, x0: 5, x1: 158 },
    { name: 'CECROPIA ST', y: 24, w: 2, x0: 5, x1: 138 },
    { name: 'NEON BLVD', y: 40, w: 4, x0: 5, x1: 158 },
    { name: 'LAZY LN', y: 58, w: 2, x0: 5, x1: 138 },
    { name: 'PAWN ST', y: 74, w: 2, x0: 5, x1: 100 },
    { name: 'MIDTOWN AVE', y: 90, w: 4, x0: 5, x1: 158 },
    { name: 'YAWN ST', y: 108, w: 2, x0: 5, x1: 138 },
    { name: 'PALM STRIP BLVD', y: 126, w: 4, x0: 5, x1: 158 }
  ];
  const VR = [
    { name: 'WEST SHORE DR', x: 5, w: 4, y0: 5, y1: 130 },
    { name: 'HAMMOCK ST', x: 24, w: 2, y0: 5, y1: 130 },
    { name: 'MAIN AVE', x: 42, w: 4, y0: 5, y1: 130 },
    { name: 'MOSS ST', x: 60, w: 2, y0: 24, y1: 130 },
    { name: 'DOZE ST', x: 78, w: 2, y0: 5, y1: 130 },
    { name: 'GRAND AVE', x: 96, w: 4, y0: 5, y1: 130 },
    { name: 'SNORE ST', x: 114, w: 2, y0: 5, y1: 110 },
    { name: 'RUST ST', x: 136, w: 2, y0: 24, y1: 130 },
    { name: 'HARBOR RD', x: 154, w: 4, y0: 5, y1: 130 }
  ];

  const DISTRICTS = {
    neon: { name: 'NEON MILE', min: 4, max: 7, alley: 0.18, hgt: [40, 92], minimap: '#3b3456' },
    docks: { name: 'RUSTWATER DOCKS', min: 5, max: 10, alley: 0.1, hgt: [18, 30], minimap: '#3a4048' },
    pawn: { name: 'PAWN ROW', min: 3, max: 6, alley: 0.4, hgt: [16, 36], minimap: '#4a3634' },
    midtown: { name: 'MIDTOWN', min: 4, max: 8, alley: 0.15, hgt: [24, 56], minimap: '#3a3e50' },
    beach: { name: 'PALM STRIP', min: 5, max: 9, alley: 0.1, hgt: [26, 64], minimap: '#5a4050' }
  };
  function districtAt(tx, ty) {
    if (ty >= 108) return 'beach';
    if (tx >= 96 && ty < 90) return 'docks';
    if (ty < 58) return 'neon';
    if (tx < 96) return 'pawn';
    return 'midtown';
  }

  const SIGNS = {
    neon: ['SLOTH LIFE', 'CLUB', 'LAZY LOUNGE', 'NAP BAR', 'KARAOKE', 'HOTEL ZZZ', 'BURGER THRONE', 'DISCO NAP', 'THE HANGOUT', 'TOE-TALLY TATTOOS', 'SNOOZE BANK', 'LEAF LOUNGE', 'SLOWBUCKS'],
    pawn: ['PAWN', 'CASH 4 LEAVES', 'LIQUOR', '24/SLOW', 'BAIL BONDS', 'CHECKS CASHED', 'DELI', 'SLEEPY MATTRESS', 'PAWN', 'LOANS', 'TATTOO'],
    docks: ['RUSTWATER CO', 'FISH', 'SHIPPING', 'NO NAPPING', 'CECROPIA IMPORTS', 'BAIT'],
    midtown: ['SNOOZE BANK', 'CITY HALL', 'DOZE DINER', 'LAUNDRY', 'GYM? NAH'],
    beach: ['SURF SHOP', 'SLOTHERITA', 'TIKI BAR', 'MOTEL', 'ICE CREAM', 'HOTEL DOZE', 'CABANA']
  };
  const NEONS = ['#ff4fb4', '#3ef0ff', '#ffd23e', '#9dff4a', '#ff7a2e', '#b46bff'];

  // ------------------------------------------------------------------ containers of things
  const buildings = [], props = [], lights = [], zones = {}, parkSpots = [], spawns = { ped: [] };
  const nodes = [], edges = [];
  const propGrid = new Map(), lightGrid = new Map();
  const PG = 64, LG = 256;
  const gkey = (cx, cy) => cx * 4096 + cy;

  const PROPS = {
    lamp: { r: 2, hp: 1, solid: true, knock: true },
    hydrant: { r: 3, hp: 1, solid: true, knock: true },
    tree: { r: 4, hp: 1e9, solid: true },
    palm: { r: 3, hp: 1e9, solid: true },
    barrel: { r: 4, hp: 15, solid: true, explode: 46 },
    pump: { r: 5, hp: 25, solid: true, explode: 70 },
    dumpster: { r: 7, hp: 1e9, solid: true },
    bench: { r: 4, hp: 1, solid: true, knock: true },
    trash: { r: 3, hp: 1, solid: true, knock: true },
    cone: { r: 2, hp: 1, solid: true, knock: true },
    umbrella: { r: 0, hp: 1e9, solid: false },
    fountain: { r: 11, hp: 1e9, solid: true },
    crate: { r: 5, hp: 10, solid: true, knock: true },
    tower: { r: 0, hp: 1e9, solid: false }
  };
  function addProp(kind, x, y, o) {
    const P = PROPS[kind];
    const p = Object.assign({ kind, x, y, r: P.r, hp: P.hp, solid: P.solid, explode: P.explode || 0, knock: !!P.knock, dead: false, a: 0, light: null, seed: hash(x, y, 7) }, o);
    props.push(p);
    const k = gkey(Math.floor(x / PG), Math.floor(y / PG));
    if (!propGrid.has(k)) propGrid.set(k, []);
    propGrid.get(k).push(p);
    return p;
  }
  function addLight(x, y, r, col, o) {
    const l = Object.assign({ x, y, r, col, on: true, flick: 0 }, o);
    lights.push(l);
    const k = gkey(Math.floor(x / LG), Math.floor(y / LG));
    if (!lightGrid.has(k)) lightGrid.set(k, []);
    lightGrid.get(k).push(l);
    return l;
  }
  function addBuilding(x, y, w, h, style, hgt, o) {
    const b = Object.assign({ id: buildings.length, tx: x, ty: y, tw: w, th: h, x: x * T, y: y * T, w: w * T, h: h * T, style, hgt, z0: 0, seed: hash(x, y, 3) * 1e6 | 0, neon: [], roof: null, signs: [] }, o);
    buildings.push(b);
    if (!b.noTiles) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { set(xx, yy, TL.BLD); bidx[idx(xx, yy)] = b.id; }
    return b;
  }
  // a neon sign on a roof: placed centred unless pos given; skipped if it doesn't fit
  function sign(b, text, col, o) {
    o = o || {};
    let face = o.face || (Font.width(text, 'big') + 8 <= b.w ? 'big' : 'small');
    if (face === 'big' && Font.width(text, 'big') + 6 > b.w) face = 'small';
    const tw = Font.width(text, face), th = face === 'big' ? 7 : 5;
    if (tw + 4 > b.w || th + 4 > b.h) return null;
    const s = { text, col, face, x: o.x !== undefined ? o.x : Math.round((b.w - tw) / 2), y: o.y !== undefined ? o.y : Math.round((b.h - th) / 2), w: tw, h: th, flicker: o.flicker || 0, phase: hash(b.x, b.y, 11) * 10 };
    b.signs.push(s);
    // the sign also lights the street around the building
    addLight(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * 0.6 + 30, col, { a: 0.35, neon: true });
    return s;
  }

  // ------------------------------------------------------------------ build
  function build() {
    const rng = RNG(20261006);
    // water all round, beach in the south
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (x < 3 || y < 3 || x >= 160 || y >= 152) set(x, y, TL.WATER);
      else if (y >= 132) set(x, y, TL.SAND);
    }
    // roads
    HR.forEach((r, i) => { for (let y = r.y; y < r.y + r.w; y++) for (let x = r.x0; x < r.x1; x++) { set(x, y, TL.ROAD); rh[idx(x, y)] = i; } });
    VR.forEach((r, i) => { for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y0; y < r.y1; y++) { set(x, y, TL.ROAD); rv[idx(x, y)] = i; } });
    // sidewalks: two tiles either side of every road
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (get(x, y) !== EMPTY) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (get(x + dx, y + dy) === TL.ROAD) { near = true; break; }
      if (near) set(x, y, TL.WALK);
    }
    // piers on the east bay
    for (const py of [30, 50, 66, 82, 104]) { fill(160, py, 7, 3, TL.PIER); }
    fill(120, 140, 3, 18, TL.PIER);                                   // the long beach pier

    buildLandmarks(rng);

    // every block that's left: find each empty region and fill it with lots
    const seen = new Uint8Array(MW * MH);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (get(x, y) !== EMPTY || seen[idx(x, y)]) continue;
      const reg = flood(x, y, seen);
      const d = districtAt(reg.x + (reg.w >> 1), reg.y + (reg.h >> 1));
      if (reg.n === reg.w * reg.h) fillLots(reg.x, reg.y, reg.w, reg.h, d, rng, 0);
      else for (const t of reg.list) set(t % MW, (t / MW) | 0, TL.PLAZA);
    }
    beach(rng);
    streetProps(rng);
    graph();
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const t = get(x, y);
      if ((t === TL.WALK || t === TL.PLAZA) && hash(x, y, 5) < 0.5) spawns.ped.push(idx(x, y));
    }
    sorted = buildings.slice().sort((a, b) => a.hgt - b.hgt || a.id - b.id);
    radar = makeRadar();
  }

  function flood(x0, y0, seen) {
    const st = [idx(x0, y0)], list = [];
    seen[st[0]] = 1;
    let minx = x0, maxx = x0, miny = y0, maxy = y0;
    while (st.length) {
      const i = st.pop(), x = i % MW, y = (i / MW) | 0;
      list.push(i);
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!inMap(nx, ny)) continue;
        const j = idx(nx, ny);
        if (!seen[j] && tiles[j] === EMPTY) { seen[j] = 1; st.push(j); }
      }
    }
    return { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1, n: list.length, list };
  }

  // ------------------------------------------------------------------ lots (BSP)
  function fillLots(x, y, w, h, d, rng, depth) {
    const S = DISTRICTS[d];
    const canH = h >= S.min * 2, canW = w >= S.min * 2;
    if ((w <= S.max && h <= S.max) || (!canH && !canW) || depth > 6) return lot(x, y, w, h, d, rng);
    let horiz = h > w ? canH : !canW;
    if (horiz && !canH) horiz = false;
    const len = horiz ? h : w;
    const alley = rng() < S.alley && len >= S.min * 2 + 2;
    const gap = alley ? 2 : 0;
    const cut = rng.int(S.min, len - S.min - gap);
    if (horiz) {
      fillLots(x, y, w, cut, d, rng, depth + 1);
      if (alley) alleyStrip(x, y + cut, w, 2, rng);
      fillLots(x, y + cut + gap, w, h - cut - gap, d, rng, depth + 1);
    } else {
      fillLots(x, y, cut, h, d, rng, depth + 1);
      if (alley) alleyStrip(x + cut, y, 2, h, rng);
      fillLots(x + cut + gap, y, w - cut - gap, h, d, rng, depth + 1);
    }
  }
  function alleyStrip(x, y, w, h, rng) {
    fill(x, y, w, h, TL.ALLEY);
    const n = Math.max(1, Math.floor((w * h) / 10));
    for (let i = 0; i < n; i++) {
      const px = (x + rng.range(0.3, w - 0.3)) * T, py = (y + rng.range(0.3, h - 0.3)) * T;
      const r = rng();
      if (r < 0.35) addProp('dumpster', px, py, { a: w > h ? 0 : Math.PI / 2 });
      else if (r < 0.55) addProp('barrel', px, py);
      else if (r < 0.75) addProp('trash', px, py);
    }
  }

  function heightFor(d, rng) { const H = DISTRICTS[d].hgt; return Math.round(rng.range(H[0], H[1])); }
  const STYLE_BY = { neon: 'tower', docks: 'warehouse', pawn: 'brick', midtown: 'office', beach: 'hotel' };

  function lot(x, y, w, h, d, rng) {
    const r = rng();
    if (d === 'neon') {
      if (r < 0.8) return tower(x, y, w, h, d, rng);
      if (r < 0.9) return plaza(x, y, w, h, rng, '#a0769a');
      return parking(x, y, w, h, rng);
    }
    if (d === 'pawn') {
      if (r < 0.72) return plainBuilding(x, y, w, h, d, rng);
      if (r < 0.88) return parking(x, y, w, h, rng);
      alleyStrip(x, y, w, h, rng); return;
    }
    if (d === 'docks') {
      if (r < 0.5) return plainBuilding(x, y, w, h, d, rng);
      if (r < 0.92) return yard(x, y, w, h, rng);
      return parking(x, y, w, h, rng);
    }
    if (d === 'midtown') {
      if (r < 0.62) return plainBuilding(x, y, w, h, d, rng);
      if (r < 0.85) return park(x, y, w, h, rng);
      return parking(x, y, w, h, rng);
    }
    // beach
    if (r < 0.62) return plainBuilding(x, y, w, h, d, rng);
    if (r < 0.8) return parking(x, y, w, h, rng);
    return plaza(x, y, w, h, rng, '#b49a86', true);
  }
  function plainBuilding(x, y, w, h, d, rng) {
    const b = addBuilding(x, y, w, h, STYLE_BY[d], heightFor(d, rng));
    const chance = { neon: 0.65, pawn: 0.5, docks: 0.18, midtown: 0.3, beach: 0.55 }[d];
    if (rng() < chance) sign(b, rng.pick(SIGNS[d]), rng.pick(NEONS), { flicker: rng() < 0.15 ? 1 : 0 });
    else if (d === 'pawn' && rng() < 0.4) b.graffiti = true;
    return b;
  }
  function tower(x, y, w, h, d, rng) {
    const hgt = heightFor(d, rng);
    if (w >= 6 && h >= 6 && rng() < 0.5) {
      // podium + tower
      const base = addBuilding(x, y, w, h, 'tower', Math.round(hgt * 0.35));
      const m = 1;
      const t = addBuilding(x + m, y + m, w - 2 * m, h - 2 * m, 'tower', hgt, { z0: base.hgt, noTiles: true });
      if (rng() < 0.7) sign(t, rng.pick(SIGNS.neon), rng.pick(NEONS), { flicker: rng() < 0.15 ? 1 : 0 });
      return;
    }
    const b = addBuilding(x, y, w, h, 'tower', hgt);
    if (rng() < 0.6) sign(b, rng.pick(SIGNS.neon), rng.pick(NEONS), { flicker: rng() < 0.15 ? 1 : 0 });
    else if (w >= 5 && h >= 4 && rng() < 0.4) b.billboard = rng.pick([['SLOW CRIME', 'SMOOTHER TIMES'], ['HUSTLE', 'NAPS ARE 4 LOSERS'], ['SLOTH LIFE', 'TAKE IT EASY']]);
  }
  function plaza(x, y, w, h, rng, col, pool) {
    fill(x, y, w, h, TL.PLAZA);
    plazaColors.push({ x, y, w, h, col });
    if (pool && w >= 4 && h >= 4) { pools.push({ x: (x + 1) * T, y: (y + 1) * T, w: (w - 2) * T, h: (h - 2) * T }); }
    else {
      for (let i = 0; i < Math.max(1, (w * h) / 12); i++) {
        const px = (x + rng.range(0.5, w - 0.5)) * T, py = (y + rng.range(0.5, h - 0.5)) * T;
        rng() < 0.6 ? addProp('tree', px, py) : addProp('bench', px, py, { a: rng() < 0.5 ? 0 : Math.PI / 2 });
      }
    }
  }
  function park(x, y, w, h, rng) {
    fill(x, y, w, h, TL.GRASS);
    const cx = x + (w >> 1), cy = y + (h >> 1);
    fill(x, cy, w, 1, TL.PLAZA); fill(cx, y, 1, h, TL.PLAZA);
    for (let i = 0; i < (w * h) / 5; i++) {
      const tx = rng.int(x, x + w - 1), ty = rng.int(y, y + h - 1);
      if (get(tx, ty) !== TL.GRASS) continue;
      addProp('tree', (tx + 0.5) * T + rng.range(-3, 3), (ty + 0.5) * T + rng.range(-3, 3));
    }
  }
  function parking(x, y, w, h, rng) {
    fill(x, y, w, h, TL.LOT);
    if (h >= 3) {
      for (let tx = x; tx < x + w; tx++) {
        parkSpots.push({ x: (tx + 0.5) * T, y: y * T + 14, a: Math.PI / 2 * (rng() < 0.5 ? 1 : -1), stall: 'top', full: rng() < 0.55 });
        if (h >= 5) parkSpots.push({ x: (tx + 0.5) * T, y: (y + h) * T - 14, a: Math.PI / 2 * (rng() < 0.5 ? 1 : -1), stall: 'bottom', full: rng() < 0.55 });
      }
    } else if (w >= 3) {
      for (let ty = y; ty < y + h; ty++) parkSpots.push({ x: x * T + 14, y: (ty + 0.5) * T, a: rng() < 0.5 ? 0 : Math.PI, stall: 'left', full: rng() < 0.5 });
    }
    addLight((x + w / 2) * T, (y + h / 2) * T, 56, '#ffe9b0', { a: 0.5 });
  }
  function yard(x, y, w, h, rng) {
    fill(x, y, w, h, TL.YARD);
    // container stacks on a grid, with lanes between
    for (let ty = y + 1; ty + 1 < y + h; ty += 3) {
      for (let tx = x + 1; tx + 2 < x + w; tx += 4) {
        if (rng() < 0.35) continue;
        const vert = rng() < 0.3;
        if (vert) addBuilding(tx, ty, 1, 2, 'container', rng() < 0.5 ? 9 : 16, { col: rng.int(0, 5) });
        else addBuilding(tx, ty, 2, 1, 'container', rng() < 0.5 ? 9 : 16, { col: rng.int(0, 5) });
      }
    }
    for (let i = 0; i < 3; i++) {
      const px = (x + rng.range(0.5, w - 0.5)) * T, py = (y + rng.range(0.5, h - 0.5)) * T;
      if (get(Math.floor(px / T), Math.floor(py / T)) === TL.YARD) addProp(rng() < 0.6 ? 'barrel' : 'crate', px, py);
    }
    addLight((x + w / 2) * T, (y + h / 2) * T, 70, '#cfe8ff', { a: 0.45 });
  }

  // ------------------------------------------------------------------ landmarks
  const plazaColors = [], pools = [];
  function block(px, py) {
    // the empty rectangle around a point (blocks are rectangles between sidewalks)
    let x0 = px, x1 = px, y0 = py, y1 = py;
    while (get(x0 - 1, py) === EMPTY) x0--;
    while (get(x1 + 1, py) === EMPTY) x1++;
    while (get(px, y0 - 1) === EMPTY) y0--;
    while (get(px, y1 + 1) === EMPTY) y1++;
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  const zone = (name, tx, ty, r, extra) => { zones[name] = Object.assign({ x: tx * T, y: ty * T, r: r || 20 }, extra); return zones[name]; };

  function buildLandmarks(rng) {
    let B;
    // MAMA MOSS PAWN & LOAN (the safehouse) — Pawn Row
    B = block(33, 66);
    { const b = addBuilding(B.x, B.y, B.w, 4, 'brick', 28, { name: 'MAMA MOSS' });
      sign(b, 'MAMA MOSS', '#ff4fb4', { y: 8 }); sign(b, 'PAWN & LOAN', '#ffd23e', { face: 'small', y: 26 }); b.graffiti = false; }
    parking(B.x, B.y + 4, B.w, B.h - 4, rng);
    zone('mama', 33.5, 61, 14);
    zone('safehouse', 33.5, 60.5, 14);

    // TOE-TAL AUTO chop shop — Pawn Row
    B = block(70, 82);
    { const b = addBuilding(B.x, B.y, B.w, 4, 'warehouse', 22, { name: 'CHOP SHOP', roofCol: 1 });
      sign(b, 'TOE-TAL AUTO', '#ff7a2e'); }
    fill(B.x, B.y + 4, B.w, B.h - 4, TL.YARD);
    zone('chop', B.x + B.w / 2, B.y + 7, 26);
    addLight((B.x + B.w / 2) * T, (B.y + 7) * T, 70, '#ffb070', { a: 0.6 });

    // GAS N' NAP — Pawn Row (explosive pumps!)
    B = block(16, 82);
    { const b = addBuilding(B.x, B.y, 4, 4, 'shop', 16); sign(b, '24/SLOW', '#9dff4a', { face: 'small' }); }
    fill(B.x + 4, B.y, B.w - 4, B.h, TL.LOT);
    fill(B.x, B.y + 4, 4, B.h - 4, TL.LOT);
    { const gx = (B.x + 6) * T, gy = (B.y + 3) * T;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) addProp('pump', gx + i * 40, gy + j * 40);
      canopies.push({ x: gx - 18, y: gy - 16, w: 40 + 36, h: 40 + 32, text: "GAS N' NAP", hgt: 22 });
      addLight(gx + 20, gy + 20, 90, '#f4f8ff', { a: 0.8 }); }
    zone('gas', B.x + 7, B.y + 4, 40);

    // SLOW-N-SPRAY #1 — Pawn Row (bay opens north)
    B = block(52, 100);
    sprayShop(B.x, B.y, B.w, B.h, 'spray1', rng);

    // CLUB HANG LOOSE — Neon Mile
    B = block(52, 50);
    fill(B.x, B.y, B.w, 2, TL.PLAZA); plazaColors.push({ x: B.x, y: B.y, w: B.w, h: 2, col: '#c0508e' });
    { const b = addBuilding(B.x, B.y + 2, B.w, B.h - 2, 'club', 34, { name: 'CLUB HANG LOOSE' });
      sign(b, 'CLUB', '#3ef0ff', { y: 6 }); sign(b, 'HANG LOOSE', '#ff4fb4', { y: 18 }); }
    zone('club', B.x + B.w / 2, B.y - 0.5, 14);
    addLight((B.x + B.w / 2) * T, B.y * T, 80, '#ff4fb4', { a: 0.7 });

    // THE VELVET NAP — Neon Mile (Baron Velvet's club)
    B = block(88, 32);
    { const b = addBuilding(B.x, B.y, B.w, B.h - 2, 'velvet', 50, { name: 'VELVET NAP' });
      sign(b, 'VELVET', '#b46bff', { y: 10 }); sign(b, 'NAP', '#ffd23e', { y: 22 }); }
    fill(B.x, B.y + B.h - 2, B.w, 2, TL.PLAZA); plazaColors.push({ x: B.x, y: B.y + B.h - 2, w: B.w, h: 2, col: '#8a2040', carpet: true });
    zone('velvet', B.x + B.w / 2, B.y + B.h, 20);
    addLight((B.x + B.w / 2) * T, (B.y + B.h) * T, 80, '#b46bff', { a: 0.7 });

    // PRECINCT 27 — Midtown
    B = block(106, 100);
    { const b = addBuilding(B.x, B.y, B.w, 5, 'police', 30, { name: 'PRECINCT 27' }); sign(b, 'PRECINCT 27', '#3ef0ff', { face: 'small', y: 6 }); }
    parking(B.x, B.y + 5, B.w, B.h - 5, rng);
    parkSpots.forEach((s) => { if (s.x > B.x * T && s.x < (B.x + B.w) * T && s.y > (B.y + 5) * T && s.y < (B.y + B.h) * T) { s.police = true; s.full = rng() < 0.6; } });
    zone('precinct', B.x + B.w / 2, B.y - 1, 16);

    // ST. SLOTH'S HOSPITAL — Midtown
    B = block(125, 100);
    { const b = addBuilding(B.x, B.y, B.w, B.h - 3, 'hospital', 36, { name: "ST. SLOTH'S" }); sign(b, "ST. SLOTH'S", '#ff5050', { face: 'small', y: 5 }); }
    fill(B.x, B.y + B.h - 3, B.w, 3, TL.PLAZA); plazaColors.push({ x: B.x, y: B.y + B.h - 3, w: B.w, h: 3, col: '#8c96a4' });
    zone('hospital', B.x + B.w / 2, B.y + B.h - 1.5, 16);

    // SNOOZE PARK — Midtown
    B = block(88, 100);
    park(B.x, B.y, B.w, B.h, rng);
    addProp('fountain', (B.x + B.w / 2) * T, (B.y + B.h / 2) * T);
    zone('park', B.x + B.w / 2, B.y - 1, 14);

    // THREE-TOE HQ — the docks compound
    B = block(146, 75);
    fill(B.x, B.y, B.w, B.h, TL.YARD);
    { const b = addBuilding(B.x + 2, B.y + 2, B.w - 4, 8, 'warehouse', 30, { name: 'THREE-TOE HQ', roofCol: 2 }); b.graffiti3 = true; }
    for (let i = 0; i < 4; i++) addBuilding(B.x + 1 + i * 3, B.y + 13, 2, 1, 'container', 16, { col: (i * 2) % 6 });
    for (let i = 0; i < 3; i++) addBuilding(B.x + 2 + i * 3, B.y + 19, 1, 2, 'container', 9, { col: (i + 3) % 6 });
    for (let i = 0; i < 6; i++) addProp('barrel', (B.x + 1.5 + i * 1.8) * T, (B.y + 11.2) * T);
    zone('terry', B.x + B.w / 2, B.y + 16, 60);
    zone('rocketcache', B.x + B.w - 2, B.y + 22, 10);
    addLight((B.x + B.w / 2) * T, (B.y + 16) * T, 90, '#9dff4a', { a: 0.35 });

    // DOCKS WAREHOUSE drop-off
    B = block(146, 32);
    { const b = addBuilding(B.x, B.y, B.w, 5, 'warehouse', 26, { roofCol: 0 }); sign(b, 'CECROPIA IMPORTS', '#ffd23e', { face: 'small' }); }
    fill(B.x, B.y + 5, B.w, B.h - 5, TL.YARD);
    zone('dockdrop', B.x + B.w / 2, B.y + 7.5, 26);
    addLight((B.x + B.w / 2) * T, (B.y + 7.5) * T, 70, '#ffe9b0', { a: 0.6 });

    // SPRAY #2 + the Velvet warehouse — Rustwater
    B = block(125, 75);
    { const sw = 10, sh = 10;
      fillLots(B.x, B.y, B.w, B.h - sh, 'docks', rng, 0);
      fillLots(B.x, B.y + B.h - sh, B.w - sw, sh, 'docks', rng, 0);
      sprayShop(B.x + B.w - sw, B.y + B.h - sh, sw, sh, 'spray2', rng, 'E'); }

    B = block(106, 75);
    fill(B.x, B.y, B.w, B.h, TL.YARD);
    { const b = addBuilding(B.x + 1, B.y + 2, B.w - 2, 9, 'velvet', 30, { name: 'HUSTLE WAREHOUSE' }); sign(b, 'HUSTLE', '#ff7a2e'); }
    for (let i = 0; i < 3; i++) addBuilding(B.x + 1 + i * 3, B.y + 14, 2, 1, 'container', 16, { col: (i + 1) % 6 });
    addBuilding(B.x + 1, B.y + 19, 1, 2, 'container', 9, { col: 4 });
    addBuilding(B.x + 7, B.y + 19, 1, 2, 'container', 16, { col: 0 });
    for (let i = 0; i < 4; i++) addProp('barrel', (B.x + 2 + i * 2) * T, (B.y + 12.2) * T);
    zone('velvetwh', B.x + B.w / 2, B.y + 17, 50);
    zone('mamacell', B.x + B.w / 2, B.y + 21.5, 10);
    addLight((B.x + B.w / 2) * T, (B.y + 17) * T, 90, '#ff7a2e', { a: 0.35 });

    // the big parking lot (the ambush) — Pawn Row
    B = block(34, 100);
    parking(B.x, B.y, B.w, B.h, rng);
    addBuilding(B.x + B.w - 2, B.y + 4, 2, 2, 'shop', 14);
    zone('garage', B.x + B.w / 2, B.y + B.h / 2, 60);

    // HOTEL SIESTA + its car park (the Sloth GT) — Palm Strip
    B = block(70, 116);
    { const b = addBuilding(B.x, B.y, B.w, 6, 'hotel', 56, { name: 'HOTEL SIESTA', pool: true }); sign(b, 'HOTEL SIESTA', '#3ef0ff', { face: 'small', y: 4 }); }
    parking(B.x, B.y + 6, B.w, B.h - 6, rng);
    zone('gtspot', B.x + 3.5, B.y + 6.9, 10);
    zone('hotel', B.x + B.w / 2, B.y + B.h, 30);
  }

  const canopies = [];
  function sprayShop(x, y, w, h, name, rng, open) {
    open = open || 'N';
    const bw = 4, depth = 5;
    if (open === 'N') {
      const bx = x + ((w - bw) >> 1);
      addBuilding(x, y, bx - x, h, 'brick', 22);
      addBuilding(bx + bw, y, x + w - bx - bw, h, 'brick', 22);
      const back = addBuilding(bx, y + depth, bw, h - depth, 'spray', 22);
      fill(bx, y, bw, depth, TL.YARD);
      sign(back, 'SPRAY', '#3ef0ff', { face: 'small', y: 4 });
      zone(name, bx + bw / 2, y + depth / 2, 22, { open });
      canopies.push({ x: bx * T, y: y * T, w: bw * T, h: 10, text: 'SLOW-N-SPRAY', hgt: 24, banner: true });
      addLight((bx + bw / 2) * T, (y + 1) * T, 70, '#3ef0ff', { a: 0.6 });
    } else {
      const by = y + ((h - bw) >> 1);
      addBuilding(x, y, w, by - y, 'brick', 22);
      addBuilding(x, by + bw, w, y + h - by - bw, 'brick', 22);
      const back = addBuilding(x, by, w - depth, bw, 'spray', 22);
      fill(x + w - depth, by, depth, bw, TL.YARD);
      sign(back, 'SPRAY', '#3ef0ff', { face: 'small' });
      zone(name, x + w - depth / 2, by + bw / 2, 22, { open });
      addLight((x + w - 1) * T, (by + bw / 2) * T, 70, '#3ef0ff', { a: 0.6 });
    }
  }

  function beach(rng) {
    // palms along the promenade, umbrellas and towels on the sand, lifeguard towers, the stage
    for (let x = 6; x < 158; x += rng.int(3, 5)) addProp('palm', (x + rng.range(0, 1)) * T, (133 + rng.range(0, 2)) * T);
    for (let i = 0; i < 55; i++) {
      const x = rng.range(5, 157) * T, y = rng.range(139, 149) * T;
      if (Math.abs(x - 121 * T) < 40 || (x > 68 * T && x < 92 * T)) continue;
      addProp('umbrella', x, y, { col: rng.pick(['#ff4fb4', '#3ef0ff', '#ffd23e', '#ff7a2e', '#9dff4a']) });
    }
    for (const tx of [22, 50, 108, 140]) addBuilding(tx, 143, 2, 2, 'shack', 18, { tower: true });
    // the Beach Stage
    { const b = addBuilding(76, 135, 8, 3, 'stage', 14, { name: 'BEACH STAGE' }); sign(b, 'BEACH STAGE', '#ff4fb4', { face: 'small' }); }
    fill(72, 138, 16, 6, TL.PLAZA); plazaColors.push({ x: 72, y: 138, w: 16, h: 6, col: '#6a3a7a', disco: true });
    zone('stage', 80, 141, 34);
    addLight(80 * T, 141 * T, 110, '#ff4fb4', { a: 0.6 });
    // a beach bar
    { const b = addBuilding(30, 134, 6, 3, 'shack', 14); sign(b, 'SLOTHERITA', '#9dff4a', { face: 'small' }); }
    // pier lights
    for (let y = 142; y < 158; y += 5) addLight(121.5 * T, y * T, 40, '#ffe0a0', { a: 0.6 });
  }

  function streetProps(rng) {
    // street lamps every 7 tiles along each road, both sides, on the curb-side sidewalk tile
    HR.forEach((r) => {
      for (let x = r.x0 + 3; x < r.x1 - 1; x += 7) {
        for (const [ty, oy] of [[r.y - 1, 13], [r.y + r.w, 3]]) {
          if (get(x, ty) !== TL.WALK || get(x - 1, ty) === TL.ROAD || get(x + 1, ty) === TL.ROAD) continue;
          const p = addProp('lamp', x * T + 8, ty * T + oy);
          p.light = addLight(p.x, p.y + (oy < 8 ? 10 : -10), 50, '#ffcf7a', { a: 0.85 });
        }
      }
    });
    VR.forEach((r) => {
      for (let y = r.y0 + 3; y < r.y1 - 1; y += 7) {
        for (const [tx, ox] of [[r.x - 1, 13], [r.x + r.w, 3]]) {
          if (get(tx, y) !== TL.WALK || get(tx, y - 1) === TL.ROAD || get(tx, y + 1) === TL.ROAD) continue;
          const p = addProp('lamp', tx * T + ox, y * T + 8);
          p.light = addLight(p.x + (ox < 8 ? 10 : -10), p.y, 50, '#ffcf7a', { a: 0.85 });
        }
      }
    });
    // hydrants, trash cans, benches sprinkled on sidewalks
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (get(x, y) !== TL.WALK) continue;
      const h = hash(x, y, 9);
      const nearRoad = get(x + 1, y) === TL.ROAD || get(x - 1, y) === TL.ROAD || get(x, y + 1) === TL.ROAD || get(x, y - 1) === TL.ROAD;
      if (nearRoad) continue;      // keep the curb lane clear
      if (h < 0.012) addProp('hydrant', x * T + 8, y * T + 8);
      else if (h < 0.024) addProp('trash', x * T + 8, y * T + 8);
      else if (h < 0.03) addProp('bench', x * T + 8, y * T + 8, { a: (get(x + 2, y) === TL.ROAD || get(x - 2, y) === TL.ROAD) ? Math.PI / 2 : 0 });
    }
    // piers: crates and barrels
    for (const py of [30, 50, 66, 82, 104]) for (let i = 0; i < 3; i++) addProp(i % 2 ? 'crate' : 'barrel', (161 + i * 2) * T, (py + (i % 2 ? 0.6 : 2.4)) * T);
  }

  // ------------------------------------------------------------------ road graph
  function graph() {
    HR.forEach((h, i) => VR.forEach((v, j) => {
      if (v.x >= h.x0 && v.x + v.w <= h.x1 && h.y >= v.y0 && h.y + h.w <= v.y1)
        nodes.push({ id: nodes.length, x: (v.x + v.w / 2) * T, y: (h.y + h.w / 2) * T, h: i, v: j, nb: [] });
    }));
    const link = (a, b, horiz, road) => {
      const e = { id: edges.length, a, b, horiz, road, w: road.w * T, len: dist(a.x, a.y, b.x, b.y) };
      edges.push(e);
      a.nb.push({ n: b, e }); b.nb.push({ n: a, e });
    };
    HR.forEach((h, i) => {
      const ns = nodes.filter((n) => n.h === i).sort((a, b) => a.x - b.x);
      for (let k = 1; k < ns.length; k++) link(ns[k - 1], ns[k], true, h);
    });
    VR.forEach((v, j) => {
      const ns = nodes.filter((n) => n.v === j).sort((a, b) => a.y - b.y);
      for (let k = 1; k < ns.length; k++) link(ns[k - 1], ns[k], false, v);
    });
  }
  function nearestNode(x, y, maxD) {
    let best = null, bd = maxD ? maxD * maxD : Infinity;
    for (const n of nodes) { const d = dist2(x, y, n.x, n.y); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  // shortest node path a -> b (Dijkstra, ~70 nodes)
  function route(a, b) {
    if (!a || !b) return null;
    const D = new Float64Array(nodes.length).fill(Infinity), P = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length);
    D[a.id] = 0;
    for (;;) {
      let u = -1, ud = Infinity;
      for (let i = 0; i < nodes.length; i++) if (!done[i] && D[i] < ud) { ud = D[i]; u = i; }
      if (u < 0 || u === b.id) break;
      done[u] = 1;
      for (const { n, e } of nodes[u].nb) { const nd = ud + e.len; if (nd < D[n.id]) { D[n.id] = nd; P[n.id] = u; } }
    }
    if (D[b.id] === Infinity) return null;
    const out = [];
    for (let u = b.id; u >= 0; u = P[u]) out.unshift(nodes[u]);
    return out;
  }
  // the road (edge) a world point is on, with progress, or null
  function edgeAt(x, y) {
    let best = null, bd = Infinity;
    for (const e of edges) {
      const half = e.w / 2 + 2;
      if (e.horiz) {
        if (x < Math.min(e.a.x, e.b.x) || x > Math.max(e.a.x, e.b.x) || Math.abs(y - e.a.y) > half) continue;
        const d = Math.abs(y - e.a.y); if (d < bd) { bd = d; best = e; }
      } else {
        if (y < Math.min(e.a.y, e.b.y) || y > Math.max(e.a.y, e.b.y) || Math.abs(x - e.a.x) > half) continue;
        const d = Math.abs(x - e.a.x); if (d < bd) { bd = d; best = e; }
      }
    }
    return best;
  }
  const laneOffsets = (e) => (e.road.w >= 4 ? [8, 24] : [8]);

  // ------------------------------------------------------------------ queries
  const tileAtPx = (x, y) => get(Math.floor(x / T), Math.floor(y / T));
  const solidCar = (tx, ty) => get(tx, ty) === TL.BLD;
  const solidPed = (tx, ty) => { const t = get(tx, ty); return t === TL.BLD || t === TL.WATER; };
  const isWater = (x, y) => tileAtPx(x, y) === TL.WATER;
  const walkable = (t) => t === TL.WALK || t === TL.PLAZA || t === TL.GRASS || t === TL.SAND || t === TL.PIER || t === TL.YARD || t === TL.LOT || t === TL.ALLEY;
  function propsNear(x, y, r, out) {
    out = out || [];
    out.length = 0;
    const x0 = Math.floor((x - r) / PG), x1 = Math.floor((x + r) / PG), y0 = Math.floor((y - r) / PG), y1 = Math.floor((y + r) / PG);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const l = propGrid.get(gkey(cx, cy));
      if (l) for (const p of l) if (!p.dead) out.push(p);
    }
    return out;
  }
  // line of sight blocked by buildings?
  function los(x0, y0, x1, y1) {
    const d = dist(x0, y0, x1, y1), n = Math.ceil(d / 6);
    for (let i = 1; i < n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (get(Math.floor(x / T), Math.floor(y / T)) === TL.BLD) return false;
    }
    return true;
  }
  function districtName(x, y) { return DISTRICTS[districtAt(Math.floor(x / T), Math.floor(y / T))].name; }
  // a random road position (on a lane) between rmin and rmax px from (x, y), outside the view rect
  function randomLane(cx, cy, rmin, rmax, view, rng) {
    rng = rng || Math.random;
    for (let tries = 0; tries < 30; tries++) {
      const e = edges[Math.floor(rng() * edges.length)];
      const t = 0.15 + rng() * 0.7;
      const x = e.a.x + (e.b.x - e.a.x) * t, y = e.a.y + (e.b.y - e.a.y) * t;
      const d = dist(cx, cy, x, y);
      if (d < rmin || d > rmax) continue;
      if (view && x > view.x - 40 && x < view.x + view.w + 40 && y > view.y - 40 && y < view.y + view.h + 40) continue;
      const fwd = rng() < 0.5;
      const lanes = laneOffsets(e), off = lanes[Math.floor(rng() * lanes.length)];
      const from = fwd ? e.a : e.b, to = fwd ? e.b : e.a;
      const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
      return { e, from, to, off, x: x - dy * off, y: y + dx * off, a: Math.atan2(dy, dx) };
    }
    return null;
  }
  function randomWalk(cx, cy, rmin, rmax, view) {
    for (let tries = 0; tries < 25; tries++) {
      const i = spawns.ped[Math.floor(Math.random() * spawns.ped.length)];
      const x = (i % MW) * T + 8, y = ((i / MW) | 0) * T + 8, d = dist(cx, cy, x, y);
      if (d < rmin || d > rmax) continue;
      if (view && x > view.x - 12 && x < view.x + view.w + 12 && y > view.y - 12 && y < view.y + view.h + 12) continue;
      return { x, y };
    }
    return null;
  }

  // ------------------------------------------------------------------ ground rendering
  const chunks = new Map();
  const COL = {
    road: ['#3d3b49', '#383644', '#42404e'], walk: '#958da2', walkLine: '#817a8f', curb: '#c8c0d2',
    grass: ['#3e8a4c', '#367c42', '#47985a'], sand: ['#d6b678', '#cba96c', '#e0c48e'],
    alley: ['#34303c', '#2e2a35', '#3a3542'], pier: '#7a5a3c', pierLine: '#5c422b',
    yard: '#6c6c76', yardLine: '#5c5c66', lot: '#423f4c', water: '#1d3f70', bld: '#1a1820'
  };
  function chunk(cx, cy) {
    const k = gkey(cx, cy);
    let c = chunks.get(k);
    if (c) return c;
    c = G.canvas(CH, CH);
    const g = c.getContext('2d');
    const n = CH / T;
    for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) drawTile(g, cx * n + tx, cy * n + ty, tx * T, ty * T);
    // parking stalls
    g.fillStyle = '#d8d4e0';
    for (const s of parkSpots) {
      const lx = s.x - cx * CH, ly = s.y - cy * CH;
      if (lx < -20 || ly < -20 || lx > CH + 20 || ly > CH + 20) continue;
      if (s.stall === 'top') { g.fillRect(Math.round(lx - 8), Math.round(ly - 14), 1, 24); }
      else if (s.stall === 'bottom') { g.fillRect(Math.round(lx - 8), Math.round(ly - 10), 1, 24); }
      else { g.fillRect(Math.round(lx - 14), Math.round(ly - 8), 24, 1); }
    }
    // pools on pool-deck plazas
    for (const p of pools) {
      const lx = p.x - cx * CH, ly = p.y - cy * CH;
      if (lx > CH || ly > CH || lx + p.w < 0 || ly + p.h < 0) continue;
      g.fillStyle = '#e8e0d0'; g.fillRect(lx - 2, ly - 2, p.w + 4, p.h + 4);
      g.fillStyle = '#1aa6c8'; g.fillRect(lx, ly, p.w, p.h);
      g.fillStyle = '#5fd8ee';
      for (let i = 0; i < p.w * p.h / 60; i++) g.fillRect(lx + hash(i, p.x, 1) * (p.w - 4), ly + hash(i, p.y, 2) * (p.h - 2), 3, 1);
    }
    chunks.set(k, c);
    return c;
  }
  function plazaCol(tx, ty) {
    for (const p of plazaColors) if (tx >= p.x && ty >= p.y && tx < p.x + p.w && ty < p.y + p.h) return p;
    return null;
  }
  function drawTile(g, tx, ty, px, py) {
    const t = get(tx, ty), h = hash(tx, ty, 1);
    const speck = (cols, n) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(px + Math.floor(hash(tx, ty, 20 + i) * 16), py + Math.floor(hash(tx, ty, 40 + i) * 16), 1, 1); } };
    switch (t) {
      case TL.ROAD: {
        g.fillStyle = COL.road[0]; g.fillRect(px, py, T, T);
        speck([COL.road[1], COL.road[2], '#4a4858'], 10);
        if (h < 0.03) { g.fillStyle = '#2c2a36'; g.fillRect(px + 3, py + 6, 7, 1); g.fillRect(px + 9, py + 7, 4, 1); }
        if (h > 0.985) { g.fillStyle = '#55535f'; G.ellipse(px + 8, py + 8, 3, 3, '#4a4856', g); G.ring(px + 8, py + 8, 3, '#2a2834', g); }
        if (h > 0.95 && h < 0.97) { G.ellipse(px + 8, py + 9, 4, 2, '#302e3a', g); }
        roadMarks(g, tx, ty, px, py);
        break;
      }
      case TL.WALK: {
        g.fillStyle = COL.walk; g.fillRect(px, py, T, T);
        g.fillStyle = COL.walkLine; g.fillRect(px, py, T, 1); g.fillRect(px, py + 8, T, 1); g.fillRect(px, py, 1, T); g.fillRect(px + 8, py, 1, T);
        speck(['#a59eb2', '#8a8396'], 5);
        if (h < 0.05) { g.fillStyle = '#6e6880'; g.fillRect(px + 4, py + 3, 1, 4); g.fillRect(px + 5, py + 6, 3, 1); }
        g.fillStyle = COL.curb;
        if (get(tx, ty - 1) === TL.ROAD) g.fillRect(px, py, T, 2);
        if (get(tx, ty + 1) === TL.ROAD) g.fillRect(px, py + 14, T, 2);
        if (get(tx - 1, ty) === TL.ROAD) g.fillRect(px, py, 2, T);
        if (get(tx + 1, ty) === TL.ROAD) g.fillRect(px + 14, py, 2, T);
        break;
      }
      case TL.GRASS:
        g.fillStyle = COL.grass[0]; g.fillRect(px, py, T, T); speck([COL.grass[1], COL.grass[2], COL.grass[1]], 14);
        if (h < 0.08) { g.fillStyle = h < 0.04 ? '#ff7ab0' : '#ffe066'; g.fillRect(px + 5, py + 9, 1, 1); g.fillRect(px + 11, py + 4, 1, 1); }
        break;
      case TL.SAND:
        g.fillStyle = COL.sand[0]; g.fillRect(px, py, T, T); speck([COL.sand[1], COL.sand[2]], 10);
        if (get(tx, ty + 1) === TL.WATER) { g.fillStyle = '#e8f4f8'; for (let i = 0; i < 16; i += 2) g.fillRect(px + i, py + 13 + ((tx + i) % 3 === 0 ? 1 : 0), 2, 3); g.fillStyle = '#b89a60'; g.fillRect(px, py + 11, T, 2); }
        break;
      case TL.ALLEY:
        g.fillStyle = COL.alley[0]; g.fillRect(px, py, T, T); speck([COL.alley[1], COL.alley[2], '#46404e'], 12);
        if (h < 0.12) G.ellipse(px + 8, py + 8, 5, 3, '#3a4664', g);
        if (h > 0.9) { g.fillStyle = '#7a6a50'; g.fillRect(px + 3, py + 11, 3, 2); g.fillStyle = '#c0c0c8'; g.fillRect(px + 10, py + 4, 2, 1); }
        break;
      case TL.PIER:
        g.fillStyle = COL.pier; g.fillRect(px, py, T, T);
        g.fillStyle = COL.pierLine; for (let i = 0; i < 16; i += 4) g.fillRect(px + i, py, 1, T);
        g.fillStyle = '#4a3420'; if (get(tx, ty - 1) === TL.WATER) g.fillRect(px, py, T, 2); if (get(tx, ty + 1) === TL.WATER) g.fillRect(px, py + 14, T, 2);
        if (h < 0.1) { g.fillStyle = '#2a2a30'; g.fillRect(px + 6, py + 6, 3, 3); }
        break;
      case TL.PLAZA: {
        const pc = plazaCol(tx, ty), base = pc ? pc.col : '#8a8494';
        g.fillStyle = base; g.fillRect(px, py, T, T);
        if (pc && pc.carpet) { g.fillStyle = '#b02a50'; g.fillRect(px, py + 2, T, 12); g.fillStyle = '#ffd23e'; g.fillRect(px, py + 2, T, 1); g.fillRect(px, py + 13, T, 1); }
        else if (pc && pc.disco) { const cs = ['#ff4fb4', '#3ef0ff', '#ffd23e', '#b46bff']; for (let i = 0; i < 4; i++) { g.fillStyle = cs[(tx + ty + i) % 4]; g.fillRect(px + (i % 2) * 8 + 1, py + (i >> 1) * 8 + 1, 6, 6); } }
        else { g.fillStyle = 'rgba(0,0,0,0.12)'; if ((tx + ty) % 2) g.fillRect(px, py, T, T); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); }
        break;
      }
      case TL.YARD:
        g.fillStyle = COL.yard; g.fillRect(px, py, T, T);
        g.fillStyle = COL.yardLine; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T);
        speck(['#7a7a84', '#5e5e68'], 6);
        if (h < 0.06) G.ellipse(px + 7, py + 8, 4, 3, '#4a4a54', g);
        break;
      case TL.LOT:
        g.fillStyle = COL.lot; g.fillRect(px, py, T, T); speck(['#4a4756', '#3a3744'], 8);
        if (h < 0.05) G.ellipse(px + 8, py + 8, 3, 2, '#34313e', g);
        break;
      case TL.WATER: {
        g.fillStyle = COL.water; g.fillRect(px, py, T, T);
        g.fillStyle = '#26508a'; for (let i = 0; i < 3; i++) g.fillRect(px + Math.floor(hash(tx, ty, 60 + i) * 12), py + Math.floor(hash(tx, ty, 70 + i) * 15), 4, 1);
        const shore = get(tx, ty - 1) !== TL.WATER || get(tx - 1, ty) !== TL.WATER || get(tx + 1, ty) !== TL.WATER || get(tx, ty + 1) !== TL.WATER;
        if (shore) { g.fillStyle = '#2f6aa0'; g.fillRect(px, py, T, T); g.fillStyle = '#a8dcf0'; for (let i = 0; i < 4; i++) g.fillRect(px + Math.floor(hash(tx, ty, 80 + i) * 14), py + Math.floor(hash(tx, ty, 90 + i) * 14), 2, 1); }
        break;
      }
      default:
        g.fillStyle = COL.bld; g.fillRect(px, py, T, T);
    }
  }
  function roadMarks(g, tx, ty, px, py) {
    const i = idx(tx, ty), hi = rh[i], vi = rv[i];
    if (hi >= 0 && vi >= 0) return;                              // intersection: clean asphalt
    if (hi >= 0) {
      const r = HR[hi], ly = ty - r.y;
      const crossL = rv[idx(tx - 1, ty)] >= 0 && rh[idx(tx - 1, ty)] >= 0, crossR = rv[idx(tx + 1, ty)] >= 0 && rh[idx(tx + 1, ty)] >= 0;
      if (crossL || crossR) {                                    // zebra crossing
        g.fillStyle = '#d8d6e2';
        for (let y = 1; y < 16; y += 4) g.fillRect(px + 3, py + y, 10, 2);
        return;
      }
      if (r.w === 4) {
        if (ly === 1) { g.fillStyle = '#e8c040'; g.fillRect(px, py + 13, T, 1); g.fillRect(px, py + 15, T, 1); }
        if (ly === 2) { g.fillStyle = '#e8c040'; g.fillRect(px, py, T, 1); g.fillRect(px, py + 2, T, 1); }
        if ((ly === 0 || ly === 2) && tx % 2 === 0) { g.fillStyle = '#c8c6d2'; g.fillRect(px + 3, py + 15, 10, 1); }
        if ((ly === 1 || ly === 3) && tx % 2 === 0) { g.fillStyle = '#c8c6d2'; g.fillRect(px + 3, py, 10, 1); }
      } else if (tx % 2 === 0) {
        g.fillStyle = '#d8d0a0';
        if (ly === 0) g.fillRect(px + 2, py + 15, 11, 1); else g.fillRect(px + 2, py, 11, 1);
      }
    } else if (vi >= 0) {
      const r = VR[vi], lx = tx - r.x;
      const crossU = rv[idx(tx, ty - 1)] >= 0 && rh[idx(tx, ty - 1)] >= 0, crossD = rv[idx(tx, ty + 1)] >= 0 && rh[idx(tx, ty + 1)] >= 0;
      if (crossU || crossD) {
        g.fillStyle = '#d8d6e2';
        for (let x = 1; x < 16; x += 4) g.fillRect(px + x, py + 3, 2, 10);
        return;
      }
      if (r.w === 4) {
        if (lx === 1) { g.fillStyle = '#e8c040'; g.fillRect(px + 13, py, 1, T); g.fillRect(px + 15, py, 1, T); }
        if (lx === 2) { g.fillStyle = '#e8c040'; g.fillRect(px, py, 1, T); g.fillRect(px + 2, py, 1, T); }
        if ((lx === 0 || lx === 2) && ty % 2 === 0) { g.fillStyle = '#c8c6d2'; g.fillRect(px + 15, py + 3, 1, 10); }
        if ((lx === 1 || lx === 3) && ty % 2 === 0) { g.fillStyle = '#c8c6d2'; g.fillRect(px, py + 3, 1, 10); }
      } else if (ty % 2 === 0) {
        g.fillStyle = '#d8d0a0';
        if (lx === 0) g.fillRect(px + 15, py + 2, 1, 11); else g.fillRect(px, py + 2, 1, 11);
      }
    }
  }

  // draw something permanent onto the ground (skid marks, scorch marks...): fn(g, localX, localY)
  function stamp(x, y, r, fn) {
    const cx0 = Math.floor((x - r) / CH), cx1 = Math.floor((x + r) / CH), cy0 = Math.floor((y - r) / CH), cy1 = Math.floor((y + r) / CH);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= WPX || cy * CH >= HPX) continue;
      const c = chunk(cx, cy);
      fn(c.getContext('2d'), x - cx * CH, y - cy * CH);
    }
  }

  function drawGround(g, camX, camY, W, H, time) {
    const cx0 = Math.floor(camX / CH), cy0 = Math.floor(camY / CH), cx1 = Math.floor((camX + W) / CH), cy1 = Math.floor((camY + H) / CH);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= WPX || cy * CH >= HPX) { g.fillStyle = COL.water; g.fillRect(cx * CH - camX, cy * CH - camY, CH, CH); continue; }
      g.drawImage(chunk(cx, cy), Math.round(cx * CH - camX), Math.round(cy * CH - camY));
    }
    // water sparkle
    const tx0 = Math.max(0, Math.floor(camX / T)), ty0 = Math.max(0, Math.floor(camY / T));
    const tx1 = Math.min(MW - 1, Math.floor((camX + W) / T)), ty1 = Math.min(MH - 1, Math.floor((camY + H) / T));
    const ph = Math.floor(time * 3);
    g.fillStyle = '#8fc8f0';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (tiles[idx(tx, ty)] !== TL.WATER) continue;
      const hh = hash(tx, ty, ph);
      if (hh < 0.25) g.fillRect(Math.round(tx * T + hh * 50 - camX), Math.round(ty * T + hash(ty, tx, ph) * 15 - camY), 2, 1);
    }
  }

  // ------------------------------------------------------------------ buildings
  let sorted = [];
  const STY = {
    tower: { roof: ['#3a3f5e', '#343852', '#40355a', '#2f4250'], wallA: '#262a42', wallB: '#1d2034', win: ['#ffd27a', '#7ae0ff', '#ff9ad8', '#c8f0ff'], rate: 0.5 },
    office: { roof: ['#4a4e5e', '#545a68', '#44485a'], wallA: '#383c4e', wallB: '#2c2f3e', win: ['#ffe2a0', '#d8f0ff'], rate: 0.4 },
    brick: { roof: ['#4a3c3e', '#3e3438', '#54443e', '#45403a'], wallA: '#6e3628', wallB: '#572a20', win: ['#ffcc66', '#ffb050'], rate: 0.35 },
    warehouse: { roof: ['#5a6670', '#6e4a3a', '#3e5a4e', '#56606a'], wallA: '#424c56', wallB: '#353d46', win: ['#ffe9b0'], rate: 0.1 },
    container: { roof: ['#b8402e', '#2e6ab8', '#3e8a3e', '#d87a28', '#d8b830', '#8a3ea0'], wallA: '#2a2a30', wallB: '#202026', win: [], rate: 0 },
    hotel: { roof: ['#c4b4a4', '#b8c4c0', '#c8a8b4'], wallA: '#d07a9a', wallB: '#a85e7c', win: ['#fff0b0', '#b0f8ff'], rate: 0.6, walls: [['#d07a9a', '#a85e7c'], ['#5ab8b0', '#3e908a'], ['#e0c080', '#b89a5a']] },
    club: { roof: ['#2a1838'], wallA: '#3a1e4e', wallB: '#2a1438', win: ['#ff4fb4', '#3ef0ff'], rate: 0.6 },
    velvet: { roof: ['#4a1e5e'], wallA: '#36144a', wallB: '#280e38', win: ['#ffd23e', '#b46bff'], rate: 0.5 },
    police: { roof: ['#4a5468'], wallA: '#2e3a56', wallB: '#24304a', win: ['#d8f0ff'], rate: 0.6 },
    hospital: { roof: ['#c8ccd6'], wallA: '#9aa0b0', wallB: '#7e8494', win: ['#e8fff0'], rate: 0.7 },
    shop: { roof: ['#5a5060'], wallA: '#5e4a6a', wallB: '#4a3a56', win: ['#fff4c0'], rate: 0.8 },
    spray: { roof: ['#3e4e5e'], wallA: '#2e3e4e', wallB: '#24323e', win: ['#3ef0ff'], rate: 0.5 },
    shack: { roof: ['#b08a48'], wallA: '#7a5a30', wallB: '#634a26', win: ['#ffd27a'], rate: 0.5 },
    stage: { roof: ['#26222e'], wallA: '#1a1820', wallB: '#141218', win: ['#ff4fb4'], rate: 0.8 }
  };
  function makeRoof(b) {
    const S = STY[b.style], w = b.w, h = b.h, r = RNG(b.seed + 17);
    const c = G.canvas(w, h), g = c.getContext('2d');
    let base = b.col !== undefined ? S.roof[b.col % S.roof.length] : b.roofCol !== undefined ? S.roof[b.roofCol % S.roof.length] : r.pick(S.roof);
    const ed = (col, amt) => shade(col, amt);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    if (b.style === 'container') {
      g.fillStyle = ed(base, -0.25);
      if (w > h) for (let x = 1; x < w; x += 2) g.fillRect(x, 1, 1, h - 2); else for (let y = 1; y < h; y += 2) g.fillRect(1, y, w - 2, 1);
      g.fillStyle = ed(base, 0.25); g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
      g.fillStyle = ed(base, -0.45); g.fillRect(0, h - 1, w, 1); g.fillRect(w - 1, 0, 1, h);
      return c;
    }
    // texture
    for (let i = 0; i < w * h / 14; i++) { g.fillStyle = r() < 0.5 ? ed(base, -0.08) : ed(base, 0.07); g.fillRect(r.int(0, w - 1), r.int(0, h - 1), r.int(1, 2), 1); }
    if (b.style === 'warehouse') {
      g.fillStyle = ed(base, -0.18);
      if (w >= h) for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, h); else for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(160,80,40,0.35)'; G.ellipse(r.int(4, w - 4), r.int(4, h - 4), r.int(3, 8), r.int(2, 5), 'rgba(150,70,40,0.35)', g); }
      if (w > 40 && h > 30) { g.fillStyle = '#8ab4c8'; for (let x = 12; x < w - 12; x += 22) g.fillRect(x, 6, 8, h - 12); g.fillStyle = '#5a7e90'; for (let x = 12; x < w - 12; x += 22) g.fillRect(x + 7, 6, 1, h - 12); }
    }
    if (b.style === 'shack') {
      g.fillStyle = ed(base, -0.2); for (let y = 1; y < h; y += 3) g.fillRect(0, y, w, 1);
      g.fillStyle = ed(base, 0.2); g.fillRect(0, h >> 1, w, 1);
    }
    // parapet
    g.fillStyle = ed(base, 0.22); g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    g.fillStyle = ed(base, -0.3); g.fillRect(0, h - 2, w, 2); g.fillRect(w - 2, 0, 2, h);
    g.fillStyle = ed(base, -0.15); g.fillRect(2, 2, w - 4, 1); g.fillRect(2, 2, 1, h - 4);

    const used = [];
    const free = (x, y, ww, hh) => {
      if (x < 4 || y < 4 || x + ww > w - 4 || y + hh > h - 4) return false;
      for (const u of used) if (x < u[0] + u[2] + 2 && x + ww + 2 > u[0] && y < u[1] + u[3] + 2 && y + hh + 2 > u[1]) return false;
      for (const s of b.signs) if (x < s.x + s.w + 3 && x + ww + 3 > s.x && y < s.y + s.h + 3 && y + hh + 3 > s.y) return false;
      used.push([x, y, ww, hh]); return true;
    };
    const place = (ww, hh, fn, tries) => { for (let i = 0; i < (tries || 12); i++) { const x = r.int(4, Math.max(4, w - ww - 4)), y = r.int(4, Math.max(4, h - hh - 4)); if (free(x, y, ww, hh)) { fn(x, y); return true; } } return false; };
    // sign backing boards
    for (const s of b.signs) { g.fillStyle = 'rgba(10,6,18,0.75)'; g.fillRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4); }
    if (b.billboard) {
      const bw = Math.min(w - 8, 84), bh = 22, bx = (w - bw) >> 1, by = (h - bh) >> 1;
      used.push([bx, by, bw, bh]);
      g.fillStyle = '#1a1424'; g.fillRect(bx, by, bw, bh); g.fillStyle = '#e8c070'; g.fillRect(bx, by, bw, 1); g.fillRect(bx, by + bh - 1, bw, 1);
      b.signs.push({ text: b.billboard[0], col: '#ffd23e', face: 'small', x: bx + ((bw - Font.width(b.billboard[0], 'small')) >> 1), y: by + 4, w: 0, h: 0, phase: 0 });
      b.signs.push({ text: b.billboard[1], col: '#ff7a2e', face: 'small', x: bx + ((bw - Font.width(b.billboard[1], 'small')) >> 1), y: by + 12, w: 0, h: 0, phase: 0 });
    }
    if (b.pool || (b.style === 'hotel' && w >= 48 && h >= 40)) {
      place(Math.min(40, w - 20), Math.min(18, h - 22), (x, y) => {
        const pw = Math.min(40, w - 20), ph = Math.min(18, h - 22);
        g.fillStyle = '#ece4d8'; g.fillRect(x - 2, y - 2, pw + 4, ph + 4);
        g.fillStyle = '#1aa6c8'; g.fillRect(x, y, pw, ph);
        g.fillStyle = '#6ee0f4'; for (let i = 0; i < pw * ph / 40; i++) g.fillRect(x + r.int(1, pw - 4), y + r.int(1, ph - 2), 3, 1);
        g.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) g.fillRect(x + 4 + i * 8, y + ph + 4, 5, 2);
      }, 20);
    }
    if (b.style === 'hospital' || b.style === 'police' || (b.style === 'tower' && w >= 64 && h >= 64 && r() < 0.5)) {
      place(26, 26, (x, y) => {
        G.disc(x + 13, y + 13, 12, '#3a3e4a', g); G.ring(x + 13, y + 13, 11, '#ffd23e', g);
        g.fillStyle = b.style === 'hospital' ? '#ff4040' : '#ffd23e';
        if (b.style === 'hospital') { g.fillRect(x + 11, y + 6, 4, 14); g.fillRect(x + 6, y + 11, 14, 4); }
        else { g.fillRect(x + 8, y + 7, 2, 12); g.fillRect(x + 16, y + 7, 2, 12); g.fillRect(x + 8, y + 12, 10, 2); }
      }, 25);
    }
    if (b.style === 'club') {
      const fx = 6, fy = Math.round(h * 0.55), fw = w - 12, fh = h - fy - 6;
      if (fh > 6) { const cs = ['#ff4fb4', '#3ef0ff', '#ffd23e', '#b46bff']; for (let y = 0; y < fh; y += 6) for (let x = 0; x < fw; x += 6) { g.fillStyle = cs[((x + y) / 6 + r.int(0, 3)) % 4]; g.fillRect(fx + x, fy + y, 5, 5); } used.push([fx, fy, fw, fh]); }
    }
    if (b.style === 'velvet') {
      g.fillStyle = '#ffd23e'; g.fillRect(3, 3, w - 6, 1); g.fillRect(3, h - 4, w - 6, 1);
      place(16, 16, (x, y) => { G.disc(x + 8, y + 8, 7, '#e8e0d0', g); G.disc(x + 8, y + 8, 5, '#3ec8e8', g); g.fillStyle = '#b0f0ff'; g.fillRect(x + 5, y + 6, 3, 1); });
    }
    if (b.graffiti || b.graffiti3) place(22, 20, (x, y) => slothTag(g, x, y, b.graffiti3 ? '#9dff4a' : r.pick(['#ff4fb4', '#3ef0ff', '#ffd23e'])), 20);
    // generic roof clutter
    const nAC = Math.floor(w * h / 900) + 1;
    for (let i = 0; i < nAC; i++) place(8, 7, (x, y) => {
      g.fillStyle = '#9a9aa6'; g.fillRect(x, y, 8, 7); g.fillStyle = '#70707c'; g.fillRect(x, y + 6, 8, 1); g.fillRect(x + 7, y, 1, 7);
      G.disc(x + 4, y + 3, 2, '#4a4a56', g); g.fillStyle = '#b8b8c4'; g.fillRect(x, y, 8, 1);
    });
    if (b.style === 'brick' || b.style === 'office') place(12, 12, (x, y) => { G.disc(x + 6, y + 6, 5, '#6a4a30', g); G.ring(x + 6, y + 6, 5, '#4a3220', g); g.fillStyle = '#8a6a48'; g.fillRect(x + 4, y + 3, 3, 1); });
    for (let i = 0; i < 3; i++) place(3, 3, (x, y) => { G.disc(x + 1, y + 1, 1, '#2a2830', g); });
    if (b.style === 'tower' && r() < 0.5) place(14, 8, (x, y) => { g.fillStyle = '#4a8ab0'; g.fillRect(x, y, 14, 8); g.fillStyle = '#8ad0f0'; g.fillRect(x + 1, y + 1, 5, 1); g.fillStyle = '#2a5a7a'; g.fillRect(x + 7, y, 1, 8); });
    if (b.tower) { g.fillStyle = '#e04040'; g.fillRect(4, 4, w - 8, 2); g.fillStyle = '#ffffff'; g.fillRect(4, 6, w - 8, 2); }
    return c;
  }
  function slothTag(g, x, y, col) {
    // spray-painted sloth face with shades (the city's favourite graffiti)
    G.ellipse(x + 11, y + 10, 10, 9, col, g);
    G.ellipse(x + 11, y + 11, 7, 6, shade(col, -0.5), g);
    g.fillStyle = '#111'; g.fillRect(x + 4, y + 8, 6, 3); g.fillRect(x + 12, y + 8, 6, 3); g.fillRect(x + 10, y + 9, 2, 1);
    g.fillStyle = col; g.fillRect(x + 8, y + 14, 6, 1); g.fillRect(x + 9, y + 15, 4, 1);
    g.fillStyle = shade(col, 0.3); g.fillRect(x + 2, y + 18, 1, 2); g.fillRect(x + 19, y + 17, 1, 3);
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; gg += (255 - gg) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; gg *= 1 + amt; b *= 1 + amt; }
    return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(b)).toString(16).slice(1);
  }

  // offset of a building's top for the current projection centre
  const lean = (b, z, cx, cy) => [Math.round((b.x + b.w / 2 - cx) * z * PK), Math.round((b.y + b.h / 2 - cy) * z * PK)];

  function drawBuildings(g, camX, camY, W, H, cx, cy, time) {
    for (const b of sorted) {
      if (b.x - 50 > camX + W || b.y - 50 > camY + H || b.x + b.w + 50 < camX || b.y + b.h + 50 < camY) continue;
      drawBuilding(g, b, camX, camY, cx, cy, time);
    }
    // canopies (gas station, spray shop banner) float above the cars
    for (const c of canopies) {
      if (c.x - 40 > camX + W || c.y - 40 > camY + H || c.x + c.w + 40 < camX || c.y + c.h + 40 < camY) continue;
      const ox = Math.round((c.x + c.w / 2 - cx) * c.hgt * PK), oy = Math.round((c.y + c.h / 2 - cy) * c.hgt * PK);
      const x = Math.round(c.x - camX + ox), y = Math.round(c.y - camY + oy);
      if (c.banner) {
        g.fillStyle = '#122a3a'; g.fillRect(x - 2, y - 4, c.w + 4, c.h + 2);
        Font.draw(g, c.text, x + c.w / 2, y - 1, '#3ef0ff', { face: 'small', align: 'center' });
      } else {
        g.fillStyle = 'rgba(230,236,250,0.9)'; g.fillRect(x, y, c.w, c.h);
        g.fillStyle = '#ff4040'; g.fillRect(x, y, c.w, 3); g.fillRect(x, y + c.h - 3, c.w, 3);
        g.fillStyle = '#c8ccd8'; for (let i = 6; i < c.w; i += 10) g.fillRect(x + i, y + 4, 1, c.h - 8);
        Font.draw(g, c.text, x + c.w / 2, y + c.h / 2 - 3, '#d02828', { face: 'small', align: 'center' });
      }
    }
  }
  function drawBuilding(g, b, camX, camY, cx, cy, time) {
    if (!b.roof) b.roof = makeRoof(b);
    const S = STY[b.style];
    const [dx0, dy0] = lean(b, b.z0, cx, cy), [dx, dy] = lean(b, b.hgt, cx, cy);
    const X0 = Math.round(b.x - camX) + dx0, Y0 = Math.round(b.y - camY) + dy0, X1 = Math.round(b.x - camX) + dx, Y1 = Math.round(b.y - camY) + dy;
    const w = b.w, h = b.h, ddx = dx - dx0, ddy = dy - dy0;
    let wa = S.wallA, wb = S.wallB;
    if (S.walls) { const p = S.walls[b.seed % S.walls.length]; wa = p[0]; wb = p[1]; }
    if (ddx < 0) { G.poly([X0 + w, Y0, X0 + w, Y0 + h, X1 + w, Y1 + h, X1 + w, Y1], wa, g); windows(g, b, S, X0 + w, Y0, X1 + w, Y1, 0, h, ddx, true); }
    if (ddx > 0) { G.poly([X0, Y0, X0, Y0 + h, X1, Y1 + h, X1, Y1], wa, g); windows(g, b, S, X0, Y0, X1, Y1, 0, h, ddx, true); }
    if (ddy < 0) { G.poly([X0, Y0 + h, X0 + w, Y0 + h, X1 + w, Y1 + h, X1, Y1 + h], wb, g); windows(g, b, S, X0, Y0 + h, X1, Y1 + h, w, 0, ddy, false); }
    if (ddy > 0) { G.poly([X0, Y0, X0 + w, Y0, X1 + w, Y1, X1, Y1], wb, g); windows(g, b, S, X0, Y0, X1, Y1, w, 0, ddy, false); }
    g.drawImage(b.roof, X1, Y1);
    for (const s of b.signs) {
      let on = true;
      if (s.flicker) { const t = (time + s.phase) % 4; on = !(t > 3.2 && t < 3.35) && !(t > 3.5 && t < 3.6); }
      const col = on ? s.col : shade(s.col, -0.6);
      if (on) {
        g.globalCompositeOperation = 'lighter';
        g.drawImage(Lights.glow(s.col, 18, 0.28), X1 + s.x + s.w / 2 - 18, Y1 + s.y + s.h / 2 - 18);
        g.globalCompositeOperation = 'source-over';
      }
      Font.draw(g, s.text, X1 + s.x, Y1 + s.y, col, { face: s.face });
    }
  }
  function windows(g, b, S, bx, by, rx, ry, lenX, lenY, depth, vertical) {
    if (!S.rate) return;
    const ad = Math.abs(depth);
    if (ad < 4) return;
    const floors = Math.max(1, Math.min(Math.round(b.hgt / 9), Math.floor(ad / 3)));
    const len = vertical ? lenY : lenX, n = Math.floor((len - 4) / 6);
    for (let f = 0; f < floors; f++) {
      const t = (f + 0.6) / (floors + 0.2);
      const ox = bx + (rx - bx) * t, oy = by + (ry - by) * t;
      for (let i = 0; i < n; i++) {
        const hv = hash(b.id, f * 31 + i, 5);
        g.fillStyle = hv < S.rate ? S.win[Math.floor(hv * 97) % S.win.length] : '#15131c';
        if (vertical) g.fillRect(Math.round(ox) - (depth < 0 ? 1 : 0), Math.round(oy + 4 + i * 6), 1, 3);
        else g.fillRect(Math.round(ox + 4 + i * 6), Math.round(oy) - (depth < 0 ? 1 : 0), 3, 1);
      }
    }
  }

  // ------------------------------------------------------------------ radar map (1 px per tile)
  let radar = null;
  function makeRadar() {
    const c = G.canvas(MW, MH), g = c.getContext('2d');
    const img = g.createImageData(MW, MH), d = img.data;
    const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const cols = {};
    cols[TL.WATER] = rgb('#163a68'); cols[TL.ROAD] = rgb('#c8c4d4'); cols[TL.WALK] = rgb('#6a6478'); cols[TL.GRASS] = rgb('#2e7a3c');
    cols[TL.SAND] = rgb('#b89a60'); cols[TL.ALLEY] = rgb('#8a8496'); cols[TL.PIER] = rgb('#7a5a3c'); cols[TL.PLAZA] = rgb('#6a6478'); cols[TL.YARD] = rgb('#5a5a64'); cols[TL.LOT] = rgb('#7a7488');
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const t = tiles[idx(x, y)], o = idx(x, y) * 4;
      const c3 = t === TL.BLD ? rgb(DISTRICTS[districtAt(x, y)].minimap) : (cols[t] || [0, 0, 0]);
      d[o] = c3[0]; d[o + 1] = c3[1]; d[o + 2] = c3[2]; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  const C = {
    T, MW, MH, WPX, HPX, TL, PK, HR, VR, DISTRICTS, tiles, buildings, props, lights, zones, parkSpots, nodes, edges, spawns,
    build, get, tileAtPx, solidCar, solidPed, isWater, walkable, propsNear, los, districtAt, districtName, nearestNode, route, edgeAt, laneOffsets,
    randomLane, randomWalk, drawGround, drawBuildings, stamp, lean, shade, hash, addProp, addLight, lightsIn,
    get radar() { return radar; }, idx, inMap, PROPS
  };
  function lightsIn(x0, y0, x1, y1, out) {
    out.length = 0;
    for (let cy = Math.floor(y0 / LG); cy <= Math.floor(y1 / LG); cy++) for (let cx = Math.floor(x0 / LG); cx <= Math.floor(x1 / LG); cx++) {
      const l = lightGrid.get(gkey(cx, cy));
      if (l) for (const L of l) if (L.on) out.push(L);
    }
    return out;
  }
  return C;
})();
