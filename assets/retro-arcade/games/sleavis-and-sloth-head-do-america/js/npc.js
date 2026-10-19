/* NPC — the low-poly weirdos of America. Boxes, 16px faces, no shame.
   Built with the same pivots as the heroes so js/anim.js drives both.
   Npc.make(lookName | lookObject) -> visual { root, bones, setAnim, update, headWorld, forward, show }
   Npc.LOOKS holds every recurring character's outfit. */
'use strict';
const Npc = (function () {
  const N = {};
  const LOOKS = {
    // ---- recurring cast
    slaria:   { skin: '#e8c0a0', hair: '#4a2a18', longHair: true, glasses: true, shirt: '#5a6a3a', jacket: '#5a6a3a', pants: '#20202a', skirt: true, shoes: '#101010', mouth: 'flat', h: 1.68, name: 'SLARIA' },
    tammy:    { skin: '#e0b090', hair: '#c89a40', shirt: '#c02a2a', apron: '#3a6ad0', pants: '#3a3a5a', mouth: 'frown', h: 1.66, gut: 0.1, name: 'TAMMY', makeup: '#d04a6a', smoke: true },
    lyle:     { skin: '#e8b090', hair: '#6a4a20', stache: '#6a4a20', shirt: '#e8e8d8', vest: '#2a2a2a', pants: '#3a4a7a', hat: 'cap', hatCol: '#c03020', gut: 0.22, h: 1.8, angry: true, name: 'LYLE' },
    dwayne:   { skin: '#d8a080', hair: '#2a1a10', beard: '#3a2a18', shirt: '#6a6a3a', pants: '#2a2a2a', hat: 'trucker', hatCol: '#2a6a2a', h: 1.98, wide: 1.25, cross: true, name: 'DWAYNE' },
    doug:     { skin: '#f0c8a8', hair: '#8a6a4a', bald: true, glasses: true, shirt: '#e0d8a0', tie: '#7a2030', pants: '#5a4a3a', mouth: 'frown', h: 1.72, gut: 0.12, name: 'DOUG' },
    earl:     { skin: '#d89a70', hair: '#9a9a9a', beard: '#b0b0b0', shirt: '#a03030', flannel: true, pants: '#3a4a6a', hat: 'trucker', hatCol: '#e8e8e8', gut: 0.35, h: 1.85, wide: 1.2, name: 'EARL' },
    wade:     { skin: '#f0c8a0', hair: '#c0a060', longHair: true, beard: '#a08040', shirt: '#5a8a5a', pants: '#7a6a4a', hat: 'foil', h: 1.75, cross: true, mouth: 'o', name: 'WADE' },
    strunk:   { skin: '#c89070', hair: '#2a2018', shirt: '#e8e8e8', jacket: '#1a1a22', tie: '#1a1a22', pants: '#1a1a22', shades: true, mouth: 'frown', h: 1.75, name: 'AGENT STRUNK' },
    pip:      { skin: '#f0d0b0', hair: '#c08040', shirt: '#e8e8e8', jacket: '#2a2a3a', tie: '#3a3a8a', pants: '#2a2a3a', h: 1.7, mouth: 'o', name: 'AGENT PIP', bandage: true },
    chuck:    { skin: '#d8a070', hair: '#1a1a1a', longHair: true, shirt: '#e8e8e8', vest: '#5a3a1a', pants: '#3a3a5a', shades: true, headband: '#c02020', h: 1.82, gut: 0.18, name: 'CHUCK THUNDER' },
    deke:     { skin: '#e8b8a0', hair: '#e8e0c0', shirt: '#e8e8f0', jacket: '#e8e0d0', tie: '#c02020', pants: '#e8e0d0', mouth: 'grin', h: 1.85, hat: 'cowboy', hatCol: '#e8e0d0', name: 'DEKE FONTAINE' },
    bigmama:  { skin: '#d8a888', hair: '#c8c8c8', longHair: true, shirt: '#2a2a2a', vest: '#4a3020', pants: '#2a2a3a', gut: 0.35, wide: 1.4, h: 1.9, angry: true, bandana: '#2a4a9a', name: 'BIG MAMA KRULL' },
    // ---- generic folks
    cop:      { skin: '#e0b090', hair: '#3a2a1a', shirt: '#3a4a8a', pants: '#1a2040', hat: 'cop', hatCol: '#1a2040', shades: true, gut: 0.2, h: 1.8, name: 'COP', badge: true },
    guard:    { skin: '#c89070', hair: '#2a2a2a', shirt: '#4a5a3a', pants: '#3a4a2a', hat: 'helmet', hatCol: '#4a5a3a', h: 1.82, name: 'M.P.', camo: true },
    mallcop:  { skin: '#f0c8a8', hair: '#6a4a2a', shirt: '#c8c8d8', pants: '#2a2a3a', hat: 'cop', hatCol: '#2a2a3a', gut: 0.3, h: 1.7, name: 'MALL COP', badge: true },
    biker:    { skin: '#d8a888', hair: '#2a2a2a', beard: '#2a2a2a', shirt: '#2a2a2a', vest: '#2a1a10', pants: '#20283a', bandana: '#c02020', gut: 0.2, h: 1.88, wide: 1.2, angry: true, name: 'BIKER' },
    trucker:  { skin: '#e0a880', hair: '#5a3a1a', stache: '#5a3a1a', shirt: '#4a6a9a', flannel: true, pants: '#3a3a4a', hat: 'trucker', hatCol: '#d8a020', gut: 0.25, h: 1.8, name: 'TRUCKER' },
    tourist:  { skin: '#f8c0a0', hair: '#a07040', shirt: '#30a0c0', hawaii: true, pants: '#d8c8a0', shorts: true, hat: 'bucket', hatCol: '#e8e8c0', gut: 0.25, h: 1.72, glasses: true, name: 'TOURIST' },
    hippie:   { skin: '#e8b890', hair: '#8a5a2a', longHair: true, beard: '#8a5a2a', shirt: '#c040a0', tiedye: true, pants: '#4a6aa0', headband: '#e8c020', h: 1.78, name: 'HIPPIE' },
    clerk:    { skin: '#e8c0a0', hair: '#3a2a1a', shirt: '#2a8a4a', pants: '#2a2a2a', h: 1.75, mouth: 'flat', name: 'CLERK' },
    granny:   { skin: '#f0d0c0', hair: '#e8e8f0', shirt: '#a080c0', pants: '#a080c0', skirt: true, h: 1.55, glasses: true, name: 'GRANNY' },
    kid:      { skin: '#f0c8a0', hair: '#e8c060', shirt: '#e84040', pants: '#3a5aa0', h: 1.25, name: 'KID' },
    scientist:{ skin: '#f0c8a8', hair: '#d8d8d8', shirt: '#f0f0f0', labcoat: true, pants: '#4a4a5a', glasses: true, h: 1.74, mouth: 'o', name: 'SCIENTIST' },
    showgirl: { skin: '#e8b898', hair: '#e8d060', longHair: true, shirt: '#e040a0', pants: '#e8b898', skirt: true, h: 1.78, makeup: '#d04a6a', hat: 'feathers', hatCol: '#e040a0', name: 'SHOWGIRL' },
    elvis:    { skin: '#e8b898', hair: '#101010', shirt: '#f0f0f0', pants: '#f0f0f0', shades: true, h: 1.8, gut: 0.3, name: 'ELVIS #4' },
    // ---- mascots: big heads
    gaspy:    { skin: '#c02020', shirt: '#c02020', pants: '#c02020', h: 1.95, mascot: 'gascan', name: 'GASPY' },
    cornelius:{ skin: '#c8862a', shirt: '#c8862a', pants: '#c8862a', h: 2.4, mascot: 'corndog', wide: 1.5, name: 'CORNELIUS' }
  };
  N.LOOKS = LOOKS;

  const M = (c) => Mat.get(c);
  function add(parent, w, h, d, look, x, y, z, o) { return Mk.box(parent, w, h, d, look, x, y, z, o); }

  N.make = function (lookIn) {
    const L = typeof lookIn === 'string' ? LOOKS[lookIn] : lookIn;
    const T = THREE, s = (L.h || 1.75) / 1.9, W = L.wide || 1;
    const root = new T.Group(), body = new T.Group();
    root.add(body);
    body.scale.setScalar(s);
    const bones = {};
    const piv = (name, parent, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); bones[name] = g; return g; };
    const shirt = L.tiedye ? Mat.get(Tex.make('tiedye', 16, 16, (g) => { const cs = ['#e04040', '#e0c020', '#40c040', '#4040e0', '#c040c0']; for (let i = 0; i < 8; i++) { g.fillStyle = cs[i % 5]; g.beginPath(); g.arc(8, 8, 11 - i * 1.4, 0, 7); g.fill(); } }))
      : L.hawaii ? Mat.get(Tex.make('hawaii', 16, 16, (g) => { g.fillStyle = L.shirt; g.fillRect(0, 0, 16, 16); g.fillStyle = '#f0e040'; for (let i = 0; i < 16; i += 5) for (let j = (i % 2) * 3; j < 16; j += 6) { g.fillRect(i, j, 2, 2); g.fillStyle = (i + j) % 2 ? '#e04080' : '#f0e040'; } }))
      : L.flannel ? Mat.get(Tex.make('flannel' + L.shirt, 16, 16, (g) => { g.fillStyle = L.shirt; g.fillRect(0, 0, 16, 16); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 16; i += 6) { g.fillRect(i, 0, 2, 16); g.fillRect(0, i, 16, 2); } }))
      : L.camo ? Mat.get('camo') : M(L.shirt);
    const hips = piv('hips', body, 0, 0.92, 0);
    // legs
    const legCol = L.shorts ? L.skin : L.pants;
    for (const side of [-1, 1]) {
      const th = piv(side < 0 ? 'thighL' : 'thighR', hips, side * 0.11 * W, 0, 0);
      add(th, 0.15 * W, 0.46, 0.17, L.skirt ? L.skin : legCol, 0, -0.46, 0);
      if (L.shorts) add(th, 0.17 * W, 0.2, 0.19, L.pants, 0, -0.2, 0);
      const sh = piv(side < 0 ? 'shinL' : 'shinR', th, 0, -0.46, 0);
      add(sh, 0.14 * W, 0.42, 0.15, L.skirt || L.shorts ? L.skin : legCol, 0, -0.42, 0);
      add(sh, 0.16 * W, 0.08, 0.28, L.shoes || '#2a2018', 0, -0.46, 0.05);
    }
    if (L.skirt) add(hips, 0.38 * W, 0.34, 0.26, L.pants, 0, -0.3, 0);
    add(hips, 0.36 * W, 0.12, 0.22, legCol === L.skin ? L.pants : legCol, 0, -0.08, 0);
    // torso
    const chest = piv('chest', hips, 0, 0.04, 0);
    add(chest, 0.38 * W, 0.56, 0.22, shirt, 0, 0, 0);
    if (L.gut) add(chest, 0.34 * W, 0.3, 0.12 + L.gut * 0.5, shirt, 0, 0.02, 0.1 + L.gut * 0.15);
    if (L.jacket) { add(chest, 0.14 * W, 0.56, 0.24, L.jacket, -0.13 * W, 0, 0); add(chest, 0.14 * W, 0.56, 0.24, L.jacket, 0.13 * W, 0, 0); add(chest, 0.39 * W, 0.56, 0.08, L.jacket, 0, 0, -0.08); }
    if (L.vest) { add(chest, 0.13 * W, 0.5, 0.24, L.vest, -0.135 * W, 0.04, 0); add(chest, 0.13 * W, 0.5, 0.24, L.vest, 0.135 * W, 0.04, 0); }
    if (L.labcoat) add(chest, 0.42 * W, 0.9, 0.25, '#f4f4f4', 0, -0.36, -0.01);
    if (L.apron) add(chest, 0.3 * W, 0.6, 0.04, L.apron, 0, -0.2, 0.12 + (L.gut || 0) * 0.3);
    if (L.tie) add(chest, 0.06, 0.36, 0.02, L.tie, 0, 0.16, 0.12);
    if (L.badge) add(chest, 0.06, 0.06, 0.02, '#e8c030', -0.1, 0.38, 0.12);
    // arms
    for (const side of [-1, 1]) {
      const ua = piv(side < 0 ? 'uArmL' : 'uArmR', chest, side * 0.25 * W, 0.52, 0);
      add(ua, 0.12, 0.32, 0.13, L.jacket || shirt, 0, -0.32, 0);
      const fa = piv(side < 0 ? 'fArmL' : 'fArmR', ua, 0, -0.31, 0);
      add(fa, 0.11, 0.3, 0.12, L.jacket || L.labcoat ? (L.jacket || '#f4f4f4') : L.skin, 0, -0.28, 0);
      add(fa, 0.11, 0.1, 0.12, L.mascot ? L.skin : L.skin, 0, -0.37, 0.01);
    }
    // head
    const head = piv('head', chest, 0, 0.56, 0);
    const neck = add(head, 0.12, 0.08, 0.12, L.skin, 0, -0.02, 0);
    let headMesh;
    if (L.mascot === 'gascan') {
      headMesh = add(head, 0.62, 0.7, 0.44, Mat.get(Tex.make('gaspyface', 32, 32, (g) => { g.fillStyle = '#c02020'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#fff'; g.fillRect(6, 9, 8, 9); g.fillRect(18, 9, 8, 9); g.fillStyle = '#000'; g.fillRect(9, 12, 4, 4); g.fillRect(19, 13, 4, 4); g.fillStyle = '#300'; g.fillRect(8, 22, 16, 5); g.fillStyle = '#fff'; g.fillRect(9, 22, 3, 2); g.fillRect(14, 22, 3, 2); g.fillRect(19, 22, 3, 2); Font.draw(g, 'GAS', 16, 2, '#e8c020', { face: 'small', align: 'center' }); })), 0, 0.02, 0);
      add(head, 0.12, 0.25, 0.12, '#e8c020', 0.18, 0.7, 0);
    } else if (L.mascot === 'corndog') {
      headMesh = Mk.cyl(head, 0.32, 0.36, 1.1, 'cornbatter', 0, -0.1, 0, { seg: 8 });
      const face = add(head, 0.5, 0.4, 0.05, Mat.get(Tex.make('cornface', 32, 32, (g) => { g.clearRect(0, 0, 32, 32); g.fillStyle = '#fff'; g.fillRect(4, 4, 10, 10); g.fillRect(18, 4, 10, 10); g.fillStyle = '#000'; g.fillRect(8, 8, 4, 4); g.fillRect(19, 6, 4, 4); g.fillStyle = '#5a1010'; g.fillRect(4, 20, 24, 7); g.fillStyle = '#fff'; for (let i = 5; i < 27; i += 4) g.fillRect(i, 20, 2, 3); }), { transparent: true, alphaTest: 0.5 }), 0, 0.28, 0.33);
      Mk.cyl(head, 0.05, 0.05, 0.5, '#d8c8a0', 0, -0.62, 0);
      // a single squirt of mustard
      add(head, 0.08, 0.6, 0.06, '#e8d020', 0.1, 0.1, 0.34, { rz: 0.2 });
    } else {
      const face = Tex.face({ skin: L.skin, hair: L.hair, bald: L.bald, longHair: L.longHair, glasses: L.glasses, shades: L.shades, beard: L.beard, stache: L.stache, mouth: L.mouth, angry: L.angry, makeup: L.makeup, cross: L.cross });
      const sideM = M(L.skin), top = M(L.hair || L.skin);
      const mats = [sideM, sideM, top, sideM, Mat.get(face), L.hair && !L.bald ? top : sideM];
      headMesh = add(head, 0.26, 0.3, 0.26, mats, 0, 0.04, 0);
      if (L.hair && !L.bald) add(head, 0.28, 0.08, 0.28, L.hair, 0, 0.32, -0.01);
      if (L.longHair) add(head, 0.3, 0.42, 0.08, L.hair, 0, -0.04, -0.13);
      if (L.beard) add(head, 0.24, 0.14, 0.06, L.beard, 0, 0.02, 0.12);
      add(head, 0.06, 0.08, 0.06, L.skin, 0, 0.12, 0.15);                         // the nose. majestic.
      const hc = L.hatCol || '#333';
      if (L.hat === 'cap') { add(head, 0.29, 0.1, 0.29, hc, 0, 0.32, 0); add(head, 0.26, 0.03, 0.16, hc, 0, 0.32, 0.2); }
      if (L.hat === 'trucker') { add(head, 0.3, 0.16, 0.3, hc, 0, 0.32, 0); add(head, 0.3, 0.12, 0.02, '#e8e8e8', 0, 0.34, 0.15); add(head, 0.28, 0.03, 0.18, hc, 0, 0.32, 0.22); }
      if (L.hat === 'cop') { add(head, 0.3, 0.1, 0.3, hc, 0, 0.32, 0); add(head, 0.34, 0.06, 0.34, hc, 0, 0.42, 0.02); add(head, 0.06, 0.06, 0.02, '#e8c030', 0, 0.4, 0.19); }
      if (L.hat === 'helmet') add(head, 0.32, 0.16, 0.32, hc, 0, 0.3, 0);
      if (L.hat === 'cowboy') { add(head, 0.5, 0.03, 0.5, hc, 0, 0.32, 0); add(head, 0.26, 0.18, 0.26, hc, 0, 0.34, 0); }
      if (L.hat === 'bucket') { add(head, 0.38, 0.03, 0.38, hc, 0, 0.3, 0); add(head, 0.28, 0.14, 0.28, hc, 0, 0.31, 0); }
      if (L.hat === 'foil') { Mk.cone(head, 0.17, 0.42, Mat.get('#d8dce0', { emissive: '#303438' }), 0, 0.3, 0, { seg: 5 }); }
      if (L.hat === 'feathers') { for (let i = -2; i <= 2; i++) add(head, 0.05, 0.5, 0.02, hc, i * 0.06, 0.34, -0.05, { rz: i * 0.25 }); }
      if (L.headband) add(head, 0.28, 0.05, 0.28, L.headband, 0, 0.24, 0);
      if (L.bandana) add(head, 0.29, 0.1, 0.29, L.bandana, 0, 0.29, 0);
      if (L.bandage) add(head, 0.1, 0.04, 0.02, '#f0e8d0', 0.06, 0.26, 0.135, { rz: 0.4 });
      if (L.smoke) add(head, 0.12, 0.02, 0.02, '#f0f0f0', 0.08, 0.08, 0.15, { ry: 0.6 });
    }
    // Every NPC is in the world layer (0): they're supposed to look like a 1998 budget title.
    const blob = Mk.blob(0.36 * W);
    root.add(blob);
    const v = {
      look: L, root, body, bones, anim: 'idle', animT: 0, animO: {}, cur: null, blob, style: 'npc', extraY: 0, tilt: 0, scale: s,
      setAnim(a, o) { if (a !== v.anim || (o && o.restart)) { v.anim = a; v.animT = 0; } v.animO = o || {}; },
      update(dt) {
        v.animT += dt;
        const c = Anim.apply(v, v.anim, v.animT, Object.assign({ style: 'npc' }, v.animO), dt);
        body.position.y = c.rootY + v.extraY + (c.lie > 0.01 ? c.lie * 0.16 : 0);
        body.rotation.x = -c.lie * Math.PI / 2 + c.lean;
        body.rotation.z = v.tilt;
        blob.position.y = 0.075 - root.position.y + (v.groundY || 0);
      },
      show(on) { root.visible = !!on; },
      headWorld() { bones.head.updateWorldMatrix(true, false); return new T.Vector3(0, 0.2, 0).applyMatrix4(bones.head.matrixWorld); },
      forward() { const a = root.rotation.y; return new T.Vector3(Math.sin(a), 0, Math.cos(a)); }
    };
    return v;
  };
  return N;
})();
