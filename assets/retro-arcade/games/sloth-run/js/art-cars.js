/* ART: CARS — every vehicle is drawn in code as rear-view pixel art at the "player depth"
   density of 400 px per road half-width (Art.PX), so traffic and the player share one scale.

   Cars.player(lean, brake, pose, head, tread)  -> canvas (memoised)
     lean  -2..2   steering (shows the car's flank, the cockpit slides into the turn)
     brake 0|1     brake lights blaze
     pose  'hang' | 'shaka'      the arm drapes over the door, or throws a hang-loose
     head  'back' | 'left' | 'right' | 'face'   the sloth looks into turns, or back at you
     tread 0|1     tyre animation
   Cars.traffic(type, colorIndex) -> canvas;  Cars.TYPES lists the vehicles. */
'use strict';
const Cars = (function () {
  const { poly, ellipse, rect, stroke, px, rng, shade, mix, make, tiny, tinyW } = Px;

  // the sloth's palette (matches the title art: warm brown fur, cream face, teal floral shirt)
  const FUR = '#8a6440', FUR_D = '#5e4228', FUR_L = '#b88c5c', FUR_T = '#d2aa78';
  const FACE = '#e6cfa2', FACE_D = '#bfa070', MASK = '#3a2618';
  const SHIRT = '#18a8b4', SHIRT_D = '#0c7680', CLAW = '#efe4c4', CLAW_D = '#9a8a62';
  const RED = '#dc1c26', RED_L = '#ff5a5a', RED_D = '#9c0c16', RED_DD = '#6a0610';

  // ---------------------------------------------------------------- sloth bits
  function furBlob(g, cx, cy, rx, ry, seed) {
    const r = rng(seed);
    ellipse(g, cx, cy, rx + 0.6, ry + 0.6, FUR_D);
    ellipse(g, cx, cy, rx, ry, FUR);
    ellipse(g, cx - rx * 0.25, cy - ry * 0.3, rx * 0.6, ry * 0.5, FUR_L);
    // shaggy tufts round the edge
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = 0.92 + r() * 0.2;
      px(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r() < 0.5 ? FUR_D : FUR);
    }
    for (let i = 0; i < 34; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.85;
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      rect(g, x, y, 1, 2, r() < 0.55 ? FUR_T : FUR_D);
    }
  }
  function aviators(g, x, y, w) {     // two lenses with a sunset reflection, gold rim
    const lw = Math.max(3, Math.round(w * 0.42));
    for (const lx of [x, x + w - lw]) {
      rect(g, lx, y, lw, 4, '#c8a048');
      rect(g, lx, y + 1, lw, 3, '#24142c');
      px(g, lx + 1, y + 1, '#ff5cc8'); px(g, lx + 2, y + 1, '#ffb43c');
      px(g, lx + lw - 2, y + 3, '#7a3cff');
    }
    rect(g, x + lw, y + 1, w - 2 * lw, 1, '#c8a048');
  }
  // head centred at (cx, cy); mode back / left / right / face
  function head(g, cx, cy, mode) {
    furBlob(g, cx, cy, 11, 10.5, 77);
    if (mode === 'back') {
      rect(g, cx - 12, cy - 1, 2, 1, '#101018'); rect(g, cx + 11, cy - 1, 2, 1, '#101018');   // shades' temples
      px(g, cx + 12, cy - 2, '#ff5cc8');
      return;
    }
    if (mode === 'face') {
      ellipse(g, cx, cy + 1.5, 8, 7, FACE);
      ellipse(g, cx, cy + 4, 4.5, 3, FACE_D);
      rect(g, cx - 8, cy - 2, 16, 3, MASK);                        // the sloth's dark eye stripes
      aviators(g, cx - 8, cy - 3, 16);
      rect(g, cx - 1, cy + 3, 3, 2, '#1c120c');                     // nose
      rect(g, cx - 3, cy + 6, 2, 1, '#6a4a30'); rect(g, cx - 1, cy + 7, 3, 1, '#6a4a30'); rect(g, cx + 2, cy + 6, 2, 1, '#6a4a30');  // the smile
      return;
    }
    const s = mode === 'right' ? 1 : -1;                           // profile: snout + one lens
    ellipse(g, cx + s * 7, cy + 2, 5, 5, FACE);
    rect(g, cx + s * 4 - (s < 0 ? 6 : 0), cy - 2, 7, 3, MASK);
    const lx = cx + (s > 0 ? 5 : -10);
    rect(g, lx, cy - 3, 6, 4, '#c8a048'); rect(g, lx, cy - 2, 6, 3, '#24142c');
    px(g, lx + (s > 0 ? 4 : 1), cy - 2, '#ff5cc8'); px(g, lx + (s > 0 ? 3 : 2), cy - 2, '#ffb43c');
    rect(g, cx - s * 11 - (s > 0 ? 1 : 0), cy - 2, 2, 1, '#101018');
    rect(g, cx + s * 11 - (s > 0 ? 1 : 0), cy + 2, 2, 2, '#1c120c');   // nose tip
    rect(g, cx + s * 7 - 1, cy + 5, 3, 1, '#6a4a30');
  }
  function shirt(g, cx, cy, rx, ry) {
    ellipse(g, cx, cy, rx, ry, SHIRT);
    ellipse(g, cx + rx * 0.3, cy + 2, rx * 0.6, ry * 0.7, SHIRT_D);
    const r = rng(4242);
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.85, x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const c = ['#ff4fa0', '#ffd23c', '#ffffff', '#ff7a3c'][i % 4];
      if (i % 4 === 2) px(g, x, y, c); else { rect(g, x, y, 2, 2, c); px(g, x + 2, y + 1, '#0c7680'); }
    }
  }
  function claws(g, x, y, dir) {   // three long cream claws; dir 1 = hanging down, -1 = pointing up
    for (let i = 0; i < 3; i++) {
      const bx = x + i * 2 - 2;
      for (let k = 0; k < 6; k++) px(g, bx + (k > 3 ? (dir > 0 ? 1 : -1) * (k - 3) * 0.5 : 0), y + dir * k, k > 4 ? CLAW_D : CLAW);
    }
  }

  // ---------------------------------------------------------------- the player's convertible
  const PW = 140, PH = 94, OX = 70, OY = 8;     // local origin: x centre, y = 0 near the cockpit top; ground at y 84
  const cache = {};
  function player(lean, brake, pose, headMode, tread) {
    const key = lean + '|' + brake + '|' + pose + '|' + headMode + '|' + tread;
    if (cache[key]) return cache[key];
    const c = make(PW, PH, (g) => {
      g.translate(OX, OY);
      const L = lean, dB = L * 2, dC = L * 3, dH = L * 4;

      // tyres
      for (const sx of [-1, 1]) {
        const x0 = sx < 0 ? -53 : 35;
        rect(g, x0, 64, 18, 20, '#0e0e12');
        rect(g, sx < 0 ? x0 + 15 : x0, 64, 3, 20, '#24242c');
        for (let y = 65 + tread; y < 84; y += 3) rect(g, x0 + 2, y, 13, 1, '#2c2c36');
      }
      // flank (seen while turning)
      if (L) {
        const s = L > 0 ? -1 : 1, fw = 4 * Math.abs(L), ex = s * 60 + dB;
        poly(g, [[ex, 46], [ex + s * fw, 50], [ex + s * fw, 72], [ex, 74]], RED_D);
        for (let k = 0; k < 3; k++) rect(g, Math.min(ex, ex + s * fw), 54 + k * 4, fw, 1, RED_DD);
        rect(g, s < 0 ? ex - fw - 1 : ex + 1, 66, fw + 1, 18, '#0e0e12');      // the front tyre peeking out
      }
      // windshield frame and glass glints (furthest away)
      const wx = dC;
      stroke(g, [[-56 + wx, 34], [-48 + wx, 14], [48 + wx, 14], [56 + wx, 34]], 1, '#2e2e3a');
      rect(g, -47 + wx, 13, 94, 1, '#5a5a6a');
      rect(g, -6 + wx, 15, 12, 3, '#1e1e26');
      stroke(g, [[22 + wx, 30], [30 + wx, 18]], 0.5, 'rgba(220,240,255,0.55)');
      // seats
      for (const sx of [-1, 1]) {
        const x0 = sx < 0 ? -45 : 13;
        poly(g, [[x0 + dC, 38], [x0 + 2 + dC, 24], [x0 + 6 + dC, 21], [x0 + 26 + dC, 21], [x0 + 30 + dC, 24], [x0 + 32 + dC, 38]], '#2c2228');
        rect(g, x0 + 4 + dC, 23, 1, 14, '#4a3a42'); rect(g, x0 + 27 + dC, 23, 1, 14, '#4a3a42');
        for (let k = 0; k < 4; k++) rect(g, x0 + 9 + k * 5 + dC, 23, 1, 13, '#b89870');
      }
      ellipse(g, 29 + dC, 17, 9, 6, '#2c2228'); rect(g, 22 + dC, 15, 14, 1, '#4a3a42');   // passenger headrest
      // the surfboard riding shotgun
      stroke(g, [[23 + dC, 40], [33 + dC, 8], [38 + dC, -5]], [5.5, 2], '#e8508e');
      stroke(g, [[24 + dC, 40], [34 + dC, 8], [38 + dC, -4]], [4.5, 1.5], '#ff6aa8');
      stroke(g, [[25 + dC, 38], [35 + dC, 6]], 0.6, '#ffe14a');
      stroke(g, [[20 + dC, 36], [30 + dC, 8]], 0.5, '#ffd0e8');
      poly(g, [[27 + dC, 18], [33 + dC, 20], [29 + dC, 24]], '#3cb4ff');      // the fin
      // the sloth: shirt, then head
      shirt(g, -29 + dC, 34, 18, 11);
      head(g, -29 + dH, 13, headMode);
      // rear deck
      poly(g, [[-61 + dB, 46], [-50 + dB, 34], [50 + dB, 34], [61 + dB, 46]], '#e02a32');
      rect(g, -50 + dB, 34, 100, 1, '#ff9a9a'); rect(g, -53 + dB, 36, 106, 1, RED_L);
      for (let k = 0; k < 3; k++) rect(g, -16 + dB, 38 + k * 2, 32, 1, RED_D);
      rect(g, -60 + dB, 45, 120, 1, RED_D);
      // lower body
      poly(g, [[-61 + dB, 48], [-57 + dB, 46], [57 + dB, 46], [61 + dB, 48], [61 + dB, 70], [57 + dB, 74], [-57 + dB, 74], [-61 + dB, 70]], RED);
      rect(g, -60 + dB, 46, 120, 2, RED_L);
      rect(g, -60 + dB, 68, 120, 6, RED_D);
      // tail-light band with louvres
      rect(g, -57 + dB, 50, 114, 11, '#1c0a10');
      const lamp = brake ? '#ff5050' : '#c81828', core = brake ? '#fff0d8' : '#ff4a4a';
      for (const sx of [-1, 1]) {
        const x0 = (sx < 0 ? -55 : 16) + dB;
        rect(g, x0, 51, 39, 9, lamp);
        rect(g, x0 + 2, 53, 35, 4, core);
        if (brake) rect(g, x0 + 6, 54, 27, 2, '#ffffff');
        rect(g, x0, 54, 39, 1, '#1c0a10'); rect(g, x0, 57, 39, 1, '#1c0a10');
      }
      rect(g, -4 + dB, 52, 8, 7, '#ffd040'); tiny(g, 'S', -1 + dB, 53, '#7a2a00');
      // bumper, plate, exhausts
      rect(g, -55 + dB, 62, 110, 10, '#241820');
      rect(g, -55 + dB, 62, 110, 1, '#4a3640');
      rect(g, -13 + dB, 62, 26, 9, '#2a2a50');
      rect(g, -12 + dB, 63, 24, 7, '#f4f0dc');
      tiny(g, 'SLOTH', -9 + dB, 64, '#1838a0');
      rect(g, -46 + dB, 72, 92, 3, '#101014');
      for (const ex of [-40, -32, 32, 40]) { ellipse(g, ex + dB, 73, 3, 2, '#c8c8d0'); ellipse(g, ex + dB, 73, 1.5, 1, '#303038'); }
      // side mirrors on little stalks off the windshield pillars
      for (const sx of [-1, 1]) {
        const mx = sx * 60 + dC;
        rect(g, Math.min(mx, mx + sx * 4), 33, 4, 1, '#2e2e3a');
        rect(g, sx < 0 ? mx - 9 : mx + 3, 28, 7, 6, RED); rect(g, sx < 0 ? mx - 8 : mx + 4, 29, 5, 4, '#1a1a24');
        px(g, sx < 0 ? mx - 7 : mx + 5, 29, '#7a8aa8');
      }
      // the arm
      if (pose === 'shaka') {
        stroke(g, [[-44 + dC, 30], [-58 + dC, 20], [-60 + dC, 6]], 3.4, FUR_D);
        stroke(g, [[-45 + dC, 29], [-57 + dC, 19], [-59 + dC, 6]], 2.6, FUR);
        stroke(g, [[-46 + dC, 27], [-56 + dC, 18]], 0.6, FUR_T);
        ellipse(g, -60 + dC, 3, 4, 4, FUR);
        claws(g, -60 + dC, -1, -1);
        ellipse(g, -45 + dC, 30, 5, 4, SHIRT); px(g, -46 + dC, 29, '#ff4fa0');
      } else {
        stroke(g, [[-44 + dC, 31], [-58 + dB, 38], [-65 + dB, 46], [-66 + dB, 56]], 3.4, FUR_D);
        stroke(g, [[-44 + dC, 30], [-58 + dB, 37], [-64 + dB, 45], [-65 + dB, 55]], 2.6, FUR);
        stroke(g, [[-50 + dC, 32], [-59 + dB, 37], [-63 + dB, 44]], 0.6, FUR_T);
        claws(g, -65 + dB, 57, 1);
        ellipse(g, -45 + dC, 30, 5, 4, SHIRT); px(g, -46 + dC, 29, '#ff4fa0'); px(g, -43 + dC, 31, '#ffd23c');
      }
    });
    cache[key] = c;
    return c;
  }

  // ---------------------------------------------------------------- traffic
  const PAINT = ['#f4f4f0', '#ffd23c', '#3cb4ff', '#ff7a2c', '#7ad24a', '#c45cff', '#ff5c8a', '#2c3c5c', '#a8b4c0', '#3ce0c8'];
  function tyres(g, w, h, gap, th) {
    th = th || 14;
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -w / 2 + gap : w / 2 - gap - 14;
      rect(g, x0, h - th, 14, th, '#101014');
      for (let y = h - th + 2; y < h; y += 3) rect(g, x0 + 2, y, 10, 1, '#2a2a32');
    }
  }
  function lights(g, x, y, w, h, c) { rect(g, x, y, w, h, c || '#d8202c'); rect(g, x + 1, y + 1, w - 2, Math.max(1, h - 2), '#ff6a6a'); }
  function bumper(g, w, y, c) { rect(g, -w / 2, y, w, 4, c || '#c8ccd4'); rect(g, -w / 2, y, w, 1, '#ffffff'); rect(g, -w / 2, y + 3, w, 1, '#6a6e78'); }
  function plate(g, y, txt) { rect(g, -9, y, 18, 7, '#f0f0e0'); rect(g, -9, y, 18, 1, '#5a5a70'); tiny(g, txt || 'ZZZ', -tinyW(txt || 'ZZZ') / 2, y + 1, '#2a3a8a'); }
  function animalHead(g, x, y, kind) {
    if (kind === 'turtle') { ellipse(g, x, y, 6, 6, '#5aa83a'); ellipse(g, x - 2, y - 2, 3, 2, '#8ad85a'); rect(g, x - 6, y - 1, 12, 2, '#1a1a1a'); }
    else if (kind === 'koala') { ellipse(g, x - 7, y - 5, 4, 4, '#8a8a96'); ellipse(g, x + 7, y - 5, 4, 4, '#8a8a96'); ellipse(g, x - 7, y - 5, 2, 2, '#e8d8e0'); ellipse(g, x + 7, y - 5, 2, 2, '#e8d8e0'); ellipse(g, x, y, 7, 6, '#9c9ca8'); }
    else if (kind === 'flamingo') { stroke(g, [[x, y + 6], [x + 3, y - 4], [x - 2, y - 12], [x + 1, y - 18]], 1.6, '#ff7ab4'); ellipse(g, x + 2, y - 19, 3, 3, '#ff7ab4'); rect(g, x + 4, y - 19, 4, 2, '#1a1a1a'); rect(g, x + 4, y - 18, 2, 1, '#f8f0e0'); }
    else { ellipse(g, x, y, 7, 6, '#7a7a84'); rect(g, x - 7, y - 1, 14, 3, '#2a2a30'); rect(g, x - 5, y - 7, 3, 3, '#5a5a62'); rect(g, x + 2, y - 7, 3, 3, '#5a5a62'); }
  }

  const TYPES = {
    // compact round "bug"
    bug: { w: 96, h: 70, solid: 0.22, draw(g, col) {
      const w = 96, h = 70;
      tyres(g, w, h, 6);
      ellipse(g, 0, 40, 44, 28, shade(col, -0.35));
      ellipse(g, 0, 39, 42, 27, col);
      rect(g, -46, 52, 92, 12, col);
      ellipse(g, -10, 26, 22, 12, shade(col, 0.25));
      ellipse(g, 0, 22, 15, 8, '#24344c'); ellipse(g, -4, 20, 8, 3, '#4a6a8c');
      for (let k = 0; k < 4; k++) rect(g, -10, 37 + k * 3, 20, 1, shade(col, -0.4));
      ellipse(g, -34, 48, 5, 7, '#d8202c'); ellipse(g, -34, 47, 3, 4, '#ff7070');
      ellipse(g, 34, 48, 5, 7, '#d8202c'); ellipse(g, 34, 47, 3, 4, '#ff7070');
      bumper(g, 88, 58); plate(g, 50, 'BUG');
    } },
    // hippie camper van
    van: { w: 100, h: 104, solid: 0.24, draw(g, col) {
      const w = 100, h = 104;
      tyres(g, w, h, 8);
      poly(g, [[-46, 10], [-40, 4], [40, 4], [46, 10], [48, 92], [-48, 92]], '#f4f0e8');
      poly(g, [[-48, 52], [0, 34], [48, 52], [48, 92], [-48, 92]], col);
      rect(g, -48, 88, 96, 4, shade(col, -0.35));
      rect(g, -36, 14, 72, 22, '#24344c'); rect(g, -34, 16, 30, 4, '#4a6a8c'); rect(g, -2, 14, 4, 22, '#f4f0e8');
      rect(g, -44, 0, 88, 5, '#6a4a30'); rect(g, -30, -6, 26, 7, '#e8a040'); rect(g, 4, -5, 22, 6, '#3c8ad8');   // roof rack + luggage
      // flower decal
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ellipse(g, 22 + Math.cos(a) * 5, 66 + Math.sin(a) * 5, 3, 3, '#ffd23c'); }
      ellipse(g, 22, 66, 3, 3, '#ff5c8a');
      lights(g, -46, 60, 5, 12); lights(g, 41, 60, 5, 12);
      bumper(g, 96, 86, '#d8dce4'); plate(g, 76, 'PEACE');
    } },
    // pickup with surfboards in the bed
    pickup: { w: 104, h: 76, solid: 0.25, draw(g, col) {
      const w = 104, h = 76;
      tyres(g, w, h, 6);
      stroke(g, [[-20, 34], [-28, -4]], [3.5, 2], '#ffd23c'); stroke(g, [[-8, 34], [-10, -10]], [3.5, 2], '#3ce0c8'); stroke(g, [[4, 34], [12, -2]], [3.5, 2], '#ff5c8a');
      poly(g, [[-36, 26], [-30, 8], [30, 8], [36, 26]], shade(col, -0.15));
      rect(g, -24, 12, 48, 11, '#24344c'); rect(g, -22, 13, 16, 3, '#4a6a8c');
      rect(g, -50, 26, 100, 40, col);
      rect(g, -50, 26, 100, 3, shade(col, 0.35));
      rect(g, -42, 34, 84, 22, shade(col, -0.1)); rect(g, -42, 34, 84, 1, shade(col, -0.4));
      tiny(g, 'SLO-MO', -tinyW('SLO-MO') / 2, 42, shade(col, -0.55));
      lights(g, -50, 32, 6, 16); lights(g, 44, 32, 6, 16);
      bumper(g, 100, 62, '#b8bcc4'); plate(g, 56, 'SURF');
    } },
    // low sports coupe
    coupe: { w: 108, h: 60, solid: 0.26, draw(g, col) {
      const w = 108, h = 60;
      tyres(g, w, h, 4, 13);
      poly(g, [[-30, 22], [-22, 8], [22, 8], [30, 22]], shade(col, -0.2));
      poly(g, [[-24, 21], [-18, 11], [18, 11], [24, 21]], '#1c2436'); rect(g, -16, 12, 10, 2, '#4a5a7c');
      poly(g, [[-54, 30], [-44, 21], [44, 21], [54, 30], [54, 50], [-54, 50]], col);
      rect(g, -52, 22, 104, 2, shade(col, 0.4));
      rect(g, -52, 30, 104, 7, '#1c0a10');
      rect(g, -50, 31, 34, 5, '#e01828'); rect(g, 16, 31, 34, 5, '#e01828'); rect(g, -48, 32, 30, 2, '#ff6a6a'); rect(g, 18, 32, 30, 2, '#ff6a6a');
      rect(g, -54, 44, 108, 6, shade(col, -0.45));
      rect(g, -48, 20, 96, 2, '#1a1a22');            // little wing
      plate(g, 38, 'FAST');
    } },
    // wood-panel station wagon
    wagon: { w: 100, h: 70, solid: 0.24, draw(g, col) {
      const w = 100, h = 70;
      tyres(g, w, h, 6);
      rect(g, -40, 2, 80, 3, '#5a5a62'); rect(g, -26, -4, 30, 6, '#d84c3c');
      poly(g, [[-44, 30], [-38, 6], [38, 6], [44, 30]], shade(col, -0.1));
      rect(g, -32, 10, 64, 18, '#24344c'); rect(g, -30, 11, 18, 4, '#4a6a8c');
      rect(g, -48, 30, 96, 30, col);
      rect(g, -40, 34, 80, 18, '#9a5a2a'); rect(g, -40, 34, 80, 2, '#c47a3a');
      for (let k = 0; k < 5; k++) rect(g, -40, 38 + k * 3, 80, 1, '#7a4420');
      lights(g, -48, 34, 6, 14); lights(g, 42, 34, 6, 14);
      bumper(g, 96, 56); plate(g, 44, 'FAM');
    } },
    // big rig trailer
    truck: { w: 124, h: 150, solid: 0.3, draw(g, col) {
      const w = 124, h = 150;
      tyres(g, w, h, 4, 18); tyres(g, w - 36, h, 4, 18);
      rect(g, -60, 4, 120, 120, col);
      rect(g, -60, 4, 120, 3, shade(col, 0.45)); rect(g, -60, 120, 120, 4, shade(col, -0.4));
      rect(g, -1, 8, 2, 112, shade(col, -0.45));
      for (let k = 0; k < 6; k++) rect(g, -58, 22 + k * 18, 116, 1, shade(col, -0.2));
      for (const x of [-30, 26]) { rect(g, x, 30, 4, 70, '#9a9ea8'); rect(g, x + 1, 30, 1, 70, '#e0e4ec'); }
      rect(g, -44, 50, 88, 22, '#f8f4e8'); rect(g, -44, 50, 88, 2, '#c8402c');
      tiny(g, 'LAZY', -tinyW('LAZY', 2) / 2, 53, '#c8402c', 2); tiny(g, 'FREIGHT', -tinyW('FREIGHT') / 2, 65, '#2a3a8a');
      for (const x of [-52, -40, 36, 48]) rect(g, x, 8, 4, 3, '#ffb43c');
      rect(g, -62, 124, 124, 8, '#2a2a30');
      lights(g, -60, 125, 10, 6); lights(g, 50, 125, 10, 6);
      rect(g, -52, 134, 14, 14, '#141418'); rect(g, 38, 134, 14, 14, '#141418');      // mud flaps
      plate(g, 125, 'ZZZ');
    } },
    // tour bus
    bus: { w: 118, h: 128, solid: 0.29, draw(g, col) {
      const w = 118, h = 128;
      tyres(g, w, h, 6, 16);
      poly(g, [[-56, 12], [-50, 2], [50, 2], [56, 12], [57, 112], [-57, 112]], col);
      rect(g, -56, 2, 112, 3, shade(col, 0.4));
      rect(g, -46, 14, 92, 30, '#24344c'); rect(g, -44, 16, 30, 6, '#4a6a8c'); rect(g, -1, 14, 2, 30, col);
      rect(g, -56, 52, 112, 8, '#1a1a22');
      tiny(g, 'TOUR', -tinyW('TOUR', 2) / 2, 66, shade(col, -0.6), 2);
      tiny(g, 'NAPTIME TRAVEL', -tinyW('NAPTIME TRAVEL') / 2, 80, shade(col, -0.6));
      lights(g, -54, 90, 8, 12); lights(g, 46, 90, 8, 12);
      rect(g, -57, 106, 114, 8, '#2a2a30'); plate(g, 96, 'BUS');
    } },
    // convertible with an animal at the wheel
    cabrio: { w: 104, h: 70, solid: 0.25, draw(g, col, seed) {
      const w = 104, h = 70, kinds = ['turtle', 'koala', 'flamingo', 'raccoon'];
      tyres(g, w, h, 6);
      rect(g, -40, 14, 80, 2, '#3a3a44');
      poly(g, [[-38, 34], [-36, 22], [-12, 22], [-10, 34]], '#3a2a2a'); poly(g, [[10, 34], [12, 22], [36, 22], [38, 34]], '#3a2a2a');
      animalHead(g, -22, 18, kinds[seed % 4]);
      poly(g, [[-52, 40], [-44, 30], [44, 30], [52, 40]], shade(col, 0.15));
      rect(g, -50, 30, 100, 1, shade(col, 0.5));
      rect(g, -52, 40, 104, 22, col);
      rect(g, -52, 56, 104, 6, shade(col, -0.4));
      lights(g, -50, 43, 14, 6); lights(g, 36, 43, 14, 6);
      bumper(g, 100, 56, '#c8ccd4'); plate(g, 46, 'CHILL');
    } }
  };
  const tcache = {};
  function traffic(type, ci) {
    const key = type + ci;
    if (tcache[key]) return tcache[key];
    const T = TYPES[type], col = type === 'bus' ? ['#ffc81c', '#ff7a2c', '#3cb4ff', '#f4f4f0'][ci % 4] : PAINT[ci % PAINT.length];
    const c = make(T.w + 8, T.h + 16, (g) => { g.translate((T.w + 8) / 2, 12); T.draw(g, col, ci); });
    const out = Px.outline(c, 'rgba(10,6,20,0.85)');
    out.foot = T.h + 13;                      // ground line inside the canvas
    return (tcache[key] = out);
  }

  return { player, traffic, TYPES, PAINT, PW, PH, head, furBlob, shirt, claws, aviators };
})();
