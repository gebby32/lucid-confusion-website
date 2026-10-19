/* CHAPTERS (2/3): 3 THE NO-TELL MOTEL, 4 TRUCK STOP OF THE DAMNED, 5 THE RUSTY SPITTOON, 6 CORN DOG CANYON */
'use strict';
// spawn a brawler. o = { hp, dmg, speed, ai, boss, name, ring, missile }
function goon(S, look, x, z, o) {
  o = o || {};
  const a = S.spawn(look, x, z, o.face || 0, Object.assign({ team: 'enemy', hp: 4, dmg: 1, speed: 2.9, ai: Actor.AI.brawler }, o, { id: o.id || ((typeof look === 'string' ? look : 'goon') + '_' + Math.floor(Math.random() * 1e6)) }));
  a.ai = o.ai || Actor.AI.brawler;
  if (o.aggression) a.aggression = o.aggression;
  if (o.windupT) a.windupT = o.windupT;
  if (o.missile) a.missile = o.missile;
  return a;
}
const LOOK_TOWEL = { skin: '#f0c0a0', shirt: '#f0c0a0', pants: '#f0f0f0', shorts: true, hair: '#4a3020', gut: 0.35, h: 1.75, mouth: 'o', name: 'TOWEL GUY' };
const LOOK_CHICKEN = { skin: '#e0b090', shirt: '#e8e0b0', pants: '#5a5a7a', hair: '#8a6a2a', beard: '#8a6a2a', gut: 0.2, h: 1.8, angry: true, name: 'CHICKEN GUY' };
const LOOK_PUP = { skin: '#c8862a', shirt: '#c8862a', pants: '#c8862a', mascot: 'corndog', h: 1.5, name: 'CORN PUP' };
// wait for a brawl wave to be cleared
function* waveClear(S) { yield* S.until(() => Modes.enemiesLeft() === 0); }

