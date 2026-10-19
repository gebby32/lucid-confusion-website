/* AREAS (2/3): barLot, bar, cornDog, base, lab, mall */
'use strict';

// ---------------------------------------------------------------------- THE RUSTY SPITTOON: parking lot
Areas.barLot = function (root, st) {
  R3.setSky('#2a1830', '#3a2030', 30, 100);
  R3.setLight({ sky: '#c08090', ground: '#402030', sun: '#ff9070', sunI: 1.3, sunPos: [10, 6, -10], rimI: 1.5 });
  Mk.plane(root, 160, 100, 'dirt', 0, 0, -10, { tile: 4 });
  Mk.plane(root, 40, 18, 'asphalt', 0, 0.03, 0, { tile: 3 });
  Stage.bounds(-20, 20, -9, 9);
  Props.building(root, 0, -14, 22, 10, 4.5, { tex: 'planks', color: '#7a5a3a', windows: false, door: true, doorX: 0, sign: null });
  Props.neon(root, 0, 6.2, -8.8, 'THE RUSTY SPITTOON', { color: '#ff5030', width: 9 });
  Props.neon(root, 6.5, 3.2, -8.85, 'BEER', { color: '#40c0ff', width: 2 });
  Props.neon(root, -6.5, 3.2, -8.85, 'NO\nSLOTHS', { color: '#ff40a0', width: 1.6 });
  Mk.sign(root, 'NO COPS\nNO FEDS\nNO LINE DANCING', 3.2, 1.6, -8.9, { font: 'small', bg: '#f0e8d0', fg: '#202020' });
  // the bikes: the first rule of a biker bar is DON'T TOUCH THE BIKES
  for (let i = 0; i < 7; i++) {
    const g = Mk.group(root, -9 + i * 1.6, 0, -6.2, 0.15);
    Mk.box(g, 0.25, 0.5, 1.8, '#2a2a2a', 0, 0.35, 0); Mk.box(g, 0.3, 0.3, 0.7, LP.pick(['#c02020', '#202020', '#3050a0', '#c0a020']), 0, 0.8, 0.1);
    Mk.cyl(g, 0.38, 0.38, 0.12, '#151515', 0, 0.38, 0.75, { rz: Math.PI / 2, seg: 8 }); Mk.cyl(g, 0.38, 0.38, 0.12, '#151515', 0, 0.38, -0.75, { rz: Math.PI / 2, seg: 8 });
    Mk.box(g, 0.9, 0.06, 0.06, '#c0c0c0', 0, 1.15, 0.65);
    g.rotation.z = 0.12;
    Props.breakable(g, { w: 0.6, h: 1.2, d: 1.9, hp: 1, value: 4500, colors: ['#2a2a2a', '#c0c0c0', '#c02020'], r: 0.8, sound: 'crash', onBreak: () => { Game.flags.bikesDown = (Game.flags.bikesDown || 0) + 1; if (Game.flags.bikesDown === 1) HUD.bark(Game.leader, Game.leader === 'sleavis' ? 'Heh heh. Oops. ...Heh heh. OOPS.' : 'Uhh... Uh huh huh. Nobody saw that.'); } });
  }
  Mk.sign(root, 'DON\'T TOUCH\nTHE BIKES', 2.5, 1.0, -4.8, { font: 'big', bg: '#ffe040', fg: '#202020', post: '#5a4a3a' });
  Props.dumpster(root, 14, -7, 0);
  for (let i = 0; i < 4; i++) trash(root, -16 + i * 2.5, -7.5);
  Props.lamp(root, -14, 3); Props.lamp(root, 14, 3);
  return { door: [0, -8], start: [-10, 6], start2: [-11, 7.2], van: [12, 4] };
};

