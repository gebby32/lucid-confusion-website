/* SLOTH — the frog-costume sloth, rendered at FULL MONITOR RESOLUTION over the retro picture.
   The four supplied renders are the definitive look; tools/make-sloth-sprites.py only keyed
   out their backdrops into assets/sloth/*.png (the originals are untouched).
     up = back view   down = front view   left / right = the side renders
   Each frame the game queues draw requests in GAME pixels; LP.LCD.post (see main.js) calls
   Sloth.flush(octx, k) after the pixel picture has been scaled up, so the sloth stays
   ridiculously sharp while the world stays chunky. Only gentle transforms are used:
   hop stretch, squash, tilt, sink, spin, fade.

   Sloth.queue({ dir, x, y (feet), h, sx, sy, rot, alpha, white, clipY })
     clipY: game-pixel line below which nothing is drawn (sinking into water)
   Sloth.flush(octx, k, ox, oy)   draws and clears the queue */
'use strict';
const Sloth = (function () {
  const DIRS = ['up', 'down', 'left', 'right'];
  const SRC = {
    up: LP.loadImage('assets/sloth/up.png'),
    down: LP.loadImage('assets/sloth/down.png'),
    left: LP.loadImage('assets/sloth/left.png'),
    right: LP.loadImage('assets/sloth/right.png')
  };
  // from tools/make-sloth-sprites.py: sprite size and feet centre (fraction of the width)
  const META = {
    down: { w: 276, h: 480, feet: 0.51 },
    right: { w: 308, h: 480, feet: 0.4385 },
    left: { w: 314, h: 480, feet: 0.5382 },
    up: { w: 343, h: 480, feet: 0.509 }
  };
  const queue = [];
  const cache = {};
  const ready = (img) => img.complete && img.naturalWidth > 0;

  // High-quality downscale by repeated halving (much nicer than one big drawImage step).
  function scaled(dir, px) {
    const src = SRC[dir];
    if (!ready(src)) return null;
    if (px >= src.naturalHeight * 0.7) return { img: src, white: whiteOf(dir + 'src', src) };
    const bucket = Math.max(16, Math.ceil(px / 8) * 8);
    const key = dir + ':' + bucket;
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
    DIRS,
    queue(d) { queue.push(d); },
    clear() { queue.length = 0; },
    width(dir, h) { const m = META[dir]; return (h || GAME_CONFIG.sloth.drawH) * m.w / m.h; },

    flush(octx, k, ox, oy) {
      ox = ox || 0; oy = oy || 0;
      octx.save();
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      for (const d of queue) S.drawOne(octx, k, d, ox, oy);
      octx.restore();
      queue.length = 0;
    },

    drawOne(octx, k, d, ox, oy) {
      const dir = META[d.dir] ? d.dir : 'down', h = d.h || GAME_CONFIG.sloth.drawH;
      const m = META[dir], w = h * m.w / m.h;
      const sc = scaled(dir, h * k * Math.max(1, d.sy || 1) * 1.05);
      if (!sc) return;
      octx.save();
      if (d.clipY !== undefined) { octx.beginPath(); octx.rect(0, 0, octx.canvas.width, (d.clipY + oy) * k); octx.clip(); }
      octx.globalAlpha = d.alpha === undefined ? 1 : Math.max(0, d.alpha);
      octx.translate((d.x + ox) * k, (d.y + oy) * k);
      if (d.rot) octx.rotate(d.rot);
      octx.scale(d.sx || 1, d.sy || 1);
      const dx = -m.feet * w * k, dy = -h * k, dw = w * k, dh = h * k;
      octx.drawImage(sc.img, dx, dy, dw, dh);
      if (d.white > 0) { octx.globalAlpha *= Math.min(1, d.white); octx.drawImage(sc.white, dx, dy, dw, dh); }
      octx.restore();
    },

    loaded() { return DIRS.every((d) => ready(SRC[d])); }
  };
  return S;
})();
