/* ART KIT — shaded pixel primitives shared by every sprite builder.
   All drawing is whole-pixel (no anti-aliasing). A sprite is built from shaded parts
   (blobs, limbs), then given a selective outline: every edge pixel gets a darker
   version of the colour it borders, the classic 16-bit sprite edge.
   Art.cache(key, fn) memoises built canvases. */
'use strict';
const Art = (function () {
  const C = Px.canvas;

  // rotated ellipse (polygon scanline fill); ang in radians
  function ell(g, cx, cy, rx, ry, ang, c) {
    if (rx <= 0 || ry <= 0) return;
    if (!ang) return Px.ellipse(g, cx, cy, rx, ry, c);
    const pts = [], n = 32, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, x = Math.cos(t) * (rx + 0.5), y = Math.sin(t) * (ry + 0.5);
      pts.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
    }
    Px.poly(g, pts, c);
  }
  // 3-tone shaded ball: ramp = [shadow, base, light]; light comes from the upper left
  function blob(g, cx, cy, rx, ry, ang, ramp) {
    ell(g, cx, cy, rx, ry, ang, ramp[0]);
    ell(g, cx - 0.6, cy - 0.8, rx - 0.9, ry - 0.9, ang, ramp[1]);
    if (ramp[2] && rx > 2.4 && ry > 2.4) ell(g, cx - rx * 0.32, cy - ry * 0.38, rx * 0.42, ry * 0.34, ang, ramp[2]);
  }
  // thick shaded limb through points
  function limb(g, pts, r, ramp) {
    Px.stroke(g, pts, r, ramp[0]);
    if (r >= 1.3) Px.stroke(g, pts.map((p) => [p[0] - 0.5, p[1] - 0.6]), Math.max(0.5, r - 0.75), ramp[1]);
  }
  function poly(g, pts, c) { Px.poly(g, pts, c); }
  function px(g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function line(g, x0, y0, x1, y1, c) {
    g.fillStyle = c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 400; n++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // polar helper: point at distance d, angle a (degrees) from (x, y)
  function pol(x, y, d, a) { const r = a * Math.PI / 180; return [x + Math.cos(r) * d, y + Math.sin(r) * d]; }

  // Selective outline: transparent pixels touching an opaque one take a darkened copy of its colour.
  // k = brightness kept (0.35 = dark edge). solid = fixed outline colour instead.
  function outline(src, k, solid) {
    k = k === undefined ? 0.38 : k;
    const w = src.width, h = src.height;
    const s = src.getContext('2d').getImageData(0, 0, w, h).data;
    const c = C(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    d.set(s);
    const S = solid ? Px.rgb(solid) : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (s[i + 3]) continue;
      let j = -1;
      if (x > 0 && s[i - 1]) j = i - 4;
      else if (x < w - 1 && s[i + 7]) j = i + 4;
      else if (y > 0 && s[i - w * 4 + 3]) j = i - w * 4;
      else if (y < h - 1 && s[i + w * 4 + 3]) j = i + w * 4;
      if (j < 0) continue;
      if (S) { d[i] = S[0]; d[i + 1] = S[1]; d[i + 2] = S[2]; }
      else { d[i] = s[j] * k + 6; d[i + 1] = s[j + 1] * k + 2; d[i + 2] = s[j + 2] * k + 8; }
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return Px.fresh(c);
  }

  // nearest-neighbour rotation about (px, py); returns { c, ox, oy } where (ox, oy) is the pivot in c
  function rotate(src, ang, pvx, pvy) {
    const w = src.width, h = src.height;
    const R = Math.ceil(Math.max(Math.hypot(pvx, pvy), Math.hypot(w - pvx, pvy), Math.hypot(pvx, h - pvy), Math.hypot(w - pvx, h - pvy))) + 1;
    const S = R * 2, c = C(S, S), g = c.getContext('2d');
    const s = src.getContext('2d').getImageData(0, 0, w, h).data, img = g.createImageData(S, S), d = img.data;
    const ca = Math.cos(-ang), sa = Math.sin(-ang);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R;
      const sx = Math.floor(pvx + dx * ca - dy * sa), sy = Math.floor(pvy + dx * sa + dy * ca);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      const i = (sy * w + sx) * 4;
      if (!s[i + 3]) continue;
      const o = (y * S + x) * 4;
      d[o] = s[i]; d[o + 1] = s[i + 1]; d[o + 2] = s[i + 2]; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { c: Px.fresh(c), ox: R, oy: R };
  }

  // flash / silhouette copies (hit flash white, shadow)
  function silhouette(src, color) {
    const c = C(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  const store = new Map();
  function cache(key, fn) { let v = store.get(key); if (!v) { v = fn(); store.set(key, v); } return v; }

  // A sprite frame with an anchor: { c, m (mirrored, lazy), ax, ay, w, h }
  function frame(c, ax, ay) { return { c, m: null, ax, ay, w: c.width, h: c.height }; }
  function mirrored(f) { return f.m || (f.m = Px.mirror(f.c)); }
  function white(f) { return f.wh || (f.wh = silhouette(f.c, '#ffffff')); }
  function whiteM(f) { return f.whm || (f.whm = Px.mirror(white(f))); }
  // draw frame f with its anchor at (x, y). flip mirrors (anchor mirrored too). o: { white, alpha }
  function draw(g, f, x, y, flip, o) {
    let img = flip ? mirrored(f) : f.c;
    if (o && o.white) img = flip ? whiteM(f) : white(f);
    const ax = flip ? f.w - f.ax : f.ax;
    g.drawImage(img, Math.round(x - ax), Math.round(y - f.ay));
  }
  // build a frame by drawing with fn(g, w, h) and outlining
  function build(w, h, ax, ay, fn, k) {
    const c = C(w, h);
    fn(c.getContext('2d'), w, h);
    return frame(k === false ? Px.fresh(c) : outline(c, k), ax, ay);
  }

  return { ell, blob, limb, poly, px, rect, line, pol, outline, rotate, silhouette, cache, frame, draw, build, mirrored };
})();