// ======================================================================= CHAPTER 3
CHAPTERS.push({ title: 'THE NO-TELL MOTEL', segs: [
  // 3-1 Doug, night manager of America
  function* (S) {
    const A = yield* S.load(Areas.motel);
    S.music('motel');
    Game.spawnHeroes([A.van[0] - 2.5, A.van[1] - 1, Math.PI], [A.van[0] - 3.5, A.van[1] - 0.2, Math.PI]);
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false, graffiti: Game.flags.graffiti, solid: true });
    const doug = S.spawn('doug', A.office[0], A.office[1] + 0.6, 0, { id: 'doug' });
    if (!S.tries) yield* S.card('CHAPTER 3', 'THE NO-TELL MOTEL', 'SOMEWHERE IN MISSOURI. 2:40 AM. THE NEON SAYS "VACANCY." THE NEON LIES.');
    S.mode('action', { yaw: 0, dist: 7, height: 4.3 });
    S.objective('GET A ROOM (TALK TO THE NIGHT MANAGER)');
    let talked = false;
    Stage.hot({ x: doug.x, z: doug.z + 0.6, r: 1.8, label: 'TALK TO NIGHT MANAGER', cond: () => !talked, act: function* (S, h, L) {
      S.shot([A.office[0] + 3.5, 1.8, A.office[1] + 5], [A.office[0] + 0.6, 1.2, A.office[1] + 1.2], 0.5);
      yield* S.lines([
        say('doug', 'Welcome to the No-Tell Motel, where we don\'t ask and you don\'t tell. I\'m Doug. I\'m the night manager. I\'m also the day manager. They forgot about me.'),
        say('doug', 'Room\'s thirty-nine ninety-five.'),
        say('slothhead', 'Uh huh huh. We got three seventeen. And a remote.'),
        say('doug', '...Is that a satellite uplink?'),
        say('slothhead', 'No. It\'s a remote. Dumbass.'),
        say('doug', 'Sure. Look. It\'s been a long night. Somebody flushed an entire rotisserie chicken in Room 6. Unclog it and you can have the room for three seventeen.'),
        say('sleavis', 'Heh heh. Deal! I\'m GREAT at clogging toilets.'),
        say('doug', 'UN-clogging.'),
        say('sleavis', 'Heh heh. It\'s the same thing backwards.')
      ]);
      const i = yield* S.choose('slothhead', ['"Uh huh huh. Do you have a honeymoon suite? For me and... the ladies."', '"Uh huh huh. Is there cable?"', '"Fine. Give us the key."']);
      if (i === 0) yield* S.lines([say('slothhead', 'Uh huh huh. Do you have the honeymoon suite? For me and the ladies.'), say('doug', 'What ladies?'), say('slothhead', 'The ones who are coming. Later. Uh huh huh.'), say('doug', 'Room 6. The ladies can find you there. They\'ll follow the smell.')]);
      if (i === 1) yield* S.lines([say('slothhead', 'Uh huh huh. Is there cable? Like the naked channel?'), say('doug', 'There\'s a channel. It\'s scrambled. I\'ve watched it for eleven years. I still don\'t know what it is.'), say('sleavis', 'Heh heh. That\'s like, the dream.')]);
      yield* S.lines([say('doug', 'Room 6. Checkout\'s at eleven. Please don\'t make me remember your faces.'), say('sleavis', 'Heh heh. Thanks, Doug!'), say('doug', 'Don\'t... don\'t use my name. It makes it real.')]);
      talked = true;
      S.free();
      S.objective('GO TO ROOM 6');
    } });
    let at6 = false;
    S.trigger({ x: A.room6[0], z: A.room6[1], r: 1.5, cond: () => talked, act: () => { at6 = true; } });
    joke(-0.5, -6.6, 'ROOM 6', 'Heh heh. Room 6. That\'s like, almost 69.', 'Uh huh huh. Six. Uh huh huh. That\'s half of... something.', { cond: () => !talked });
    yield* S.until(() => at6);
  },

  // 3-2 Room 6: the TV, the bed, the toilet
  function* (S) {
    const A = yield* S.load(Areas.motelRoom);
    S.music('motel');
    Game.spawnHeroes([A.door[0] + 0.5, A.door[1] - 0.6, Math.PI], [A.door[0] - 0.6, A.door[1] - 0.6, Math.PI]);
    S.mode('action', { yaw: 0, dist: 5.4, height: 3.8 });
    if (!S.tries) yield* S.lines([say('sleavis', 'Heh heh. Nice. It smells like feet and cigarettes. Like home.'), say('slothhead', 'Uh huh huh. There\'s a stain on the ceiling. How do you get a stain on the CEILING?'), say('sleavis', 'Heh heh. You gotta really want it.')]);
    S.objective('UNCLOG THE TOILET (BATHROOM)');
    let plunged = false;
    Stage.hot({ x: A.toilet[0], z: A.toilet[1], r: 1.4, label: 'PLUNGE THE TOILET', who: 'sleavis', whoMsg: 'Uh huh huh. I\'m not touching that. Sleavis is the toilet guy.', cond: () => !plunged, act: function* (S) {
      yield* S.lines([say('sleavis', 'Heh heh. There\'s a whole chicken in there. It\'s looking at me.'), say('slothhead', 'Uh huh huh. Plunge it, dumbass. Show it who\'s boss.')]);
      S.sit('sleavis', A.toilet[0], A.toilet[1] + 0.3, Math.PI, 0, 'mash');
      S.shot([1.8, 2.3, 0.2], [3.6, 0.6, -2.6], 0.4);
      yield* S.minigame('plunger', { who: 'sleavis', need: 6 });
      S.stand('sleavis', A.toilet[0] - 0.5, A.toilet[1] + 1.2);
      S.free();
      plunged = true;
      yield* S.lines([say('sleavis', 'Heh heh. It\'s free! The chicken is FREE!'), say('slothhead', 'Uh huh huh. You smell like a KFC dumpster.'), say('sleavis', 'Heh heh. Thank you.')]);
      S.objective('CHILL OUT. MAYBE WATCH TV? THEN BED.');
    } });
    Stage.hot({ x: A.tv[0], z: A.tv[1], r: 1.4, label: 'WATCH THE SCRAMBLED CHANNEL', act: function* (S) {
      S.sfx('static');
      S.shot([0.2, 1.4, 0.8], [0.8, 1.2, 2.9], 0.4);
      yield* S.lines([
        say('tv', '(KSSSHHH) ...gently... (KSSHH) ...and now we baste... (KSSHHH) ...the HAM...'),
        say('sleavis', 'Heh heh. Is that a boob?'),
        say('slothhead', 'No, dumbass. It\'s a... (squints)... it\'s an elbow. Uh huh huh. Still counts.'),
        say('tv', '(KSSHH) ...thirty minutes at three-fifty... (KSSHH)... COOKING WITH CARL...'),
        say('sleavis', 'Heh heh. Hot.'),
        say('slothhead', 'Uh huh huh. Yeah. Three-fifty.')
      ]);
      S.free();
    } });
    Stage.hot({ x: -1.5, z: -0.6, r: 1.6, label: 'SHAKE-O-MATIC BED (25C)', act: function* (S, h, L) {
      S.sit(L.id, -1.5, -1.6, 0, 0.62, L.id === 'sleavis' ? 'flail' : 'laugh');
      S.shot([1.6, 2.2, 1.6], [-1.5, 0.8, -1.6], 0.3);
      S.sfx('pump');
      yield* S.until(() => { S.sfx('pump'); return true; });
      Game.shake(0.05, 3);
      yield* S.wait(1.2);
      yield* S.lines(L.id === 'sleavis' ? [say('sleavis', 'Heh heh heh heh! It\'s like a ride! It\'s like a ride that\'s a BED!'), say('slothhead', 'Uh huh huh. Doug said the last guy in here broke it. With his... uh... enthusiasm.')] : [say('slothhead', 'Uh huh huh. Uh huh huh. Uh huh huh. This is how my voice sounds all the time inside.'), say('sleavis', 'Heh heh. You sound like a broken lawnmower.')]);
      S.stand(L.id, -0.2, -0.4);
      S.free();
    } });
    joke(-3.0, -2.0, 'PHONE / BIBLE', [say('sleavis', 'Heh heh. Someone wrote in the Bible. "FOR A GOOD TIME CALL 555-0138."'), say('slothhead', 'Uh huh huh. Call it!'), say('phone', '(ring ring) "No-Tell Motel, this is Doug." ...'), say('sleavis', 'Heh heh. Doug! Is this the good time?'), say('phone', '"...I\'ve been here for eleven years. I wrote that. It\'s a cry for help." (click)')], [say('slothhead', 'Uh huh huh. A Bible. There\'s a hair in it. A long one.'), say('sleavis', 'Heh heh. It\'s a sign from God.'), say('slothhead', 'Uh huh huh. God has a mullet.')]);
    let sleep = false;
    Stage.hot({ x: -1.5, z: 0.2, r: 1.2, label: 'GO TO BED', cond: () => plunged, act: () => { sleep = true; } });
    yield* S.until(() => sleep);
    Modes.stop();
    S.sit('sleavis', -1.9, -1.9, 0, 0.66, 'ko'); S.sit('slothhead', -1.1, -1.3, 0, 0.66, 'ko');
    S.shot([1.5, 2.6, 1.8], [-1.5, 0.6, -1.6], 0.6);
    yield* S.lines([say('sleavis', 'Heh heh. Night, Slutt-Head.'), say('slothhead', 'Don\'t call me that in BED, dumbass.'), say('sleavis', 'Heh heh. ...Night, Slutt-Head.'), 1.0]);
    S.music(null);
    yield* S.fade(1, 1.2);
    yield* S.wait(0.8);
    S.sfx('door');
    yield* S.fade(0, 0.6);
    yield* S.lines([say('lyle', '(OUTSIDE) Dwayne. DWAYNE. That\'s their van. The one with no roof and the sloth on it.'), say('dwayne', '(OUTSIDE) Duh, should we knock?'), say('lyle', '(OUTSIDE) We\'re CRIMINALS, Dwayne. We don\'t KNOCK. Check every room.'), say('slothhead', '...Uh huh huh. Sleavis. Wake up. It\'s those jerky guys.'), say('sleavis', 'Heh heh. ...Five more minutes.'), say('slothhead', 'We gotta sneak out to the van. Quietly.'), say('sleavis', 'Heh heh. I\'m GREAT at quietly.'), say('slothhead', 'You\'re not great at anything.'), say('sleavis', 'Heh heh. Thank you.')]);
  },

  // 3-3 sneak across the courtyard
  function* (S) {
    const A = yield* S.load(Areas.motel);
    S.music('base');
    Game.spawnHeroes([A.room6[0], A.room6[1] + 0.4, Math.PI * 0.25], [A.room6[0] - 1, A.room6[1] + 0.2, Math.PI * 0.25]);
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false, graffiti: Game.flags.graffiti, solid: true });
    const lyle = S.spawn('lyle', -6, 6, 0, { id: 'lyle' });
    lyle.path = [[-12, 6, 1.5, Math.PI], [-12, -3, 1, -Math.PI / 2], [6, -4, 1.5, 0], [6, 6, 1]];
    lyle.speed = 2.2; lyle.range = 7; lyle.fov = 1.2;
    const dwayne = S.spawn('dwayne', 9, -2, 0, { id: 'dwayne' });
    dwayne.path = [[9, -3, 2, Math.PI], [16, -3, 1.2], [16, 5, 2, Math.PI / 2], [9, 5, 1.2]];
    dwayne.speed = 1.8; dwayne.range = 6.5; dwayne.fov = 1.4;
    for (const g of [lyle, dwayne]) g.lookAround = true;
    if (!S.tries) yield* S.lines([say('slothhead', 'Uh huh huh. OK. Hide in the bushes when they look. Hold still in a bush and they can\'t see you.'), say('sleavis', 'Heh heh. Like a ninja. A sloth ninja. A SLINJA.')]);
    S.objective('SNEAK TO THE VAN — STAND STILL IN BUSHES TO HIDE');
    let made = false;
    yield* S.play('action', {
      yaw: 0, dist: 6.5, height: 10, combat: false, special: false, sneak: true, guards: [lyle, dwayne],
      bustedMsg: LP.pick(DEATH.busted),
      goal: () => { const L = Game.leaderActor(); return Math.hypot(L.x - A.van[0], L.z - A.van[1]) < 3; }
    });
  },

  // 3-4 the parking-lot brawl
  function* (S) {
    const A = yield* S.load(Areas.motel);
    S.music('brawl');
    Game.spawnHeroes([A.van[0] - 3, A.van[1] - 2, Math.PI], [A.van[0] - 1.5, A.van[1] - 2.8, Math.PI]);
    Game.healHeroes();
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false, graffiti: Game.flags.graffiti, solid: true });
    const lyle = goon(S, 'lyle', 6, 3, { id: 'lyle', hp: 7, dmg: 1.2, stayDown: true });
    const dwayne = goon(S, 'dwayne', 8, 6, { id: 'dwayne', hp: 11, dmg: 1.6, speed: 2.2, stayDown: true, weight: 1.6 });
    S.shot([A.van[0] - 8, 2.6, A.van[1] + 4], [6, 1.2, 3], 0);
    yield* S.lines([
      say('lyle', 'Well, well, well. If it ain\'t the Sloth Gang.'),
      say('sleavis', 'Heh heh. We\'re a gang!'),
      say('lyle', 'Hand over the package, boys. Mr. Fontaine wants his remote.'),
      say('slothhead', 'Uh huh huh. Get your own remote, butt-munch. This one\'s OURS. We found it.'),
      say('dwayne', 'Lyle, they\'re refusing. They\'re refusing like PROFESSIONALS.'),
      say('lyle', 'Then we do this the hard way.'),
      say('sleavis', 'Heh heh. He said hard.')
    ]);
    if (!S.tries) S.toast('PUNCH: {punch}   JUMP: {jump}   PICK UP / THROW: {use}   SPECIAL: {special}', '#ffe040');
    const r = S.mode('action', { yaw: 0, dist: 8, height: 5, combat: true });
    // motel weirdos join in, because it's 3 AM and this is what they do here
    yield* S.wait(4, { free: true });
    const t1 = goon(S, LOOK_TOWEL, -3, -6, { hp: 3 });
    const t2 = goon(S, LOOK_CHICKEN, 2, -6, { hp: 4 });
    HUD.bark('slothhead', 'Uh huh huh. The other guests are joining in.');
    HUD.toast('ROOMS 3 AND 9 HAVE ENTERED THE CHAT', '#ff80ff');
    yield* S.until(() => Modes.enemiesLeft() <= 1 || r.result);
    if (r.result && r.result.fail) S.fail(r.result.msg);
    const t3 = goon(S, LOOK_TOWEL, -6, 8, { hp: 3 });
    yield* S.until(() => Modes.enemiesLeft() === 0 || r.result);
    if (r.result && r.result.fail) S.fail(r.result.msg);
    Modes.stop();
    S.music('motel');
    const doug = S.spawn('doug', -8, -2, Math.PI / 2, { id: 'doug' });
    S.shot([0, 2.2, 10], [4, 1.1, 4], 0.6);
    yield* S.lines([
      say('doug', '...'),
      say('doug', 'I\'m going to write this in the log as "a raccoon thing."'),
      say('sleavis', 'Heh heh. Thanks, Doug!'),
      say('doug', 'Please. Leave. Checkout is now. Checkout is RIGHT now.'),
      say('slothhead', 'Uh huh huh. Can we get a continental breakfast?'),
      say('doug', 'The breakfast is the guy in the towel. He\'s been here since 1994. Please. GO.')
    ]);
  }
] });

