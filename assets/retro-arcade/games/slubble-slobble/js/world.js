/* WORLD — the current arena: tile grid, themed NES tiles + backdrop, collision for every
   body (sloths, enemies, corpses), moving platforms, conveyors, springs, spikes, lava,
   fire jets, ladders, teleporters, water, wind, darkness, screen wraparound.
   Coordinates are screen pixels; tile (c, r) covers x = c*8, y = TOP + r*8.
   A body is { x (centre), y (feet), w, h, vx, vy } — World.move() resolves it. */
'use strict';
const World = (function () {
  const T = 8, TOP = 16, C = 32, R = 22, W = 256, H = 192;
  const BOT = TOP + R * T;                          // 192

  const THEMES = {
    meadow: { bg: '#3cbcfc', style: 'grass', pal: ['#b8f818', '#00a800', '#ac7c00', '#503000'], wall: ['#fca044', '#e45c10', '#a81000', '#503000'], wallStyle: 'brick', ladder: '#ac7c00' },
    castle: { bg: '#6888fc', style: 'stone', pal: ['#fcfcfc', '#bcbcbc', '#7c7c7c', '#404040'], wall: ['#bcbcbc', '#7c7c7c', '#404040', '#202020'], wallStyle: 'stone', ladder: '#ac7c00' },
    junk: { bg: '#e45c10', style: 'metal', pal: ['#bcbcbc', '#7c7c7c', '#ac7c00', '#404040'], wall: ['#ac7c00', '#7c4c00', '#503000', '#202020'], wallStyle: 'metal', ladder: '#bcbcbc' },
    toys: { bg: '#f8b8f8', style: 'candy', pal: ['#fcfcfc', '#3cbcfc', '#0058f8', '#202060'], wall: ['#fcfcfc', '#f878f8', '#d800cc', '#6844fc'], wallStyle: 'candy', ladder: '#f8b800' },
    haunt: { bg: '#200838', style: 'brick', pal: ['#9878f8', '#6844fc', '#202060', '#000000'], wall: ['#7c7c7c', '#404040', '#202020', '#000000'], wallStyle: 'stone', ladder: '#7c7c7c' },
    ice: { bg: '#a4e4fc', style: 'ice', pal: ['#fcfcfc', '#a4e4fc', '#3cbcfc', '#0058f8'], wall: ['#fcfcfc', '#3cbcfc', '#0058f8', '#0000bc'], wallStyle: 'ice', ladder: '#fcfcfc' },
    lava: { bg: '#200800', style: 'rock', pal: ['#fca044', '#a81000', '#503000', '#200000'], wall: ['#7c7c7c', '#503000', '#200000', '#000000'], wallStyle: 'rock', ladder: '#7c7c7c' },
    neon: { bg: '#000000', style: 'neon', pal: ['#00e8d8', '#d800cc', '#202060', '#000000'], wall: ['#d800cc', '#6844fc', '#202060', '#000000'], wallStyle: 'neon', ladder: '#00e8d8' },
    sky: { bg: '#f8b800', style: 'girder', pal: ['#fca044', '#f83800', '#a81000', '#503000'], wall: ['#bcbcbc', '#7c7c7c', '#404040', '#202020'], wallStyle: 'metal', ladder: '#bcbcbc' },
    throne: { bg: '#3c1c6c', style: 'gold', pal: ['#fcfcfc', '#f8b800', '#ac7c00', '#503000'], wall: ['#9878f8', '#6844fc', '#202060', '#000000'], wallStyle: 'brick', ladder: '#f8b800' }
  };

  const Wd = {
    T, TOP, C, R, W, H, BOT, THEMES,
    n: 1, def: null, theme: null, grid: null, spawns: [], teles: [], movers: [], jets: [], springs: {},
    waterY: Infinity, wind: 0, grav: 1, dark: false, sink: false, time: 0,
    bg: null, tiles: null, animated: [],

    load(n, override) {
      Wd.n = n;
      Wd.def = override || LEVELS[n];
      const d = Wd.def, b = LevelGrid.build(d);
      Wd.grid = b.grid; Wd.spawns = b.spawns; Wd.teles = b.teles;
      Wd.theme = THEMES[d.theme || WORLDS[LevelInfo.world(n)].theme];
      Wd.waterY = d.water !== undefined ? TOP + (d.water + 1) * T : Infinity;
      Wd.wind = d.wind || 0; Wd.grav = d.grav || 1; Wd.dark = !!d.dark; Wd.sink = !!d.sink;
      Wd.time = 0;
      Wd.movers = b.movers.map((m) => ({
        axis: m.axis, x: m.c * T, y: TOP + m.r * T, w: m.len * T, h: T,
        minX: (m.minC !== undefined ? m.minC : m.c) * T, maxX: (m.maxC !== undefined ? m.maxC : m.c) * T,
        minY: TOP + (m.minR !== undefined ? m.minR : m.r) * T, maxY: TOP + (m.maxR !== undefined ? m.maxR : m.r) * T,
        dir: m.axis === 'x' ? -m.side : -1, speed: m.axis === 'x' ? 0.45 : 0.4, dx: 0, dy: 0
      }));
      Wd.jets = [];
      Wd.springs = {};
      Wd.animated = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const t = Wd.grid[r * C + c];
        if (t === TILE.JET) Wd.jets.push({ c, r, phase: ((c * 7 + r * 3) % 4) * 0.5, on: false, warn: false });
        if (t === TILE.CONVL || t === TILE.CONVR || t === TILE.LAVA || t === TILE.TELE || t === TILE.SPRING) Wd.animated.push({ c, r, t });
      }
      Wd.buildArt();
    },

    // ------------------------------------------------------------------ queries
    tile(c, r) { c = ((c % C) + C) % C; if (r < 0) r = 0; if (r >= R) return 0; return Wd.grid[r * C + c]; },
    at(x, y) { return Wd.tile(Math.floor(x / T), Math.floor((y - TOP) / T)); },
    solid: (t) => t === TILE.SOLID,
    // can be stood on from above (platform tops)
    standable: (t) => t === TILE.PLAT || t === TILE.SOLID || t === TILE.ICE || t === TILE.CONVL || t === TILE.CONVR || t === TILE.SPRING || t === TILE.SPIKE || t === TILE.LAVA || t === TILE.JET,
    inWater(b) { return b.y - b.h * 0.5 > Wd.waterY; },
    ladderAt(x, y) { return Wd.at(x, y) === TILE.LADDER; },

    // ------------------------------------------------------------------ movement
    // Resolve a body. o: { pass: ignore platforms (ghost/bouncer), noWrap, solidOnly }
    // Sets b.onGround, b.ground (tile code), b.hitWall, b.bump, b.landed (this frame).
    move(b, o) {
      o = o || {};
      const wasGround = b.onGround;
      b.hitWall = 0; b.bump = false; b.landed = false;
      if (b.mover && wasGround) { b.x += b.mover.dx; b.y += b.mover.dy; }
      if (wasGround && !o.pass) {
        if (b.ground === TILE.CONVL) b.x -= 0.7;
        else if (b.ground === TILE.CONVR) b.x += 0.7;
      }
      // horizontal: push out of any solid tile overlapping the left / right edge
      b.x += b.vx;
      if (!o.pass) {
        const hw = b.w / 2, top = b.y - b.h + 1, bot = b.y - 1;
        for (const side of [1, -1]) {
          const c = Math.floor((b.x + side * hw) / T);
          for (let y = top; ; y = Math.min(bot, y + 7)) {
            if (Wd.tile(c, Math.floor((y - TOP) / T)) === TILE.SOLID) {
              b.x = side > 0 ? c * T - hw - 0.01 : (c + 1) * T + hw + 0.01;
              if (b.vx * side > 0) b.vx = 0;
              b.hitWall = side;
              break;
            }
            if (y >= bot) break;
          }
          if (b.hitWall) break;
        }
      }
      if (!o.noWrap) { if (b.x < -b.w) b.x += W + b.w; else if (b.x > W + b.w) b.x -= W + b.w; }
      // vertical
      const prevY = b.y;
      b.y += b.vy;
      b.onGround = false; b.mover = null;
      if (b.vy >= 0 && !o.pass) {
        const r0 = Math.floor((prevY - TOP) / T - 0.001), r1 = Math.floor((b.y - TOP) / T);
        let landed = false;
        for (let r = Math.max(0, r0); r <= r1 + 1 && !landed; r++) {
          const ty = TOP + r * T;
          if (!(prevY <= ty + 0.5 && b.y >= ty)) continue;
          const x0 = b.x - b.w / 2 + 1, x1 = b.x + b.w / 2 - 1;
          // every column under the feet counts; springs win, hazards lose (forgiving edges)
          let best = -1, rank = -1;
          for (let c = Math.floor(x0 / T); c <= Math.floor(x1 / T); c++) {
            const t = Wd.tile(c, r);
            const droppable = t !== TILE.SOLID && r < R - 1;
            let cand = -1;
            if (Wd.standable(t) && !(b.drop > 0 && droppable)) cand = t;
            else if (t === TILE.LADDER && Wd.tile(c, r - 1) !== TILE.LADDER && !(b.drop > 0) && !b.climbing) cand = TILE.PLAT;
            if (cand < 0) continue;
            const rk = cand === TILE.SPRING ? 3 : (cand === TILE.SPIKE || cand === TILE.LAVA) ? 1 : 2;
            if (rk > rank) { rank = rk; best = cand; }
          }
          if (best >= 0) { b.y = ty; landed = true; b.ground = best; }
        }
        if (!landed && !(b.drop > 0)) {
          for (const m of Wd.movers) {
            if (b.x + b.w / 2 - 1 < m.x || b.x - b.w / 2 + 1 > m.x + m.w) continue;
            if (prevY <= m.y + 0.5 + Math.max(0, m.dy) + Math.max(0, -m.dy) && b.y >= m.y) { b.y = m.y; landed = true; b.ground = TILE.PLAT; b.mover = m; break; }
          }
        }
        if (landed) {
          if (b.vy > 0.6 && !wasGround) b.landed = true;
          b.vy = 0; b.onGround = true;
        }
      } else if (b.vy < 0 && !o.pass) {
        const r = Math.floor((b.y - b.h - TOP) / T);
        for (const x of [b.x - b.w / 2 + 1, b.x + b.w / 2 - 1]) {
          if (Wd.tile(Math.floor(x / T), r) === TILE.SOLID) { b.y = TOP + (r + 1) * T + b.h; b.vy = 0; b.bump = true; break; }
        }
      }
      if (b.drop > 0) b.drop--;
      // vertical wraparound (floor / ceiling gaps)
      if (!o.noWrap) {
        if (b.y - b.h > BOT + 2) { b.y = TOP - 2; b.wrapped = true; }
        else if (b.y < TOP - 4 && b.vy < 0) { b.y = BOT + b.h; b.wrapped = true; }
      } else if (b.y > BOT) { b.y = BOT; b.vy = 0; b.onGround = true; b.ground = TILE.SOLID; }
      return b;
    },

    // Is the tile under a body's feet a hazard? returns 'spike' | 'lava' | null
    floorHazard(b) {
      if (!b.onGround) return null;
      if (b.ground === TILE.SPIKE) return 'spike';
      if (b.ground === TILE.LAVA) return 'lava';
      return null;
    },
    // fire jet flames
    flameHit(box) {
      for (const j of Wd.jets) {
        if (!j.on) continue;
        const fx = j.c * T + 1, fy = TOP + j.r * T - 26, fw = T - 2, fh = 26;
        if (box.x < fx + fw && box.x + box.w > fx && box.y < fy + fh && box.y + box.h > fy) return true;
      }
      return false;
    },
    // teleporter under a body's centre -> destination pad (cycle)
    teleport(b) {
      if (Wd.teles.length < 2 || (b.tp || 0) > 0) return false;
      const c = Math.floor(b.x / T), r = Math.floor((b.y - 4 - TOP) / T);
      const i = Wd.teles.findIndex((p) => p.c === c && p.r === r);
      if (i < 0) return false;
      const d = Wd.teles[(i + 1) % Wd.teles.length];
      b.x = d.c * T + T / 2; b.y = TOP + (d.r + 1) * T; b.vy = 0; b.tp = 50;
      return d;
    },
    // a random free standing spot (for teleporting enemies), away from (ax, ay)
    randomSpot(ax, ay, minDist) {
      for (let tries = 0; tries < 60; tries++) {
        const c = LP.randi(3, 28), r = LP.randi(2, 20);
        if (Wd.tile(c, r) !== 0 || Wd.tile(c, r - 1) !== 0 || !Wd.standable(Wd.tile(c, r + 1))) continue;
        const x = c * T + T / 2, y = TOP + (r + 1) * T;
        if (Wd.tile(c, r + 1) === TILE.LAVA || Wd.tile(c, r + 1) === TILE.SPIKE) continue;
        if (ax !== undefined && Math.hypot(x - ax, y - ay) < (minDist || 50)) continue;
        return { x, y };
      }
      return { x: 128, y: TOP + 9 * T };
    },
    springAt(c, r) { Wd.springs[c + ',' + r] = 10; },
    // nearest safe place to stand (never lava / spikes), searching outward from column c0, lowest first
    safeSpot(c0) {
      const safe = (c, r) => Wd.tile(c, r) === 0 && Wd.tile(c, r - 1) === 0 && Wd.standable(Wd.tile(c, r + 1)) && Wd.tile(c, r + 1) !== TILE.LAVA && Wd.tile(c, r + 1) !== TILE.SPIKE;
      for (let d = 0; d < 28; d++) for (const c of [c0 + d, c0 - d]) {
        if (c < 2 || c > 29) continue;
        for (let r = 20; r >= 1; r--) if (safe(c, r)) return { x: c * T + T / 2, y: TOP + (r + 1) * T, c, r };
      }
      return { x: c0 * T + 4, y: BOT - T, c: c0, r: 20 };
    },

    // ------------------------------------------------------------------ update
    update(dt) {
      Wd.time += dt;
      for (const m of Wd.movers) {
        const ox = m.x, oy = m.y;
        if (m.axis === 'x') {
          m.x += m.dir * m.speed;
          if (m.x <= m.minX) { m.x = m.minX; m.dir = 1; } else if (m.x >= m.maxX) { m.x = m.maxX; m.dir = -1; }
        } else {
          m.y += m.dir * m.speed;
          if (m.y <= m.minY) { m.y = m.minY; m.dir = 1; } else if (m.y >= m.maxY) { m.y = m.maxY; m.dir = -1; }
        }
        m.dx = m.x - ox; m.dy = m.y - oy;
      }
      for (const j of Wd.jets) {
        const p = (Wd.time + j.phase) % 3;           // 3 s cycle: 1.2 s of fire
        const was = j.on;
        j.on = p > 1.8; j.warn = p > 1.2 && p <= 1.8;
        if (j.on && !was && Game.onScreenAudio) LP.Audio.play('jet');
      }
      for (const k in Wd.springs) if (--Wd.springs[k] <= 0) delete Wd.springs[k];
    },

    // ------------------------------------------------------------------ art
    buildArt() {
      const th = Wd.theme;
      Wd.bg = G.canvas(W, H);
      const g = Wd.bg.getContext('2d');
      g.fillStyle = th.bg; g.fillRect(0, 0, W, H);
      Deco.draw(g, Wd.def.theme || WORLDS[LevelInfo.world(Wd.n)].theme, Wd.n);
      // static tiles
      const tiles = {};
      const get = (key, fn) => tiles[key] || (tiles[key] = fn());
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const t = Wd.grid[r * C + c];
        if (!t) continue;
        const x = c * T, y = TOP + r * T;
        const wallish = c < 2 || c > 29 || r === 0 || r === R - 1;
        const above = Wd.tile(c, r - 1), top = !(above === TILE.SOLID || (above === t && t !== TILE.LADDER));
        let img = null;
        if (t === TILE.SOLID) img = wallish ? get('w' + top, () => Tiles.make(th.wallStyle, th.wall, top)) : get('x' + top, () => Tiles.make(th.wallStyle, th.wall, top));
        else if (t === TILE.PLAT) img = get('p' + top, () => Tiles.make(th.style, th.pal, top));
        else if (t === TILE.ICE) img = get('i' + top, () => Tiles.make('ice', THEMES.ice.pal, top));
        else if (t === TILE.SPIKE) { img = get('p1', () => Tiles.make(th.style, th.pal, true)); g.drawImage(get('spk', () => Tiles.spikes()), x, y - 5); }
        else if (t === TILE.JET) img = get('jet', () => Tiles.jet());
        else if (t === TILE.LADDER) img = get('lad', () => Tiles.ladder(th.ladder));
        if (img) g.drawImage(img, x, y);
      }
      // the HUD band
      g.fillStyle = '#000'; g.fillRect(0, 0, W, TOP);
    },

    drawBack() {
      const g = G.g;
      g.drawImage(Wd.bg, 0, 0);
      Deco.animate(g, Wd.def.theme || WORLDS[LevelInfo.world(Wd.n)].theme, Wd.time);
      const t = Wd.time;
      for (const a of Wd.animated) {
        const x = a.c * T, y = TOP + a.r * T;
        if (a.t === TILE.CONVL || a.t === TILE.CONVR) Tiles.drawConveyor(g, x, y, a.t === TILE.CONVL ? -1 : 1, t);
        else if (a.t === TILE.LAVA) Tiles.drawLava(g, x, y, t, a.c);
        else if (a.t === TILE.TELE) Tiles.drawTele(g, x, y, t);
        else if (a.t === TILE.SPRING) Tiles.drawSpring(g, x, y, Wd.springs[a.c + ',' + a.r] || 0);
      }
      for (const m of Wd.movers) Tiles.drawMover(g, m, Wd.theme);
      for (const j of Wd.jets) {
        const x = j.c * T, y = TOP + j.r * T;
        if (j.on) Tiles.drawFlame(g, x, y, t);
        else if (j.warn && ((t * 20) | 0) % 2) { G.px(x + 2, y - 2, '#f8b800'); G.px(x + 5, y - 3, '#f83800'); }
      }
    },
    // drawn after the entities: water tint, darkness
    drawFront(lights) {
      const g = G.g;
      if (Wd.waterY < BOT) {
        const wy = Math.round(Wd.waterY);
        g.fillStyle = 'rgba(0,64,200,0.28)';
        g.fillRect(16, wy, 224, BOT - wy - 8);
        g.fillStyle = Tiles.waterPattern(g);
        g.fillRect(16, wy, 224, BOT - wy - 8);
        for (let x = 16; x < 240; x += 2) {
          const yy = wy + Math.round(Math.sin(x * 0.2 + Wd.time * 4) * 1);
          G.px(x, yy, '#a4e4fc'); G.px(x + 1, yy, '#fcfcfc');
        }
      }
      if (Wd.dark) Tiles.darkness(g, lights, Wd.time);
    }
  };
  return Wd;
})();

