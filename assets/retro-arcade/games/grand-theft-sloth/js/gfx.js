/* GFX — crisp pixel drawing for the 480x360 picture (shared kit with the sibling games).
   G.g is the current target context. Everything snaps to whole pixels.
   Also: seeded random, rotated "vector -> crisp pixel" baking used by every sprite. */
'use strict';
const G = {
  W: 480, H: 360,
  g: null,
  fg: null, fgc: null,

  to(ctx, fn) { const old = G.g; G.g = ctx; try { fn(); } finally { G.g = old; } },

  rect(x, y, w, h, c) { const g = G.g; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
  px(x, y, c) { const g = G.g; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
  frame(x, y, w, h, c) { G.rect(x, y, w, 1, c); G.rect(x, y + h - 1, w, 1, c); G.rect(x, y, 1, h, c); G.rect(x + w - 1, y, 1, h, c); },

  ellipse(cx, cy, rx, ry, c, g) {
    g = g || G.g; g.fillStyle = c;
    const top = Math.round(cy - ry), bot = Math.round(cy + ry);
    for (let y = top; y <= bot; y++) {
      const t = (y + 0.5 - cy) / (ry + 0.5);
      if (t < -1 || t > 1) continue;
      const hw = (rx + 0.5) * Math.sqrt(1 - t * t);
      const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
    }
  },
  disc(cx, cy, r, c, g) { G.ellipse(cx, cy, r, r, c, g); },
  ring(cx, cy, r, c, g) {
    g = g || G.g; g.fillStyle = c;
    let x = Math.round(r), y = 0, err = 1 - x;
    cx = Math.round(cx); cy = Math.round(cy);
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) g.fillRect(cx + a, cy + b, 1, 1);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  },
  line(x0, y0, x1, y1, c, g) {
    g = g || G.g; g.fillStyle = c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 2000; n++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  // filled polygon (anti-aliasing is fine for walls; they are flat colour)
  poly(pts, c, g) {
    g = g || G.g; g.fillStyle = c; g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  },

  canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); c.getContext('2d').imageSmoothingEnabled = false; return c; },
  make(w, h, fn) { const c = G.canvas(w, h); const g = c.getContext('2d'); fn(g, c); return c; },

  // Draw vector shapes rotated by `angle` into a w x h canvas centred on (0,0), then snap
  // alpha to 0/255 so the result is crisp pixel art at any angle.
  bake(w, h, angle, fn) {
    const c = G.canvas(w, h), g = c.getContext('2d');
    g.save(); g.translate(w / 2, h / 2); g.rotate(angle); fn(g); g.restore();
    const d = g.getImageData(0, 0, w, h), p = d.data;
    for (let i = 3; i < p.length; i += 4) p[i] = p[i] < 110 ? 0 : 255;
    g.putImageData(d, 0, 0);
    return c;
  },
  silhouette(src, color) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  },
  // darken / tint every opaque pixel (burnt wrecks)
  tint(src, color, amount) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = amount; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  },
  drawC(img, x, y) { G.g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); },

  text(str, x, y, color, o) { return Font.draw(G.g, str, x, y, color, o); },
  textC(str, x, y, color, o) { return Font.draw(G.g, str, x, y, color, Object.assign({ align: 'center' }, o)); },
  panel(x, y, w, h, fill, edge) {
    G.rect(x, y, w, h, fill || '#000');
    G.frame(x + 1, y + 1, w - 2, h - 2, edge || '#fcfcfc');
  },
  // word-wrap for the 'small' (3x5) or 'big' face; returns lines
  wrap(str, maxW, face) {
    const cell = face === 'big' ? 8 : 4, max = Math.max(1, Math.floor((maxW + 1) / cell));
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        if (!line.length) line = w;
        else if ((line + ' ' + w).length <= max) line += ' ' + w;
        else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  }
};

// small deterministic RNG (mulberry32) so the city is identical every time
function RNG(seed) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.range = (lo, hi) => lo + r() * (hi - lo);
  return r;
}

const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const dist2 = (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
const fmtMoney = (n) => '$' + Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
