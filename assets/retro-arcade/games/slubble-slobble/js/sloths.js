/* SLOTHS — Slub and Slob, rendered at FULL MONITOR RESOLUTION over the NES picture.
   The four supplied character renders are the definitive look; tools/make-sloth-sprites.py
   only keyed out their backdrops into assets/sloths/*.png (the originals are untouched).
   Each frame the game queues draw requests in GAME pixels; LP.LCD.post (see main.js) calls
   Sloths.flush(octx, k) after the pixel picture has been scaled up, so the sloths stay
   ridiculously sharp. Only gentle transforms are used: bob, breathe, tilt, squash, recoil.

   Sloths.queue({ who:'slub'|'slob', dir:1|-1, x, y (feet), h, sx, sy, rot, alpha, white, glow })
   Sloths.flush(octx, k)   draws and clears the queue */
'use strict';
const Sloths = (function () {
  const SRC = {
    slub: { 1: LP.loadImage('assets/sloths/slub-right.png'), [-1]: LP.loadImage('assets/sloths/slub-left.png') },
    slob: { 1: LP.loadImage('assets/sloths/slob-right.png'), [-1]: LP.loadImage('assets/sloths/slob-left.png') }
  };
  // from tools/make-sloth-sprites.py (fractions of each sprite): body = feet centre x, muzzle = gun tip
  const META = {
    slub: { 1: { w: 371, h: 460, body: 0.494, muzzle: [0.995, 0.29] }, [-1]: { w: 372, h: 460, body: 0.511, muzzle: [0.005, 0.334] } },
    slob: { 1: { w: 346, h: 460, body: 0.493, muzzle: [0.993, 0.36] }, [-1]: { w: 347, h: 460, body: 0.5, muzzle: [0.007, 0.357] } }
  };
  const GLOW = { slub: ['rgba(255,255,240,0.95)', 'rgba(184,248,24,0.55)'], slob: ['rgba(255,240,250,0.95)', 'rgba(248,120,248,0.55)'] };
  const queue = [];
  const cache = {};

  const ready = (img) => img.complete && img.naturalWidth > 0;

  // High-quality downscale by repeated halving (much nicer than one big drawImage step).
  function scaled(who, dir, px) {
    const src = SRC[who][dir];
    if (!ready(src)) return null;
    if (px >= src.naturalHeight * 0.7) return { img: src, white: whiteOf(who + dir + 'src', src) };
    const bucket = Math.max(16, Math.ceil(px / 8) * 8);
    const key = who + dir + ':' + bucket;
    if (cache[key]) return cache[key];
    let cur = src, cw = src.naturalWidth, ch = src.naturalHeight;
    const tw = Math.round(cw * bucket / ch);
    while (ch / 2 >= bucket) {
      const c = document.createElement('canvas');
      c.width = Math.round(cw / 2); c.height = Math.round(ch / 2);
      const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(cur, 0, 0, c.width, c.height);
      cur = c; cw = c.width; ch = c.height;
    }
    const out = document.createElement('canvas'); out.width = tw; out.height = bucket;
    const g = out.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, tw, bucket);
    return (cache[key] = { img: out, white: whiteOf(key, out) });
  }
  function whiteOf(key, img) {
    const k = 'w:' + key;
    if (cache[k]) return cache[k];
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    return (cache[k] = c);
  }

  const S = {
    queue(d) { queue.push(d); },
    clear() { queue.length = 0; },
    // geometry of a render in game pixels (for placing bubbles at the gun's muzzle)
    muzzle(who, dir, x, y, h) {
      h = h || GAME_CONFIG.sloth.drawH;
      const m = META[who][dir], w = h * m.w / m.h;
      return [x + (m.muzzle[0] - m.body) * w, y - h + m.muzzle[1] * h];
    },
    width(who, dir, h) { const m = META[who][dir]; return (h || GAME_CONFIG.sloth.drawH) * m.w / m.h; },

    flush(octx, k, ox, oy) {
      ox = ox || 0; oy = oy || 0;
      octx.save();
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      for (const d of queue) S.drawOne(octx, k, d, ox, oy);
      octx.restore();
      queue.length = 0;
    },

    drawOne(octx, k, d, ox, oy) {
      const dir = d.dir < 0 ? -1 : 1, who = d.who, h = d.h || GAME_CONFIG.sloth.drawH;
      const m = META[who][dir], w = h * m.w / m.h;
      const sc = scaled(who, dir, h * k * Math.max(1, d.sy || 1) * 1.05);
      if (!sc) return;
      octx.save();
      octx.globalAlpha = d.alpha === undefined ? 1 : d.alpha;
      octx.translate((d.x + ox) * k, (d.y + oy) * k);
      if (d.rot) octx.rotate(d.rot);
      octx.scale(d.sx || 1, d.sy || 1);
      const dx = -m.body * w * k, dy = -h * k, dw = w * k, dh = h * k;
      octx.drawImage(sc.img, dx, dy, dw, dh);
      if (d.white > 0) { octx.globalAlpha *= Math.min(1, d.white); octx.drawImage(sc.white, dx, dy, dw, dh); }
      if (d.glow > 0) {
        // muzzle flash at the gun tip — the only light effect, also at full resolution
        const mx = dx + m.muzzle[0] * dw, my = dy + m.muzzle[1] * dh, r = h * k * 0.22 * (0.6 + d.glow * 0.6);
        const gr = octx.createRadialGradient(mx, my, 0, mx, my, r);
        gr.addColorStop(0, GLOW[who][0]); gr.addColorStop(0.35, GLOW[who][1]); gr.addColorStop(1, 'rgba(255,255,255,0)');
        octx.globalAlpha = Math.min(1, d.glow);
        octx.globalCompositeOperation = 'lighter';
        octx.fillStyle = gr; octx.fillRect(mx - r, my - r, r * 2, r * 2);
      }
      octx.restore();
    },

    loaded() { return ['slub', 'slob'].every((w) => ready(SRC[w][1]) && ready(SRC[w][-1])); }
  };
  return S;
})();
