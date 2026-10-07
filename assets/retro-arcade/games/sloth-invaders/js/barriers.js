/* BARRIERS — penguin ice bunkers (igloo-shaped, brick by frozen brick). Each keeps a
   per-pixel mask; every shot that touches one bites a crater out of it, and sloths
   marching through grind it away. Damage lasts for the wave. */
'use strict';
const Barriers = {
  list: [], W: 30, H: 17, Y: 152,
  CENTERS: [62, 148, 236, 322],

  build(damage) {
    Barriers.list = Barriers.CENTERS.map((cx) => Barriers.make(Math.round(cx - Barriers.W / 2), Barriers.Y));
    // later waves: the bunkers arrive already battered
    if (damage > 0) for (const b of Barriers.list) {
      const n = Math.round(damage * 40);
      for (let i = 0; i < n; i++) Barriers.carve(b, LP.randi(0, b.w - 1), LP.randi(0, b.h - 1), LP.chance(0.5) ? 1 : -1);
    }
  },

  make(x, y) {
    const w = Barriers.W, h = Barriers.H, c = G.canvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h), mask = new Uint8Array(w * h);
    const col = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    const ICE = col('#a8e6ff'), HI = col('#eefaff'), MORT = col('#4a98d8'), SHADE = col('#70bef0'), RIM = col('#2a6ab8');
    const cx = (w - 1) / 2;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      // igloo dome: top half of an ellipse sitting on the ground, with a door
      const dx = (px - cx) / (w / 2), dy = (h - 0.5 - py) / h;
      if (dx * dx + dy * dy > 1) continue;
      const ddx = (px - cx) / 4.6, ddy = (h - 0.5 - py) / 7.5;
      if (ddx * ddx + ddy * ddy < 1) continue;                        // entrance arch
      let c3 = ICE;
      const row = Math.floor((h - 1 - py) / 4), joint = (px + (row % 2) * 4) % 8 === 0;
      if ((h - 1 - py) % 4 === 3 || joint) c3 = MORT;
      else if (dx < -0.25 && dy > 0.45) c3 = HI;
      else if (dx > 0.45) c3 = SHADE;
      if (dx * dx + dy * dy > 0.86) c3 = RIM;                       // outline
      const i = py * w + px;
      mask[i] = 1;
      img.data.set([c3[0], c3[1], c3[2], 255], i * 4);
    }
    g.putImageData(img, 0, 0);
    return { x, y, w, h, c, g, img, mask, dirty: false };
  },

  // crater stamp around (lx, ly); dir -1 = hit from below (player), +1 = from above (sloths)
  CRATER: [
    '..#.#..',
    '.#####.',
    '#.###.#',
    '.#####.',
    '..###..',
    '.#.#.#.'
  ],
  carve(b, lx, ly, dir) {
    const C = Barriers.CRATER, oy = dir > 0 ? -1 : -4;
    for (let r = 0; r < C.length; r++) for (let q = 0; q < 7; q++) {
      if (C[dir > 0 ? r : C.length - 1 - r][q] !== '#' || Math.random() < 0.15) continue;
      Barriers.clear(b, lx + q - 3, ly + r + oy);
    }
  },
  clear(b, px, py) {
    if (px < 0 || py < 0 || px >= b.w || py >= b.h) return;
    const i = py * b.w + px;
    if (!b.mask[i]) return;
    b.mask[i] = 0; b.img.data[i * 4 + 3] = 0; b.dirty = true;
  },

  // Does a projectile column x0..x1 sweeping from yFrom to yTo touch ice? Returns the
  // first contact {b, lx, ly} in the direction of travel (so nothing tunnels through).
  sweep(x0, x1, yFrom, yTo) {
    const step = yTo >= yFrom ? 1 : -1;
    for (const b of Barriers.list) {
      if (x1 < b.x || x0 >= b.x + b.w) continue;
      const lo = Math.min(yFrom, yTo), hi = Math.max(yFrom, yTo);
      if (hi < b.y || lo >= b.y + b.h) continue;
      for (let y = Math.round(yFrom); step > 0 ? y <= yTo : y >= yTo; y += step) {
        const ly = y - b.y;
        if (ly < 0 || ly >= b.h) continue;
        for (let x = Math.round(x0); x <= x1; x++) {
          const lx = x - b.x;
          if (lx >= 0 && lx < b.w && b.mask[ly * b.w + lx]) return { b, lx, ly };
        }
      }
    }
    return null;
  },

  // sloths grinding through: wipe everything under a box
  erase(box) {
    const bx = Math.round(box.x), by = Math.round(box.y);
    for (const b of Barriers.list) {
      if (bx + box.w <= b.x || bx >= b.x + b.w || by + box.h <= b.y || by >= b.y + b.h) continue;
      for (let y = Math.max(0, by - b.y); y < Math.min(b.h, by + box.h - b.y); y++)
        for (let x = Math.max(0, bx - b.x); x < Math.min(b.w, bx + box.w - b.x); x++) Barriers.clear(b, x, y);
    }
  },

  draw() {
    const g = LP.LCD.ctx;
    for (const b of Barriers.list) {
      if (b.dirty) { b.g.putImageData(b.img, 0, 0); b.dirty = false; }
      g.drawImage(b.c, b.x, b.y);
    }
  }
};
