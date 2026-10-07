/* SPRITES — every retro pixel sprite in Slothger, drawn in code and cached as canvases.
   Vehicles and critters are drawn facing RIGHT and mirrored for leftward lanes.
   A dark 1px outline is added automatically (Sprites.outline) for the clean arcade look.
   The sloth is NOT here: it is the supplied hi-res render (js/sloth.js). */
'use strict';
const PAL = {
  ink: '#101018', white: '#fcfcfc', g1: '#bcbcbc', g2: '#7c7c7c', g3: '#3c3c3c', g4: '#242424',
  glass: '#a4e4fc', head: '#fce0a8', tail: '#f83800', tire: '#202020', hub: '#9c9c9c',
  red: '#f83800', redD: '#a81000', yel: '#f8b800', yelD: '#ac7c00', grn: '#00a800', grnD: '#005800', grnL: '#58d854',
  lime: '#b8f818', blu: '#0058f8', bluD: '#0000bc', cyan: '#3cbcfc', pur: '#6844fc', purD: '#4428bc', pink: '#f878f8',
  org: '#e45c10', orgD: '#a83c00', brn: '#ac7c00', brnD: '#503000', tan: '#fca044', cream: '#fce0a8', teal: '#00a8a8'
};
const Sprites = (function () {
  const P = PAL;
  const cache = {};
  const get = (key, make) => cache[key] || (cache[key] = make());
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function mk(w, h, fn) { const c = G.canvas(w, h); fn(c.getContext('2d'), c); return c; }

  // 1px outline around every opaque pixel (into transparent neighbours)
  function outline(c, col) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H), p = d.data, a = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = p[i * 4 + 3] > 0 ? 1 : 0;
    const n = parseInt((col || P.ink).slice(1), 16), cr = n >> 16, cg = (n >> 8) & 255, cb = n & 255;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (a[i]) continue;
      if ((x > 0 && a[i - 1]) || (x < W - 1 && a[i + 1]) || (y > 0 && a[i - W]) || (y < H - 1 && a[i + W])) {
        p[i * 4] = cr; p[i * 4 + 1] = cg; p[i * 4 + 2] = cb; p[i * 4 + 3] = 255;
      }
    }
    g.putImageData(d, 0, 0);
    return c;
  }
  const ol = (w, h, fn, col) => outline(mk(w, h, fn), col);
  function wheel(g, x, y, big) {
    if (big) { r(g, x - 3, y - 1, 6, 5, P.tire); r(g, x - 2, y - 2, 4, 7, P.tire); r(g, x - 1, y, 2, 2, P.hub); return; }
    r(g, x - 2, y, 4, 3, P.tire); r(g, x - 1, y + 1, 2, 1, P.hub);
  }

  const CAR_HUES = [[P.red, P.redD], [P.blu, P.bluD], [P.pur, P.purD], [P.grn, P.grnD], [P.org, P.orgD], [P.cyan, '#0078a8']];

  // ------------------------------------------------------------------ vehicles (facing right)
  function car(m, d, extra) {
    return ol(16, 13, (g) => {
      r(g, 1, 5, 14, 4, m); r(g, 1, 8, 14, 1, d);
      r(g, 4, 2, 7, 3, m); r(g, 3, 3, 1, 2, m); r(g, 11, 3, 1, 2, m);
      r(g, 4, 3, 3, 2, P.glass); r(g, 8, 3, 3, 2, P.glass); r(g, 7, 3, 1, 2, d);
      r(g, 14, 5, 1, 2, P.head); r(g, 1, 5, 1, 2, P.tail);
      r(g, 7, 6, 1, 2, d);
      wheel(g, 4, 9); wheel(g, 11, 9);
      if (extra) extra(g);
    });
  }
  const MAKERS = {
    car: (hue) => car(CAR_HUES[hue][0], CAR_HUES[hue][1]),
    taxi: () => car(P.yel, P.yelD, (g) => { r(g, 6, 0, 3, 2, P.white); r(g, 6, 1, 3, 1, P.red); for (let x = 2; x < 14; x += 2) r(g, x, 7, 1, 1, P.ink); }),
    police: (hue, f) => car(P.white, P.g2, (g) => { r(g, 2, 6, 12, 2, P.ink); r(g, 5, 1, 2, 1, f ? P.red : P.blu); r(g, 8, 1, 2, 1, f ? P.blu : P.red); }),
    sports: () => ol(16, 12, (g) => {
      r(g, 1, 6, 14, 3, P.red); r(g, 1, 8, 14, 1, P.redD); r(g, 5, 4, 6, 2, P.red); r(g, 11, 5, 2, 1, P.red);
      r(g, 6, 4, 4, 2, P.glass); r(g, 1, 3, 3, 1, P.ink); r(g, 2, 4, 1, 2, P.ink); r(g, 14, 6, 1, 1, P.head); r(g, 8, 7, 3, 1, P.yel);
      wheel(g, 4, 8); wheel(g, 12, 8);
    }),
    moto: (hue, f) => ol(16, 13, (g) => {
      r(g, 2, 9, 3, 3, P.tire); r(g, 11, 9, 3, 3, P.tire); r(g, 3, 10, 1, 1, P.hub); r(g, 12, 10, 1, 1, P.hub);
      r(g, 4, 8, 8, 2, P.g2); r(g, 6, 7, 5, 2, CAR_HUES[hue][0]); r(g, 11, 6, 1, 3, P.g1);
      r(g, 6, 3, 3, 4, P.ink); r(g, 9, 4, 2, 1, P.ink); r(g, 6, 0, 4, 3, CAR_HUES[(hue + 2) % 6][0]); r(g, 9, 1, 1, 1, P.glass);
      r(g, 13, 8, 1, 1, P.head);
      if (f) r(g, 1, 8, 1, 1, P.g1);
    }),
    tractor: () => ol(16, 14, (g) => {
      r(g, 6, 5, 8, 4, P.grn); r(g, 6, 8, 8, 1, P.grnD); r(g, 3, 1, 5, 1, P.grn); r(g, 3, 1, 1, 6, P.grn); r(g, 7, 1, 1, 6, P.grn);
      r(g, 4, 2, 3, 3, P.glass); r(g, 11, 2, 1, 3, P.g3); r(g, 14, 6, 1, 1, P.head);
      r(g, 1, 6, 6, 6, P.tire); r(g, 2, 5, 4, 8, P.tire); r(g, 3, 8, 2, 2, P.yel); wheel(g, 12, 9);
    }),
    truck: (hue) => ol(32, 15, (g) => {
      const [m, d] = CAR_HUES[hue];
      r(g, 1, 1, 21, 10, P.white); r(g, 1, 9, 21, 2, P.g1); r(g, 2, 4, 19, 2, m); r(g, 1, 1, 21, 1, P.g1);
      r(g, 22, 3, 8, 8, m); r(g, 22, 9, 8, 2, d); r(g, 25, 4, 4, 3, P.glass); r(g, 30, 7, 1, 3, P.g2); r(g, 30, 6, 1, 1, P.head);
      r(g, 22, 3, 1, 8, d); wheel(g, 5, 11); wheel(g, 10, 11); wheel(g, 26, 11);
    }),
    bus: (hue) => ol(48, 15, (g) => {
      const m = hue % 2 ? P.yel : P.teal, d = hue % 2 ? P.yelD : '#006868';
      r(g, 1, 1, 46, 10, m); r(g, 1, 9, 46, 2, d); r(g, 1, 1, 46, 1, P.white);
      for (let x = 4; x < 42; x += 5) r(g, x, 3, 4, 3, P.glass);
      r(g, 42, 3, 4, 5, P.glass); r(g, 46, 8, 1, 2, P.head); r(g, 1, 8, 1, 2, P.tail); r(g, 37, 6, 3, 4, d);
      wheel(g, 8, 11); wheel(g, 38, 11);
    }),
    limo: () => ol(48, 13, (g) => {
      r(g, 1, 5, 46, 4, P.g4); r(g, 1, 8, 46, 1, P.ink); r(g, 7, 2, 32, 3, P.g4); r(g, 6, 3, 1, 2, P.g4); r(g, 39, 3, 1, 2, P.g4);
      for (let x = 8; x < 38; x += 6) r(g, x, 3, 5, 2, '#5878a8');
      r(g, 1, 5, 46, 1, P.g2); r(g, 46, 5, 1, 2, P.head); r(g, 1, 5, 1, 2, P.tail);
      wheel(g, 6, 9); wheel(g, 41, 9);
    }),
    dozer: () => ol(32, 15, (g) => {
      r(g, 6, 3, 19, 7, P.yel); r(g, 6, 8, 19, 2, P.yelD); r(g, 11, 0, 8, 4, P.yel); r(g, 12, 1, 6, 2, P.glass); r(g, 8, 1, 1, 3, P.g3);
      r(g, 5, 10, 21, 4, P.g3); for (let x = 7; x < 26; x += 4) r(g, x, 11, 2, 2, P.g1);
      r(g, 26, 5, 2, 2, P.g2); r(g, 28, 2, 3, 12, P.g1); r(g, 28, 13, 3, 1, P.g2);
    }),
    roller: () => ol(32, 15, (g) => {
      r(g, 3, 3, 17, 7, P.yel); r(g, 3, 8, 17, 2, P.yelD); r(g, 7, 0, 7, 4, P.yel); r(g, 8, 1, 5, 2, P.glass);
      wheel(g, 7, 10, true);
      r(g, 20, 4, 11, 10, P.g1); r(g, 20, 4, 11, 2, P.white); r(g, 20, 11, 11, 3, P.g2); r(g, 18, 6, 3, 2, P.g3);
    }),
    mixer: (hue, f) => ol(32, 15, (g) => {
      r(g, 23, 3, 7, 8, P.org); r(g, 25, 4, 4, 3, P.glass); r(g, 30, 7, 1, 1, P.head);
      r(g, 2, 9, 21, 2, P.g3);
      r(g, 3, 2, 18, 8, P.g1); r(g, 5, 1, 14, 1, P.g1); r(g, 5, 10, 14, 1, P.g1);
      for (let x = 3 + (f ? 2 : 0); x < 21; x += 4) { r(g, x, 2, 2, 8, P.org); }
      wheel(g, 6, 11); wheel(g, 12, 11); wheel(g, 26, 11);
    }),
    dump: () => ol(32, 15, (g) => {
      r(g, 1, 2, 21, 8, P.org); r(g, 1, 2, 21, 1, P.tan); r(g, 1, 8, 21, 2, P.orgD); r(g, 3, 4, 17, 1, P.orgD);
      r(g, 23, 3, 7, 8, P.yel); r(g, 25, 4, 4, 3, P.glass); r(g, 30, 7, 1, 1, P.head); r(g, 22, 3, 1, 8, P.yelD);
      wheel(g, 5, 11); wheel(g, 11, 11); wheel(g, 26, 11);
    }),
    plow: () => ol(32, 15, (g) => {
      r(g, 1, 3, 18, 7, P.g2); r(g, 1, 3, 18, 2, P.white); r(g, 1, 8, 18, 2, P.g3);
      r(g, 19, 2, 7, 9, P.org); r(g, 21, 3, 4, 3, P.glass); r(g, 21, 0, 2, 2, P.yel);
      r(g, 27, 3, 2, 3, P.g3); r(g, 28, 5, 3, 9, P.yel); r(g, 29, 4, 2, 1, P.yel);
      for (let y = 6; y < 14; y += 3) r(g, 28, y, 3, 1, P.ink);
      wheel(g, 5, 11); wheel(g, 11, 11); wheel(g, 22, 11);
    }),
    zamboni: () => ol(32, 14, (g) => {
      r(g, 2, 3, 26, 8, P.white); r(g, 2, 9, 26, 2, P.g1); r(g, 2, 6, 26, 1, P.blu); r(g, 28, 5, 2, 6, P.g1);
      r(g, 12, 0, 3, 3, P.ink); r(g, 12, 0, 3, 1, P.red); r(g, 4, 4, 6, 2, P.cyan);
      wheel(g, 7, 10); wheel(g, 23, 10);
    }),
    forklift: () => ol(16, 15, (g) => {
      r(g, 1, 6, 9, 5, P.org); r(g, 1, 9, 9, 2, P.orgD); r(g, 2, 1, 1, 6, P.g3); r(g, 8, 1, 1, 6, P.g3); r(g, 2, 1, 7, 1, P.g3);
      r(g, 4, 3, 3, 3, P.ink); r(g, 4, 2, 3, 1, P.yel);
      r(g, 11, 1, 1, 12, P.g2); r(g, 12, 12, 3, 1, P.g1); r(g, 12, 9, 3, 1, P.g1);
      wheel(g, 3, 11); wheel(g, 8, 11);
    }),
    robot: (hue, f) => ol(16, 13, (g) => {
      r(g, 3, 2, 10, 7, P.g1); r(g, 4, 1, 8, 1, P.g1); r(g, 3, 7, 10, 2, P.g2); r(g, 4, 4, 8, 2, P.ink);
      r(g, 5 + (f ? 4 : 0), 4, 3, 2, P.red); r(g, 7, 0, 2, 1, P.yel);
      r(g, 2, 9, 12, 3, P.g3); for (let x = 3 + (f ? 1 : 0); x < 14; x += 3) r(g, x, 10, 1, 1, P.g1);
    }),
    icecream: (hue, f) => ol(32, 15, (g) => {
      r(g, 1, 4, 29, 7, P.white); r(g, 1, 9, 29, 2, P.g1); r(g, 1, 7, 29, 1, P.pink); r(g, 23, 5, 5, 2, P.glass); r(g, 30, 8, 1, 2, P.head);
      r(g, 5, 5, 8, 3, P.ink); r(g, 6, 6, 6, 1, P.pink);
      r(g, 13, 2, 4, 2, P.tan); r(g, 14, 4, 2, 1, P.tan); r(g, 12, 0, 6, 2, f ? P.pink : P.cream);
      wheel(g, 6, 11); wheel(g, 24, 11);
    }),
    mower: (hue, f) => ol(16, 13, (g) => {
      r(g, 2, 6, 11, 4, P.red); r(g, 2, 9, 11, 1, P.redD); r(g, 4, 4, 4, 2, P.g3); r(g, 3, 2, 1, 4, P.g3); r(g, 10, 3, 1, 3, P.g3); r(g, 9, 3, 3, 1, P.g3);
      wheel(g, 4, 10); wheel(g, 11, 10);
      if (f) r(g, 13, 9, 2, 1, P.grnL);
    }),
    dog: (hue, f) => ol(16, 12, (g) => {
      const b = '#c87830', d = '#804818';
      r(g, 3, 4, 8, 4, b); r(g, 10, 2, 4, 4, b); r(g, 13, 4, 2, 2, b); r(g, 14, 4, 1, 1, P.ink); r(g, 12, 3, 1, 1, P.ink);
      r(g, 10, 2, 2, 3, d); r(g, 1, 3, 2, 2, b);
      if (f) { r(g, 4, 8, 1, 3, d); r(g, 9, 8, 1, 3, d); r(g, 6, 8, 1, 2, b); r(g, 11, 8, 1, 2, b); }
      else { r(g, 3, 8, 1, 2, d); r(g, 10, 8, 1, 3, d); r(g, 5, 8, 1, 3, b); r(g, 8, 8, 1, 2, b); }
      r(g, 12, 6, 2, 1, P.red);
    }),
    swamptruck: () => ol(32, 16, (g) => {
      r(g, 3, 2, 26, 6, '#6c7c18'); r(g, 3, 6, 26, 2, '#3c4c08'); r(g, 17, 0, 9, 3, '#6c7c18'); r(g, 19, 0, 6, 2, P.glass);
      r(g, 4, 3, 10, 1, P.brn); r(g, 29, 4, 1, 2, P.head);
      r(g, 4, 8, 8, 7, P.tire); r(g, 5, 7, 6, 9, P.tire); r(g, 7, 10, 2, 2, P.hub);
      r(g, 20, 8, 8, 7, P.tire); r(g, 21, 7, 6, 9, P.tire); r(g, 23, 10, 2, 2, P.hub);
    }),
    sled: () => ol(16, 13, (g) => {
      r(g, 2, 6, 11, 4, P.red); r(g, 2, 9, 11, 1, P.redD); r(g, 11, 4, 2, 2, P.glass); r(g, 5, 1, 3, 3, P.ink); r(g, 5, 4, 4, 2, P.blu);
      r(g, 1, 11, 13, 1, P.g1); r(g, 14, 10, 1, 1, P.g1); r(g, 3, 10, 1, 1, P.g2); r(g, 11, 10, 1, 1, P.g2);
    }),
    penguin: (hue, f) => ol(16, 10, (g) => {
      r(g, 2, 2, 10, 4, P.g4); r(g, 2, 5, 10, 3, P.white); r(g, 11, 2, 3, 4, P.g4); r(g, 12, 3, 1, 1, P.white);
      r(g, 14, 4, 2, 1, P.yel); r(g, 0, 3, 2, 2, P.yel); r(g, 5, f ? 1 : 2, 3, 1, P.g3);
    }),
    snake: (hue, f) => ol(32, 10, (g) => {
      for (let x = 1; x < 27; x++) {
        const y = 4 + Math.round(Math.sin(x * 0.55 + (f ? Math.PI : 0)) * 2);
        r(g, x, y, 1, 3, x % 4 < 2 ? P.grn : P.lime);
      }
      r(g, 26, 3, 4, 4, P.grn); r(g, 28, 4, 1, 1, P.yel); r(g, 30, 5, f ? 2 : 1, 1, P.red);
    })
  };
  const HUED = { car: 6, truck: 6, bus: 2, moto: 6 };
  const ANIM = { police: 1, moto: 1, mixer: 1, robot: 1, icecream: 1, mower: 1, dog: 1, penguin: 1, snake: 1 };

  // ------------------------------------------------------------------ platforms
  function log(w) {
    return ol(w, 12, (g) => {
      r(g, 2, 1, w - 4, 10, '#a85818'); r(g, 2, 1, w - 4, 2, '#d88c3c'); r(g, 2, 9, w - 4, 2, '#6c3c0c');
      for (let x = 6; x < w - 6; x += 7) { r(g, x, 4, 4, 1, '#6c3c0c'); r(g, x + 3, 6, 3, 1, '#6c3c0c'); }
      r(g, 1, 2, 2, 8, '#e8b070'); r(g, w - 3, 2, 2, 8, '#e8b070'); r(g, 1, 4, 1, 4, '#b07040'); r(g, w - 2, 4, 1, 4, '#b07040');
      if (w > 40) r(g, (w >> 1) - 2, 0, 3, 2, P.grn);
    });
  }
  function turtle(f) {
    return ol(16, 12, (g) => {
      r(g, 3, 3, 10, 6, P.grn); r(g, 4, 2, 8, 1, P.grn); r(g, 4, 4, 2, 2, P.grnL); r(g, 8, 3, 3, 2, P.grnL); r(g, 6, 6, 3, 2, P.grnL);
      r(g, 3, 8, 10, 1, P.grnD); r(g, 13, 4, 2, 3, '#88b838'); r(g, 14, 4, 1, 1, P.ink);
      const k = f ? 1 : 0; r(g, 3 - k, 9, 2, 2, '#88b838'); r(g, 10 + k, 9, 2, 2, '#88b838');
    });
  }
  function raft(w, th) {
    const cols = th === 'city' ? [P.org, P.orgD, P.yel] : th === 'works' ? ['#c89858', '#806030', '#e8c088'] : ['#c88850', '#7c4c1c', '#e8b070'];
    return ol(w, 12, (g) => {
      if (th === 'city') { r(g, 1, 2, w - 2, 8, cols[0]); r(g, 2, 1, w - 4, 1, cols[2]); r(g, 1, 8, w - 2, 2, cols[1]); r(g, 4, 4, w - 8, 3, P.yelD); return; }
      for (let y = 1; y < 11; y += 3) r(g, 1, y, w - 2, 2, cols[y % 2 ? 0 : 2]);
      for (let x = 6; x < w - 2; x += 12) r(g, x, 1, 2, 10, cols[1]);
    });
  }
  function pad(sink, f) {
    return ol(16, 10, (g) => {
      r(g, 2, 2, 12, 6, sink ? '#78c048' : P.grn); r(g, 3, 1, 10, 8, sink ? '#78c048' : P.grn); r(g, 7, 1, 2, 4, '#3c7800');
      r(g, 4, 2, 3, 1, P.grnL); r(g, 10, 6, 2, 1, P.grnD);
      if (sink) { r(g, 9, 2, 3, 3, P.pink); r(g, 10, 3, 1, 1, P.yel); if (f) r(g, 9, 1, 1, 1, P.pink); }
    });
  }
  function gator(open) {
    return ol(48, 12, (g) => {
      const b = '#4c8c18', d = '#2c5c08', l = '#8cc838';
      r(g, 1, 6, 6, 2, b); r(g, 4, 5, 6, 3, b); r(g, 9, 3, 25, 6, b); r(g, 9, 8, 25, 1, d);
      for (let x = 11; x < 33; x += 4) r(g, x, 2, 2, 1, d);
      r(g, 12, 5, 18, 1, l);
      r(g, 10, 9, 3, 2, d); r(g, 26, 9, 3, 2, d);
      if (open) { r(g, 34, 1, 12, 3, b); r(g, 37, 0, 3, 2, l); r(g, 38, 0, 1, 1, P.ink); r(g, 34, 4, 12, 2, '#c82828'); r(g, 35, 4, 10, 1, P.white); r(g, 34, 6, 13, 3, b); r(g, 35, 6, 10, 1, P.white); }
      else { r(g, 34, 3, 13, 5, b); r(g, 37, 2, 3, 2, l); r(g, 38, 2, 1, 1, P.ink); r(g, 35, 6, 11, 1, d); for (let x = 36; x < 46; x += 3) r(g, x, 5, 1, 1, P.white); }
    });
  }
  function floe(w, cracked) {
    return ol(w, 11, (g) => {
      r(g, 2, 1, w - 4, 8, '#e8f8fc'); r(g, 1, 2, w - 2, 6, '#e8f8fc'); r(g, 2, 7, w - 4, 2, '#88c8f0'); r(g, 3, 2, w - 8, 1, P.white);
      for (let x = 6; x < w - 4; x += 9) r(g, x, 4, 3, 1, '#b8e0f8');
      if (cracked) for (let x = 5; x < w - 4; x += 10) { r(g, x, 2, 1, 2, '#5888b8'); r(g, x + 1, 4, 1, 2, '#5888b8'); r(g, x + 2, 6, 1, 1, '#5888b8'); }
    }, '#183870');
  }
  function barrel(f) {
    return ol(16, 12, (g) => {
      r(g, 2, 1, 12, 10, P.yel); r(g, 1, 2, 14, 8, P.yel); r(g, 2, 1, 12, 1, P.cream);
      for (let x = 3 + (f ? 2 : 0); x < 14; x += 4) r(g, x, 2, 1, 8, P.yelD);
      r(g, 6, 4, 4, 4, P.ink); r(g, 7, 5, 2, 2, P.lime);
    });
  }
  function crate(w) {
    return ol(w, 12, (g) => {
      for (let x = 0; x < w; x += 16) {
        r(g, x + 1, 1, 14, 10, '#c89050'); r(g, x + 1, 1, 14, 1, '#e8b878'); r(g, x + 1, 10, 14, 1, '#805020');
        r(g, x + 2, 2, 12, 1, '#805020'); r(g, x + 2, 9, 12, 1, '#805020'); for (let i = 0; i < 6; i++) r(g, x + 3 + i * 2, 3 + i, 2, 1, '#805020');
      }
    });
  }
  function barge(w) {
    return ol(w, 12, (g) => {
      r(g, 1, 6, w - 2, 5, '#a83820'); r(g, 3, 10, w - 6, 1, '#681808'); r(g, 1, 6, w - 2, 1, P.white);
      const cc = [P.blu, P.grn, P.yel, P.red];
      for (let x = 4, i = 0; x < w - 12; x += 12, i++) { r(g, x, 1, 10, 5, cc[i % 4]); r(g, x, 1, 10, 1, P.white); r(g, x + 3, 2, 1, 3, P.ink); }
      r(g, w - 9, 2, 6, 4, P.white); r(g, w - 8, 3, 4, 1, P.glass);
    });
  }

  // ------------------------------------------------------------------ trains
  const TRAIN = {
    works: [['#d02818', '#801008'], ['#2858c8', '#102878'], ['#e8a810', '#986808'], ['#3c8c38', '#1c5c18'], ['#8c5c3c', '#5c3418']],
    city: [['#8c8c9c', '#4c4c5c'], ['#c8c8d8', '#7c7c8c']]
  };
  function loco(th) {
    return ol(32, 15, (g) => {
      const m = th === 'city' ? '#2878d8' : '#e83818', d = th === 'city' ? '#104898' : '#901808';
      r(g, 1, 2, 26, 9, m); r(g, 27, 5, 4, 6, m); r(g, 1, 9, 30, 2, d); r(g, 1, 2, 26, 1, P.white);
      r(g, 20, 3, 5, 3, P.glass); r(g, 3, 5, 15, 1, P.yel); r(g, 30, 6, 1, 2, P.head); r(g, 8, 0, 3, 2, P.g3);
      wheel(g, 6, 11); wheel(g, 13, 11); wheel(g, 20, 11); wheel(g, 27, 11);
    });
  }
  function boxcar(i, th) {
    const set = TRAIN[th === 'city' ? 'city' : 'works'], [m, d] = set[i % set.length];
    return ol(32, 15, (g) => {
      r(g, 1, 1, 30, 10, m); r(g, 1, 9, 30, 2, d); r(g, 1, 1, 30, 1, P.white);
      r(g, 12, 3, 8, 6, d); r(g, 15, 3, 1, 6, m);
      r(g, 0, 8, 1, 2, P.g3); r(g, 31, 8, 1, 2, P.g3);
      wheel(g, 6, 11); wheel(g, 25, 11);
    });
  }

  // ------------------------------------------------------------------ belts / timed hazards
  function saw(f) {
    return mk(16, 16, (g) => {
      G.to(g, () => {
        G.disc(8, 8, 7, P.g1);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + (f ? Math.PI / 8 : 0); r(g, Math.round(8 + Math.cos(a) * 7) - 1, Math.round(8 + Math.sin(a) * 7) - 1, 2, 2, P.white); }
        G.disc(8, 8, 4, P.g2); G.disc(8, 8, 1, P.ink);
      });
    });
  }
  function gear(f) {
    return outline(mk(32, 16, (g) => {
      G.to(g, () => {
        G.disc(16, 9, 7, P.yelD);
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + (f ? Math.PI / 10 : 0); r(g, Math.round(16 + Math.cos(a) * 7) - 1, Math.round(9 + Math.sin(a) * 7) - 1, 3, 3, P.yel); }
        G.disc(16, 9, 3, P.g3); G.disc(16, 9, 1, P.g1);
      });
    }));
  }

  // ------------------------------------------------------------------ small things
  const fly = (f) => ol(9, 7, (g) => { r(g, 3, 3, 3, 2, P.g4); r(g, 6, 3, 1, 1, P.red); r(g, f ? 1 : 2, f ? 1 : 2, 3, 2, P.glass); r(g, f ? 5 : 4, f ? 1 : 2, 2, 2, P.glass); });
  const leaf = () => ol(10, 9, (g) => {
    r(g, 2, 3, 6, 3, P.grnL); r(g, 3, 2, 4, 5, P.grnL); r(g, 4, 1, 2, 7, P.grnL); r(g, 3, 4, 5, 1, P.grn); r(g, 1, 4, 1, 1, '#3c7800');
    r(g, 6, 1, 2, 2, P.pink); r(g, 7, 2, 1, 1, P.yel);
  });
  const gatorHead = (up) => ol(22, 12, (g) => {
    const b = '#4c8c18', l = '#8cc838';
    if (!up) { r(g, 4, 6, 14, 4, b); r(g, 5, 4, 3, 3, l); r(g, 14, 4, 3, 3, l); r(g, 6, 5, 1, 1, P.ink); r(g, 15, 5, 1, 1, P.ink); return; }
    r(g, 3, 4, 16, 7, b); r(g, 4, 1, 4, 4, l); r(g, 14, 1, 4, 4, l); r(g, 5, 2, 2, 2, P.ink); r(g, 15, 2, 2, 2, P.ink);
    r(g, 5, 7, 12, 2, '#c82828'); for (let x = 5; x < 17; x += 2) { r(g, x, 6, 1, 1, P.white); r(g, x + 1, 9, 1, 1, P.white); }
  });
  const heart = () => ol(9, 8, (g) => { r(g, 1, 1, 3, 3, P.red); r(g, 5, 1, 3, 3, P.red); r(g, 1, 3, 7, 2, P.red); r(g, 2, 5, 5, 1, P.red); r(g, 3, 6, 3, 1, P.red); r(g, 2, 2, 1, 1, P.white); });

  const S = {
    outline, mk, PAL: P, CAR_HUES,
    vehicle(kind, hue, dir, frame) {
      const h = HUED[kind] ? hue % HUED[kind] : 0, f = ANIM[kind] ? frame & 1 : 0;
      const key = 'v' + kind + h + f;
      const img = get(key, () => MAKERS[kind](h, f));
      return dir < 0 ? get(key + 'm', () => G.mirror(img)) : img;
    },
    log: (w) => get('log' + w, () => log(w)),
    turtle: (f) => get('turtle' + f, () => turtle(f)),
    raft: (w, th) => get('raft' + w + th, () => raft(w, th)),
    pad: (sink, f) => get('pad' + sink + f, () => pad(sink, f)),
    gator(open, dir) { const k = 'gator' + (open ? 1 : 0); const img = get(k, () => gator(open)); return dir < 0 ? get(k + 'm', () => G.mirror(img)) : img; },
    floe: (w, cracked) => get('floe' + w + cracked, () => floe(w, cracked)),
    barrel: (f) => get('barrel' + f, () => barrel(f)),
    crate: (w) => get('crate' + w, () => crate(w)),
    barge(w, dir) { const k = 'barge' + w; const img = get(k, () => barge(w)); return dir < 0 ? get(k + 'm', () => G.mirror(img)) : img; },
    loco(th, dir) { const k = 'loco' + th; const img = get(k, () => loco(th)); return dir < 0 ? get(k + 'm', () => G.mirror(img)) : img; },
    boxcar: (i, th) => get('box' + i + th, () => boxcar(i, th)),
    saw: (f) => get('saw' + f, () => saw(f)),
    gear: (f) => get('gear' + f, () => gear(f)),
    fly: (f) => get('fly' + f, () => fly(f)),
    leaf: () => get('leaf', leaf),
    gatorHead: (up) => get('gh' + up, () => gatorHead(up)),
    heart: () => get('heart', heart),
    kinds: Object.keys(MAKERS)
  };
  return S;
})();
