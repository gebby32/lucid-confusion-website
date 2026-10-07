/* GFX — crisp pixel drawing on the 384x216 game canvas (no anti-aliasing ever):
   rects, row-filled ellipses, thick lines, string-art sprites, mirrored / rotated copies,
   silhouettes and coloured particles. */
'use strict';
const G = {
  get ctx() { return LP.LCD.ctx; },
  W: 384, H: 216,

  rect(x, y, w, h, c) { const g = LP.LCD.ctx; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
  px(x, y, c) { const g = LP.LCD.ctx; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
  frame(x, y, w, h, c) { G.rect(x, y, w, 1, c); G.rect(x, y + h - 1, w, 1, c); G.rect(x, y, 1, h, c); G.rect(x + w - 1, y, 1, h, c); },

  // filled ellipse, one rect per row — always crisp
  ellipse(cx, cy, rx, ry, c, g) {
    g = g || LP.LCD.ctx; g.fillStyle = c;
    const top = Math.round(cy - ry), bot = Math.round(cy + ry);
    for (let y = top; y <= bot; y++) {
      const t = (y + 0.5 - cy) / (ry + 0.5);
      if (t < -1 || t > 1) continue;
      const hw = (rx + 0.5) * Math.sqrt(1 - t * t);
      const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
    }
  },

  // thick line made of square stamps (beams, trails, flames)
  stroke(x0, y0, x1, y1, r0, r1, c, g) {
    g = g || LP.LCD.ctx; g.fillStyle = c;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = r0 + (r1 - r0) * t, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const d = Math.max(1, Math.round(r * 2));
      g.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d);
    }
  },

  line(x0, y0, x1, y1, c, g) {
    g = g || LP.LCD.ctx; g.fillStyle = c;
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
  // Procedural sprite: fn(g) draws into a fresh w x h canvas.
  make(w, h, fn) { const c = G.canvas(w, h); fn(c.getContext('2d'), c); return c; },
  mirror(src) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  },
  // exact quarter-turn rotation (q = 0..3, clockwise)
  rotate(src, q) {
    q = ((q % 4) + 4) % 4;
    if (!q) return src;
    const sw = src.width, sh = src.height, odd = q % 2;
    const c = G.canvas(odd ? sh : sw, odd ? sw : sh), g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.rotate(q * Math.PI / 2); g.drawImage(src, -sw / 2, -sh / 2);
    return c;
  },
  flipV(src) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0);
    return c;
  },
  silhouette(src, color) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  },
  // sprite + its mirror, so drawing facing left costs nothing
  pair(src) { return [src, G.mirror(src)]; },

  draw(img, x, y, flip) { LP.LCD.ctx.drawImage(flip ? img.m || (img.m = G.mirror(img)) : img, Math.round(x), Math.round(y)); },

  // coloured particles on top of LP.FX
  burst(x, y, n, color, o) {
    LP.FX.burst(x, y, n, Object.assign({ speed: 1.6, life: 24, color, draw: G._part }, o));
  },
  dust(x, y, n, color, o) {
    LP.FX.dust(x, y, n, Object.assign({ color: color || '#b8a890', draw: G._part, size: 1 }, o));
  },
  _part(ctx, p, x, y) { ctx.fillStyle = p.color; const s = p.size || 1; ctx.fillRect(Math.round(x - (s >> 1)), Math.round(y - (s >> 1)), s, s); },

  // a little speech bubble (3x5 text)
  bubble(x, y, text, dir) {
    const w = Font.width(text, 'small') + 6, h = 10;
    let bx = Math.round(dir < 0 ? x - w : x), by = Math.round(y - h);
    bx = LP.clamp(bx, 2, G.W - w - 2); by = Math.max(20, by);
    G.rect(bx + 1, by, w - 2, h, '#fff'); G.rect(bx, by + 1, w, h - 2, '#fff');
    const tx = LP.clamp(Math.round(x), bx + 2, bx + w - 3);
    G.rect(tx - (dir < 0 ? 0 : 1), by + h, 2, 1, '#fff'); G.px(tx + (dir < 0 ? 1 : -2), by + h + 1, '#fff');
    Font.draw(LP.LCD.ctx, text, bx + 3, by + 3, '#000', { face: 'small' });
  }
};