// ---------------------------------------------------------------------- THE RUSTY SPITTOON: inside (long, for side-scrolling brawls)
Areas.bar = function (root, st) {
  R3.setSky('#100808', '#100808', 22, 48);
  R3.setLight({ sky: '#ffb070', ground: '#401810', hemi: 1.1, sunI: 1.0, sunPos: [0, 10, 6], fillI: 0.5, rimI: 1.3 });
  Mk.plane(root, 46, 9, 'planks', 0, 0.015, -0.5, { tile: 2 });
  Props.wall(root, -23, -5, 23, -5, 4, Mat.get('planks', { color: '#6a4a30' }));
  Props.wall(root, -23, -5, -23, 4, 4, Mat.get('planks', { color: '#6a4a30' }));
  Props.wall(root, 23, -5, 23, 4, 4, Mat.get('planks', { color: '#6a4a30' }));
  Stage.addBox(0, 0, 4.2, 46, 4, 0.4, 0, { seeThrough: true });
  Stage.bounds(-23, 23, -4.8, 4);
  // the bar along the back
  Props.counter(root, -8, -3.6, 14, 0, { color: '#5a3018', top: '#3a2010' });
  for (let i = 0; i < 18; i++) Mk.cyl(root, 0.06, 0.08, 0.32, LP.pick(['#3a7a3a', '#7a3a1a', '#c0a040', '#e0e0e0']), -14.5 + i * 0.75, 1.6, -4.7, { seg: 5 });
  Mk.box(root, 14, 0.08, 0.35, '#3a2010', -8, 1.58, -4.75);
  for (let i = 0; i < 9; i++) Props.stool(root, -14 + i * 1.5, -2.6);
  Mk.sign(root, 'HAPPY HOUR: 4-4:05\nCASH ONLY\nCASH NOT ACCEPTED EITHER', -8, 3.0, -4.85, { font: 'small', bg: '#202020', fg: '#ffe040' });
  Props.neon(root, 4, 3.0, -4.85, 'COLD BEER\nWARM FISTS', { color: '#40c0ff', width: 3 });
  // pool table, jukebox, tables
  Props.pooltable(root, 4, 0.5, Math.PI / 2);
  Props.jukebox(root, 9.5, -4.3, 0);
  for (const [x, z] of [[-17, 1.5], [-12, 2], [-3, 1.8]]) { Props.table(root, x, z, { w: 1.2, d: 1.2, top: '#7a5030' }); }
  // the karaoke stage at the right end
  Mk.box(root, 8, 0.6, 7, 'planks', 18.5, 0, -1, { collide: true });
  Props.speaker(root, 15.2, -3.8, 1.2); Props.speaker(root, 21.8, -3.8, 1.2);
  Mk.cyl(root, 0.03, 0.03, 1.6, '#c0c0c0', 18.5, 0.6, -0.5, { seg: 4 });
  Props.neon(root, 18.5, 3.4, -4.85, 'KARAOKE\nNITE', { color: '#ff40c0', width: 3 });
  Mk.sign(root, 'SING OR BLEED', 18.5, 2.2, -4.85, { font: 'big', bg: '#a02020', fg: '#ffffff' });
  // throwables for the inevitable brawl
  for (const x of [-18, -10, -1, 7, 12]) { const c = Props.chair(root, x, 2.6, LP.rand(0, 6)); Props.throwable(c, { label: 'CHAIR', value: 60, dmg: 3 }); }
  for (const x of [-15, -5, 2]) trash(root, x, 3.2, 'SPITTOON');
  for (const x of [-20, 10]) { const b = Props.barrel(root, x, -4.2, { color: '#6a4a2a' }); Props.throwable(b, { label: 'KEG', value: 90, dmg: 5, heavy: true }); }
  joke(9.5, -3.4, 'JUKEBOX', [say('sleavis', 'Heh heh. "Mama Tried, But Mama Also Hit Me." Heh heh. Classic.')], [say('slothhead', 'Uh huh huh. Every song on here is about a truck, a dog, or a divorce. Uh huh huh. Sometimes all three.')]);
  joke(4, 1.8, 'POOL TABLE', 'Heh heh. Balls. Heh heh heh. BALLS.', 'Uh huh huh. Stick. Uh huh huh. Pocket.');
  return { door: [-21, 2.5], stage: [18.5, -1], bar: [-8, -2.2] };
};

