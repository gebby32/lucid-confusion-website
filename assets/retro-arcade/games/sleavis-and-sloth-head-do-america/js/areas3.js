/* AREAS (3/3): fest, casino, penthouse, dam */
'use strict';

// ---------------------------------------------------------------------- SLOTHSTOCK '99
Areas.fest = function (root, st, arg) {
  const night = arg && arg.night;
  R3.setSky(night ? '#1a1030' : '#e0a060', night ? '#2a1838' : '#d09070', 40, 140);
  R3.setLight(night ? { sky: '#a060ff', ground: '#301020', sun: '#ff60c0', sunI: 1.4, sunPos: [0, 10, -8], rimI: 1.6 } : { sky: '#ffd8a0', ground: '#806040', sun: '#ffb060', sunI: 2.0, sunPos: [-12, 8, -10] });
  Mk.plane(root, 220, 160, 'sand', 0, 0, -20, { tile: 4 });
  Mk.plane(root, 60, 34, 'deadgrass', 0, 0.03, -2, { tile: 4 });
  Mk.plane(root, 12, 8, Mat.get('mud', { color: '#c0a080' }), -12, 0.06, 3, { tile: 2 });
  Stage.bounds(-28, 28, -17, 14);
  for (let i = 0; i < 5; i++) Props.mesa(root, -100 + i * 50, -100);
  // main stage
  Mk.box(root, 18, 1.6, 8, 'planks', 0, 0, -13, { collide: true, tile: 2 });
  for (const x of [-9, 9]) { Mk.box(root, 0.4, 9, 0.4, '#303030', x, 1.6, -16.5); Mk.box(root, 0.4, 9, 0.4, '#303030', x, 1.6, -9.5); }
  Mk.box(root, 18.8, 0.4, 7.4, '#303030', 0, 10.4, -13);
  Mk.sign(root, 'SLOTHSTOCK \'99', 0, 8.6, -9.4, { font: 'big', scale: 3, bg: '#ff40c0', fg: '#ffffff', width: 14, height: 2.2, grime: 0.05 });
  Mk.sign(root, 'PEACE  LOVE  OVERPRICED WATER', 0, 7.0, -9.4, { font: 'small', bg: '#202020', fg: '#ffe040', width: 10, height: 0.6 });
  Props.speaker(root, -11.5, -10, 1.8); Props.speaker(root, 11.5, -10, 1.8);
  Props.speaker(root, -11.5, -12.5, 1.8); Props.speaker(root, 11.5, -12.5, 1.8);
  for (let i = 0; i < 6; i++) { const l = Mk.box(root, 0.4, 0.4, 0.5, new THREE.MeshBasicMaterial({ color: LP.pick(['#ff40c0', '#40c0ff', '#ffe040']) }), -7 + i * 2.8, 10, -9.6); st.ticks.push((dt, t) => { l.visible = Math.sin(t * 5 + i) > -0.3; }); }
  // porta-potty row
  for (let i = 0; i < 5; i++) Props.portapotty(root, 20 + (i % 2) * 0.1, -8 + i * 1.6, -Math.PI / 2, { color: LP.pick(['#3a70c0', '#c03030', '#30a040']), label: i === 2 ? 'OUT OF\nORDER' : 'SLOTH-\nJOHN' });
  Mk.sign(root, 'PORTA-POTTIES\n(ABANDON HOPE)', 18, 2.8, -10.5, { font: 'small', bg: '#f0f0e0', fg: '#202020', post: '#5a4a3a' });
  // water stand, merch tent, Wade's booth
  Props.building(root, -20, -8, 6, 4, 2.6, { tex: 'planks', color: '#4080c0', windows: false, door: false, sign: 'WATER $12\nICE $15\nHOPE $40', signO: { font: 'small', bg: '#ffffff', fg: '#2050a0' }, signH: 0.4 });
  Props.counter(root, -20, -5.7, 5, 0, { color: '#4080c0' });
  for (const [x, z] of [[-22, 8], [-14, 10], [16, 9], [24, 4], [8, 11]]) Props.tent(root, x, z);
  Props.kiosk(root, 13, 2);
  Mk.sign(root, 'TINFOIL HATS\nPROTECT YOUR\nBRAIN FROM\nTHE ORBITAL\nMIRROR!!', 13, 2.6, 2.6, { font: 'small', bg: '#c0c8d0', fg: '#202020' });
  Mk.sign(root, 'MOSH PIT\n(EST. 10 MINUTES AGO)', -12, 1.6, 7.5, { font: 'small', bg: '#202020', fg: '#ff4040', post: '#5a4a3a' });
  for (let i = 0; i < 6; i++) Props.can(root, LP.rand(-20, 20), LP.rand(-4, 12)).rotation.z = 1.5;
  joke(-20, -5, 'BUY WATER', [say('sleavis', 'Heh heh. How much is water?'), say('sign', 'HIPPIE AT THE STAND: "Twelve dollars, man. Water is a human right. That\'s why it\'s expensive."'), say('sleavis', 'Heh heh. I\'ll just drink from the mud.')], [say('slothhead', 'Uh huh huh. Twelve bucks for water. I could buy like, six beers for that.'), say('sleavis', 'Heh heh. Beer is mostly water. So beer is like... cheap water.'), say('slothhead', 'Uh huh huh. That\'s the smartest thing you ever said.')]);
  joke(-12, 4.5, 'LOOK AT MUD PIT', 'Heh heh. Mud. People are rolling in it. On purpose. Heh heh. Hippies are like pigs who read.', 'Uh huh huh. Mud wrestling. Where are the chicks? ...Uh huh huh. That\'s a guy named Todd.');
  return { start: [-2, 11], start2: [-3, 12], stage: [0, -13], stageTop: 1.6, potty: [20, -4.8], water: [-20, -5], wade: [13, 3.6] };
};

