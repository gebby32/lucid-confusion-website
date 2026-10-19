/* AREAS (1/3) — the places. Each builder(root, stage, arg) makes geometry, colliders,
   flavour hotspots (jokes) and returns spawn points. Story-critical hotspots live in the
   chapter scripts. Coordinates: x right, z toward the camera, y up. Sizes in metres.
   Areas here: empty, house, street, gasngasp, roadside, pumpstation, motel, motelRoom,
   truckstop, truckLot. */
'use strict';
const Areas = {};
// a hotspot that says something different depending on which idiot pokes it
function joke(x, z, label, forSleavis, forSloth, o) {
  const norm = (l, id) => (typeof l === 'string' ? [[id, l]] : l);
  return Stage.hot(Object.assign({ x, z, label, act: function* (S, h, L) {
    const lines = (L.id === 'sleavis' ? forSleavis : forSloth) || forSleavis;
    if (typeof lines === 'function') { yield* lines(S, h, L); return; }
    yield* S.lines(norm(lines, L.id));
  } }, o));
}
// a sign on a wall/post with a joke on it (decoration only)
function signAt(root, text, x, y, z, ry, o) { return Mk.sign(root, text, x, y, z, Object.assign({ ry: ry || 0 }, o)); }
function gnome(root, x, z) {
  const g = Mk.group(root, x, 0, z);
  Mk.cone(g, 0.12, 0.25, '#d02020', 0, 0.38, 0, { seg: 5 }); Mk.box(g, 0.2, 0.25, 0.18, '#3050c0', 0, 0.12, 0); Mk.box(g, 0.14, 0.12, 0.14, '#f0c0a0', 0, 0.3, 0); Mk.box(g, 0.14, 0.08, 0.04, '#f0f0f0', 0, 0.3, 0.08);
  return Props.throwable(g, { label: 'GARDEN GNOME', value: 45, dmg: 3 });
}
function trash(root, x, z, label) { const g = Props.trashcan(root, x, z); return Props.throwable(g, { label: label || 'TRASH CAN', value: 30, dmg: 3 }); }

// ---------------------------------------------------------------------- EMPTY (drive / runner modes build their own world)
Areas.empty = function (root, st, arg) {
  const a = arg || {};
  R3.setSky(a.sky || '#e8907a', a.fog || a.sky || '#e8907a', a.near || 40, a.far || 170);
  R3.setLight(a.light || { sky: '#ffd8b0', ground: '#806040', sunI: 2.2, sunPos: [-10, 14, -8] });
  return {};
};

