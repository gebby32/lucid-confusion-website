/* WORLD — the current level: parsing the hand-drawn ASCII maps, baking the terrain
   canvas, tile collision (solid, one-way, 45-degree slopes, movers), and drawing the
   animated tiles (water, lava, waterfalls, breakable blocks).

   Map legend (levels.js):
     .  air              #  terrain          X  alt terrain (stone / bone piles)
     /  slope rising →   \  slope falling →  =  one-way branch / ledge
     -  hang bar         |  climbing vine    +  vine junction (hang + climb)
     ^  thorns           ~  liquid surface   w  liquid body
     B  breakable block  W  waterfall (behind, harmless)    H  secret wall (looks solid, isn't)
     :  mover end marker (P travels right to it, V travels up to it)
   Every other character is an entity, handed to Game.spawn (see game.js). */
'use strict';
const World = (function () {
  const TS = 16;
  const AIR = 0, SOLID = 1, ALT = 2, SL_R = 3, SL_L = 4, ONEWAY = 5, HANG = 6, CLIMB = 7, SPIKE = 8, LIQ = 9, LIQB = 10, BREAK = 11, FALLW = 12, HIDDEN = 13, VINEX = 14;
  const CODE = { '#': SOLID, 'X': ALT, '/': SL_R, '\\': SL_L, '=': ONEWAY, '-': HANG, '|': CLIMB, '+': VINEX, '^': SPIKE, '~': LIQ, 'w': LIQB, 'B': BREAK, 'W': FALLW, 'H': HIDDEN };

  const W = {
    TS, AIR, SOLID, ALT, SL_R, SL_L, ONEWAY, HANG, CLIMB, SPIKE, LIQ, LIQB, BREAK, FALLW, HIDDEN, VINEX,
    def: null, theme: null, w: 0, h: 0, pw: 0, ph: 0, grid: null, ents: [], canvas: null, movers: [],
    breaks: new Map(), fronts: [], liquidKind: 'water'
  };

  // ------------------------------------------------------------------ parsing
  function sectionRows(text) {
    const rows = text.split('\n');
    while (rows.length && !rows[0].trim()) rows.shift();
    while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
    return rows.map((r) => r.replace(/\r/g, ''));
  }
  W.parse = function (def) {
    const secs = (def.map ? [def.map] : def.sections).map(sectionRows);
    const h = Math.max(...secs.map((s) => s.length));
    const rows = new Array(h).fill('');
    for (const s of secs) {
      const sw = Math.max(...s.map((r) => r.length));
      const pad = h - s.length;                      // shorter sections are bottom-aligned
      for (let y = 0; y < h; y++) {
        const r = y < pad ? '' : s[y - pad];
        rows[y] += r.padEnd(sw, '.');
      }
    }
    return rows;
  };

  W.load = function (def) {
    W.def = def; W.theme = def.theme;
    const rows = W.parse(def);
    W.h = rows.length; W.w = rows[0].length; W.pw = W.w * TS; W.ph = W.h * TS;
    W.grid = new Uint8Array(W.w * W.h);
    W.ents = []; W.movers = []; W.breaks = new Map(); W.markers = [];
    for (let y = 0; y < W.h; y++) {
      for (let x = 0; x < W.w; x++) {
        const ch = rows[y][x] || '.';
        if (ch === '.') continue;
        if (ch === ':') { W.markers.push([x, y]); continue; }
        if (CODE[ch] !== undefined) { W.grid[y * W.w + x] = CODE[ch]; continue; }
        W.ents.push({ ch, tx: x, ty: y, x: x * TS + 8, y: y * TS + 16 });
      }
    }
    // entities drawn inside a liquid (logs, fish) keep the liquid around them
    for (const e of W.ents) {
      const l = W.grid[e.ty * W.w + e.tx - 1], r = W.grid[e.ty * W.w + e.tx + 1];
      if (l === LIQ || r === LIQ) W.grid[e.ty * W.w + e.tx] = LIQ;
      else if (l === LIQB || r === LIQB) W.grid[e.ty * W.w + e.tx] = LIQB;
    }
    W.grid0 = W.grid.slice();
    W.liquidKind = Themes.T[def.theme].liquid;
    W.bake();
    return W;
  };
  W.resetGrid = function () { W.grid.set(W.grid0); W.breaks.clear(); W.movers.length = 0; };

  // ------------------------------------------------------------------ tile queries
  const code = W.code = (tx, ty) => (tx < 0 || tx >= W.w) ? SOLID : (ty < 0 || ty >= W.h) ? AIR : W.grid[ty * W.w + tx];
  const solidCode = W.solidCode = (c) => c === SOLID || c === ALT || c === BREAK;
  W.at = (px, py) => code(Math.floor(px / TS), Math.floor(py / TS));
  W.solidAt = (px, py) => solidCode(W.at(px, py));
  W.set = (tx, ty, c) => { if (tx >= 0 && ty >= 0 && tx < W.w && ty < W.h) W.grid[ty * W.w + tx] = c; };

  // first solid tile column hit by a vertical edge at x between top and bottom (pixels); null if clear
  W.wall = function (x, top, bottom) {
    const tx = Math.floor(x / TS);
    for (let ty = Math.floor(top / TS); ty <= Math.floor(bottom / TS); ty++) if (solidCode(code(tx, ty))) return tx;
    return null;
  };
  W.ceiling = function (xl, xr, y) {
    const ty = Math.floor(y / TS);
    for (const x of [xl, (xl + xr) / 2, xr]) if (solidCode(code(Math.floor(x / TS), ty))) return ty;
    return null;
  };
  // Highest floor surface between from..to (pixels, from <= to) under the probe span.
  // prevBot: the feet before this move (one-way platforms only catch feet that were above them).
  // Returns { y, m (mover or null), slope } or null.
  W.floor = function (xl, xr, prevBot, from, to, drop, noMovers) {
    const xc = (xl + xr) / 2, tcx = Math.floor(xc / TS);
    const tyA = Math.floor((from - 12) / TS), tyB = Math.floor(to / TS);
    // slopes under the centre win (side probes would otherwise snag on the high end)
    for (let ty = tyA; ty <= tyB; ty++) {
      const c = code(tcx, ty);
      if (c === SL_R || c === SL_L) {
        const lx = xc - tcx * TS, s = ty * TS + (c === SL_R ? TS - lx : lx);
        if (s >= from - 12 && s <= to + 0.001) return { y: s, m: null, slope: c };
      }
    }
    let best = null, bm = null;
    for (const x of [xl, xc, xr]) {
      const tx = Math.floor(x / TS);
      if (x !== xc) {   // a side probe over a slope tile never makes a floor at the slope's top edge
        const c0 = code(tx, Math.floor(to / TS));
        if (c0 === SL_R || c0 === SL_L) continue;
      }
      for (let ty = Math.floor(from / TS); ty <= tyB; ty++) {
        const s = ty * TS;
        if (s < from - 0.001 || s > to + 0.001) continue;
        const c = code(tx, ty);
        if (solidCode(c) || (c === ONEWAY && !drop && prevBot <= s + 0.5)) { if (best === null || s < best) best = s; break; }
      }
    }
    if (!noMovers) for (const m of W.movers) {
      if (!m.solid || xr <= m.x || xl >= m.x + m.w) continue;
      const s = m.y;
      if (s >= from - 0.001 - Math.max(0, -m.dy) && s <= to + 0.001 + Math.max(0, -m.dy) && prevBot <= s + 1 + Math.abs(m.dy) && !(drop && m.thin)) {
        if (best === null || s <= best) { best = s; bm = m; }
      }
    }
    return best === null ? null : { y: best, m: bm, slope: 0 };
  };
  // the tile code under the feet (for footstep dust, ice etc.)
  W.groundCode = (x, y) => W.at(x, y + 1);
  W.hangAt = (x, y) => { const c = W.at(x, y); return c === HANG || c === VINEX; };
  W.climbAt = (x, y) => { const c = W.at(x, y); return c === CLIMB || c === VINEX; };
  // deadly liquid: returns surface y if (x, y) is under a liquid surface
  W.liquidAt = function (x, y) {
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS), c = code(tx, ty);
    if (c === LIQB) return ty * TS;
    if (c === LIQ && y > ty * TS + 6) return ty * TS + 6;
    return null;
  };
  W.spikeAt = function (xl, xr, top, bot) {
    for (let ty = Math.floor(top / TS); ty <= Math.floor(bot / TS); ty++)
      for (let tx = Math.floor(xl / TS); tx <= Math.floor(xr / TS); tx++)
        if (code(tx, ty) === SPIKE && bot > ty * TS + 7) return true;
    return false;
  };
  // breakable blocks: hit returns true if one broke
  W.hitBreakable = function (x0, y0, x1, y1) {
    let hit = false;
    for (let ty = Math.floor(y0 / TS); ty <= Math.floor(y1 / TS); ty++)
      for (let tx = Math.floor(x0 / TS); tx <= Math.floor(x1 / TS); tx++)
        if (code(tx, ty) === BREAK) { W.set(tx, ty, AIR); W.breaks.set(ty * W.w + tx, 0); hit = true; Game.onBreak(tx * TS + 8, ty * TS + 8); }
    return hit;
  };

  // ------------------------------------------------------------------ baking
  W.bake = function () {
    const th = Themes.T[W.theme], pw = W.pw, ph = W.ph;
    const c = Px.canvas(pw, ph), g = c.getContext('2d');
    // terrain mask, pixel accurate (slopes are triangles)
    const mask = new Uint8Array(pw * ph);
    for (let ty = 0; ty < W.h; ty++) for (let tx = 0; tx < W.w; tx++) {
      const k = W.grid[ty * W.w + tx];
      if (k === SOLID || k === HIDDEN || k === ALT) {
        const v = k === ALT ? 2 : 1;
        for (let y = 0; y < TS; y++) mask.fill(v, (ty * TS + y) * pw + tx * TS, (ty * TS + y) * pw + tx * TS + TS);
      } else if (k === SL_R || k === SL_L) {
        for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
          const solid = k === SL_R ? y >= TS - 1 - x : y >= x;
          if (solid) mask[(ty * TS + y) * pw + tx * TS + x] = 1;
        }
      }
    }
    // big trees behind everything (explicit T markers + a few automatic ones on open ground)
    const r = Px.rng(W.w * 31 + W.h);
    const trees = [];
    for (const e of W.ents) if (e.ch === 'T') trees.push([e.x, e.y, 1]);
    if (th.tree && !W.def.noAutoTrees) for (let tx = 8; tx < W.w - 8; tx += 14 + Math.floor(r() * 12)) {
      for (let ty = 2; ty < W.h - 1; ty++) {
        if (solidCode(code(tx, ty)) && code(tx, ty - 1) === AIR && code(tx, ty - 6) === AIR && code(tx, ty - 3) === AIR) { trees.push([tx * TS + 8, ty * TS, 0.8 + r() * 0.4]); break; }
      }
    }
    for (const [x, y, s] of trees) Props.tree(g, th.tree, x, y, s);
    // terrain
    const img = new ImageData(Themes.shadeTerrain(W.theme, mask, pw, ph), pw, ph);
    const tc = Px.canvas(pw, ph); tc.getContext('2d').putImageData(img, 0, 0);
    g.drawImage(tc, 0, 0);
    // surface decorations + foreground tufts
    W.fronts = [];
    for (let tx = 0; tx < W.w; tx++) for (let ty = 1; ty < W.h; ty++) {
      const k = code(tx, ty), above = code(tx, ty - 1);
      if (!(k === SOLID || k === HIDDEN) || above !== AIR) continue;
      const hs = Themes.hash(tx, ty * 3);
      if (hs < 0.4) Props.DECOR[th.decor[Math.floor(Themes.hash(tx * 7, ty) * th.decor.length)]](g, tx * TS, ty * TS, 1, W.theme);
      else if (hs > 0.9 && (th.decor.includes('tuft') || th.decor.includes('fern') || th.decor.includes('fernblue') || th.decor.includes('tuftburnt'))) W.fronts.push([tx * TS + 8, ty * TS]);
    }
    // props by runs
    for (let ty = 0; ty < W.h; ty++) {
      let tx = 0;
      while (tx < W.w) {
        const k = code(tx, ty);
        let n = 1;
        const same = (q) => (k === HANG || k === VINEX) ? (q === HANG || q === VINEX) : q === k;
        while (tx + n < W.w && same(code(tx + n, ty))) n++;
        if (k === ONEWAY) Props.platform(g, th.platform, tx * TS, ty * TS, n, W.theme);
        else if (k === HANG || k === VINEX) Props.hang(g, th.hang, tx * TS, ty * TS, n, W.theme);
        else if (k === SPIKE) Props.spikes(g, th.spike, tx * TS, ty * TS, n);
        tx += n;
      }
    }
    for (let tx = 0; tx < W.w; tx++) {
      let ty = 0;
      while (ty < W.h) {
        const k = code(tx, ty);
        if (k === CLIMB || k === VINEX) {
          let n = 1; while (ty + n < W.h && (code(tx, ty + n) === CLIMB || code(tx, ty + n) === VINEX)) n++;
          Props.climb(g, th.climb, tx * TS, ty * TS, n, W.theme);
          ty += n;
        } else ty++;
      }
    }
    // the hang bars are drawn again over the climbing vines where they cross
    for (let ty = 0; ty < W.h; ty++) for (let tx = 0; tx < W.w; tx++) if (code(tx, ty) === VINEX) Props.hang(g, th.hang, tx * TS, ty * TS, 1, W.theme);
    W.canvas = c;
  };

  // ------------------------------------------------------------------ drawing
  W.drawBack = function (g, cx, cy, t) {
    // waterfalls sit behind the terrain
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(W.w - 1, Math.floor((cx + 320) / TS));
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(W.h - 1, Math.floor((cy + 240) / TS));
    for (let tx = x0; tx <= x1; tx++) {
      let ty = y0;
      while (ty <= y1) {
        if (code(tx, ty) === FALLW) {
          let n = 1; while (ty + n <= y1 && code(tx, ty + n) === FALLW) n++;
          Props.waterfall(g, tx * TS - cx, ty * TS - cy, n * TS, t, tx * TS);
          ty += n;
        } else ty++;
      }
    }
  };
  W.drawLevel = function (g, cx, cy) {
    g.drawImage(W.canvas, cx, cy, 320, 240, 0, 0, 320, 240);
  };
  W.drawDynamic = function (g, cx, cy, t) {
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(W.w - 1, Math.floor((cx + 320) / TS));
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(W.h - 1, Math.floor((cy + 240) / TS));
    const th = Themes.T[W.theme];
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const k = code(tx, ty);
        if (k === BREAK) Props.breakable(g, th.breakable, tx * TS - cx, ty * TS - cy, W.theme);
        else if (k === SPIKE && th.spike === 'embers') {
          for (let j = 0; j < 4; j++) if (Math.sin(t * 6 + tx * 3 + j * 2) > 0.6) { g.fillStyle = j % 2 ? '#ffb040' : '#ff6a1a'; g.fillRect(tx * TS - cx + j * 4 + 1, ty * TS - cy + 11 - ((t * 20 + j * 5) % 6), 2, 2); }
        }
      }
    }
  };
  // liquids are drawn in front of the player (so he sinks into them)
  W.drawLiquids = function (g, cx, cy, t) {
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(W.w - 1, Math.floor((cx + 320) / TS));
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(W.h - 1, Math.floor((cy + 240) / TS));
    for (let ty = y0; ty <= y1; ty++) {
      let tx = x0;
      while (tx <= x1) {
        if (code(tx, ty) === LIQ) {
          let n = 1; while (tx + n <= x1 && code(tx + n, ty) === LIQ) n++;
          let d = 1; while (ty + d < W.h && code(tx, ty + d) === LIQB) d++;
          const sy = ty * TS + 6 - cy;
          Props.liquid(g, W.liquidKind, tx * TS - cx, sy, n * TS, Math.min(250, d * TS - 6), t, tx * TS);
          tx += n;
        } else if (code(tx, ty) === LIQB && ty === y0) {
          let n = 1; while (tx + n <= x1 && code(tx + n, ty) === LIQB) n++;
          let d = 1; while (ty + d < W.h && code(tx, ty + d) === LIQB) d++;
          const L = Props.LIQ[W.liquidKind]; g.fillStyle = L.body[1]; g.fillRect(tx * TS - cx, ty * TS - cy, n * TS, Math.min(260, d * TS));
          tx += n;
        } else tx++;
      }
    }
  };
  W.drawFronts = function (g, cx, cy) {
    const th = Themes.T[W.theme];
    const cols = W.theme === 'night' ? ['#0e2a3a', '#1a4a5a'] : W.theme === 'final' ? ['#1a0e08', '#2e1a10'] : W.theme === 'jungle' || W.theme === 'falls' ? ['#1e5a1e', '#2e7a2a'] : ['#8a6a20', '#b88a2c'];
    for (const [x, y] of W.fronts) {
      const sx = x - cx, sy = y - cy;
      if (sx < -20 || sx > 340 || sy < -10 || sy > 260) continue;
      for (let k = 0; k < 7; k++) {
        const hgt = 7 + ((k * 5 + x) % 6), lean = (k - 3) * 1.2;
        Px.stroke(g, [[sx - 6 + k * 2, sy + 2], [sx - 6 + k * 2 + lean, sy - hgt]], 0.5, cols[k % 2]);
      }
    }
    void th;
  };

  return W;
})();