// ---------------------------------------------------------------------- FONTAINE'S FREEDOM CASINO (Lost Wages)
Areas.casino = function (root, st) {
  R3.setSky('#100410', '#100410', 26, 60);
  R3.setLight({ sky: '#ffd0a0', ground: '#400820', hemi: 1.3, sun: '#ffe0a0', sunI: 1.2, sunPos: [0, 12, 6], fillI: 0.6, rimI: 1.4 });
  Mk.plane(root, 50, 22, Mat.get('redcarpet'), 0, 0.015, -2, { tile: 2 });
  Props.wall(root, -25, -13, 25, -13, 6, Mat.get('marble', { color: '#e8d8c0' }));
  Props.wall(root, -25, -13, -25, 9, 6, Mat.get('marble', { color: '#e8d8c0' }));
  Props.wall(root, 25, -13, 25, 9, 6, Mat.get('marble', { color: '#e8d8c0' }));
  Stage.addBox(0, 0, 9.2, 50, 4, 0.4, 0, { seeThrough: true });
  Stage.bounds(-25, 25, -13, 9);
  for (let x = -20; x <= 20; x += 8) { const c = Mk.ball(root, 0.9, Mat.get('#ffe8a0', { emissive: '#c0a040' }), x, 5.5, -3, { seg: 6 }); }
  Props.neon(root, 0, 4.6, -12.8, 'FONTAINE\'S FREEDOM CASINO', { color: '#ffe040', width: 14 });
  Props.neon(root, -14, 3.2, -12.8, 'LOOSEST SLOTS\nIN NEVADA', { color: '#ff40c0', width: 5 });
  Props.neon(root, 14, 3.2, -12.8, 'WIN BIG\nLOSE BIGGER', { color: '#40c0ff', width: 5 });
  // rows of slots
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) Props.slot(root, -20 + i * 1.2, -9 + r * 3, r ? Math.PI : 0);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) Props.slot(root, 11.6 + i * 1.2, -9 + r * 3, r ? Math.PI : 0);
  // craps / roulette tables
  for (const x of [-10, 10]) { Mk.box(root, 4, 0.9, 2.2, Mat.get('#2a6a3a'), x, 0, 2, { collide: true }); Mk.box(root, 4.2, 0.1, 2.4, '#5a3010', x, 0.9, 2); }
  // the elevator to the penthouse
  Mk.box(root, 3, 3.6, 0.2, Mat.get('metal', { color: '#d8c070' }), 0, 0, -12.8);
  Mk.sign(root, 'PENTHOUSE\nINVITATION ONLY', 0, 3.9, -12.6, { font: 'small', bg: '#202020', fg: '#ffe040' });
  // a velvet rope + a fountain of champagne
  Mk.cyl(root, 1.2, 1.4, 1.0, Mat.get('marble'), 0, 0, 3, { seg: 8, collide: true });
  Mk.cone(root, 0.8, 1.6, Mat.get('#f8e8a0', { emissive: '#605020' }), 0, 1.0, 3, { seg: 8 });
  for (let i = 0; i < 6; i++) { const ch = Props.chair(root, -20 + i * 8, 6.5, LP.rand(0, 6)); Props.throwable(ch, { label: 'CASINO CHAIR', value: 300, dmg: 3 }); }
  joke(-16, -6.6, 'PLAY A SLOT', [say('sleavis', 'Heh heh. It says "insert coin." I don\'t have a coin.'), say('sleavis', 'Heh heh. I\'m gonna insert my finger. ...Heh heh. OW.')], 'Uh huh huh. These games are rigged. Uh huh huh. In my favor, because I\'m awesome.');
  joke(0, 4.6, 'CHAMPAGNE FOUNTAIN', [say('sleavis', 'Heh heh. Fancy beer! It\'s got bubbles! Heh heh. Like a burp you drink.')], [say('slothhead', 'Uh huh huh. Champagne. That\'s what rich guys drink before they score.'), say('sleavis', 'Heh heh. We\'re about to be rich guys. Drink up, Slutt-Head.')]);
  return { start: [0, 7], start2: [-1.2, 7.6], slots: [-16, -7.2], elevator: [0, -11.6], doug: [6, 6] };
};

