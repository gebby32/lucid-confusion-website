/* THEMES — the look of every world: dithered skies, parallax layers, terrain shading,
   platform / vine / thorn styles, decorations, liquids and ambient particles.
   Backgrounds are painted once per theme (seeded, so identical every load) into wide
   canvases that tile horizontally. Terrain is shaded per pixel at level load (world.js
   calls Themes.shadeTerrain) so cliffs get continuous strata, lit edges and grass caps. */
'use strict';
const Themes = (function () {
  const { vgrad, poly, ellipse, rect, px, mix, shade, rng, canvas, make, stroke, BAYER } = Px;
  const W = 320, H = 240;

  // ------------------------------------------------------------------ painting helpers
  // jagged ridge line across w: returns heights per x
  function ridge(w, base, amp, seed, rough, period) {
    const r = rng(seed), pts = [], n = Math.ceil(w / (period || 40)) + 1, ks = [];
    for (let i = 0; i <= n; i++) ks.push(base - r() * amp);
    ks[n] = ks[0];                                        // seamless wrap
    for (let x = 0; x < w; x++) {
      const f = x / w * n, i = Math.floor(f), t = f - i, s = t * t * (3 - 2 * t);
      pts.push(ks[i] + (ks[i + 1] - ks[i]) * s + (rough ? (r() - 0.5) * rough : 0));
    }
    return pts;
  }
  function fillRidge(g, hs, bottom, c) { g.fillStyle = c; for (let x = 0; x < hs.length; x++) g.fillRect(x, Math.round(hs[x]), 1, bottom - Math.round(hs[x])); }
  // flat-topped mesas / buttes
  function mesas(g, w, base, seed, cols, opts) {
    const r = rng(seed); opts = opts || {};
    let x = -20;
    while (x < w + 20) {
      const mw = 40 + r() * (opts.wide || 90), mh = (opts.min || 20) + r() * (opts.tall || 50), top = base - mh, slope = 6 + r() * 10;
      const pts = [[x, base + 4], [x + slope, top + 3], [x + slope + 3, top], [x + mw - slope - 3, top], [x + mw - slope, top + 3], [x + mw, base + 4]];
      for (const dx of [-w, 0, w]) {
        poly(g, pts.map((p) => [p[0] + dx, p[1]]), cols[0]);
        // lit face strata
        for (let k = 0; k < 4; k++) rect(g, x + dx + slope + 2, top + 5 + k * (mh / 4.4), mw - slope * 2 - 4, 1, cols[1]);
        poly(g, [[x + dx + slope + 3, top], [x + dx + mw * 0.45, top], [x + dx + mw * 0.4, base + 4], [x + dx + slope, base + 4]].map((p) => p), cols[2] || cols[1]);
      }
      x += mw + 10 + r() * (opts.gap || 60);
    }
  }
  function acacia(g, x, y, s, trunk, leaf, leaf2) {
    stroke(g, [[x, y], [x - 2 * s, y - 10 * s], [x - 6 * s, y - 18 * s]], 1.2 * s, trunk);
    stroke(g, [[x - 1 * s, y - 8 * s], [x + 5 * s, y - 16 * s]], 1 * s, trunk);
    ellipse(g, x - 1 * s, y - 19 * s, 15 * s, 3.4 * s, leaf);
    ellipse(g, x - 9 * s, y - 18 * s, 6 * s, 2.4 * s, leaf);
    ellipse(g, x + 7 * s, y - 17 * s, 6 * s, 2.4 * s, leaf);
    if (leaf2) { ellipse(g, x - 3 * s, y - 21 * s, 10 * s, 1.8 * s, leaf2); ellipse(g, x + 5 * s, y - 19.6 * s, 4 * s, 1.2 * s, leaf2); }
  }
  function cloudBand(g, x, y, w, c, c2, r) {
    for (let k = 0; k < 5; k++) {
      const yy = y + k * 2, ww = w * (1 - Math.abs(k - 1.5) * 0.18), xx = x + (r() - 0.5) * 12;
      rect(g, xx - ww / 2, yy, ww, 2, k < 2 ? c2 : c);
    }
  }
  function puffCloud(g, x, y, s, cols) {
    ellipse(g, x, y, 18 * s, 6 * s, cols[0]);
    ellipse(g, x - 8 * s, y - 3 * s, 9 * s, 6 * s, cols[1]);
    ellipse(g, x + 7 * s, y - 4 * s, 10 * s, 7 * s, cols[1]);
    ellipse(g, x - 1 * s, y - 7 * s, 8 * s, 6 * s, cols[2]);
    rect(g, x - 18 * s, y + 2 * s, 36 * s, 2 * s, cols[0]);
  }
  function glowDisc(g, cx, cy, r, core, glow, levels) {
    for (let i = levels; i >= 1; i--) {
      const rr = r + i * 6;
      for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) {
        const d = Math.hypot(x, y);
        if (d > rr || d < rr - 6) continue;
        if (BAYER[((y + 64) & 3) * 4 + ((x + 64) & 3)] < (levels - i + 1) * 16 / (levels + 1)) px(g, cx + x, cy + y, glow);
      }
    }
    ellipse(g, cx, cy, r, r, core);
  }
  function stars(g, w, h, seed, n, cols) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, c = cols[Math.floor(r() * cols.length)]; px(g, x, y, c); if (r() < 0.08) { px(g, x + 1, y, c); px(g, x - 1, y, c); px(g, x, y + 1, c); px(g, x, y - 1, c); } }
  }
  function slowRock(g, x, base, s, c, c2) {
    // the promontory silhouette: a jutting tongue of rock on a stack
    poly(g, [[x - 40 * s, base], [x - 30 * s, base - 30 * s], [x - 20 * s, base - 44 * s], [x - 10 * s, base - 50 * s], [x + 30 * s, base - 54 * s], [x + 48 * s, base - 51 * s], [x + 50 * s, base - 47 * s], [x + 10 * s, base - 44 * s], [x + 4 * s, base - 30 * s], [x + 14 * s, base]], c);
    if (c2) poly(g, [[x - 10 * s, base - 50 * s], [x + 30 * s, base - 54 * s], [x + 48 * s, base - 51 * s], [x + 20 * s, base - 50 * s], [x - 4 * s, base - 46 * s]], c2);
  }
  function deadTree(g, x, y, s, c) {
    stroke(g, [[x, y], [x + 1 * s, y - 14 * s], [x - 4 * s, y - 24 * s]], [1.6 * s, 0.6 * s], c);
    stroke(g, [[x + 1 * s, y - 12 * s], [x + 8 * s, y - 20 * s], [x + 10 * s, y - 26 * s]], [1 * s, 0.5 * s], c);
    stroke(g, [[x - 1 * s, y - 18 * s], [x - 9 * s, y - 21 * s]], [0.8 * s, 0.4 * s], c);
    stroke(g, [[x + 6 * s, y - 18 * s], [x + 13 * s, y - 19 * s]], [0.6 * s, 0.4 * s], c);
  }
  function jungleTree(g, x, y, s, trunk, leaves) {
    stroke(g, [[x, y], [x + 2 * s, y - 40 * s], [x - 2 * s, y - 70 * s]], [4 * s, 2.6 * s], trunk);
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2, cx = x - 2 * s + Math.cos(a) * 16 * s, cy = y - 74 * s + Math.sin(a) * 8 * s;
      ellipse(g, cx, cy, 14 * s, 8 * s, leaves[k % leaves.length]);
    }
    ellipse(g, x - 2 * s, y - 78 * s, 16 * s, 9 * s, leaves[leaves.length - 1]);
  }
  function skull(g, x, y, s, c, dark) {
    // elephant skull silhouette (bone barrens landmark)
    ellipse(g, x, y - 20 * s, 22 * s, 18 * s, c);
    poly(g, [[x - 16 * s, y - 8 * s], [x + 16 * s, y - 8 * s], [x + 10 * s, y], [x - 10 * s, y]], c);
    ellipse(g, x - 9 * s, y - 20 * s, 5 * s, 6 * s, dark); ellipse(g, x + 9 * s, y - 20 * s, 5 * s, 6 * s, dark);
    poly(g, [[x - 3 * s, y - 8 * s], [x + 3 * s, y - 8 * s], [x, y - 2 * s]], dark);
    stroke(g, [[x - 12 * s, y - 4 * s], [x - 20 * s, y + 2 * s], [x - 22 * s, y - 6 * s]], 2 * s, c);
    stroke(g, [[x + 12 * s, y - 4 * s], [x + 20 * s, y + 2 * s], [x + 22 * s, y - 6 * s]], 2 * s, c);
  }
  function ribcage(g, x, y, s, c) {
    stroke(g, [[x - 26 * s, y - 20 * s], [x + 26 * s, y - 24 * s]], 1.6 * s, c);
    for (let k = 0; k < 7; k++) { const rx = x - 22 * s + k * 7 * s; stroke(g, [[rx, y - 21 * s - k * 0.4 * s], [rx + 6 * s, y - 8 * s], [rx + 2 * s, y]], 1.1 * s, c); }
  }
  function volcano(g, x, base, s, c, lava) {
    poly(g, [[x - 90 * s, base], [x - 14 * s, base - 70 * s], [x + 14 * s, base - 70 * s], [x + 90 * s, base]], c);
    for (let k = 0; k < 3; k++) stroke(g, [[x - 6 * s + k * 6 * s, base - 70 * s], [x - 10 * s + k * 9 * s, base - 46 * s], [x - 16 * s + k * 14 * s, base - 20 * s]], 1 * s, lava);
    ellipse(g, x, base - 70 * s, 14 * s, 3 * s, lava);
  }
  function smoke(g, x, y, s, cols, seed) {
    const r = rng(seed);
    for (let k = 0; k < 9; k++) ellipse(g, x + (r() - 0.3) * 14 * s + k * 3 * s, y - k * 9 * s, (7 + k * 1.6) * s, (5 + k) * s, cols[k % cols.length]);
  }
  function waterfallBg(g, x, top, bottom, w, cols) {
    for (let k = 0; k < w; k++) rect(g, x + k, top, 1, bottom - top, cols[(k * 7) % cols.length]);
    ellipse(g, x + w / 2, bottom, w * 0.9, 5, cols[cols.length - 1]);
  }
  function grassStrip(g, w, y, h, base, dark, light, seed) {
    const r = rng(seed);
    rect(g, 0, y + 6, w, h, base);
    for (let x = 0; x < w; x++) {
      const bh = 4 + r() * 10;
      rect(g, x, y + 10 - bh, 1, bh, r() < 0.3 ? dark : r() < 0.5 ? light : base);
    }
  }

  // ------------------------------------------------------------------ theme definitions
  // Each theme: sky(g) paints the 320x240 sky; layers: [{ w, h, y, px, py, drift, paint(g, w, h) }]
  const T = {};

  T.savanna = {
    name: 'savanna', music: 'savanna',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#28307a'], [0.22, '#5a3e92'], [0.42, '#c8507e'], [0.6, '#ff8a48'], [0.74, '#ffc85a'], [1, '#ffe8a0']], 28);
      glowDisc(g, 236, 168, 26, '#fff4c0', '#ffe080', 5);
      const r = rng(7);
      for (let i = 0; i < 9; i++) cloudBand(g, r() * 360 - 20, 30 + i * 15 + r() * 8, 60 + r() * 90, i < 4 ? '#a8487e' : '#ff9a58', i < 4 ? '#e06a8a' : '#ffc870', r);
    },
    layers: [
      { w: 960, h: 140, y: 100, px: 0.06, py: 0.04, paint(g, w) {
        mesas(g, w, 120, 11, ['#7a4a8a', '#8e5a96', '#6a3e7a'], { tall: 40, wide: 120, gap: 90 });
        slowRock(g, 520, 132, 1.2, '#5a3270', '#7a4a8e');
        rect(g, 0, 128, w, 20, '#6a3e7a');
      } },
      { w: 640, h: 120, y: 140, px: 0.18, py: 0.12, paint(g, w) {
        const hs = ridge(w, 40, 14, 21, 0, 80);
        fillRidge(g, hs, 120, '#8a4a50');
        const r = rng(4);
        for (let i = 0; i < 9; i++) acacia(g, r() * w, 36 + r() * 8, 0.9 + r() * 0.5, '#4a2a34', '#5a3040', '#6a3a48');
        for (let i = 0; i < 6; i++) { const x = r() * w; ellipse(g, x, 44, 5, 3, '#5a2e3a'); ellipse(g, x + 5, 42, 2.4, 2, '#5a2e3a'); rect(g, x - 3, 46, 1, 3, '#5a2e3a'); rect(g, x + 2, 46, 1, 3, '#5a2e3a'); }
        rect(g, 0, 50, w, 70, '#9a5a48');
        for (let k = 0; k < 6; k++) rect(g, 0, 56 + k * 9, w, 1, '#a8684e');
      } },
      { w: 640, h: 80, y: 180, px: 0.36, py: 0.26, paint(g, w) { grassStrip(g, w, 4, 80, '#b8782c', '#8a5020', '#e0a840', 5); } }
    ],
    terrain: { ramp: ['#3a1c14', '#6a3420', '#8e4a28', '#b0663a', '#d88a52'], alt: ['#3a2a20', '#5e4636', '#7e604a', '#9e7c60', '#c0a080'], outline: '#24100c',
      cap: ['#f0d060', '#c8a838', '#8a7a28'], capDepth: 4, strata: 7, wobble: 5 },
    platform: 'branch', hang: 'vine', climb: 'vine', spike: 'thorns', liquid: 'water', bouncer: 'rhino', breakable: 'rock',
    decor: ['tuft', 'tuft', 'rock', 'flower', 'tuft', 'termite'], tree: 'acacia', ambient: 'pollen'
  };

  T.bones = {
    name: 'bones', music: 'danger',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#101820'], [0.35, '#1e3430'], [0.65, '#46624a'], [0.85, '#8ea060'], [1, '#b8c070']], 24);
      const r = rng(3);
      for (let i = 0; i < 6; i++) cloudBand(g, r() * 340, 40 + i * 18, 80 + r() * 80, '#2e4a40', '#3e5e4e', r);
    },
    layers: [
      { w: 960, h: 160, y: 80, px: 0.06, py: 0.04, paint(g, w) {
        const hs = ridge(w, 90, 60, 31, 6, 26);
        fillRidge(g, hs, 160, '#1e2e2c');
        skull(g, 300, 120, 1.6, '#3e4e48', '#1a2624'); skull(g, 760, 126, 1.2, '#3e4e48', '#1a2624');
      } },
      { w: 640, h: 120, y: 140, px: 0.2, py: 0.12, paint(g, w) {
        const hs = ridge(w, 50, 24, 41, 3, 30);
        fillRidge(g, hs, 120, '#2e4038');
        ribcage(g, 180, 54, 1.4, '#8e9a84'); ribcage(g, 470, 50, 1, '#7a8672');
        smoke(g, 360, 50, 0.8, ['#4a6658', '#5a7868'], 3);
      } },
      { w: 640, h: 70, y: 194, px: 0.38, py: 0.26, paint(g, w) {
        const hs = ridge(w, 16, 8, 51, 2, 20); fillRidge(g, hs, 70, '#3a4a3e');
        const r = rng(9); for (let i = 0; i < 30; i++) { const x = r() * w; stroke(g, [[x, 18], [x + 6, 16]], 1, '#c8c8b0'); }
      } }
    ],
    terrain: { ramp: ['#1a1e1a', '#363a30', '#525444', '#70705a', '#929076'], alt: ['#4a4a40', '#8e8a78', '#b4ae98', '#d4ceb8', '#f0ecd8'], outline: '#0e100c',
      cap: ['#a8a888', '#7e7e64', '#5a5a48'], capDepth: 2, strata: 5, wobble: 7 },
    platform: 'bone', hang: 'rib', climb: 'rib', spike: 'bones', liquid: 'tar', bouncer: 'geyser', breakable: 'bonewall',
    decor: ['bone', 'rock', 'skullsmall', 'bone', 'tuftdry'], tree: 'deadtree', ambient: 'mist'
  };

  T.canyon = {
    name: 'canyon', music: 'chase',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#d07040'], [0.4, '#e8a060'], [0.8, '#f8d8a0'], [1, '#fff0c8']], 20);
      glowDisc(g, 80, 50, 14, '#fffbe8', '#ffe8b0', 4);
    },
    layers: [
      { w: 960, h: 200, y: 40, px: 0.08, py: 0.05, paint(g, w) {
        mesas(g, w, 150, 61, ['#b05a38', '#c8704a', '#984a2e'], { tall: 80, min: 50, wide: 140, gap: 20 });
        rect(g, 0, 150, w, 60, '#984a2e');
      } },
      { w: 640, h: 140, y: 120, px: 0.22, py: 0.14, paint(g, w) {
        const r = rng(71);
        for (let i = 0; i < 7; i++) { const x = r() * w, hh = 50 + r() * 50, ww = 14 + r() * 16; poly(g, [[x, 140], [x + 3, 140 - hh], [x + ww - 3, 140 - hh - 4], [x + ww, 140]], '#7a3a24'); rect(g, x + 4, 140 - hh + 4, 2, hh - 6, '#94482c'); }
        rect(g, 0, 100, w, 40, '#6a3220');
      } }
    ],
    terrain: { ramp: ['#3a160c', '#6e2c16', '#9a4220', '#c05a2c', '#e07e44'], alt: ['#4a2a1a', '#6e4428', '#8e5c38', '#ae7a4c', '#cc9a68'], outline: '#200a06',
      cap: ['#f0b070', '#d08a50', '#a86838'], capDepth: 2, strata: 5, wobble: 3 },
    platform: 'ledge', hang: 'root', climb: 'vine', spike: 'thorns', liquid: 'water', bouncer: 'rhino', breakable: 'rock',
    decor: ['rock', 'tuftdry', 'rock', 'aloe'], tree: 'deadtree', ambient: 'dust'
  };

  T.thorn = {
    name: 'thorn', music: 'thorn',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#1a1236'], [0.3, '#3e2058'], [0.55, '#8a3a6a'], [0.75, '#e0664a'], [0.9, '#ffa850'], [1, '#ffd078']], 26);
      glowDisc(g, 110, 196, 18, '#ffe0a0', '#ff9a50', 4);
      stars(g, W, 70, 5, 30, ['#c8b8ff', '#ffffff']);
    },
    layers: [
      { w: 960, h: 120, y: 120, px: 0.07, py: 0.04, paint(g, w) { mesas(g, w, 96, 81, ['#2a1638', '#3a2048', '#22102e'], { tall: 34, wide: 160, gap: 120 }); rect(g, 0, 92, w, 40, '#22102e'); } },
      { w: 640, h: 100, y: 156, px: 0.22, py: 0.14, paint(g, w) {
        const hs = ridge(w, 30, 10, 83, 1, 60); fillRidge(g, hs, 100, '#3a1a30');
        const r = rng(84); for (let i = 0; i < 8; i++) deadTree(g, r() * w, 30, 1 + r() * 0.6, '#1e0e1a');
      } },
      { w: 640, h: 60, y: 200, px: 0.38, py: 0.26, paint(g, w) { grassStrip(g, w, 2, 60, '#5a3020', '#3a1a14', '#8a5030', 85); } }
    ],
    terrain: { ramp: ['#24121a', '#462230', '#6a3438', '#8e4c44', '#b8705a'], alt: ['#2a1e24', '#4a3640', '#6a5058', '#8a6c70', '#ae8e8e'], outline: '#140810',
      cap: ['#d8a050', '#a87838', '#7a5028'], capDepth: 3, strata: 6, wobble: 6 },
    platform: 'ledge', hang: 'root', climb: 'root', spike: 'thorns', liquid: 'tar', bouncer: 'rhino', breakable: 'rock',
    decor: ['thornbush', 'tuftdry', 'skullsmall', 'rock', 'tuftdry'], tree: 'deadtree', ambient: 'dust'
  };

  T.jungle = {
    name: 'jungle', music: 'jungle',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#6ad0c8'], [0.5, '#a8e8b8'], [1, '#d8f8c0']], 18);
      const r = rng(91);
      for (let i = 0; i < 5; i++) { const x = r() * W; for (let y = 0; y < H; y++) for (let k = 0; k < 10; k++) if ((x + k + y * 0.5) % 4 < 1 && BAYER[(y & 3) * 4 + (k & 3)] < 6) px(g, x + k + y * 0.4, y, '#f0ffd0'); }
    },
    layers: [
      { w: 960, h: 240, y: 0, px: 0.06, py: 0.04, paint(g, w) {
        const hs = ridge(w, 120, 40, 92, 4, 24); fillRidge(g, hs, 240, '#4a9a8a');
        const r = rng(93); for (let i = 0; i < 14; i++) jungleTree(g, r() * w, 200, 0.8 + r() * 0.4, '#3a7a6a', ['#3e8a72', '#4a9e80', '#56aa8a']);
      } },
      { w: 640, h: 240, y: 0, px: 0.2, py: 0.12, paint(g, w) {
        const r = rng(94);
        for (let i = 0; i < 8; i++) jungleTree(g, r() * w, 240, 1.2 + r() * 0.5, '#2a5a3a', ['#2a6a3a', '#327a44', '#3c8a4c']);
        for (let i = 0; i < 18; i++) { const x = r() * w; stroke(g, [[x, 0], [x + 4, 40 + r() * 60], [x - 2, 90 + r() * 60]], 0.6, '#2a6a32'); }
      } },
      { w: 640, h: 60, y: 196, px: 0.4, py: 0.3, paint(g, w) {
        const r = rng(95); rect(g, 0, 30, w, 30, '#1a4a24');
        for (let i = 0; i < 40; i++) { const x = r() * w; ellipse(g, x, 30, 10 + r() * 8, 6 + r() * 6, r() < 0.5 ? '#1e5a2a' : '#246a30'); }
      } }
    ],
    terrain: { ramp: ['#1e140c', '#3e2a18', '#5a3e22', '#76562e', '#987040'], alt: ['#1c1008', '#3a2412', '#55381c', '#704c26', '#8e6434'], outline: '#100a06',
      cap: ['#8ae04a', '#4aa83a', '#2a7a2a'], capDepth: 5, strata: 8, wobble: 4, moss: true, altWood: true },
    platform: 'branch', hang: 'vine', climb: 'vine', spike: 'thorns', liquid: 'water', bouncer: 'mushroom', breakable: 'log',
    decor: ['fern', 'flower', 'fern', 'mushroom', 'tuft'], tree: 'jungle', ambient: 'leaves'
  };

  T.falls = {
    name: 'falls', music: 'falls',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#3a7ad8'], [0.55, '#78b8f0'], [1, '#c8ecff']], 22);
      const r = rng(101);
      for (let i = 0; i < 6; i++) puffCloud(g, r() * W, 40 + r() * 70, 0.8 + r() * 0.6, ['#c0d8f0', '#e8f4ff', '#ffffff']);
      // a faint rainbow
      for (let k = 0; k < 4; k++) { const c = ['#ff9a9a', '#ffe09a', '#a8f0a8', '#a8c8ff'][k]; for (let a = 0; a < 140; a++) { const t = Math.PI + a / 140 * Math.PI; if (a % 2 === 0) px(g, 230 + Math.cos(t) * (80 - k * 2), 190 + Math.sin(t) * (80 - k * 2), c); } }
    },
    layers: [
      { w: 960, h: 200, y: 50, px: 0.07, py: 0.05, paint(g, w) {
        mesas(g, w, 170, 102, ['#5a7a8a', '#6e909e', '#4a6a7a'], { tall: 90, min: 50, wide: 140, gap: 40 });
        for (const x of [130, 420, 700]) waterfallBg(g, x, 90, 170, 10, ['#c8e8ff', '#ffffff', '#a8d0f0']);
        rect(g, 0, 168, w, 40, '#4a6a7a');
      } },
      { w: 640, h: 120, y: 140, px: 0.22, py: 0.14, paint(g, w) {
        const hs = ridge(w, 40, 20, 103, 2, 50); fillRidge(g, hs, 120, '#3a6a4a');
        const r = rng(104); for (let i = 0; i < 6; i++) jungleTree(g, r() * w, 60, 0.6, '#2a4a32', ['#3a7a4a', '#4a8a56']);
        rect(g, 0, 70, w, 50, '#4a8ab0'); for (let k = 0; k < 8; k++) rect(g, r() * w, 74 + k * 5, 30 + r() * 40, 1, '#8ac0e0');
      } }
    ],
    terrain: { ramp: ['#1a2224', '#2e3e42', '#46585a', '#607476', '#829496'], alt: ['#2a3a2a', '#3e5a3a', '#527a4a', '#6a965c', '#8ab878'], outline: '#0c1214',
      cap: ['#7ae05a', '#3ea84a', '#287a3a'], capDepth: 4, strata: 6, wobble: 4, moss: true },
    platform: 'log', hang: 'vine', climb: 'vine', spike: 'thorns', liquid: 'water', bouncer: 'mushroom', breakable: 'rock',
    decor: ['reed', 'fern', 'rock', 'flower'], tree: 'jungle', ambient: 'spray'
  };

  T.night = {
    name: 'night', music: 'night',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#06061a'], [0.5, '#141a40'], [0.85, '#2a3a6a'], [1, '#3e5080']], 22);
      stars(g, W, 160, 111, 90, ['#ffffff', '#c8d0ff', '#8890c8']);
      glowDisc(g, 240, 60, 18, '#f4f0d8', '#3e4a80', 4);
      ellipse(g, 236, 56, 3, 3, '#d8d4b8'); ellipse(g, 246, 64, 2, 2, '#d8d4b8');
    },
    layers: [
      { w: 960, h: 140, y: 100, px: 0.06, py: 0.04, paint(g, w) { const hs = ridge(w, 60, 40, 112, 2, 70); fillRidge(g, hs, 140, '#1a2048'); } },
      { w: 640, h: 200, y: 40, px: 0.2, py: 0.12, paint(g, w) {
        const r = rng(113);
        for (let i = 0; i < 12; i++) jungleTree(g, r() * w, 200, 0.9 + r() * 0.5, '#101632', ['#141c3e', '#1a2448', '#22305a']);
      } },
      { w: 640, h: 60, y: 196, px: 0.38, py: 0.26, paint(g, w) { const r = rng(114); rect(g, 0, 30, w, 30, '#0a0e22'); for (let i = 0; i < 40; i++) ellipse(g, r() * w, 30, 10 + r() * 8, 6 + r() * 5, '#0e1430'); } }
    ],
    terrain: { ramp: ['#0c0e1e', '#1c2038', '#2c3252', '#40486e', '#5a648c'], alt: ['#1a1a2e', '#2e2a46', '#443e62', '#5c547e', '#7a729e'], outline: '#06060e',
      cap: ['#6ac8a0', '#3a8a7a', '#26605a'], capDepth: 4, strata: 7, wobble: 5, moss: true },
    platform: 'branch', hang: 'vine', climb: 'vine', spike: 'thorns', liquid: 'water', bouncer: 'glowshroom', breakable: 'log',
    decor: ['fernblue', 'glowshroom', 'fernblue', 'rock'], tree: 'nighttree', ambient: 'fireflies', dark: true
  };

  T.cave = {
    name: 'cave', music: 'cave',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#08040e'], [0.5, '#140a22'], [1, '#1e1030']], 16);
    },
    layers: [
      { w: 640, h: 240, y: 0, px: 0.1, py: 0.08, paint(g, w) {
        const top = ridge(w, 40, 30, 121, 3, 20), bot = ridge(w, 230, 40, 122, 3, 24);
        g.fillStyle = '#24143a'; for (let x = 0; x < w; x++) { g.fillRect(x, 0, 1, top[x]); g.fillRect(x, bot[x], 1, 240 - bot[x]); }
        const r = rng(123);
        for (let i = 0; i < 20; i++) { const x = r() * w, l = 10 + r() * 30; poly(g, [[x - 4, top[Math.floor(x) % w] - 2], [x + 4, top[Math.floor(x) % w] - 2], [x, top[Math.floor(x) % w] + l]], '#24143a'); }
        for (let i = 0; i < 16; i++) { const x = r() * w, y = 60 + r() * 140, c = r() < 0.5 ? '#3ae0e0' : '#e04ae0'; poly(g, [[x, y], [x + 3, y - 8], [x + 6, y]], c); px(g, x + 3, y - 4, '#ffffff'); }
      } },
      { w: 640, h: 240, y: 0, px: 0.25, py: 0.18, paint(g, w) {
        const r = rng(124);
        for (let i = 0; i < 7; i++) { const x = r() * w, ww = 12 + r() * 16; rect(g, x, 0, ww, 240, '#1a0e2a'); rect(g, x + 2, 0, 2, 240, '#2a1840'); ellipse(g, x + ww / 2, 120 + r() * 60, ww * 0.9, 10, '#1a0e2a'); }
      } }
    ],
    terrain: { ramp: ['#100818', '#24143a', '#3a2456', '#563a74', '#7a5a98'], alt: ['#1a2a3a', '#2a4458', '#3e6078', '#5a8098', '#80a8c0'], outline: '#06030a',
      cap: null, capDepth: 0, strata: 6, wobble: 8, crystals: true },
    platform: 'ledge', hang: 'root', climb: 'root', spike: 'crystals', liquid: 'water', bouncer: 'glowshroom', breakable: 'crystalrock',
    decor: ['stalag', 'crystal', 'rock', 'glowshroom'], tree: null, ambient: 'drips', dark: true
  };

  T.volcano = {
    name: 'volcano', music: 'volcano',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#120606'], [0.4, '#3a0e0a'], [0.75, '#8a2410'], [1, '#e0581a']], 22);
    },
    layers: [
      { w: 960, h: 180, y: 60, px: 0.06, py: 0.04, paint(g, w) {
        volcano(g, 300, 170, 1.6, '#2a0e0c', '#ff6a1a'); volcano(g, 760, 170, 1, '#2a0e0c', '#ff6a1a');
        smoke(g, 300, 50, 1.2, ['#3a1a18', '#4a2420'], 5);
        rect(g, 0, 168, w, 20, '#2a0e0c');
      } },
      { w: 640, h: 100, y: 150, px: 0.22, py: 0.14, paint(g, w) {
        const hs = ridge(w, 40, 30, 131, 5, 18); fillRidge(g, hs, 100, '#1a0a0a');
        const r = rng(132); for (let i = 0; i < 10; i++) { const x = r() * w; rect(g, x, 60 + r() * 30, 20 + r() * 30, 1, '#ff5a10'); }
      } }
    ],
    terrain: { ramp: ['#0c0606', '#1e1210', '#2e1c18', '#443028', '#5e463a'], alt: ['#2a0e08', '#5a1a0a', '#8a2a0a', '#c8480e', '#ff8a2a'], outline: '#050202',
      cap: ['#706058', '#4a3e38', '#2e2420'], capDepth: 2, strata: 5, wobble: 9, glowCracks: true },
    platform: 'basalt', hang: 'chain', climb: 'chain', spike: 'embers', liquid: 'lava', bouncer: 'geyser', breakable: 'rock',
    decor: ['ashrock', 'stump', 'ashrock', 'glowrock'], tree: 'charred', ambient: 'embers'
  };

  T.final = {
    name: 'final', music: 'final',
    sky(g) {
      vgrad(g, 0, 0, W, H, [[0, '#06060e'], [0.35, '#1a0e1e'], [0.65, '#5a1a1a'], [0.9, '#c84a18'], [1, '#ff8a2a']], 24);
      stars(g, W, 70, 141, 30, ['#ffffff', '#c8b8a0']);
    },
    layers: [
      { w: 960, h: 160, y: 80, px: 0.06, py: 0.04, paint(g, w) {
        const hs = ridge(w, 120, 20, 142, 1, 90); fillRidge(g, hs, 160, '#1a0a12');
        slowRock(g, 480, 126, 1.6, '#120610', '#2a1018');
        smoke(g, 200, 80, 1, ['#2a1416', '#3a1c1c'], 7); smoke(g, 760, 90, 0.9, ['#2a1416', '#3a1c1c'], 8);
      } },
      { w: 640, h: 100, y: 150, px: 0.22, py: 0.14, paint(g, w) {
        const hs = ridge(w, 40, 10, 143, 1, 60); fillRidge(g, hs, 100, '#2a0e0e');
        const r = rng(144); for (let i = 0; i < 8; i++) acacia(g, r() * w, 42, 0.9 + r() * 0.5, '#100608', '#1a0a0c');
        for (let i = 0; i < 14; i++) { const x = r() * w; poly(g, [[x - 5, 46], [x, 30 + r() * 8], [x + 5, 46]], r() < 0.5 ? '#ff6a1a' : '#ffb03a'); }
      } }
    ],
    terrain: { ramp: ['#120808', '#2a1210', '#441c16', '#622a1e', '#86402a'], alt: ['#1e1414', '#3a2a28', '#54403a', '#705850', '#907468'], outline: '#080303',
      cap: ['#5a3a20', '#3a2414', '#24140c'], capDepth: 3, strata: 7, wobble: 5, glowCracks: true },
    platform: 'branchburnt', hang: 'vine', climb: 'vine', spike: 'embers', liquid: 'lava', bouncer: 'rhino', breakable: 'rock',
    decor: ['tuftburnt', 'ashrock', 'tuftburnt', 'flame'], tree: 'charred', ambient: 'embers'
  };

  // ------------------------------------------------------------------ build + draw backgrounds
  const built = {};
  function build(name) {
    if (built[name]) return built[name];
    const th = T[name];
    const sky = make(W, H, (g) => th.sky(g));
    const layers = th.layers.map((L) => Object.assign({}, L, { c: make(L.w, L.h, (g) => L.paint(g, L.w, L.h)) }));
    return (built[name] = { sky, layers });
  }
  // camY relative to the level's bottom-most camera position (refY); t = seconds (cloud drift)
  function drawBackground(g, name, camX, camY, refY, t) {
    const B = build(name);
    g.drawImage(B.sky, 0, 0);
    for (const L of B.layers) {
      const off = ((camX * L.px + (L.drift || 0) * t) % L.w + L.w) % L.w;
      const y = Math.round(L.y + (refY - camY) * L.py);
      if (y >= H) continue;
      const x0 = -Math.round(off);
      for (let x = x0; x < W; x += L.w) g.drawImage(L.c, x, y);
    }
  }

  // ------------------------------------------------------------------ terrain shading
  function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // mask: Uint8Array(w*h) 0 air, 1 terrain, 2 alt terrain. Returns ImageData-ready RGBA array.
  function shadeTerrain(name, mask, w, h) {
    const P = T[name].terrain;
    const R = P.ramp.map(Px.rgb), RA = P.alt.map(Px.rgb), O = Px.rgb(P.outline), CAP = P.cap ? P.cap.map(Px.rgb) : null;
    const out = new Uint8ClampedArray(w * h * 4);
    const dTop = new Uint16Array(w * h), dBot = new Uint16Array(w * h), dL = new Uint16Array(w * h), dR = new Uint16Array(w * h);
    for (let x = 0; x < w; x++) {
      let d = 0; for (let y = 0; y < h; y++) { const i = y * w + x; d = mask[i] ? Math.min(d + 1, 999) : 0; dTop[i] = d; }
      d = 0; for (let y = h - 1; y >= 0; y--) { const i = y * w + x; d = mask[i] ? Math.min(d + 1, 999) : 0; dBot[i] = d; }
    }
    for (let y = 0; y < h; y++) {
      let d = 0; for (let x = 0; x < w; x++) { const i = y * w + x; d = mask[i] ? Math.min(d + 1, 999) : 0; dL[i] = d; }
      d = 0; for (let x = w - 1; x >= 0; x--) { const i = y * w + x; d = mask[i] ? Math.min(d + 1, 999) : 0; dR[i] = d; }
    }
    const capD = P.capDepth || 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, m = mask[i];
      if (!m) continue;
      const o = i * 4, ramp = m === 2 ? RA : R;
      let col;
      const top = dTop[i], bot = dBot[i], l = dL[i], r = dR[i];
      // grass / moss / ash cap with a jagged lower edge and dangling blades
      const jag = capD ? capD + Math.floor(hash(x, 7) * 3) - (hash(x >> 1, 3) < 0.2 ? 1 : 0) : 0;
      if (CAP && m === 1 && top <= jag && (y - top < 0 || !mask[(y - top) * w + x])) {
        col = top <= 1 ? CAP[0] : top <= jag - 1 ? CAP[1] : CAP[2];
        if (top === 1 && hash(x, y) < 0.25) col = CAP[1];
      } else if (CAP && m === 1 && top <= jag + 3 && hash(x, 11) < 0.22) {
        col = CAP[2];
      } else if (top === 1 || bot === 1 || l === 1 || r === 1) {
        col = O;
      } else {
        // strata bands with a wobble, dithered where they meet (wood runs vertically)
        const wood = m === 2 && P.altWood;
        const sv = wood ? (x + vnoise(y / 19, 3.5) * 3 + vnoise(x / 5, y / 30) * 1.5) / 3 : (y + vnoise(x / 23, 0.5) * P.wobble * 2 + vnoise(x / 7, y / 40) * 2) / P.strata;
        const band = Math.floor(sv), frac = sv - band;
        let k = 1 + Math.floor(hash(band, 19) * 3);
        if (frac > 0.82 && BAYER[(y & 3) * 4 + (x & 3)] < (frac - 0.82) * 80) k = 1 + Math.floor(hash(band + 1, 19) * 3);
        // light from the upper left, shade on the right and under overhangs
        if (top <= 4 && !CAP) k++;
        if (l <= 3) k++;
        if (r <= 3 || bot <= 4) k--;
        if (top > 60) k--;
        // cracks and speckles
        const n = vnoise(x / 9, y / 4);
        if (Math.abs(n - 0.5) < 0.016 && vnoise(x / 31, y / 17) > 0.45) k = 0;
        const hs = hash(x, y);
        if (hs < 0.012) k = 4; else if (hs > 0.99) k = 0;
        k = Math.max(0, Math.min(4, k));
        col = ramp[k];
        if (P.glowCracks && k === 0 && Math.abs(n - 0.5) < 0.015) col = [255, 110, 30];
        if (P.moss && (m === 1 || wood) && top < 14 && vnoise(x / 6, y / 6) > 0.72) col = CAP ? CAP[2] : col;
        if (wood && top <= 2 && CAP) col = CAP[top <= 1 ? 0 : 1];
        if (P.crystals && hash(x >> 2, y >> 2) < 0.006) col = hash(x, 1) < 0.5 ? [80, 230, 230] : [230, 90, 230];
      }
      out[o] = col[0]; out[o + 1] = col[1]; out[o + 2] = col[2]; out[o + 3] = 255;
    }
    return out;
  }

  return { T, build, drawBackground, shadeTerrain, hash, vnoise, helpers: { acacia, deadTree, jungleTree, skull, ribcage, smoke, puffCloud, glowDisc, stars, slowRock, mesas, ridge, fillRidge } };
})();