/* TILES — 8x8 NES tiles drawn from four-colour palettes [highlight, main, shade, outline]. */
const Tiles = (function () {
  const T = 8;
  let waterPat = null, darkC = null;
  const Ti = {
    make(style, p, top) {
      return G.make(T, T, (g) => {
        const f = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
        switch (style) {
          case 'grass':
            f(0, 0, 8, 8, p[2]);
            f(1, 3, 1, 1, p[3]); f(5, 5, 1, 1, p[3]); f(3, 6, 1, 1, p[3]); f(6, 2, 1, 1, '#fca044');
            if (top) { f(0, 0, 8, 3, p[1]); f(0, 0, 8, 1, p[0]); f(1, 3, 1, 1, p[1]); f(4, 3, 2, 1, p[1]); f(2, 1, 1, 1, p[0]); f(6, 1, 1, 1, p[0]); }
            f(0, 7, 8, 1, p[3]);
            break;
          case 'brick':
            f(0, 0, 8, 8, p[1]);
            f(0, 3, 8, 1, p[2]); f(0, 7, 8, 1, p[2]); f(3, 0, 1, 3, p[2]); f(7, 4, 1, 3, p[2]);
            f(0, 0, 3, 1, p[0]); f(4, 4, 3, 1, p[0]);
            if (top) f(0, 0, 8, 1, p[0]);
            break;
          case 'stone':
            f(0, 0, 8, 8, p[1]);
            f(0, 0, 7, 1, p[0]); f(0, 0, 1, 7, p[0]);
            f(1, 7, 7, 1, p[2]); f(7, 1, 1, 7, p[2]); f(7, 7, 1, 1, p[3]);
            f(3, 3, 1, 1, p[2]); f(5, 4, 1, 1, p[2]);
            break;
          case 'metal':
            f(0, 0, 8, 8, p[1]); f(0, 0, 8, 1, p[0]); f(0, 7, 8, 1, p[3]); f(7, 0, 1, 8, p[3]); f(0, 0, 1, 7, p[0]);
            f(2, 2, 1, 1, p[2]); f(5, 2, 1, 1, p[2]); f(2, 5, 1, 1, p[2]); f(5, 5, 1, 1, p[2]);
            f(3, 3, 2, 2, p[2]);
            break;
          case 'candy':
            f(1, 0, 6, 8, p[1]); f(0, 1, 8, 6, p[1]);
            f(1, 1, 3, 1, p[0]); f(1, 2, 1, 2, p[0]);
            f(1, 7, 6, 1, p[2]); f(7, 1, 1, 6, p[2]); f(6, 6, 1, 1, p[2]);
            f(3, 3, 2, 2, p[3]);
            break;
          case 'ice':
            f(0, 0, 8, 8, p[1]); f(0, 0, 8, 1, p[0]); f(1, 2, 2, 1, p[0]); f(2, 3, 2, 1, p[0]); f(5, 5, 1, 1, p[0]);
            f(0, 7, 8, 1, p[2]); f(7, 0, 1, 8, p[2]); f(4, 1, 1, 1, '#fcfcfc');
            break;
          case 'rock':
            f(0, 0, 8, 8, p[1]); f(0, 0, 8, 1, top ? p[0] : p[1]);
            f(1, 2, 2, 1, p[2]); f(2, 3, 1, 2, p[2]); f(5, 1, 1, 3, p[2]); f(4, 5, 3, 1, p[2]); f(6, 6, 1, 1, p[3]);
            f(0, 7, 8, 1, p[3]); f(3, 1, 1, 1, p[0]);
            break;
          case 'neon':
            f(0, 0, 8, 8, p[3]); f(0, 0, 8, 1, p[0]); f(0, 7, 8, 1, p[1]); f(0, 0, 1, 8, p[0]); f(7, 0, 1, 8, p[1]);
            f(2, 2, 4, 4, p[2]); f(3, 3, 2, 2, p[1]);
            break;
          case 'girder':
            f(0, 0, 8, 8, p[1]); f(0, 0, 8, 1, p[0]); f(0, 7, 8, 1, p[3]);
            f(0, 2, 8, 1, p[2]); f(0, 5, 8, 1, p[2]);
            f(1, 3, 2, 2, p[3]); f(5, 3, 2, 2, p[3]);
            break;
          case 'gold':
            f(0, 0, 8, 8, p[1]); f(0, 0, 8, 1, p[0]); f(0, 0, 1, 8, p[0]); f(1, 7, 7, 1, p[2]); f(7, 1, 1, 7, p[2]);
            f(3, 3, 2, 2, '#f83800'); f(3, 3, 1, 1, '#fcfcfc');
            if (top) { f(0, 0, 8, 2, '#a81000'); f(0, 0, 8, 1, '#f83800'); }
            break;
          default: f(0, 0, 8, 8, p[1]);
        }
      });
    },
    spikes() {
      return G.make(8, 6, (g) => {
        for (let i = 0; i < 2; i++) {
          const x = i * 4;
          g.fillStyle = '#fcfcfc'; g.fillRect(x + 1, 0, 1, 1); g.fillRect(x + 1, 1, 2, 1);
          g.fillStyle = '#bcbcbc'; g.fillRect(x, 2, 3, 1); g.fillRect(x, 3, 4, 1);
          g.fillStyle = '#7c7c7c'; g.fillRect(x, 4, 4, 1);
        }
        g.fillStyle = '#404040'; g.fillRect(0, 5, 8, 1);
      });
    },
    jet() {
      return G.make(8, 8, (g) => {
        g.fillStyle = '#404040'; g.fillRect(0, 0, 8, 8);
        g.fillStyle = '#7c7c7c'; g.fillRect(0, 0, 8, 2); g.fillRect(0, 0, 1, 8);
        g.fillStyle = '#000'; g.fillRect(2, 0, 4, 2);
        g.fillStyle = '#a81000'; g.fillRect(2, 3, 4, 1); g.fillRect(2, 5, 4, 1);
      });
    },
    ladder(col) {
      return G.make(8, 8, (g) => {
        g.fillStyle = '#000'; g.fillRect(1, 0, 1, 8); g.fillRect(6, 0, 1, 8);
        g.fillStyle = col; g.fillRect(0, 0, 1, 8); g.fillRect(5, 0, 1, 8);
        g.fillRect(1, 1, 4, 1); g.fillRect(1, 5, 4, 1);
      });
    },
    drawConveyor(g, x, y, dir, t) {
      g.fillStyle = '#404040'; g.fillRect(x, y, 8, 8);
      g.fillStyle = '#7c7c7c'; g.fillRect(x, y, 8, 1); g.fillRect(x, y + 7, 8, 1);
      const off = Math.floor(t * 12 * dir) & 3;
      g.fillStyle = '#f8b800';
      for (let i = -1; i < 3; i++) {
        const cx = x + ((i * 4 + off) & 7);
        if (dir > 0) { g.fillRect(cx, y + 2, 1, 1); g.fillRect(cx + 1, y + 3, 1, 2); g.fillRect(cx, y + 5, 1, 1); }
        else { g.fillRect(cx + 1, y + 2, 1, 1); g.fillRect(cx, y + 3, 1, 2); g.fillRect(cx + 1, y + 5, 1, 1); }
      }
    },
    drawLava(g, x, y, t, c) {
      g.fillStyle = '#f83800'; g.fillRect(x, y, 8, 8);
      g.fillStyle = '#a81000'; g.fillRect(x, y + 5, 8, 3);
      const w = Math.floor(t * 6 + c * 3) % 8;
      g.fillStyle = '#f8b800'; g.fillRect(x + w, y + 1, 2, 1); g.fillRect(x + ((w + 4) & 7), y + 3, 2, 1);
      g.fillStyle = '#fca044'; g.fillRect(x, y, 8, 1);
      if (Math.sin(t * 5 + c) > 0.6) { g.fillStyle = '#fcfcfc'; g.fillRect(x + ((w + 2) & 7), y, 1, 1); }
    },
    drawTele(g, x, y, t) {
      const k = Math.floor(t * 10) % 4, cols = ['#d800cc', '#00e8d8', '#fcfcfc', '#6844fc'];
      g.fillStyle = cols[k]; g.fillRect(x, y + 6, 8, 2);
      g.fillStyle = cols[(k + 1) % 4]; g.fillRect(x + 1, y + 2, 1, 4); g.fillRect(x + 6, y + 2, 1, 4);
      g.fillStyle = cols[(k + 2) % 4]; g.fillRect(x + 3, y + ((k * 2) % 6), 2, 1);
    },
    drawSpring(g, x, y, t) {
      const up = t > 0 ? 3 : 0;
      g.fillStyle = '#404040'; g.fillRect(x, y + 6, 8, 2);
      g.fillStyle = '#bcbcbc';
      for (let i = 0; i < 2 + (up ? 1 : 0); i++) g.fillRect(x + 2 + (i & 1), y + 5 - i * 2, 4, 1);
      g.fillStyle = '#f83800'; g.fillRect(x, y + 1 - up, 8, 2);
      g.fillStyle = '#fca044'; g.fillRect(x + 1, y + 1 - up, 6, 1);
    },
    drawMover(g, m, th) {
      for (let x = 0; x < m.w; x += 8) {
        g.fillStyle = '#7c7c7c'; g.fillRect(Math.round(m.x + x), Math.round(m.y), 8, 6);
        g.fillStyle = '#fcfcfc'; g.fillRect(Math.round(m.x + x), Math.round(m.y), 8, 1);
        g.fillStyle = '#404040'; g.fillRect(Math.round(m.x + x), Math.round(m.y) + 5, 8, 1);
        g.fillStyle = th.pal[1]; g.fillRect(Math.round(m.x + x) + 2, Math.round(m.y) + 2, 4, 2);
      }
      g.fillStyle = '#000'; g.fillRect(Math.round(m.x), Math.round(m.y) + 6, m.w, 1);
    },
    drawFlame(g, x, y, t) {
      const f = Math.floor(t * 20) % 2;
      const h = 24 + f * 2;
      g.fillStyle = '#f83800'; g.fillRect(x + 1, y - h, 6, h);
      g.fillStyle = '#f8b800'; g.fillRect(x + 2, y - h + 4, 4, h - 4);
      g.fillStyle = '#fcfcfc'; g.fillRect(x + 3, y - h + 10, 2, h - 12);
      g.fillStyle = '#f83800'; g.fillRect(x + 2 + f, y - h - 3, 2, 3);
    },
    waterPattern(g) {
      if (!waterPat) {
        const c = G.canvas(4, 4), q = c.getContext('2d');
        q.fillStyle = '#3cbcfc'; q.fillRect(0, 0, 1, 1);
        q.fillStyle = '#0058f8'; q.fillRect(2, 2, 1, 1);
        waterPat = g.createPattern(c, 'repeat');
      }
      return waterPat;
    },
    // darkness with pixel-circle lights (players always lit, trapped bubbles glow a little)
    darkness(g, lights, t) {
      if (!darkC) darkC = G.canvas(256, 192);
      const d = darkC.getContext('2d');
      const flash = (t % 7) < 0.18 || ((t % 7) > 0.3 && (t % 7) < 0.4);
      if (flash) return;
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, 256, 192);
      d.fillStyle = 'rgba(0,0,0,0.9)'; d.fillRect(0, 16, 256, 176);
      d.globalCompositeOperation = 'destination-out';
      for (const l of lights) G.ellipse(l.x, l.y, l.r, l.r, '#000', d);
      d.globalCompositeOperation = 'source-over';
      // dithered rims
      d.fillStyle = 'rgba(0,0,0,0.9)';
      for (const l of lights) {
        const r = l.r;
        for (let a = 0; a < 64; a++) {
          const an = a / 64 * Math.PI * 2, x = Math.round(l.x + Math.cos(an) * (r - 2)), y = Math.round(l.y + Math.sin(an) * (r - 2));
          if ((x + y) & 1) d.fillRect(x, y, 1, 1);
        }
      }
      g.drawImage(darkC, 0, 0);
    }
  };
  return Ti;
})();