// ---------------------------------------------------------------------- THEIR HOUSE
Areas.house = function (root, st) {
  R3.setSky('#140e18', '#140e18', 20, 45);
  R3.setLight({ sky: '#ffe2b8', ground: '#4a3828', hemi: 1.3, sunI: 1.2, sunPos: [2, 10, 8], fillI: 0.4 });
  const W = Props.wall;
  Mk.plane(root, 10, 7, 'carpet', -1, 0.015, -0.5, { tile: 2 });
  Mk.plane(root, 4, 7, 'linoleum', -8, 0.018, -0.5, { tile: 2 });
  Mk.plane(root, 4, 7, Mat.get('grosstile'), 6, 0.018, -0.5, { tile: 1.5 });
  W(root, -10, -4, 8, -4, 2.8, 'paneling');
  W(root, -10, -4, -10, 3, 2.8, 'wallpaper');
  W(root, 8, -4, 8, 0.8, 2.8, Mat.get('wallpaper', { color: '#c0d0c0' }));
  W(root, 8, 2.2, 8, 3, 2.8, Mat.get('wallpaper', { color: '#c0d0c0' }));
  W(root, -6, -4, -6, -0.5, 2.8, 'wallpaper');
  W(root, 4, -4, 4, -0.2, 2.8, 'paneling');
  W(root, 4, 0, 5.3, 0, 2.8, Mat.get('wallpaper', { color: '#c0d0c0' }));
  W(root, 6.7, 0, 8, 0, 2.8, Mat.get('wallpaper', { color: '#c0d0c0' }));
  Stage.addBox(-1, 0, 3.2, 18, 3, 0.3, 0, { seeThrough: true });       // invisible front wall
  Stage.bounds(-10, 8, -4, 3.2);
  // front door
  Mk.box(root, 0.1, 2.1, 1.3, '#6a3a20', 7.95, 0, 1.5);
  signAt(root, 'NO SOLICITORS\nNO JEHOVAHS\nNO HOMEWORK', 7.9, 1.7, 1.5, -Math.PI / 2, { font: 'small', bg: '#f0e0a0', fg: '#802020' });
  // living room
  Props.couch(root, -2.6, -1.0, Math.PI / 2, { color: '#a87a48' });
  Mk.box(root, 1.0, 0.45, 1.6, 'planks', -1.0, 0, -1.0, { collide: true });
  Mk.box(root, 0.45, 0.06, 0.32, Mat.get(Tex.sign('PIZZA', { bg: '#e8e0c0', fg: '#c02020', font: 'small' })), -1.0, 0.45, -1.3);
  for (let i = 0; i < 5; i++) { const c = Props.can(root, -1.2 + Math.random() * 0.5, -0.8 + Math.random() * 0.5); c.scale.setScalar(0.6); c.position.y = 0.45; }
  Mk.box(root, 0.6, 0.55, 1.2, '#4a3a2a', 2.7, 0, -1.0, { collide: true });
  const tv = Props.tv(root, 2.7, -1.0, -Math.PI / 2, { y: 0.55 });
  Mk.box(root, 0.3, 1.5, 0.3, '#2a2a2a', 3.0, 0, -3.2);
  Mk.ball(root, 0.35, Mat.get('#f0e0a0', { emissive: '#806020' }), 3.0, 1.75, -3.2, { sy: 0.8 });
  signAt(root, 'DEATH CLAM\nLIVE AT THE\nBOWL-O-RAMA', -3.5, 1.7, -3.86, 0, { font: 'big', bg: '#1a1a1a', fg: '#e04040' });
  signAt(root, 'BIKINI\nTRUCK\nWASH \'97', 0.5, 1.7, -3.86, 0, { font: 'big', bg: '#40a0e0', fg: '#ffffff' });
  Mk.box(root, 1.0, 2.1, 0.06, '#6a4a2a', -4.6, 0, -3.95);
  signAt(root, 'SLEAVIS\'\nROOM', -4.6, 2.0, -3.9, 0, { font: 'small', bg: '#e0e0e0', fg: '#202020' });
  Mk.box(root, 1.0, 2.1, 0.06, '#6a4a2a', 2.2, 0, -3.95);
  signAt(root, 'SLOTH-HEAD\'S ROOM\nKEEP OUT SLEAVIS\nTHIS MEANS YOU', 2.2, 1.8, -3.9, 0, { font: 'small', bg: '#e0e0e0', fg: '#a02020' });
  Mk.box(root, 0.9, 0.5, 0.9, Mat.get('carpet', { color: '#506080' }), 0.4, 0, 1.6);
  // kitchen
  Props.fridge(root, -9.3, -3.4, 0);
  Props.counter(root, -7.6, -3.5, 2.6, 0, { color: '#e0d8b0', tex: 'linoleum' });
  Mk.box(root, 0.6, 0.06, 0.4, '#a0a0a0', -7.0, 1.06, -3.5);
  Props.table(root, -8.3, -0.6, { w: 1.4, d: 1.0, top: '#c0b090' });
  Props.chair(root, -9.2, -0.6, Math.PI / 2); Props.chair(root, -7.4, -0.6, -Math.PI / 2);
  for (let i = 0; i < 6; i++) Mk.box(root, 0.5, 0.06, 0.5, Mat.get(Tex.sign('PIZZA', { bg: '#e8e0c0', fg: '#c02020', font: 'small' })), -9.3, i * 0.07, 2.2, { ry: i * 0.3 });
  // bathroom
  Props.toilet(root, 7.1, -3.4, 0, { gross: true });
  Props.sink(root, 5.0, -3.6, 0);
  signAt(root, 'JUST\nDON\'T', 6.1, 1.9, -3.88, 0, { font: 'big', bg: '#e8e8d8', fg: '#402020' });
  // answering machine in the hall
  Mk.box(root, 0.6, 0.8, 0.4, '#5a3a20', 4.7, 0, 2.6, { collide: true });
  Mk.box(root, 0.35, 0.1, 0.25, '#202020', 4.7, 0.8, 2.6);
  Mk.box(root, 0.06, 0.04, 0.06, new THREE.MeshBasicMaterial({ color: '#ff2020' }), 4.8, 0.9, 2.55);

  const tvProp = Stage.prop({ mesh: null, x: 2.7, y: 0.5, z: -1.0, kind: 'break', hp: 3, value: 199, r: 0.6, colors: ['#3a3028', '#c0c0c0', '#202020'], onBreak: () => { tv.visible = false; Game.flags.tvBroken = true; Story.run(function* (S) { yield* S.lines([['sleavis', 'Uh oh. Heh heh.'], ['slothhead', 'You broke the TV, dumbass.'], ['sleavis', 'Heh heh. Well... now we REALLY need a remote.']]); }); } });
  // flavour
  joke(2.2, -0.8, 'LOOK AT TV', [['sleavis', 'Heh heh. It\'s the news. Some guy in a suit is talking about a "stolen satellite thing."'], ['sleavis', 'BORING. Where\'s the part with the explosions?']], [['slothhead', 'Uh huh huh. Static. My favorite show.'], ['slothhead', 'If you squint it looks like a butt.']]);
  joke(-9.3, -2.8, 'OPEN FRIDGE', [['sleavis', 'There\'s a casserole in here from like, 1995. Heh heh.'], ['sleavis', 'It\'s breathing. I\'m gonna name it Gary.']], [['slothhead', 'Uh huh huh. Mustard. And one pickle.'], ['slothhead', 'Dinner.']]);
  joke(7.1, -2.6, 'USE TOILET', [['sleavis', 'Heh heh. No way. Something LIVES in there now.'], ['sleavis', 'It winked at me.']], [['slothhead', 'Uh huh huh. Sleavis did something in here in 1998. It\'s still... active.']]);
  joke(-4.6, -3.4, 'SLEAVIS\' ROOM', [['sleavis', 'My room. Heh heh. Don\'t go in there. I keep my... stuff... in there.']], [['slothhead', 'Uh huh huh. Last time I went in there, I lost a shoe. And some hope.']]);
  joke(2.2, -3.4, 'SLOTH-HEAD\'S ROOM', [['sleavis', 'It says "keep out Sleavis." Heh heh. That\'s like a personal invitation.'], ['slothhead', 'Get away from my room, dumbass.']], [['slothhead', 'My room. Uh huh huh. It\'s where I go to be awesome. Alone. With my posters.']]);
  joke(4.7, 2.0, 'ANSWERING MACHINE', [['sleavis', 'Heh heh. We got a message!'], ['phone', 'BEEP. "This is Slaria. You borrowed my calculator in ninth grade. I know you don\'t know what that is. I want it back." BEEP.'], ['sleavis', 'Heh heh. She wants us.']], [['slothhead', 'Uh huh huh. One message.'], ['phone', 'BEEP. "Hi, this is Dumpton Video. You owe us $640 for a copy of BUTT PATROL 2. It\'s been six years." BEEP.'], ['slothhead', 'Uh huh huh. Good movie.']]);
  joke(-1.0, -3.4, 'POSTER', [['sleavis', 'Death Clam. Heh heh. Best band EVER. They only know one song and it\'s about clams.']], [['slothhead', 'Bikini Truck Wash. Uh huh huh. I went to that. They wouldn\'t let me in. Twice.']]);
  return {
    couch: [-2.6, -1.0], sleavisSeat: [-2.6, -0.45], slothSeat: [-2.6, -1.55], door: [7.5, 1.5], tvProp
  };
};

