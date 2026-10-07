/* ART: SCENERY — roadside sprites, drawn in code. Each entry is
     { img, sc, hit, wide }  img: canvas (ground = bottom row), sc: native px -> player-depth px,
                             hit: collision half-width in road units (0 = scenery you can drive through)
   World width of a sprite in road half-widths = img.width * sc / Art.PX.
   Scenery.get(name, tint) returns the (memoised) night / sunset tinted version for a theme. */
'use strict';
const Scenery = (function () {
  const { poly, ellipse, rect, stroke, px, rng, shade, mix, make, curve, tiny, tinyW } = Px;
  const S = {};
  // size: target height in road half-widths (u); the native canvas is scaled to it
  function add(name, img, heightU, hit, extra) { S[name] = Object.assign({ name, img, sc: heightU * 400 / img.height, hit: hit || 0 }, extra); }

  // ---------------------------------------------------------------- palms
  function palm(seed, lean, o) {
    o = o || {};
    const r = rng(seed), W = 120, H = 210;
    const trunkA = o.trunk || '#8a6a44', trunkB = o.trunkD || '#664a2c', leaf = o.leaf || '#1f8a3e', leafL = o.leafL || '#46c24e', leafD = o.leafD || '#0e5a2a';
    return make(W, H, (g) => {
      const bx = W / 2, cx = W / 2 + lean * 26, cy = 46;
      const pts = curve(bx, H, bx + lean * 4, H * 0.45, cx, cy, 40);
      pts.forEach((p, i) => {
        const t = i / pts.length, w = 5.5 - t * 2.2;
        rect(g, p[0] - w, p[1] - 3, w * 2, 6, i % 3 === 0 ? trunkB : trunkA);
        rect(g, p[0] + w * 0.3, p[1] - 3, w * 0.6, 6, shade(trunkA, 0.25));
      });
      const fronds = 9;
      for (let k = 0; k < fronds; k++) {
        const a = -Math.PI + (k / (fronds - 1)) * Math.PI + (r() - 0.5) * 0.3;
        const len = 42 + r() * 16, ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.35 + 22 + r() * 10;
        const mx = cx + Math.cos(a) * len * 0.55, my = cy - 16 - r() * 8;
        const fp = curve(cx, cy, mx, my, ex, ey, 24);
        fp.forEach((p, i) => {             // leaflets hanging off each frond
          if (i < 3 || i % 2) return;
          const dl = 7 - i * 0.18;
          stroke(g, [[p[0], p[1]], [p[0] + Math.cos(a) * 2, p[1] + dl]], 0.7, leafD);
          stroke(g, [[p[0], p[1]], [p[0] - Math.cos(a) * 1, p[1] + dl * 0.8]], 0.7, leaf);
        });
        stroke(g, fp, [2.6, 0.8], leaf);
        stroke(g, fp.slice(0, 18).map((p) => [p[0], p[1] - 1]), [1.2, 0.5], leafL);
      }
      ellipse(g, cx - 3, cy + 4, 3, 3, '#5a3a1a'); ellipse(g, cx + 3, cy + 5, 3, 3, '#6a4a22'); ellipse(g, cx, cy + 7, 3, 3, '#4a2e12');
    });
  }
  for (let i = 0; i < 3; i++) add('palm' + i, palm(11 + i * 7, [0.15, 0.55, -0.4][i]), 2.3, 0.07);
  add('palmTall', palm(91, 0.25), 3.0, 0.07);
  // dark silhouette palms with neon edges for the night city / sunset strip
  function neonPalm(color) {
    const base = palm(53, 0.3, { trunk: '#1a1030', trunkD: '#120a24', leaf: '#1a1030', leafL: '#2a1a48', leafD: '#120a24' });
    return make(base.width, base.height, (g) => {
      const glow = Px.outline(base, color);
      g.drawImage(glow, -1, -1);
    });
  }
  add('palmNeonPink', neonPalm('#ff4fd0'), 2.4, 0.07);
  add('palmNeonCyan', neonPalm('#3cf0ff'), 2.4, 0.07);

  // ---------------------------------------------------------------- plants & rocks
  function bush(seed, cols, w, h) {
    const r = rng(seed);
    return make(w, h, (g) => {
      for (let i = 0; i < 9; i++) {
        const x = w * 0.2 + r() * w * 0.6, y = h * 0.45 + r() * h * 0.3, rr = w * (0.16 + r() * 0.12);
        ellipse(g, x, y, rr, rr * 0.85, cols[0]);
      }
      for (let i = 0; i < 7; i++) { const x = w * 0.25 + r() * w * 0.5, y = h * 0.35 + r() * h * 0.3; ellipse(g, x, y, w * 0.12, w * 0.1, cols[1]); }
      for (let i = 0; i < 14; i++) px(g, w * 0.2 + r() * w * 0.6, h * 0.3 + r() * h * 0.4, cols[2]);
      if (cols[3]) for (let i = 0; i < 8; i++) { const x = w * 0.2 + r() * w * 0.6, y = h * 0.3 + r() * h * 0.45; rect(g, x, y, 2, 2, cols[3]); }
      rect(g, w * 0.2, h - 3, w * 0.6, 3, cols[0]);
    });
  }
  add('bush', bush(5, ['#1e7a32', '#38a83e', '#7ad85a'], 64, 44), 0.5, 0);
  add('flowerBush', bush(6, ['#1e7a32', '#2c9a3e', '#7ad85a', '#ff5ca8'], 64, 44), 0.5, 0);
  add('hibiscus', bush(9, ['#16682c', '#2a8c3a', '#ffd23c', '#ff3c5c'], 64, 48), 0.6, 0);
  add('desertBush', bush(7, ['#7a8a3a', '#9aa84a', '#c8c878'], 56, 34), 0.35, 0);
  add('fern', bush(8, ['#145a26', '#22803a', '#4ab84a'], 64, 40), 0.45, 0);

  function rock(seed, cols, w, h) {
    const r = rng(seed);
    return make(w, h, (g) => {
      const pts = [];
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([w / 2 + Math.cos(a) * w * (0.38 + r() * 0.1), h - 2 + Math.sin(a) * h * (0.75 + r() * 0.2)]); }
      poly(g, pts, cols[0]);
      poly(g, pts.slice(0, 5).concat([[w * 0.5, h - 2]]), cols[1]);
      for (let i = 0; i < 12; i++) px(g, w * 0.2 + r() * w * 0.6, h * 0.3 + r() * h * 0.6, cols[2]);
      rect(g, w * 0.1, h - 2, w * 0.8, 2, cols[2]);
    });
  }
  add('rock', rock(3, ['#8a8a96', '#b4b4c0', '#5a5a66'], 70, 50), 0.6, 0.22);
  add('redRock', rock(4, ['#b4542c', '#e07a3c', '#7a3218'], 80, 60), 0.8, 0.25);
  add('lavaRock', rock(5, ['#2a2228', '#4a3c44', '#ff5a1c'], 70, 48), 0.6, 0.22);
  add('snowRock', rock(6, ['#8a96aa', '#f0f4ff', '#5a6478'], 70, 50), 0.6, 0.22);

  function cactus(seed) {
    const r = rng(seed);
    return make(60, 120, (g) => {
      const C = '#3a8a3a', CL = '#6ac24e', CD = '#1e5a26';
      const col = (x, y0, y1, w) => { rect(g, x - w, y0 + w, w * 2, y1 - y0 - w, C); ellipse(g, x, y0 + w, w, w, C); rect(g, x - w + 2, y0 + w, 2, y1 - y0 - w, CL); rect(g, x + w - 3, y0 + w, 2, y1 - y0 - w, CD); };
      col(30, 4, 120, 7);
      const ay = 40 + r() * 20, by = 30 + r() * 25;
      rect(g, 10, ay + 14, 20, 8, C); col(12, ay - 14, ay + 22, 5);
      rect(g, 30, by + 12, 18, 8, C); col(46, by - 18, by + 20, 5);
      for (let i = 0; i < 18; i++) px(g, 16 + r() * 30, 10 + r() * 100, '#e8e8b0');
    });
  }
  add('cactus', cactus(1), 1.3, 0.08);
  add('cactus2', cactus(2), 1.0, 0.08);

  function pine(seed, snow, dark) {
    const r = rng(seed), W = 80, H = 170;
    const A = dark ? '#123a30' : '#1a6a3a', B = dark ? '#0a2a22' : '#0e4a28', L = dark ? '#1e5242' : '#2e8a4a';
    return make(W, H, (g) => {
      rect(g, W / 2 - 4, H - 24, 8, 24, '#5a3a22'); rect(g, W / 2, H - 24, 3, 24, '#7a5232');
      for (let k = 0; k < 6; k++) {
        const top = 6 + k * 22, w = 12 + k * 6.5;
        poly(g, [[W / 2, top], [W / 2 + w, top + 34], [W / 2 - w, top + 34]], B);
        poly(g, [[W / 2, top + 1], [W / 2 + w * 0.15, top + 32], [W / 2 - w + 3, top + 32]], A);
        poly(g, [[W / 2 - 2, top + 4], [W / 2 - 1, top + 26], [W / 2 - w * 0.6, top + 26]], L);
        if (snow) { poly(g, [[W / 2, top], [W / 2 + w * 0.55, top + 18], [W / 2 - w * 0.55, top + 18]], '#f0f6ff'); rect(g, W / 2 - w + 4, top + 31, w * 2 - 8, 2, '#e0eaff'); }
      }
      for (let i = 0; i < 10; i++) px(g, W / 2 - 20 + r() * 40, 30 + r() * 120, snow ? '#ffffff' : '#3a9a5a');
    });
  }
  add('pine', pine(1), 2.4, 0.08);
  add('pine2', pine(2), 1.8, 0.08);
  add('snowPine', pine(3, true), 2.2, 0.08);
  add('darkPine', pine(4, true, true), 2.3, 0.08);

  add('redwood', make(60, 260, (g) => {
    const r = rng(9);
    rect(g, 18, 0, 26, 260, '#8a3a22'); rect(g, 22, 0, 8, 260, '#b4542c'); rect(g, 38, 0, 6, 260, '#5a2414');
    for (let i = 0; i < 30; i++) rect(g, 20 + r() * 22, r() * 250, 1, 6 + r() * 8, '#5a2414');
    for (let i = 0; i < 6; i++) { const y = 10 + i * 22; ellipse(g, 30 + (i % 2 ? 18 : -18), y, 16, 8, '#1a5a2a'); ellipse(g, 30 + (i % 2 ? 16 : -16), y - 2, 10, 4, '#2e8a3a'); }
    rect(g, 10, 254, 42, 6, '#6a2a18');
  }), 4.2, 0.1);
  add('log', make(90, 30, (g) => {
    rect(g, 6, 8, 78, 20, '#7a4a28'); rect(g, 6, 8, 78, 4, '#a06a3a');
    ellipse(g, 84, 18, 6, 10, '#c89a5a'); ellipse(g, 84, 18, 3, 5, '#8a5a30');
    ellipse(g, 30, 7, 6, 3, '#2e8a3a');
  }), 0.3, 0.2);

  // ---------------------------------------------------------------- beach
  function umbrella(a, b) {
    return make(90, 100, (g) => {
      rect(g, 44, 26, 3, 74, '#e8e0d0'); rect(g, 46, 26, 1, 74, '#a89880');
      for (let i = 0; i < 8; i++) {
        const x0 = 4 + i * 10.25;
        poly(g, [[45, 6], [x0, 34 - Math.sin((i / 8) * Math.PI) * 2], [x0 + 10.25, 34 - Math.sin(((i + 1) / 8) * Math.PI) * 2]], i % 2 ? a : b);
      }
      for (let i = 0; i < 8; i++) ellipse(g, 9 + i * 10.25, 34, 5, 2, i % 2 ? a : b);
      rect(g, 43, 3, 5, 4, '#f8f0e0');
      rect(g, 18, 92, 56, 4, '#ff5ca8'); rect(g, 18, 92, 56, 1, '#ffd0e8');   // beach towel
    });
  }
  add('umbrella', umbrella('#ff3c5c', '#fff4e0'), 1.0, 0.04);
  add('umbrella2', umbrella('#3cb4ff', '#ffe14a'), 1.0, 0.04);
  add('umbrella3', umbrella('#3ce0a0', '#ff7a2c'), 1.0, 0.04);
  add('lifeguard', make(90, 140, (g) => {
    for (const [x0, x1] of [[16, 26], [74, 64]]) stroke(g, [[x0, 140], [x1, 64]], 2, '#e8e0d0');
    stroke(g, [[20, 110], [70, 110]], 1, '#c8c0b0'); stroke(g, [[24, 86], [66, 86]], 1, '#c8c0b0');
    rect(g, 14, 40, 62, 28, '#ff3c3c'); rect(g, 14, 40, 62, 4, '#ffffff'); rect(g, 22, 48, 46, 12, '#2a3a5a');
    poly(g, [[8, 42], [45, 22], [82, 42]], '#f8f4e8'); poly(g, [[8, 42], [45, 22], [45, 42]], '#e0d8c8');
    rect(g, 44, 2, 2, 22, '#c8c0b0'); poly(g, [[46, 2], [62, 6], [46, 10]], '#ffd23c');
    tiny(g, 'SURF', 45 - tinyW('SURF') / 2, 62, '#ffffff');
  }), 1.6, 0.25);
  add('surfRack', make(80, 90, (g) => {
    const cols = [['#ff5ca8', '#ffe14a'], ['#3cb4ff', '#ffffff'], ['#ffd23c', '#ff7a2c'], ['#3ce0c8', '#ff3c5c']];
    cols.forEach((c, i) => { const x = 12 + i * 18; ellipse(g, x, 46, 7, 42, c[0]); rect(g, x - 1, 8, 2, 76, c[1]); });
    rect(g, 2, 66, 76, 4, '#8a5a30'); rect(g, 4, 66, 3, 24, '#6a4220'); rect(g, 72, 66, 3, 24, '#6a4220');
  }), 0.9, 0.2);
  add('beachHut', make(140, 110, (g) => {
    rect(g, 14, 44, 112, 60, '#4ab4d8'); for (let x = 14; x < 126; x += 8) rect(g, x, 44, 1, 60, '#2a8ab0');
    poly(g, [[4, 48], [70, 14], [136, 48]], '#e8c060'); for (let i = 0; i < 12; i++) stroke(g, [[10 + i * 11, 46], [70, 16]], 0.5, '#c89a3a');
    rect(g, 26, 58, 34, 24, '#2a3a5a'); rect(g, 26, 56, 34, 4, '#ff5ca8');
    rect(g, 80, 60, 26, 44, '#8a5a30'); rect(g, 30, 30, 0, 0, '#000');
    rect(g, 34, 22, 72, 16, '#ff3c5c'); tiny(g, 'TACOS', 70 - tinyW('TACOS', 2) / 2, 25, '#ffffff', 2);
    rect(g, 10, 100, 120, 6, '#d8b878');
  }), 1.5, 0.45);
  add('flamingo', make(40, 80, (g) => {
    stroke(g, [[18, 80], [18, 50]], 0.6, '#e85a8a'); stroke(g, [[22, 80], [22, 52], [26, 60]], 0.6, '#e85a8a');
    ellipse(g, 20, 44, 12, 8, '#ff7ab4'); ellipse(g, 16, 42, 7, 4, '#ffa8d0');
    stroke(g, [[26, 40], [30, 26], [24, 14], [28, 6]], 1.6, '#ff7ab4');
    ellipse(g, 29, 6, 3.5, 3, '#ff7ab4'); rect(g, 31, 5, 5, 2, '#1a1a1a'); rect(g, 31, 6, 3, 1, '#f8f0e0');
  }), 0.55, 0);
  add('sailboat', make(80, 90, (g) => {
    poly(g, [[38, 4], [38, 66], [8, 66]], '#f8f8f8'); poly(g, [[38, 4], [38, 66], [30, 66]], '#d8dce8');
    poly(g, [[42, 12], [42, 66], [68, 66]], '#ff5c5c'); rect(g, 38, 2, 2, 70, '#5a4a3a');
    poly(g, [[4, 70], [76, 70], [66, 84], [14, 84]], '#f4f4f4'); rect(g, 10, 78, 62, 3, '#3c8ad8');
  }), 1.1, 0);
  add('buoy', make(30, 40, (g) => { poly(g, [[15, 2], [24, 30], [6, 30]], '#ff5a2c'); rect(g, 8, 18, 14, 4, '#ffffff'); rect(g, 4, 30, 22, 6, '#c83a1c'); }), 0.35, 0);

  // ---------------------------------------------------------------- tropics
  add('tikiTorch', make(24, 100, (g) => {
    rect(g, 10, 30, 4, 70, '#8a5a30'); for (let y = 34; y < 100; y += 6) rect(g, 10, y, 4, 1, '#5a3a1a');
    rect(g, 7, 24, 10, 8, '#6a4422');
    ellipse(g, 12, 15, 6, 10, '#ff5a1c'); ellipse(g, 12, 17, 4, 7, '#ffb43c'); ellipse(g, 12, 19, 2, 4, '#fff4c0');
  }), 0.75, 0.04);
  add('tiki', make(50, 110, (g) => {
    rect(g, 8, 6, 34, 104, '#8a5a30'); rect(g, 8, 6, 6, 104, '#a87444'); rect(g, 36, 6, 6, 104, '#5a3a1a');
    rect(g, 4, 2, 42, 8, '#6a4422');
    rect(g, 14, 22, 8, 10, '#2a1a10'); rect(g, 28, 22, 8, 10, '#2a1a10'); rect(g, 16, 24, 3, 3, '#ffd23c'); rect(g, 30, 24, 3, 3, '#ffd23c');
    rect(g, 22, 34, 6, 14, '#6a4422'); rect(g, 14, 54, 22, 8, '#2a1a10'); for (let i = 0; i < 5; i++) rect(g, 15 + i * 4, 54, 2, 3, '#f0e0c0');
    rect(g, 12, 72, 26, 3, '#5a3a1a'); rect(g, 12, 84, 26, 3, '#5a3a1a');
  }), 1.0, 0.12);
  add('monstera', make(80, 70, (g) => {
    const r = rng(12);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.95 + i * 0.36, x = 40 + Math.cos(a) * 26, y = 58 + Math.sin(a) * 40;
      stroke(g, [[40, 70], [x, y]], 0.8, '#1e6a2a');
      ellipse(g, x, y, 13, 9, i % 2 ? '#1e8a3a' : '#2aa848');
      for (let k = 0; k < 3; k++) rect(g, x - 8 + k * 6, y - 1 + r() * 3, 3, 1, '#0e4a1e');
    }
  }), 0.7, 0);

  // ---------------------------------------------------------------- city
  function building(seed, w, h, wall, trim, lit) {
    const r = rng(seed);
    return make(w, h, (g) => {
      rect(g, 0, 8, w, h - 8, wall);
      rect(g, 0, 8, w, 3, shade(wall, 0.3)); rect(g, w - 6, 8, 6, h - 8, shade(wall, -0.25));
      rect(g, w * 0.3, 0, w * 0.25, 10, shade(wall, -0.15));
      if (r() < 0.5) { rect(g, w * 0.7, 2, 2, 8, '#888'); px(g, w * 0.7, 1, '#ff3c3c'); }
      const cw = 6, chh = 8;
      for (let y = 16; y < h - 18; y += chh + 4) for (let x = 5; x < w - 10; x += cw + 4) {
        const on = lit ? r() < 0.55 : false;
        rect(g, x, y, cw, chh, on ? (r() < 0.7 ? '#ffe08a' : '#8ae0ff') : shade(trim, -0.2));
        if (!lit) rect(g, x, y, cw, 2, shade(trim, 0.35));
      }
      rect(g, 0, h - 16, w, 16, shade(wall, -0.35));
      rect(g, w * 0.35, h - 14, w * 0.3, 14, lit ? '#ffe08a' : '#2a3a5a');
    });
  }
  add('tower1', building(1, 90, 230, '#e8a87c', '#3c6aa8'), 5.0, 0.35, { wide: true });
  add('tower2', building(2, 80, 180, '#f0e0c8', '#2a8ab0'), 4.0, 0.32, { wide: true });
  add('tower3', building(3, 100, 160, '#ff9ab0', '#5a4aa8'), 3.6, 0.38, { wide: true });
  add('tower4', building(4, 70, 210, '#a8c8e0', '#3a5a8a'), 4.6, 0.3, { wide: true });
  add('nightTower1', building(5, 90, 230, '#2a2048', '#1a1430', true), 5.0, 0.35, { wide: true });
  add('nightTower2', building(6, 80, 190, '#1e2a48', '#141a30', true), 4.2, 0.32, { wide: true });
  add('nightTower3', building(7, 100, 160, '#3a1e48', '#22122e', true), 3.6, 0.38, { wide: true });

  function lamp(nightGlow) {
    return make(70, 170, (g) => {
      rect(g, 8, 20, 4, 150, '#5a6070'); rect(g, 9, 20, 1, 150, '#9aa0b0');
      stroke(g, [[10, 22], [24, 10], [52, 8]], 1, '#5a6070');
      rect(g, 44, 6, 18, 5, '#3a3e48');
      if (nightGlow) { ellipse(g, 53, 14, 9, 6, 'rgba(255,240,180,0.35)'); rect(g, 46, 11, 14, 3, '#fffbe0'); }
      else rect(g, 46, 11, 14, 2, '#e8e0c0');
      rect(g, 4, 162, 12, 8, '#3a3e48');
    });
  }
  add('lamp', lamp(false), 2.0, 0.04);
  add('lampLit', lamp(true), 2.0, 0.04);

  function neon(text, col, col2) {
    const tw = Font.width(text, 'big'), w = tw + 16, h = 34;
    return make(w, h + 60, (g) => {
      rect(g, w / 2 - 2, h, 4, 60, '#3a3e48');
      rect(g, 0, 0, w, h, '#120a20'); rect(g, 1, 1, w - 2, h - 2, '#1e1030');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) Font.draw(g, text, 8 + dx, 8 + dy, shade(col, -0.4));
      Font.draw(g, text, 8, 8, col);
      Font.draw(g, text, 8, 9, shade(col, 0.55));
      rect(g, 3, 3, w - 6, 1, col2); rect(g, 3, h - 4, w - 6, 1, col2); rect(g, 3, 3, 1, h - 6, col2); rect(g, w - 4, 3, 1, h - 6, col2);
      tiny(g, '* * *', w / 2 - tinyW('* * *') / 2, 22, col2);
    });
  }
  add('neonMotel', neon('MOTEL', '#ff4fd0', '#3cf0ff'), 1.4, 0.05);
  add('neonDiner', neon('DINER', '#3cf0ff', '#ffe14a'), 1.4, 0.05);
  add('neonChill', neon('CHILL', '#7aff5a', '#ff4fd0'), 1.4, 0.05);
  add('neonZzz', neon('ZZZ', '#ffe14a', '#ff4fd0'), 1.3, 0.05);
  add('neonDisco', neon('DISCO', '#c45cff', '#ffe14a'), 1.4, 0.05);
  add('neonOpen', neon('OPEN 24H', '#ff3c5c', '#3cf0ff'), 1.4, 0.05);

  // ---------------------------------------------------------------- billboards (sloth propaganda)
  function billboard(l1, l2, bg, fg, withFace) {
    const w = 150, h = 120;
    return make(w, h, (g) => {
      rect(g, 26, 60, 6, 60, '#5a4a3a'); rect(g, 118, 60, 6, 60, '#5a4a3a');
      rect(g, 2, 4, w - 4, 66, '#e8e0d0'); rect(g, 5, 7, w - 10, 60, bg);
      const tx = withFace ? 92 : w / 2;
      Font.draw(g, l1, tx, 18, fg, { align: 'center', shadow: shade(bg, -0.45) });
      Font.draw(g, l2, tx, 36, fg, { align: 'center', shadow: shade(bg, -0.45) });
      if (withFace) { const ctx = g; ctx.save(); ctx.translate(0, 0); Cars.head(ctx, 30, 37, 'face'); ctx.restore(); }
      rect(g, 2, 70, w - 4, 4, '#8a7a6a');
      for (let x = 14; x < w - 10; x += 34) { rect(g, x, 70, 2, 6, '#5a4a3a'); rect(g, x - 2, 2, 6, 3, '#3a3a44'); }
    });
  }
  add('billHang', billboard('HANG', 'LOOSE', '#ff5ca8', '#fff8e0', true), 1.9, 0.2, { wide: true });
  add('billSlow', billboard('SLOW IS THE', 'NEW FAST', '#3cb4ff', '#ffffff', false), 1.9, 0.2, { wide: true });
  add('billFast', billboard('FAST', 'MEH', '#ffd23c', '#c83a1c', true), 1.9, 0.2, { wide: true });
  add('billNap', billboard('NAP INN', '2 MILES', '#3a2a6a', '#ffe14a', false), 1.9, 0.2, { wide: true });
  add('billFM', billboard('LAZY FM', '88.8', '#ff7a2c', '#ffffff', true), 1.9, 0.2, { wide: true });
  add('billLeaf', billboard('LEAF', 'BURGERS', '#3a9a3a', '#ffe14a', false), 1.9, 0.2, { wide: true });
  add('billSun', billboard('WEAR', 'SHADES', '#7a3cff', '#ffe14a', true), 1.9, 0.2, { wide: true });

  // ---------------------------------------------------------------- road furniture
  function chevron(dir) {
    return make(70, 80, (g) => {
      rect(g, 16, 40, 4, 40, '#c8c8d0'); rect(g, 50, 40, 4, 40, '#c8c8d0');
      rect(g, 2, 6, 66, 38, '#1a1a1a'); rect(g, 4, 8, 62, 34, '#ffd23c');
      for (let k = 0; k < 3; k++) {
        const x = 14 + k * 18;
        const pts = dir > 0 ? [[x, 12], [x + 12, 25], [x, 38], [x - 6, 38], [x + 6, 25], [x - 6, 12]] : [[x + 6, 12], [x - 6, 25], [x + 6, 38], [x + 12, 38], [x, 25], [x + 12, 12]];
        poly(g, pts, '#1a1a1a');
      }
    });
  }
  add('chevronR', chevron(1), 0.55, 0.1);
  add('chevronL', chevron(-1), 0.55, 0.1);
  add('post', make(10, 40, (g) => { rect(g, 3, 0, 4, 40, '#f4f4f4'); rect(g, 3, 4, 4, 5, '#ff3c3c'); rect(g, 7, 0, 1, 40, '#a8a8b0'); }), 0.35, 0.02);
  add('snowbank', make(100, 30, (g) => { ellipse(g, 30, 22, 28, 12, '#e0eaff'); ellipse(g, 66, 20, 30, 14, '#f4f8ff'); rect(g, 4, 24, 92, 6, '#e8f0ff'); }), 0.3, 0);
  add('tumbleweed', make(40, 36, (g) => { const r = rng(4); for (let i = 0; i < 40; i++) { const a = r() * 6.28, b = a + 1 + r(); stroke(g, [[20 + Math.cos(a) * 15, 18 + Math.sin(a) * 15], [20 + Math.cos(b) * 15, 18 + Math.sin(b) * 15]], 0.5, i % 2 ? '#a8844a' : '#7a5a2a'); } }), 0.35, 0);
  add('windmill', make(80, 170, (g) => {
    stroke(g, [[28, 170], [38, 40]], 1, '#6a6a72'); stroke(g, [[52, 170], [42, 40]], 1, '#6a6a72');
    for (let y = 60; y < 170; y += 22) stroke(g, [[30, y], [50, y + 14]], 0.5, '#6a6a72');
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; stroke(g, [[40, 32], [40 + Math.cos(a) * 26, 32 + Math.sin(a) * 26]], 1.2, '#d8d8e0'); }
    ellipse(g, 40, 32, 4, 4, '#5a5a62'); poly(g, [[44, 30], [72, 26], [72, 38], [44, 34]], '#c83a1c');
  }), 2.0, 0.1);
  add('gasStation', make(160, 110, (g) => {
    rect(g, 10, 30, 140, 10, '#ff3c3c'); rect(g, 10, 30, 140, 3, '#ffffff');
    tiny(g, 'SLOTH GAS', 80 - tinyW('SLOTH GAS') / 2, 34, '#ffffff');
    rect(g, 18, 40, 6, 70, '#e8e8e8'); rect(g, 136, 40, 6, 70, '#e8e8e8');
    for (const x of [50, 96]) { rect(g, x, 76, 14, 34, '#ffd23c'); rect(g, x + 2, 80, 10, 8, '#2a2a30'); }
    rect(g, 140, 0, 14, 40, '#2a2a30'); tiny(g, '$9', 142, 4, '#ffe14a'); tiny(g, '.99', 142, 12, '#ffe14a');
  }), 1.6, 0.5, { wide: true });
  add('cabin', make(140, 100, (g) => {
    for (let y = 40; y < 100; y += 6) { rect(g, 14, y, 112, 5, '#8a5432'); rect(g, 14, y + 4, 112, 1, '#5a3418'); }
    poly(g, [[4, 44], [70, 8], [136, 44]], '#5a3a2a'); poly(g, [[4, 44], [70, 8], [70, 44]], '#4a2e20');
    rect(g, 30, 56, 22, 18, '#ffe08a'); rect(g, 40, 56, 2, 18, '#5a3418'); rect(g, 86, 60, 22, 40, '#5a3418');
    rect(g, 100, 10, 12, 22, '#7a7a82');
  }), 1.4, 0.45, { wide: true });
  add('chalet', make(140, 110, (g) => {
    rect(g, 14, 46, 112, 64, '#f0e8d8'); for (let x = 14; x < 126; x += 14) rect(g, x, 46, 2, 64, '#8a5432');
    poly(g, [[0, 52], [70, 6], [140, 52]], '#7a3a2a'); poly(g, [[0, 52], [70, 6], [70, 14], [12, 52]], '#f4f8ff');
    rect(g, 30, 60, 20, 16, '#ffe08a'); rect(g, 90, 60, 20, 16, '#ffe08a'); rect(g, 58, 80, 24, 30, '#6a3a22');
  }), 1.6, 0.45, { wide: true });

  // ---------------------------------------------------------------- gates and route signs (span the road)
  function gate(text, a, b) {
    const w = 260, h = 120;
    return make(w, h, (g) => {
      for (const x of [4, w - 20]) { for (let y = 10; y < h; y += 8) rect(g, x, y, 16, 8, ((y >> 3) % 2) ? a : '#f8f8f8'); rect(g, x + 13, 10, 3, h - 10, 'rgba(0,0,0,0.25)'); }
      rect(g, 0, 6, w, 34, '#141024'); rect(g, 2, 8, w - 4, 30, a);
      rect(g, 2, 8, w - 4, 3, shade(a, 0.4));
      const tw = Font.width(text, 'big', 2);
      Font.draw(g, text, w / 2 - tw / 2, 11, '#ffffff', { scale: 2, shadow: shade(a, -0.5) });
      for (let x = 6; x < w - 6; x += 12) { rect(g, x, 2, 6, 4, b); rect(g, x + 6, 2, 6, 4, '#f8f8f8'); }
    });
  }
  add('gateStart', gate('START', '#e0282c', '#ffe14a'), 1.15, 0, { wide: true, gate: true });
  add('gateCheck', gate('CHECKPOINT', '#2c64e0', '#ffe14a'), 1.15, 0, { wide: true, gate: true });
  add('gateGoal', gate('GOAL', '#ff4fd0', '#3cf0ff'), 1.15, 0, { wide: true, gate: true });

  // destination signs in the fork median: built per pair of route names
  const forkCache = {};
  S.fork = function (leftName, rightName) {
    const key = leftName + '|' + rightName;
    if (forkCache[key]) return forkCache[key];
    const lw = Font.width(leftName, 'big'), rw = Font.width(rightName, 'big'), w = Math.max(lw, rw) + 52, h = 70;
    const img = make(w, h + 50, (g) => {
      rect(g, w / 2 - 3, h, 6, 50, '#5a6070');
      rect(g, 0, 0, w, h, '#ffffff'); rect(g, 2, 2, w - 4, h - 4, '#1e6a3a');
      Font.draw(g, leftName, 34, 14, '#ffffff');
      poly(g, [[8, 17], [20, 9], [20, 25]], '#ffe14a'); rect(g, 20, 14, 8, 6, '#ffe14a');
      Font.draw(g, rightName, w - 34 - rw, 44, '#ffffff');
      poly(g, [[w - 8, 47], [w - 20, 39], [w - 20, 55]], '#ffe14a'); rect(g, w - 28, 44, 8, 6, '#ffe14a');
      rect(g, 6, 34, w - 12, 1, '#ffffff');
    });
    return (forkCache[key] = { name: 'fork:' + key, img, sc: 1.35 * 400 / img.height, hit: 0.15, wide: true });
  };

  // themed tinting (sunset glow / night), memoised per theme
  const tcache = {};
  S.get = function (name, tint) {
    const s = typeof name === 'string' ? S[name] : name;
    if (!s) throw new Error('Scenery: no sprite ' + name);
    if (!tint) return s;
    const key = s.name + '|' + tint.color + tint.amount + (s.img.width);
    if (!tcache[key]) tcache[key] = Object.assign({}, s, { img: tint.night ? Px.night(s.img, tint.color, tint.amount) : Px.tinted(s.img, tint.color, tint.amount) });
    return tcache[key];
  };
  S.list = () => Object.keys(S).filter((k) => S[k] && S[k].img);
  return S;
})();
