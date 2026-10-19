/* CHAPTERS (3/3): 7 AREA 69, 8 MEGA-MALL, 9 SLOTHSTOCK '99, 10 LOST WAGES, 11 THE HOOVER DAMN */
'use strict';
// an NPC who fights on YOUR side (Chuck Thunder, bikers in the finale)
Actor.AI.ally = function (a, dt) {
  let foe = null, fd = 1e9;
  for (const o of Stage.cur.actors) if (o.team === 'enemy' && o.alive && o.vis.root.visible) { const d = a.distTo(o); if (d < fd) { fd = d; foe = o; } }
  a.mv = [0, 0];
  if (!foe) { const L = Game.leaderActor(); if (L && a.distTo(L) > 3) { const d = a.distTo(L); a.mv = [(L.x - a.x) / d * 0.7, (L.z - a.z) / d * 0.7]; } return; }
  if (fd > 1.1) a.mv = [(foe.x - a.x) / fd * 0.8, (foe.z - a.z) / fd * 0.8];
  else { a.lookAt(foe); if (a.cd <= 0 && LP.chance(dt * 2)) { a.attack(); a.cd = 0.7; } }
};
// crummy low-poly sunglasses on the beautiful hi-res faces. on purpose.
function giveShades() {
  for (const id of ['sleavis', 'slothhead']) {
    const h = Heroes[id]; if (h.shades) continue;
    const g = new THREE.Group();
    Mk.box(g, 0.24, 0.06, 0.03, '#0a0a0a', 0, 0, 0); Mk.box(g, 0.1, 0.05, 0.02, '#4040a0', -0.06, 0.005, 0.012); Mk.box(g, 0.1, 0.05, 0.02, '#4040a0', 0.06, 0.005, 0.012);
    g.position.set(0, 0.29, id === 'sleavis' ? 0.155 : 0.15);
    h.bones.head.add(g);
    h.shades = g;
  }
}
// fireworks over the water
function fireworks(n, center) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const c = LP.pick([['#ff3030', '#ffffff'], ['#3060ff', '#ffffff'], ['#ffe040', '#ff8020'], ['#ff40c0', '#40ffc0']]);
    const p = new THREE.Vector3(center.x + LP.rand(-30, 30), center.y + LP.rand(18, 34), center.z + LP.rand(-10, 10));
    FX3.burst(p, 26, { colors: c, speed: 9, up: 2, grav: 4, life: 1.6, size: 0.35, floor: -50 });
    GameAudio.sfx(LP.chance(0.5) ? 'boom' : 'bigboom');
  }, i * 240 + Math.random() * 200);
}