// ---------------------------------------------------------------------- DEKE'S PENTHOUSE
Areas.penthouse = function (root, st) {
  R3.setSky('#05030c', '#05030c', 30, 90);
  R3.setLight({ sky: '#ffe8c0', ground: '#302010', hemi: 1.2, sunI: 1.2, sunPos: [0, 10, 8], fillI: 0.6, rimI: 1.6 });
  Props.room(root, 0, -2, 18, 12, 4, { floor: Mat.get('marble', { color: '#f0e8e0' }), wall: Mat.get('paneling', { color: '#c09060' }) });
  Stage.bounds(-9, 9, -8, 4.2);
  // the window with the Strip glittering below
  const city = Tex.make('citylights', 64, 32, (c) => { c.fillStyle = '#0a0418'; c.fillRect(0, 0, 64, 32); const r = RNG(7); for (let i = 0; i < 260; i++) { c.fillStyle = r.pick(['#ffe040', '#ff40c0', '#40c0ff', '#ffffff', '#ff8020']); c.fillRect(r.int(0, 63), r.int(10, 31), 1, 1); } for (let i = 0; i < 9; i++) { c.fillStyle = '#1a1030'; c.fillRect(i * 7 + 1, r.int(4, 14), 5, 30); } });
  Mk.box(root, 14, 3.2, 0.1, new THREE.MeshBasicMaterial({ map: city }), 0, 0.4, -7.85);
  // desk, portrait, eagle, globe
  Mk.box(root, 3.2, 0.9, 1.3, Mat.get('planks', { color: '#4a2a10' }), 0, 0, -5, { collide: true });
  Mk.box(root, 1.0, 1.2, 0.8, '#202020', 0, 0, -6.4);
  const p = Tex.make('dekeportrait', 32, 40, (c) => { c.fillStyle = '#c8a040'; c.fillRect(0, 0, 32, 40); c.fillStyle = '#203060'; c.fillRect(3, 3, 26, 34); c.fillStyle = '#e8b8a0'; c.fillRect(11, 9, 10, 12); c.fillStyle = '#e8e0c0'; c.fillRect(9, 6, 14, 4); c.fillRect(6, 23, 20, 14); c.fillStyle = '#c02020'; c.fillRect(15, 23, 2, 8); c.fillStyle = '#000'; c.fillRect(13, 13, 2, 2); c.fillRect(17, 13, 2, 2); c.fillStyle = '#fff'; c.fillRect(13, 18, 6, 1); });
  Mk.box(root, 2.2, 2.8, 0.1, Mat.get(p), -6.5, 0.9, -7.85);
  Mk.sign(root, 'DEKE FONTAINE\n"FREEDOM ISN\'T FREE.\nIT\'S $49.99."', -6.5, 0.5, -7.75, { font: 'small', bg: '#c8a040', fg: '#202020' });
  const e = Mk.group(root, 6.5, 0, -6.8);
  Mk.cyl(e, 0.3, 0.4, 1.0, '#c8a040', 0, 0, 0, { seg: 6 }); Mk.ball(e, 0.5, '#c8a040', 0, 1.4, 0); Mk.box(e, 2.2, 0.15, 0.5, '#c8a040', 0, 1.5, 0, { rz: 0.2 });
  Mk.sign(root, 'GOLD EAGLE\n(SOLID)\n(DON\'T TOUCH)', 6.5, 0.6, -6.2, { font: 'small', bg: '#202020', fg: '#ffe040' });
  Props.couch(root, -5, -1, Math.PI / 2, { color: '#e8e0d0' });
  Props.couch(root, 5, -1, -Math.PI / 2, { color: '#e8e0d0' });
  joke(-6.5, -6.6, 'DEKE\'S PORTRAIT', 'Heh heh. "Freedom isn\'t free. It\'s forty-nine ninety-nine." ...Heh heh. Do we have forty-nine ninety-nine?', 'Uh huh huh. This guy\'s got a painting of himself. Uh huh huh. That\'s what I\'m gonna do when I\'m rich.');
  return { start: [0, 2.5], start2: [-1.2, 2.8], desk: [0, -3.8], deke: [0, -6.0] };
};