// ---------------------------------------------------------------------- CORN DOG CANYON (tourist trap)
Areas.cornDog = function (root, st, arg) {
  R3.setSky('#78a8e8', '#e0c0a0', 50, 170);
  R3.setLight({ sky: '#ffe8c8', ground: '#a07040', sunI: 2.3, sunPos: [-10, 16, 8] });
  Mk.plane(root, 220, 160, 'sand', 0, 0, -20, { tile: 4 });
  Mk.plane(root, 60, 40, 'dirt', 0, 0.03, -5, { tile: 4 });
  Stage.bounds(-28, 28, -24, 14);
  for (let i = 0; i < 5; i++) Props.mesa(root, -100 + i * 50, -95);
  for (let i = 0; i < 10; i++) Props.cactus(root, LP.pick([-1, 1]) * LP.rand(30, 60), LP.rand(-50, 20));
  // THE CORN DOG: 18 metres of fried pride
  const cd = Mk.group(root, 0, 0, -14);
  Mk.cyl(cd, 0.5, 0.5, 5, '#d8c8a0', 0, 0, 0, { seg: 6 });
  const dog = Mk.cyl(cd, 2.2, 2.4, 14, 'cornbatter', 0, 5, 0, { seg: 9 });
  Mk.ball(cd, 2.2, 'cornbatter', 0, 19, 0, { seg: 9, rings: 5, sy: 0.6 });
  Mk.box(cd, 0.5, 9, 0.3, '#e8d020', 1.3, 8, 2.1, { rz: 0.15 }); Mk.box(cd, 0.4, 6, 0.3, '#e8d020', -1.1, 11, 2.15, { rz: -0.2 });
  Mk.box(cd, 0.35, 5, 0.3, '#c02020', 0.2, 12, 2.25, { rz: 0.05 });
  if (P_col()) Stage.addCircle(0, -14, 2.5, 0, 20);
  st.cornDog = cd;
  Mk.sign(root, 'WORLD\'S LARGEST\nCORN DOG\n60 FT! (APPROX.)\n(DON\'T LICK IT)', 5, 1.4, -10, { font: 'big', bg: '#fff0a0', fg: '#a02020', post: '#5a4a3a' });
  // gift shop (Wade's)
  Props.building(root, -18, -10, 10, 7, 3.6, { tex: 'planks', color: '#c8a070', sign: 'GIFTS & TRUTH', signO: { bg: '#e8e0c0', fg: '#2a6a2a', border: '#2a6a2a' }, signH: 0.9, doorX: 2 });
  Mk.sign(root, 'TINFOIL HATS $5\nTHEY KNOW.\nTHEY ALWAYS KNOW.', -14.5, 1.6, -6.4, { font: 'small', bg: '#d0d8e0', fg: '#202020' });
  // mystery hole
  Props.fence(root, 13, -9, 19, -9, { h: 1 }); Props.fence(root, 13, -3, 19, -3, { h: 1 }); Props.fence(root, 13, -9, 13, -3, { h: 1 }); Props.fence(root, 19, -9, 19, -3, { h: 1 });
  Mk.plane(root, 3, 3, Mat.get('#050505'), 16, 0.06, -6);
  Mk.sign(root, 'THE MYSTERY HOLE\nDO NOT LOOK IN\nTHE MYSTERY HOLE', 16, 1.6, -2.7, { font: 'small', bg: '#202040', fg: '#ff60ff', post: '#5a4a3a' });
  // petrified hot dog forest
  for (let i = 0; i < 7; i++) { const x = 14 + (i % 4) * 2.4, z = 4 + Math.floor(i / 4) * 3; Mk.cyl(root, 0.35, 0.4, LP.rand(1.6, 3.2), Mat.get('rock', { color: '#8a5a3a' }), x, 0, z, { seg: 6, collide: true }); }
  Mk.sign(root, 'PETRIFIED HOT DOG\nFOREST (REAL!*)\n*NOT REAL', 13, 1.4, 1.6, { font: 'small', bg: '#e8d8b0', fg: '#5a3010', post: '#5a4a3a' });
  // the two-headed rattlesnake
  Mk.box(root, 1.6, 0.9, 0.9, '#5a4a3a', -6, 0, 2, { collide: true });
  Mk.box(root, 1.5, 0.6, 0.8, Mat.get('#80a0a0', { transparent: true, opacity: 0.5 }), -6, 0.9, 2);
  Mk.box(root, 1.0, 0.08, 0.1, '#6a8a30', -6, 0.95, 2); Mk.box(root, 0.1, 0.08, 0.1, '#c0c0c0', -5.95, 0.95, 2);
  Mk.sign(root, 'TWO-HEADED\nRATTLESNAKE', -6, 1.9, 2.5, { font: 'small', bg: '#f0e0b0', fg: '#202020' });
  // Slaria's family RV + picnic tables
  if (!(arg && arg.noRV)) Props.rv(root, -15, 8, Math.PI / 2 + 0.2);
  for (const [x, z] of [[-4, 9], [4, 9]]) { Props.table(root, x, z, { w: 2, d: 1, top: '#a07040' }); }
  Props.billboard(root, 22, -20, { text: 'CORN DOG\nCANYON\nNO REFUNDS', bg: '#ffe040', fg: '#a02020' }, -0.3);
  joke(16, -2.6, 'LOOK IN THE MYSTERY HOLE', [say('sleavis', 'Heh heh. There\'s nothing in there.'), say('sleavis', '...'), say('sleavis', 'It\'s looking back at me. Heh heh. COOL.')], [say('slothhead', 'Uh huh huh. It\'s a hole. In the ground.'), say('slothhead', 'Uhh... I can hear my mom in there. Uh huh huh. Let\'s go.')]);
  joke(-6, 2.9, 'TWO-HEADED RATTLESNAKE', [say('sleavis', 'Heh heh. Two heads! That\'s like... double head!'), say('slothhead', 'Uh huh huh. It\'s two snakes. With tape.'), say('sleavis', 'Heh heh. Still counts.')], [say('slothhead', 'Uh huh huh. One head is asleep. The other one looks like it wants to die.'), say('sleavis', 'Heh heh. That\'s like us.')]);
  joke(14, 2.6, 'PETRIFIED HOT DOGS', 'Heh heh. Petrified. That means they\'re scared. Heh heh. Of me.', 'Uh huh huh. These are like, a million years old. Like the hot dogs at the Gas-N-Gasp.');
  joke(5, -9.5, 'READ CORN DOG SIGN', 'Heh heh. "Don\'t lick it." ...Heh heh. Too late.', 'Uh huh huh. World\'s largest corn dog. That\'s what she said.');
  function P_col() { return Props.col; }
  return { start: [-2, 11], start2: [-3, 12], shop: [-16, -6.2], rv: [-15, 8], cornDog: [0, -14], hole: [16, -6] };
};

