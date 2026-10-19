/* ANIM — one procedural pose library for everybody.
   The supplied models are static sculptures, so js/heroes.js gives them a skeleton at
   load time; the low-poly NPCs (js/npc.js) are built with matching pivots. Both are
   driven by the same poses here: rig.bones = { hips, chest, head, uArmL, fArmL, uArmR,
   fArmR, thighL, shinL, thighR, shinR } (Object3D / Bone).
   Conventions (character faces +Z): rotation.x < 0 swings a limb FORWARD, > 0 back;
   knee bend = shin.x > 0; elbow bend = fArm.x < 0; nod down = head.x > 0.
   "L" bones sit on -X.  Anim.apply(rig, state, t, o) — o = { speed, style: 'sleavis'|'slothhead'|'npc' } */
'use strict';
const Anim = (function () {
  const A = {};
  const S = Math.sin, C = Math.cos;
  const NAMES = ['hips', 'chest', 'head', 'uArmL', 'fArmL', 'uArmR', 'fArmR', 'thighL', 'shinL', 'thighR', 'shinR'];
  A.NAMES = NAMES;

  function blank() { const p = { rootY: 0, rootX: 0, lean: 0, roll: 0, spin: 0, lie: 0 }; for (const n of NAMES) p[n] = [0, 0, 0]; return p; }
  // arms hang slightly out by default so the huge mittens clear the hips
  function rest(p, st) { p.uArmL[2] = -0.06; p.uArmR[2] = 0.06; p.fArmL[0] = -0.12; p.fArmR[0] = -0.12; if (st === 'slothhead') { p.chest[0] = -0.05; p.head[0] = -0.06; } }

  const POSES = {
    idle(p, t, o) {
      const sl = o.style === 'sleavis';
      p.chest[0] += S(t * 1.6) * 0.02;
      p.head[0] += S(t * 1.6 + 1) * 0.03;
      if (sl) { // twitchy, can't stand still
        p.head[1] = S(t * 0.7) * 0.25 + (S(t * 9) > 0.92 ? 0.25 : 0);
        p.rootY = Math.abs(S(t * 3.2)) * 0.015;
        p.uArmL[0] = S(t * 2.1) * 0.06; p.uArmR[0] = -S(t * 2.3) * 0.06;
      } else if (o.style === 'slothhead') { // smug slow sway, weight on one leg
        p.hips[2] = 0.04; p.chest[2] = -0.05 + S(t * 0.8) * 0.02; p.head[2] = S(t * 0.5) * 0.04; p.head[1] = S(t * 0.4) * 0.12;
        p.thighR[0] = -0.08; p.shinR[0] = 0.12;
      } else { p.head[1] = S(t * 0.5) * 0.15; }
    },
    walk(p, t, o) {
      const f = (o.speed || 1) * 7.5, ph = t * f, amp = 0.55 * Math.min(1.2, o.amp || 1);
      p.thighL[0] = S(ph) * amp; p.thighR[0] = -S(ph) * amp;
      p.shinL[0] = Math.max(0, -C(ph)) * 0.7 + 0.05; p.shinR[0] = Math.max(0, C(ph)) * 0.7 + 0.05;
      p.uArmL[0] = -S(ph) * amp * 0.8; p.uArmR[0] = S(ph) * amp * 0.8;
      p.fArmL[0] = -0.35; p.fArmR[0] = -0.35;
      p.rootY = Math.abs(C(ph)) * 0.06;
      p.chest[1] = S(ph) * 0.12; p.hips[1] = -S(ph) * 0.1;
      p.chest[0] = o.style === 'slothhead' ? -0.02 : 0.08;
      if (o.style === 'sleavis') { p.head[1] = S(ph * 0.5) * 0.15; p.head[0] = S(ph * 2) * 0.05; }
    },
    run(p, t, o) {
      POSES.walk(p, t, Object.assign({}, o, { speed: (o.speed || 1) * 1.45, amp: 1.25 }));
      p.chest[0] = 0.28; p.head[0] = -0.2; p.fArmL[0] = -1.2; p.fArmR[0] = -1.2;
      if (o.style === 'sleavis') { p.uArmL[2] = -0.5; p.uArmR[2] = 0.5; } // flappy
    },
    sneak(p, t, o) {
      const ph = t * 4;
      p.thighL[0] = S(ph) * 0.35 - 0.5; p.thighR[0] = -S(ph) * 0.35 - 0.5; p.shinL[0] = 0.9; p.shinR[0] = 0.9;
      p.rootY = -0.22; p.chest[0] = 0.45; p.head[0] = -0.4;
      p.uArmL[0] = -0.9; p.uArmR[0] = -0.9; p.fArmL[0] = -0.9; p.fArmR[0] = -0.9;
      p.head[1] = S(t * 1.5) * 0.4;
    },
    jump(p, t) {
      p.thighL[0] = -0.9; p.thighR[0] = -0.3; p.shinL[0] = 1.3; p.shinR[0] = 0.6;
      p.uArmL[2] = -1.6; p.uArmR[2] = 1.6; p.uArmL[0] = -0.4 + S(t * 20) * 0.2; p.uArmR[0] = -0.4 - S(t * 20) * 0.2;
      p.head[0] = -0.2;
    },
    fall(p, t) {
      p.thighL[0] = S(t * 15) * 0.6; p.thighR[0] = -S(t * 15) * 0.6;
      p.uArmL[2] = -2.2 + S(t * 18) * 0.4; p.uArmR[2] = 2.2 - S(t * 18) * 0.4; p.head[0] = -0.3;
    },
    punch(p, t, o) {
      const k = Math.min(1, t / 0.09), back = t > 0.18 ? Math.max(0, 1 - (t - 0.18) / 0.15) : 1;
      const e = k * back, right = !o.alt;
      const u = right ? 'uArmR' : 'uArmL', f = right ? 'fArmR' : 'fArmL';
      p[u][0] = -1.55 * e; p[u][2] = (right ? -0.2 : 0.2) * e; p[f][0] = -0.1;
      const ou = right ? 'uArmL' : 'uArmR'; p[ou][0] = 0.3 * e; p[(right ? 'fArmL' : 'fArmR')][0] = -1.2;
      p.chest[1] = (right ? 0.5 : -0.5) * e; p.chest[0] = 0.15 * e;
      p.thighL[0] = -0.3; p.thighR[0] = 0.3;
    },
    kick(p, t) {
      const k = Math.min(1, t / 0.1), back = t > 0.22 ? Math.max(0, 1 - (t - 0.22) / 0.15) : 1, e = k * back;
      p.thighR[0] = -1.5 * e; p.shinR[0] = 0.1; p.chest[0] = -0.35 * e; p.uArmL[2] = -0.9 * e; p.uArmR[2] = 0.9 * e;
    },
    throw(p, t) {
      const k = Math.min(1, t / 0.25);
      p.uArmR[0] = -3.0 + k * 2.2; p.fArmR[0] = -0.4; p.chest[1] = 0.4 - k * 0.8; p.chest[0] = -0.2 + k * 0.4;
    },
    carry(p, t) {
      p.uArmL[0] = -2.9; p.uArmR[0] = -2.9; p.fArmL[0] = -0.4; p.fArmR[0] = -0.4; p.chest[0] = -0.1;
      POSES._legsWalk(p, t);
    },
    _legsWalk(p, t, o) { if (!o || !o.moving) return; const ph = t * 7; p.thighL[0] = S(ph) * 0.4; p.thighR[0] = -S(ph) * 0.4; p.shinL[0] = Math.max(0, -C(ph)) * 0.6; p.shinR[0] = Math.max(0, C(ph)) * 0.6; p.rootY = Math.abs(C(ph)) * 0.04; },
    hit(p, t) {
      const e = Math.max(0, 1 - t / 0.4);
      p.chest[0] = -0.5 * e; p.head[0] = -0.6 * e; p.uArmL[2] = -1.0 * e; p.uArmR[2] = 1.0 * e; p.lean = -0.25 * e;
    },
    ko(p, t) {
      const k = Math.min(1, t / 0.35);
      p.lie = k; p.uArmL[2] = -1.4; p.uArmR[2] = 1.4; p.thighL[0] = -0.2; p.thighR[0] = 0.15; p.head[1] = 0.4;
      if (t > 0.35) p.thighR[0] += S(t * 5) * 0.05;                  // twitch
    },
    sit(p, t, o) {
      p.thighL[0] = -1.5; p.thighR[0] = -1.5; p.shinL[0] = 1.5; p.shinR[0] = 1.5; p.rootY = -0.34;
      p.thighL[2] = 0.12; p.thighR[2] = -0.12;
      p.uArmL[0] = -0.5; p.uArmR[0] = -0.5; p.fArmL[0] = -0.6; p.fArmR[0] = -0.6;
      if (o.style === 'slothhead') { p.chest[0] = -0.25; p.head[0] = -0.1; } else { p.chest[0] = 0.15; p.head[1] = S(t * 1.3) * 0.2; }
    },
    couch(p, t, o) { POSES.sit(p, t, o); p.rootY = -0.3; p.chest[0] = -0.35; p.uArmL[2] = -0.4; p.uArmR[2] = 0.4; },
    drive(p, t, o) {
      POSES.sit(p, t, o); p.uArmL[0] = -1.2; p.uArmR[0] = -1.2; p.fArmL[0] = -0.5; p.fArmR[0] = -0.5; p.uArmL[2] = 0.2; p.uArmR[2] = -0.2;
      p.chest[2] = S(t * 2) * 0.05 * (o.steer || 0) + (o.steer || 0) * 0.15;
    },
    headbang(p, t, o) {
      const ph = t * (o.speed || 1) * 12;
      p.head[0] = 0.25 + S(ph) * 0.45; p.chest[0] = 0.2 + S(ph) * 0.2;
      p.thighL[0] = -0.2; p.thighR[0] = 0.15; p.shinL[0] = 0.3; p.shinR[0] = 0.3; p.rootY = -0.06 + Math.abs(S(ph)) * 0.05;
      p.uArmL[0] = -1.2 + S(ph) * 0.3; p.uArmR[0] = -0.5; p.fArmL[0] = -0.4; p.uArmR[2] = 0.3;
    },
    guitar(p, t, o) {
      const ph = t * (o.speed || 1) * 14;
      p.uArmL[0] = -0.8; p.uArmL[2] = 0.7; p.fArmL[0] = -1.4;                // neck hand
      p.uArmR[0] = -0.5; p.fArmR[0] = -1.2 + S(ph) * 0.6; p.uArmR[2] = -0.2;  // strum
      p.chest[0] = 0.1 + S(ph * 0.5) * 0.1; p.head[0] = 0.2 + S(ph * 0.5) * 0.35;
      p.thighL[0] = -0.4; p.thighR[0] = 0.3; p.shinL[0] = 0.5; p.rootY = -0.08;
    },
    dance(p, t, o) {
      const ph = t * (o.speed || 1) * 8;
      p.hips[1] = S(ph) * 0.4; p.chest[1] = -S(ph) * 0.3; p.rootY = Math.abs(S(ph)) * 0.12;
      p.uArmL[2] = -1.2 - S(ph) * 0.8; p.uArmR[2] = 1.2 - S(ph) * 0.8; p.fArmL[0] = -1; p.fArmR[0] = -1;
      p.thighL[0] = S(ph) * 0.4; p.thighR[0] = -S(ph) * 0.4; p.head[2] = S(ph) * 0.2;
    },
    laugh(p, t, o) {
      const ph = t * (o.style === 'slothhead' ? 9 : 13);
      p.chest[0] = (o.style === 'slothhead' ? -0.15 : 0.25) + S(ph) * 0.08; p.head[0] = -0.25 + S(ph) * 0.12;
      p.uArmL[0] = -0.6; p.uArmR[0] = -0.6; p.fArmL[0] = -1.4; p.fArmR[0] = -1.4; p.uArmL[2] = 0.3; p.uArmR[2] = -0.3;
      p.rootY = Math.abs(S(ph)) * 0.03;
    },
    talk(p, t, o) {
      POSES.idle(p, t, o);
      p.head[0] += S(t * 7) * 0.06;
      const r = o.style === 'slothhead';
      p[r ? 'uArmL' : 'uArmR'][0] = -0.7 + S(t * 3) * 0.25; p[r ? 'fArmL' : 'fArmR'][0] = -1.0 + S(t * 5) * 0.3;
    },
    point(p, t) { p.uArmR[0] = -1.5; p.uArmR[2] = -0.2; p.fArmR[0] = -0.05; p.head[1] = -0.1; },
    shrug(p, t) { const e = Math.min(1, t / 0.2); p.uArmL[2] = -0.6 * e; p.uArmR[2] = 0.6 * e; p.fArmL[0] = -1.4 * e; p.fArmR[0] = -1.4 * e; p.head[2] = 0.2 * e; p.chest[0] = -0.1; },
    cheer(p, t) { p.uArmL[2] = -2.6 + S(t * 12) * 0.2; p.uArmR[2] = 2.6 - S(t * 12) * 0.2; p.rootY = Math.abs(S(t * 8)) * 0.2; p.head[0] = -0.3; },
    flail(p, t) {
      // Sleavis' FREAK OUT
      p.uArmL[2] = -1.5 + S(t * 31) * 1.2; p.uArmR[2] = 1.5 + S(t * 27) * 1.2; p.uArmL[0] = S(t * 23) * 1.4; p.uArmR[0] = C(t * 29) * 1.4;
      p.fArmL[0] = -1 + S(t * 37); p.fArmR[0] = -1 + C(t * 33);
      p.head[0] = S(t * 25) * 0.5; p.head[1] = C(t * 19) * 0.7; p.chest[1] = S(t * 15) * 0.5;
      p.thighL[0] = S(t * 21) * 0.8; p.thighR[0] = -S(t * 21) * 0.8; p.rootY = Math.abs(S(t * 21)) * 0.2;
    },
    eat(p, t) {
      const ph = t * 10;
      p.uArmR[0] = -1.6 + S(ph) * 0.3; p.fArmR[0] = -1.6; p.uArmR[2] = -0.3; p.uArmL[0] = -1.4 - S(ph) * 0.3; p.fArmL[0] = -1.6; p.uArmL[2] = 0.3;
      p.head[0] = 0.15 + S(ph) * 0.15; p.chest[0] = 0.2;
    },
    mash(p, t) { // plunging / pumping / button mashing
      const ph = t * 16;
      p.uArmL[0] = -1.0 + S(ph) * 0.5; p.uArmR[0] = -1.0 + S(ph) * 0.5; p.fArmL[0] = -0.8; p.fArmR[0] = -0.8; p.uArmL[2] = 0.35; p.uArmR[2] = -0.35;
      p.chest[0] = 0.4 + S(ph) * 0.1; p.thighL[0] = -0.4; p.thighR[0] = 0.2; p.shinL[0] = 0.5; p.shinR[0] = 0.4; p.rootY = -0.1;
    },
    crouch(p, t) { p.thighL[0] = -1.2; p.thighR[0] = -1.2; p.shinL[0] = 2.0; p.shinR[0] = 2.0; p.rootY = -0.42; p.chest[0] = 0.5; p.head[0] = -0.4; p.uArmL[0] = -1.0; p.uArmR[0] = -1.0; },
    sad(p, t) { p.head[0] = 0.5; p.chest[0] = 0.25; p.uArmL[0] = 0.1; p.uArmR[0] = 0.1; },
    thumb(p, t) { p.uArmR[2] = 1.3; p.uArmR[0] = -0.3; p.fArmR[0] = -1.4; p.head[1] = 0.4; p.chest[2] = -0.06 + S(t * 3) * 0.04; p.hips[2] = 0.08; },
    flex(p, t) { p.uArmL[2] = -1.5; p.uArmR[2] = 1.5; p.fArmL[2] = -1.5; p.fArmR[2] = 1.5; p.fArmL[0] = -1.4; p.fArmR[0] = -1.4; p.chest[0] = -0.15 + S(t * 6) * 0.03; },
    wave(p, t) { p.uArmR[2] = 2.4; p.fArmR[2] = S(t * 10) * 0.6; }
  };
  A.has = (name) => !!POSES[name];

  // Smoothly drive a rig toward the pose. rig.cur holds the current values; k = blend speed.
  A.apply = function (rig, state, t, o, dt) {
    o = o || {};
    const p = blank();
    rest(p, o.style);
    (POSES[state] || POSES.idle)(p, t, o);
    if (!rig.cur) rig.cur = blank();
    const c = rig.cur;
    const snap = o.snap || state === 'punch' || state === 'kick' || state === 'hit';
    const k = snap ? 1 : 1 - Math.pow(0.0005, dt || 1 / 60);
    for (const n of NAMES) {
      const b = rig.bones[n]; if (!b) continue;
      const cv = c[n], tv = p[n];
      cv[0] += (tv[0] - cv[0]) * k; cv[1] += (tv[1] - cv[1]) * k; cv[2] += (tv[2] - cv[2]) * k;
      b.rotation.set(cv[0], cv[1], cv[2]);
    }
    for (const n of ['rootY', 'lean', 'lie', 'roll']) c[n] += (p[n] - c[n]) * (n === 'lie' ? Math.min(1, k * 1.5) : k);
    return c;
  };
  return A;
})();
