/* CHARACTER ART — every enemy, boss, friend and herd animal, drawn in code with the
   shaded-part kit and outlined like 16-bit sprites. Frames are built lazily and cached.
   CharArt.get(name, anim, i) -> Art frame (anchor = feet, bottom centre, unless noted)
   CharArt.count(name, anim)  */
'use strict';
const CharArt = (function () {
  const A = Art;
  const mk = (w, h, ax, ay, fn) => A.build(w, h, ax, ay, fn);

  // ------------------------------------------------------------------ shared quadruped
  // o: { S scale, body:[x,y,rx,ry,tilt], fs:[x,y] front shoulder, bh:[x,y] back hip, fl:[l1,l2], bl:[l1,l2], lr leg radius,
  //      fur, far, hoof colour, gait: 'walk'|'run'|'stand'|'pounce'|'crouch', p phase }
  function quad(g, ax, ay, o) {
    const S = o.S || 1, X = (x) => ax + x * S, Y = (y) => ay + y * S;
    const p = o.p || 0;
    let ff, fb, bf, bb;   // angle pairs [thigh, shin] for front-near, front-far, back-near, back-far
    const swing = o.gait === 'run' ? 38 : 26;
    const legF = (q) => { const th = 90 - swing * Math.sin(q); return [th, th + 4 + 30 * Math.max(0, Math.cos(q))]; };
    const legB = (q) => { const th = 90 - swing * Math.sin(q) + 6; return [th - 8, th + 16 - 26 * Math.max(0, Math.cos(q))]; };
    if (o.gait === 'stand') { ff = [86, 92]; fb = [94, 90]; bf = [84, 104]; bb = [96, 100]; }
    else if (o.gait === 'pounce') { ff = [8, 2]; fb = [20, 12]; bf = [150, 160]; bb = [160, 170]; }
    else if (o.gait === 'crouch') { ff = [60, 110]; fb = [70, 112]; bf = [40, 150]; bb = [50, 150]; }
    else if (o.gait === 'rear') { ff = [-40, -10]; fb = [-60, -30]; bf = [80, 110]; bb = [100, 110]; }
    else { ff = legF(p); fb = legF(p + Math.PI); bf = legB(p + Math.PI); bb = legB(p); }
    const leg = (hip, ang, lens, ramp) => {
      const s = [X(hip[0]), Y(hip[1])], e = A.pol(s[0], s[1], lens[0] * S, ang[0]), f = A.pol(e[0], e[1], lens[1] * S, ang[1]);
      A.limb(g, [s, e, f], (o.lr || 1.8) * S, ramp);
      if (o.hoof) A.rect(g, f[0] - S, f[1] - 0.5, 2.4 * S, 1.6 * S, o.hoof);
      else A.ell(g, f[0] + 0.8 * S, f[1], 1.6 * S, 1 * S, 0, ramp[0]);
    };
    const shift = (pt, dx) => [pt[0] + dx, pt[1]];
    leg(shift(o.fs, -1.5), fb, o.fl, o.far);
    leg(shift(o.bh, -1.5), bb, o.bl, o.far);
    const b = o.body;
    A.blob(g, X(b[0]), Y(b[1]), b[2] * S, b[3] * S, b[4] || 0, o.fur);
    if (o.belly) A.ell(g, X(b[0] + 1), Y(b[1] + b[3] * 0.5), b[2] * 0.7 * S, b[3] * 0.35 * S, b[4] || 0, o.belly);
    leg(o.fs, ff, o.fl, o.fur);
    leg(o.bh, bf, o.bl, o.fur);
    return { X, Y, S };
  }

  // ------------------------------------------------------------------ hyena (and jackal, Cackle, Gnash)
  const HYENA = { fur: ['#7a6236', '#ae9156', '#cdb378'], far: ['#58462a', '#7c6640', '#957d50'], spot: '#4a3a20', mane: '#3a2c1a', muzzle: '#33261a', eye: '#ffe25a', belly: '#c8b07c' };
  const JACKAL = { fur: ['#3c4458', '#5a6680', '#7c8aa6'], far: ['#2a3040', '#3e475c', '#525d74'], spot: null, mane: '#1e2230', muzzle: '#1a1c26', eye: '#ff5a3a', belly: '#8894ae' };
  const CACKLE = { fur: ['#6a4a5a', '#93697c', '#b48ea0'], far: ['#4a3240', '#684a58', '#7e5c6c'], spot: '#3a2030', mane: '#c03030', muzzle: '#2a1820', eye: '#ffe25a', belly: '#c0a0b0', mohawk: true, scar: true };
  const GNASH = { fur: ['#504a44', '#78706a', '#9c948c'], far: ['#38332e', '#544e48', '#6a645e'], spot: '#2a2622', mane: '#1a1614', muzzle: '#1a1614', eye: '#ff7a2a', belly: '#9a9088', armor: true, scar: true };
  function hyena(P, S, anim, i) {
    const W = Math.ceil(52 * S), H = Math.ceil(38 * S), ax = W >> 1, ay = H - 2;
    return mk(W, H, ax, ay, (g) => {
      const gait = anim === 'walk' ? 'walk' : anim === 'run' ? 'run' : anim === 'lunge' ? 'pounce' : anim === 'crouch' ? 'crouch' : 'stand';
      const ph = i / 4 * Math.PI * 2, bob = (anim === 'walk' || anim === 'run') ? Math.abs(Math.sin(ph)) * -0.8 : 0;
      const lunge = anim === 'lunge', laugh = anim === 'laugh', hurt = anim === 'hurt';
      const by = (lunge ? -13 : anim === 'crouch' ? -10 : -14) + bob;
      const q = quad(g, ax, ay, { S, p: ph, gait, body: [-1, by, 11, 6.4, lunge ? -0.05 : -0.2], fs: [6, by - 1], bh: [-8, by + 2], fl: [6, 6.5], bl: [5, 6.5],
        lr: 1.7, fur: P.fur, far: P.far, belly: P.belly });
      const { X, Y } = q;
      // spots & back mane
      if (P.spot) for (const [sx, sy] of [[-6, -1], [-2, -2], [2, -1], [-4, 2], [0, 1], [-9, 0]]) A.px(g, X(sx), Y(by + sy), P.spot);
      A.limb(g, [[X(9), Y(by - 6.5)], [X(1), Y(by - 6.5)], [X(-8), Y(by - 4)]], 1.2 * S, [P.mane, P.mane]);
      if (P.mohawk) for (let k = 0; k < 6; k++) A.limb(g, [[X(8 - k * 2.4), Y(by - 6.5 + k * 0.3)], [X(7 - k * 2.4), Y(by - 10 + k * 0.4)]], 1 * S, [P.mane, '#ff5a5a']);
      if (P.armor) for (let k = 0; k < 3; k++) { const sx = X(6 - k * 6), sy = Y(by - 6); A.poly(g, [[sx - 2 * S, sy + 1], [sx + 2 * S, sy + 1], [sx + 0.5 * S, sy - 5 * S]], '#e8e0cc'); A.px(g, sx, sy - 3 * S, '#ffffff'); }
      // tail
      A.limb(g, [[X(-11), Y(by - 1)], [X(-14), Y(by + 3 + (laugh ? -3 : 0))]], 1.4 * S, [P.mane, P.far[1]]);
      // head
      const hx = lunge ? 15 : 12, hy = (lunge ? by - 3 : by - 7) + (laugh ? (i ? -1 : 0) : 0) + (hurt ? -2 : 0);
      A.ell(g, X(hx - 3), Y(hy + 1), 3.2 * S, 4 * S, 0, P.fur[0]);                    // neck
      A.blob(g, X(hx), Y(hy), 5 * S, 4.4 * S, 0, P.fur);
      A.ell(g, X(hx + 4.6), Y(hy + 1.6), 3.6 * S, 2.3 * S, 0.1, P.muzzle);            // snout
      A.ell(g, X(hx + 4.2), Y(hy + 1), 2.6 * S, 1.2 * S, 0.1, P.fur[1]);
      A.rect(g, X(hx + 7.4), Y(hy + 0.4), 1.6 * S, 1.6 * S, '#140c08');                // nose
      // ears
      A.ell(g, X(hx - 2.5), Y(hy - 4.6), 1.8 * S, 2.2 * S, -0.3, P.fur[0]); A.px(g, X(hx - 2.5), Y(hy - 4.4), P.muzzle);
      A.ell(g, X(hx - 0.2), Y(hy - 5), 1.8 * S, 2.2 * S, 0.2, P.fur[1]); A.px(g, X(hx - 0.2), Y(hy - 4.8), P.muzzle);
      // eye
      if (hurt) { A.line(g, X(hx + 0.8), Y(hy - 2.2), X(hx + 2.4), Y(hy - 0.6), '#140c08'); A.line(g, X(hx + 0.8), Y(hy - 0.6), X(hx + 2.4), Y(hy - 2.2), '#140c08'); }
      else { A.rect(g, X(hx + 1), Y(hy - 2), 2 * S, 1.4 * S, P.eye); A.px(g, X(hx + 2), Y(hy - 1.6), '#140c08'); A.line(g, X(hx), Y(hy - 3), X(hx + 2.8), Y(hy - 2.4), P.muzzle); }
      if (P.scar) A.line(g, X(hx + 0.4), Y(hy - 4), X(hx + 3), Y(hy + 0.6), '#e0c0c0');
      // mouth: grin, laugh or snarl
      if (laugh || lunge || anim === 'run') {
        const open = laugh ? (i ? 2.6 : 1.6) : lunge ? 3 : 1.4;
        A.poly(g, [[X(hx + 2), Y(hy + 2.4)], [X(hx + 8.2), Y(hy + 2.6)], [X(hx + 7), Y(hy + 2.6 + open)], [X(hx + 2.4), Y(hy + 3 + open * 0.6)]], '#5a1414');
        for (let k = 0; k < 3; k++) A.px(g, X(hx + 3.5 + k * 1.5), Y(hy + 2.8), '#fffaf0');
        A.ell(g, X(hx + 4), Y(hy + 3.2 + open), 3 * S, 1 * S, 0.1, P.fur[1]);
      } else {
        A.line(g, X(hx + 3), Y(hy + 2.8), X(hx + 7.5), Y(hy + 2.4), '#140c08');
        A.px(g, X(hx + 6.4), Y(hy + 3.4), '#fffaf0');
      }
    });
  }

  // ------------------------------------------------------------------ boar (warthog; Bruno)
  const BOAR = { fur: ['#3e3030', '#5e4a46', '#7e6660'], far: ['#2a2020', '#403230', '#544442'], mane: '#2a1c18', tusk: '#f4ecd8', snout: '#a87068', belly: '#6e5a54' };
  const BRUNO = { fur: ['#4a2a1e', '#74422c', '#9a6040'], far: ['#321c14', '#4e2e20', '#66402c'], mane: '#1c100a', tusk: '#fff4d8', snout: '#c07868', belly: '#86553c', big: true };
  function boar(P, S, anim, i) {
    const W = Math.ceil(46 * S), H = Math.ceil(32 * S), ax = W >> 1, ay = H - 2;
    return mk(W, H, ax, ay, (g) => {
      const ph = i / 4 * Math.PI * 2, run = anim === 'run', dazed = anim === 'dazed', hurt = anim === 'hurt';
      const by = -11 + (run ? -Math.abs(Math.sin(ph)) : 0);
      const { X, Y } = quad(g, ax, ay, { S, p: ph, gait: run ? 'run' : 'stand', body: [-1, by, 12, 7.2, 0.04], fs: [6, by + 2], bh: [-8, by + 2], fl: [3.6, 4], bl: [3.6, 4], lr: 2.1,
        fur: P.fur, far: P.far, belly: P.belly, hoof: '#1a1210' });
      // bristle mane
      for (let k = 0; k < 9; k++) A.line(g, X(7 - k * 2), Y(by - 6.5 + Math.abs(k - 3) * 0.3), X(6 - k * 2), Y(by - 9.5 + Math.abs(k - 3) * 0.3), P.mane);
      // tail
      A.line(g, X(-13), Y(by - 2), X(-15), Y(by + 2), P.mane); A.px(g, X(-15), Y(by + 3), P.mane);
      // head (low, charging)
      const hx = 12, hy = by + 1 + (dazed ? (i ? -1 : 1) : 0);
      A.blob(g, X(hx), Y(hy), 6 * S, 5.2 * S, 0.3, P.fur);
      A.ell(g, X(hx + 5), Y(hy + 2.4), 2.6 * S, 2.8 * S, 0, P.snout);
      A.rect(g, X(hx + 6.2), Y(hy + 1.6), 1, 1, '#2a1410'); A.rect(g, X(hx + 6.2), Y(hy + 3.2), 1, 1, '#2a1410');
      // warts
      A.px(g, X(hx + 2), Y(hy + 2.4), P.fur[2]); A.px(g, X(hx + 0.5), Y(hy - 0.5), P.fur[2]);
      // tusks
      A.limb(g, [[X(hx + 4), Y(hy + 4.6)], [X(hx + 6), Y(hy + 4)], [X(hx + 7), Y(hy + 1.2)]], 0.8 * S, [P.tusk, P.tusk]);
      // ear and eye
      A.ell(g, X(hx - 3), Y(hy - 5), 1.8 * S, 2.6 * S, -0.6, P.fur[0]);
      if (dazed || hurt) { A.line(g, X(hx), Y(hy - 2.5), X(hx + 2), Y(hy - 0.5), '#fff'); A.line(g, X(hx), Y(hy - 0.5), X(hx + 2), Y(hy - 2.5), '#fff'); }
      else { A.rect(g, X(hx + 0.6), Y(hy - 2), 1.4 * S, 1.4 * S, '#ff3a20'); A.px(g, X(hx + 1), Y(hy - 2), '#ffe0a0'); A.line(g, X(hx - 1), Y(hy - 3.6), X(hx + 2.6), Y(hy - 2.4), '#100808'); }
    });
  }

  // ------------------------------------------------------------------ wildebeest (stampede herd)
  const GNU = { fur: ['#3a3438', '#585058', '#766e74'], far: ['#262226', '#3a343a', '#4c464c'], mane: '#141014', horn: '#d8d0c0', belly: '#4a4248' };
  function gnu(S, i) {
    const W = Math.ceil(54 * S), H = Math.ceil(40 * S), ax = W >> 1, ay = H - 2;
    return mk(W, H, ax, ay, (g) => {
      const ph = i / 4 * Math.PI * 2, by = -17 - Math.abs(Math.sin(ph)) * 1.5;
      const { X, Y } = quad(g, ax, ay, { S, p: ph, gait: 'run', body: [-2, by, 12, 7, -0.15], fs: [6, by + 1], bh: [-10, by + 2], fl: [6, 6.4], bl: [6, 6.4], lr: 1.6,
        fur: GNU.fur, far: GNU.far, hoof: '#141014', belly: GNU.belly });
      // stripes
      for (let k = 0; k < 4; k++) A.line(g, X(-6 + k * 3), Y(by - 4), X(-7 + k * 3), Y(by + 2), GNU.far[0]);
      // mane + beard
      A.limb(g, [[X(9), Y(by - 8)], [X(-2), Y(by - 7)]], 1.4 * S, [GNU.mane, GNU.mane]);
      // head (long face, held low)
      const hx = 12, hy = by - 1;
      A.ell(g, X(hx - 2), Y(hy - 3), 3 * S, 4.6 * S, 0.5, GNU.fur[1]);
      A.blob(g, X(hx + 2), Y(hy + 2), 3 * S, 6 * S, -0.6, GNU.fur);
      A.ell(g, X(hx + 5), Y(hy + 6.5), 2.2 * S, 1.8 * S, 0, '#201c20');
      A.line(g, X(hx + 1), Y(hy + 5), X(hx + 1), Y(hy + 9), GNU.mane); A.line(g, X(hx + 2), Y(hy + 5), X(hx + 2), Y(hy + 8), GNU.mane);
      A.limb(g, [[X(hx - 1), Y(hy - 4)], [X(hx - 5), Y(hy - 6)], [X(hx - 3), Y(hy - 10)]], 0.9 * S, [GNU.horn, '#ffffff']);
      A.limb(g, [[X(hx + 1), Y(hy - 4)], [X(hx + 4), Y(hy - 7)], [X(hx + 2), Y(hy - 10)]], 0.9 * S, [GNU.horn, '#f4ecd8']);
      A.rect(g, X(hx + 2), Y(hy - 1), 1.4, 1.4, '#ffe0a0');
      // tail
      A.limb(g, [[X(-14), Y(by - 2)], [X(-18), Y(by + 1)], [X(-19), Y(by + 5)]], 0.9 * S, [GNU.mane, GNU.mane]);
    });
  }

  // ------------------------------------------------------------------ jaguar (Malgrim)
  const JAG = { fur: ['#1a1a26', '#2c2c3e', '#45455e'], far: ['#101018', '#1e1e2a', '#2c2c3c'], ros: '#d8a838', eye: '#7cff5a', belly: '#3a3a50' };
  function jaguar(anim, i) {
    const S = 1.25, W = 96, H = 56, ax = 48, ay = 54;
    return mk(W, H, ax, ay, (g) => {
      const ph = i / 4 * Math.PI * 2;
      const gait = { walk: 'walk', run: 'run', pounce: 'pounce', crouch: 'crouch', swipe: 'rear', roar: 'stand', hurt: 'stand', idle: 'stand', dizzy: 'stand', fall: 'pounce' }[anim] || 'stand';
      const swipe = anim === 'swipe', pounce = anim === 'pounce' || anim === 'fall';
      const by = { crouch: -10, pounce: -15, fall: -15, swipe: -18 }[anim] || -15.5 + (anim === 'walk' || anim === 'run' ? -Math.abs(Math.sin(ph)) : anim === 'idle' ? (i ? 0.4 : 0) : 0);
      const tilt = swipe ? -0.55 : pounce ? 0.06 : anim === 'crouch' ? 0.05 : -0.04;
      const { X, Y } = quad(g, ax, ay, { S, p: ph, gait, body: [-2, by, 16, 6.8, tilt], fs: swipe ? [6, by - 7] : [9, by], bh: [-12, by + 1], fl: [6.6, 6.4], bl: [6, 6.8], lr: 2.1,
        fur: JAG.fur, far: JAG.far, belly: JAG.belly });
      // golden rosettes
      const ros = [[-12, -2], [-7, -3], [-2, -3.5], [3, -3], [8, -2.5], [-10, 1.5], [-4, 1], [1, 0.6], [6, 1]];
      for (const [rx, ry] of ros) {
        const c = Math.cos(tilt), s = Math.sin(tilt), x = X(-2 + rx * c - ry * s), y = Y(by + rx * s + ry * c);
        A.px(g, x, y, JAG.ros); A.px(g, x + 1, y + 1, '#8a6820');
      }
      // tail — long, curling
      const sw = anim === 'idle' ? (i ? 3 : -2) : Math.sin(ph) * 3;
      A.limb(g, [[X(-17), Y(by - 1)], [X(-24), Y(by - 3 + sw)], [X(-30), Y(by - 9 + sw)], [X(-32), Y(by - 13 + sw * 0.5)]], 1.5 * S, [JAG.fur[0], JAG.fur[1]]);
      A.px(g, X(-32), Y(by - 14 + sw * 0.5), JAG.ros);
      // head
      const hx = swipe ? 11 : pounce ? 18 : 15, hy = swipe ? by - 13 : pounce ? by - 2 : anim === 'crouch' ? by - 2 : by - 6 + (anim === 'roar' ? -2 : 0);
      A.blob(g, X(hx), Y(hy), 6 * S, 5.2 * S, 0, JAG.fur);
      A.ell(g, X(hx + 5), Y(hy + 1.8), 3 * S, 2.4 * S, 0, JAG.fur[1]);
      A.rect(g, X(hx + 7.4), Y(hy + 0.6), 2, 2, '#0a0a10');
      A.ell(g, X(hx - 3), Y(hy - 5), 1.8 * S, 2 * S, -0.4, JAG.fur[0]); A.px(g, X(hx - 3), Y(hy - 4.6), JAG.ros);
      A.ell(g, X(hx - 0.4), Y(hy - 5.4), 1.8 * S, 2 * S, 0.2, JAG.fur[1]);
      // eye + scar
      if (anim === 'hurt' || anim === 'dizzy' || anim === 'fall') {
        A.line(g, X(hx + 1), Y(hy - 3), X(hx + 3.5), Y(hy - 0.5), '#ffffff'); A.line(g, X(hx + 1), Y(hy - 0.5), X(hx + 3.5), Y(hy - 3), '#ffffff');
      } else {
        A.poly(g, [[X(hx + 0.4), Y(hy - 2.4)], [X(hx + 4), Y(hy - 2.2)], [X(hx + 3.4), Y(hy - 0.6)], [X(hx + 0.8), Y(hy - 0.8)]], JAG.eye);
        A.rect(g, X(hx + 2.4), Y(hy - 2.2), 1, 2, '#000000');
        A.line(g, X(hx - 0.6), Y(hy - 3.6), X(hx + 4), Y(hy - 2.6), '#000000');
      }
      A.line(g, X(hx + 1.6), Y(hy - 5), X(hx + 3.4), Y(hy + 1.2), '#c86a6a');
      // whiskers
      A.px(g, X(hx + 8.8), Y(hy + 2.4), '#9a9ab0'); A.px(g, X(hx + 9.8), Y(hy + 2.8), '#9a9ab0');
      // mouth
      if (anim === 'roar' || pounce || swipe) {
        A.poly(g, [[X(hx + 2), Y(hy + 2.6)], [X(hx + 9), Y(hy + 3)], [X(hx + 7.6), Y(hy + 7)], [X(hx + 2.4), Y(hy + 5)]], '#601020');
        A.px(g, X(hx + 7.6), Y(hy + 3.6), '#ffffff'); A.px(g, X(hx + 4), Y(hy + 3.4), '#ffffff'); A.px(g, X(hx + 7.4), Y(hy + 5.8), '#ffffff');
      } else A.line(g, X(hx + 3), Y(hy + 3.4), X(hx + 8.4), Y(hy + 3), '#06060a');
      // swiping claws
      if (swipe) {
        const cx = X(6) + Math.cos(-2) * 0, cy = Y(by - 7);
        for (let k = 0; k < 3; k++) A.line(g, cx + 14 * S + k, cy - 15 * S + k * 2, cx + 17 * S + k, cy - 17 * S + k * 2, '#f0f0f0');
      }
    });
  }

  // ------------------------------------------------------------------ porcupine (Bristleback)
  const PORC = { fur: ['#4a3624', '#6a503a', '#8a6c50'], quill: '#efe2c4', tip: '#2a1c10', face: '#c89a7a' };
  function porcupine(S, anim, i) {
    const W = Math.ceil(34 * S), H = Math.ceil(28 * S), ax = W >> 1, ay = H - 2;
    return mk(W, H, ax, ay, (g) => {
      const X = (x) => ax + x * S, Y = (y) => ay + y * S;
      const flip = anim === 'flipped', curl = anim === 'curl', bristle = anim === 'bristle';
      if (flip) {
        A.blob(g, X(0), Y(-6), 10 * S, 6 * S, 0, PORC.fur);
        A.ell(g, X(0), Y(-8), 7 * S, 3 * S, 0, PORC.face);
        for (let k = 0; k < 4; k++) A.line(g, X(-6 + k * 4), Y(-11), X(-6 + k * 4 + (i ? 1 : -1)), Y(-15), PORC.fur[0]);
        for (let k = 0; k < 9; k++) A.line(g, X(-9 + k * 2.2), Y(-1), X(-10 + k * 2.4), Y(2), PORC.quill);
        A.line(g, X(5), Y(-8), X(7), Y(-6), '#140c08'); A.line(g, X(5), Y(-6), X(7), Y(-8), '#140c08');
        return;
      }
      const cy = curl ? -9 : -7, rx = curl ? 9 : 11, ry = curl ? 9 : 7;
      // quills radiating from the back
      const n = bristle ? 26 : 20, len = bristle ? 8 : 5.5;
      for (let k = 0; k < n; k++) {
        const a = Math.PI + (k + 0.5) / n * Math.PI * (curl ? 2 : 1) + (i ? 0.04 : 0);
        const x0 = X(-1 + Math.cos(a) * rx * 0.7), y0 = Y(cy + Math.sin(a) * ry * 0.7), x1 = X(-1 + Math.cos(a) * (rx + len)), y1 = Y(cy + Math.sin(a) * (ry + len));
        A.line(g, x0, y0, x1, y1, PORC.quill); A.px(g, x1, y1, PORC.tip);
      }
      A.blob(g, X(-1), Y(cy), rx * S, ry * S, 0, PORC.fur);
      if (curl) return;
      // face + feet
      A.ell(g, X(9), Y(-4), 3.4 * S, 2.8 * S, 0.2, PORC.face);
      A.rect(g, X(12), Y(-4.4), 1.6 * S, 1.4 * S, '#3a1a14');
      A.rect(g, X(8.4), Y(-6), 1.2 * S, 1.2 * S, '#140c08');
      for (let k = 0; k < 2; k++) A.ell(g, X(-4 + k * 8 + (i && !bristle ? (k ? -1 : 1) : 0)), Y(-0.8), 2 * S, 1.2 * S, 0, PORC.fur[0]);
    });
  }

  // ------------------------------------------------------------------ small fry
  function snake(pal, anim, i) {
    return mk(36, 28, 18, 26, (g) => {
      const strike = anim === 'strike', hurt = anim === 'hurt';
      A.blob(g, 17, 22, 10, 3.4, 0, pal.body);
      A.blob(g, 16, 18.5, 7.5, 2.8, 0, pal.body);
      for (let k = 0; k < 5; k++) A.px(g, 10 + k * 3.4, 22 - (k % 2), pal.band);
      const hx = strike ? 32 : 20, hy = strike ? 14 : (i ? 7 : 8);
      A.limb(g, [[16, 17], [hx - (strike ? 9 : 4), hy + 5], [hx - 1, hy + 1]], 2.2, pal.body);
      A.blob(g, hx, hy, 3.8, 2.8, 0.15, pal.body);
      if (hurt) A.line(g, hx, hy - 1, hx + 2, hy + 1, '#000');
      else { A.rect(g, hx + 0.4, hy - 1.4, 1.6, 1.4, pal.eye); A.px(g, hx + 1, hy - 1, '#000'); }
      if (i || strike) { A.line(g, hx + 4, hy + 1, hx + 6, hy + 1, '#e02040'); A.px(g, hx + 7, hy, '#e02040'); A.px(g, hx + 7, hy + 2, '#e02040'); }
      if (strike) { A.px(g, hx + 3, hy + 2, '#ffffff'); }
    });
  }
  const SNAKES = {
    savanna: { body: ['#5a5a20', '#8c8a34', '#b8b454'], band: '#3a3410', eye: '#ffe040' },
    jungle: { body: ['#1e5a2a', '#2e8a3c', '#56b85a'], band: '#e8d040', eye: '#ff6020' },
    night: { body: ['#3a2a5a', '#5a428a', '#7e66b4'], band: '#e8e0ff', eye: '#a0ff60' },
    cave: { body: ['#4a3a2a', '#7a5e40', '#a08060'], band: '#2a1a10', eye: '#ff4040' }
  };

  function vulture(pal, anim, i) {
    return mk(48, 38, 24, 19, (g) => {
      const dive = anim === 'dive', hurt = anim === 'hurt';
      const flap = dive ? -2 : [-1, 0, 1, 0][i % 4];          // -1 up, 1 down
      const wing = (near) => {
        const sx = near ? 25 : 22, sy = 15, tipA = dive ? -150 : -100 + flap * 70 + (near ? 0 : -10);
        const tip = A.pol(sx, sy, 17, tipA), mid = A.pol(sx, sy, 9, tipA + 25);
        const pts = [[sx - 3, sy], [mid[0], mid[1]], [tip[0], tip[1]], A.pol(tip[0], tip[1], 5, tipA + 120), A.pol(mid[0], mid[1], 6, tipA + 100), [sx + 4, sy + 2]];
        A.poly(g, pts, near ? pal.wing[1] : pal.wing[0]);
        for (let k = 0; k < 3; k++) { const f = A.pol(tip[0], tip[1], 2 + k * 2, tipA + 100); A.line(g, f[0], f[1], f[0] + Math.cos((tipA) * Math.PI / 180) * 3, f[1] + Math.sin(tipA * Math.PI / 180) * 3, pal.wing[0]); }
      };
      wing(false);
      A.poly(g, [[14, 19], [7, 23], [9, 18]], pal.wing[0]);                                       // tail
      A.blob(g, 22, 19, 8, 5.4, dive ? 0.5 : 0.1, pal.body);
      A.ell(g, 27, 15, 4, 3, 0, pal.ruff);
      const hx = dive ? 33 : 31, hy = dive ? 22 : 12;
      A.limb(g, [[27, 15], [hx - 1, hy + 1]], 1.4, [pal.head[0], pal.head[1]]);
      A.blob(g, hx, hy, 2.8, 2.4, 0, pal.head);
      A.poly(g, [[hx + 2, hy - 1.2], [hx + 6, hy], [hx + 5, hy + 2.4], [hx + 2, hy + 1.2]], pal.beak);
      A.px(g, hx + 5, hy + 2, '#2a2a2a');
      if (hurt) { A.px(g, hx, hy - 1, '#000'); A.px(g, hx + 1, hy, '#000'); } else A.px(g, hx + 0.5, hy - 0.8, '#ff3010');
      A.line(g, 20, 24, 19, 28, pal.beak); A.line(g, 24, 24, 24, 28, pal.beak);
      wing(true);
    });
  }
  const VULTURES = {
    dusk: { body: ['#2a2024', '#40343a', '#584a50'], wing: ['#1e171a', '#3a2e32'], ruff: '#e8e0d0', head: ['#b06058', '#d88a7a', '#f0b0a0'], beak: '#e8d8a8' },
    fire: { body: ['#3a1410', '#5a2018', '#7a3020'], wing: ['#2a0e0a', '#a0301a'], ruff: '#ffb040', head: ['#c04020', '#ff7040', '#ffb080'], beak: '#ffe0a0' }
  };

  function beetle(pal, anim, i) {
    return mk(22, 16, 11, 15, (g) => {
      const flip = anim === 'flipped';
      if (flip) {
        A.blob(g, 11, 9, 7, 4.4, 0, pal.under);
        for (let k = 0; k < 3; k++) A.line(g, 7 + k * 4, 6, 6 + k * 4 + (i ? 2 : 0), 2, '#1a1410');
        return;
      }
      for (let k = 0; k < 3; k++) A.line(g, 7 + k * 4, 12, 6 + k * 4 + (i ? 2 : -1), 15, '#1a1410');
      A.blob(g, 10, 9, 7.4, 5, 0, pal.shell);
      A.line(g, 10, 4.5, 10, 13, pal.shell[0]);
      A.px(g, 7, 6, '#ffffff');
      A.blob(g, 17.4, 10, 2.8, 2.4, 0, pal.head);
      A.line(g, 19, 8, 21, 6, '#1a1410');
      A.px(g, 18.4, 9, pal.eye);
      if (pal.glow && i) A.px(g, 11, 8, '#fff6a0');
    });
  }
  const BEETLES = {
    blue: { shell: ['#1a2a7a', '#2c4ec4', '#78a0ff'], head: ['#101828', '#202838', '#384050'], under: ['#6a4a2a', '#9a7040', '#c09060'], eye: '#ffffff' },
    green: { shell: ['#1a5a2a', '#2ea040', '#88e070'], head: ['#102010', '#203020', '#385038'], under: ['#6a5a2a', '#9a8a40', '#c0b060'], eye: '#ffffff' },
    fire: { shell: ['#7a1a0a', '#d84a14', '#ffb040'], head: ['#200a08', '#3a1410', '#502018'], under: ['#5a3a2a', '#8a5a40', '#b08060'], eye: '#ffe040', glow: true },
    crystal: { shell: ['#3a2a7a', '#6a5ae0', '#c0b8ff'], head: ['#181028', '#282038', '#383050'], under: ['#4a4a6a', '#6a6a9a', '#9090c0'], eye: '#a0ffff' }
  };

  function monkey(anim, i) {
    return mk(30, 32, 15, 31, (g) => {
      const fur = ['#6a3a14', '#9a5a24', '#c8823e'], face = '#e8c8a0';
      const throwing = anim === 'throw', hurt = anim === 'hurt';
      // tail
      A.limb(g, [[9, 26], [3, 28], [2, 22], [5, 19]], 1.1, [fur[0], fur[1]]);
      A.ell(g, 12, 28, 4, 2.4, 0, fur[0]);                   // far leg
      A.blob(g, 14, 21, 5.4, 7, 0.1, fur);
      A.ell(g, 16, 22, 3, 4.6, 0, '#d8a874');                // belly
      A.ell(g, 17, 28, 4, 2.4, 0, fur[1]);                   // near leg
      // head
      const hy = hurt ? 9 : 10;
      A.ell(g, 10, hy, 2.2, 2.4, 0, fur[0]); A.px(g, 10, hy, face);    // ear
      A.blob(g, 15, hy, 5.4, 5, 0, fur);
      A.ell(g, 17.4, hy + 1.2, 3.6, 3.4, 0, face);
      if (hurt) { A.line(g, 16, hy - 1, 18, hy + 1, '#000'); A.line(g, 16, hy + 1, 18, hy - 1, '#000'); }
      else { A.px(g, 16.6, hy - 0.4, '#140a04'); A.px(g, 19, hy - 0.4, '#140a04'); }
      A.line(g, 17, hy + 3, 19, hy + 3, '#7a3020');
      // arm
      if (throwing && i === 0) A.limb(g, [[16, 17], [11, 12], [9, 6]], 1.5, [fur[0], fur[1]]);
      else if (throwing) A.limb(g, [[16, 17], [22, 14], [26, 12]], 1.5, [fur[0], fur[1]]);
      else A.limb(g, [[16, 17], [19, 22], [21, 24]], 1.5, [fur[0], fur[1]]);
      if (throwing && i === 0) { A.blob(g, 9, 5, 3, 3, 0, ['#3a2410', '#6a4420', '#9a6a38']); }
    });
  }
  const COCONUT = () => mk(10, 10, 5, 5, (g) => { A.blob(g, 5, 5, 3.6, 3.6, 0, ['#3a2410', '#6a4420', '#9a6a38']); A.px(g, 4, 4, '#2a1808'); A.px(g, 6, 4, '#2a1808'); });

  function croc(S, anim, i) {
    const W = Math.ceil(64 * S), H = Math.ceil(26 * S), ax = W >> 1, ay = H - 2;
    return mk(W, H, ax, ay, (g) => {
      const X = (x) => ax + x * S, Y = (y) => ay + y * S;
      const fur = ['#1e3a1a', '#36602a', '#5a8a40'], open = anim === 'snap', hurt = anim === 'hurt';
      // tail
      A.poly(g, [[X(-12), Y(-9)], [X(-30), Y(-4)], [X(-12), Y(-3)]], fur[1]);
      A.blob(g, X(-4), Y(-6), 14 * S, 5 * S, 0, fur);
      for (let k = 0; k < 10; k++) A.px(g, X(-24 + k * 3.4), Y(-10.4 + (k > 2 && k < 8 ? -0.6 : 0.6)), fur[0]);
      for (let k = 0; k < 9; k++) A.px(g, X(-20 + k * 3.4), Y(-9.6), fur[2]);
      A.ell(g, X(-2), Y(-3), 12 * S, 2 * S, 0, '#a8b878');                    // belly
      // legs
      A.ell(g, X(-10), Y(-1.4), 2.6 * S, 1.4 * S, 0, fur[0]); A.ell(g, X(6), Y(-1.4), 2.6 * S, 1.4 * S, 0, fur[0]);
      // jaws
      const jx = 10;
      if (open) {
        A.poly(g, [[X(jx), Y(-9)], [X(jx + 22), Y(-17 - i * 2)], [X(jx + 22), Y(-14 - i * 2)], [X(jx), Y(-5)]], fur[1]);
        A.poly(g, [[X(jx), Y(-5)], [X(jx + 22), Y(-3)], [X(jx + 22), Y(-1)], [X(jx), Y(-2)]], fur[1]);
        A.poly(g, [[X(jx + 1), Y(-6)], [X(jx + 21), Y(-14 - i * 2)], [X(jx + 21), Y(-4)], [X(jx + 1), Y(-4)]], '#a02828');
        for (let k = 0; k < 6; k++) { A.px(g, X(jx + 4 + k * 3), Y(-7 - k * 1.2 - i * k * 0.3), '#fffaf0'); A.px(g, X(jx + 4 + k * 3), Y(-4.6), '#fffaf0'); }
      } else {
        A.blob(g, X(jx + 10), Y(-5), 12 * S, 3.2 * S, 0, fur);
        A.line(g, X(jx), Y(-4.4), X(jx + 21), Y(-4.4), '#14240e');
        for (let k = 0; k < 6; k++) A.px(g, X(jx + 3 + k * 3), Y(-3.6 + (k % 2)), '#fffaf0');
        A.px(g, X(jx + 20), Y(-7), '#0a140a');
      }
      // eye bump
      A.blob(g, X(jx), Y(-10), 3 * S, 2.6 * S, 0, fur);
      if (hurt) { A.line(g, X(jx - 1), Y(-11), X(jx + 1), Y(-9), '#000'); A.line(g, X(jx - 1), Y(-9), X(jx + 1), Y(-11), '#000'); }
      else { A.rect(g, X(jx - 0.4), Y(-11), 1.6 * S, 1.4 * S, '#ffd030'); A.px(g, X(jx + 0.4), Y(-10.6), '#000'); }
    });
  }

  function spider(S, pal, anim, i) {
    const W = Math.ceil(30 * S), H = Math.ceil(26 * S), ax = W >> 1, ay = Math.round(3 * S);
    return mk(W, H, ax, ay, (g) => {
      const X = (x) => ax + x * S, Y = (y) => ay + y * S;
      const w = i % 2 ? 1 : -1;
      for (let k = 0; k < 4; k++) {
        for (const side of [-1, 1]) {
          const sx = X(side * 2), sy = Y(8 + k * 0.6);
          const kx = X(side * (7 + k * 0.6)), ky = Y(3 + k * 2 + w * side);
          const fx = X(side * (11 + k * 0.8)), fy = Y(10 + k * 3 - w * side);
          A.line(g, sx, sy, kx, ky, pal.leg); A.line(g, kx, ky, fx, fy, pal.leg);
        }
      }
      A.blob(g, X(0), Y(14), 6.4 * S, 6 * S, 0, pal.body);
      A.poly(g, [[X(-1.4), Y(12)], [X(1.4), Y(12)], [X(0), Y(14)], [X(1.4), Y(16)], [X(-1.4), Y(16)], [X(0), Y(14)]], pal.mark);
      A.blob(g, X(0), Y(7), 3.6 * S, 3.2 * S, 0, pal.body);
      const eye = anim === 'hurt' ? '#ffffff' : pal.eye;
      A.px(g, X(-1.2), Y(8), eye); A.px(g, X(1.2), Y(8), eye); A.px(g, X(-2.2), Y(7), eye); A.px(g, X(2.2), Y(7), eye);
      if (S > 1.5) { A.line(g, X(-1), Y(10), X(-1.6), Y(12), '#f0f0f0'); A.line(g, X(1), Y(10), X(1.6), Y(12), '#f0f0f0'); }
    });
  }
  const SPIDERS = {
    forest: { body: ['#1a1428', '#2c2244', '#483a6a'], leg: '#14101e', mark: '#e02040', eye: '#ff3040' },
    cave: { body: ['#1a1a1a', '#303030', '#505050'], leg: '#101010', mark: '#ffd030', eye: '#ff3040' },
    queen: { body: ['#1a0a20', '#3a1448', '#64287a'], leg: '#120818', mark: '#ff2050', eye: '#ff5070' }
  };

  function bat(anim, i) {
    return mk(28, 18, 14, 9, (g) => {
      const body = ['#2a1e30', '#463656', '#64527a'], wing = ['#1e1424', '#3a2a48'];
      if (anim === 'hang') {
        A.poly(g, [[10, 2], [18, 2], [17, 13], [14, 16], [11, 13]], wing[1]);
        A.px(g, 12, 13, '#ff3040'); A.px(g, 15, 13, '#ff3040');
        return;
      }
      const f = [-1, 0, 1][i % 3];
      for (const side of [-1, 1]) {
        const tip = [14 + side * 13, 8 + f * 6], mid = [14 + side * 7, 6 + f * 3];
        A.poly(g, [[14 + side * 2, 7], mid, tip, [14 + side * 10, 10 + f * 2], [14 + side * 6, 11], [14 + side * 3, 10]], wing[side > 0 ? 1 : 0]);
      }
      A.blob(g, 14, 9, 3.4, 3.8, 0, body);
      A.px(g, 12, 5, body[0]); A.px(g, 16, 5, body[0]);
      A.px(g, 13, 8, '#ff3040'); A.px(g, 15, 8, '#ff3040');
      A.px(g, 14, 11, '#ffffff');
    });
  }

  function scorpion(anim, i) {
    return mk(30, 22, 15, 21, (g) => {
      const c = ['#3a1408', '#7a2c10', '#b05020'], sting = anim === 'sting';
      for (let k = 0; k < 3; k++) { A.line(g, 11 + k * 3, 16, 9 + k * 3 + (i ? 2 : 0), 20, c[0]); }
      A.blob(g, 14, 16, 6, 3.4, 0, c);
      // tail segments arching over the back
      const segs = sting ? [[9, 15], [6, 11], [7, 7], [11, 4], [16, 4], [20, 6]] : [[9, 15], [5, 12], [5, 7], [8, 4], [12, 3], [14, 5]];
      segs.forEach((s, k) => A.blob(g, s[0], s[1], 2.2 - k * 0.15, 2 - k * 0.12, 0, c));
      const st = segs[segs.length - 1];
      A.line(g, st[0] + 1, st[1] + 1, st[0] + 3, st[1] + 3, '#ffe060');
      // pincers
      A.limb(g, [[19, 16], [23, 14], [26, 14]], 1, c);
      A.poly(g, [[25, 12], [29, 13], [26, 15], [29, 16], [25, 17]], c[1]);
      A.px(g, 19, 14, '#ffe060');
    });
  }

  function owl(anim, i) {
    return mk(28, 26, 14, 25, (g) => {
      const f = ['#4a3a5a', '#6e5a84', '#9a86b0'], fly = anim === 'fly' || anim === 'dive';
      if (fly) {
        const up = anim === 'dive' ? 0 : i % 2;
        for (const side of [-1, 1]) A.poly(g, [[14, 12], [14 + side * 13, up ? 4 : 16], [14 + side * 11, up ? 9 : 19], [14 + side * 4, 17]], f[side > 0 ? 1 : 0]);
      }
      A.blob(g, 14, 15, 6.4, 8, 0, f);
      A.ell(g, 14, 18, 4, 4.6, 0, '#c8b8d8');
      for (let k = 0; k < 3; k++) A.px(g, 12 + k * 2, 17 + (k % 2) * 2, f[0]);
      A.poly(g, [[9, 9], [9, 3], [12, 7]], f[0]); A.poly(g, [[19, 9], [19, 3], [16, 7]], f[0]);
      A.ell(g, 11.5, 10, 2.4, 2.4, 0, '#ffd040'); A.ell(g, 16.5, 10, 2.4, 2.4, 0, '#ffd040');
      A.rect(g, 11, 9, 1.6, 2, '#000'); A.rect(g, 16, 9, 1.6, 2, '#000');
      A.poly(g, [[13, 12], [15, 12], [14, 15]], '#e8a020');
      if (!fly) { A.line(g, 11, 23, 11, 25, '#e8a020'); A.line(g, 17, 23, 17, 25, '#e8a020'); }
    });
  }

  function wasp(i) {
    return mk(18, 14, 9, 7, (g) => {
      A.ell(g, 7 + (i ? 1 : 0), 3, 3.4, 2, -0.4, 'rgba(220,240,255,0.9)');
      A.blob(g, 6, 8, 4.4, 3, 0.1, ['#6a4a00', '#e0b010', '#fff070']);
      A.line(g, 5, 5.4, 5, 10.6, '#1a1408'); A.line(g, 8, 5.6, 8, 10.4, '#1a1408');
      A.line(g, 1, 9, 2, 8, '#1a1408');
      A.blob(g, 12, 7, 2.6, 2.4, 0, ['#1a1408', '#3a3018', '#5a4a28']);
      A.px(g, 13, 6, '#ff2020');
    });
  }
  function fish(i) {
    return mk(20, 14, 10, 7, (g) => {
      A.poly(g, [[3, 7], [0, 3 + i], [0, 11 - i]], '#4a6a8a');
      A.blob(g, 10, 7, 7, 4.4, 0, ['#3a5a7a', '#6a90b0', '#a8c8e0']);
      A.ell(g, 11, 9.4, 5, 1.8, 0, '#e05040');
      A.px(g, 14, 5, '#000'); A.px(g, 15, 5, '#ffffff');
      for (let k = 0; k < 3; k++) A.px(g, 14 + k, 8.4, '#ffffff');
    });
  }
  function firebird(i) { return vulture(VULTURES.fire, 'fly', i); }

  // ------------------------------------------------------------------ friends & story cast
  function mandrill(anim, i) {
    return mk(46, 56, 22, 54, (g) => {
      const f = ['#3e4656', '#5e6a7e', '#8494a8'], far = ['#2a3040', '#40485a', '#58627a'];
      const lift = anim === 'lift', talk = anim === 'talk';
      // staff (behind)
      if (!lift) { A.line(g, 33, 18, 31, 54, '#6a4422'); A.line(g, 34, 18, 32, 54, '#8a5c30'); A.blob(g, 34, 17, 2.6, 3, 0, ['#8a6a20', '#d8a838', '#ffe080']); A.blob(g, 31, 22, 2, 2.4, 0, ['#5a8a20', '#8ac038', '#c0f080']); }
      // legs
      A.limb(g, [[18, 38], [16, 46], [17, 53]], 2.6, far);
      A.limb(g, [[24, 38], [26, 46], [25, 53]], 2.6, f);
      A.ell(g, 18, 53, 3, 1.4, 0, far[0]); A.ell(g, 26, 53, 3, 1.4, 0, f[0]);
      // body
      A.blob(g, 21, 31, 8, 10, 0, f);
      A.ell(g, 23, 34, 4.6, 6.4, 0, '#c8ccd8');
      A.ell(g, 16, 39, 4.6, 3, 0, '#d84a6a');            // the famous colourful rump, tastefully small
      // arms
      if (lift) {
        A.limb(g, [[17, 25], [14, 15], [17, 5]], 2.2, far);
        A.limb(g, [[26, 25], [28, 15], [25, 5]], 2.2, f);
      } else {
        A.limb(g, [[17, 25], [14, 34], [16, 42]], 2.2, far);
        A.limb(g, [[26, 25], [31, 30 + (talk && i ? -4 : 0)], [32, 22 + (talk && i ? -4 : 0)]], 2.2, f);
      }
      // head: olive-grey crest, long blue muzzle with a red ridge, cream beard
      const hx = 25, hy = lift ? 15 : 16;
      A.ell(g, hx - 1, hy + 6.4, 4.6, 3.4, 0, '#efe2b8');                 // beard
      A.blob(g, hx - 2, hy, 6, 5.6, 0, ['#4a5040', '#6e7860', '#96a084']);  // head fur
      for (let k = 0; k < 4; k++) A.line(g, hx - 6 + k * 2, hy - 5, hx - 7 + k * 2, hy - 8, '#4a5040');
      A.blob(g, hx + 4.2, hy + 1.6, 4.6, 3.2, 0.12, ['#2e4a9a', '#4a6ad0', '#7a9af0']);   // muzzle
      A.line(g, hx + 1, hy - 0.6, hx + 8.4, hy + 0.6, '#e83030'); A.line(g, hx + 1, hy, hx + 8.4, hy + 1.2, '#ff6a50');
      A.rect(g, hx + 7.6, hy + 0.4, 2.2, 2.4, '#e83030');               // nose tip
      A.line(g, hx + 2, hy + 2.4, hx + 7, hy + 3, '#2a3a7a');             // cheek grooves
      A.line(g, hx - 2, hy - 2.6, hx + 2, hy - 2.2, '#2a2a20');           // heavy brow
      A.px(g, hx, hy - 1.4, '#ffb030'); A.px(g, hx + 1, hy - 1.4, '#000');
      if (talk && i) A.rect(g, hx + 3, hy + 4.4, 4, 1.4, '#3a1010');
    });
  }
  function hornbill(anim, i) {
    return mk(34, 28, 16, 26, (g) => {
      const fly = anim === 'fly';
      const body = ['#141418', '#2a2a32', '#4a4a56'];
      if (fly) for (const side of [-1, 1]) A.poly(g, [[15, 14], [15 + side * 4, i ? 2 : 22], [15 + side * 10, i ? 4 : 20], [15 + side * 8, 14]], side > 0 ? body[1] : body[0]);
      A.poly(g, [[8, 16], [1, 22], [4, 14]], body[1]);
      A.blob(g, 14, 16, 7, 5.4, 0.15, body);
      A.ell(g, 15, 19, 4.6, 2.4, 0, '#f0f0e8');
      if (!fly) { A.poly(g, [[10, 13], [18, 13], [14, 20]], body[2]); A.line(g, 13, 21, 12, 26, '#e0a020'); A.line(g, 16, 21, 16, 26, '#e0a020'); }
      A.blob(g, 21, 10, 4, 3.6, 0, body);
      // the big banana bill with casque
      A.poly(g, [[23, 8], [33, 11], [31, 14], [23, 12]], '#ffcc20');
      A.poly(g, [[23, 12], [31, 14], [29, 15], [23, 13]], '#e05020');
      A.poly(g, [[23, 7], [30, 8], [26, 5]], '#ffe880');
      A.ell(g, 21, 9, 1.6, 1.6, 0, '#4ab8ff'); A.px(g, 21, 9, '#000');
    });
  }
  function pangolin(anim, i) {
    return mk(44, 30, 22, 28, (g) => {
      const sc = ['#5a3a1a', '#8a5e2a', '#c08a44'];
      if (anim === 'roll') {
        A.blob(g, 22, 16, 11, 11, 0, sc);
        for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + i * 0.4 + r * 0.4, d = 3 + r * 3; A.line(g, 22 + Math.cos(a) * d, 16 + Math.sin(a) * d, 22 + Math.cos(a + 0.4) * d, 16 + Math.sin(a + 0.4) * d, sc[0]); }
        return;
      }
      // tail
      A.limb(g, [[11, 20], [4, 22], [1, 26]], 3, sc);
      A.ell(g, 14, 26, 2.6, 1.6, 0, sc[0]); A.ell(g, 27, 26, 2.6, 1.6, 0, sc[0]);
      A.blob(g, 19, 18, 11, 7.6 + (i ? 0.4 : 0), 0, sc);
      // overlapping scale rows
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
        const x = 10 + k * 3.6 + (r % 2) * 1.8, y = 12 + r * 3;
        A.line(g, x - 1.4, y, x, y + 1, sc[0]); A.line(g, x, y + 1, x + 1.4, y, sc[0]); A.px(g, x, y - 0.5, sc[2]);
      }
      // little head with long snout
      A.blob(g, 31, 20, 4.4, 3.6, 0, ['#8a6a50', '#c09a78', '#e0c0a0']);
      A.ell(g, 36, 21.4, 3.4, 1.6, 0.1, '#c09a78');
      A.px(g, 39, 21, '#2a1810');
      A.px(g, 32, 19, '#140c08'); A.px(g, 33, 18.4, '#ffffff');
      A.line(g, 34, 23, 36, 23, '#7a3a30');
    });
  }
  function rhino(anim) {
    return mk(56, 32, 28, 30, (g) => {
      const f = ['#56565e', '#7c7c86', '#a0a0aa'], squash = anim === 'squash';
      const sy = squash ? 0.8 : 1;
      A.ell(g, 14, 28, 4, 2, 0, f[0]); A.ell(g, 40, 28, 4, 2, 0, f[0]);
      A.blob(g, 25, 30 - 11 * sy, 19, 11 * sy, 0, f);
      A.ell(g, 25, 30 - 4 * sy, 14, 3, 0, '#8a8a92');
      for (let k = 0; k < 4; k++) A.line(g, 14 + k * 6, 30 - 18 * sy, 15 + k * 6, 30 - 14 * sy, f[0]);
      A.blob(g, 45, 30 - 9 * sy, 8, 6.4 * sy, 0.2, f);
      A.poly(g, [[49, 30 - 13 * sy], [55, 30 - 21 * sy], [53, 30 - 11 * sy]], '#e0d8c8');
      A.poly(g, [[45, 30 - 13 * sy], [47, 30 - 17 * sy], [48, 30 - 12 * sy]], '#d0c8b8');
      A.ell(g, 39, 30 - 15 * sy, 1.6, 2.6, -0.3, f[0]);
      A.line(g, 43, 30 - 11 * sy, 45, 30 - 11 * sy, '#2a2a2e');          // sleepy closed eye
      A.ell(g, 3, 30 - 12 * sy, 2, 1.6, 0, f[0]);
    });
  }

  // ------------------------------------------------------------------ registry
  const DEF = {
    hyena: { walk: 4, run: 4, laugh: 2, lunge: 1, hurt: 1, stand: 1, crouch: 1, fn: (a, i) => hyena(HYENA, 1, a, i) },
    jackal: { walk: 4, run: 4, laugh: 2, lunge: 1, hurt: 1, stand: 1, crouch: 1, fn: (a, i) => hyena(JACKAL, 0.92, a, i) },
    cackle: { walk: 4, run: 4, laugh: 2, lunge: 1, hurt: 1, stand: 1, crouch: 1, fn: (a, i) => hyena(CACKLE, 1.3, a, i) },
    gnash: { walk: 4, run: 4, laugh: 2, lunge: 1, hurt: 1, stand: 1, crouch: 1, fn: (a, i) => hyena(GNASH, 1.75, a, i) },
    boar: { run: 4, stand: 1, dazed: 2, hurt: 1, fn: (a, i) => boar(BOAR, 1, a, i) },
    bruno: { run: 4, stand: 1, dazed: 2, hurt: 1, fn: (a, i) => boar(BRUNO, 1.9, a, i) },
    gnu: { run: 4, fn: (a, i) => gnu(1, i) },
    gnuBig: { run: 4, fn: (a, i) => gnu(1.6, i) },
    malgrim: { idle: 2, walk: 4, run: 4, crouch: 1, pounce: 1, swipe: 1, roar: 1, hurt: 1, dizzy: 1, fall: 1, fn: (a, i) => jaguar(a, i) },
    porcupine: { walk: 2, curl: 1, flipped: 2, bristle: 1, fn: (a, i) => porcupine(1, a, i) },
    bristleback: { walk: 2, curl: 1, flipped: 2, bristle: 1, fn: (a, i) => porcupine(2, a, i) },
    snake: { idle: 2, strike: 1, hurt: 1, fn: (a, i, v) => snake(SNAKES[v || 'savanna'], a, i) },
    vulture: { fly: 4, dive: 1, hurt: 1, fn: (a, i, v) => vulture(VULTURES[v || 'dusk'], a, i) },
    beetle: { walk: 2, flipped: 2, fn: (a, i, v) => beetle(BEETLES[v || 'blue'], a, i) },
    monkey: { sit: 1, throw: 2, hurt: 1, fn: (a, i) => monkey(a, i) },
    coconut: { idle: 1, fn: () => COCONUT() },
    croc: { idle: 1, snap: 2, hurt: 1, fn: (a, i) => croc(1, a, i) },
    snapjaw: { idle: 1, snap: 2, hurt: 1, fn: (a, i) => croc(2.2, a, i) },
    spider: { idle: 2, hurt: 1, fn: (a, i, v) => spider(1, SPIDERS[v || 'forest'], a, i) },
    widowmaw: { idle: 2, hurt: 1, fn: (a, i) => spider(3.2, SPIDERS.queen, a, i) },
    bat: { fly: 3, hang: 1, fn: (a, i) => bat(a, i) },
    scorpion: { walk: 2, sting: 1, fn: (a, i) => scorpion(a, i) },
    owl: { perch: 1, fly: 2, dive: 1, fn: (a, i) => owl(a, i) },
    wasp: { fly: 2, fn: (a, i) => wasp(i) },
    fish: { swim: 2, fn: (a, i) => fish(i) },
    mobo: { stand: 1, talk: 2, lift: 1, fn: (a, i) => mandrill(a, i) },
    toots: { perch: 1, fly: 2, fn: (a, i) => hornbill(a, i) },
    dozer: { stand: 2, roll: 4, fn: (a, i) => pangolin(a, i) },
    rhino: { idle: 1, squash: 1, fn: (a) => rhino(a) }
  };
  const built = {};
  function get(name, anim, i, variant) {
    const d = DEF[name];
    if (!d) throw new Error('CharArt: unknown ' + name);
    if (!d[anim]) anim = Object.keys(d).find((k) => k !== 'fn');
    const key = name + ':' + anim + ':' + (variant || '');
    let list = built[key];
    if (!list) { list = built[key] = []; for (let j = 0; j < d[anim]; j++) list.push(d.fn(anim, j, variant)); }
    return list[((i | 0) % list.length + list.length) % list.length];
  }
  function count(name, anim) { return (DEF[name] && DEF[name][anim]) || 1; }
  function debugAll(put, only) {
    for (const n in DEF) if (!only || only.split(',').includes(n)) for (const a in DEF[n]) if (a !== 'fn') for (let i = 0; i < DEF[n][a]; i++) put(get(n, a, i), n + ' ' + a + i);
  }
  return { get, count, debugAll, DEF, SNAKES, BEETLES, VULTURES, SPIDERS };
})();
