/* WORLD — draws a stage: theme ground for every row (pre-rendered once per stage), animated
   water / belts / signals, everything on the lanes, the home row, night darkness and the
   cabinet bezel. Rows: 0 = HOME, 1..N = lanes, N+1 = START. World y of row r = r * 16;
   screen y = 16 + worldY - camY (the top 16px and bottom 16px are HUD bars). */
'use strict';
const THEMES = {
  meadow: { safe: 'grass', road: 'asphalt', water: ['#1848c8', '#2c68e8', '#88b8ff'], home: 'hedge', bezel: '#0c3c10' },
  city: { safe: 'sidewalk', road: 'cityroad', water: ['#0c6c78', '#148c98', '#78d8d8'], home: 'brick', bezel: '#28283c' },
  works: { safe: 'gravel', road: 'worksroad', water: ['#5c4418', '#7c5c28', '#c8a060'], home: 'site', bezel: '#3c2c10' },
  swamp: { safe: 'mud', road: 'dirt', water: ['#284818', '#386024', '#88b058'], home: 'stumps', bezel: '#1c2c0c' },
  ice: { safe: 'snow', road: 'iceroad', water: ['#143068', '#1c4488', '#78a8e0'], home: 'igloo', bezel: '#18284c' },
  factory: { safe: 'metal', road: 'floor', water: ['#401858', '#5c2878', '#a8f048'], home: 'shutters', bezel: '#2c2c34' },
  mix: { safe: 'grass', road: 'asphalt', water: ['#1848c8', '#2c68e8', '#88b8ff'], home: 'hedge', bezel: '#301040' },
  home: { safe: 'lawn', road: 'asphalt', water: ['#1848c8', '#2c68e8', '#88b8ff'], home: 'house', bezel: '#402010' }
};