// ---------------------------------------------------------------------- DUMPTON, OHIO (the street)
Areas.street = function (root, st, arg) {
  const dusk = arg && arg.dusk, blown = arg && arg.blown;
  R3.setSky(dusk ? '#e07050' : '#88b0e0', dusk ? '#c06050' : '#a0c0e0', 35, 110);
  R3.setLight(dusk ? { sky: '#ffb080', ground: '#504060', sun: '#ff9060', sunI: 1.6, sunPos: [-10, 5, -10] } : { sky: '#d8e8ff', ground: '#6a6040', sunI: 2.2 });
  Mk.plane(root, 160, 70, 'grass', 10, 0, -5, { tile: 4 });
  Mk.plane(root, 120, 7, 'roadx', 8, 0.03, 0, { tile: 7 });
  Mk.plane(root, 120, 2, 'concrete', 8, 0.06, -4.6, { tile: 2 });
  Mk.plane(root, 120, 2, 'concrete', 8, 0.06, 4.6, { tile: 2 });
  Stage.bounds(-42, 58, -22, 10);
  // their house
  Props.house(root, -35, -13, 0, { color: '#d8c860', roof: '#8a8070' });
  Mk.plane(root, 10, 7, 'deadgrass', -35, 0.045, -6, { tile: 3 });
  Props.couch(root, -38, -6.5, 0, { color: '#806040' });                  // a lawn couch. classy.
  const car = Props.car(root, -30, -7, 0.3, { color: '#7a5a3a', solid: true }); car.position.y = 0.25;
  for (const x of [-31.2, -28.8]) Mk.box(root, 0.5, 0.4, 0.5, 'concrete', x, 0, -7.3);
  signAt(root, 'BEWARE OF\nSLOTHS', -33, 1.1, -5.2, 0, { font: 'small', bg: '#f0f0d0', fg: '#a02020', post: '#6a4a2a' });
  Props.mailbox(root, -35, -5.2);
  // the neighbours
  const cols = ['#b8c8d8', '#d8b8b8', '#c8d8b0', '#e0d0b0'];
  [-22, -9, 4, 17].forEach((x, i) => {
    Props.house(root, x, -13, 0, { color: cols[i] });
    const mb = Props.mailbox(root, x + 2.5, -5.2);
    Props.breakable(mb, { w: 0.4, h: 1.3, d: 0.6, hp: 1, value: 150, colors: ['#3050a0', '#5a4030'], box: false, r: 0.4 });
    if (i % 2 === 0) gnome(root, x - 2, -6.5);
    trash(root, x + 3.6, -5.6);
    Props.tree(root, x + 5.5, -9);
  });
  Props.fence(root, 13, -6.5, 21, -6.5, { h: 1.4 });
  signAt(root, 'BEWARE OF DOG\n(HE IS NICE)\n(HE IS NOT)', 17, 1.0, -6.3, 0, { font: 'small', bg: '#f0f0e0', fg: '#202020' });
  // lemonade kid
  Mk.box(root, 1.2, 0.8, 0.6, 'planks', -3, 0, -6.2, { collide: true });
  signAt(root, 'LEMONADE 25C\n(IT\'S WARM)\n(DON\'T ASK)', -3, 1.4, -6.5, 0, { font: 'small', bg: '#fff8a0', fg: '#c04020' });
  // bus stop
  Mk.box(root, 2.4, 0.45, 0.6, 'planks', 8, 0, 5.6, { collide: true });
  Mk.box(root, 2.6, 0.08, 1.2, '#4a5a6a', 8, 2.4, 5.6);
  Mk.box(root, 0.1, 2.4, 0.1, '#4a5a6a', 6.8, 0, 5.1); Mk.box(root, 0.1, 2.4, 0.1, '#4a5a6a', 9.2, 0, 5.1);
  signAt(root, 'BUS STOP\nNEXT BUS: EVENTUALLY', 10, 2.1, 5.0, 0, { font: 'small', bg: '#2050a0', fg: '#ffffff', post: '#808080' });
  Props.billboard(root, 25, -18, { text: 'DUMPTON:\nWE\'RE STILL HERE', bg: '#e8e0c8', fg: '#2a4a8a' }, 0);
  // telephone poles along the road
  for (let x = -40; x < 60; x += 14) Props.pole(root, x, -4.2);
  // water tower in the distance
  if (!blown) Props.watertower(root, 30, -48);
  else { const g = Mk.group(root, 30, 0, -48); for (const a of [0, 1.57, 3.14, 4.71]) Mk.box(g, 0.25, 6 + Math.random() * 3, 0.25, '#4a4a4a', Math.cos(a) * 2, 0, Math.sin(a) * 2, { rz: Math.random() * 0.3 }); Mk.box(g, 5, 0.6, 4, '#3a3a3a', 0, 0, 0); }
  // GAS-N-GASP
  Props.building(root, 46, -12, 14, 9, 4, { tex: 'stucco', color: '#e8e0d0', sign: 'GAS-N-GASP', signO: { bg: '#e83030', fg: '#ffffff', border: '#ffe040', scale: 2 }, signH: 1.2, door: true, doorX: -3 });
  signAt(root, 'BEER\nBAIT\nBURRITOS\n(ONE OF THESE\nIS LIVE)', 52, 2.0, -7.4, 0, { font: 'small', bg: '#fff8c0', fg: '#202020' });
  Props.canopy(root, 46, 2, 12, 6);
  Props.gaspump(root, 43, 2, 0); Props.gaspump(root, 49, 2, 0);
  Props.neon(root, 54, 5.5, -8, 'GAS', { color: '#ff3030', scale: 3, width: 3 });
  Mk.box(root, 0.3, 5, 0.3, '#808080', 54, 0, -8.2);
  // the payphone
  Mk.box(root, 0.7, 2.0, 0.5, '#a0a0a0', 38, 0, -7.2, { collide: true });
  signAt(root, 'PHONE', 38, 2.1, -6.9, 0, { font: 'small', bg: '#2050a0', fg: '#ffffff' });
  Props.dumpster(root, 55, -6, 0);
  trash(root, 41, -6.5);
  // flavour
  joke(-3, -5.4, 'TALK TO LEMONADE KID', [['kid', 'Lemonade\'s a quarter. It\'s warm. Don\'t ask why it\'s warm.'], ['sleavis', 'Heh heh. Why is it warm?'], ['kid', 'I SAID DON\'T ASK.']], [['slothhead', 'Uh huh huh. Is this like, a business?'], ['kid', 'It\'s an enterprise. Mom says I\'m the man of the house now.'], ['slothhead', 'Uh huh huh. You\'re like eight.'], ['kid', 'And I already have a better job than you.']]);
  joke(17, -5.6, 'PET THE DOG', [['sleavis', 'Here doggy doggy. Heh heh.'], ['sign', '(The dog behind the fence says something in dog that is very, very rude.)'], ['sleavis', 'Heh heh. He likes me.']], [['slothhead', 'Uh huh huh. Nice doggy.'], ['sign', '(The dog looks at Sloth-Head. The dog sighs.)']]);
  joke(-38, -5.6, 'SIT ON LAWN COUCH', 'Heh heh. Outdoor couch. It\'s like being inside, but the bugs are bigger.', 'Uh huh huh. This couch has seen things. And then the things saw the couch.');
  joke(-30, -5.2, 'LOOK AT CAR', 'Heh heh. Our car. It runs great. It just doesn\'t move.', 'Uh huh huh. One day I\'m gonna fix it up and pick up chicks in it. Uh huh huh. It needs wheels.');
  const kid = Story.spawn('kid', -3, -6.9, 0, { id: 'kid' });
  return { start: [-35, -7], start2: [-34, -7.8], busStop: [8, 5.6], store: [43, -6.8], van: [38, 6], phone: [38, -6.4] };
};

