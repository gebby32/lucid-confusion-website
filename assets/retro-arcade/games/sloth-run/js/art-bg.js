/* ART: BACKGROUNDS — parallax layers per theme, built lazily and memoised.
     sky   400 x HORIZON   dithered gradient (never scrolls)
     cel   800 x HORIZON   sun / moon / stars / aurora / clouds (scrolls slowly)
     far   800 x h         distant mountains, mesas, skylines, volcano (bottom on the horizon)
     near  800 x h         hills, tree lines, dunes, nearer buildings (scrolls fastest)
   Every horizontal shape is built from whole-number sine cycles over 800 px, so the
   layers wrap seamlessly. */
'use strict';
const Backgrounds = (function () {
  const { poly, ellipse, rect, stroke, px, rng, shade, mix, make, vgrad, dither } = Px;
  const LW = 800;
  const cache = {};

  // periodic ridge: returns heights[x] (0..1)
  function ridge(seed, rough) {
    const r = rng(seed), waves = [];
    const ks = [1, 2, 3, 5, 8, 13, 21, 34];
    ks.forEach((k, i) => waves.push({ k, a: 1 / Math.pow(k, rough || 0.9) * (0.6 + r() * 0.8), p: r() * Math.PI * 2 }));
    const hs = new Float32Array(LW);
    let lo = Infinity, hi = -Infinity;
    for (let x = 0; x < LW; x++) {
      let v = 0; for (const w of waves) v += w.a * Math.sin((x / LW) * Math.PI * 2 * w.k + w.p);
      hs[x] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    for (let x = 0; x < LW; x++) hs[x] = (hs[x] - lo) / (hi - lo);
    return hs;
  }
  function fillRidge(g, hs, H, base, amp, col, top) {
    g.fillStyle = col;
    for (let x = 0; x < LW; x++) { const y = Math.round(H - base - hs[x] * amp); g.fillRect(x, y, 1, H - y); }
    if (top) for (let x = 0; x < LW; x++) { const y = Math.round(H - base - hs[x] * amp); g.fillStyle = top; g.fillRect(x, y, 1, 1); }
  }

  function clouds(g, spec, H) {
    const r = rng(spec.seed || 7), n = spec.n || 7;
    for (let i = 0; i < n; i++) {
      const cx = (i + r() * 0.6) * LW / n, cy = spec.y[0] + r() * (spec.y[1] - spec.y[0]), w = 30 + r() * 50;
      for (let dx = -LW; dx <= LW; dx += LW) {            // wrap at the seam
        if (cx + dx + w * 1.4 < 0 || cx + dx - w * 1.4 > LW) continue;
        const X = cx + dx;
        ellipse(g, X, cy + 3, w, 6, spec.shade);
        for (let k = 0; k < 5; k++) ellipse(g, X - w * 0.6 + k * w * 0.3, cy - (k % 2) * 4 - 2, w * 0.32, 7 + (k % 2) * 3, spec.color);
        ellipse(g, X - w * 0.2, cy - 7, w * 0.3, 6, spec.hi || shade(spec.color, 0.4));
        rect(g, X - w, cy + 4, w * 2, 3, spec.shade);
      }
    }
  }
  function sun(g, s, H) {
    for (let k = 4; k >= 1; k--) ellipse(g, s.x, s.y, s.r + k * 6, s.r + k * 6, mix(s.glowTo || '#ffffff', s.glow, 0.25 + k * 0.15));
    // banded disc: hot core at the top, deeper toward the bottom
    for (let y = -s.r; y <= s.r; y++) {
      const t = (y + s.r) / (2 * s.r), hw = Math.sqrt(Math.max(0, s.r * s.r - y * y));
      if (s.stripes && t > 0.5 && Math.floor((y + s.r) / 3) % 3 === 0 && t < 0.97) continue;   // the synthwave slats
      g.fillStyle = mix(s.color, s.color2 || s.color, t);
      g.fillRect(Math.round(s.x - hw), Math.round(s.y + y), Math.round(hw * 2), 1);
    }
  }
  function moon(g, m) {
    for (let k = 3; k >= 1; k--) ellipse(g, m.x, m.y, m.r + k * 5, m.r + k * 5, mix('#000000', m.glow, 0.12 + 0.05 * (4 - k)));
    ellipse(g, m.x, m.y, m.r, m.r, m.color);
    ellipse(g, m.x + m.r * 0.3, m.y - m.r * 0.2, m.r * 0.25, m.r * 0.22, shade(m.color, -0.12));
    ellipse(g, m.x - m.r * 0.35, m.y + m.r * 0.3, m.r * 0.18, m.r * 0.16, shade(m.color, -0.12));
    ellipse(g, m.x - m.r * 0.1, m.y - m.r * 0.45, m.r * 0.12, m.r * 0.1, shade(m.color, -0.1));
  }
  function stars(g, H, seed, n) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * LW, y = r() * H * 0.75, b = r();
      px(g, x, y, b > 0.9 ? '#ffffff' : b > 0.5 ? '#c8d0ff' : '#7a80c0');
      if (b > 0.97) { px(g, x - 1, y, '#8a90d0'); px(g, x + 1, y, '#8a90d0'); px(g, x, y - 1, '#8a90d0'); px(g, x, y + 1, '#8a90d0'); }
    }
  }
  function aurora(g, H) {
    const hs = ridge(41, 1.2);
    for (let x = 0; x < LW; x++) {
      const top = 10 + hs[x] * 30, len = 30 + hs[(x * 3) % LW] * 30;
      for (let y = 0; y < len; y++) {
        const t = y / len, dens = (1 - t) * (0.35 + 0.65 * Math.abs(Math.sin(x * 0.05 + hs[x] * 6)));
        if (Px.BAYER[((Math.round(top + y) & 3) << 2) | (x & 3)] < dens * 16) px(g, x, top + y, t < 0.3 ? '#8affc8' : t < 0.7 ? '#3cd890' : '#7a5aff');
      }
    }
  }

  // ---------------------------------------------------------------- far layers
  function farLayer(spec, H) {
    return make(LW, H, (g) => {
      const k = spec.kind;
      if (k === 'mountains' || k === 'peaks' || k === 'volcano' || k === 'coast') {
        const back = ridge(spec.seed || 1, 0.8), front = ridge((spec.seed || 1) + 5, 1.0);
        fillRidge(g, back, H, k === 'coast' ? 0 : 6, H * (k === 'peaks' ? 0.95 : 0.7), spec.cols[0], shade(spec.cols[0], 0.2));
        if (spec.snow) for (let x = 0; x < LW; x++) { const top = Math.round(H - 6 - back[x] * H * 0.95 * (k === 'peaks' ? 1 : 0.74)); if (back[x] > 0.55) rect(g, x, top, 1, Math.round((back[x] - 0.5) * 22), spec.snow); }
        fillRidge(g, front, H, 0, H * (k === 'peaks' ? 0.6 : 0.45), spec.cols[1], shade(spec.cols[1], 0.15));
        if (k === 'coast') {         // headlands only on parts of the strip: carve open sea elsewhere
          g.globalCompositeOperation = 'destination-out';
          const sea = ridge(77, 1.0);
          for (let x = 0; x < LW; x++) if (sea[x] < 0.45) g.fillRect(x, 0, 1, H);
          g.globalCompositeOperation = 'source-over';
          for (let x = 0; x < LW; x++) if (sea[x] >= 0.45 && sea[x] < 0.5) { rect(g, x, H - 3, 1, 3, spec.cols[1]); }
          // a far-off city glittering on one headland
          if (spec.city) { const r = rng(12); for (let i = 0; i < 26; i++) { const x = 520 + i * 5 + r() * 3, h = 6 + r() * 14; rect(g, x, H - h - 4, 4, h, spec.city); if (r() < 0.6) px(g, x + 1, H - h - 1, '#ffe8a0'); } }
        }
        if (k === 'volcano') {
          const vx = spec.vx || 520, vh = H * 0.98;
          poly(g, [[vx - 150, H], [vx - 24, H - vh], [vx + 24, H - vh], [vx + 150, H]], spec.cols[2] || shade(spec.cols[1], -0.2));
          poly(g, [[vx - 150, H], [vx - 24, H - vh], [vx - 8, H - vh], [vx - 60, H]], shade(spec.cols[2] || spec.cols[1], 0.12));
          for (let i = 0; i < 5; i++) stroke(g, [[vx - 10 + i * 5, H - vh + 1], [vx - 30 + i * 14, H - vh + 26 + i * 6]], 0.8, i % 2 ? '#ff5a1c' : '#ffb43c');
          for (let i = 0; i < 7; i++) ellipse(g, vx + 6 + i * 8, H - vh - 8 - i * 9, 9 + i * 2, 6 + i, mix('#5a4a5a', spec.smoke || '#c8a0b0', i / 7));
        }
      } else if (k === 'mesas') {
        const r = rng(spec.seed || 3);
        fillRidge(g, ridge(9, 1.2), H, 0, H * 0.25, spec.cols[0]);
        for (let i = 0; i < 9; i++) {
          const x = i * LW / 9 + r() * 40, w = 40 + r() * 70, h = H * (0.35 + r() * 0.55), top = H - h;
          const pts = [[x - 10, H], [x, top + 6], [x + 6, top], [x + w - 6, top], [x + w, top + 8], [x + w + 12, H]];
          for (const dx of [0, -LW]) {
            poly(g, pts.map((p) => [p[0] + dx, p[1]]), spec.cols[1]);
            poly(g, [[x + dx + w * 0.55, top], [x + w - 6 + dx, top], [x + w + dx, top + 8], [x + w + 12 + dx, H], [x + w * 0.6 + dx, H]], spec.cols[2]);
            for (let s = top + 10; s < H; s += 7) rect(g, x + dx + 2, s, w + 2, 1, shade(spec.cols[1], -0.12));
          }
        }
      } else if (k === 'skyline') {
        const r = rng(spec.seed || 5);
        for (let layer = 0; layer < 2; layer++) {
          let x = -20;
          while (x < LW) {
            const w = 16 + r() * 30, h = (layer ? 0.25 : 0.45) * H + r() * H * (layer ? 0.4 : 0.5), col = spec.cols[layer];
            rect(g, x, H - h, w, h, col);
            if (r() < 0.25) { rect(g, x + w / 2 - 1, H - h - 10, 2, 10, col); if (spec.lit) px(g, x + w / 2 - 1, H - h - 11, '#ff3c3c'); }
            if (r() < 0.2) poly(g, [[x, H - h], [x + w / 2, H - h - 12], [x + w, H - h]], col);
            if (spec.lit) for (let wy = H - h + 4; wy < H - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < (layer ? 0.35 : 0.22)) px(g, wx, wy, r() < 0.8 ? spec.lit : '#8ae0ff');
            x += w + (layer ? 1 : 6 + r() * 20);
          }
        }
        if (spec.neon) for (let i = 0; i < 8; i++) { const x = r() * LW, y = H * 0.5 + r() * H * 0.4; rect(g, x, y, 10 + r() * 14, 2, spec.neon[i % spec.neon.length]); }
      }
    });
  }

  // ---------------------------------------------------------------- near layers
  function nearLayer(spec, H) {
    return make(LW, H, (g) => {
      const k = spec.kind, r = rng(spec.seed || 2);
      if (k === 'hills' || k === 'dunes' || k === 'snowHills' || k === 'jungle') {
        const hs = ridge(spec.seed || 2, k === 'jungle' ? 0.5 : 1.3);
        fillRidge(g, hs, H, 2, H * 0.75, spec.cols[0], spec.cols[1]);
        if (k === 'dunes') for (let x = 0; x < LW; x += 2) { const y = Math.round(H - 2 - hs[x] * H * 0.75); if (hs[(x + 6) % LW] < hs[x]) rect(g, x, y, 2, 6, spec.cols[1]); }
        if (spec.trees) for (let i = 0; i < 70; i++) {
          const x = r() * LW, y = H - 2 - hs[Math.floor(x)] * H * 0.75;
          if (k === 'jungle') ellipse(g, x, y + 2, 6 + r() * 6, 5 + r() * 4, spec.trees);
          else if (k === 'snowHills') { poly(g, [[x, y - 10], [x + 4, y + 2], [x - 4, y + 2]], spec.trees); px(g, x, y - 9, '#ffffff'); }
          else ellipse(g, x, y, 3 + r() * 3, 3 + r() * 2, spec.trees);
        }
        if (k === 'snowHills') for (let x = 0; x < LW; x++) { const y = Math.round(H - 2 - hs[x] * H * 0.75); rect(g, x, y, 1, 2, '#ffffff'); }
      } else if (k === 'treeline') {
        const hs = ridge(spec.seed || 4, 1.1);
        fillRidge(g, hs, H, 0, H * 0.25, spec.cols[0]);
        for (let x = -10; x < LW + 10; x += 5 + r() * 4) {
          const base = H - hs[Math.max(0, Math.min(LW - 1, Math.floor(x)))] * H * 0.25, h = H * (0.35 + r() * 0.55);
          poly(g, [[x, base - h], [x + 7, base + 1], [x - 7, base + 1]], r() < 0.5 ? spec.cols[0] : spec.cols[1]);
          if (spec.snow) poly(g, [[x, base - h], [x + 2, base - h + 6], [x - 2, base - h + 6]], spec.snow);
        }
      } else if (k === 'palms') {
        const hs = ridge(spec.seed || 6, 1.4);
        fillRidge(g, hs, H, 0, H * 0.25, spec.cols[0]);
        for (let i = 0; i < 26; i++) {
          const x = r() * LW, h = H * (0.5 + r() * 0.45), lean = (r() - 0.5) * 8;
          stroke(g, [[x, H], [x + lean, H - h]], 0.8, spec.cols[1]);
          for (let f = 0; f < 6; f++) { const a = -Math.PI + f * Math.PI / 5; stroke(g, Px.curve(x + lean, H - h, x + lean + Math.cos(a) * 6, H - h - 4, x + lean + Math.cos(a) * 11, H - h + 4 + Math.abs(Math.sin(a)) * 2, 6), 0.6, spec.cols[1]); }
        }
      } else if (k === 'city') {
        let x = 0;
        while (x < LW) {
          const w = 20 + r() * 40, h = H * (0.3 + r() * 0.7);
          rect(g, x, H - h, w, h, spec.cols[r() < 0.5 ? 0 : 1]);
          if (spec.lit) for (let wy = H - h + 3; wy < H - 2; wy += 5) for (let wx = x + 3; wx < x + w - 3; wx += 4) if (r() < 0.3) rect(g, wx, wy, 2, 2, r() < 0.85 ? spec.lit : spec.lit2 || '#8ae0ff');
          x += w + 2 + r() * 10;
        }
      }
    });
  }

  function build(theme) {
    const B = theme.bg, HZ = Road.HORIZON;
    const out = { ground: B.ground || theme.colors.grass1 };
    out.sky = make(400, HZ, (g) => vgrad(g, 0, 0, 400, HZ, B.sky, 28));
    out.cel = make(LW, HZ, (g) => {
      if (B.stars) stars(g, HZ, 3, B.stars);
      if (B.aurora) aurora(g, HZ);
      if (B.sun) sun(g, B.sun, HZ);
      if (B.moon) moon(g, B.moon);
      if (B.clouds) clouds(g, B.clouds, HZ);
    });
    out.far = B.far ? farLayer(B.far, B.far.h) : null;
    out.near = B.near ? nearLayer(B.near, B.near.h) : null;
    return out;
  }
  return { get(theme) { return cache[theme.id] || (cache[theme.id] = build(theme)); }, LW };
})();