// ======================================================================= CHAPTER 4
CHAPTERS.push({ title: 'TRUCK STOP OF THE DAMNED', segs: [
  // 4-1 Big Earl's Fuel & Fajitas
  function* (S) {
    const A = yield* S.load(Areas.truckstop);
    S.music('truckstop');
    Game.spawnHeroes([A.door[0] + 0.5, A.door[1] - 0.6, Math.PI], [A.door[0] - 0.6, A.door[1] - 0.6, Math.PI]);
    const doug = S.spawn('doug', A.register[0] - 0.9, A.register[1], Math.PI / 2, { id: 'doug' });
    const earl = S.spawn('earl', A.earl[0], A.earl[1], 0, { id: 'earl' });
    S.sit(earl, 8.4, -3.4 + 0.8, Math.PI, 0.45, 'sit');
    for (let i = 0; i < 3; i++) { const t = S.spawn(i === 1 ? LOOK_CHICKEN : 'trucker', -5.4 + i * 2.2, -1.6, Math.PI, { id: 'trucker' + i }); S.sit(t, -5.4 + i * 2.2, -1.6, Math.PI, 0.35, 'sit'); }
    if (!S.tries) yield* S.card('CHAPTER 4', 'TRUCK STOP OF THE DAMNED', 'OKLAHOMA. BIG EARL\'S FUEL & FAJITAS. THE FAJITAS ARE A RUMOR.');
    S.mode('action', { yaw: 0, dist: 6.5, height: 4.2 });
    if (!S.tries) yield* S.lines([say('slothhead', 'Uh huh huh. We\'re out of money. And gas. And Sleavis smells like chicken.'), say('sleavis', 'Heh heh. I smell DELICIOUS.')]);
    S.objective('FIND A WAY TO GET MONEY');
    joke(A.register[0] + 0.8, A.register[1], 'TALK TO CASHIER', [say('doug', 'Oh no. Not you two.'), say('sleavis', 'Heh heh. DOUG! What are you doing here?'), say('doug', 'I got fired. From the motel. For "letting a raccoon thing happen." I drove four hundred miles to get away from my life.'), say('doug', 'And here you are. In my new life.'), say('sleavis', 'Heh heh. It\'s like fate.'), say('doug', 'It\'s like a curse.')], [say('doug', 'Please don\'t talk to me.'), say('slothhead', 'Uh huh huh. Can we have a free fajita?'), say('doug', 'There are no fajitas. There have never been fajitas. The sign is a lie. Like everything.')]);
    joke(A.earl[0] + 1.5, A.earl[1] + 1.5, 'TALK TO THE TRUCKER', [say('earl', 'You boys look like you crawled out of a petting zoo\'s septic tank.'), say('sleavis', 'Heh heh. Thank you.'), say('earl', 'Name\'s Earl. This here\'s my truck stop. I been eatin\' the chili here for forty years. My doctor says I got the heart of a sixty-year-old.'), say('sleavis', 'Heh heh. How old are you?'), say('earl', 'Forty-one.')], [say('slothhead', 'Uh huh huh. Are you Big Earl?'), say('earl', 'I\'m Big Earl. My daddy was Bigger Earl. My granddaddy was just "The Truck."'), say('slothhead', 'Uh huh huh. Cool.'), say('earl', 'You wanna make fifty bucks, son? Beat me at the chili challenge. Nobody\'s beat me in eleven years.')]);
    // the arcade: optional, but Sleavis can't resist
    let played = false;
    Stage.hot({ x: A.arcade[0], z: A.arcade[1], r: 1.3, label: 'PLAY SLOTH INVADERS 2000', cond: () => !played, act: function* (S, h, L) {
      yield* S.say(L.id, L.id === 'sleavis' ? 'Heh heh. Sloth Invaders! I\'m like, a legend at this.' : 'Uh huh huh. Watch a master, Sleavis.');
      S.sit(L.id, A.arcade[0], A.arcade[1], Math.PI / 2, 0, 'mash');
      const r = yield* S.minigame('arcade', { who: L.id, goal: 1200, soft: true });
      S.stand(L.id, A.arcade[0] - 1, A.arcade[1]);
      S.free();
      if (r && !r.fail) {
        played = true;
        Game.pickup('sugar', A.arcade[0] - 1.6, A.arcade[1] + 0.6);
        yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh! HIGH SCORE! I\'m putting my initials! A... S... S.' : 'Uh huh huh. High score. B... U... T... T. Uh huh huh. I ran out of letters.'), say('sign', '(The machine dispenses a prize: a SUGAR BOMB of unknown age.)')]);
      } else yield* S.say(L.id === 'sleavis' ? 'slothhead' : 'sleavis', L.id === 'sleavis' ? 'Uh huh huh. You suck at video games.' : 'Heh heh. You got beat by BURGERS, Slutt-Head.');
    } });
    let enter = false;
    Stage.hot({ x: A.contest[0], z: A.contest[1], r: 1.4, label: 'ENTER THE CHILI CHALLENGE', act: function* (S, h, L) {
      if (L.id !== 'sleavis') { yield* S.lines([say('slothhead', 'Uh huh huh. Sleavis should do it. He\'ll eat anything. He ate batteries.'), say('sleavis', 'Heh heh. And a crayon. In fourth grade.'), say('slothhead', 'Uh huh huh. And in tenth grade.')]); }
      enter = true;
    } });
    yield* S.until(() => enter);
  },

  // 4-2 the Burn Ward Chili Challenge
  function* (S) {
    const A = yield* S.load(Areas.truckstop);
    S.music('truckstop');
    Game.spawnHeroes([A.contest[0] - 0.5, A.contest[1] + 0.9, Math.PI], [A.contest[0] - 2.2, A.contest[1] + 1.2, Math.PI * 0.8]);
    const earl = S.spawn('earl', A.contest[0] + 0.6, A.contest[1] + 0.9, Math.PI, { id: 'earl' });
    const doug = S.spawn('doug', A.contest[0] + 2.3, A.contest[1] + 0.4, -Math.PI / 2, { id: 'doug' });
    for (const x of [-0.4, 0.6]) Mk.cyl(Stage.cur.root, 0.2, 0.15, 0.15, '#a03010', A.contest[0] + x, 0.81, A.contest[1] + 0.2, { seg: 8 });
    S.shot([A.contest[0] + 0.6, 1.9, A.contest[1] - 2.8], [A.contest[0] - 0.2, 1.1, A.contest[1] + 0.9], 0);
    if (!S.tries) yield* S.lines([
      say('doug', 'The Burn Ward Chili Challenge. Twenty-four spoons. No napkins. No mercy. Sign the waiver.'),
      say('sleavis', 'Heh heh. I can\'t read.'),
      say('doug', 'That\'s fine. It just says "we\'re not responsible for what happens to your soul."'),
      say('earl', 'Eleven years, boy. Eleven years undefeated. This chili\'s got ghost peppers, Carolina reapers, and something we found behind the dumpster.'),
      say('sleavis', 'Heh heh. Sounds like breakfast.'),
      say('doug', 'Ready... set... please don\'t die on my shift.')
    ]);
    yield* S.minigame('chili', { who: 'sleavis', foeRate: 1.55, foeName: 'EARL', foe: earl });
    S.sfx('cheer');
    yield* S.lines([
      say('earl', '...'),
      say('earl', 'Son. I ain\'t been beat in eleven years.'),
      say('sleavis', 'Heh heh. I can\'t feel my face. Heh heh. Or my butt. Is my butt still there?'),
      say('earl', 'Here\'s your fifty dollars. You earned it. Your colon\'s gonna need it.'),
      say('slothhead', 'Uh huh huh. We\'re rich again. Fifty three seventeen.'),
      say('earl', 'Where you boys headed?'),
      say('slothhead', 'Lost Wages. Uh huh huh. We\'re gonna score.'),
      say('earl', 'Well. Good luck with all of... that.')
    ]);
    Game.money = (Game.money || 3.17) + 50;
  },

  // 4-3 the van is gone. hitchhiking.
  function* (S) {
    const A = yield* S.load(Areas.truckLot);
    S.music('home');
    Game.spawnHeroes([-3, -5, Math.PI], [-1.6, -5.4, Math.PI]);
    const note = Mk.box(Stage.cur.root, 0.4, 0.02, 0.3, '#f0f0e0', -2.2, 0.07, -6.5);
    S.shot([-0.5, 2.6, -1.5], [-2.4, 0.8, -6.4], 0.0);
    yield* S.lines([
      say('slothhead', 'Uhh... where\'s the van?'),
      say('sleavis', 'Heh heh. It ran away. It was sad.'),
      say('slothhead', 'There\'s a note. "WE GOT YOUR VAN. BRING THE REMOTE TO THE RUSTY SPITTOON IN TEXAS. — L AND D."'),
      say('sleavis', 'Heh heh. L and D. Like... LSD.'),
      say('slothhead', 'Uh huh huh. They spelled Spittoon with three T\'s.'),
      say('sleavis', 'Heh heh. Joke\'s on them. The remote\'s in your suit.'),
      say('slothhead', 'Uh huh huh. Yeah. I keep it in my pouch. Next to my other remote.'),
      say('sleavis', 'Heh heh. You have TWO remotes?'),
      say('slothhead', 'I brought the old one from home too, dumbass. In case this one breaks.'),
      say('sleavis', 'Heh heh. The old one doesn\'t have batteries. I ATE them.'),
      say('slothhead', 'Uh huh huh. It\'s for backup.'),
      say('slothhead', 'We gotta hitchhike. I\'ll do it. I\'m like, irresistible.')
    ]);
    Game.flags.twoRemotes = true;
    yield* S.walkAll([['slothhead', A.stand[0], A.stand[1]], ['sleavis', A.stand[0] - 1.4, A.stand[1] + 1.0]]);
    S.face('slothhead', Math.PI / 2 + 0.5); S.face('sleavis', Math.PI / 2 + 0.6);
    S.shot([A.stand[0] - 1.8, 2.3, A.stand[1] + 5.5], [A.stand[0] + 4, 1.4, A.stand[1] - 8], 0.6);
    yield* S.wait(0.7);
    const r = yield* S.minigame('hitch', { who: 'slothhead', roadX: 8.4 });
    S.free();
    yield* S.lines([
      say('earl', '(FROM THE TRUCK) I ain\'t stoppin\' for... that.'),
      say('earl', '...'),
      say('earl', 'Aw, hell. Get in. Sloth suits STAY ON.'),
      say('slothhead', 'Uh huh huh. Told you. Irresistible.'),
      say('sleavis', 'Heh heh. It was the leg.')
    ]);
  },

  // 4-4 Earl falls asleep. Sleavis drives the 18-wheeler.
  function* (S) {
    yield* S.load(Areas.empty, { sky: '#0a0a20', fog: '#141428', near: 30, far: 130, light: { sky: '#6070c0', ground: '#201820', sun: '#a0b0ff', sunI: 0.9, sunPos: [-6, 12, -8], rimI: 1.5 } });
    Game.spawnHeroes(null, null, 'both');
    S.music('drive');
    if (!S.tries) yield* S.lines([say('earl', 'Been drivin\' forty hours, boys. I\'m gonna rest my eyes. Wake me up in Texas.'), say('earl', '(SNORE)'), say('sleavis', 'Heh heh. Slutt-Head. He\'s asleep. Who\'s driving?'), say('slothhead', 'Uh huh huh. ...You are.'), say('sleavis', 'Heh heh heh heh heh. COOL.')]);
    yield* S.play('drive', {
      theme: 'interstate', vehicle: 'semi', length: 3000, traffic: 0.6, destination: 'THE RUSTY SPITTOON, TX', driver: 'sleavis', hp: 7, max: 30,
      billboards: ['TEXAS:\nIT\'S BIGGER\n(THAT\'S ALL)', 'DON\'T MESS\nWITH TEXAS\n(SERIOUSLY)', 'BBQ\nGUNS\nDIVORCE\nNEXT EXIT', 'THE RUSTY\nSPITTOON\n12 MI\nNO SLOTHS'],
      radio: ['K-COW 102.5: TRUCKIN\' TUNES AND CATTLE AUCTIONS. NOW: "MY TRUCK LEFT ME FOR ANOTHER TRUCK."'],
      events: [
        { at: 100, bark: ['sleavis', 'Heh heh heh! I\'m driving a TRUCK! I\'m a TRUCKER! Breaker breaker!'] },
        { at: 450, bark: ['slothhead', 'Uh huh huh. Stay in the lane, dumbass. There\'s like, a whole lane.'] },
        { at: 900, fn: (m) => { m.chaser = Props.copcar(Stage.cur.root, m.x, m.z + 40, Math.PI); m.cfg.chaser = 'cops'; m.chaserGap = 40; m.chaserX = m.x; m.cfg.chaserSpeed = 25; GameAudio.sfx('siren'); HUD.bark('slothhead', 'Uhh... cops. Don\'t stop. Truckers never stop.'); } },
        { at: 1300, bark: ['earl', '(SNORE) ...mama... the chili... (SNORE)'] },
        { at: 1800, radio: 'POLICE SCANNER: 18-WHEELER DRIVEN BY WHAT APPEARS TO BE A LARGE HAMSTER. DO NOT ENGAGE. IT IS LAUGHING.' },
        { at: 2500, bark: ['sleavis', 'Heh heh. I see a sign for the Rusty Spittoon. With THREE T\'s.'] }
      ],
      wreckMsg: 'You jackknifed Earl\'s rig across three lanes. Earl woke up, looked around, and went back to sleep.'
    });
  }
] });

