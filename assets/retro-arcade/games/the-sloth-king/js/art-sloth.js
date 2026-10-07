/* SLOTH ART — the Slothba puppet rig (and every other sloth: the king, the queen, Luna).
   A sloth is drawn from shaded parts (body, head with the face mask and eye stripes,
   two-segment arms with three big claws, short legs) posed by joint angles, then outlined.
   Poses are written in "cub units" (anchor = feet, bottom centre, y up is negative) and
   scaled for the adult form. Every frame is pre-rendered at boot.

   SlothArt.get(look, anim, i) -> Art frame   (look: 'cub' | 'adult' | 'king' | 'queen' | 'luna' | 'baby')
   SlothArt.count(anim)                        frames in an animation
   SlothArt.swing(look, angle)                 the hang pose rotated about the hands (rope swings) */
'use strict';
const SlothArt = (function () {
  const FACE = { base: '#f4deb2', shade: '#d4b080', mask: '#5c3519', eye: '#120803', nose: '#2b150a', mouth: '#70281e', tongue: '#e27080', tooth: '#fffaf0', blush: '#ec9c84', glint: '#ffffff' };
  const CLAW = '#efe4cc', CLAW2 = '#b8a684';

  // looks: fur ramps (shadow, base, light) for near and far side, plus extras
  const LOOKS = {
    cub:   { form: 'cub', fur: ['#5c381b', '#8b5b2f', '#b88550'], far: ['#40260f', '#673f1f', '#835428'], belly: '#d0a46c', pendant: true },
    adult: { form: 'adult', fur: ['#4f2f17', '#7e5129', '#a8743f'], far: ['#38200d', '#5a381b', '#744b25'], belly: '#bf8f5c', mane: ['#331c0c', '#583418', '#7c4e26'], pendant: true },
    king:  { form: 'adult', fur: ['#5a3a1c', '#8e6434', '#b98b4e'], far: ['#3e2810', '#664622', '#80592c'], belly: '#d0a46c', mane: ['#5a3210', '#8a5420', '#b27a34'], crown: true, big: 1.12 },
    queen: { form: 'adult', fur: ['#5e4a36', '#8c735a', '#b49a7c'], far: ['#423324', '#66523e', '#80684f'], belly: '#d8c09c', flower: '#f06aa0' },
    luna:  { form: 'adult', fur: ['#6a4426', '#9a6c40', '#c4935e'], far: ['#4a2e18', '#70492a', '#8c603a'], belly: '#e2b884', flower: '#ffd040' },
    baby:  { form: 'cub', fur: ['#5c381b', '#8b5b2f', '#b88550'], far: ['#40260f', '#673f1f', '#835428'], belly: '#d0a46c', small: 0.8 }
  };
  const FORMS = {
    cub:   { W: 50, H: 50, ax: 25, ay: 46, k: 1, headR: 8, bodyRx: 6.2, bodyRy: 7, aL: [6, 5.8], aR: 1.6, lL: [3.6, 3.2], lR: 2.0, ball: 7 },
    adult: { W: 74, H: 70, ax: 37, ay: 66, k: 1.42, headR: 9.2, bodyRx: 8.8, bodyRy: 10.4, aL: [8.6, 8.4], aR: 2.2, lL: [5.6, 5], lR: 2.7, ball: 10 }
  };

  // ------------------------------------------------------------------ poses (cub units)
  const STAND = { b: [0, -11], bt: 0, h: [1, -23], ht: 0, face: 'n', aN: [2.5, -15, 58, 112], aF: [-1, -15, 112, 70], lN: [1.5, -6.5, 85, 95], lF: [-1.5, -6.5, 95, 85] };
  const P = (o) => Object.assign({}, STAND, o);
  const S = Math.sin, Cs = Math.cos;

  const ANIMS = {
    idle: (i) => {
      const d = [0, 0, 0.6, 0.6][i], sw = [0, 2, 4, 2][i];
      return P({ b: [0, -11 + d * 0.5], h: [1, -23 + d], aN: [2.5, -15 + d * 0.5, 58 + sw, 112 + sw], aF: [-1, -15 + d * 0.5, 112 - sw, 70] });
    },
    blink: () => P({ face: 'blink' }),
    run: (i) => {
      const p = i / 8 * Math.PI * 2, bob = -Math.abs(S(p)) * 1.1;
      const leg = (q) => { const th = 90 - 44 * S(q); return [th, th + 12 + 58 * Math.max(0, Cs(q))]; };
      const arm = (q) => { const u = 90 + 55 * S(q); return [u, u - 40]; };
      const [nt, ns] = leg(p), [ft, fs] = leg(p + Math.PI), [nu, nf] = arm(p), [fu, ff] = arm(p + Math.PI);
      return P({ b: [1, -11 + bob], bt: 0.14, h: [3.2, -22.6 + bob], ht: 0.06, aN: [2.4, -15 + bob, nu, nf], aF: [-0.6, -15 + bob, fu, ff],
        lN: [1.5, -6.6 + bob, nt, ns], lF: [-1.5, -6.6 + bob, ft, fs] });
    },
    skid: () => P({ b: [-0.5, -10.5], bt: -0.2, h: [-0.5, -22], ht: -0.18, face: 'grit', aN: [1.5, -14.5, 165, 140], aF: [-1.5, -14.5, 190, 160], lN: [1.5, -6, 38, 72], lF: [-1.5, -6, 118, 98] }),
    jump: () => P({ b: [0, -12], bt: 0.05, h: [2, -24.2], face: 'happy', aN: [2, -16, -55, -78], aF: [-1, -16, -105, -112], lN: [1.5, -7.5, 48, 122], lF: [-1.5, -7.5, 108, 142] }),
    peak: () => P({ b: [0, -12], h: [1.6, -24], aN: [2, -16, -12, 8], aF: [-1, -16, 192, 172], lN: [1.5, -7, 66, 104], lF: [-1.5, -7, 104, 116] }),
    fall: (i) => P({ b: [0, -12], h: [1, -24], face: 'up', aN: [2, -16, i ? -100 : -120, i ? -80 : -100], aF: [-1, -16, i ? -78 : -60, i ? -96 : -80],
      lN: [1.5, -7, i ? 76 : 88, 92], lF: [-1.5, -7, i ? 104 : 96, 86] }),
    land: () => P({ b: [0, -9], bsy: 0.86, h: [2, -20.5], aN: [2, -13, 62, 92], aF: [-1, -13, 82, 100], lN: [1.5, -5, 38, 122], lF: [-1.5, -5, 62, 112] }),
    crouch: () => P({ b: [0, -8.6], bsy: 0.84, h: [3, -18.6], ht: 0.12, aN: [2.5, -12.5, 55, 88], aF: [-0.5, -12.5, 75, 96], lN: [1.5, -5, 38, 122], lF: [-1.5, -5, 62, 112] }),
    lookup: () => P({ h: [0.4, -23.6], ht: -0.42, face: 'up', aN: [2, -15, 95, 105], aF: [-1, -15, 110, 100] }),
    attack: (i) => [
      P({ b: [-0.5, -11], bt: -0.12, h: [0, -23], ht: -0.1, face: 'grit', aN: [2, -15, -128, -165], aF: [-1, -15, 150, 128], lN: [2, -6.5, 60, 100], lF: [-2, -6.5, 116, 96] }),
      P({ b: [1.6, -11], bt: 0.24, h: [4.2, -22], ht: 0.1, face: 'roar', aN: [3.2, -15, 2, 12], aF: [-0.5, -15, 150, 122], lN: [2, -6.5, 44, 96], lF: [-2, -6.5, 126, 102] }),
      P({ b: [1, -11], bt: 0.16, h: [3.4, -22.4], face: 'grit', aN: [3, -15, 62, 96], aF: [-0.8, -15, 140, 118], lN: [2, -6.5, 54, 98], lF: [-2, -6.5, 122, 100] })
    ][i],
    roar: (i) => P({ b: [-0.6, -11.6], bt: -0.13, h: [1 - i * 0.3, -24.2 + i * 0.3], ht: -0.36, face: 'roar',
      aN: [2, -15.5, -38 + i * 8, -18 + i * 8], aF: [-1, -15.5, -150 - i * 6, -172], lN: [2, -6.6, 62, 100], lF: [-2, -6.6, 120, 82] }),
    hurt: () => P({ b: [-1, -11], bt: -0.32, h: [-1.6, -22.4], ht: -0.36, face: 'hurt', aN: [2, -15, -100, -142], aF: [-1, -15, -150, -172], lN: [1.5, -6.5, 58, 80], lF: [-1.5, -6.5, 122, 142] }),
    dead: () => P({ b: [-1, -11], bt: -0.32, h: [-1.6, -22.4], ht: -0.36, face: 'dead', aN: [2, -15, -100, -142], aF: [-1, -15, -150, -172], lN: [1.5, -6.5, 58, 80], lF: [-1.5, -6.5, 122, 142] }),
    hang: (i) => {
      const sw = [0, 7, 0, -7][i];
      return P({ b: [-0.5 - sw * 0.05, -11.5], h: [4.6, -17.8], ht: 0.1, aN: [3, -18, -80, -95, -10], aF: [-1, -18, -95, -85, -20],
        lN: [1, -6, 95 - sw, 85 - sw * 1.3], lF: [-1.6, -6, 92 - sw, 80 - sw] });
    },
    hangmove: (i) => {
      const f = [1, 0, -1, 0][i];
      const n = f > 0 ? [-68, -82] : f < 0 ? [-108, -100] : [-80, -95];
      const r = f < 0 ? [-74, -84] : f > 0 ? [-110, -98] : [-95, -85];
      return P({ b: [-0.3, -11.5], h: [4.6, -17.6 + Math.abs(f) * 0.4], ht: 0.1, aN: [3, -18, n[0], n[1], -10], aF: [-1, -18, r[0], r[1], -20],
        lN: [1, -6, 92 - f * 10, 84 - f * 14], lF: [-1.6, -6, 92 + f * 10, 84 + f * 12] });
    },
    climb: (i) => {
      const up = i % 2 === 0, d = [0, -0.6, 0, -0.6][i];
      return P({ b: [-1.4, -12 + d], bt: -0.06, h: [1.2, -23.4 + d], ht: -0.2, face: i === 3 ? 'blink' : 'n',
        aN: up ? [1.6, -16 + d, -58, -98] : [1.6, -16 + d, -18, -62], aF: up ? [-1.2, -16 + d, -20, -60] : [-1.2, -16 + d, -62, -100],
        lN: up ? [1, -6.6 + d, 40, 108] : [1, -6.6 + d, 66, 112], lF: up ? [-1.6, -6.6 + d, 70, 112] : [-1.6, -6.6 + d, 42, 106] });
    },
    pull: (i) => i === 0
      ? P({ b: [0, -11.5], h: [3.4, -19.6], ht: 0.1, face: 'grit', aN: [3, -18, -52, -66], aF: [0, -18, -60, -72], lN: [1, -6, 92, 84], lF: [-1.6, -6, 98, 88] })
      : P({ b: [2.4, -15.5], bt: 0.3, h: [6, -24], ht: 0.2, face: 'grit', aN: [4, -20, 10, 70], aF: [1, -20, 30, 80], lN: [1.6, -10, 20, 110], lF: [-1, -10, 80, 100] }),
    win: (i) => P({ b: [0, -11.5], h: [1, -24], ht: -0.22, face: 'happy', aN: [2, -15.5, i ? -70 : -55, i ? -90 : -72], aF: [-1, -15.5, i ? -112 : -125, i ? -96 : -108],
      lN: [1.5, -6.6, 80, 96], lF: [-1.5, -6.6, 100, 86] }),
    yawn: () => P({ h: [0.6, -23.4], ht: -0.3, face: 'yawn', aN: [2, -15, -48, -112], aF: [-1, -15, 104, 88] }),
    sleep: (i) => P({ b: [0, -10.5], h: [1.6, -21.6 + i * 0.5], ht: 0.36, face: 'sleep', aN: [2, -14.5, 86, 93], aF: [-1, -14.5, 96, 88] }),
    sit: () => P({ b: [0, -7.5], bsy: 0.92, h: [1.4, -19.5], face: 'n', aN: [2, -11.5, 60, 100], aF: [-1, -11.5, 80, 100], lN: [1.5, -3, 0, 80], lF: [-1.5, -3, 10, 90] }),
    roll: (i) => ({ ball: i / 8 * Math.PI * 2 }),
    tumble: (i) => ({ ball: i / 4 * Math.PI * 2, dizzy: true })
  };
  const COUNTS = { idle: 4, blink: 1, run: 8, skid: 1, jump: 1, peak: 1, fall: 2, land: 1, crouch: 1, lookup: 1, attack: 3, roar: 2, hurt: 1, dead: 1,
    hang: 4, hangmove: 4, climb: 4, pull: 2, win: 2, yawn: 1, sleep: 2, sit: 1, roll: 8, tumble: 4 };

  // ------------------------------------------------------------------ renderer
  function render(lookName, pose) {
    const L = LOOKS[lookName], F = FORMS[L.form], big = L.big || L.small || 1;
    const c = Px.canvas(F.W, F.H), g = c.getContext('2d');
    const k = F.k * big;
    const X = (x) => F.ax + x * k, Y = (y) => F.ay + y * k;
    if (pose.ball !== undefined) { ball(g, L, F, X, Y, pose, big); return c; }

    const limbPts = (l, lens) => {
      const s = [X(l[0]), Y(l[1])], e = Art.pol(s[0], s[1], lens[0] * big, l[2]), h = Art.pol(e[0], e[1], lens[1] * big, l[3]);
      return [s, e, h];
    };
    const INK = '#24130a';
    const arm = (l, ramp, near) => {
      const pts = limbPts(l, F.aL);
      if (near) Px.stroke(g, pts, F.aR * big + 0.6, INK);
      Art.limb(g, pts, F.aR * big, near ? [ramp[1], ramp[2]] : ramp);
      claws(g, pts[2], l[4] === undefined ? l[3] : l[4], F.form === 'adult' ? 4 : 3);
    };
    const leg = (l, ramp, near) => {
      const pts = limbPts(l, F.lL);
      if (near) Px.stroke(g, pts, F.lR * big + 0.6, INK);
      Art.limb(g, pts, F.lR * big, ramp);
      const f = pts[2], fr = F.form === 'adult' ? 3.2 : 2.4;
      Art.ell(g, f[0] + 1, f[1] - 0.5, fr * big, 1.5 * big, 0, ramp[0]);
      Art.ell(g, f[0] + 0.6, f[1] - 1, (fr - 0.8) * big, 0.9 * big, 0, ramp[1]);
      Art.px(g, f[0] + fr * big + 0.6, f[1] - 0.6, CLAW);
      Art.px(g, f[0] + fr * big - 0.6, f[1] + 0.2, CLAW2);
    };

    const far = L.far, fur = L.fur;
    leg(pose.lF, far);
    arm(pose.aF, far);
    // body
    const bx = X(pose.b[0]), by = Y(pose.b[1]), brx = F.bodyRx * big * (pose.bsx || 1), bry = F.bodyRy * big * (pose.bsy || 1), bt = pose.bt || 0;
    Art.blob(g, bx, by, brx, bry, bt, fur);
    Art.ell(g, bx + brx * 0.36 * Math.cos(bt) + 0.5, by + bry * 0.18, brx * 0.5, bry * 0.62, bt, L.belly);
    // shaggy fur strands along the back
    for (let j = -2; j <= 2; j++) Art.px(g, bx - brx * 0.7 + j * 0.3, by + j * bry * 0.28, fur[0]);
    leg(pose.lN, fur, true);
    if (L.mane) mane(g, L, F, X(pose.h[0]), Y(pose.h[1]), pose.ht || 0, big, bx, by);
    if (L.pendant) {
      const pxx = bx + brx * 0.45, pyy = by - bry * 0.45;
      Art.px(g, pxx, pyy, '#ffd84a'); Art.px(g, pxx + 1, pyy, '#c08a1a'); Art.px(g, pxx, pyy + 1, '#c08a1a');
    }
    head(g, L, F, X(pose.h[0]), Y(pose.h[1]), pose.ht || 0, pose.face, big);
    arm(pose.aN, fur, true);
    return c;
  }

  // three ivory claws curling down from the hand along direction a (degrees)
  function claws(g, h, a, len) {
    for (let j = -1; j <= 1; j++) {
      const base = Art.pol(h[0], h[1], 1, a), off = Art.pol(base[0], base[1], j * 1.1, a + 90);
      const tip = Art.pol(off[0], off[1], len - 1, a + 18);
      Art.line(g, off[0], off[1], tip[0], tip[1], j === 1 ? CLAW2 : CLAW);
    }
  }

  function mane(g, L, F, cx, cy, ht, big, bx, by) {
    const r = F.headR * big;
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * Math.PI * 2, spike = i % 2 ? 1 : 0;
      const rr = r + 1.8 * big + spike * 2.4 * big + (Math.cos(a) < 0 ? 1.6 : -1.8);
      pts.push([cx - 1.6 + Math.cos(a + ht) * rr, cy + 0.8 + Math.sin(a + ht) * rr * 0.96]);
    }
    Art.poly(g, pts, L.mane[0]);
    Art.ell(g, cx - 2, cy + 0.6, r + 1.4 * big, r + 1.2 * big, 0, L.mane[1]);
    Art.ell(g, cx - 3.6, cy - 2.2, r * 0.8, r * 0.7, 0, L.mane[2]);
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + 2; Art.px(g, cx - 2 + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1), L.mane[0]); }
    // ruff spilling onto the chest
    Art.ell(g, cx - 1, cy + r * 0.9, r * 0.75, r * 0.6, 0, L.mane[1]);
    Art.ell(g, cx - 1.6, cy + r * 0.8, r * 0.5, r * 0.36, 0, L.mane[2]);
  }

  function head(g, L, F, cx, cy, t, face, big) {
    const r = F.headR * big, ca = Math.cos(t), sa = Math.sin(t);
    const at = (dx, dy) => [cx + (dx * ca - dy * sa) * r / 8, cy + (dx * sa + dy * ca) * r / 8];
    const fur = L.fur;
    // tuft
    const t1 = at(-2, -7.5), t2 = at(-1, -10.5), t3 = at(-4.6, -6.6), t4 = at(-5.6, -9), t5 = at(0.5, -7.6), t6 = at(1.6, -9.6);
    Art.line(g, t1[0], t1[1], t2[0], t2[1], fur[0]); Art.line(g, t3[0], t3[1], t4[0], t4[1], fur[0]); Art.line(g, t5[0], t5[1], t6[0], t6[1], fur[1]);
    Art.ell(g, cx, cy, r + 0.9, r * 0.94 + 0.9, 0, '#24130a');
    Art.blob(g, cx, cy, r, r * 0.94, 0, fur);
    // shaggy fringe
    for (let j = 0; j < 5; j++) { const q = at(-7.4 + j * 0.2, -3 + j * 1.8); Art.px(g, q[0], q[1], fur[0]); }
    // face mask (cream, covering the front of the head)
    const m = at(2.2, 0.9), ms = at(2.6, 2.2);
    Art.ell(g, ms[0], ms[1], r * 0.66, r * 0.56, t, FACE.shade);
    Art.ell(g, m[0], m[1], r * 0.68, r * 0.6, t, FACE.base);
    // dark eye stripe sweeping back from the eye toward the ear
    const s = at(-0.2, -0.4);
    Art.ell(g, s[0], s[1], r * 0.46, r * 0.16, t + 0.22, FACE.mask);
    const s2 = at(1.8, -1.2);
    Art.ell(g, s2[0], s2[1], r * 0.24, r * 0.2, t, FACE.mask);
    if (L.crown) crown(g, at, r);
    if (L.flower) { const f = at(-3.5, -6); Art.ell(g, f[0], f[1], 1.6, 1.6, 0, L.flower); Art.px(g, f[0], f[1], '#fff6a0'); }
    // eye
    const e = at(3.3, -1.6), ex = Math.round(e[0]), ey = Math.round(e[1]);
    const big2 = F.form === 'adult';
    switch (face) {
      case 'blink': case 'sleep':
        Art.rect(g, ex - 1, ey + 1, 3, 1, FACE.eye); break;
      case 'yawn':
        Art.rect(g, ex - 1, ey + 1, 3, 1, FACE.eye); break;
      case 'happy':
        Art.px(g, ex - 1, ey + 1, FACE.eye); Art.px(g, ex, ey, FACE.eye); Art.px(g, ex + 1, ey + 1, FACE.eye); break;
      case 'hurt':
        Art.px(g, ex - 1, ey - 1, FACE.eye); Art.px(g, ex, ey, FACE.eye); Art.px(g, ex + 1, ey + 1, FACE.eye); Art.px(g, ex, ey + 2, FACE.eye); Art.px(g, ex - 1, ey + 3, FACE.eye); break;
      case 'dead':
        Art.px(g, ex - 1, ey - 1, FACE.eye); Art.px(g, ex + 1, ey + 1, FACE.eye); Art.px(g, ex, ey, FACE.eye); Art.px(g, ex + 1, ey - 1, FACE.eye); Art.px(g, ex - 1, ey + 1, FACE.eye); break;
      case 'roar': case 'grit':
        Art.rect(g, ex - 1, ey, 2, 2, FACE.eye); Art.px(g, ex, ey, FACE.glint);
        Art.line(g, ex - 2, ey - 2, ex + 2, ey - 1, fur[0]); break;
      case 'up':
        Art.rect(g, ex - 1, ey - 1, 2, 3, FACE.eye); Art.px(g, ex, ey - 1, FACE.glint); break;
      default:
        Art.rect(g, ex - 1, ey - 1, 2, 3, FACE.eye); Art.px(g, ex, ey - 1, FACE.glint); Art.px(g, ex + 1, ey + 1, FACE.base);
        if (big2) Art.line(g, ex - 2, ey - 3, ex + 1, ey - 3, fur[0]);
    }
    // nose
    const n = at(6.4, 0.6);
    Art.rect(g, n[0] - 1, n[1] - 0.5, 2, 2, FACE.nose);
    Art.px(g, n[0] - 1, n[1] - 0.5, '#6a4632');
    // mouth
    const mo = at(4.8, 3.6);
    if (face === 'roar' || face === 'yawn') {
      Art.ell(g, mo[0], mo[1] + 0.5, r * 0.28, r * 0.3, t, FACE.mouth);
      Art.ell(g, mo[0], mo[1] + 1.4, r * 0.16, r * 0.12, t, FACE.tongue);
      if (face === 'roar') { Art.px(g, mo[0] + r * 0.2, mo[1] - r * 0.12, FACE.tooth); Art.px(g, mo[0] - r * 0.15, mo[1] - r * 0.15, FACE.tooth); }
    } else if (face === 'hurt' || face === 'dead') {
      Art.line(g, mo[0] - 1, mo[1] + 1, mo[0] + 1, mo[1], FACE.mouth);
    } else if (face === 'grit') {
      Art.rect(g, mo[0] - 1, mo[1], 3, 1, FACE.tooth); Art.rect(g, mo[0] - 1, mo[1] + 1, 3, 1, FACE.mouth);
    } else if (face === 'happy') {
      Art.ell(g, mo[0], mo[1], 1.3, 1, t, FACE.mouth); Art.px(g, mo[0], mo[1] + 1, FACE.tongue);
    } else {
      const a1 = at(3.6, 3), a2 = at(4.8, 3.8), a3 = at(6, 3.2);
      Art.px(g, a1[0], a1[1], FACE.mouth); Art.px(g, a2[0], a2[1], FACE.mouth); Art.px(g, a3[0], a3[1], FACE.mouth);
    }
    if (face !== 'roar' && face !== 'dead') { const b = at(1.6, 2.6); Art.px(g, b[0], b[1], FACE.blush); }
  }

  function crown(g, at, r) {
    // a leafy gold circlet on the brow
    const a = at(-5, -5.6), b = at(2, -7.4);
    Art.line(g, a[0], a[1], b[0], b[1], '#b8861a');
    Art.line(g, a[0], a[1] - 1, b[0], b[1] - 1, '#ffd84a');
    for (let i = 0; i < 4; i++) {
      const p = at(-4.4 + i * 2, -7.2 - i * 0.5);
      Art.px(g, p[0], p[1] - 1, '#ffe98a'); Art.px(g, p[0], p[1] - 2, '#ffd84a');
    }
    const gem = at(-1, -7.2);
    Art.px(g, gem[0], gem[1] - 1, '#e04040');
  }

  // rolled-up ball with the face peeking out as it turns
  function ball(g, L, F, X, Y, pose, big) {
    const r = F.ball * big, cx = X(0), cy = Y(0) - r - 0.5, a = pose.ball;
    Art.blob(g, cx, cy, r, r, 0, L.fur);
    if (L.mane) Art.ell(g, cx - r * 0.2, cy - r * 0.2, r * 0.6, r * 0.6, 0, L.mane[1]);
    // fur curl
    for (let j = 0; j < 9; j++) {
      const q = a + j * 0.42, d = r * (0.3 + j * 0.06);
      Art.px(g, cx + Math.cos(q) * d, cy + Math.sin(q) * d, L.fur[0]);
    }
    // face patch + claws around the rim
    const fa = a + Math.PI * 0.25, fx = cx + Math.cos(fa) * r * 0.55, fy = cy + Math.sin(fa) * r * 0.55;
    Art.ell(g, fx, fy, r * 0.36, r * 0.3, fa, FACE.base);
    Art.px(g, fx + Math.cos(fa + 1.2), fy + Math.sin(fa + 1.2), pose.dizzy ? FACE.eye : FACE.mask);
    Art.px(g, fx + Math.cos(fa) * 1.6, fy + Math.sin(fa) * 1.6, FACE.nose);
    for (let j = 0; j < 3; j++) {
      const q = a + Math.PI + j * 0.5, x0 = cx + Math.cos(q) * (r - 0.5), y0 = cy + Math.sin(q) * (r - 0.5);
      Art.line(g, x0, y0, x0 + Math.cos(q + 1.2) * 2.5, y0 + Math.sin(q + 1.2) * 2.5, CLAW);
    }
  }

  // ------------------------------------------------------------------ frame store
  const frames = {};
  function get(look, anim, i) {
    const key = look + ':' + anim;
    let list = frames[key];
    if (!list) {
      const L = LOOKS[look], F = FORMS[L.form], n = COUNTS[anim] || 1;
      list = frames[key] = [];
      for (let j = 0; j < n; j++) list.push(Art.frame(Art.outline(render(look, ANIMS[anim](j))), F.ax, F.ay));
    }
    return list[((i % list.length) + list.length) % list.length];
  }
  const swings = {};
  function swing(look, ang) {
    const step = Math.round(ang / (Math.PI / 16));
    const key = look + step;
    if (!swings[key]) {
      const f = get(look, 'hang', 0), F = FORMS[LOOKS[look].form];
      const hy = F.ay - 28 * F.k * (LOOKS[look].big || 1);   // pivot = the hands
      const r = Art.rotate(f.c, step * Math.PI / 16, f.ax + 1, hy);
      swings[key] = Art.frame(r.c, r.ox, r.oy);
    }
    return swings[key];
  }
  function prebuild() {
    for (const look of ['cub', 'adult']) for (const a in COUNTS) get(look, a, 0);
  }

  return { get, swing, prebuild, count: (a) => COUNTS[a] || 1, LOOKS, FORMS, render, FACE };
})();