/* DECO — theme backdrops: drawn once per level into the background canvas (pixel art),
   plus a few cheap animated touches (stars, snow, embers, waterfalls). */
const Deco = (function () {
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const fill = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function cloud(g, x, y, s, c, sh) {
    G.ellipse(x, y, 6 * s, 4 * s, sh, g); G.ellipse(x + 8 * s, y - 2 * s, 7 * s, 5 * s, sh, g); G.ellipse(x + 16 * s, y, 6 * s, 4 * s, sh, g);
    G.ellipse(x, y - 1, 6 * s, 4 * s, c, g); G.ellipse(x + 8 * s, y - 3 * s, 7 * s, 5 * s, c, g); G.ellipse(x + 16 * s, y - 1, 6 * s, 4 * s, c, g);
  }
  function hills(g, base, c1, c2, amp, freq, ph) {
    for (let x = 16; x < 240; x++) {
      const h = Math.round(amp * (0.6 + 0.4 * Math.sin(x * freq + ph)) + amp * 0.3 * Math.sin(x * freq * 2.7 + ph * 2));
      fill(g, c1, x, base - h, 1, h + 200); if (x % 2 === 0) fill(g, c2, x, base - h, 1, 1);
    }
  }
  const D = {
    draw(g, theme, n) {
      seed = 1234 + n * 97;
      const BOT = 184;
      switch (theme) {
        case 'meadow':
          fill(g, '#a4e4fc', 16, 16, 224, 40);
          for (let i = 0; i < 4; i++) cloud(g, 30 + rnd() * 180, 40 + rnd() * 60, 1, '#fcfcfc', '#a4e4fc');
          hills(g, 172, '#00a800', '#b8f818', 22, 0.05, n);
          hills(g, 184, '#005800', '#00a800', 12, 0.08, n * 2);
          break;
        case 'castle':
          for (let i = 0; i < 40; i++) fill(g, rnd() < 0.3 ? '#fcfcfc' : '#a4e4fc', 16 + rnd() * 224, 18 + rnd() * 90, 1, 1);
          for (let i = 0; i < 3; i++) {
            const x = 30 + i * 75 + rnd() * 20, w = 26 + rnd() * 14, h = 40 + rnd() * 30;
            fill(g, '#4848b0', x, BOT - h, w, h);
            for (let k = 0; k < w; k += 6) fill(g, '#4848b0', x + k, BOT - h - 4, 3, 4);
            fill(g, '#202060', x + w / 2 - 2, BOT - h + 10, 4, 6);
            fill(g, '#4848b0', x + w / 2 - 1, BOT - h - 16, 2, 12); fill(g, '#f83800', x + w / 2 + 1, BOT - h - 16, 5, 3);
          }
          for (let i = 0; i < 4; i++) cloud(g, 20 + rnd() * 200, 150 + rnd() * 30, 1.2, '#fcfcfc', '#bcbcbc');
          break;
        case 'junk':
          fill(g, '#f8b800', 16, 16, 224, 30); fill(g, '#fca044', 16, 46, 224, 30); fill(g, '#f83800', 16, 120, 224, 70);
          G.ellipse(190, 70, 16, 16, '#f8d878', g);
          for (let i = 0; i < 10; i++) { const x = 16 + rnd() * 224, w = 10 + rnd() * 26, h = 8 + rnd() * 30; fill(g, '#a81000', x, BOT - h, w, h); fill(g, '#503000', x + 2, BOT - h + 3, w - 4, 2); }
          for (let i = 0; i < 6; i++) { const x = 20 + rnd() * 210; G.ring(x, BOT - 8, 6, '#202020', g); G.ring(x, BOT - 8, 5, '#202020', g); }
          break;
        case 'toys':
          for (let y = 16; y < 192; y += 16) for (let x = 16; x < 240; x += 16) if (((x + y) >> 4) & 1) fill(g, '#fcd8fc', x, y, 16, 16);
          for (let i = 0; i < 14; i++) G.ellipse(20 + rnd() * 216, 20 + rnd() * 160, 2, 2, ['#f8b800', '#3cbcfc', '#58f898', '#f83800'][i % 4], g);
          break;
        case 'haunt':
          G.ellipse(196, 50, 18, 18, '#f8d878', g); G.ellipse(203, 45, 16, 16, '#200838', g);
          for (let i = 0; i < 30; i++) fill(g, '#9878f8', 16 + rnd() * 224, 18 + rnd() * 100, 1, 1);
          for (let i = 0; i < 4; i++) {
            const x = 24 + i * 60 + rnd() * 20;
            fill(g, '#100418', x, 110, 3, 74);
            for (let k = 0; k < 5; k++) { const yy = 112 + k * 10; G.line(x + 1, yy, x + 1 + (k % 2 ? 12 : -12), yy - 8, '#100418', g); }
          }
          for (let i = 0; i < 6; i++) { const x = 20 + rnd() * 210; fill(g, '#404040', x, 172, 8, 12); fill(g, '#404040', x + 1, 170, 6, 2); fill(g, '#202020', x + 3, 174, 2, 6); fill(g, '#202020', x + 2, 176, 4, 1); }
          break;
        case 'ice':
          fill(g, '#fcfcfc', 16, 150, 224, 40);
          hills(g, 172, '#fcfcfc', '#a4e4fc', 28, 0.04, n);
          for (let i = 0; i < 2; i++) { const x = 40 + i * 150; fill(g, '#3cbcfc', x, 16, 10, 168); fill(g, '#a4e4fc', x + 2, 16, 2, 168); }
          break;
        case 'lava':
          fill(g, '#400800', 16, 120, 224, 70); fill(g, '#a81000', 16, 160, 224, 30);
          for (let i = 0; i < 5; i++) { const x = 16 + rnd() * 200, h = 30 + rnd() * 50; for (let k = 0; k < h; k++) fill(g, '#300400', x + k * 0.3, BOT - k, 30 - k * 0.6, 1); }
          break;
        case 'neon':
          for (let i = 0; i < 40; i++) fill(g, rnd() < 0.5 ? '#d800cc' : '#00e8d8', 16 + rnd() * 224, 18 + rnd() * 80, 1, 1);
          G.ellipse(128, 100, 26, 26, '#d800cc', g); for (let y = 92; y < 128; y += 4) fill(g, '#000', 100, y, 56, 2);
          for (let y = 128; y < 184; y += 6 + (y - 128) / 6) fill(g, '#6844fc', 16, Math.round(y), 224, 1);
          for (let i = -8; i <= 8; i++) G.line(128 + i * 8, 128, 128 + i * 30, 184, '#6844fc', g);
          fill(g, '#000', 0, 0, 16, 192); fill(g, '#000', 240, 0, 16, 192);
          break;
        case 'sky':
          fill(g, '#fca044', 16, 60, 224, 40); fill(g, '#f83800', 16, 100, 224, 40); fill(g, '#a81000', 16, 140, 224, 50);
          G.ellipse(128, 128, 30, 30, '#f8d878', g); fill(g, '#a81000', 98, 140, 60, 20);
          for (let i = 0; i < 14; i++) { const x = 16 + i * 16 + rnd() * 6, h = 14 + rnd() * 40; fill(g, '#503000', x, BOT - h, 12, h); for (let k = 3; k < h - 2; k += 5) fill(g, '#f8b800', x + 3, BOT - h + k, 2, 2); }
          for (let i = 0; i < 3; i++) cloud(g, 20 + rnd() * 200, 30 + rnd() * 30, 1, '#fcd8a8', '#fca044');
          break;
        case 'throne':
          for (let x = 16; x < 240; x += 24) { fill(g, '#2c0c4c', x, 16, 12, 168); fill(g, '#5c2c8c', x + 2, 16, 2, 168); }
          fill(g, '#a81000', 16, 16, 224, 8); for (let x = 16; x < 240; x += 8) G.ellipse(x + 4, 24, 4, 3, '#a81000', g);
          for (let i = 0; i < 4; i++) { const x = 34 + i * 56; fill(g, '#f8b800', x, 34, 14, 22); fill(g, '#a81000', x + 2, 36, 10, 18); G.ellipse(x + 7, 44, 3, 3, '#f8b800', g); }
          break;
      }
    },
    animate(g, theme, t) {
      if (theme === 'ice') {
        for (let i = 0; i < 24; i++) {
          const x = 16 + ((i * 53 + Math.floor(t * (8 + (i % 3) * 4))) % 224), y = 16 + ((i * 37 + Math.floor(t * (14 + (i % 4) * 5))) % 168);
          g.fillStyle = '#fcfcfc'; g.fillRect(x, y, 1, 1);
        }
        for (let i = 0; i < 2; i++) { const x = 40 + i * 150; for (let y = 16 + (Math.floor(t * 40) % 6); y < 184; y += 6) { g.fillStyle = '#fcfcfc'; g.fillRect(x + 6, y, 1, 2); } }
      } else if (theme === 'lava') {
        for (let i = 0; i < 16; i++) {
          const x = 16 + ((i * 61) % 224) + Math.round(Math.sin(t * 2 + i) * 2), y = 184 - ((i * 29 + Math.floor(t * (16 + (i % 5) * 4))) % 168);
          g.fillStyle = i % 2 ? '#f8b800' : '#f83800'; g.fillRect(x, y, 1, 1);
        }
      } else if (theme === 'castle' || theme === 'haunt' || theme === 'neon') {
        for (let i = 0; i < 6; i++) {
          if (Math.sin(t * 3 + i * 7) > 0.7) { const x = 20 + ((i * 97) % 210), y = 22 + ((i * 41) % 80); g.fillStyle = '#fcfcfc'; g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
        }
      } else if (theme === 'meadow' || theme === 'sky') {
        // a slow pixel cloud drifting across
        const x = Math.round(((t * 6) % 230) + 4);
        g.fillStyle = theme === 'meadow' ? '#fcfcfc' : '#fcd8a8';
        if (x > 16 && x < 226) { g.fillRect(x, 30, 14, 3); g.fillRect(x + 3, 28, 7, 2); }
      }
    }
  };
  return D;
})();