// ---------------------------------------------------------------------- GAS-N-GASP (inside)
Areas.gasngasp = function (root, st) {
  R3.setSky('#101410', '#101410', 18, 40);
  R3.setLight({ sky: '#e0ffe8', ground: '#405040', hemi: 1.5, sunI: 0.9, sunPos: [0, 10, 5] });
  Props.room(root, 0, 0, 12, 9, 3.2, { floor: 'checker', wall: Mat.get('concrete', { color: '#d8e0c8' }) });
  Stage.bounds(-6, 6, -4.5, 4.6);
  // ceiling lights
  for (const x of [-3, 0, 3]) Mk.box(root, 1.6, 0.06, 0.4, new THREE.MeshBasicMaterial({ color: '#f0fff0' }), x, 3.1, -1);
  // counter + Tammy
  Props.counter(root, 3.6, 1.0, 3.4, 0, { color: '#c03030' });
  Mk.box(root, 2.2, 0.3, 0.6, '#808080', 3.6, 1.03, 1.0);
  for (let i = 0; i < 5; i++) Mk.cyl(root, 0.06, 0.06, 1.8, '#c06040', 2.8 + i * 0.4, 1.1, 1.0, { rz: Math.PI / 2, seg: 5 });  // the hot dog roller. eternal.
  signAt(root, 'HOT DOGS\n2 FOR $1\n(TODAY ONLY\nSINCE 1994)', 2.6, 1.9, 1.5, 0, { font: 'small', bg: '#fff0a0', fg: '#c02020' });
  Mk.box(root, 3.4, 2.0, 0.4, '#6a6a6a', 3.6, 0, -0.6);
  signAt(root, 'BATTERIES $4.99\nCIGARETTES\nLOTTO: YOU WON\'T', 3.6, 1.6, -0.38, 0, { font: 'small', bg: '#202020', fg: '#ffe040' });
  signAt(root, 'ADULT MAGAZINES\nBEHIND COUNTER\nASK TAMMY\n(DON\'T ASK TAMMY)', 5.6, 1.6, 0.6, -Math.PI / 2, { font: 'small', bg: '#202020', fg: '#ff60c0' });
  // shelves
  Props.shelf(root, -3.5, -0.5, 3.4, 0); Props.shelf(root, -3.5, 1.8, 3.4, 0, { cols: ['#c08030', '#e0e040', '#a04020', '#40a060'] });
  signAt(root, 'JERKY\nMEAT?', -1.6, 2.2, 1.8, Math.PI / 2, { font: 'small', bg: '#8a4020', fg: '#fff0c0' });
  // coolers along the back
  for (let i = 0; i < 4; i++) { Mk.box(root, 1.4, 2.4, 0.6, Mat.get('#80c0e0', { emissive: '#204050' }), -4.8 + i * 1.5, 0, -4.1, { collide: true }); }
  signAt(root, 'BEER   BEER   MORE BEER   "MILK"', -2.6, 2.6, -3.75, 0, { font: 'small', bg: '#202020', fg: '#80e0ff' });
  // slushie + Gaspy standee + ATM
  Mk.box(root, 1.0, 1.6, 0.6, Mat.get('#3050c0', { emissive: '#101840' }), 1.0, 0, -3.9, { collide: true });
  signAt(root, 'SLUSH-N-GASP\nBLUE: RASPBERRY?\nRED: UNKNOWN', 1.0, 2.0, -3.58, 0, { font: 'small', bg: '#e8e8ff', fg: '#3030a0' });
  const g = Mk.group(root, -5.2, 0, 3.2, 0.5);
  Mk.box(g, 0.9, 1.8, 0.05, Mat.get(Tex.make('gaspystand', 32, 64, (c) => { c.fillStyle = '#c02020'; c.fillRect(6, 10, 20, 36); c.fillStyle = '#fff'; c.fillRect(9, 16, 6, 6); c.fillRect(17, 16, 6, 6); c.fillStyle = '#000'; c.fillRect(11, 18, 2, 2); c.fillRect(19, 18, 2, 2); c.fillStyle = '#500'; c.fillRect(10, 30, 12, 4); c.fillStyle = '#c02020'; c.fillRect(10, 46, 4, 14); c.fillRect(18, 46, 4, 14); c.fillRect(2, 20, 4, 14); c.fillRect(26, 20, 4, 14); Font.draw(c, 'GASPY', 16, 2, '#ffe040', { face: 'small', align: 'center' }); }), { transparent: true, alphaTest: 0.5, double: true }), 0, 0, 0);
  Mk.box(root, 0.7, 1.6, 0.6, '#5a6a5a', 5.4, 0, -3.9, { collide: true });
  signAt(root, 'ATM\nOUT OF ORDER\n(FOREVER)', 5.4, 1.9, -3.58, 0, { font: 'small', bg: '#e0e0e0', fg: '#202020' });
  // flavour
  joke(-5.0, 3.0, 'GASPY STANDEE', 'Heh heh. Gaspy. When I was a kid I thought he was gonna eat me. Heh heh. I still think that.', 'Uh huh huh. He\'s a gas can with a face. That\'s like, wrong. Gas doesn\'t have feelings.');
  joke(1.0, -3.2, 'SLUSHIE MACHINE', [['sleavis', 'Heh heh. Blue or red?'], ['sleavis', 'Both! Mix it! It\'s PURPLE! Heh heh. I\'m a scientist!'], ['tammy', 'That\'s a dollar.'], ['sleavis', '...Heh heh. Never mind.']], 'Uh huh huh. Brain freeze. Not that you\'d notice, Sleavis.');
  joke(-2.6, -3.3, 'BEER COOLER', [['sleavis', 'Heh heh. BEER. Can we buy beer?'], ['tammy', 'ID.'], ['sleavis', 'Heh heh. I have a library card.'], ['tammy', 'You do NOT have a library card.'], ['sleavis', '...Heh heh. No.']], [['slothhead', 'Uh huh huh. Gimme a twelve-pack.'], ['tammy', 'You got thirty-two dollars?'], ['slothhead', 'Uh huh huh. I got three.'], ['tammy', 'Then you got nothing.']]);
  joke(5.4, -3.2, 'ATM', 'Heh heh. It says out of order. Like ME. Heh heh.', 'Uh huh huh. I\'m gonna put my card in. ...Uh huh huh. I don\'t have a card.');
  return { door: [-3, 4.0], counter: [3.6, 2.2], jerky: [-3.5, 2.8] };
};