const World = (function () {
  const P = PAL;
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  const W = {
    stage: null, lanes: [], rows: 13, camY: 0, bg: null, homes: [], t: 0, dark: null,

    load(stage, homes) {
      W.stage = stage; W.lanes = Lanes.list; W.homes = homes;
      W.rows = W.lanes.length + 2;
      W.camY = W.maxCam();
      W.bg = G.canvas(320, W.rows * 16);
      const g = W.bg.getContext('2d');
      for (let row = 0; row < W.rows; row++) W.ground(g, row);
    },
    maxCam() { return Math.max(0, (W.rows - 13) * 16); },
    sy(worldY) { return 16 + worldY - W.camY; },
    rowY(row) { return 16 + row * 16 - W.camY; },
    laneTheme(lane) { return THEMES[lane.th] || THEMES.meadow; },
    theme() { return THEMES[W.stage.theme] || THEMES.meadow; },

    // ------------------------------------------------------------------ static ground
    ground(g, row) {
      const y = row * 16, N = W.lanes.length;
      if (row === 0) return W.homeRow(g, y);
      if (row === N + 1) {
        const above = W.lanes[N - 1], th = THEMES[(above && above.th) || W.stage.theme] || W.theme();
        return W.surface(g, y, W.stage.final ? 'lawn' : th.safe, row);
      }
      const lane = W.lanes[row - 1], th = W.laneTheme(lane);
      switch (lane.type) {
        case 'safe': return W.surface(g, y, lane.def.surf || th.safe, row);
        case 'road': return lane.surf ? W.surface(g, y, lane.surf, row) : W.road(g, y, th.road, row);
        case 'timed': return W.surface(g, y, lane.def.surf || th.safe, row);
        case 'water': return r(g, 0, y, 320, 16, th.water[0]);
        case 'rail': return W.rail(g, y, row);
        case 'belt': return r(g, 0, y, 320, 16, '#2c2c34');
        case 'ice': return W.surface(g, y, 'thinice', row);
      }
    },
    surface(g, y, kind, row) {
      const H = (x, k) => hash(x + k * 977, row);
      switch (kind) {
        case 'grass':
          r(g, 0, y, 320, 16, '#38a028');
          for (let x = 0; x < 320; x += 2) { const v = H(x, 1); if (v < 0.35) r(g, x, y + Math.floor(H(x, 2) * 14), 1, 2, '#207818'); else if (v < 0.5) r(g, x, y + Math.floor(H(x, 3) * 14), 1, 1, '#68d048'); }
          for (let x = 12; x < 320; x += 23) if (H(x, 4) < 0.35) { const fy = y + 3 + Math.floor(H(x, 5) * 9); r(g, x, fy, 2, 2, ['#f8f878', '#f878f8', '#fcfcfc'][Math.floor(H(x, 6) * 3)]); }
          r(g, 0, y, 320, 1, '#58c040');
          return;
        case 'lawn':
          for (let x = 0; x < 320; x += 16) r(g, x, y, 16, 16, (x >> 4) % 2 ? '#48b030' : '#3c9c28');
          for (let x = 0; x < 320; x += 3) if (H(x, 1) < 0.3) r(g, x, y + Math.floor(H(x, 2) * 15), 1, 1, '#2c7c18');
          return;
        case 'sidewalk':
          r(g, 0, y, 320, 16, '#b8b0a0'); r(g, 0, y, 320, 2, '#d8d0c0'); r(g, 0, y + 14, 320, 2, '#787068');
          for (let x = 4; x < 320; x += 16) r(g, x, y + 2, 1, 12, '#948c7c');
          r(g, 0, y + 8, 320, 1, '#a8a090');
          for (let x = 0; x < 320; x += 5) if (H(x, 3) < 0.15) r(g, x, y + 3 + Math.floor(H(x, 4) * 10), 1, 1, '#8c8478');
          return;
        case 'gravel':
          r(g, 0, y, 320, 16, '#9c8c74');
          for (let x = 0; x < 320; x++) for (let k = 0; k < 2; k++) { const v = H(x, k + 1); if (v < 0.22) r(g, x, y + Math.floor(H(x, k + 5) * 16), 1, 1, v < 0.11 ? '#6c604c' : '#c8b89c'); }
          for (let x = 30; x < 320; x += 61) { r(g, x, y + 4, 4, 8, P.org); r(g, x, y + 6, 4, 1, P.white); r(g, x, y + 9, 4, 1, P.white); r(g, x - 1, y + 12, 6, 2, '#a83c00'); }
          return;
        case 'mud':
          r(g, 0, y, 320, 16, '#6c4c24');
          for (let x = 0; x < 320; x += 2) { const v = H(x, 1); if (v < 0.25) r(g, x, y + Math.floor(H(x, 2) * 15), 2, 1, '#54381c'); else if (v < 0.33) r(g, x, y + Math.floor(H(x, 3) * 15), 1, 1, '#8c6838'); }
          for (let x = 8; x < 320; x += 19) if (H(x, 4) < 0.5) { r(g, x, y + 2, 1, 7, '#4c8c18'); r(g, x + 2, y + 1, 1, 8, '#68a828'); r(g, x + 1, y, 1, 3, '#8c5c2c'); }
          return;
        case 'snow':
          r(g, 0, y, 320, 16, '#e8f0f8'); r(g, 0, y + 13, 320, 3, '#b8c8e0');
          for (let x = 0; x < 320; x += 3) { const v = H(x, 1); if (v < 0.2) r(g, x, y + Math.floor(H(x, 2) * 12), 2, 1, '#c8d8ec'); else if (v < 0.24) r(g, x, y + Math.floor(H(x, 3) * 12), 1, 1, P.white); }
          return;
        case 'metal':
          r(g, 0, y, 320, 16, '#7c8088'); r(g, 0, y, 320, 1, '#a8acb4'); r(g, 0, y + 15, 320, 1, '#4c5058');
          for (let yy = 2; yy < 15; yy += 4) for (let x = (yy >> 2) % 2 ? 2 : 0; x < 320; x += 4) r(g, x, y + yy, 2, 1, '#9ca0a8');
          return;
        case 'thinice':
          r(g, 0, y, 320, 16, '#b8e0f8'); r(g, 0, y, 320, 1, '#e8f8fc'); r(g, 0, y + 15, 320, 1, '#78a8d8');
          for (let x = 0; x < 320; x += 16) { r(g, x, y + 1, 1, 14, '#98c8ec'); r(g, x + 3, y + 4, 6, 1, '#d8f0fc'); }
          return;
      }
      r(g, 0, y, 320, 16, '#555');
    },
    road(g, y, kind, row) {
      const lane = W.lanes[row - 1], above = W.lanes[row - 2], below = W.lanes[row];
      const isRoad = (l) => l && l.type === 'road' && !l.surf;
      const base = { asphalt: '#484850', cityroad: '#34343c', worksroad: '#505058', dirt: '#8c6434', iceroad: '#9cb0c8', floor: '#787470' }[kind] || '#484850';
      r(g, 0, y, 320, 16, base);
      for (let x = 0; x < 320; x += 3) { const v = hash(x, row * 7); if (v < 0.18) r(g, x, y + Math.floor(hash(x, row * 7 + 1) * 16), 1, 1, kind === 'dirt' ? '#6c4c24' : kind === 'iceroad' ? '#d8e4f0' : '#3c3c44'); }
      if (kind === 'dirt') { r(g, 0, y + 4, 320, 1, '#6c4c24'); r(g, 0, y + 11, 320, 1, '#6c4c24'); return; }
      if (kind === 'iceroad') for (let x = 0; x < 320; x += 40) r(g, x + Math.floor(hash(x, row) * 20), y + 5 + Math.floor(hash(x, row + 1) * 6), 18, 1, '#e8f0f8');
      const line = kind === 'floor' ? P.yel : kind === 'worksroad' ? P.org : '#e8e8e8';
      // lane dividers: dashed between road lanes, solid at the road's edges
      if (isRoad(above)) {
        const opp = above.dir !== lane.dir && kind === 'cityroad';
        for (let x = 0; x < 320; x += 16) r(g, x + 2, y, 8, 1, opp ? P.yel : line);
      } else r(g, 0, y, 320, 1, line);
      if (!isRoad(below)) r(g, 0, y + 15, 320, 1, line);
      if (kind === 'floor') for (let x = 0; x < 320; x += 8) r(g, x, y + 15, 4, 1, P.ink);
    },
    rail(g, y, row) {
      r(g, 0, y, 320, 16, '#8c7c64');
      for (let x = 0; x < 320; x++) if (hash(x, row) < 0.25) r(g, x, y + Math.floor(hash(x, row + 9) * 16), 1, 1, hash(x, row + 3) < 0.5 ? '#6c604c' : '#b0a088');
      for (let x = 2; x < 320; x += 8) r(g, x, y + 2, 5, 13, '#5c3c20');
      r(g, 0, y + 4, 320, 2, '#d0d0d8'); r(g, 0, y + 6, 320, 1, '#58585c');
      r(g, 0, y + 11, 320, 2, '#d0d0d8'); r(g, 0, y + 13, 320, 1, '#58585c');
    },

    // ------------------------------------------------------------------ home rows
    homeX() { return W.stage.final ? [160] : [32, 96, 160, 224, 288]; },
    homeRow(g, y) {
      const kind = W.theme().home, xs = W.homeX();
      const slot = (fn) => xs.forEach((x) => fn(x - 11));
      switch (kind) {
        case 'hedge':
          r(g, 0, y, 320, 16, '#1c6c18');
          for (let x = 0; x < 320; x += 6) { r(g, x, y + Math.floor(hash(x, 1) * 4), 7, 5, '#2c8c20'); r(g, x + 2, y + 1 + Math.floor(hash(x, 2) * 10), 2, 2, '#58c040'); }
          slot((x) => { r(g, x, y + 2, 22, 14, '#0c2408'); r(g, x + 1, y + 1, 20, 1, '#0c2408'); r(g, x, y + 13, 22, 3, '#38a028'); r(g, x + 2, y + 6, 18, 1, '#c89858'); r(g, x + 4, y + 7, 14, 1, '#c89858'); });
          return;
        case 'brick':
          r(g, 0, y, 320, 16, '#a84830');
          for (let yy = 0; yy < 16; yy += 4) { r(g, 0, y + yy + 3, 320, 1, '#d8a088'); for (let x = (yy % 8 ? 4 : 0); x < 320; x += 8) r(g, x, y + yy, 1, 3, '#d8a088'); }
          slot((x) => { r(g, x - 1, y + 1, 24, 15, '#604020'); r(g, x + 1, y + 3, 20, 13, '#f8d878'); r(g, x + 3, y + 5, 16, 11, '#f8e8a8'); r(g, x + 1, y + 15, 20, 1, '#a83c00'); });
          return;
        case 'site':
          for (let x = 0; x < 320; x += 8) r(g, x, y, 8, 16, (x >> 3) % 2 ? P.white : P.org);
          r(g, 0, y + 14, 320, 2, '#806030');
          slot((x) => { r(g, x, y + 1, 22, 15, '#3c3020'); r(g, x + 1, y + 2, 20, 13, '#1c1810'); r(g, x + 7, y + 3, 8, 3, P.yel); r(g, x + 6, y + 5, 10, 1, P.yel); r(g, x, y + 14, 22, 2, '#9c8c74'); });
          return;
        case 'stumps':
          r(g, 0, y, 320, 16, '#3c5c20');
          for (let x = 0; x < 320; x += 4) r(g, x, y + Math.floor(hash(x, 3) * 14), 3, 2, '#5c8c30');
          slot((x) => { r(g, x - 1, y, 24, 16, '#6c4c24'); r(g, x + 1, y + 2, 20, 14, '#2c1c0c'); r(g, x - 1, y, 24, 2, '#8cb848'); r(g, x, y + 13, 22, 3, '#54381c'); });
          return;
        case 'igloo':
          r(g, 0, y, 320, 16, '#d8e8f8');
          for (let x = 0; x < 320; x += 5) r(g, x, y + Math.floor(hash(x, 4) * 14), 4, 1, '#b8c8e0');
          slot((x) => { r(g, x - 2, y + 1, 26, 15, P.white); r(g, x, y, 22, 1, P.white); for (let i = 0; i < 26; i += 6) r(g, x - 2 + i, y + 1, 1, 15, '#c8d8ec'); r(g, x + 3, y + 4, 16, 12, '#1c3c78'); r(g, x + 5, y + 3, 12, 1, '#1c3c78'); });
          return;
        case 'shutters':
          r(g, 0, y, 320, 16, '#5c6070');
          for (let x = 4; x < 320; x += 12) { r(g, x, y + 2, 1, 1, '#a8acb4'); r(g, x, y + 13, 1, 1, '#a8acb4'); }
          slot((x) => { for (let i = 0; i < 24; i += 4) { r(g, x - 1 + i, y, 2, 16, P.yel); r(g, x + 1 + i, y, 2, 16, P.ink); } r(g, x + 2, y + 2, 18, 14, '#14141c'); r(g, x + 2, y + 2, 18, 3, '#7c8088'); });
          return;
        case 'house': {
          r(g, 0, y, 320, 16, '#48b030');
          for (let x = 0; x < 320; x += 6) { r(g, x + 1, y + 4, 3, 12, P.white); r(g, x + 1, y + 3, 3, 1, '#d8d8d8'); }
          r(g, 0, y + 7, 320, 1, P.white); r(g, 0, y + 11, 320, 1, P.white);
          r(g, 112, y, 96, 16, '#e8d0a0'); r(g, 112, y, 96, 2, '#c84020');
          for (let i = 0; i < 2; i++) { const wx = i ? 182 : 122; r(g, wx, y + 4, 16, 9, '#604020'); r(g, wx + 1, y + 5, 14, 7, '#f8e8a8'); r(g, wx + 7, y + 5, 1, 7, '#604020'); r(g, wx - 1, y + 13, 18, 2, '#58c040'); }
          r(g, 147, y + 1, 26, 15, '#604020'); r(g, 149, y + 3, 22, 13, '#f8d878');
          return;
        }
      }
    },

    // ------------------------------------------------------------------ per frame
    draw(t, frame) {
      const g = LP.LCD.ctx, cam = W.camY;
      G.g = g;
      g.drawImage(W.bg, 0, cam, 320, 208, 0, 16, 320, 208);
      W.drawHomes(g, frame);
      const first = Math.max(0, Math.floor(cam / 16) - 1), last = Math.min(W.lanes.length, Math.ceil((cam + 208) / 16) + 1);
      for (let i = first; i < last; i++) W.drawLane(g, W.lanes[i], t, frame);
    },
    drawLane(g, lane, t, frame) {
      const y = W.rowY(lane.row), th = W.laneTheme(lane);
      if (y < -16 || y > 240) return;
      switch (lane.type) {
        case 'water': {
          const wc = th.water, ph = Math.floor(t / 6);
          for (let x = 0; x < 320; x += 20) {
            const xx = (x + ph * (lane.sp >= 0 ? 1 : -1) + 400) % 320, yy = y + 3 + ((x / 20) % 3) * 4;
            r(g, xx, yy, 6, 1, wc[1]); if ((x / 20 + (ph >> 2)) % 4 === 0) r(g, xx + 2, yy, 2, 1, wc[2]);
          }
          for (const it of lane.items) W.drawPlatform(g, lane, it, y, t, frame);
          return;
        }
        case 'road':
          for (const it of lane.items) {
            if (it.x > 330 || it.x + it.w < -10) continue;
            const img = Sprites.vehicle(it.kind, it.hue, lane.dir, (frame >> 3) + it.n);
            const dx = Math.round(it.x + (it.w - img.width) / 2), dy = y + 15 - img.height;
            g.drawImage(img, dx, dy);
            if (it.kind === 'tractor' && frame % 24 < 12) r(g, dx + (lane.dir > 0 ? 11 : 4), dy - 2, 2, 2, '#bcbcbc');
          }
          return;
        case 'belt': {
          r(g, 0, y + 2, 320, 12, '#5c5c64'); r(g, 0, y + 2, 320, 1, '#88888c'); r(g, 0, y + 13, 320, 1, '#3c3c44');
          const ph = Math.floor(((t * lane.sp) % 12 + 12) % 12);
          for (let x = -12 + ph; x < 320; x += 12) {
            const d = lane.sp >= 0 ? 1 : -1;
            for (let k = 0; k < 4; k++) { r(g, x + (d > 0 ? k : 3 - k), y + 4 + k, 1, 1, '#9c9ca4'); r(g, x + (d > 0 ? k : 3 - k), y + 11 - k, 1, 1, '#9c9ca4'); }
          }
          for (const it of lane.items) {
            if (it.x > 330 || it.x + it.w < -10) continue;
            const img = it.kind === 'gear' ? Sprites.gear((frame >> 2) & 1) : Sprites.saw((frame >> 2) & 1);
            g.drawImage(img, Math.round(it.x + (it.w - img.width) / 2), y + 15 - img.height);
          }
          return;
        }
        case 'rail': {
          if (lane.train) {
            const tr = lane.train, n = lane.cars + 1;
            for (let k = 0; k < n; k++) {
              const isLoco = lane.dir > 0 ? k === n - 1 : k === 0;
              const img = isLoco ? Sprites.loco(lane.th, lane.dir) : Sprites.boxcar(k + lane.i, lane.th);
              const x = Math.round(tr.x + k * 32);
              if (x > 330 || x < -40) continue;
              g.drawImage(img, x, y + 1);
            }
          }
          return;
        }
        case 'timed':
          for (const c of lane.cells) W.drawTimed(g, lane, c, y, frame);
          return;
        case 'ice':
          for (let c = 0; c < Lanes.COLS; c++) {
            const s = lane.ice[c], x = Lanes.colX(c) - 8;
            if (s.hole) {
              r(g, x + 1, y + 2, 14, 12, '#143068'); r(g, x + 3, y + 1, 10, 14, '#143068');
              if ((frame >> 3) % 2) r(g, x + 5, y + 7, 6, 1, '#78a8e0');
              continue;
            }
            const k = Math.floor(s.crack * 4);
            if (k >= 1) { r(g, x + 4, y + 7, 4, 1, '#5888b8'); r(g, x + 8, y + 6, 1, 1, '#5888b8'); }
            if (k >= 2) { r(g, x + 2, y + 4, 2, 1, '#5888b8'); r(g, x + 9, y + 9, 4, 1, '#5888b8'); r(g, x + 7, y + 8, 1, 3, '#5888b8'); }
            if (k >= 3) { r(g, x + 3, y + 11, 3, 1, '#3868a8'); r(g, x + 11, y + 3, 1, 4, '#3868a8'); r(g, x + 5, y + 3, 1, 3, '#3868a8'); }
          }
          return;
      }
    },
    drawPlatform(g, lane, it, y, t, frame) {
      if (it.x > 330 || it.x + it.w < -10) return;
      const st = it.ds || 0, depth = st === 0 ? 0 : st === 2 ? 1 : st === 1 ? Lanes.diveFrac(lane, it, t) * 4 : (1 - Lanes.diveFrac(lane, it, t)) * 4;
      const d = LP.clamp(depth, 0, 1);
      if (st === 2) {   // under: just bubbles
        if ((frame >> 3) % 3 === 0) for (let x = it.x + 4; x < it.x + it.w - 2; x += 8) r(g, Math.round(x), y + 7, 2, 1, W.laneTheme(lane).water[2]);
        return;
      }
      const put = (img, x, yy) => {
        x = Math.round(x);
        if (d <= 0) return g.drawImage(img, x, yy);
        const keep = Math.max(1, Math.round(img.height * (1 - d * 0.75)));
        g.drawImage(img, 0, 0, img.width, keep, x, yy + img.height - keep, img.width, keep);
      };
      const top = y + 2;
      switch (it.kind) {
        case 'log': put(Sprites.log(it.w), it.x, top); break;
        case 'turtle': for (let k = 0; k < it.cells; k++) put(G.mirrorIf(Sprites.turtle(((frame >> 4) + k) & 1), lane.dir < 0), it.x + k * 16, top); break;
        case 'raft': put(Sprites.raft(it.w, lane.th), it.x, top); break;
        case 'pad': put(Sprites.pad(it.dive ? 1 : 0, (frame >> 5) & 1), it.x, y + 3); break;
        case 'gator': put(Sprites.gator(Lanes.jawsOpen(it, t), lane.dir), it.x, top); break;
        case 'floe': put(Sprites.floe(it.w, it.dive ? 1 : 0), it.x, top + 1); break;
        case 'barrel': put(Sprites.barrel((frame >> 3) & 1), it.x, top); break;
        case 'crate': put(Sprites.crate(it.w), it.x, top); break;
        case 'barge': put(Sprites.barge(it.w, lane.dir), it.x, top); break;
      }
      if (d > 0 && (frame >> 2) % 2) r(g, Math.round(it.x) + 2, y + 13, it.w - 4, 1, W.laneTheme(lane).water[2]);
    },
    drawTimed(g, lane, c, y, frame) {
      const x = Lanes.colX(c.col) - 8, s = c.state, P2 = PAL;
      const shake = s === 1 ? ((frame >> 1) % 2 ? 1 : -1) : 0;
      switch (lane.kind) {
        case 'press': {
          const cfg = lane.cfg, onLocal = c.local - (lane.per - cfg.on);
          // a squat hydraulic press: head hovers 8px up, slams onto the floor
          const lift = s === 2 ? (onLocal < 4 ? 8 - onLocal * 2 : 0) : 8;
          r(g, x + 1, y + 3, 14, 12, s === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(200,0,0,0.3)');
          r(g, x + 6, y - 9, 4, 6 + 8 - lift, '#9ca0a8');
          r(g, x + 1 + shake, y + 3 - lift, 14, 10, '#5c6070'); r(g, x + 1 + shake, y + 3 - lift, 14, 2, '#a8acb4');
          for (let i = 0; i < 14; i += 4) r(g, x + 1 + i + shake, y + 10 - lift, 2, 2, P2.yel);
          r(g, x + 1 + shake, y + 12 - lift, 14, 1, P2.ink);
          return;
        }
        case 'manhole':
          if (s === 2) { r(g, x + 2, y + 3, 12, 10, '#0c0c0c'); r(g, x + 3, y + 2, 10, 12, '#0c0c0c'); r(g, x + 10, y + 1, 6, 3, '#5c5c5c'); return; }
          r(g, x + 3, y + 3 - (s === 1 && frame % 6 < 3 ? 1 : 0), 10, 10, '#5c5c5c'); r(g, x + 2, y + 4, 12, 8, '#5c5c5c');
          r(g, x + 4, y + 6, 8, 1, '#3c3c3c'); r(g, x + 4, y + 9, 8, 1, '#3c3c3c');
          if (s === 1) r(g, x + 2, y + 13, 12, 1, P2.yel);
          return;
        case 'geyser':
          r(g, x + 3, y + 5, 10, 7, '#4c3418'); r(g, x + 5, y + 4, 6, 9, '#4c3418');
          if (s === 1) { const b = frame % 12; r(g, x + 4 + (b >> 1), y + 6 + (b % 4), 2, 2, '#9c7848'); r(g, x + 9 - (b >> 2), y + 8, 2, 2, '#9c7848'); }
          if (s === 2) {
            const h = 24 + ((frame >> 1) % 3) * 2;
            r(g, x + 4, y + 12 - h, 8, h, '#8c6434'); r(g, x + 2, y + 12 - h - 3, 12, 6, '#a8804c'); r(g, x + 5, y + 12 - h, 2, h - 2, '#c8a070');
            r(g, x, y + 10, 16, 4, '#8c6434');
          }
          return;
        case 'steam':
          r(g, x + 2, y + 3, 12, 10, '#3c3c44');
          for (let i = 0; i < 4; i++) r(g, x + 3, y + 4 + i * 2 + 1, 10, 1, '#1c1c24');
          if (s === 1 && frame % 8 < 4) r(g, x + 6, y + 1, 4, 2, '#d8d8e0');
          if (s === 2) {
            for (let k = 0; k < 6; k++) {
              const wob = Math.round(Math.sin((frame + k * 5) * 0.4) * 2), w2 = 8 + k;
              r(g, x + 8 - (w2 >> 1) + wob, y + 6 - k * 5, w2, 6, k % 2 ? '#e8e8f0' : P2.white);
            }
          }
          return;
      }
    },

    drawHomes(g, frame) {
      for (const h of W.homes) {
        const y = W.rowY(0);
        if (h.fly > 0 && !h.filled) g.drawImage(Sprites.fly((frame >> 2) & 1), h.x - 4, y + 4 + Math.round(Math.sin(frame * 0.2) * 2));
        if (h.gator > 0 && !h.filled) g.drawImage(Sprites.gatorHead(h.gator <= 170 ? 1 : 0), h.x - 11, y + 4);
      }
    },

    // signals for railway lanes, drawn on the bezel so they never hide anything
    drawSignals(g, frame) {
      for (const lane of W.lanes) {
        if (lane.type !== 'rail') continue;
        const y = W.rowY(lane.row);
        if (y < 0 || y > 224) continue;
        for (const x of [1, 313]) {
          r(g, x, y + 2, 6, 12, '#1c1c1c');
          const on = lane.warn && (frame >> 3) % 2;
          r(g, x + 1, y + 3, 4, 4, on ? '#f83800' : '#501000'); r(g, x + 1, y + 9, 4, 4, lane.warn && !on ? '#f83800' : '#501000');
        }
      }
    },

    bezel(g, frame) {
      const c = W.theme().bezel;
      r(g, 0, 16, 8, 208, c); r(g, 312, 16, 8, 208, c);
      r(g, 7, 16, 1, 208, '#000'); r(g, 312, 16, 1, 208, '#000');
      for (let y = 20; y < 224; y += 16) { r(g, 3, y, 2, 2, 'rgba(255,255,255,0.18)'); r(g, 315, y, 2, 2, 'rgba(255,255,255,0.18)'); }
      W.drawSignals(g, frame);
    },

    // night: darkness with light around the sloth, headlights, train lamps and the homes
    night(g, lights) {
      if (!W.dark) W.dark = G.canvas(320, 240);
      const d = W.dark, dg = d.getContext('2d');
      dg.globalCompositeOperation = 'source-over';
      dg.clearRect(0, 0, 320, 240);
      dg.fillStyle = 'rgba(6,8,30,0.84)'; dg.fillRect(0, 16, 320, 208);
      dg.globalCompositeOperation = 'destination-out';
      const hole = (x, y, rad, a) => { dg.fillStyle = 'rgba(0,0,0,' + a + ')'; G.ellipse(x, y, rad, rad * 0.8, dg.fillStyle, dg); };
      for (const L of lights) {
        if (L.cone) {
          dg.fillStyle = 'rgba(0,0,0,0.75)';
          dg.beginPath(); dg.moveTo(L.x, L.y - 2); dg.lineTo(L.x + L.cone * 44, L.y - 9); dg.lineTo(L.x + L.cone * 44, L.y + 7); dg.lineTo(L.x, L.y + 2); dg.fill();
        } else { hole(L.x, L.y, L.r * 1.35, 0.45); hole(L.x, L.y, L.r, 1); }
      }
      g.drawImage(d, 0, 0);
    }
  };
  return W;
})();