// ======================================================================= CHAPTER 5
CHAPTERS.push({ title: 'THE RUSTY SPITTOON', segs: [
  // 5-1 the parking lot
  function* (S) {
    const A = yield* S.load(Areas.barLot);
    S.music('bar');
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    Props.van(Stage.cur.root, A.van[0], A.van[1], 0.3, { roof: false, graffiti: Game.flags.graffiti, solid: true });
    if (!S.tries) yield* S.card('CHAPTER 5', 'THE RUSTY SPITTOON', 'TEXAS. A BAR SO TOUGH THE COCKROACHES WEAR LEATHER.');
    S.mode('action', { yaw: 0, dist: 7, height: 4.3 });
    if (!S.tries) yield* S.lines([say('sleavis', 'Heh heh. There\'s our van! Behind the bar!'), say('slothhead', 'Uh huh huh. It\'s locked. Those jerky guys are inside. With our keys.'), say('sleavis', 'Heh heh. Let\'s go in and ask nicely.'), say('slothhead', 'Uh huh huh. Yeah. Bikers love nice.')]);
    S.objective('GO INSIDE THE RUSTY SPITTOON');
    joke(A.van[0] - 1.5, A.van[1] + 1.5, 'CHECK THE VAN', 'Heh heh. They put a pine tree air freshener in it. It smells like a forest that died.', 'Uh huh huh. Locked. And somebody wrote "LYLE\'S" on our van. Uh huh huh. Under "SLOTHS RULE."');
    let inside = false;
    S.trigger({ x: A.door[0], z: A.door[1] + 0.5, r: 1.6, act: () => { inside = true; } });
    yield* S.until(() => inside);
    if (Game.flags.bikesDown) yield* S.lines([say('slothhead', 'Uh huh huh. We should probably not mention the bikes.'), say('sleavis', 'Heh heh. What bikes?'), say('slothhead', 'Uh huh huh. Exactly.')]);
  },

  // 5-2 inside: Big Mama Krull
  function* (S) {
    const A = yield* S.load(Areas.bar);
    S.music('bar');
    Game.spawnHeroes([A.door[0] + 1, A.door[1], Math.PI / 2], [A.door[0] + 0.5, A.door[1] + 1, Math.PI / 2]);
    const mama = S.spawn('bigmama', -8, -1.6, Math.PI, { id: 'bigmama' });
    const lyle = S.spawn('lyle', 3, 2.2, -Math.PI / 2, { id: 'lyle' });
    const dwayne = S.spawn('dwayne', 5.4, 2.4, Math.PI / 2, { id: 'dwayne' });
    for (let i = 0; i < 4; i++) { const b = S.spawn('biker', -14 + i * 2.4, -2.6, Math.PI, { id: 'biker' + i }); S.sit(b, -14 + i * 2.4 - (i > 1 ? 1.2 : 0), -2.6, Math.PI, 0.45, 'sit'); }
    S.mode('action', { yaw: 0, dist: 7, height: 4 });
    if (!S.tries) {
      S.shot([4, 2, 7], [4.2, 1.2, 2.3], 0);
      yield* S.lines([say('dwayne', 'Lyle. Lyle. Those are the sloths.'), say('lyle', 'Naw, Dwayne. Those are just... regular sloths. The professionals wouldn\'t walk in here. That\'d be STUPID.'), say('dwayne', 'Duh. Yeah. Stupid.')]);
      S.free();
    }
    S.objective('TALK TO WHOEVER IS IN CHARGE');
    let sing = false;
    Stage.hot({ x: mama.x, z: mama.z + 1, r: 1.7, label: 'TALK TO BIG MAMA', act: function* (S, h, L) {
      S.shot([mama.x + 2.5, 1.9, mama.z + 4], [mama.x, 1.4, mama.z], 0.5);
      yield* S.lines([say('bigmama', 'Well, well. Two little furballs. In MY bar.'), say('bigmama', 'I\'m Big Mama Krull. I run this place. I run this town. I ran over the last guy who wore a costume in here. Twice.')]);
      const i = yield* S.choose(L.id, [
        '"Uh huh huh. We\'re like, bikers too."',
        '"Heh heh. Nice tattoo. Does it go all the way down?"',
        '"Those jerky guys stole our van. Please help us."',
        '"Uh huh huh. Wanna make out?"'
      ]);
      if (i === 0) yield* S.lines([say(L.id, 'We\'re like, bikers too.'), say('bigmama', 'What do you ride?'), say(L.id, L.id === 'sleavis' ? 'Heh heh. The bus. Sometimes.' : 'Uh huh huh. A van. That\'s like a bike with a roof. Ours doesn\'t have a roof.'), say('bigmama', 'Huh. That\'s almost respectable.')]);
      if (i === 1) yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh. Nice tattoo. Does it go all the way down?' : 'Uh huh huh. Nice tattoo. Does it go all the way down?'), say('bigmama', 'It says MOTHER. You want to see where the R is?'), say(L.id, '...No ma\'am.')]);
      if (i === 2) yield* S.lines([say(L.id, 'Those jerky guys stole our van.'), say('bigmama', 'In Texas we don\'t call the cops, son. We call it "a Tuesday."')]);
      if (i === 3) yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh. Wanna make out?' : 'Uh huh huh. Wanna make out?'), say('bigmama', '...'), say('bigmama', 'The last man who asked me that is buried under the pool table. He\'s the reason it\'s level.')]);
      yield* S.lines([say('bigmama', 'Tell you what. It\'s karaoke night. Newcomers sing... or bleed.'), say('bigmama', 'You make my boys cry tears of joy, I\'ll get you your keys back. You make \'em cry the other kind...'), say('sleavis', 'Heh heh. We\'re gonna sing! We\'re gonna ROCK!'), say('slothhead', 'Uh huh huh. I\'ll do the guitar. You do the... uh... head thing.'), say('sleavis', 'Heh heh. I\'m GREAT at the head thing.')]);
      sing = true;
    } });
    yield* S.until(() => sing);
  },

  // 5-3 karaoke: SLOTH BUTT BOOGIE
  function* (S) {
    const A = yield* S.load(Areas.bar);
    S.music(null);
    Game.spawnHeroes([0, 0], [0, 0]);
    S.sit('slothhead', A.stage[0] - 1, A.stage[1], Math.PI * 0.85 + 0.3, 0.6, 'guitar');
    S.sit('sleavis', A.stage[0] + 1, A.stage[1] - 0.2, Math.PI * 1.1 + 0.3, 0.6, 'headbang');
    Game.hero('slothhead').face = Game.hero('slothhead').faceT = 0.3; Game.hero('sleavis').face = Game.hero('sleavis').faceT = -0.3;
    const crowd = [];
    for (let i = 0; i < 6; i++) crowd.push(S.spawn(i === 0 ? 'bigmama' : i < 3 ? 'biker' : LOOK_CHICKEN, 12 + (i % 3) * 1.8, 1.4 + Math.floor(i / 3) * 1.4, Math.PI * 0.85, { id: 'crowd' + i }));
    S.spawn('lyle', 9.5, 2.5, Math.PI * 0.6, { id: 'lyle' }); S.spawn('dwayne', 8.6, 1.4, Math.PI * 0.6, { id: 'dwayne' });
    S.shot([A.stage[0] - 1.5, 2.4, A.stage[1] + 7.5], [A.stage[0], 1.6, A.stage[1]], 0);
    if (!S.tries) yield* S.lines([say('sleavis', 'Heh heh. This one\'s called "SLOTH BUTT BOOGIE." It\'s about butts.'), say('slothhead', 'Uh huh huh. And sloths.'), say('sleavis', 'Heh heh. Hit it, Slutt-Head!'), say('slothhead', 'DON\'T call me that ON STAGE!')]);
    const r = yield* S.minigame('rhythm', { players: ['slothhead', 'sleavis'], crowd, bars: 22, after: 'bar', title: 'KARAOKE OF DOOM', failMsg: 'Big Mama hated it. The jukebox hated it. A biker cried, but the wrong kind of crying. You were thrown through the window.' });
    S.sfx('cheer');
    yield* S.lines([
      say('bigmama', '...'),
      say('bigmama', 'That was the worst thing I ever heard.'),
      say('bigmama', 'I LOVED it.'),
      say('bigmama', 'Lyle! Give these boys their keys!'),
      say('lyle', 'Like hell! That van is Mr. Fontaine\'s property! And so is that REMOTE!'),
      say('bigmama', 'Nobody tells Big Mama "like hell" in her own bar. BOYS!'),
      say('dwayne', 'Uh oh.'),
      say('sleavis', 'Heh heh. BAR FIGHT!')
    ]);
  },

  // 5-4 the bar brawl (side-scrolling)
  function* (S) {
    const A = yield* S.load(Areas.bar);
    S.music('brawl');
    Game.spawnHeroes([-19, 1, Math.PI / 2], [-20, 2.4, Math.PI / 2]);
    Game.healHeroes();
    if (!S.tries) S.toast('A BAR FIGHT! EVERYBODY HATES EVERYBODY. THROW CHAIRS ({use})!', '#ffe040');
    const m = S.mode('action', { camera: 'side', side: { z: 8.5, y: 2.6, lookY: 1.4 }, camX: [-15, 15], combat: true });
    const wave = (list) => list.forEach((w) => goon(S, w[0], w[1], w[2], w[3]));
    wave([['biker', -12, 0, { hp: 4, face: -Math.PI / 2 }], ['biker', -10, 2.5, { hp: 4 }], [LOOK_CHICKEN, -13, 3, { hp: 3 }]]);
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    S.bark('sleavis', 'Heh heh! This is the best bar EVER!');
    wave([['biker', 2, -1, { hp: 5, missile: 'bottle', ai: Actor.AI.thrower }], ['biker', 6, 2, { hp: 5 }], ['lyle', 8, 1, { id: 'lyle', hp: 8, dmg: 1.2 }], [LOOK_TOWEL, 4, 3, { hp: 3 }]]);
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    // Dwayne. All of Dwayne.
    Game.pickup('beer', 4, 1); Game.pickup('beer', 9, -1); Game.pickup('burrito', 12, 2);
    const dw = goon(S, 'dwayne', 16, 0, { id: 'dwayne', hp: 19, dmg: 1.6, speed: 2.4, weight: 2.2, boss: true, windupT: 0.45, aggression: 1.3 });
    S.bark('dwayne', 'Dwayne SMASH. ...Duh, that\'s what Lyle told me to say.');
    HUD.toast('BOSS: DWAYNE (ALL OF HIM)', '#ff6060');
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    const mama = S.spawn('bigmama', 10, 0, -Math.PI / 2, { id: 'bigmama' });
    S.shot([8, 2.4, 7], [10, 1.2, 0], 0.5);
    yield* S.lines([
      say('bigmama', 'Now THAT is how you say goodnight in Texas.'),
      say('bigmama', 'Here. Your keys. Lyle had \'em in his boot. I don\'t wanna know why.'),
      say('sleavis', 'Heh heh. Thanks, Big Mama! You\'re like, the coolest mom.'),
      say('bigmama', 'I\'m not your mom.'),
      say('sleavis', 'Heh heh. I know. My mom\'s not cool.'),
      say('bigmama', 'Get outta here before I change my mind. And boys? Whatever that remote is... it\'s been beepin\' all night.'),
      say('slothhead', 'Uh huh huh. It does that. It\'s like, sensitive.')
    ]);
  }
] });