// ---------------------------------------------------------------------- ROADSIDE at the edge of town (dusk)
Areas.roadside = function (root, st, arg) {
  R3.setSky('#c05a60', '#a05060', 40, 140);
  R3.setLight({ sky: '#ffa080', ground: '#403050', sun: '#ff8040', sunI: 1.6, sunPos: [-14, 4, -10], rimI: 1.4 });
  Mk.plane(root, 200, 120, 'deadgrass', 0, 0, -20, { tile: 4 });
  Mk.plane(root, 200, 7, 'roadx', 0, 0.03, 4, { tile: 7 });
  for (let x = -52; x < 60; x += 15) Props.pole(root, x, -0.5);
  Props.farm(root, -24, -30);
  for (let i = 0; i < 8; i++) Props.tree(root, LP.rand(-50, 50), LP.rand(-60, -25));
  if (!(arg && arg.noTower)) Props.watertower(root, -40, -70);
  signAt(root, 'NOW LEAVING DUMPTON\n"THANKS FOR NOTHING"', 10, 1.5, -1.2, 0, { font: 'big', bg: '#2a6a3a', fg: '#ffffff', post: '#808080' });
  Stage.bounds(-30, 30, -10, 8);
  return { van: [-6, 3.2] };
};

// ---------------------------------------------------------------------- THE PUMP & DUMP (chapter 2 gas station, a love letter to the title screen)
Areas.pumpstation = function (root, st) {
  R3.setSky('#5070c0', '#e09080', 50, 160);
  R3.setLight({ sky: '#ffc0a0', ground: '#806040', sun: '#ffb070', sunI: 2.0, sunPos: [-12, 6, -14], rimI: 1.3 });
  Mk.plane(root, 220, 140, 'sand', 0, 0, -30, { tile: 4 });
  Mk.plane(root, 220, 9, 'roadx', 0, 0.03, 10, { tile: 9 });
  Mk.plane(root, 30, 18, 'asphalt', 6, 0.036, -2, { tile: 3 });
  Stage.bounds(-20, 26, -14, 14);
  for (let i = 0; i < 6; i++) Props.mesa(root, -120 + i * 50, -110 - (i % 2) * 30);
  for (let i = 0; i < 14; i++) Props.cactus(root, LP.rand(-60, 60), LP.rand(-60, -16));
  // the store
  Props.building(root, 14, -10, 12, 7, 3.6, { tex: 'stucco', color: '#d8c8a8', sign: 'PUMP & DUMP', signO: { bg: '#202020', fg: '#ffe040', border: '#ff3030', scale: 2 }, signH: 1.1, doorX: -2 });
  Props.canopy(root, 2, -2, 10, 6, { stripe: '#e8a020' });
  Props.gaspump(root, -0.5, -2, 0); Props.gaspump(root, 4.5, -2, 0);
  // THE sign
  Mk.box(root, 0.4, 9, 0.4, '#606060', 20, 0, 2);
  const gas = Props.neon(root, 20, 9.5, 2, 'GAS', { color: '#ff3030', scale: 3, width: 3.6 });
  Mk.box(root, 2.6, 2.8, 0.2, '#202020', 20, 5.4, 2.1);
  signAt(root, 'BEER\nSNACKS\nPORN\nNEXT EXIT', 20, 6.8, 2.25, 0, { font: 'big', bg: '#f0f0e0', fg: '#202020', scale: 1 });
  // the vulture, keeping score
  const v = Mk.group(root, 20, 10.8, 2);
  Mk.ball(v, 0.35, '#2a2020', 0, 0.35, 0, { sy: 1.3 }); Mk.ball(v, 0.15, '#e0a0a0', 0, 0.9, 0.1); Mk.box(v, 0.1, 0.08, 0.2, '#e0c060', 0, 0.85, 0.28);
  Stage.tick((dt, t) => { v.rotation.y = Math.sin(t * 0.4) * 0.8; gas.visible = Math.sin(t * 13) > -0.92; });
  // flag, billboard, dead armadillo
  Mk.box(root, 0.12, 8, 0.12, '#c0c0c0', 9, 0, -14);
  Mk.box(root, 2, 1.2, 0.05, Mat.get('stripes'), 10, 6.6, -14);
  Mk.box(root, 0.8, 0.6, 0.06, Mat.get('stars'), 9.4, 7.2, -13.97);
  Props.billboard(root, -12, -12, { text: 'SEE\nAMERICA\nIT\'S MOSTLY EMPTY\nANYWAY!', bg: '#e8e0c8', fg: '#2a2a2a' }, 0.25);
  Props.armadillo(root, -6, 9.6);
  Mk.plane(root, 1.4, 0.8, Mat.get('#7a1010'), -6, 0.06, 9.8);
  // restroom shack
  Props.building(root, 24, -4, 4, 4, 2.8, { tex: 'concrete', color: '#c0b8a8', windows: false, sign: 'RESTROOMS\nKEY AT COUNTER', signO: { font: 'small', bg: '#ffffff', fg: '#202020' }, signH: 0.5 });
  Props.vending(root, 17, -5.8, 0, { color: '#2060c0', label: 'COLA?' });
  Props.solid(17, -5.8, 1.1, 2, 0.8);
  Props.dumpster(root, 25, -9, Math.PI / 2);
  joke(-12, -10.5, 'READ BILLBOARD', 'Heh heh. "It\'s mostly empty anyway." That\'s like... our motto.', 'Uh huh huh. See America. I\'m seeing it. It\'s brown.');
  joke(-6, 8.6, 'POKE ARMADILLO', 'Heh heh. Hey little guy. ...Little guy? ...Heh heh. He\'s sleeping. Forever.', 'Uh huh huh. Armadillo. Nature\'s speed bump.');
  joke(20, 3.4, 'LOOK UP AT SIGN', [['sleavis', 'Heh heh. "Beer. Snacks. Porn. Next exit." That\'s like... a poem.'], ['slothhead', 'Uh huh huh. It\'s the most beautiful thing I\'ve ever read.'], ['sign', '(The vulture on the sign makes eye contact. It is clearly waiting for one of you.)']], [['slothhead', 'Uh huh huh. There\'s a bird up there.'], ['sleavis', 'Heh heh. It\'s looking at us like we\'re lunch.'], ['slothhead', 'Uh huh huh. We ARE kind of lunch-shaped.']]);
  return { van: [-8, 3.5], pump: [2, -0.4], store: [12, -6] };
};

