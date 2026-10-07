/* GFX — crisp pixel drawing for the 320x240 retro picture (no anti-aliasing ever).
   G.g is the current target context: the game world draws into LP.LCD.ctx, the HUD /
   text layer (drawn in front of the hi-res sloths) draws into G.fg. Use G.to(ctx, fn).
   String-art sprites, mirrored copies, silhouettes, recolours, particles. */
'use strict';
const G = {
  W: 320, H: 240, T: 16,
  g: null,                                  // current target (set in main.js)
  fg: null, fgc: null,                      // front layer canvas / context (HUD, text)

  to(ctx, fn) { const old = G.g; G.g = ctx; try { fn(); } finally { G.g = old; } },

  rect(x, y, w, h, c) { const g = G.g; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
  px(x, y, c) { const g = G.g; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
  frame(x, y, w, h, c) { G.rect(x, y, w, 1, c); G.rect(x, y + h - 1, w, 1, c); G.rect(x, y, 1, h, c); G.rect(x + w - 1, y, 1, h, c); },

  // filled ellipse, one rect per row — always crisp
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
  // 1px ring (pixel circle outline)
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
  disc(cx, cy, r, c, g) { G.ellipse(cx, cy, r, r, c, g); },

  // thick line made of square stamps
  stroke(x0, y0, x1, y1, r0, r1, c, g) {
    g = g || G.g; g.fillStyle = c;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = r0 + (r1 - r0) * t, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const d = Math.max(1, Math.round(r * 2));
      g.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d);
    }
  },
  line(x0, y0, x1, y1, c, g) {
    g = g || G.g; g.fillStyle = c;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 1000; n++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },

  canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; },

  // String-art sprite: rows of characters, pal maps char -> colour ('.' / ' ' = clear).
  sprite(rows, pal) {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    const c = G.canvas(w, h), g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  },
  make(w, h, fn) { const c = G.canvas(w, h); fn(c.getContext('2d'), c); return c; },
  mirror(src) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  },
  flipV(src) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0);
    return c;
  },
  rotate(src, q) {
    q = ((q % 4) + 4) % 4;
    if (!q) return src;
    const sw = src.width, sh = src.height, odd = q % 2;
    const c = G.canvas(odd ? sh : sw, odd ? sw : sh), g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.rotate(q * Math.PI / 2); g.drawImage(src, -sw / 2, -sh / 2);
    return c;
  },
  silhouette(src, color) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  },
  // pixel-exact recolour: map of '#rrggbb' -> '#rrggbb'
  recolor(src, map) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    const m = {};
    for (const k in map) m[parseInt(k.slice(1), 16)] = parseInt(map[k].slice(1), 16);
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const v = (p[i] << 16) | (p[i + 1] << 8) | p[i + 2], to = m[v];
      if (to !== undefined) { p[i] = to >> 16; p[i + 1] = (to >> 8) & 255; p[i + 2] = to & 255; }
    }
    g.putImageData(d, 0, 0);
    return c;
  },
  // tint every opaque pixel toward a colour (amount 0..1), keeping darks dark
  tint(src, color, amount) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, n = parseInt(color.slice(1), 16);
    const tr = n >> 16, tg = (n >> 8) & 255, tb = n & 255;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const l = (p[i] * 77 + p[i + 1] * 150 + p[i + 2] * 29) >> 8;
      if (l < 40) continue;
      p[i] = Math.round(p[i] + (tr * l / 255 - p[i]) * amount);
      p[i + 1] = Math.round(p[i + 1] + (tg * l / 255 - p[i + 1]) * amount);
      p[i + 2] = Math.round(p[i + 2] + (tb * l / 255 - p[i + 2]) * amount);
    }
    g.putImageData(d, 0, 0);
    return c;
  },

  mirrorIf(img, flip) { return flip ? img.m || (img.m = G.mirror(img)) : img; },
  draw(img, x, y, flip) { G.g.drawImage(flip ? img.m || (img.m = G.mirror(img)) : img, Math.round(x), Math.round(y)); },
  // draw centred on (x, y)
  drawC(img, x, y, flip) { G.draw(img, x - (img.width >> 1), y - (img.height >> 1), flip); },

  // coloured particles on top of LP.FX
  burst(x, y, n, color, o) { LP.FX.burst(x, y, n, Object.assign({ speed: 1.6, life: 24, color, draw: G._part }, o)); },
  dust(x, y, n, color, o) { LP.FX.dust(x, y, n, Object.assign({ color: color || '#d8d0c0', draw: G._part, size: 1 }, o)); },
  _part(ctx, p, x, y) {
    ctx.fillStyle = p.colors ? p.colors[(p.t >> 2) % p.colors.length] : p.color;
    const s = p.size || 1; ctx.fillRect(Math.round(x - (s >> 1)), Math.round(y - (s >> 1)), s, s);
  },

  // text helpers (8x8 'big' face / 3x5 'small' face)
  text(str, x, y, color, o) { return Font.draw(G.g, str, x, y, color, o); },
  textC(str, x, y, color, o) { return Font.draw(G.g, str, x, y, color, Object.assign({ align: 'center' }, o)); },

  // NES-style window: dark fill + double border
  panel(x, y, w, h, fill, edge) {
    G.rect(x, y, w, h, fill || '#000');
    G.frame(x + 1, y + 1, w - 2, h - 2, edge || '#fcfcfc');
    G.frame(x + 3, y + 3, w - 6, h - 6, edge || '#fcfcfc');
  }
};