// ======================================================================= CHAPTER 6
CHAPTERS.push({ title: 'CORN DOG CANYON', segs: [
  // 6-1 the tourist trap: Wade, Slaria
  function* (S) {
    const A = yield* S.load(Areas.cornDog);
    S.music('tourist');
    Game.spawnHeroes([A.start[0], A.start[1], Math.PI], [A.start2[0], A.start2[1], Math.PI]);
    const wade = S.spawn('wade', A.shop[0], A.shop[1] + 0.8, 0, { id: 'wade' });
    const sl = S.spawn('slaria', -10.5, 9, -Math.PI / 2 + 0.3, { id: 'slaria' });
    S.sit(sl, -10.5, 9.4, -Math.PI / 2 + 0.3, 0.12, 'sit');
    Mk.box(Stage.cur.root, 1.6, 0.45, 0.6, 'planks', -10.5, 0, 9.4);
    for (let i = 0; i < 4; i++) { const t = S.spawn(i === 3 ? 'kid' : 'tourist', -6 + i * 4, -6 + (i % 2) * 3, LP.rand(0, 6), { id: 'tourist' + i }); t.ai = Actor.AI.wander; }
    if (!S.tries) yield* S.card('CHAPTER 6', 'CORN DOG CANYON', 'NEW MEXICO. HOME OF THE WORLD\'S LARGEST CORN DOG. AND NOTHING ELSE.');
    S.mode('action', { yaw: 0, dist: 7.5, height: 4.6 });
    S.objective('LOOK AROUND. TALK TO THE LOCALS.');
    let wadeDone = false, slariaDone = false;
    Stage.hot({ x: wade.x, z: wade.z + 0.8, r: 1.8, label: 'TALK TO TINFOIL GUY', act: function* (S, h, L) {
      S.shot([wade.x + 3, 1.8, wade.z + 4], [wade.x, 1.3, wade.z], 0.5);
      if (wadeDone) { yield* S.lines([say('wade', LP.pick(['The moon landing was real. That\'s what they WANT you to think I think.', 'Birds are drones. Except pigeons. Pigeons are just disgusting.', 'Every billboard in America is a hidden antenna. Read them backwards. ...That\'s why they don\'t make sense.']))]); S.free(); return; }
      yield* S.lines([
        say('wade', 'Welcome to Gifts and Truth! I\'m Wade. We got tinfoil hats, corn dog keychains, and the TRUTH, which is free, because THEY can\'t tax it.'),
        say('wade', '...'),
        say('wade', 'WHERE DID YOU GET THAT?!'),
        say('slothhead', 'Uh huh huh. Get what?'),
        say('wade', 'THAT\'S A P.A.T.R.I.O.T. UPLINK! Personal Airborne Targeting Remote for Incinerating Orbital Targets! It controls the government\'s orbital death mirror! Every button is a city block!'),
        say('slothhead', 'Uh huh huh. It\'s a TV remote.'),
        say('wade', 'Then what\'s on channel nine?'),
        say('slothhead', 'Uh huh huh. Let\'s find out.')
      ]);
      S.anim('slothhead', 'point'); S.sfx('click');
      S.shot([wade.x + 12, 6, wade.z + 10], [16, 1, 5], 0.8);
      FX3.laser(16, 5, null, { delay: 0.8, size: 2.5 });
      yield* S.wait(1.3);
      Game.damage(12000, new THREE.Vector3(16, 2, 5));
      Stage.cur.root.children.slice().forEach((c) => { if (c.position && c.position.x > 13 && c.position.x < 22 && c.position.z > 3 && c.position.z < 8 && c.position.y < 3) c.visible = false; });
      yield* S.wait(1.0);
      S.shot([wade.x + 3, 1.8, wade.z + 4], [wade.x, 1.3, wade.z], 0.4);
      S.anim('slothhead', null);
      yield* S.lines([
        say('wade', 'SEE?! SEE?!?! THE PETRIFIED HOT DOG FOREST IS GONE!'),
        say('slothhead', 'Uh huh huh. Reception\'s bad out here.'),
        say('sleavis', 'Heh heh. Do it again! Do the corn dog!'),
        say('wade', 'NO! Listen to me. Somebody\'s going to want that remote BAD. The government. Defense contractors. The Illuminati. Big Corn.'),
        say('wade', 'You two are whistleblowers now. You\'re heroes of the truth!'),
        say('sleavis', 'Heh heh. We\'re heroes.'),
        say('slothhead', 'Uh huh huh. We\'re just going to Lost Wages to score.'),
        say('wade', 'That\'s what a REAL whistleblower would say! Here, take a hat. It blocks the mind rays.'),
        say('sleavis', 'Heh heh. It\'s a hat made out of a burrito wrapper.')
      ]);
      wadeDone = true; S.free();
    } });
    Stage.hot({ x: -11.5, z: 9.4, r: 2, label: 'TALK TO SLARIA', act: function* (S) {
      S.face('sleavis', 'slaria'); S.face('slothhead', 'slaria');
      S.shot([-8.2, 1.7, 12.6], [-10.6, 1.0, 9.4], 0.5);
      if (slariaDone) { yield* S.lines([say('slaria', LP.pick(['My dad is trying to get a refund from the Mystery Hole. The Mystery Hole is winning.', 'Please stand in front of me. I\'m trying to stay out of my family\'s photos.', 'If you\'re going to press more buttons, please aim at the gift shop. For the culture.']))]); S.free(); return; }
      yield* S.lines([
        say('sleavis', 'Heh heh. Hey! It\'s that chick! From the bus stop!'),
        say('slaria', 'You followed me across five states.'),
        say('slothhead', 'Uh huh huh. We\'re on a road trip. To score.'),
        say('slaria', 'My parents are on a road trip to "reconnect." I\'m on a road trip to be quietly erased.'),
        say('sleavis', 'Heh heh. She said "erased." That\'s like "erect." Heh heh.'),
        say('slaria', 'No. It\'s not like that at all.'),
        say('slaria', 'Why does your remote have a NASA sticker, a skull, and a sticker that says "DO NOT LET IDIOTS NEAR THIS"?'),
        say('slothhead', 'Uh huh huh. \'Cause it\'s metal.'),
        say('slaria', 'That man in the tinfoil hat has been screaming about orbital lasers for an hour. Then a whole fake forest exploded. Doesn\'t that seem connected?'),
        say('sleavis', '...Heh heh. Forest.'),
        say('slaria', 'Who are you delivering it to?'),
        say('slothhead', 'Uh huh huh. Some guy in Lost Wages. Fontaine. He\'s gonna give us chicks.'),
        say('slaria', 'Deke Fontaine. The defense contractor. Whose satellite contract got cancelled last month. Who\'s throwing a "Freedom Fest" on the Fourth of July.'),
        say('slaria', 'You\'re delivering a doomsday remote to a disgruntled weapons manufacturer. For "chicks."'),
        say('slothhead', 'Uh huh huh. When you say it like that it sounds awesome.'),
        say('slaria', 'I\'m going to go stand in the Mystery Hole now. Don\'t follow me.'),
        say('sleavis', 'Heh heh. She wants us to follow her.'),
        say('slaria', 'I really, really don\'t.')
      ]);
      slariaDone = true; S.free();
    } });
    yield* S.until(() => wadeDone && slariaDone);
    yield* S.wait(0.6);
    // Cornelius arrives
    const corn = S.spawn('cornelius', 0, -8, 0, { id: 'cornelius' });
    S.shot([3, 2.4, -1], [0, 2.2, -8], 0.6);
    S.music('boss');
    yield* S.lines([
      say('cornelius', 'HEY! YOU TWO!'),
      say('cornelius', 'I KNOW what you are. You\'re from SLOTH WORLD. Down the road. Here to steal my gig.'),
      say('sleavis', 'Heh heh. It\'s a giant corn dog. It\'s talking.'),
      say('cornelius', 'I\'m CORNELIUS. Twenty years I\'ve been the face of Corn Dog Canyon. Twenty years of kids biting me. And now two hot-shot SLOTHS show up?'),
      say('slothhead', 'Uh huh huh. We\'re not mascots, dumbass. We just dress like this.'),
      say('cornelius', 'THAT\'S WHAT A MASCOT WOULD SAY. CORN PUPS! ATTACK!')
    ]);
  },

  // 6-2 the mascot war
  function* (S) {
    const A = yield* S.load(Areas.cornDog);
    S.music('boss');
    Game.spawnHeroes([0, 2, Math.PI], [-1.5, 2.5, Math.PI]);
    Game.healHeroes();
    const m = S.mode('action', { yaw: 0, dist: 8.5, height: 5.2, combat: true });
    for (let i = 0; i < 3; i++) goon(S, LOOK_PUP, -6 + i * 6, -5, { hp: 3, dmg: 1 });
    S.toast('CORN PUPS: KNOCK THE BATTER OUT OF THEM', '#ffb040');
    yield* S.until(() => Modes.enemiesLeft() === 0 || m.result);
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Game.pickup('beer', -6, 4); Game.pickup('beer', 6, 4); Game.pickup('sugar', 0, 6);
    const corn = goon(S, 'cornelius', 0, -7, { id: 'cornelius', hp: 26, dmg: 1.7, speed: 2.6, weight: 2.5, boss: true, ai: Actor.AI.thrower, missile: 'corndog', windupT: 0.5 });
    corn.missileDmg = 1.5; corn.r = 0.6; corn.ring = 1.4;
    for (let i = 0; i < 2; i++) goon(S, LOOK_PUP, -8 + i * 16, -2, { hp: 3 });
    HUD.toast('BOSS: CORNELIUS THE CORN DOG', '#ff6060');
    S.bark('cornelius', 'TASTE THE MUSTARD!');
    let spawned = 0;
    yield* S.until(() => {
      if (corn.hp < 20 && spawned === 0) { spawned = 1; goon(S, LOOK_PUP, 10, 4, { hp: 3 }); goon(S, LOOK_PUP, -10, 4, { hp: 3 }); HUD.bark('cornelius', 'MORE PUPS! I HAVE A UNION!'); }
      if (corn.hp < 10 && spawned === 1) { spawned = 2; HUD.bark('cornelius', 'I just wanted... to be loved... and BATTERED!'); }
      return !corn.alive || m.result;
    });
    if (m.result && m.result.fail) S.fail(m.result.msg);
    Modes.stop();
    for (const a of Stage.cur.actors.slice()) if (a.team === 'enemy' && a !== corn) a.ko();
    S.shot([3, 2.2, 3], [corn.x, 0.6, corn.z], 0.5);
    yield* S.lines([
      say('cornelius', '(ON THE GROUND) Ugh... I\'m... stale...'),
      say('sleavis', 'Heh heh. We beat up a corn dog.'),
      say('slothhead', 'Uh huh huh. Uhh... where\'s the remote?'),
      say('sleavis', 'Heh heh. You threw it. When he hit you. It went WAY up.'),
      say('slothhead', 'Up WHERE?'),
      say('sleavis', 'Heh heh. On top of the giant corn dog.'),
      say('slothhead', '...Dammit.'),
      say('slothhead', 'You climb it. You\'re good at climbing. You climbed out of a dumpster on your birthday.'),
      say('sleavis', 'Heh heh. That was a GREAT birthday.')
    ]);
  },

  // 6-3 climb the World's Largest Corn Dog (side-scrolling platforming), then... timber.
  function* (S) {
    const A = yield* S.load(Areas.cornDog, { noRV: false });
    S.music('tourist');
    // scaffolding up the front of the dog
    const root = Stage.cur.root, Z = -10.6;
    const plats = [];
    const xs = [-3, 0, 3, 5, 2.5, -0.5, -3.5, -5, -2.5, 0.5, 3.5, 5.2, 2.6, -0.4, -3.2, -5, -2.2, 0.6];
    xs.forEach((x, i) => {
      const y = 1.0 + i * 0.95;
      Mk.box(root, 2.2, 0.25, 1.6, Mat.get('planks', { color: '#a08060' }), x, y - 0.25, Z, { collide: true });
      for (const sx of [-1, 1]) Mk.box(root, 0.1, y - 0.25, 0.1, '#6a5a4a', x + sx * 1, 0, Z + 0.7);
      plats.push([x, y]);
      if (i % 4 === 2) Game.pickup('beer', x, Z, { y: y });
    });
    const top = plats[plats.length - 1];
    Mk.box(root, 3.2, 0.25, 2.4, Mat.get('planks', { color: '#a08060' }), 0, top[1] + 0.7, Z - 0.6, { collide: true });
    const remote = Mk.box(root, 0.35, 0.12, 0.6, '#202020', 0, top[1] + 0.95, Z - 0.6);
    Mk.box(root, 0.08, 0.06, 0.08, new THREE.MeshBasicMaterial({ color: '#ff2020' }), 0.05, top[1] + 1.08, Z - 0.5);
    Game.spawnHeroes([-5, Z, Math.PI / 2], null, 'sleavis');
    Game.hero('slothhead').vis.show(true); Game.hero('slothhead').gone = false;
    Game.hero('slothhead').place(-7, -7, Math.PI / 4);
    Game.hero('slothhead').pose('point');
    if (!S.tries) yield* S.lines([say('slothhead', 'Uh huh huh. Climb, dumbass. Jump from board to board.'), say('sleavis', 'Heh heh. It\'s like a video game.'), say('slothhead', 'Uh huh huh. Yeah. Like a really crappy one.')]);
    S.objective('CLIMB TO THE TOP. GET THE REMOTE.');
    S.toast('JUMP: {jump}. FALLING IS FREE. CLIMBING IS HARD.', '#ffe040');
    yield* S.play('action', {
      camera: 'side', side: { z: 9.5, y: 2.2, lookY: 1.0 }, combat: false, special: false,
      onUpdate: (dt) => { const L = Game.leaderActor(); if (L.y < 0.1 && L.x > -6 && LP.chance(dt * 0.15)) HUD.bark('slothhead', LP.pick(['Uh huh huh. You fell. Like a sack of crap.', 'Try jumping BETTER, dumbass.', 'Uh huh huh. Gravity: 1. Sleavis: 0.'])); },
      goal: () => { const L = Game.leaderActor(); return L.y > top[1] + 0.5 && Math.abs(L.x) < 1.8; }
    });
    remote.visible = false;
    S.shot([4, top[1] + 2, Z + 6], [0, top[1] + 1, Z], 0.5);
    yield* S.lines([
      say('sleavis', 'Heh heh! I got it! I\'m king of the corn dog!'),
      say('slothhead', '(FAR BELOW) Uh huh huh. Throw it down, dumbass!'),
      say('sleavis', 'Heh heh. Wait. Lemme press one. Just one.'),
      say('slothhead', '(FAR BELOW) DON\'T—')
    ]);
    S.sfx('click');
    const cd = Stage.cur.cornDog;
    S.shot([24, 12, 18], [0, 8, -14], 0.6);
    FX3.laser(0, -14, null, { y: 4, delay: 0.6, size: 3 });
    yield* S.wait(1.0);
    Game.damage(250000, new THREE.Vector3(0, 6, -14));
    // TIMBER
    const L = Game.leaderActor();
    let t = 0;
    S.sfx('crash');
    yield* S.until(() => { t += 1 / 60; cd.rotation.x = Math.min(Math.PI / 2, t * t * 0.9); L.vis.root.position.set(0, Math.max(1, top[1] * Math.cos(cd.rotation.x) + 1), -14 + top[1] * Math.sin(cd.rotation.x)); L.vis.setAnim('fall'); L.vis.update(1 / 60); return cd.rotation.x >= Math.PI / 2; }, { block: true });
    FX3.explode(new THREE.Vector3(0, 1, 2), 3);
    Game.shake(0.5, 1);
    L.place(0, 3.5, Math.PI / 2); L.pose('ko');
    yield* S.wait(1.2);
    S.shot([6, 3, 10], [0, 1, 3], 0.6);
    yield* S.lines([
      say('sleavis', '(UNDER A CORN DOG) Heh heh... I\'m OK.'),
      say('sleavis', 'Heh heh. It\'s the World\'s LONGEST corn dog now.'),
      say('slothhead', 'Uh huh huh. Gimme the remote, dumbass. I\'m the remote guy.')
    ]);
    L.pose(null);
    Game.leader = 'slothhead';
    // meanwhile: the feds arrive. Slaria explains everything. Nobody listens.
    for (const h of Game.heroActors()) { h.vis.show(false); h.gone = true; }
    const st = S.spawn('strunk', -12, 6, Math.PI / 2, { id: 'strunk' });
    const pip = S.spawn('pip', -12.8, 7.2, Math.PI / 2, { id: 'pip' });
    const sl = S.spawn('slaria', -10, 6.6, -Math.PI / 2, { id: 'slaria' });
    S.shot([-11, 1.8, 10.5], [-11, 1.2, 6.4], 0);
    yield* S.card('', 'TWENTY MINUTES LATER', 'THE FEDS ARRIVE. AS USUAL, LATE.');
    yield* S.lines([
      say('strunk', 'Young lady. Federal agent. Two men in sloth costumes. Which way did they go?'),
      say('slaria', 'West. They have a satellite uplink they think is a TV remote. They\'re delivering it to Deke Fontaine in Lost Wages, who will probably use it to do something evil on the Fourth of July. I\'d start there.'),
      say('strunk', '...'),
      say('strunk', 'Pip. Write down "sloths. west."'),
      say('pip', 'Got it, ma\'am. Should I write down the rest?'),
      say('strunk', 'The rest was a child talking, Pip.'),
      say('slaria', 'I\'m seventeen. And right.'),
      say('strunk', 'Kid, I\'ve been doing this for twenty years. Criminals are never as stupid as they look.'),
      say('slaria', 'These two are.'),
      say('pip', 'Ma\'am, the corn dog is still on fire.'),
      say('strunk', 'Let it burn, Pip. Let it all burn.')
    ]);
  }
] });