// ---------------------------------------------------------------------- AREA 69 (perimeter, at night)
Areas.base = function (root, st) {
  R3.setSky('#05060e', '#05060e', 18, 55);
  R3.setLight({ sky: '#4050a0', ground: '#201810', hemi: 0.9, sun: '#a0b0ff', sunI: 0.7, sunPos: [-6, 14, 4], fillI: 0.3, rimI: 1.5 });
  Mk.plane(root, 200, 120, 'sand', 0, 0, -10, { tile: 4 });
  Mk.plane(root, 8, 60, 'asphalt', 12, 0.03, -5, { tile: 3 });
  Stage.bounds(-22, 22, -30, 24);
  // perimeter fence with a hole in it ("the hole Wade cut")
  Props.fence(root, -22, 18, -2, 18, { chain: true, h: 2.6 }); Props.fence(root, 2, 18, 22, 18, { chain: true, h: 2.6 });
  Mk.sign(root, 'AREA 69\nRESTRICTED\nUSE OF DEADLY FORCE\nIS ENCOURAGED', -6, 1.6, 18.3, { font: 'small', bg: '#f0f0e0', fg: '#c02020' });
  Mk.sign(root, 'NOTHING TO SEE\nHERE (NO ALIENS)\n(NONE) (STOP ASKING)', 6, 1.6, 18.3, { font: 'small', bg: '#f0f0e0', fg: '#202020' });
  // hangar at the north end
  Props.building(root, 0, -27, 24, 8, 8, { tex: 'corrugated', color: '#909890', windows: false, door: false, sign: 'HANGAR 18\n(DEFINITELY NOT 51)', signO: { font: 'big', bg: '#202020', fg: '#ffe040' }, signH: -1.5 });
  Mk.box(root, 6, 5, 0.1, Mat.get('corrugated', { color: '#6a706a' }), 0, 0, -22.95);
  Mk.box(root, 1.2, 2.2, 0.12, '#3a3a3a', 5, 0, -22.92);
  // crates, barrels, jeeps, a porta-potty: places to hide behind
  const covers = [[-8, 10, 1.6], [-3, 6, 1.4], [5, 8, 1.4], [-12, 0, 1.8], [-6, -3, 1.2], [3, -2, 1.6], [9, -8, 1.4], [-9, -12, 1.6], [2, -14, 1.4], [-14, -18, 1.4]];
  for (const c of covers) Props.crate(root, c[0], c[1], c[2]);
  Props.crate(root, -8, 10, 0.8, { y: 1.6, loose: true });
  for (const [x, z] of [[-16, 6], [15, -4], [-3, -18]]) Props.barrel(root, x, z, { color: '#4a5a3a' });
  const jeep = Mk.group(root, 14, 0, 4, 0.3);
  Mk.box(jeep, 2, 1, 3.6, Mat.get('camo'), 0, 0.4, 0); Mk.box(jeep, 1.9, 0.1, 1.2, '#2a2a2a', 0, 1.4, -0.2);
  Props.solid(14, 4, 2.2, 1.5, 3.6, 0.3);
  Props.portapotty(root, -18, 12, Math.PI / 2, { color: '#4a5a3a', label: 'GOVT\nISSUE' });
  Props.tower(root, -18, -6); Props.tower(root, 18, 12);
  Props.satdish(root, 18, -16, -0.6);
  for (const [x, z] of [[-11, 14], [10, 15], [-15, -10], [12, -12]]) Props.bush(root, x, z, 1.2);
  st.hides = [{ x: -11, z: 14, r: 1.3 }, { x: 10, z: 15, r: 1.3 }, { x: -15, z: -10, r: 1.3 }, { x: 12, z: -12, r: 1.3 }, { x: -18, z: 13.5, r: 1.2 }];
  // searchlight beams (decor)
  for (const x of [-18, 18]) { const b = Mk.cone(root, 3, 22, new THREE.MeshBasicMaterial({ color: '#fff8c0', transparent: true, opacity: 0.12, depthWrite: false }), x, 8, x < 0 ? -6 : 12, { seg: 8 }); b.rotation.x = Math.PI - 0.6; st.ticks.push((dt, t) => { b.rotation.z = Math.sin(t * 0.5 + x) * 0.8; }); }
  return { start: [0, 21], start2: [-1.2, 22], door: [5, -22], hole: [0, 18] };
};