// ---------------------------------------------------------------------- THE NO-TELL MOTEL
Areas.motel = function (root, st) {
  R3.setSky('#0a0a1e', '#0a0a1e', 28, 70);
  R3.setLight({ sky: '#6070c0', ground: '#302030', hemi: 1.0, sun: '#a0b0ff', sunI: 0.8, sunPos: [-5, 12, 6], fillI: 0.3, rimI: 1.4 });
  Mk.plane(root, 120, 80, 'deadgrass', 0, 0, 0, { tile: 4 });
  Mk.plane(root, 50, 20, 'asphalt', 0, 0.03, 4, { tile: 3 });
  Mk.plane(root, 40, 3, 'concrete', -2, 0.06, -6.5, { tile: 2 });
  Stage.bounds(-24, 22, -8, 14);
  // the row of rooms
  Mk.box(root, 32, 3, 4, Mat.get('pinkstucco', { color: '#e0b0b0' }), -2, 0, -10, { collide: true });
  Mk.box(root, 33, 0.25, 6, '#5a3a3a', -2, 3, -9);
  for (let i = 0; i < 10; i++) {
    const x = -15.5 + i * 3;
    Mk.box(root, 1.0, 2.1, 0.06, i === 5 ? '#8a2020' : '#5a6a8a', x, 0, -7.98);
    signAt(root, String(i + 1), x, 2.3, -7.94, 0, { font: 'big', bg: '#e0e0d0', fg: '#202020' });
    Mk.box(root, 1.1, 0.9, 0.05, Mat.get('#ffd890', { emissive: i % 3 ? '#806030' : '#101010' }), x + 1.2, 1.1, -7.97);
  }
  // office + neon
  Props.building(root, -21, -6, 5, 7, 3.2, { tex: 'pinkstucco', color: '#e0b0b0', sign: null, door: true, doorX: 1.2 });
  const n1 = Props.neon(root, -21, 5.6, -2.3, 'NO-TELL MOTEL', { color: '#ff40a0', width: 5 });
  const n2 = Props.neon(root, -21, 4.5, -2.3, 'VACANCY', { color: '#40ff80', width: 2.6 });
  const n3 = Props.neon(root, -22.9, 4.5, -2.29, 'NO', { color: '#ff3030', width: 0.9 });
  Stage.tick((dt, t) => { n3.visible = Math.sin(t * 7) > 0.2; n1.visible = Math.sin(t * 23) > -0.95; });
  signAt(root, 'WE DON\'T ASK\nYOU DON\'T TELL\nCABLE TV*\n*SOME CABLE', -18.2, 1.6, -3.2, 0, { font: 'small', bg: '#f0e8d0', fg: '#802040' });
  // the pool: empty, with a shopping cart
  Mk.box(root, 9, 0.25, 5, 'tile', 0, 0, 2, { collide: false });
  Mk.box(root, 8.2, 0.3, 4.2, Mat.get('tile', { color: '#80a0b0' }), 0, -0.05, 2);
  for (const [x, z, w, d] of [[0, -0.6, 9, 0.3], [0, 4.6, 9, 0.3], [-4.6, 2, 0.3, 5], [4.6, 2, 0.3, 5]]) Mk.box(root, w, 0.5, d, 'concrete', x, 0, z, { collide: true });
  const cart = Mk.group(root, 1.5, 0.2, 2.5, 0.6); Mk.box(cart, 0.6, 0.5, 0.9, Mat.get('#b0b0b0', { transparent: true, opacity: 0.6 }), 0, 0.2, 0);
  signAt(root, 'POOL CLOSED\n(SINCE 1989)\nNO DIVING\nNO WATER', -4, 1.3, 4.9, 0, { font: 'small', bg: '#f0f0f0', fg: '#2050a0', post: '#808080' });
  // ice + vending
  Props.icemachine(root, 15.5, -7, 0);
  const vend = Props.vending(root, 17.2, -7, 0, { color: '#c02020', label: 'SNAX' });
  Props.solid(17.2, -7, 1.1, 2, 0.8);
  // lamps, bushes, cars
  for (const x of [-12, 0, 12]) Props.lamp(root, x, 9, { ry: Math.PI });
  for (const [x, z] of [[-9, -2], [6, -3], [12, 1], [-14, 6], [9, 7.5]]) Props.bush(root, x, z, 1.1);
  st.hides = [{ x: -9, z: -2, r: 1.1 }, { x: 6, z: -3, r: 1.1 }, { x: 12, z: 1, r: 1.1 }, { x: -14, z: 6, r: 1.1 }, { x: 9, z: 7.5, r: 1.1 }];
  Props.car(root, -8, 9, Math.PI / 2, { color: '#5a3a5a', solid: true });
  Props.car(root, 3, 10, Math.PI / 2 + 0.1, { color: '#3a5a3a', solid: true });
  for (let i = 0; i < 3; i++) trash(root, -16 + i * 14, -7.2);
  joke(15.5, -6.2, 'ICE MACHINE', 'Heh heh. "Out of order since \'91." That\'s older than my underwear. Heh heh. Almost.', 'Uh huh huh. I can hear something moving in there.');
  joke(0, 5, 'LOOK IN POOL', 'Heh heh. No water. Just a shopping cart and... is that a raccoon? Heh heh. He lives here.', 'Uh huh huh. Pool party. Bring your own water.');
  return { office: [-19.8, -2.2], room6: [-0.5, -6.2], van: [14, 9], vend };
};