// ======================================================================= CHAPTER 7
CHAPTERS.push({ title: 'AREA 69', segs: [
  // 7-1 Wade's plan. Sneaking in.
  function* (S) {
    const A = yield* S.load(Areas.base);
    S.music('base');
    Game.spawnHeroes([A.start[0] + 1, A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    const wade = S.spawn('wade', A.start[0] - 2.5, A.start[1] + 0.5, Math.PI * 0.8, { id: 'wade' });
    if (!S.tries) {
      yield* S.card('CHAPTER 7', 'AREA 69', 'NEVADA. 1:00 AM. A BASE THAT DOES NOT EXIST, GUARDED BY MEN WHO ALSO DO NOT EXIST.');
      S.shot([A.start[0] + 2, 1.8, A.start[1] + 4.5], [A.start[0] - 0.8, 1.2, A.start[1]], 0);
      yield* S.lines([
        say('wade', 'Thank you for coming, gentlemen. Whistleblower to whistleblower.'),
        say('sleavis', 'Heh heh. We\'re here for the snacks.'),
        say('wade', 'Yes. The snacks. Inside Hangar 18 is a vending machine stocked with snacks the public will NEVER taste. Doritos flavors from the FUTURE.'),
        say('sleavis', 'Heh heh. Cool Ranch... TWO.'),
        say('slothhead', 'Uh huh huh. And alien chicks?'),
        say('wade', '...Sure. Yes. Alien chicks. Green ones. With extra... everything.'),
        say('slothhead', 'Uh huh huh. Area sixty-nine.'),
        say('sleavis', 'Heh heh. SIXTY-NINE.'),
        say('wade', 'I cut a hole in the fence. The MPs can\'t see you if you hide behind crates or stand still in bushes. I\'ll wait here. In case it\'s a trap. Which it is. Everything is.')
      ]);
      S.free();
    }
    const mk = (x, z, path, range) => { const g = S.spawn('guard', x, z, 0, { id: 'mp' + x }); g.path = path; g.speed = 2.3; g.range = range || 7; g.fov = 1.25; g.lookAround = true; return g; };
    const g1 = mk(-6, 12, [[-14, 12, 1.5], [6, 12, 1.5]], 7);
    const g2 = mk(6, 2, [[10, 3, 2, Math.PI], [-8, 3, 1.4], [-8, -6, 1.6], [10, -6, 1.6]], 7.5);
    const g3 = mk(-4, -15, [[-12, -15, 2], [10, -15, 2], [10, -19, 1]], 6.5);
    S.objective('SNEAK TO THE HANGAR DOOR — HIDE BEHIND CRATES OR STAND STILL IN BUSHES');
    yield* S.play('action', {
      yaw: 0, dist: 7, height: 11, combat: false, special: false, sneak: true, guards: [g1, g2, g3],
      bustedMsg: LP.pick(['BUSTED by an M.P. who said, verbatim: "Are those... Ewoks?"', 'Spotted. Sleavis waved at the guard. The guard waved back. Then the guard tased him.', 'Caught! The M.P. radioed in: "Two large hamsters at the fence. Requesting... I don\'t know. Advice?"']),
      goal: () => { const L = Game.leaderActor(); return Math.hypot(L.x - A.door[0], L.z - A.door[1]) < 2; }
    });
  },

  // 7-2 inside Hangar 18
  function* (S) {
    const A = yield* S.load(Areas.lab);
    S.music('base');
    Game.spawnHeroes([A.door[0], A.door[1] - 0.5, Math.PI], [A.door[0] - 1.2, A.door[1] - 0.4, Math.PI]);
    const sci = S.spawn('scientist', -3, -2, Math.PI / 2, { id: 'scientist' });
    const sci2 = S.spawn('scientist', 6, 0, -Math.PI / 2, { id: 'scientist2' });
    S.mode('action', { yaw: 0, dist: 7, height: 4.6 });
    if (!S.tries) yield* S.lines([
      say('scientist', 'Ah! There you are! The volunteers for the caffeine tolerance study!'),
      say('sleavis', 'Heh heh. We\'re volunteers?'),
      say('scientist', 'The two-man sloth-suit cohort, yes! Very good. Very authentic. The cola is on the table. Drink as much as you can. For science.'),
      say('slothhead', 'Uh huh huh. Science.')
    ]);
    S.objective('FIND THE GOVERNMENT VENDING MACHINE');
    let cola = false, files = false, snacks = false;
    Stage.hot({ x: A.cola[0], z: A.cola[1], r: 1.5, label: 'DRINK ULTRA-COLA', cond: () => !cola, act: function* (S, h, L) {
      cola = true;
      if (L.id !== 'sleavis') yield* S.lines([say('slothhead', 'Uh huh huh. You drink it, Sleavis. You\'re like, already broken.')]);
      S.anim('sleavis', 'eat'); S.sfx('slurp'); yield* S.wait(1); S.sfx('burp'); S.anim('sleavis', null);
      Game.freak = 100;
      yield* S.lines([say('scientist', 'Fascinating! His pupils are different sizes! Now they\'re SPINNING!'), say('sleavis', 'Heh heh. I can taste colors. Blue tastes like... BLUE.'), say('sleavis', 'Heh heh heh. I feel like I could fight God.')]);
      S.toast('SLEAVIS\' FREAK METER IS FULL! PRESS {special} AS SLEAVIS TO GO SLOTHZILLA', '#ff80ff');
    } });
    Stage.hot({ x: A.files[0], z: A.files[1], r: 1.5, label: 'READ TOP SECRET FILES', cond: () => !files, act: function* (S, h, L) {
      files = true;
      yield* S.lines([
        say(L.id, L.id === 'sleavis' ? 'Heh heh. Files. Read it to me, Slutt-Head. The words are too wordy.' : 'Uh huh huh. Top secret. Uh huh huh. Lemme read it.'),
        say('sign', '"PROJECT P.A.T.R.I.O.T. — CONTRACTOR: FONTAINE FREEDOM SYSTEMS (CONTRACT TERMINATED). UPLINK DEVICE STOLEN. PRIME SUSPECT: DEKE FONTAINE. THREAT LEVEL: EXTREMELY BAD."'),
        say('slothhead', 'Uh huh huh. Fontaine. That\'s the guy who\'s gonna give us chicks.'),
        say('sleavis', 'Heh heh. He\'s in a FILE. He\'s famous.'),
        say('slothhead', 'Uh huh huh. "Threat level extremely bad." That means he\'s like, a total badass.'),
        say('sleavis', 'Heh heh. We\'re gonna party with a badass.')
      ]);
    } });
    Stage.hot({ x: A.vend[0], z: A.vend[1], r: 1.5, label: 'SHAKE GOVERNMENT VENDING MACHINE', who: 'sleavis', cond: () => !snacks, act: function* (S) {
      yield* S.say('sleavis', 'Heh heh. GOVERNMENT SNACKS. It takes "classified" quarters. Heh heh. I\'ll just shake it.');
      S.sit('sleavis', A.vend[0], A.vend[1] + 0.4, Math.PI, 0, 'mash');
      S.shot([A.vend[0] + 2.5, 2, A.vend[1] + 3.6], [A.vend[0], 1.2, A.vend[1] - 0.6], 0.4);
      const r = yield* S.minigame('vending', { who: 'sleavis', soft: true, mesh: A.vendMesh });
      S.stand('sleavis', A.vend[0] - 0.4, A.vend[1] + 1.2);
      S.free();
      if (r && r.fail) { yield* S.say('sleavis', 'Heh heh. Ow. It fought back. AGAIN!'); return; }
      snacks = true;
      yield* S.lines([say('sign', '(Out drops a bag: "CLASSIFIED CHEESE PUFFS — FLAVOR: [REDACTED].")'), say('sleavis', 'Heh heh. It tastes like... cheese and FREEDOM.'), say('slothhead', 'Uh huh huh. It tastes like feet.'), say('sleavis', 'Heh heh. FREEDOM feet.')]);
    } });
    yield* S.until(() => snacks);
    Modes.stop();
    // the feds
    S.sfx('alert'); S.sfx('siren');
    const st = S.spawn('strunk', A.door[0], A.door[1] - 0.2, Math.PI, { id: 'strunk' });
    const pip = S.spawn('pip', A.door[0] + 1.2, A.door[1] - 0.1, Math.PI, { id: 'pip' });
    S.shot([A.door[0] - 3, 2, A.door[1] - 5], [A.door[0], 1.3, A.door[1]], 0.4);
    yield* S.lines([
      say('strunk', 'FREEZE! Department of Homeland Insecurity! Put down the uplink!'),
      say('sleavis', 'Heh heh. It\'s a chick. A chick cop. Heh heh. Hey baby.'),
      say('strunk', 'Agent Strunk. And you two are under arrest for theft of a federal orbital weapon, destruction of a water tower, a gas station, a petrified forest, and a sixty-foot corn dog.'),
      say('slothhead', 'Uh huh huh. We didn\'t do any of that. The remote did.'),
      say('pip', 'Ma\'am, I think he\'s confessing?'),
      say('strunk', 'Pip. Cuff them.'),
      say('pip', 'Ma\'am, I left the cuffs in the corn dog.'),
      say('slothhead', 'Uh huh huh. Bye.')
    ]);
    S.sfx('click');
    FX3.laser(1, -2, null, { delay: 0.5, size: 3 });
    yield* S.wait(1.1);
    Game.damage(1500000, new THREE.Vector3(1, 3, -2));
    yield* S.wait(0.6);
    yield* S.lines([say('sleavis', 'Heh heh heh! RUN!')]);
  },

  // 7-3 the escape
  function* (S) {
    yield* S.load(Areas.empty, { sky: '#05060e', fog: '#0a0c18', near: 25, far: 90, light: { sky: '#4050a0', ground: '#201810', sun: '#a0b0ff', sunI: 0.9, sunPos: [-6, 12, -6], rimI: 1.5 } });
    Game.spawnHeroes(null, null, 'both');
    S.music('boss');
    if (!S.tries) S.toast('THEY\'RE RIGHT BEHIND YOU! LEFT/RIGHT: DODGE   {jump}: JUMP   DOWN: SLIDE', '#ffe040');
    yield* S.play('runner', {
      theme: 'base', length: 900, speed: 9, pursuers: ['guard', 'strunk', 'pip', 'guard'], destination: 'THE HOLE IN THE FENCE',
      events: [{ at: 60, bark: ['sleavis', 'Heh heh heh! They\'re CHASING us! We\'re like, important!'] }, { at: 300, bark: ['slothhead', 'Uh huh huh. Jump over stuff, dumbass!'] }, { at: 600, bark: ['strunk', 'STOP IN THE NAME OF... HOMELAND... SECURITY!'] }, { at: 800, bark: ['sleavis', 'Heh heh! I see the van! And Wade! Wade\'s waving!'] }],
      caughtMsg: 'Tackled by Agent Pip. He apologized the whole time. Then he sat on you. Then he apologized again.'
    });
    yield* S.load(Areas.base);
    Game.spawnHeroes(null, null, 'both');
    for (const h of Game.heroActors()) { h.vis.show(false); h.gone = true; }
    S.spawn('strunk', 0, 16, Math.PI, { id: 'strunk' }); S.spawn('pip', 1.2, 16.5, Math.PI, { id: 'pip' });
    S.shot([3, 2, 13], [0, 1.4, 17], 0);
    S.music('base');
    yield* S.lines([
      say('pip', 'Ma\'am... they got away. In a van with no roof. With a man in a tinfoil hat honking at us.'),
      say('strunk', 'They\'re good, Pip. They\'re very good. They act so stupid that you can\'t predict them.'),
      say('pip', 'Or... they\'re just stupid?'),
      say('strunk', 'Nobody is that stupid, Pip. Nobody.'),
      say('pip', 'The kid at the corn dog said—'),
      say('strunk', 'DON\'T bring up the kid, Pip.')
    ]);
  }
] });

// ======================================================================= CHAPTER 8
CHAPTERS.push({ title: 'MEGA-MALL OF THE SOUTHWEST', segs: [
  // 8-1 the mall
  function* (S) {
    const A = yield* S.load(Areas.mall);
    S.music('mall');
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI / 2], [A.start2[0], A.start2[1], Math.PI / 2]);
    const chuck = S.spawn('chuck', A.chuck[0], A.chuck[1] - 1.0, 0, { id: 'chuck' });
    const sl = S.spawn('slaria', A.pages[0] - 0.8, A.pages[1] + 0.6, 0.3, { id: 'slaria' });
    sl.idleAnim = 'idle';
    for (let i = 0; i < 5; i++) { const t = S.spawn(LP.pick(['tourist', 'granny', 'kid', 'clerk']), LP.rand(-15, 15), LP.rand(-6, 6), LP.rand(0, 6), { id: 'shopper' + i }); t.ai = Actor.AI.wander; }
    S.spawn('mallcop', 10, 6, -Math.PI / 2, { id: 'mallcop' });
    if (!S.tries) yield* S.card('CHAPTER 8', 'MEGA-MALL OF THE SOUTHWEST', 'ARIZONA. 400 STORES. 3 OPEN. 1 FOUNTAIN. 0 HOPE.');
    S.mode('action', { yaw: 0, dist: 8, height: 4.8 });
    if (!S.tries) yield* S.lines([say('slothhead', 'Uh huh huh. Before we score, we gotta look cool. We got fifty-three bucks.'), say('sleavis', 'Heh heh. Let\'s buy sunglasses. Chicks dig sunglasses.'), say('slothhead', 'Uh huh huh. Yeah. Then they can\'t see your eyes. Your eyes are stupid.')]);
    S.objective('BUY SOMETHING COOL (SUNGLASS SHACK)');
    let shades = false, chuckDone = false, slariaDone = false;
    Stage.hot({ x: 4.5, z: -11.6, r: 1.8, label: 'SUNGLASS SHACK', cond: () => !shades, act: function* (S, h, L) {
      shades = true;
      S.shot([4.5, 2, -6.5], [4.5, 1.4, -11], 0.4);
      yield* S.lines([say('clerk', 'Welcome to Sunglass Shack. Everything is twenty-six fifty. That\'s the joke. The prices are shady.'), say('slothhead', 'Uh huh huh. Two pairs.'), say('clerk', 'That\'s fifty-three dollars.'), say('slothhead', 'Uh huh huh. That\'s all our money. ...Worth it.')]);
      giveShades();
      Game.money = 0.17;
      S.sfx('cash');
      yield* twoShot(S, { face: 0, dist: 3, side: 0.4 });
      yield* S.lines([say('sleavis', 'Heh heh. We look AWESOME.'), say('slothhead', 'Uh huh huh. We look like secret agents.'), say('sleavis', 'Heh heh. Secret agents in sloth suits.'), say('slothhead', 'Uh huh huh. The best kind.')]);
      S.free();
      S.objective('LOOK COOL AROUND THE MALL. (CHUCK THUNDER IS SIGNING AUTOGRAPHS!)');
    } });
    Stage.hot({ x: A.chuck[0], z: A.chuck[1] + 1.2, r: 1.8, label: 'TALK TO CHUCK THUNDER', cond: () => !chuckDone, act: function* (S, h, L) {
      chuckDone = true;
      S.shot([A.chuck[0] + 3, 1.8, A.chuck[1] + 5], [A.chuck[0], 1.3, A.chuck[1]], 0.4);
      yield* S.lines([
        say('chuck', 'Chuck Thunder. Star of Punch Fist one, two and three. Autographs forty bucks.'),
        say('sleavis', 'Heh heh. Can you sign my butt?'),
        say('chuck', 'That\'s fifty.'),
        say('slothhead', 'Uh huh huh. Can you punch Sleavis? Like in Punch Fist 2? When you punched that guy through a helicopter?'),
        say('chuck', 'That one\'s free.')
      ]);
      const s = Game.hero('sleavis');
      S.anim('chuck', 'punch'); S.sfx('bigpunch'); Game.shake(0.3, 0.4);
      s.knock = [0, 9]; s.vy = 5; s.pose('ko');
      yield* S.wait(1.4);
      Game.damage(340, new THREE.Vector3(s.x, 1, s.z));
      yield* S.lines([say('sleavis', '(ON THE FLOOR) Heh heh... that was... the best day of my life.'), say('chuck', 'Kid, you took that like a champ. A really stupid champ.'), say('chuck', 'I\'m headlining Slothstock tomorrow night. Reunion tour. Thunder and the Lightning Bolts. Come by. Bring... less of this.')]);
      s.pose(null);
      S.free();
    } });
    Stage.hot({ x: A.pages[0], z: A.pages[1] + 1.6, r: 2, label: 'ENTER "PAGES (NOBODY COMES HERE)"', cond: () => !slariaDone, act: function* (S) {
      slariaDone = true;
      S.shot([A.pages[0] + 2.5, 1.8, A.pages[1] + 5], [A.pages[0] - 0.6, 1.3, A.pages[1] + 0.6], 0.4);
      yield* S.lines([
        say('slaria', 'My parents are at a timeshare presentation. I\'m hiding in the only store in America you two would never enter.'),
        say('sleavis', 'Heh heh. We entered.'),
        say('slaria', 'Naturally.'),
        say('slothhead', 'Uh huh huh. Got any books with boobs in \'em?'),
        say('slaria', 'Art history. Aisle three. You\'ll be disappointed by the context.'),
        say('slaria', 'Nice sunglasses. You look like two hamsters who joined a witness protection program.'),
        say('sleavis', 'Heh heh. She noticed our sunglasses. She\'s into us.'),
        say('slaria', 'A woman with a federal badge asked me about you at the corn dog. And at a gas station. And in the parking lot ten minutes ago.'),
        say('slothhead', 'Uh huh huh. She\'s into us too.'),
        say('slaria', 'Everyone who is "into you" is holding handcuffs.'),
        say('slothhead', 'Uh huh huh. Kinky.'),
        say('slaria', 'I\'m going back to the timeshare presentation. It\'s less painful.')
      ]);
      S.free();
    } });
    yield* S.until(() => shades && (chuckDone || slariaDone));
    yield* S.wait(1.5, { free: true });
    Modes.stop();
    const lyle = S.spawn('lyle', -20, 7, Math.PI / 2, { id: 'lyle' });
    const mc = S.spawn('mallcop', -18.8, 6, Math.PI / 2, { id: 'mallcop2' });
    S.shot([-14, 2.2, 8.5], [-19.5, 1.3, 6.5], 0.5);
    yield* S.lines([
      say('lyle', 'THERE they are, officer! The shoplifters! In the suits!'),
      say('mallcop', 'Freeze, sloths! You\'re under mall arrest!'),
      say('slothhead', 'Uh huh huh. We PAID for these, butt-munch.'),
      say('mallcop', 'Then why are you running?'),
      say('sleavis', 'Heh heh. We\'re not running.'),
      say('sleavis', '...'),
      say('sleavis', 'Heh heh. NOW we\'re running.')
    ]);
  },

  // 8-2 mall cop chase
  function* (S) {
    yield* S.load(Areas.empty, { sky: '#d8d0e0', fog: '#d8d0e0', near: 30, far: 90, light: { sky: '#fff8f0', ground: '#806870', hemi: 1.5, sunI: 1.3, sunPos: [0, 14, 6] } });
    Game.spawnHeroes(null, null, 'both');
    S.music('drive');
    yield* S.play('runner', {
      theme: 'mall', length: 1000, speed: 8.8, pursuers: ['mallcop', 'lyle', 'mallcop', 'dwayne'], destination: 'THE FOOD COURT',
      events: [{ at: 50, bark: ['mallcop', 'STOP! I HAVE A WHISTLE AND I AM NOT AFRAID TO BLOW IT!'] }, { at: 350, bark: ['sleavis', 'Heh heh. He said blow it.'] }, { at: 600, bark: ['slothhead', 'Uh huh huh. Head for the food court! There\'s weapons there! Like corn dogs!'] }],
      caughtMsg: 'The mall cop caught you. He made you sit in the mall jail (the photo booth) until your parents came. Your parents never came.'
    });
  },

  // 8-3 food court showdown, with special guest Chuck Thunder
  function* (S) {
    const A = yield* S.load(Areas.mall);
    S.music('brawl');
    Game.spawnHeroes([A.food[0] - 4, A.food[1], Math.PI / 2], [A.food[0] - 5, A.food[1] + 1.4, Math.PI / 2]);
    Game.healHeroes();
    const m = S.mode('action', { yaw: 0, dist: 8, height: 5, combat: true });
    goon(S, 'mallcop', A.food[0] + 3, A.food[1] - 3, { hp: 4 });
    goon(S, 'mallcop', A.food[0] + 5, A.food[1] + 2, { hp: 4, missile: 'tomato', ai: Actor.AI.thrower });
    goon(S, 'lyle', A.food[0] + 7, A.food[1], { id: 'lyle', hp: 9, dmg: 1.3 });
    yield* S.until(() => Modes.enemiesLeft() <= 1 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    const chuck = S.spawn('chuck', -10, 4, Math.PI / 2, { id: 'chuck', team: 'hero', hp: 99, dmg: 2.5, speed: 3.6, ai: Actor.AI.ally });
    chuck.invincible = true; chuck.knockPow = 9;
    HUD.bark('chuck', 'THIS is for cancelling Punch Fist 4!');
    HUD.toast('CHUCK THUNDER HAS JOINED THE FIGHT!', '#ffe040');
    goon(S, 'dwayne', A.food[0] + 9, A.food[1] - 2, { id: 'dwayne', hp: 16, dmg: 1.8, speed: 2.3, weight: 2 });
    goon(S, 'mallcop', A.food[0] + 6, A.food[1] + 4, { hp: 4 });
    goon(S, 'mallcop', A.food[0] + 2, A.food[1] - 5, { hp: 4 });
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    S.shot([A.food[0], 2.2, A.food[1] + 6], [A.food[0] - 2, 1.3, A.food[1]], 0.5);
    yield* S.lines([
      say('chuck', 'Not bad, sloth boys. You fight like me. Before the knee surgeries.'),
      say('sleavis', 'Heh heh. Chuck Thunder punched me AND fought with me. This is the greatest mall in America.'),
      say('chuck', 'Slothstock. Tomorrow night. I\'ll put you on the list.'),
      say('slothhead', 'Uh huh huh. Will there be chicks?'),
      say('chuck', 'Son, it\'s a desert music festival. There will be chicks, mud, and at least one guy named Moonbeam who won\'t stop hugging you.'),
      say('sleavis', 'Heh heh. COOL.')
    ]);
  }
] });

// ======================================================================= CHAPTER 9
CHAPTERS.push({ title: 'SLOTHSTOCK \'99', segs: [
  // 9-1 the festival (and the Sloth-John)
  function* (S) {
    const A = yield* S.load(Areas.fest);
    S.music('fest');
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    const wade = S.spawn('wade', A.wade[0], A.wade[1], 0, { id: 'wade' });
    for (let i = 0; i < 8; i++) { const h = S.spawn(LP.pick(['hippie', 'hippie', 'tourist', 'biker']), LP.rand(-14, 14), LP.rand(-6, 8), LP.rand(0, 6), { id: 'fan' + i }); h.ai = Actor.AI.wander; h.idleAnim = LP.pick(['dance', 'idle', 'headbang']); }
    const chuck = S.spawn('chuck', -2, -8, 0, { id: 'chuck' });
    if (!S.tries) yield* S.card('CHAPTER 9', 'SLOTHSTOCK \'99', 'ARIZONA DESERT. THREE DAYS OF PEACE, LOVE, AND $12 WATER.');
    S.mode('action', { yaw: 0, dist: 8, height: 5 });
    S.objective('FIND CHUCK THUNDER BY THE STAGE');
    joke(A.wade[0], A.wade[1] + 1, 'TALK TO WADE', [say('wade', 'My whistleblowers! Did you know this festival is sponsored by Fontaine Freedom Systems? The beer is FREEDOM BEER. It\'s 40% beer and 60% freedom.'), say('sleavis', 'Heh heh. What\'s freedom made of?'), say('wade', 'Corn syrup and surveillance.')], [say('slothhead', 'Uh huh huh. Hey, tinfoil guy.'), say('wade', 'Sloth-Head! They tracked the uplink to this festival. Agents everywhere. That guy selling glowsticks? NSA. That hippie? CIA. That other hippie? ...Actually just a hippie.')]);
    let pee = false;
    S.trigger({ x: 0, z: -2, r: 6, act: function* (S) {
      yield* S.lines([say('slothhead', 'Uh huh huh. I gotta pee. Like, BAD.'), say('sleavis', 'Heh heh. Use the Sloth-John.'), say('slothhead', 'Uh huh huh. That\'s what I\'m gonna do, dumbass.')]);
      S.objective('SLOTH-HEAD: USE THE PORTA-POTTY (EAST SIDE)');
    } });
    Stage.hot({ x: A.potty[0] - 1.2, z: A.potty[1], r: 1.6, label: 'USE THE SLOTH-JOHN', who: 'slothhead', whoMsg: 'Heh heh. I don\'t gotta go. I went in the mud pit. Heh heh.', act: () => { pee = true; } });
    yield* S.until(() => pee);
    Modes.stop();
    const sh = Game.hero('slothhead'); sh.vis.show(false); sh.gone = true;
    S.shot([A.potty[0] - 7, 2.6, A.potty[1] + 4], [A.potty[0], 1.4, A.potty[1]], 0.5);
    // find the potty mesh he went into (the one at index 2)
    let potty = null; Stage.cur.root.children.forEach((c) => { if (c.position && Math.abs(c.position.x - A.potty[0]) < 0.3 && Math.abs(c.position.z - A.potty[1]) < 0.3) potty = c; });
    const moshers = [];
    for (let i = 0; i < 4; i++) moshers.push(S.spawn('hippie', A.potty[0] - 2 - i * 0.8, A.potty[1] + LP.rand(-2, 2), Math.PI / 2, { id: 'mosher' + i }));
    moshers.forEach((m2) => m2.pose('headbang', { speed: 1.4 }));
    yield* S.lines([say('slothhead', '(INSIDE) Uh huh huh. Ahhhh.'), say('hippie', 'WHOA! A PORTA-POTTY! LET\'S MOSH IT, MAN!'), say('slothhead', '(INSIDE) Hey! I\'m IN here, dillholes!'), say('sleavis', 'Heh heh. Hang on, Slutt-Head!')]);
    yield* S.minigame('potty', { time: 18, mesh: potty });
    if (potty) potty.rotation.z = 0;
    sh.vis.show(true); sh.gone = false; sh.place(A.potty[0] - 1.6, A.potty[1], -Math.PI / 2);
    moshers.forEach((m2) => m2.pose(null));
    yield* S.lines([say('slothhead', 'Uh huh huh. I survived. I\'m like, a war hero.'), say('sleavis', 'Heh heh. You\'re blue, Slutt-Head.'), say('slothhead', '...What?'), say('sleavis', 'Heh heh. The blue stuff. It splashed. You\'re like... a smurf sloth.')]);
    // Chuck needs a guitarist
    const ch = S.actor('chuck');
    ch.place(A.potty[0] - 4, A.potty[1] + 1.5, -Math.PI / 2);
    S.shot([A.potty[0] - 3, 2, A.potty[1] + 6], [A.potty[0] - 3, 1.3, A.potty[1] + 0.6], 0.5);
    yield* S.lines([
      say('chuck', 'Sloth boys! Thank God. My guitarist just got hit in the head with a flying sandal.'),
      say('chuck', 'We go on in five minutes. Can either of you play?'),
      say('sleavis', 'Heh heh. I\'ve been playing air guitar for twenty years.'),
      say('chuck', 'That\'s... actually what we need. The guitar\'s not plugged in. It hasn\'t been since 1991.'),
      say('slothhead', 'Uh huh huh. I\'ll do the head thing.'),
      say('chuck', 'Perfect. Get up there. And whatever you do... don\'t let the crowd sense fear.')
    ]);
  },

  // 9-2 HEADBANG HERO at the main stage
  function* (S) {
    const A = yield* S.load(Areas.fest, { night: true });
    S.music(null);
    Game.spawnHeroes([0, 0], [0, 0]);
    S.sit('sleavis', -1.5, A.stage[1] + 2, 0, A.stageTop, 'guitar');
    S.sit('slothhead', 1.5, A.stage[1] + 2, 0, A.stageTop, 'headbang');
    const chuck = S.spawn('chuck', 0, A.stage[1] + 0.5, 0, { id: 'chuck' }); S.sit(chuck, 0, A.stage[1] + 0.5, 0, A.stageTop, 'cheer');
    const crowd = [];
    for (let i = 0; i < 12; i++) { const c = S.spawn(LP.pick(['hippie', 'hippie', 'biker', 'tourist', 'showgirl']), -8 + (i % 6) * 3.2, -4 + Math.floor(i / 6) * 2.4, Math.PI, { id: 'crowd' + i }); crowd.push(c); }
    S.shot([0, 3.2, 4], [0, 2.4, A.stage[1] + 1.5], 0);
    if (!S.tries) yield* S.lines([say('chuck', 'SLOTHSTOCK! ARE YOU READY TO ROCK?!'), say('sign', '(Ten thousand hippies make a sound like a field of very relaxed cows.)'), say('chuck', 'Give it up for my new guitarist... SLEAVIS! And my new... head guy... SLOTH-HEAD!'), say('sleavis', 'Heh heh. This one\'s called "SLOTH BUTT BOOGIE."'), say('slothhead', 'Uh huh huh. It\'s about butts.')]);
    yield* S.minigame('rhythm', { players: ['sleavis', 'slothhead'], crowd, bars: 30, seed: 1999, title: 'HEADBANG HERO', after: 'fest', failMsg: 'Ten thousand hippies booed you. Hippies don\'t boo. You broke the hippies.' });
    S.sfx('cheer'); S.sfx('cheer');
    yield* S.lines([say('chuck', 'THAT WAS INCREDIBLE! THAT WAS THE WORST GOOD THING I\'VE EVER HEARD!'), say('sleavis', 'Heh heh. I\'m gonna stage dive!'), say('slothhead', 'Uh huh huh. Don\'t, dumbass.')]);
    const s = Game.hero('sleavis');
    s.pinY = null; s.ignoreCol = true; s.vy = 6; s.knock = [0, 6]; s.pose('fall');
    yield* S.wait(1.2);
    S.sfx('thud');
    yield* S.lines([say('sleavis', '(FROM THE GROUND) Heh heh... nobody caught me.'), say('slothhead', 'Uh huh huh. They moved.')]);
    // the blimp arrives
    S.sfx('horn');
    yield* S.lines([
      say('deke', '(FROM A BLIMP LOUDSPEAKER) ATTENTION, SLOTHSTOCK. THIS IS DEKE FONTAINE OF FONTAINE FREEDOM SYSTEMS.'),
      say('deke', 'AND ATTENTION, GENTLEMEN IN THE SLOTH COSTUMES. YOU HAVE SOMETHING OF MINE.'),
      say('deke', 'BRING IT TO THE FONTAINE FREEDOM CASINO TONIGHT. AND I PROMISE YOU... YOU WILL SCORE.'),
      say('sleavis', 'Heh heh. He said SCORE!'),
      say('slothhead', 'Uh huh huh. Finally. Somebody gets us.'),
      say('lyle', '(FROM THE CROWD) Boss said bring \'em in ALIVE, Dwayne! ...Mostly alive!'),
      say('dwayne', 'Duh. MOSH PIT!')
    ]);
  },

  // 9-3 the mosh pit
  function* (S) {
    const A = yield* S.load(Areas.fest, { night: true });
    S.music('brawl');
    Game.spawnHeroes([-2, 4, Math.PI], [-3.5, 5, Math.PI]);
    Game.healHeroes();
    const m = S.mode('action', { yaw: 0, dist: 8.5, height: 5.4, combat: true });
    const LOOK_RAVER = { skin: '#f0c8a8', hair: '#40e0ff', shirt: '#ff40ff', pants: '#202020', h: 1.75, mouth: 'grin', name: 'RAVER' };
    for (let i = 0; i < 4; i++) goon(S, i % 2 ? LOOK_RAVER : 'hippie', -8 + i * 5, -4, { hp: 3, speed: 3.4 });
    S.bark('slothhead', 'Uh huh huh. The hippies are fighting. That\'s like, against their religion.');
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    for (let i = 0; i < 3; i++) goon(S, 'biker', -10 + i * 10, 6, { hp: 5, missile: 'bottle', ai: i === 1 ? Actor.AI.thrower : Actor.AI.brawler });
    goon(S, 'lyle', 8, -6, { id: 'lyle', hp: 10, dmg: 1.3 });
    goon(S, 'dwayne', -8, -6, { id: 'dwayne', hp: 16, dmg: 1.8, speed: 2.3, weight: 2 });
    Game.pickup('beer', 0, 2); Game.pickup('burrito', 6, 6);
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    S.shot([0, 2.4, 9], [-1, 1.2, 4], 0.5);
    yield* S.lines([
      say('lyle', '(ON THE GROUND) Ugh... Mr. Fontaine... is gonna... be so mad...'),
      say('slothhead', 'Uh huh huh. Tell him we\'re coming. To score.'),
      say('sleavis', 'Heh heh. Lost Wages, baby!'),
      say('lyle', 'You... you really don\'t know what that remote does... do you?'),
      say('slothhead', 'Uh huh huh. It changes stuff.'),
      say('lyle', '...Yeah. Yeah, it does.')
    ]);
  }
] });

// ======================================================================= CHAPTER 10
CHAPTERS.push({ title: 'LOST WAGES', segs: [
  // 10-1 the casino floor
  function* (S) {
    const A = yield* S.load(Areas.casino);
    S.music('casino');
    giveShades();
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    const doug = S.spawn('doug', A.doug[0], A.doug[1], -Math.PI / 2, { id: 'doug' });
    const sg = S.spawn('showgirl', -6, 0, 0.5, { id: 'showgirl' }); sg.ai = Actor.AI.wander;
    const el = S.spawn('elvis', 6, -2, -0.5, { id: 'elvis' }); el.idleAnim = 'dance';
    for (let i = 0; i < 4; i++) { const g = S.spawn(LP.pick(['tourist', 'granny', 'trucker']), LP.rand(-18, 18), LP.rand(-7, -3), 0, { id: 'gambler' + i }); g.idleAnim = 'mash'; }
    if (!S.tries) yield* S.card('CHAPTER 10', 'LOST WAGES', 'NEVADA. FONTAINE\'S FREEDOM CASINO. WHERE THE HOUSE ALWAYS WINS. AND THEN WINS AGAIN.');
    S.mode('action', { yaw: 0, dist: 8, height: 4.8 });
    S.objective('FIND A WAY UP TO DEKE FONTAINE\'S PENTHOUSE');
    joke(A.doug[0], A.doug[1] + 1, 'TALK TO SLOT ATTENDANT', [say('doug', 'No. No no no no. No.'), say('sleavis', 'Heh heh. DOUG!'), say('doug', 'I moved to Nevada. I changed my hair. I\'m a slot attendant now. Nobody knows me here. I was HAPPY.'), say('sleavis', 'Heh heh. We missed you, Doug.'), say('doug', 'The penthouse elevator only opens for jackpot winners. Win a jackpot and leave. Please. For me.')], [say('doug', 'You found me. In NEVADA. How. HOW.'), say('slothhead', 'Uh huh huh. We\'re on a road trip. To score.'), say('doug', 'Then go score. Win a jackpot on the Freedom Slots, the penthouse elevator opens. Go up. Never come down.')]);
    joke(-6, 1.2, 'TALK TO SHOWGIRL', [say('sleavis', 'Heh heh. Hey baby. I\'m a big deal. I have a remote.'), say('showgirl', 'Honey, everybody in this town has a remote. Yours is the only one with a skull on it.'), say('sleavis', 'Heh heh. She noticed my skull.')], [say('slothhead', 'Uh huh huh. Hey. Nice feathers.'), say('showgirl', 'Thanks, sugar. Nice... fur?'), say('slothhead', 'Uh huh huh. It\'s not fur. It\'s a lifestyle.'), say('showgirl', 'I\'ve heard that one before. From a guy dressed as a cat. He\'s in prison now.')]);
    joke(6, -1, 'TALK TO ELVIS #4', [say('elvis', 'Thank you. Thank you very much.'), say('sleavis', 'Heh heh. I didn\'t do anything.'), say('elvis', 'That\'s what I\'m thankin\' you for, hoss.')], [say('slothhead', 'Uh huh huh. Are you the real Elvis?'), say('elvis', 'I\'m the fourth-realest Elvis in this casino, son. The first three are on break.')]);
    let won = false;
    Stage.hot({ x: A.slots[0], z: A.slots[1] + 0.5, r: 1.7, label: 'PLAY FREEDOM SLOTS', cond: () => !won, act: function* (S, h, L) {
      yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh. Doug gave us tokens. I think he wants us to leave.' : 'Uh huh huh. Doug gave us six tokens. He was crying.')]);
      S.sit(L.id, A.slots[0], A.slots[1] + 0.6, Math.PI, 0, 'mash');
      S.shot([A.slots[0] + 2, 2.1, A.slots[1] + 3.5], [A.slots[0], 1.3, A.slots[1]], 0.4);
      const r = yield* S.minigame('slots', { tokens: 6, rig: 4 });
      S.stand(L.id, A.slots[0], A.slots[1] + 1.6);
      S.free();
      if (r.jackpot) {
        won = true;
        S.sfx('jackpot'); Game.shake(0.1, 1);
        yield* S.lines([say('sign', '(Sirens. Lights. A recorded voice: "CONGRATULATIONS, FREEDOM WINNER. MR. FONTAINE INVITES YOU TO THE PENTHOUSE.")'), say('sleavis', 'Heh heh. We WON! We\'re gonna meet the guy! We\'re gonna SCORE!'), say('slothhead', 'Uh huh huh. It was skill. Pure skill.'), say('doug', '(FROM ACROSS THE CASINO) THE MACHINE WAS RIGGED! HE WANTED YOU UP THERE! THAT\'S BAD! DON\'T—'), say('sleavis', 'Heh heh. Bye, Doug!')]);
        S.objective('TAKE THE ELEVATOR TO THE PENTHOUSE');
      } else {
        yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh. We lost everything.' : 'Uh huh huh. The house won. That\'s bull.'), say('doug', '(SIGH) Here. Six more tokens. Please. Win. Leave. Live your lives.')]);
      }
    } });
    let up = false;
    Stage.hot({ x: A.elevator[0], z: A.elevator[1], r: 1.8, label: 'TAKE THE ELEVATOR', act: function* (S, h, L) {
      if (!won) { yield* S.say(L.id, L.id === 'sleavis' ? 'Heh heh. It won\'t open. It says "JACKPOT WINNERS ONLY."' : 'Uh huh huh. "Jackpot winners only." We gotta win the slots, dumbass.'); return; }
      up = true;
    } });
    yield* S.until(() => up);
  },

  // 10-2 the penthouse: the villain explains everything; the idiots understand nothing
  function* (S) {
    const A = yield* S.load(Areas.penthouse);
    S.music('casino');
    giveShades();
    Game.spawnHeroes([A.start[0] + 0.6, A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    const deke = S.spawn('deke', A.deke[0], A.deke[1] + 1.8, 0, { id: 'deke' });
    const lyle = S.spawn('lyle', -3, -3, Math.PI / 4, { id: 'lyle' });
    const dwayne = S.spawn('dwayne', 3, -3, -Math.PI / 4, { id: 'dwayne' });
    S.shot([2.5, 1.8, 3.8], [0, 1.3, -2], 0);
    yield* S.lines([
      say('deke', 'Gentlemen. Welcome. Deke Fontaine. Patriot. Visionary. Owner of the third-largest casino on this side of the Strip.'),
      say('sleavis', 'Heh heh. Hi. Where are the chicks?'),
      say('deke', 'Straight to business. I respect that. First... my package?'),
      say('slothhead', 'Uh huh huh. Right here.'),
      say('sign', '(Sloth-Head reaches into his suit pouch and pulls out a remote. It is, technically, a remote.)'),
      say('deke', 'Ahhh. The P.A.T.R.I.O.T. uplink. Twenty years of my life. Cancelled by a Senate subcommittee in an afternoon.'),
      say('sleavis', 'Heh heh. He\'s sad. Make him happy with the chicks.'),
      say('deke', 'You boys want to know what this is for? Of course you don\'t. But I\'m going to tell you anyway. It\'s been a long road and nobody listens to me.'),
      say('deke', 'At midnight, during the Freedom Fest fireworks, I aim the mirror at the Hoover Damn. Lake Mead empties into Lost Wages. The government pays me ONE TRILLION dollars, or I do it again.'),
      say('deke', 'To Arizona.'),
      say('slothhead', 'Uh huh huh. Nobody would notice.'),
      say('deke', 'EXACTLY.'),
      say('sleavis', 'Heh heh. He said damn.'),
      say('slothhead', 'Uh huh huh. Twice.'),
      say('deke', '...Lyle. Dwayne. Take our guests to the "party." In the basement. Where the sharks are.'),
      say('sleavis', 'Heh heh. A party with SHARKS? This is the best night EVER.'),
      say('deke', 'I\'ll be in my blimp. Ta-ta, gentlemen. You\'ve been... adequately useful.')
    ]);
    S.actor('deke').walkTo(0, -7);
    yield* S.wait(1.5);
    deke.vis.show(false); deke.gone = true;
    yield* S.lines([
      say('slothhead', 'Uhh... Sleavis. I don\'t think we\'re gonna score.'),
      say('sleavis', 'Heh heh. Why not?'),
      say('slothhead', 'Uh huh huh. Because those jerky guys are cracking their knuckles.'),
      say('lyle', 'Nothin\' personal, boys. Just business. Shark business.'),
      say('sleavis', 'Heh heh. Oh. ...OH.')
    ]);
  },

  // 10-3 casino brawl and escape
  function* (S) {
    const A = yield* S.load(Areas.casino);
    S.music('brawl');
    giveShades();
    Game.spawnHeroes([0, 4, Math.PI], [-1.5, 5, Math.PI]);
    Game.healHeroes();
    const SEC = { skin: '#d8a888', hair: '#202020', shirt: '#202020', jacket: '#202020', tie: '#c8a040', pants: '#202020', shades: true, h: 1.88, wide: 1.15, name: 'CASINO SECURITY' };
    const m = S.mode('action', { yaw: 0, dist: 8.5, height: 5.2, combat: true });
    if (!S.tries) S.toast('FIGHT YOUR WAY OUT OF THE CASINO! (THE CHAIRS ARE $300 EACH. BREAK THEM.)', '#ffe040');
    goon(S, 'lyle', -4, -4, { id: 'lyle', hp: 10, dmg: 1.4 });
    goon(S, SEC, 4, -5, { hp: 5, dmg: 1.2 });
    goon(S, SEC, 8, 0, { hp: 5, dmg: 1.2 });
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    S.bark('slothhead', 'Uh huh huh. More guys in suits. Like a funeral. For THEM.');
    goon(S, 'dwayne', 0, -10, { id: 'dwayne', hp: 18, dmg: 1.9, speed: 2.4, weight: 2.2 });
    goon(S, SEC, -12, -6, { hp: 5, dmg: 1.2, missile: 'chair', ai: Actor.AI.thrower });
    goon(S, SEC, 12, -6, { hp: 5, dmg: 1.2 });
    goon(S, 'elvis', 14, 4, { hp: 4, name: 'EVIL ELVIS #7' });
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    // Strunk arrives. Doug talks. Nobody listens.
    for (const h of Game.heroActors()) { h.vis.show(false); h.gone = true; }
    S.spawn('strunk', 0, 6, Math.PI, { id: 'strunk' }); S.spawn('pip', 1.3, 6.5, Math.PI, { id: 'pip' });
    const doug = S.spawn('doug', -0.4, 4, 0, { id: 'doug' });
    S.shot([3, 2, 9], [0, 1.3, 5], 0.0);
    yield* S.card('', 'TEN MINUTES LATER', 'THE FEDS. LATE. AGAIN.');
    yield* S.lines([
      say('strunk', 'Federal agent. Where\'s Fontaine?'),
      say('doug', 'He took his blimp to the dam. The sloth guys went after him. In a van. With no roof. Sleavis was driving. Can I go home now? I\'ve been awake since 1994.'),
      say('strunk', 'The dam. The fireworks. Midnight. Pip, what time is it?'),
      say('pip', 'Ma\'am... it\'s eleven-forty.'),
      say('strunk', 'Then why are we still talking, Pip?'),
      say('pip', 'You asked me what time it was, ma\'am.'),
      say('strunk', 'GET THE CAR.')
    ]);
  }
] });