// ---------------------------------------------------------------------- THE LAB (inside the hangar)
Areas.lab = function (root, st) {
  R3.setSky('#0a100e', '#0a100e', 22, 46);
  R3.setLight({ sky: '#c0fff0', ground: '#204040', hemi: 1.3, sunI: 1.0, sunPos: [2, 10, 6], fillI: 0.5 });
  Props.room(root, 0, -2, 24, 12, 5, { floor: Mat.get('metal', { color: '#6a7a7a' }), wall: Mat.get('corrugated', { color: '#7a8a84' }) });
  Stage.bounds(-12, 12, -8, 4.2);
  for (let x = -9; x <= 9; x += 6) Mk.box(root, 2, 0.08, 0.5, new THREE.MeshBasicMaterial({ color: '#e0fff8' }), x, 4.9, -2);
  // the autopsy: a sloth named Greg
  Mk.box(root, 2.2, 0.9, 1.0, Mat.get('metal', { color: '#c0c8c8' }), -6, 0, -3, { collide: true });
  const greg = Npc.make({ skin: '#8a6a4a', shirt: '#8a6a4a', pants: '#8a6a4a', hair: '#6a4a2a', h: 1.2, mouth: 'o', name: 'GREG' });
  greg.root.position.set(-6, 0.95, -3); greg.root.rotation.y = Math.PI / 2; greg.setAnim('ko'); greg.animT = 5; greg.update(0.5); greg.update(0.5);
  root.add(greg.root);
  Mk.sign(root, 'SUBJECT: "GREG"\nSPECIES: UNKNOWN\nATTITUDE: POOR', -6, 1.8, -2.4, { font: 'small', bg: '#e0f0f0', fg: '#202020', post: '#808080' });
  // P.A.T.R.I.O.T. mock-up hanging from the ceiling
  const sat = Mk.group(root, 4, 3.4, -5);
  Mk.box(sat, 1.2, 1.2, 1.2, '#c0a040', 0, 0, 0); Mk.box(sat, 4, 0.06, 1.2, Mat.get('#2040a0', { emissive: '#101840' }), 0, 0.5, 0);
  Mk.cone(sat, 0.5, 0.8, '#e0e0e0', 0, -0.8, 0, { seg: 8 }).rotation.x = Math.PI;
  Mk.sign(root, 'P.A.T.R.I.O.T.\nORBITAL MIRROR\n(SCALE MODEL)\n(THE REAL ONE IS\nIN SPACE) (OBVIOUSLY)', 4, 1.5, -7.85, { font: 'small', bg: '#202830', fg: '#80ffd0' });
  st.ticks.push((dt) => { sat.rotation.y += dt * 0.4; });
  // computers + filing cabinets
  for (let i = 0; i < 4; i++) { Mk.box(root, 1.4, 1.0, 0.7, '#c8c8c0', -10 + i * 1.6, 0, -7.4, { collide: true }); Mk.box(root, 0.6, 0.45, 0.1, new THREE.MeshBasicMaterial({ color: '#30c060' }), -10 + i * 1.6, 1.2, -7.2); }
  Mk.box(root, 0.8, 1.6, 0.6, '#6a6a5a', 10.5, 0, -7.4, { collide: true });
  Mk.sign(root, 'TOP SECRET\nFILES', 10.5, 1.9, -7.08, { font: 'small', bg: '#c02020', fg: '#ffffff' });
  // the legendary government vending machine
  const vend = Props.vending(root, 8, -7.3, 0, { color: '#2a4a2a', label: 'GOVT' });
  Props.solid(8, -7.3, 1.1, 2, 0.8);
  // test tubes, a cola dispenser for "the caffeine study"
  Mk.box(root, 3, 0.9, 0.8, Mat.get('metal', { color: '#a0b0b0' }), -1, 0, 0.5, { collide: true });
  for (let i = 0; i < 8; i++) Mk.cyl(root, 0.06, 0.06, 0.3, Mat.get(LP.pick(['#40ff80', '#ff40c0', '#40c0ff', '#ffe040']), { emissive: '#202020' }), -2.2 + i * 0.32, 0.9, 0.5, { seg: 5 });
  Mk.sign(root, 'ULTRA-COLA\nCAFFEINE STUDY\nDO NOT DRINK\n(DRINK)', -1, 1.9, 0.95, { font: 'small', bg: '#ff40c0', fg: '#ffffff' });
  joke(-6, -2.2, 'EXAMINE GREG', [say('sleavis', 'Heh heh. It\'s a sloth. In a hat.'), say('slothhead', 'Uh huh huh. It\'s like... us. But dead.'), say('sleavis', 'Heh heh. Or BETTER.')], [say('slothhead', 'Uh huh huh. Greg.'), say('sleavis', 'Heh heh. He looks like your dad, Slutt-Head.'), say('slothhead', 'My dad left when I was two, dumbass.'), say('sleavis', 'Heh heh. ...To HERE.')]);
  joke(4, -6.8, 'SATELLITE MODEL', [say('sleavis', 'Heh heh. It\'s a satellite. Like for cable TV!'), say('slothhead', 'Uh huh huh. That\'s the one our remote goes to.'), say('sleavis', '...Heh heh. Nah.')], [say('slothhead', 'Uh huh huh. P.A.T.R.I.O.T. That\'s like... a patriot. A guy who loves America.'), say('slothhead', 'Uh huh huh. Like me. I love America. It has boobs in it.')]);
  return { door: [5, 3], greg: [-6, -1.6], files: [10.5, -6.6], cola: [-1, 1.6], vend: [8, -6.5], vendMesh: vend };
};

