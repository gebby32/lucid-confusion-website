/* ROAD — the pseudo-3D renderer.
   Classic segment projection (a camera behind and above the car, bends accumulated as a
   screen-space offset, hills as segment heights), but the ground is filled ROW BY ROW with
   whole-pixel rects, so the road edges stay crisp at any scale and two roads (a fork) or a
   shoreline are simply more spans on the same row.

   Road.draw(view)  view = { z: camera z, x: camera lateral (u), stageFrom, stageTo, mix, ... }
   Projection constants are exported for the game (player depth, horizon line...). */
'use strict';
const Road = (function () {
  const W = 400, H = 300, HORIZON = 116, FX = 200, FY = 176;
  const RW = 2000, CAM_H = 1000, DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
  const PLAYER_Z = CAM_H * DEPTH, DRAW = 240, SEG = Track.SEG;
  const R = { W, H, HORIZON, FX, FY, RW, CAM_H, DEPTH, PLAYER_Z, DRAW, PX: 400 };

  // fogged colour cache: colour -> 17 levels
  const fogCache = new Map();
  function fogged(c, fogC, f) {
    const lv = Math.round(f * 16);
    if (!lv) return c;
    const key = c + fogC;
    let a = fogCache.get(key);
    if (!a) { a = []; for (let i = 0; i <= 16; i++) a.push(Px.mix(c, fogC, i / 16)); fogCache.set(key, a); }
    return a[lv];
  }

  // projected points per visible segment (reused arrays: no garbage per frame)
  const P = []; for (let i = 0; i <= DRAW; i++) P.push({ x1: 0, y1: 0, w1: 0, s1: 0, x2: 0, y2: 0, w2: 0, s2: 0, seg: null, clip: 0, fog: 0, vis: false });

  function project(camX, camY, camZ, wx, wy, wz, out) {
    const cz = wz - camZ;
    const s = DEPTH / cz;
    out.s = s;
    out.x = W / 2 + s * (wx - camX) * FX;
    out.y = HORIZON - s * (wy - camY) * FY;
    out.w = s * RW * FX;          // pixels per road half-width (u)
  }
  const tmp = { x: 0, y: 0, w: 0, s: 0 };

  // ---------------------------------------------------------------- one frame of road
  // v: { z, x, y (camera height above ground at the player), segs, fogDensity }
  R.draw = function (g, v) {
    const segs = Track.segs;
    const base = Track.find(v.z), basePct = (v.z % SEG) / SEG;
    let x = 0, dx = -(base.curve * basePct);
    const camX = v.x * RW, camY = v.camY, camZ = v.z;
    let maxy = H;
    R.count = 0;
    for (let n = 0; n < DRAW; n++) {
      const seg = segs[base.i + n], p = P[n];
      p.vis = false; p.seg = seg;
      if (!seg) { P[n].seg = null; break; }
      R.count = n + 1;
      const z1 = seg.i * SEG, z2 = z1 + SEG;
      project(camX - x, camY, camZ, 0, seg.y1, z1, tmp); p.x1 = tmp.x; p.y1 = tmp.y; p.w1 = tmp.w; p.s1 = tmp.s;
      project(camX - x - dx, camY, camZ, 0, seg.y2, z2, tmp); p.x2 = tmp.x; p.y2 = tmp.y; p.w2 = tmp.w; p.s2 = tmp.s;
      x += dx; dx += seg.curve;
      p.clip = maxy;
      p.fog = 1 - Math.exp(-Math.pow(n / DRAW, 2) * (v.fog || 4));
      if (z1 - camZ <= DEPTH * 1.2 || p.y2 >= p.y1 || p.y2 >= maxy) continue;
      p.vis = true;
      rows(g, seg, p, maxy);
      maxy = Math.max(0, Math.ceil(p.y2));          // sprites keep the clip from before this segment
    }
    R.maxy = maxy;
  };

  function rows(g, seg, p, maxy) {
    const st = STAGES[seg.stage], C = st.colors, fogC = C.fog, f = p.fog;
    const yTop = Math.max(0, Math.ceil(p.y2)), yBot = Math.min(Math.ceil(p.y1), maxy, H);
    if (yBot <= yTop) return;
    const light = seg.band === 0;
    const grass = fogged(C.grass[light ? 0 : 1], fogC, f);
    const rumble = fogged(C.rumble[light ? 0 : 1], fogC, f);
    const road = fogged(light ? C.road : C.road2, fogC, f);
    const lane = light ? fogged(C.lane, fogC, f) : null;
    const lanes = st.lanes || 3;
    const ca1 = seg.ca1, ca2 = Track.ca2(seg), cb1 = seg.cb1, cb2 = Track.cb2(seg);
    const two = seg.showB && (Math.abs(cb1 - ca1) > 0.001 || Math.abs(cb2 - ca2) > 0.001);
    const sh = seg.shore, shd1 = sh ? sh.d : 0, shd2 = sh ? Track.shore2(seg) : 0;
    const water = sh ? fogged(C.water[light ? 0 : 1], fogC, f) : null, foam = sh ? fogged(C.foam, fogC, f) : null;
    const sand = sh && C.sand ? fogged(C.sand, fogC, f) : null;
    const dy = p.y1 - p.y2;
    for (let y = yTop; y < yBot; y++) {
      const t = (p.y1 - (y + 0.5)) / dy;                 // 0 at the near edge, 1 at the far edge
      const cx = p.x1 + (p.x2 - p.x1) * t, w = p.w1 + (p.w2 - p.w1) * t;
      g.fillStyle = grass; g.fillRect(0, y, W, 1);
      const a = cx + (ca1 + (ca2 - ca1) * t) * w;
      const b = two ? cx + (cb1 + (cb2 - cb1) * t) * w : a;
      if (sh) {
        const d = shd1 + (shd2 - shd1) * t, ref = sh.side < 0 ? Math.min(a, b) : Math.max(a, b);
        const sx = Math.round(ref + sh.side * d * w), fw = Math.max(1, Math.round(w * 0.06));
        if (sand) { g.fillStyle = sand; if (sh.side < 0) g.fillRect(sx, y, Math.round(ref - w * 1.1) - sx, 1); else { const s0 = Math.round(ref + w * 1.1); g.fillRect(s0, y, sx - s0, 1); } }
        g.fillStyle = water;
        if (sh.side < 0) g.fillRect(0, y, sx, 1); else g.fillRect(sx, y, W - sx, 1);
        g.fillStyle = foam;
        g.fillRect(sh.side < 0 ? sx - fw : sx, y, fw, 1);
      }
      const rw = w * 1.14, ww = Math.max(1, w * 0.035);
      g.fillStyle = rumble;
      g.fillRect(Math.round(a - rw), y, Math.round(rw * 2), 1);
      if (two) g.fillRect(Math.round(b - rw), y, Math.round(rw * 2), 1);
      g.fillStyle = road;
      g.fillRect(Math.round(a - w), y, Math.round(w * 2), 1);
      if (two) g.fillRect(Math.round(b - w), y, Math.round(w * 2), 1);
      if (seg.line) {
        // checkered start / checkpoint / goal line
        const cells = 12, cw = (w * 2) / cells, odd = (y & 2) ? 1 : 0;
        for (const c of two ? [a, b] : [a]) for (let k = 0; k < cells; k++) { g.fillStyle = (k + odd) % 2 ? '#f8f8f8' : '#18181c'; g.fillRect(Math.round(c - w + k * cw), y, Math.ceil(cw), 1); }
      } else if (lane) {
        g.fillStyle = lane;
        for (const c of two ? [a, b] : [a]) for (let k = 1; k < lanes; k++) g.fillRect(Math.round(c - w + (2 * w * k) / lanes - ww / 2), y, Math.round(ww), 1);
      }
    }
  }

  // ---------------------------------------------------------------- sprites, back to front
  // drawCar(n) is called for the segment the player is in so nearer scenery covers the car.
  R.sprites = function (g, playerN, drawPlayer, extra) {
    for (let n = R.count - 1; n > 0; n--) {
      const p = P[n], seg = p.seg;
      if (!seg) continue;
      for (const sp of seg.sprites) sprite(g, sp.spr, p.x1 + sp.x * p.w1, p.y1, p.w1, p.clip, p.fog, STAGES[seg.stage]);
      if (seg.cars.length) {
        // farthest car first inside the segment
        seg.cars.sort((a, b) => b.z - a.z);
        for (const car of seg.cars) {
          const t = (car.z % SEG) / SEG;
          const x = p.x1 + (p.x2 - p.x1) * t, y = p.y1 + (p.y2 - p.y1) * t, w = p.w1 + (p.w2 - p.w1) * t;
          const c1 = Track.center(seg, car.road), c2 = Track.center(Track.segs[seg.i + 1] || seg, car.road);
          carSprite(g, car, x + (c1 + (c2 - c1) * t + car.lx) * w, y, w, p.clip, p.fog);
        }
      }
      if (extra) extra(g, n, p);
      if (n === playerN && drawPlayer) drawPlayer(g);
    }
    if (playerN <= 0 && drawPlayer) drawPlayer(g);
  };

  function sprite(g, s, x, y, w, clip, fog, st) {
    const k = s.sc * w / 400, dw = s.img.width * k, dh = s.img.height * k;
    if (dw < 1.5 || x + dw / 2 < 0 || x - dw / 2 > W) return;
    blit(g, s.img, x - dw / 2, y - dh, dw, dh, clip, dw > 5 ? fog : 0, st);
  }
  function carSprite(g, car, x, y, w, clip, fog) {
    const img = car.img, k = w / 400, dw = img.width * k, dh = img.height * k;
    if (dw < 1.5 || x + dw / 2 < 0 || x - dw / 2 > W) return;
    const foot = img.foot ? img.foot * k : dh;
    blit(g, img, x - dw / 2, y - foot, dw, dh, clip, 0, null);
    if (car.blink && (LP.Loop.frame >> 3) % 2 && dw > 10) { g.fillStyle = '#ffb43c'; g.fillRect(Math.round(x + car.blink * dw * 0.4) - 1, Math.round(y - foot + dh * 0.55), Math.max(2, Math.round(dw * 0.06)), Math.max(1, Math.round(dw * 0.04))); }
  }
  // draw with bottom clipping (hills) and an optional fog wash
  function blit(g, img, x, y, dw, dh, clip, fog, st) {
    let sh = img.height, h = dh;
    if (y + dh > clip) { const cut = (y + dh - clip); if (cut >= dh) return; sh = img.height * (1 - cut / dh); h = dh - cut; }
    x = Math.round(x); y = Math.round(y);
    const wI = Math.max(1, Math.round(dw)), hI = Math.max(1, Math.round(h));
    g.drawImage(img, 0, 0, img.width, Math.max(1, sh), x, y, wI, hI);
    if (fog > 0.3 && st) {
      g.globalAlpha = Math.min(0.8, (fog - 0.3) * 1.3);
      // fog only over the sprite's own pixels: draw a silhouette via the cached fog canvas
      const fc = fogSil(img, st.colors.fog);
      g.drawImage(fc, 0, 0, img.width, Math.max(1, sh), x, y, wI, hI);
      g.globalAlpha = 1;
    }
  }
  const silCache = new WeakMap();
  function fogSil(img, c) {
    let m = silCache.get(img);
    if (!m) { m = {}; silCache.set(img, m); }
    if (!m[c]) {
      const s = Px.canvas(img.width, img.height), sg = s.getContext('2d');
      sg.drawImage(img, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = c; sg.fillRect(0, 0, s.width, s.height);
      m[c] = s;
    }
    return m[c];
  }

  // ---------------------------------------------------------------- background
  // v.bgA / v.bgB are Backgrounds records, v.bgT the cross-fade (0 = A only), offsets in 0..1
  R.background = function (g, v) {
    const shift = v.bgShift || 0;
    layerSet(g, v.bgA, v, shift, 1);
    if (v.bgB && v.bgT > 0) { g.globalAlpha = v.bgT; layerSet(g, v.bgB, v, shift, v.bgT); g.globalAlpha = 1; }
  };
  function layerSet(g, B, v, shift) {
    g.drawImage(B.sky, 0, 0);
    scroll(g, B.cel, v.off[0], 0);
    if (B.far) scroll(g, B.far, v.off[1], HORIZON - B.far.height + shift);
    if (B.near) scroll(g, B.near, v.off[2], HORIZON - B.near.height + 1 + shift);
    g.fillStyle = B.ground;
    const gy = Math.round(HORIZON + Math.min(0, shift));
    g.fillRect(0, gy, W, H - gy);
  }
  function scroll(g, img, off, y) {
    const LW = img.width, sx = Math.floor(((off % 1) + 1) % 1 * LW);
    y = Math.round(y);
    g.drawImage(img, sx, 0, Math.min(W, LW - sx), img.height, 0, y, Math.min(W, LW - sx), img.height);
    if (LW - sx < W) g.drawImage(img, 0, 0, W - (LW - sx), img.height, LW - sx, y, W - (LW - sx), img.height);
  }

  R.P = P;
  return R;
})();