// ======================================================================= CHAPTER 11
CHAPTERS.push({ title: 'THE HOOVER DAMN', segs: [
  // 11-1 the race to the dam
  function* (S) {
    yield* S.load(Areas.empty, { sky: '#0a0a24', fog: '#141030', near: 30, far: 150, light: { sky: '#8090ff', ground: '#302020', sun: '#ffc0a0', sunI: 1.2, sunPos: [-10, 10, -10], rimI: 1.6 } });
    Game.spawnHeroes(null, null, 'both');
    giveShades();
    S.music('boss');
    if (!S.tries) yield* S.card('CHAPTER 11', 'THE HOOVER DAMN', 'JULY 4TH. 11:41 PM. NINETEEN MINUTES UNTIL FREEDOM.');
    if (!S.tries) yield* S.lines([say('slothhead', 'Uh huh huh. Hold on, dumbass. I\'m driving fast.'), say('sleavis', 'Heh heh. Where are we going?'), say('slothhead', 'Uh huh huh. To the dam. To get our chicks back.'), say('sleavis', 'Heh heh. We never HAD chicks.'), say('slothhead', '...To get our chicks for the first time.')]);
    yield* S.play('drive', {
      theme: 'desert', length: 2600, traffic: 0.5, chaser: 'cops', chaserSpeed: 28, destination: 'HOOVER DAMN', driver: 'slothhead', hp: 6, max: 36,
      billboards: [{ text: 'FONTAINE\nFREEDOM FEST\nTONIGHT!\nHOOVER DAMN', bg: '#2040a0', fg: '#ffffff' }, 'HOOVER DAMN\n5 MI\n(WE KNOW)', 'LOST WAGES\nWHAT HAPPENS HERE\nFLOODS HERE', 'LAST CHANCE\nGAS\nBEFORE THE APOCALYPSE'],
      radio: ['KLAS FM: COUNTDOWN TO THE FREEDOM FEST FIREWORKS! SPONSORED BY FONTAINE FREEDOM SYSTEMS. "WE\'RE WATCHING THE SKIES. FOR YOU."'],
      events: [
        { at: 200, bark: ['sleavis', 'Heh heh. The cops are following us. Like a parade!'] },
        { at: 700, radio: 'POLICE SCANNER: ROOFLESS VAN HEADED FOR THE DAM. FEDS SAY DO NOT SHOOT. FEDS SAY THEY ARE "IDIOTS, BUT OUR IDIOTS."' },
        { at: 1300, bark: ['slothhead', 'Uh huh huh. Use the remote on stuff. {special}.'] },
        { at: 1900, bark: ['sleavis', 'Heh heh. I see the dam! It\'s all lit up! Like a giant butt with lights!'] },
        { at: 2300, bark: ['slothhead', 'Uh huh huh. And the blimp. With the guy\'s face on it.'] }
      ],
      wreckMsg: 'You crashed the van fourteen minutes before midnight. Somewhere, Deke Fontaine is laughing in a blimp.'
    });
  },

  // 11-2 the dam: the last stand of Lyle and Dwayne, and THE TWIST
  function* (S) {
    const A = yield* S.load(Areas.dam, { blimp: true });
    S.music('boss');
    giveShades();
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI / 2], [A.start2[0], A.start2[1], Math.PI / 2]);
    Game.healHeroes();
    const SEC = { skin: '#d8a888', hair: '#202020', shirt: '#202020', jacket: '#202020', tie: '#c8a040', pants: '#202020', shades: true, h: 1.88, wide: 1.15, name: 'FONTAINE SECURITY' };
    A.blimp.position.set(-10, 24, -40);
    Stage.tick((dt, t) => { A.blimp.position.x = -10 + Math.sin(t * 0.2) * 14; A.blimp.rotation.y = Math.PI / 2; });
    if (!S.tries) yield* S.lines([say('deke', '(FROM THE BLIMP) Lyle! Dwayne! Those morons are on the dam! STOP THEM! I need eleven more minutes!'), say('sleavis', 'Heh heh. He called us morons. He doesn\'t even know us.'), say('slothhead', 'Uh huh huh. Yeah. That\'s like, our job title.')]);
    const m = S.mode('action', { camera: 'side', side: { z: 9.5, y: 2.6, lookY: 1.3 }, camX: [-44, 38], combat: true });
    S.objective('GET ACROSS THE DAM');
    goon(S, SEC, -30, 0, { hp: 5, dmg: 1.2 }); goon(S, SEC, -28, 2, { hp: 5, dmg: 1.2, missile: 'bottle', ai: Actor.AI.thrower });
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    goon(S, SEC, -8, -1, { hp: 5, dmg: 1.2 }); goon(S, SEC, -6, 2, { hp: 5, dmg: 1.2 }); goon(S, SEC, -2, 0, { hp: 5, dmg: 1.2, missile: 'chair', ai: Actor.AI.thrower });
    yield* S.until(() => (Modes.enemiesLeft() === 0 && Game.leaderActor().x > -14) || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    // the final goons
    Game.pickup('beer', 6, 1.5); Game.pickup('burrito', 10, -1.5); Game.pickup('sugar', 12, 1);
    const ly = goon(S, 'lyle', 16, -1, { id: 'lyle', hp: 14, dmg: 1.4, speed: 3.3, aggression: 2 });
    const dw = goon(S, 'dwayne', 18, 1.5, { id: 'dwayne', hp: 22, dmg: 1.8, speed: 2.5, weight: 2.4, windupT: 0.42, aggression: 1.4 });
    HUD.toast('FINAL BOSS(ES): LYLE & DWAYNE', '#ff6060');
    S.bark('lyle', 'This time it\'s PERSONAL, Sloth Gang!');
    S.bark('dwayne', 'Duh... it was always personal. I just didn\'t say.');
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    // THE TWIST
    const L = Game.hero('sleavis'), R = Game.hero('slothhead');
    L.place(20, 0.5, -Math.PI / 2 - 0.4); R.place(21.4, -0.4, -Math.PI / 2 - 0.4);
    A.blimp.position.set(26, 16, -30);
    S.shot([16, 3, 9], [24, 9, -20], 0.6);
    S.sfx('click'); yield* S.wait(0.3); S.sfx('click'); yield* S.wait(0.3); S.sfx('click');
    yield* S.lines([
      say('deke', '(FROM THE BLIMP) Eleven fifty-nine. Ladies and gentlemen... FREEDOM.'),
      say('sign', '(click.)'),
      say('sign', '(click click.)'),
      say('deke', '...'),
      say('deke', 'Why isn\'t it working.'),
      say('lyle', '(ON THE GROUND) Boss... I think that\'s a TV remote. It\'s got a TV Guide button.'),
      say('deke', 'WHERE IS MY UPLINK?!'),
      say('slothhead', 'Uhh... uh huh huh.'),
      say('sign', '(Sloth-Head reaches into his suit pouch. He pulls out the REAL P.A.T.R.I.O.T. uplink. It has a skull on it.)'),
      say('slothhead', 'Uh huh huh. Oops. I gave him the old one. The one with no batteries.'),
      say('sleavis', 'Heh heh. Because I ATE them!'),
      say('sleavis', 'Heh heh. Slutt-Head... you\'re a GENIUS.'),
      say('slothhead', 'Uh huh huh. Yeah. I planned it.'),
      say('sleavis', 'No you didn\'t. You just stuck your hand in your suit and grabbed the wrong one.'),
      say('slothhead', '...Uh huh huh. Same thing.'),
      say('deke', 'FINE! If I can\'t have the dam... I\'ll CRUSH you with my BLIMP!'),
      say('sleavis', 'Heh heh. The blimp is coming at us. It\'s like a giant flying wiener.')
    ]);
    // Slaria arrives (of course she does)
    const sl = S.spawn('slaria', 26, 1, -Math.PI / 2, { id: 'slaria' });
    S.actor('slaria').walkTo(22.6, 1.1);
    yield* S.wait(1.4);
    S.face('slaria', 'slothhead');
    S.shot([18.5, 1.9, 4.5], [21.6, 1.3, 0.2], 0.5);
    yield* S.lines([
      say('slaria', 'My family brought me to "Freedom Fest." I\'ve been watching you two from the bleachers. I can\'t believe I\'m saying this.'),
      say('slaria', 'Point it at the blimp. Not the dam. The BLIMP. The giant floating thing with his name on it.'),
      say('sleavis', 'Heh heh. She\'s giving us orders. She\'s totally into us.'),
      say('slaria', 'If you hit the dam, a hundred thousand people drown, including me. So I\'m very, very motivated.'),
      say('slothhead', 'Uh huh huh. OK. Blimp. Not dam.'),
      say('sleavis', 'Heh heh. Lemme press it! LEMME PRESS IT!'),
      say('slothhead', 'NO! MINE!')
    ]);
  },

  // 11-3 THE FREEDOM BLIMP (the remote mini-game)
  function* (S) {
    const A = yield* S.load(Areas.dam, { blimp: true });
    S.music('boss');
    giveShades();
    Game.spawnHeroes([20, 0.6, -Math.PI / 2 - 0.2], [21.2, -0.3, -Math.PI / 2 - 0.2]);
    S.anim('slothhead', 'point'); S.anim('sleavis', 'flail');
    const sl = S.spawn('slaria', 22.8, 1.0, -Math.PI / 2 - 0.4, { id: 'slaria' });
    A.blimp.visible = true;
    S.shot([18, 2.2, 6], [18, 13, -40], 0);
    if (!S.tries) S.toast('AIM WITH MOVE. {punch} FIRES. {jump} WRESTLES THE REMOTE BACK FROM SLEAVIS.', '#ffe040');
    yield* S.minigame('remote', {
      target: A.blimp, hits: 3, damY: 268,
      onHit: (n) => { HUD.bark('slaria', n === 1 ? 'Good. Again.' : n === 2 ? 'One more. Please don\'t make me say "good job" again.' : 'Fine. Good job.'); },
      onCrack: (n) => { HUD.bark('slaria', n === 1 ? 'THAT WAS THE DAM.' : 'STOP SHOOTING THE DAM!'); Game.damage(2000000, new THREE.Vector3(18, -4, 3)); }
    });
    // the blimp goes down... into the fireworks barge
    S.anim('slothhead', 'cheer'); S.anim('sleavis', 'cheer');
    S.shot([10, 6, 10], [6, 8, -60], 0.8);
    let t = 0;
    const b = A.blimp, from = b.position.clone(), to = A.barge.position.clone().add(new THREE.Vector3(0, 1, 0));
    yield* S.until(() => { t += 1 / 60; const k = Math.min(1, t / 2.4); b.position.lerpVectors(from, to, k * k); b.rotation.z = k * 0.6; if (LP.chance(0.3)) FX3.burst(b.position.clone(), 2, { colors: ['#ff8020', '#404040'], up: 1, speed: 2, floor: -50 }); return k >= 1; }, { block: true });
    b.visible = false;
    FX3.explode(to.clone(), 4);
    Game.damage(40000000, to.clone());
    fireworks(30, to);
    S.music('ending');
    yield* S.wait(2.5);
    yield* S.lines([
      say('sign', '(Every firework on the barge goes off at once. It spells something in the sky. It might be "USA." It might be "ASS." Experts will argue for years.)'),
      say('sleavis', 'Heh heh heh heh heh. FIREWORKS!'),
      say('slothhead', 'Uh huh huh. We did a fireworks.'),
      say('slaria', 'A man just parachuted out of a burning blimp into Lake Mead. Wearing a white suit. Screaming about taxes.'),
      say('sleavis', 'Heh heh. Is that the chick guy?'),
      say('slaria', 'Yes. That\'s "the chick guy."')
    ]);
    fireworks(16, to);
  },

  // 11-4 HEROES. (they have no idea.)
  function* (S) {
    const A = yield* S.load(Areas.dam, { blimp: false });
    S.music('ending');
    giveShades();
    Game.spawnHeroes([41, 0.2, 0], [43, 0.2, 0]);
    S.sit('sleavis', 41.2, 0.4, 0.15, 0.6, 'idle'); S.sit('slothhead', 42.8, 0.4, -0.15, 0.6, 'idle');
    const cast = [['strunk', 39.5, 1.8], ['pip', 38.6, 2.4], ['slaria', 45, 1.6], ['doug', 46.2, 2.5], ['earl', 36.5, 2.8], ['wade', 47.6, 3.0], ['chuck', 35.2, 2.0], ['bigmama', 49, 2.2], ['tammy', 33.8, 3.1], ['gaspy', 50.5, 3.2], ['kid', 44, 3.2]];
    for (const c of cast) S.spawn(c[0], c[1], c[2], 0.0 + (c[1] < 42 ? 0.4 : -0.4) + Math.PI, { id: c[0] });
    for (const c of cast) S.face(c[0], 'sleavis');
    const deke = S.spawn('deke', 30, 2, Math.PI / 2, { id: 'deke' }); deke.pose('sad');
    Stage.tick((dt, t) => { if (Math.random() < dt * 1.2) fireworks(1, new THREE.Vector3(40, -2, -60)); });
    S.shot([42, 2.4, 8.5], [42, 1.4, 0.5], 0);
    yield* S.lines([
      say('strunk', 'Ladies and gentlemen. On behalf of the United States government... these two men stopped a terrorist, destroyed a stolen orbital weapon\'s only target lock, and saved a hundred thousand lives.'),
      say('sign', '(The crowd goes absolutely insane.)'),
      say('strunk', 'They did it while pretending to be idiots. Deep cover. The deepest I\'ve ever seen.'),
      say('pip', 'Ma\'am, I really think they\'re just—'),
      say('strunk', 'NOT NOW, Pip.'),
      say('strunk', 'The President is on the phone. He\'d like to say a few words.'),
      say('phone', '"Hello, gentlemen. This is the President. On behalf of a grateful nation... thank you. What can America give you?"'),
      say('sleavis', 'Heh heh. Chicks.'),
      say('phone', '"...I can give you a medal."'),
      say('sleavis', 'Heh heh. Can we trade it for chicks?'),
      say('phone', '"I\'m going to hang up now. God bless America. Mostly."'),
      say('slothhead', 'Uh huh huh. So... we\'re like, heroes?'),
      say('slaria', 'You saved Lost Wages from a flood. Deke Fontaine is going to prison. The P.A.T.R.I.O.T. satellite is being decommissioned. Because of you.'),
      say('slothhead', 'Uh huh huh. Cool. ...What flood?'),
      say('slaria', 'Never mind. It\'s actually better if you don\'t understand. For all of us.'),
      say('sleavis', 'Heh heh. Hey Slaria. Wanna score?'),
      say('slaria', 'No.'),
      say('sleavis', 'Heh heh. She said "know." Like she KNOWS we\'re awesome.'),
      say('slaria', 'I said NO, Sleavis. N. O.'),
      say('doug', 'Can I PLEASE go home now?'),
      say('earl', 'Hell of a ride, boys. Hell of a ride. Don\'t ever call me.'),
      say('deke', '(IN HANDCUFFS) Two idiots. Two IDIOTS in SLOTH SUITS ruined everything!'),
      say('slothhead', 'Uh huh huh. He gets us.'),
      say('strunk', 'Gentlemen, one last thing. The uplink. Hand it over.'),
      say('slothhead', 'Uh huh huh. Sure. Which one?'),
      say('strunk', '...How many do you have?'),
      say('slothhead', 'Uh huh huh. Uhh...'),
      say('sleavis', 'Heh heh heh. This is the best day ever. We\'re heroes. We\'re famous. We saved... a thing.'),
      say('sleavis', 'Hey, Slutt-Head.')
    ]);
    S.stand('slothhead', 42.8, 0.6);
    S.face('slothhead', 'sleavis');
    yield* S.lines([
      say('slothhead', '...'),
      say('slothhead', 'Say it ONE more time, Sleavis. On national TV. I DARE you.'),
      say('sleavis', 'Heh heh.'),
      say('sleavis', 'Slutt-Head.'),
      say('slothhead', 'That\'s it. I\'m gonna kick your ass.'),
      say('sleavis', 'Heh heh heh heh! You gotta catch me first!')
    ]);
    S.stand('sleavis', 41.2, 0.6);
    // the chase that rolls under the credits
    const s = Game.hero('sleavis'), h = Game.hero('slothhead');
    s.ai = (a, dt) => { const d = a.aiData; d.t = (d.t || 0) - dt; if (d.t <= 0) { d.t = 1.4; d.go = [LP.rand(28, 52), LP.rand(-3, 3)]; } const dx = d.go[0] - a.x, dz = d.go[1] - a.z, m = Math.hypot(dx, dz) || 1; a.mv = [dx / m * 1.4, dz / m * 1.4]; };
    h.ai = (a) => { const dx = s.x - a.x, dz = s.z - a.z, m = Math.hypot(dx, dz) || 1; a.mv = m > 0.9 ? [dx / m * 1.15, dz / m * 1.15] : [0, 0]; if (m < 1.2 && a.cd <= 0) { a.attack(); a.cd = 1.2; } };
    s.team = h.team = 'neutral';
    Game.leader = 'sleavis';
    Stage.release(); Stage.cam.mode = 'follow'; Stage.cam.yaw = 0.35; Stage.cam.dist = 7.5; Stage.cam.height = 3.6;
    yield* S.wait(2.5);
  }
] });