// ---------------------------------------------------------------------- MEGA-MALL OF THE SOUTHWEST
Areas.mall = function (root, st) {
  R3.setSky('#d8d0e0', '#d8d0e0', 30, 70);
  R3.setLight({ sky: '#fff8f0', ground: '#806870', hemi: 1.5, sunI: 1.3, sunPos: [0, 14, 6], fillI: 0.5 });
  Mk.plane(root, 56, 22, Mat.get('checker', { color: '#f0e8f0' }), 0, 0.015, -2, { tile: 2 });
  Props.wall(root, -28, -13, 28, -13, 6, Mat.get('stucco', { color: '#e8e0e8' }));
  Props.wall(root, -28, -13, -28, 9, 6, Mat.get('stucco', { color: '#e8e0e8' }));
  Props.wall(root, 28, -13, 28, 9, 6, Mat.get('stucco', { color: '#e8e0e8' }));
  Stage.addBox(0, 0, 9.2, 56, 4, 0.4, 0, { seeThrough: true });
  Stage.bounds(-28, 28, -13, 9);
  for (let x = -24; x <= 24; x += 8) Mk.box(root, 3, 0.1, 1, new THREE.MeshBasicMaterial({ color: '#fffff0' }), x, 5.9, -4);
  // storefronts along the back
  const shops = [['GAG ME GIFTS', '#ff40c0'], ['VICKY\'S UNMENTIONABLES', '#c02060'], ['PAGES\n(NOBODY COMES HERE)', '#2a6a4a'], ['SUNGLASS SHACK', '#e0a020'], ['THE KNIFE PLACE', '#606060'], ['CANDLE BARN', '#a06020']];
  shops.forEach((s, i) => {
    const x = -22.5 + i * 9;
    Mk.box(root, 8.6, 4.4, 0.4, Mat.get('stucco', { color: '#f0f0f0' }), x, 0, -12.8);
    Mk.box(root, 6, 2.8, 0.1, Mat.get('#90a8c0', { transparent: true, opacity: 0.6 }), x, 0, -12.55);
    Mk.sign(root, s[0], x, 3.6, -12.5, { font: s[0].length > 14 ? 'small' : 'big', bg: '#202020', fg: s[1], width: 7, height: 1.2 });
  });
  // the fountain (coins!)
  Mk.cyl(root, 3.2, 3.4, 0.7, Mat.get('marble'), 0, 0, -3, { seg: 10, collide: true });
  Mk.cyl(root, 2.9, 2.9, 0.05, Mat.get('water', { emissive: '#103050' }), 0, 0.6, -3, { seg: 10 });
  Mk.cyl(root, 0.3, 0.5, 2.2, Mat.get('marble'), 0, 0.6, -3, { seg: 6 });
  Mk.sign(root, 'WISHING FOUNTAIN\nWISHES NOT GUARANTEED\nPENNIES PROPERTY OF MALL', 0, 1.3, 0.6, { font: 'small', bg: '#f0f0f0', fg: '#3050a0', post: '#a0a0a0' });
  // food court
  for (const [x, z] of [[14, 2], [18, 2], [22, 2], [14, 5.5], [18, 5.5], [22, 5.5]]) Props.table(root, x, z, { w: 1.2, d: 1.2, top: '#f0d040' });
  Props.building(root, 20, -9.5, 10, 4, 3.5, { tex: 'stucco', color: '#ffe040', sign: 'WEENIE ON A POLE', signO: { bg: '#ff4040', fg: '#ffffff' }, signH: 0.6, windows: false, door: false });
  Props.counter(root, 20, -7, 8, 0, { color: '#ff4040' });
  // Chuck Thunder's signing table
  Props.table(root, -14, 1, { w: 3, d: 1, top: '#2020a0' });
  Mk.sign(root, 'CHUCK THUNDER!\nSTAR OF PUNCH FIST 1-3\nAUTOGRAPHS $40\nPHOTOS $60\nPUNCHES: ASK', -14, 2.2, 0.0, { font: 'small', bg: '#202020', fg: '#ffe040' });
  // kiosks, palms, an escalator to nowhere
  Props.kiosk(root, -6, 4); Props.kiosk(root, 7, 5);
  for (const [x, z] of [[-24, 6], [-10, -9], [10, -9], [25, -10]]) Props.palm(root, x, z);
  Mk.box(root, 2.4, 3, 7, Mat.get('metal', { color: '#a0a0a8' }), -24, 0, -6, { rx: 0, collide: true });
  Mk.sign(root, 'ESCALATOR\nOUT OF ORDER\n(IT\'S STAIRS NOW)', -22.6, 1.4, -2.4, { font: 'small', bg: '#ffe040', fg: '#202020' });
  for (let i = 0; i < 4; i++) trash(root, -18 + i * 10, 7.5, 'MALL TRASH CAN');
  joke(0, 0.8, 'FOUNTAIN', [say('sleavis', 'Heh heh. Free money. In the water.'), say('sign', '(You fish out $1.37 in pennies. A mall cop somewhere feels a disturbance.)'), say('sleavis', 'Heh heh. I wished for boobs. ...Nothing yet.')], [say('slothhead', 'Uh huh huh. I wish I was rich. And famous. And had chicks.'), say('sleavis', 'Heh heh. You only get one wish, Slutt-Head.'), say('slothhead', 'Then I wish you\'d SHUT UP.'), say('sleavis', '...Heh heh. It didn\'t work.')]);
  joke(-13.5, -12, 'VICKY\'S UNMENTIONABLES', [say('sleavis', 'Heh heh. Underwear for chicks. Heh heh heh. Let\'s go in.'), say('sign', '(A sign on the door: "NO SLOTHS. WE MEAN IT THIS TIME.")'), say('sleavis', 'Heh heh. "This time." We\'ve been here before.')], [say('slothhead', 'Uh huh huh. I\'m gonna buy something for my lady.'), say('sleavis', 'Heh heh. You don\'t have a lady.'), say('slothhead', 'Uh huh huh. I\'ll have one after Lost Wages, dumbass. I\'m planning ahead.')]);
  joke(-4.5, -12, 'GAG ME GIFTS', [say('sleavis', 'Heh heh. Whoopee cushions! Fake barf! A lava lamp shaped like a butt!'), say('sleavis', 'This is the greatest store in America.')], 'Uh huh huh. Fake dog crap. Five bucks. Uh huh huh. Sleavis makes it for free.');
  return { start: [-20, 6], start2: [-21, 7.2], chuck: [-14, 0], pages: [0, -11.5], fountain: [0, 0.6], food: [18, 3.5] };
};