Areas.motelRoom = function (root, st) {
  R3.setSky('#100a0a', '#100a0a', 14, 30);
  R3.setLight({ sky: '#ffd0a0', ground: '#402020', hemi: 1.1, sunI: 0.9, sunPos: [-3, 8, 6], fillI: 0.4 });
  Props.room(root, 0, 0, 9, 7, 2.8, { floor: 'carpet', wall: 'wallpaper' });
  Props.wall(root, 2.5, -3.5, 2.5, 0.5, 2.8, Mat.get('grosstile'));
  Mk.plane(root, 2, 4, 'grosstile', 3.5, 0.03, -1.5, { tile: 1 });
  Stage.bounds(-4.5, 4.5, -3.5, 3.6);
  Props.bed(root, -1.5, -1.6, 0, { color: '#c06070' });
  Mk.box(root, 0.5, 0.6, 0.5, '#5a3a20', -3.0, 0, -2.6, { collide: true });
  Mk.box(root, 0.3, 0.12, 0.2, '#e0e0d0', -3.0, 0.6, -2.6);
  Mk.box(root, 0.25, 0.3, 0.12, Mat.get(Tex.sign('SHAKE\nO\nMATIC', { bg: '#c0a020', fg: '#202020', font: 'small' })), -0.3, 0.2, -2.6);
  Mk.box(root, 1.6, 0.8, 0.5, '#5a3a20', 0.8, 0, 2.9, { collide: true });
  const tv = Props.tv(root, 0.8, 2.9, Math.PI, { y: 0.8 });
  signAt(root, 'SAD\nCLOWN', -1.5, 1.9, -3.38, 0.08, { font: 'big', bg: '#304060', fg: '#e0e0ff' });
  Mk.box(root, 0.8, 0.5, 0.4, '#a0a0a0', -4.2, 1.6, 1.5, { collide: false });
  // the bathroom
  Props.toilet(root, 3.6, -3.0, 0, { gross: true });
  Props.sink(root, 3.9, -0.4, -Math.PI / 2);
  signAt(root, 'PLEASE DO NOT\nFLUSH: FISH,\nCHICKENS, OR\nEVIDENCE', 3.5, 1.8, -3.38, 0, { font: 'small', bg: '#f0f0e0', fg: '#202020' });
  joke(-1.5, -3.0, 'LOOK AT PAINTING', 'Heh heh. Sad clown. He looks like he\'s been in this room too long.', 'Uh huh huh. I bet he\'s sad \'cause he\'s in Missouri.');
  joke(-4.0, 1.5, 'AIR CONDITIONER', 'Heh heh. It\'s making a noise like Slutt-Head after chili.', 'Uh huh huh. It\'s blowing hot air. And something hairy.');
  return { bed: [-1.5, -1.6], toilet: [3.6, -2.0], tv: [0.8, 2.4], door: [0, 3.0], tvMesh: tv };
};