// ---------------------------------------------------------------------- THE HOOVER DAMN
// the walkway runs along x at z=0; the reservoir is behind (-z), the canyon drop in front (+z).
Areas.dam = function (root, st, arg) {
  const a = arg || {};
  R3.setSky('#0a0a24', '#141030', 60, 220);
  R3.setLight({ sky: '#8090ff', ground: '#302020', hemi: 1.1, sun: '#ffc0a0', sunI: 1.4, sunPos: [-10, 14, 10], fillI: 0.5, rimI: 1.6 });
  // dam top + face
  Mk.box(root, 120, 1.2, 8, 'concrete', 0, -1.2, 0, { tile: 3 });
  Mk.box(root, 120, 60, 4, Mat.get('concrete', { color: '#a8a090' }), 0, -61, 6, { tile: 6, rx: 0.0 });
  Mk.box(root, 120, 1.1, 0.5, '#c8c0b0', 0, 0, 3.9, { collide: true });
  Mk.box(root, 120, 1.1, 0.5, '#c8c0b0', 0, 0, -3.9, { collide: true });
  Stage.bounds(-50, 50, -3.6, 3.6);
  // the reservoir (Lake Mead-ish) and the canyon
  Mk.plane(root, 400, 300, Mat.get('water', { emissive: '#0a1830' }), 0, -2.5, -155, { tile: 6 });
  for (let i = 0; i < 9; i++) { Mk.box(root, 34, 22 + (i % 3) * 7, 30, Mat.get('rock', { color: '#a06040' }), -150 + i * 38, -12, -170 - (i % 3) * 25, { tile: 8 }); }
  for (const x of [-95, 95]) Mk.box(root, 40, 66, 300, Mat.get('rock', { color: '#905030' }), x, -60, -50, { tile: 8 });
  Mk.plane(root, 120, 200, 'rock', 0, -60, 90, { tile: 8 });
  // the intake towers
  for (const [x, z] of [[-40, -16], [-26, -18]]) { Mk.box(root, 4, 10, 4, Mat.get('concrete', { color: '#d0c8b0' }), x, -2.5, z); Mk.box(root, 4.6, 1.2, 4.6, '#b0a890', x, 7.5, z); }
  // the Freedom Fest stage at the east end + a crowd
  Mk.box(root, 12, 0.6, 7, 'planks', 42, 0, 0, { collide: true });
  Mk.sign(root, 'FONTAINE FREEDOM FEST', 42, 4.5, -3.4, { font: 'big', scale: 2, bg: '#2040a0', fg: '#ffffff', width: 11, height: 1.6 });
  Mk.box(root, 11, 1, 0.3, Mat.get('stripes'), 42, 2.8, -3.3);
  Props.speaker(root, 37, -2.5, 1.4); Props.speaker(root, 47, -2.5, 1.4);
  // the fireworks barge, way out on the water
  const barge = Mk.group(root, 6, -2.4, -60);
  Mk.box(barge, 16, 1.2, 8, '#3a3a3a', 0, 0, 0); for (let i = 0; i < 12; i++) Mk.cyl(barge, 0.3, 0.3, 1.6, LP.pick(['#e02020', '#2040e0', '#f0f0f0']), -6 + (i % 6) * 2.4, 1.2, -2 + Math.floor(i / 6) * 4, { seg: 5 });
  st.barge = barge;
  // the FREEDOM BLIMP: Deke's ride
  const blimp = Mk.group(root, 0, 26, -45);
  const bb = Mk.ball(blimp, 4, Mat.get(Tex.make('blimpskin', 32, 16, (c) => { c.fillStyle = '#e8e8f0'; c.fillRect(0, 0, 32, 16); c.fillStyle = '#c02020'; c.fillRect(0, 9, 32, 3); c.fillStyle = '#2040a0'; c.fillRect(0, 4, 32, 3); Font.draw(c, 'DEKE', 16, 5, '#202020', { face: 'small', align: 'center' }); }), { emissive: '#303030' }), 0, 0, 0, { seg: 10, rings: 6 });
  bb.scale.set(2.4, 1, 1);
  Mk.box(blimp, 3, 1.2, 1.4, '#c0a040', 0, -4.6, 0);
  for (const s of [-1, 1]) Mk.box(blimp, 0.2, 2.4, 1.8, '#c02020', -8.8, 0, 0, { rx: s * 0.9 });
  blimp.visible = !!a.blimp;
  st.blimp = blimp;
  // lamps
  for (let x = -48; x <= 48; x += 12) Props.lamp(root, x, -3.4, { ry: Math.PI / 2 });
  for (let i = 0; i < 4; i++) trash(root, -40 + i * 20, 2.8, 'DAM TRASH CAN');
  Mk.sign(root, 'HOOVER DAMN\n"WE KNOW. WE KNOW."', -30, 1.2, 3.4, { font: 'small', bg: '#2a4a8a', fg: '#ffffff' });
  joke(-30, 2.6, 'READ THE PLAQUE', [say('sleavis', 'Heh heh. Hoover DAMN. Heh heh heh. It says damn.'), say('slothhead', 'Uh huh huh. It\'s a dam, dumbass. It holds back the water.'), say('sleavis', 'Heh heh. Like a diaper.'), say('slothhead', '...Uh huh huh. Yeah. Like America\'s diaper.')], [say('slothhead', 'Uh huh huh. Hoover. Like the vacuum.'), say('sleavis', 'Heh heh. It sucks.'), say('slothhead', 'Uh huh huh. Yeah.')]);
  return { start: [-44, 0], start2: [-45.5, 1], stage: [42, 0], blimp, barge };
};
