/* PIXEL — crisp procedural pixel-art helpers used by every art builder.
   Everything is drawn with whole-pixel rects (no anti-aliasing): polygons are scanline
   filled, gradients are Bayer-dithered bands, strokes are square stamps.
   Px.rng(seed) gives a repeatable random stream so the art is identical every load. */
'use strict';
const Px = (function () {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function rng(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hex = (r, g, b) => '#' + ((1 << 24) | (LP.clamp(Math.round(r), 0, 255) << 16) | (LP.clamp(Math.round(g), 0, 255) << 8) | LP.clamp(Math.round(b), 0, 255)).toString(16).slice(1);
  function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  // k > 0 lightens toward white, k < 0 darkens toward black
  const shade = (c, k) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; }
  function make(w, h, fn) { const c = canvas(w, h); fn(c.getContext('2d'), c); return c; }

  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function px(g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }

  // scanline polygon fill: pts = [[x, y], ...]
  function poly(g, pts, c) {
    g.fillStyle = c;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    y0 = Math.floor(y0); y1 = Math.ceil(y1);
    const xs = [];
    for (let y = y0; y < y1; y++) {
      const sy = y + 0.5; xs.length = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a[1] > sy) !== (b[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
        if (xb > xa) g.fillRect(xa, y, xb - xa, 1);
      }
    }
  }
  function ellipse(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    const top = Math.round(cy - ry), bot = Math.round(cy + ry);
    for (let y = top; y <= bot; y++) {
      const t = (y + 0.5 - cy) / (ry + 0.5);
      if (t < -1 || t > 1) continue;
      const hw = (rx + 0.5) * Math.sqrt(1 - t * t);
      const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
    }
  }
  // thick polyline made of square stamps; r may be a number or [r0, r1] tapering along the line
  function stroke(g, pts, r, c) {
    g.fillStyle = c;
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let run = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L));
      for (let k = 0; k <= n; k++) {
        const t = k / n, f = total ? (run + L * t) / total : 0;
        const rr = Array.isArray(r) ? r[0] + (r[1] - r[0]) * f : r;
        const d = Math.max(1, Math.round(rr * 2));
        g.fillRect(Math.round(x0 + (x1 - x0) * t - d / 2), Math.round(y0 + (y1 - y0) * t - d / 2), d, d);
      }
      run += L;
    }
  }
  // quadratic bezier sampled into points
  function curve(x0, y0, cx, cy, x1, y1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
    return out;
  }

  // Vertical gradient through colour stops [[t, '#hex'], ...], quantised to `levels` bands with a
  // 4x4 Bayer dither between neighbouring bands — the classic arcade sky.
  function vgrad(g, x, y, w, h, stops, levels) {
    levels = levels || 24;
    const img = g.createImageData(w, h), d = img.data;
    const cols = stops.map((s) => rgb(s[1]));
    const at = (t) => {
      let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      const a = stops[i][0], b = stops[i + 1][0], f = b > a ? LP.clamp((t - a) / (b - a), 0, 1) : 0;
      const A = cols[i], B = cols[i + 1];
      return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f];
    };
    const band = [];
    for (let i = 0; i <= levels; i++) band.push(at(i / levels));
    for (let yy = 0; yy < h; yy++) {
      const t = h > 1 ? yy / (h - 1) : 0, f = t * levels, i0 = Math.min(levels - 1, Math.floor(f)), frac = f - i0;
      for (let xx = 0; xx < w; xx++) {
        const c = frac * 16 > BAYER[((yy & 3) << 2) | (xx & 3)] ? band[i0 + 1] : band[i0];
        const p = (yy * w + xx) * 4;
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
      }
    }
    g.putImageData(img, x, y);
  }
  // ordered-dither a rect with colour c at density 0..1
  function dither(g, x, y, w, h, c, density) {
    g.fillStyle = c;
    const lv = Math.round(density * 16);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (BAYER[(((y + yy) & 3) << 2) | ((x + xx) & 3)] < lv) g.fillRect(x + xx, y + yy, 1, 1);
  }
  // 3x5 text (Plumbing's face) drawn straight into an art canvas
  function tiny(g, str, x, y, c, sc) {
    sc = sc || 1; g.fillStyle = c;
    for (const ch of String(str).toUpperCase()) {
      const gl = LP.LCD.FONT[ch];
      if (gl) for (let r = 0; r < 5; r++) { const bits = +gl[r]; for (let k = 0; k < 3; k++) if (bits & (4 >> k)) g.fillRect(x + k * sc, y + r * sc, sc, sc); }
      x += 4 * sc;
    }
  }
  const tinyW = (str, sc) => (String(str).length * 4 - 1) * (sc || 1);

  // a fresh copy of a canvas. Canvases read back with getImageData drop to slow CPU memory in
  // most browsers; a copy that is never read stays GPU-fast for drawing every frame.
  function fresh(src) { const c = canvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); if (src.foot) c.foot = src.foot; return c; }

  // darken / tint an existing canvas (night versions of day sprites)
  function tinted(src, color, amount) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, T = rgb(color);
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      p[i] += (T[0] - p[i]) * amount; p[i + 1] += (T[1] - p[i + 1]) * amount; p[i + 2] += (T[2] - p[i + 2]) * amount;
    }
    g.putImageData(d, 0, 0);
    return fresh(c);
  }
  // multiply-style night shading that keeps very bright pixels (lit windows, neon, lamps) glowing
  function night(src, color, amount, keep) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, T = rgb(color), K = keep === undefined ? 600 : keep;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      if (p[i] + p[i + 1] + p[i + 2] >= K) continue;
      p[i] = p[i] * (1 - amount) + T[0] * amount * p[i] / 255 + T[0] * amount * 0.25;
      p[i + 1] = p[i + 1] * (1 - amount) + T[1] * amount * p[i + 1] / 255 + T[1] * amount * 0.25;
      p[i + 2] = p[i + 2] * (1 - amount) + T[2] * amount * p[i + 2] / 255 + T[2] * amount * 0.25;
    }
    g.putImageData(d, 0, 0);
    return fresh(c);
  }
  function mirror(src) { const c = canvas(src.width, src.height), g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
  // 1px dark outline around every opaque pixel (sprites read better on busy roads)
  function outline(src, color) {
    const w = src.width + 2, h = src.height + 2, c = canvas(w, h), g = c.getContext('2d');
    const s = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
    g.fillStyle = color;
    const on = (x, y) => x >= 0 && y >= 0 && x < src.width && y < src.height && s[(y * src.width + x) * 4 + 3] > 0;
    for (let y = -1; y <= src.height; y++) for (let x = -1; x <= src.width; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
    }
    g.drawImage(src, 1, 1);
    return c;
  }

  return { BAYER, rng, rgb, hex, mix, shade, canvas, make, rect, px, poly, ellipse, stroke, curve, vgrad, dither, tiny, tinyW, tinted, night, mirror, outline, fresh };
})();