// ---------------------------------------------------------------------- BIG EARL'S FUEL & FAJITAS (inside)
Areas.truckstop = function (root, st) {
  R3.setSky('#140e08', '#140e08', 20, 45);
  R3.setLight({ sky: '#ffe8c0', ground: '#503820', hemi: 1.4, sunI: 1.1, sunPos: [3, 10, 6], fillI: 0.4 });
  Props.room(root, 0, 0, 22, 10, 3.2, { floor: 'linoleum', wall: 'paneling' });
  Stage.bounds(-11, 11, -5, 5.2);
  for (let x = -9; x <= 9; x += 4.5) Mk.box(root, 1.6, 0.06, 0.4, new THREE.MeshBasicMaterial({ color: '#fff4d0' }), x, 3.1, 0);
  // diner counter + stools
  Props.counter(root, -2, -2.6, 8, 0, { color: '#c0a070', top: '#d02020' });
  for (let i = 0; i < 7; i++) Props.stool(root, -5.4 + i * 1.1, -1.6);
  Mk.box(root, 8, 2.2, 0.3, Mat.get(Tex.sign('MENU: CHILI  CHILI DOG  CHILI FRIES  CHILI SURPRISE (IT\'S CHILI)  FAJITAS (FRIDAY)  COFFEE (ALWAYS)', { bg: '#202020', fg: '#ffe040', font: 'small', w: 256, h: 24 })), -2, 2.2, -4.8);
  // booths
  for (const x of [5, 8.4]) Props.booth(root, x, -3.4, Math.PI / 2);
  // register + Doug
  Props.counter(root, -8.5, 2.6, 2.4, Math.PI / 2, { color: '#a08060' });
  Mk.box(root, 0.5, 0.35, 0.4, '#3a3a3a', -8.5, 1.05, 2.6);
  // arcade corner
  Props.arcade(root, 9.8, 1.2, -Math.PI / 2, { title: 'SLOTH\nINVADERS\n2000' });
  Props.arcade(root, 9.8, 2.6, -Math.PI / 2, { color: '#6a2020', title: 'CLAW OF\nREGRET' });
  Props.jukebox(root, 9.6, -1.0, -Math.PI / 2);
  // contest table
  Props.table(root, 1.5, 1.6, { w: 2.2, d: 1.0, top: '#e0d0b0' });
  signAt(root, 'BURN WARD\nCHILI CHALLENGE\nWIN $50\nSIGN WAIVER\nBRING TOWEL', 3.4, 2.4, -4.85, 0, { font: 'small', bg: '#ff6020', fg: '#ffffff' });
  // restroom hall w/ graffiti
  Mk.box(root, 0.1, 2.2, 1.2, '#5a3a2a', -10.95, 0, -1.0);
  signAt(root, 'RESTROOMS ->\nSHOWERS $8\nTOWEL EXTRA\nDIGNITY NOT\nINCLUDED', -10.9, 1.7, 0.6, Math.PI / 2, { font: 'small', bg: '#e8e8d8', fg: '#202020' });
  signAt(root, 'NO SLOTHS\nNO SHIRTS\nNO SERVICE', -6, 2.3, 4.95, Math.PI, { font: 'small', bg: '#f0f0e0', fg: '#a02020' });
  joke(9.4, -1.0, 'JUKEBOX', [['sleavis', 'Heh heh. Let\'s play something that rocks.'], ['sign', '(The jukebox only has one song: "MY TRUCK LEFT ME FOR ANOTHER TRUCK" by Cledus T. Wheeler. It plays.)'], ['slothhead', 'Uh huh huh. This song sucks.'], ['sleavis', 'Heh heh. ...It\'s kinda sad though.']], [['slothhead', 'Uh huh huh. I\'m gonna play some metal.'], ['sign', '(It plays "MY TRUCK LEFT ME FOR ANOTHER TRUCK." Again.)'], ['slothhead', 'Dammit.']]);
  joke(9.4, 2.6, 'CLAW OF REGRET', [['sleavis', 'Heh heh. There\'s a stuffed sloth in there. It looks like you, Slutt-Head.'], ['slothhead', 'It looks like YOU, dumbass. It\'s got the stupid face.'], ['sleavis', 'Heh heh. That\'s just its normal face.']], 'Uh huh huh. I\'m gonna win a prize for my lady. ...If I had a lady. Uh huh huh. I will after Lost Wages.');
  joke(-10.4, -1.0, 'RESTROOM WALL', function* (S) {
    yield* S.say('sleavis', 'Heh heh. The bathroom wall. It\'s like a library for butts.');
    yield* S.say('sign', 'IT SAYS: "FOR A GOOD TIME CALL DOUG" / "EARL WAS HERE 1979-PRESENT" / "THE CHILI IS A WAR CRIME" / "WHY ARE YOU READING THIS. POOP."');
    const i = yield* S.choose('sleavis', ['Write: "SLEAVIS RULES"', 'Write: "SLOTH-HEAD IS A BUTT-MUNCH"', 'Write: "SLUTT-HEAD WAS HERE"', 'Draw a "boob" (it looks like an owl)']);
    if (i === 0) yield* S.say('sleavis', 'Heh heh. Now everybody who poops here will know. Immortality.');
    if (i === 1) yield* S.lines([['slothhead', 'I saw that, dumbass.'], ['sleavis', 'Heh heh. It\'s art. You can\'t argue with art.']]);
    if (i === 2) yield* S.lines([['slothhead', 'Sleavis. Cross that out.'], ['sleavis', 'Heh heh. It\'s in Sharpie. It\'s FOREVER, Slutt-Head.']]);
    if (i === 3) yield* S.lines([['sleavis', 'Heh heh. Boobs.'], ['slothhead', 'That\'s an owl.'], ['sleavis', '...Heh heh. Owl boobs.']]);
  });
  return { door: [-6, 4.6], earl: [6.7, -3.4], counter: [-2, -1.5], register: [-8.5, 2.6], arcade: [9.0, 1.2], contest: [1.5, 2.6] };
};

// the truck stop parking lot + the road (hitchhiking)
Areas.truckLot = function (root, st) {
  R3.setSky('#e0a070', '#c09070', 45, 150);
  R3.setLight({ sky: '#ffd0a0', ground: '#806040', sun: '#ffc080', sunI: 2, sunPos: [10, 8, -10] });
  Mk.plane(root, 200, 120, 'dirt', 0, 0, -20, { tile: 4 });
  Mk.plane(root, 9, 200, 'road', 7, 0.03, -20, { tile: 9 });
  Mk.plane(root, 30, 22, 'asphalt', -12, 0.036, -16, { tile: 3 });
  Stage.bounds(-30, 11, -26, 12);
  Props.building(root, -10, -24, 26, 8, 4, { tex: 'planks', color: '#c09060', sign: 'BIG EARL\'S FUEL & FAJITAS', signO: { bg: '#e8e0c0', fg: '#a02020', border: '#a02020', scale: 2 }, signH: 1.3 });
  Props.semi(root, -12, -14, Math.PI / 2, { solid: true });
  Props.semi(root, -18, -6, Math.PI / 2, { solid: true, color: '#3050a0' });
  Props.billboard(root, -22, -6, { text: 'CHILI SO HOT\nIT\'S A\nLEGAL MATTER', bg: '#ff6020', fg: '#ffffff' }, 0.3);
  for (let i = 0; i < 6; i++) Props.cactus(root, LP.rand(14, 40), LP.rand(-40, 30));
  Mk.plane(root, 2, 3, Mat.get('mud', { color: '#4a3a2a' }), 3.4, 0.06, 2);
  return { stand: [1.6, 2], road: [7, 0] };
};
