/* CHAPTERS (1/3) — the story. Chapter = { title, segs: [generator(S)...] }.
   Each segment builds its own scene so it can be retried; S.tries > 0 on a retry
   (long intro cutscenes are trimmed then). */
'use strict';
const CHAPTERS = [];
const H = (id) => Game.hero(id);
// common shot helper: look at the two heroes from the front-ish
function* twoShot(S, o) {
  o = o || {};
  const a = H('sleavis'), b = H('slothhead');
  const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
  const f = o.face !== undefined ? o.face : a.face;
  S.shot([cx + Math.sin(f) * (o.dist || 3.4) + Math.cos(f) * (o.side || 0.6), (o.h || 1.55) + a.y, cz + Math.cos(f) * (o.dist || 3.4) - Math.sin(f) * (o.side || 0.6)], [cx, 1.15 + a.y, cz], o.dur || 0);
}
const say = (who, t) => [who, t];

// ======================================================================= CHAPTER 1
CHAPTERS.push({ title: 'REMOTE CONTROL', segs: [
  // 1-1 the couch. the remote is dead. Sleavis ate the batteries.
  function* (S) {
    const A = yield* S.load(Areas.house, null, { stayBlack: true });
    S.music('home');
    Game.money = 0; Game.flags.couchDone = false; Game.flags.jarDone = false;
    Game.spawnHeroes([0, 0], [0, 1]);
    S.sit('sleavis', A.sleavisSeat[0], A.sleavisSeat[1], Math.PI / 2, 0.18);
    S.sit('slothhead', A.slothSeat[0], A.slothSeat[1], Math.PI / 2, 0.18);
    S.shot([0.9, 1.45, 0.4], [-2.6, 0.95, -1.0], 0);
    yield* S.fade(0, 0.6);
    if (!S.tries) {
      yield* S.card('CHAPTER 1', 'REMOTE CONTROL', 'DUMPTON, OHIO. POPULATION: DECREASING.');
      yield* S.lines([
        say('tv', '...KSSSHHH... and in other news, a top-secret military gizmo has gone missing from a base in... KSSHHHH...'),
        say('sleavis', 'Heh heh. Hey, Slutt-Head. Change the channel.'),
        say('slothhead', 'My name is Sloth-Head, dumbass. YOU change it.'),
        say('sleavis', 'I can\'t. Heh heh. The remote\'s broke.'),
        say('slothhead', 'Uhh... what did you do to it?'),
        say('sleavis', 'Nothing! I just ate the batteries.'),
        say('slothhead', '...Why?'),
        say('sleavis', 'They were the good kind. With the copper top. Heh heh. They tasted like pennies.'),
        say('slothhead', 'Uh huh huh. You\'re gonna crap lightning.'),
        say('sleavis', 'Heh heh. COOL.'),
        say('tv', '...KSSHH... authorities are searching for anyone who... KSSHHH... news at eleven... KSSHHH...'),
        say('slothhead', 'This sucks. We\'re stuck on the news. That\'s like, homework.'),
        say('sleavis', 'Heh heh. We gotta get new batteries. Or we\'ll have to like... go outside.'),
        say('slothhead', 'Uh huh huh. Or get a job.'),
        0.8,
        say('sleavis', 'Heh heh. Good one.'),
        say('slothhead', 'Batteries cost money. Find some money, dumbass.'),
        say('sleavis', 'Heh heh. YOU find some money.'),
        say('slothhead', 'I\'m finding it. I\'m finding it with my brain. Uh huh huh. It\'s in the couch.')
      ]);
    }
    S.stand('sleavis', -1.6, 0.2); S.stand('slothhead', -1.6, -2.0);
    S.free();
    S.mode('action', { yaw: 0, dist: 5.6, height: 3.6 });
    S.objective('SCROUNGE UP MONEY FOR BATTERIES');
    S.toast('MOVE: WASD / STICK    USE: {use}    SWITCH IDIOT: {swap}', '#ffe040');
    // the couch: Sleavis' territory
    Stage.hot({ x: -2.2, z: -1.0, r: 1.6, label: 'DIG IN THE COUCH', who: 'sleavis', whoMsg: 'Uh huh huh. Sleavis should do it. Most of the stuff in there came out of him.', cond: () => !Game.flags.couchDone, act: function* (S) {
      yield* S.say('sleavis', 'Heh heh. Going in. If I\'m not back in five minutes... heh heh... I live here now.');
      S.sit('sleavis', -1.75, -1.0, -Math.PI / 2, 0, 'mash');
      S.shot([-0.6, 1.9, 1.9], [-2.3, 0.7, -1.0], 0.4);
      const r = yield* S.minigame('couch', { who: 'sleavis', goal: 2.5, soft: true });
      S.stand('sleavis', -1.6, -0.6); S.free();
      if (r.fail) { yield* S.lines([say('sleavis', 'Heh heh. Not enough. I only found ' + (r.msg.match(/\$[\d.]+/) || ['nothing'])[0] + ' and a nacho.'), say('slothhead', 'Try again, dumbass. Dig deeper. Uh huh huh. Deeper.')]); return; }
      Game.money += r.money; Game.flags.couchDone = true;
      yield* S.lines([say('sleavis', 'Heh heh. $' + r.money.toFixed(2) + '! We\'re RICH!'), say('slothhead', 'Uh huh huh. Batteries are five bucks, dumbass.'), say('sleavis', '...Heh heh. We\'re POOR.')]);
      S.objective(Game.flags.jarDone ? 'LEAVE THE HOUSE (FRONT DOOR)' : 'FIND MORE MONEY. MAYBE IN THE KITCHEN?');
    } });
    // the swear jar
    const jar = Mk.box(Stage.cur.root, 0.25, 0.32, 0.25, Mat.get('#b0d0e0', { transparent: true, opacity: 0.7 }), -8.4, 1.06, -3.5);
    Mk.sign(Stage.cur.root, 'SWEAR\nJAR', -8.4, 1.6, -3.3, { font: 'small', bg: '#f0f0e0', fg: '#a02020' });
    Stage.hot({ x: -8.4, z: -2.8, r: 1.4, label: 'SWEAR JAR', cond: () => !Game.flags.jarDone, act: function* (S, h, L) {
      Game.flags.jarDone = true; jar.visible = false;
      const want = Math.max(0.17, 3.17 - Game.money);
      Game.money = Math.max(3.17, Game.money + 0.17);
      GameAudio.sfx('coin');
      yield* S.lines([
        say(L.id, L.id === 'sleavis' ? 'Heh heh. Slutt-Head\'s swear jar. It\'s FULL.' : 'Uh huh huh. Sleavis\' swear jar. He put a quarter in every time he said "Slutt-Head."'),
        say(L.id === 'sleavis' ? 'slothhead' : 'sleavis', L.id === 'sleavis' ? 'That\'s YOUR swear jar, dumbass. You put a quarter in every time you call me that.' : 'Heh heh. I had to stop. I ran out of quarters. Heh heh. Slutt-Head.'),
        say('slothhead', 'Uh huh huh. There\'s $' + want.toFixed(2) + ' in here. So we got... uh... $' + Game.money.toFixed(2) + '.'),
        say('sleavis', 'Heh heh. Three seventeen. That\'s like, almost five.'),
        say('slothhead', 'Uh huh huh. Close enough. Let\'s go.')
      ]);
      S.objective(Game.flags.couchDone ? 'LEAVE THE HOUSE (FRONT DOOR)' : 'FIND MORE MONEY. THE COUCH HAS LOOSE CHANGE. AND OTHER THINGS.');
    } });
    let leave = false;
    Stage.hot({ x: 7.4, z: 1.5, r: 1.3, label: 'GO OUTSIDE', act: function* (S, h, L) {
      if (!Game.flags.couchDone || !Game.flags.jarDone) { yield* S.say(L.id, L.id === 'sleavis' ? 'Heh heh. We can\'t go yet. We don\'t have enough money. We have like... a nacho.' : 'Uh huh huh. We need more money first, dumbass.'); return; }
      leave = true;
    } });
    yield* S.until(() => leave);
  },

  // 1-2 the street: Slaria at the bus stop, a goon on the phone
  function* (S) {
    const A = yield* S.load(Areas.street);
    S.music('home');
    Game.spawnHeroes([A.start[0], A.start[1], 0], [A.start2[0], A.start2[1], 0]);
    S.mode('action', { yaw: 0, dist: 6.4, height: 3.9 });
    S.objective('WALK TO THE GAS-N-GASP (EAST)');
    const sl = S.spawn('slaria', A.busStop[0], A.busStop[1], Math.PI, { id: 'slaria' });
    S.sit(sl, A.busStop[0], A.busStop[1] + 0.05, Math.PI, 0.12, 'sit');
    const lyle = S.spawn('lyle', A.phone[0], A.phone[1], Math.PI, { id: 'lyle' });
    lyle.idleAnim = 'talk';
    const dwayne = S.spawn('dwayne', A.van[0] + 2.2, A.van[1] - 0.5, -Math.PI / 2, { id: 'dwayne' });
    const van = Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: true, solid: true });
    Props.pickup(Stage.cur.root, 52, 7, Math.PI / 2, { color: '#5a7a3a', solid: true });
    S.bark('slothhead', 'Uh huh huh. Outside. It\'s like TV but you can\'t change it.');
    // Slaria: scene 1
    const slariaTalk = function* (S) {
      yield* S.walkAll([['sleavis', 5.6, 4.4], ['slothhead', 5.4, 3.0]]);
      S.face('sleavis', 'slaria'); S.face('slothhead', 'slaria');
      S.shot([10.8, 1.8, 1.4], [6.8, 1.1, 4.4], 0.6);
      yield* S.lines([
        say('sleavis', 'Heh heh. Hey baby. You wanna see my tail?'),
        say('slaria', 'You\'re wearing a sloth costume. In public. On a Tuesday.'),
        say('slothhead', 'Uh huh huh. It\'s not a costume. It\'s a lifestyle.'),
        say('slaria', 'So is leprosy.'),
        say('sleavis', 'Heh heh. She said "lep." That\'s like "lap." Heh heh. She wants us on her lap.'),
        say('slaria', 'I want a bus. Any bus. Ideally one that hits me.'),
        say('slothhead', 'We\'re getting batteries. We\'re gonna watch TV all night. You could come over. Uh huh huh. If you know what I mean.'),
        say('slaria', 'I do know what you mean. That\'s the tragedy.'),
        say('sleavis', 'Heh heh. She\'s totally into us.'),
        say('slaria', 'Go away. Your suits smell like a petting zoo had a yard sale.')
      ]);
      S.free();
    };
    S.trigger({ x: A.busStop[0], z: A.busStop[1] - 1.2, r: 3.4, act: slariaTalk });
    Stage.hot({ x: A.busStop[0], z: A.busStop[1] - 1, r: 2.2, label: 'TALK TO SLARIA', act: function* (S, h, L) {
      yield* S.lines(LP.pick([
        [say(L.id, L.id === 'sleavis' ? 'Heh heh. Hey. Still here?' : 'Uh huh huh. Hey. Still waiting?'), say('slaria', 'The bus comes every forty minutes. I\'ve been here thirty-nine. Please don\'t make the last minute count.')],
        [say(L.id, 'What are you reading?'), say('slaria', '"Coping With Neighbors." It doesn\'t cover you. Nothing covers you.')],
        [say(L.id, L.id === 'sleavis' ? 'Heh heh. You\'re hot.' : 'Uh huh huh. You\'re pretty hot. For a smart chick.'), say('slaria', 'I\'m going to pretend that was a weather report.')]
      ]));
    } });
    // the overheard phone call: the source of every misunderstanding to come
    S.trigger({ x: A.phone[0], z: A.phone[1] + 1.5, r: 5, act: function* (S) {
      S.face('lyle', Math.PI / 2);
      S.shot([A.phone[0] - 5, 2, A.phone[1] + 5], [A.phone[0], 1.2, A.phone[1]], 0.6);
      yield* S.lines([
        say('lyle', '...Yes, Mr. Fontaine. Yes sir. We got the package. It\'s in the van.'),
        say('lyle', 'No sir, nobody\'s gonna touch it. The van is locked. ...Mostly. It\'s mostly locked.'),
        say('lyle', 'Uh huh. And whoever brings that thing to Lost Wages by the Fourth... is gonna SCORE. Big. Yes sir.'),
        say('sleavis', 'Heh heh. He said score.'),
        say('slothhead', 'Uh huh huh. Yeah. Score.')
      ]);
      S.free();
    } });
    let done = false;
    S.trigger({ x: A.store[0], z: A.store[1] + 0.5, r: 1.8, act: () => { done = true; } });
    yield* S.until(() => done);
  },

  // 1-3 inside the Gas-N-Gasp: $4.99 batteries, $3.17 in hand
  function* (S) {
    const A = yield* S.load(Areas.gasngasp);
    S.music('mall');
    Game.spawnHeroes([A.door[0] + 0.5, A.door[1] - 1, Math.PI], [A.door[0] - 0.6, A.door[1] - 0.8, Math.PI]);
    S.spawn('tammy', 3.6, 0.2, 0, { id: 'tammy' });
    const lyle = S.spawn('lyle', -3.5, 2.9, Math.PI / 2, { id: 'lyle' });
    const dwayne = S.spawn('dwayne', -2.6, 3.3, -Math.PI / 2, { id: 'dwayne' });
    S.mode('action', { yaw: 0, dist: 5.8, height: 3.8 });
    S.objective('BUY BATTERIES (COUNTER)');
    joke(-3.0, 3.1, 'TALK TO THE JERKY GUYS', [say('sleavis', 'Heh heh. Hey. You guys like jerky?'), say('dwayne', 'Duh. It\'s meat that you don\'t gotta cook. It\'s the future.'), say('lyle', 'Dwayne. We don\'t talk to strangers. We\'re on a MISSION.'), say('sleavis', 'Heh heh. A mission. Like Mission: Impossible?'), say('lyle', 'Like Mission: None Of Your Business.')], [say('slothhead', 'Uh huh huh. Nice hat.'), say('lyle', 'Thanks. Nice... whatever you are.'), say('slothhead', 'Uh huh huh. Sloth.'), say('lyle', 'Huh. Mr. Fontaine said watch out for... no. No, he said FEDS. You ain\'t feds.'), say('slothhead', 'Uh huh huh. Feds.')]);
    let out = false;
    Stage.hot({ x: 3.6, z: 2.0, r: 1.6, label: 'TALK TO TAMMY', act: function* (S, h, L) {
      S.shot([1.2, 1.9, 4.4], [3.6, 1.3, 0.6], 0.5);
      yield* S.lines([say('tammy', 'What.'), say(L.id, L.id === 'sleavis' ? 'Heh heh. We want batteries. For the remote. I ate the old ones.' : 'Uh huh huh. Batteries. The copper top kind. Sleavis ate ours.'), say('tammy', 'Four ninety-nine.')]);
      for (let round = 0; round < 6 && !out; round++) {
        const i = yield* S.choose(L.id, [
          { text: '"We have $' + Game.money.toFixed(2) + ' and this coupon." (It\'s a napkin.)', say: false },
          { text: '"Do you know who we ARE?"', say: false },
          { text: L.id === 'slothhead' ? '"Uh huh huh. What if I told you... you\'re hot." (SMOOTH)' : '"Heh heh. Can I have a free hot dog?"', say: false },
          { text: '"Can we pay in... favors?"', say: false },
          { text: 'Leave. With dignity. (You have none.)', say: false }
        ]);
        if (i === 0) yield* S.lines([say(L.id, 'We got three seventeen. And a coupon.'), say('tammy', 'That\'s a napkin.'), say(L.id, L.id === 'sleavis' ? 'Heh heh. It\'s a coupon for a napkin.' : 'Uh huh huh. It\'s a really good napkin.'), say('tammy', 'Batteries are four ninety-nine. The napkin is free. Like you, when you leave.')]);
        if (i === 1) yield* S.lines([say(L.id, 'Do you know who we ARE?'), say('tammy', 'Two guys who smell like a pet store that caught fire.'), say('sleavis', 'Heh heh. She knows us.')]);
        if (i === 2 && L.id === 'slothhead') yield* S.lines([say('slothhead', 'Uh huh huh. What if I told you... you\'re hot.'), say('tammy', 'Then I\'d tell you to get out. Again. Like last Tuesday.'), say('slothhead', 'Uh huh huh. She remembers me.')]);
        if (i === 2 && L.id === 'sleavis') {
          yield* S.lines([say('sleavis', 'Heh heh. Can I have a free hot dog?'), say('tammy', 'That hot dog has been on the roller since the Clinton administration.'), say('tammy', '...Sure. Go nuts.'), say('sleavis', 'Heh heh. Score!')]);
          S.anim('sleavis', 'eat'); S.sfx('eat'); yield* S.wait(1.2); S.anim('sleavis', null); S.sfx('burp');
          yield* S.lines([say('sleavis', 'Heh heh. It tasted like a battery.'), say('slothhead', 'Uh huh huh. Everything tastes like batteries to you now.')]);
          Game.freakAdd(30);
        }
        if (i === 3) yield* S.lines([say(L.id, L.id === 'sleavis' ? 'Heh heh. Can we pay in... favors?' : 'Uh huh huh. Can we pay in favors?'), say('tammy', 'I\'m calling the cops.'), say(L.id, L.id === 'sleavis' ? 'Heh heh. Is that a yes?' : 'Uh huh huh. That\'s a maybe.'), say('tammy', 'It\'s a dial tone.')]);
        if (i === 4) out = true;
      }
      out = true;
      S.free();
    } });
    yield* S.until(() => out);
    // they leave... and notice the van
    yield* S.lines([
      say('slothhead', 'Uh huh huh. This sucks. We\'re never gonna watch TV again.'),
      say('sleavis', 'Heh heh. Hey, Slutt-Head. Those jerky guys came in a van. And they left the window open.'),
      say('slothhead', 'So?'),
      say('sleavis', 'So maybe there\'s a remote in it. Heh heh. Everybody has a remote.'),
      say('slothhead', 'Uhh... that\'s like, stealing.'),
      say('sleavis', 'Not if they\'re not LOOKING.'),
      say('slothhead', '...Uh huh huh. Good point.')
    ]);
  },

  // 1-4 the van. the package. the getaway.
  function* (S) {
    const A = yield* S.load(Areas.street);
    S.music('home');
    Game.spawnHeroes([A.store[0], A.store[1] + 1, Math.PI], [A.store[0] - 1, A.store[1] + 1.2, Math.PI]);
    const van = Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: true, solid: true });
    Props.pickup(Stage.cur.root, 52, 7, Math.PI / 2, { color: '#5a7a3a', solid: true });
    S.mode('action', { yaw: 0, dist: 6.4, height: 3.9 });
    S.objective('CHECK OUT THAT VAN');
    let snoop = false;
    Stage.hot({ x: A.van[0], z: A.van[1] - 1.6, r: 2.0, label: 'SNOOP IN THE VAN', act: () => { snoop = true; } });
    yield* S.until(() => snoop);
    Modes.stop();
    yield* S.walkAll([['sleavis', A.van[0] + 0.6, A.van[1] - 1.5], ['slothhead', A.van[0] - 0.8, A.van[1] - 1.6]]);
    yield* S.wait(0.6);
    S.face('sleavis', Math.PI); S.face('slothhead', Math.PI);
    S.shot([A.van[0] - 1, 1.9, A.van[1] - 5.5], [A.van[0], 1.3, A.van[1] - 1.5], 0.6);
    yield* S.lines([
      say('sleavis', 'Heh heh. There\'s a briefcase on the seat.'),
      say('slothhead', 'Uh huh huh. Open it.'),
      say('sign', '(Inside: a remote control the size of a lunchbox, forty red buttons, a skull sticker, and a sticker that says PROPERTY OF U.S. GOVERNMENT. DO NOT PRESS.)'),
      say('sleavis', 'Whoa. Heh heh. It\'s like... the remote of the GODS.'),
      say('slothhead', 'Uh huh huh. Dibs.'),
      say('sleavis', 'Heh heh. I\'m gonna sit in the driver seat. Vroom vroom.'),
      say('slothhead', 'Don\'t touch anything, dumbass.'),
      say('sleavis', 'Heh heh. What\'s this stick do?')
    ]);
    S.sfx('door'); S.sfx('crash');
    const lyle = S.spawn('lyle', A.store[0], A.store[1] + 0.5, Math.PI, { id: 'lyle' });
    const dwayne = S.spawn('dwayne', A.store[0] - 1.2, A.store[1] + 0.5, Math.PI, { id: 'dwayne' });
    S.shot([A.store[0] - 6, 2.5, A.store[1] + 8], [A.store[0], 1.4, A.store[1] + 1], 0);
    yield* S.lines([
      say('lyle', 'HEY! THAT\'S OUR VAN!'),
      say('dwayne', 'Lyle! They got the package!'),
      say('lyle', 'Look at \'em, Dwayne. Dressed as sloths. Nobody suspects a sloth.'),
      say('dwayne', 'Duh... they\'re PROFESSIONALS.'),
      say('lyle', 'GET \'EM! TO THE OTHER TRUCK!')
    ]);
    S.free();
    S.music('drive');
    yield* S.load(Areas.empty, { sky: '#88b0e0', fog: '#a0c0e0', light: { sky: '#d8e8ff', ground: '#6a6040', sunI: 2.2 } });
    Game.flags.convertible = false;
    S.toast('STEER: A/D OR STICK   GAS: W / RT   BRAKE: S / LT   HONK: {punch}', '#ffe040');
    yield* S.play('drive', {
      theme: 'suburb', length: 1300, traffic: 0.35, chaser: 'goons', chaserSpeed: 26, destination: 'GET OUT OF DUMPTON', driver: 'slothhead', hp: 5,
      billboards: ['DUMPTON:\nIT\'S A TOWN', 'DUMPTON VIDEO\nRETURN YOUR\nTAPES, STEWART'],
      events: [{ at: 50, bark: ['sleavis', 'Heh heh! We stole a VAN! Heh heh. Wait. We stole a van?'] }, { at: 300, bark: ['slothhead', 'Uh huh huh. I\'m driving now. Shut up and hold the remote.'] }, { at: 700, bark: ['sleavis', 'They\'re still behind us! Heh heh. Go faster, Slutt-Head!'] }, { at: 1000, bark: ['slothhead', 'Uhh... where are we going?'] }],
      wreckMsg: 'You wrecked a stolen van in a residential neighborhood. Dumpton has never been prouder.'
    });
  },

  // 1-5 the remote. the convertible. the misunderstanding.
  function* (S) {
    const A = yield* S.load(Areas.roadside);
    S.music(null);
    Game.spawnHeroes([A.van[0] + 0.5, A.van[1] - 2.2, Math.PI], [A.van[0] - 0.7, A.van[1] - 2.0, Math.PI]);
    const van = Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: true });
    S.face('sleavis', 'slothhead'); S.face('slothhead', 'sleavis');
    yield* twoShot(S, { face: Math.PI, dist: 3.6, side: 0.8 });
    yield* S.lines([
      say('sleavis', 'Heh heh. We lost \'em. We\'re like, fugitives.'),
      say('slothhead', 'Uh huh huh. Check it out. It\'s got like, a hundred buttons.'),
      say('sleavis', 'Heh heh. Press the red one.'),
      say('slothhead', 'They\'re ALL red, dumbass.'),
      say('sleavis', 'Then press ALL of them.')
    ]);
    S.anim('slothhead', 'point');
    S.sfx('click');
    // the water tower, far away, has a very bad day
    S.shot([-10, 3, 8], [-40, 9, -70], 0.8);
    yield* S.wait(0.5);
    FX3.laser(-40, -70, null, { delay: 0.6, size: 4 });
    yield* S.wait(1.6);
    Stage.cur.root.children.forEach((c) => { if (c.position && Math.abs(c.position.x + 40) < 0.1 && Math.abs(c.position.z + 70) < 0.1) c.visible = false; });
    FX3.explode(new THREE.Vector3(-40, 10, -70), 4);
    yield* S.wait(1.0);
    yield* twoShot(S, { face: Math.PI, dist: 3.4, side: -0.5 });
    yield* S.lines([
      say('sleavis', '...Did you see that?'),
      say('slothhead', 'See what?'),
      say('sleavis', 'Nothing. Heh heh. I thought I saw a boob.'),
      say('slothhead', 'Uh huh huh. Lemme try another one.')
    ]);
    S.sfx('click');
    S.shot([6, 3.4, 7], [0, 1.2, 3.2], 0.5);
    FX3.laser(A.van[0], A.van[1], null, { delay: 0.7, size: 1.2 });
    yield* S.wait(1.0);
    // the van's roof departs for orbit
    const roof = Mk.box(Stage.cur.root, 2.1, 0.8, 4.8, Mat.get('metal', { color: '#a8b0c0' }), A.van[0], 1.5, A.van[1], { ry: Math.PI / 2 });
    Stage.cur.root.remove(van);
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false });
    let rt = 0;
    S.anim('sleavis', 'cheer');
    yield* S.until(() => { rt += 1 / 60; roof.position.y += rt * 0.6; roof.rotation.x += 0.08; roof.rotation.z += 0.05; return rt > 1.6; }, { block: true });
    Stage.cur.root.remove(roof);
    Game.flags.convertible = true;
    S.anim('sleavis', null);
    yield* twoShot(S, { face: Math.PI, dist: 3.8, side: 0.6 });
    yield* S.lines([
      say('slothhead', 'Uhh... I think the van just got cooler.'),
      say('sleavis', 'Heh heh! It\'s a CONVERTIBLE now!'),
      say('slothhead', 'Uh huh huh. This remote is broken. It doesn\'t change the channel at all. It just makes stuff go away.'),
      say('sleavis', 'Heh heh. Like a magic trick! Do my mom!'),
      say('slothhead', 'Uh huh huh. There\'s a tag on the briefcase. "DELIVER TO D. FONTAINE. FONTAINE TOWER. LOST WAGES, NEVADA."'),
      say('slothhead', '"DO NOT OPEN. DO NOT PRESS BUTTONS. DO NOT LET IDIOTS NEAR THIS."'),
      say('sleavis', 'Heh heh. Good thing it\'s us.'),
      say('slothhead', 'And there\'s a flyer. "FONTAINE FREEDOM FEST. LOST WAGES. JULY FOURTH. FREE BEER. FIREWORKS. HOT BABES."'),
      say('sleavis', '...'),
      say('sleavis', 'Heh heh. HOT BABES.'),
      say('slothhead', 'Uh huh huh. Remember what that guy said? Whoever brings this thing to Lost Wages is gonna SCORE.'),
      say('sleavis', 'Heh heh. We\'re gonna SCORE! We\'re gonna give the guy his remote and he\'s gonna be like "thanks, dudes" and give us chicks!'),
      say('slothhead', 'Uh huh huh. That\'s how it works. That\'s like, the American dream.'),
      say('sleavis', 'Heh heh. Which way is Lost Wages?'),
      say('slothhead', 'It\'s like... that way.'),
      say('sleavis', 'That\'s Dumpton.'),
      say('slothhead', '...Uh huh huh. THAT way. West. Where the sun goes to die.'),
      say('sleavis', 'Heh heh. Cool.')
    ]);
    Game.flags.remote = true;
    S.toast('SLOTH-HEAD GOT THE REMOTE!  SPECIAL ({special}): PRESS A RANDOM BUTTON', '#ff6060');
    yield* S.wait(1.2);
    // MEANWHILE
    yield* S.load(Areas.street, { dusk: true, blown: true });
    S.music('base');
    Game.spawnHeroes(null, null, 'both');
    for (const h of Game.heroActors()) { h.vis.show(false); h.gone = true; }
    S.spawn('lyle', 38, -6.4, Math.PI, { id: 'lyle' }).idleAnim = 'talk';
    S.spawn('dwayne', 39.6, -5.2, -Math.PI / 2, { id: 'dwayne' });
    S.shot([33, 2.2, -1], [38.5, 1.3, -6], 0);
    yield* S.card('', 'MEANWHILE...', 'AT THE GAS-N-GASP PAYPHONE');
    yield* S.lines([
      say('deke', '(ON THE PHONE) Let me get this straight, Lyle. Two men. In sloth costumes. Stole the P.A.T.R.I.O.T. uplink. From YOUR van.'),
      say('lyle', 'They were pros, Mr. Fontaine. Real pros. They didn\'t even LOOK like they knew what they was doing. That\'s how you KNOW.'),
      say('deke', 'Lyle. The uplink controls an orbital mirror that can melt a city block. It\'s the most dangerous object in America.'),
      say('lyle', 'Yes sir.'),
      say('deke', 'And a water tower in Ohio just EXPLODED, Lyle.'),
      say('lyle', '...That\'s bad?'),
      say('deke', 'Bring me that remote by the Fourth, Lyle. Or I\'ll have Dwayne sit on you again.'),
      say('dwayne', 'Heh. I\'ll do it.')
    ]);
    // and the feds
    Stage.cur.actors.filter((a) => !a.hero).forEach((a) => Stage.removeActor(a));
    S.spawn('strunk', 44, -2, Math.PI * 1.15, { id: 'strunk' });
    S.spawn('pip', 45.4, -1.4, Math.PI * 1.2, { id: 'pip' });
    Stage.tick((dt, t) => { if (Math.random() < dt * 4) FX3.burst(new THREE.Vector3(30 + LP.rand(-2, 2), 2, -48), 1, { colors: ['#404040', '#606060'], up: 4, speed: 0.4, grav: -1, life: 3, size: 0.6 }); });
    S.shot([48, 2.4, 3], [40, 3, -20], 0.01);
    yield* S.lines([
      say('strunk', 'Orbital strike. Water tower. Ohio. Somebody\'s got the uplink, Pip.'),
      say('pip', 'Ma\'am, three witnesses say they saw two guys in sloth suits.'),
      say('strunk', 'Sloths. Clever. Nobody suspects a sloth.'),
      say('pip', 'That\'s what I said!'),
      say('strunk', 'Don\'t agree with me, Pip. It makes me doubt myself.'),
      say('pip', 'Yes ma\'am. Sorry ma\'am.'),
      say('strunk', 'Get the car. We\'re going west. And Pip?'),
      say('pip', 'Ma\'am?'),
      say('strunk', 'Stop bleeding on the evidence.')
    ]);
  }
] });

// ======================================================================= CHAPTER 2
CHAPTERS.push({ title: 'HIGHWAY TO HECK', segs: [
  // 2-1 the open road
  function* (S) {
    yield* S.load(Areas.empty, { sky: '#7aa0d8', fog: '#c8b8a0', light: { sky: '#ffe0c0', ground: '#806040', sunI: 2.1, sunPos: [-8, 12, -10] } });
    Game.spawnHeroes(null, null, 'both');
    S.music('drive');
    if (!S.tries) yield* S.card('CHAPTER 2', 'HIGHWAY TO HECK', 'INTERSTATE 70-SOMETHING. NOBODY KNOWS WHICH STATE THIS IS.');
    const m = Modes.start('drive', {
      theme: 'interstate', length: 3200, traffic: 0.55, destination: 'NEXT GAS: 3 MI', driver: 'slothhead', hp: 6,
      billboards: ['JESUS IS\nCOMING\nLOOK BUSY', 'WORLD\'S LARGEST\nBALL OF LINT\n300 MI', 'HURT? CALL BUD\n"WHIPLASH"\nBUCKLEY', 'FIREWORKS!\nCIGARETTES!\nFIREWORKS NEAR\nCIGARETTES!', 'ADULT SUPERSTORE\n& BAIT', { text: 'FONTAINE\nFREEDOM FEST\nLOST WAGES\nJULY 4TH', bg: '#2040a0', fg: '#ffffff' }, 'EAT AT\nMOM\'S\n(SHE\'S DEAD)', 'GUNS GUNS GUNS\nAND ALSO\nPIES'],
      radio: ['KRUD 98.6: ALL ROCK, NO TALK... EXCEPT THIS TALK. AND THE ADS. MOSTLY ADS.'],
      events: [
        { at: 150, bark: ['sleavis', 'Heh heh! Road trip! Turn it up!'] },
        { at: 500, radio: 'NEWS: AN OHIO WATER TOWER EXPLODED LAST NIGHT. OFFICIALS BLAME "SPACE." MORE AT ELEVEN.' },
        { at: 520, bark: ['sleavis', 'Heh heh. Space. That\'s where boobs come from.'] },
        { at: 800, bark: ['slothhead', 'Uh huh huh. Press {special} if you want me to change lanes. With the remote. Uh huh huh.'] },
        { at: 1200, radio: 'CALLER: "HI, I SAW A VAN WITH NO ROOF AND TWO ANIMALS DRIVING IT." DJ: "NEXT CALLER."' },
        { at: 1300, bark: ['slothhead', 'Uh huh huh. We\'re on the radio. We\'re famous.'] },
        { at: 1600, fn: (m) => { m.chaser = Props.copcar(Stage.cur.root, m.x, m.z + 40, Math.PI); m.cfg.chaser = 'cops'; m.chaserGap = 38; m.chaserX = m.x; m.cfg.chaserSpeed = 27; GameAudio.sfx('siren'); HUD.bark('sleavis', 'Heh heh. Cops! Lose \'em, Slutt-Head!'); m.radio('POLICE SCANNER: ALL UNITS, ROOFLESS VAN, TWO SUSPECTS, POSSIBLY RACCOONS.'); } },
        { at: 2300, bark: ['slothhead', 'My name is Sloth-Head! Stop calling me that while I\'m DRIVING!'] },
        { at: 2700, radio: 'AD: "FONTAINE FREEDOM SYSTEMS. WE KEEP YOU SAFE FROM THE SKY. MOSTLY." NOW BACK TO ROCK.' },
        { at: 3000, bark: ['sleavis', 'Heh heh. Look! A gas station! It has a SIGN that says PORN!'] }
      ],
      wreckMsg: 'You totaled the van on an interstate. A trucker took a picture. It\'s his Christmas card now.'
    });
    yield* S.until(() => m.result);
    const r = m.result; Modes.stop();
    if (r.fail) S.fail(r.msg);
  },

  // 2-2 the PUMP & DUMP: a love letter to the title screen
  function* (S) {
    const A = yield* S.load(Areas.pumpstation);
    S.music('truckstop');
    Game.spawnHeroes([A.van[0] + 3.2, A.van[1] - 0.6, Math.PI / 2], [A.van[0] + 3.0, A.van[1] - 2.0, Math.PI / 2]);
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false, solid: true });
    const gaspy = S.spawn('gaspy', 9, -4, Math.PI * 0.85, { id: 'gaspy' });
    gaspy.idleAnim = 'dance';
    S.mode('action', { yaw: 0, dist: 7, height: 4.2 });
    if (!S.tries) yield* S.lines([
      say('slothhead', 'Uh huh huh. We\'re out of gas.'),
      say('sleavis', 'Heh heh. I\'m not. *fart* Heh heh heh.'),
      say('slothhead', 'That\'s not the kind of gas the van takes, dumbass.'),
      say('sleavis', 'Heh heh. You don\'t know that. Nobody\'s TRIED.')
    ]);
    S.objective('PUMP GAS (THE PUMPS)');
    let pumped = null;
    Stage.hot({ x: A.pump[0], z: A.pump[1], r: 1.8, label: 'PUMP GAS', who: 'slothhead', whoMsg: 'Heh heh. Slutt-Head should pump. He\'s got the... pump hands.', cond: () => !pumped, act: function* (S) {
      yield* S.walkAll([['slothhead', A.pump[0], A.pump[1] + 0.3]]);
      S.face('slothhead', Math.PI);
      S.shot([A.pump[0] + 3, 1.9, A.pump[1] + 4], [A.pump[0], 1.2, A.pump[1]], 0.5);
      yield* S.lines([say('slothhead', 'Uh huh huh. Ten bucks. Exactly. I\'m gonna nail it.'), say('sleavis', 'Heh heh. You never nail anything.')]);
      pumped = yield* S.minigame('pump', { who: 'slothhead' });
      S.free();
    } });
    // the bathroom key, the vending machine, the dumpster
    joke(24, -1.6, 'RESTROOM', [say('sleavis', 'Heh heh. It\'s locked. The key\'s attached to a hubcap.'), say('sign', 'GRAFFITI ON THE DOOR: "EVERYONE WHO READS THIS IS GAY" — "NO U" — "I HAVE BEEN IN HERE FOR THREE DAYS. SEND HELP. OR SNACKS."'), say('sleavis', 'Heh heh. Someone\'s in there.')], [say('slothhead', 'Uh huh huh. Restroom.'), say('sign', '(A voice from inside: "IS SOMEBODY THERE?! I\'VE BEEN IN HERE SINCE TUESDAY!")'), say('slothhead', 'Uh huh huh. ...No.')]);
    let vended = false;
    Stage.hot({ x: 17, z: -4.8, r: 1.5, label: 'SHAKE VENDING MACHINE', who: 'sleavis', cond: () => !vended, act: function* (S) {
      yield* S.say('sleavis', 'Heh heh. It ate my dollar. I don\'t have a dollar. It ate it ANYWAY.');
      S.face('sleavis', Math.PI);
      S.shot([19.5, 2, -1], [17, 1.2, -5.8], 0.4);
      const r = yield* S.minigame('vending', { who: 'sleavis', soft: true });
      S.free();
      if (r && r.fail) { yield* S.say('sleavis', 'Heh heh. Ow. ...Again!'); return; }
      vended = true;
      Game.pickup('sugar', 16.6, -4.4);
      yield* S.lines([say('sleavis', 'Heh heh! A SUGAR BOMB! The breakfast of champions!'), say('slothhead', 'Uh huh huh. That stuff\'s like 90% sugar and 10% bomb.')]);
    } });
    joke(9, -2.6, 'TALK TO GASPY', [say('gaspy', 'HI! I\'M GASPY! I\'M LEGALLY REQUIRED TO SAY THAT!'), say('sleavis', 'Heh heh. Are you a guy in a suit?'), say('gaspy', 'I\'m a gas can with dreams, buddy. Same as you.'), say('sleavis', 'Heh heh. I\'m not a gas can.'), say('gaspy', 'Agree to disagree.')], [say('slothhead', 'Uh huh huh. Nice suit.'), say('gaspy', 'Thanks! Nice suit!'), say('slothhead', 'Uh huh huh. It\'s not a suit. It\'s a lifestyle.'), say('gaspy', 'Buddy. I\'ve been dancing in this thing for nine hours. EVERYTHING is a lifestyle.')]);
    yield* S.until(() => pumped);
    Modes.stop();
    // pay up
    gaspy.idleAnim = 'idle';
    yield* S.walkAll([['gaspy', A.pump[0] + 2.5, A.pump[1] + 1.5], ['sleavis', A.pump[0] - 1.2, A.pump[1] + 1.6]]);
    S.face('gaspy', 'slothhead');
    S.shot([A.pump[0] + 1, 2.0, A.pump[1] + 6], [A.pump[0] + 0.8, 1.2, A.pump[1] + 0.8], 0.6);
    if (pumped.exact) yield* S.lines([say('gaspy', 'Exactly ten bucks?! Nobody\'s done that since 1983! You get a free... nothing. We\'re out of everything.'), say('slothhead', 'Uh huh huh. I\'m like, a pump master.')]);
    else yield* S.lines([say('gaspy', 'Wow. That\'s gas on the pump, gas on the van, gas on your feet. That\'ll be ten.'), say('slothhead', 'Uh huh huh. I was CLOSE.')]);
    yield* S.say('gaspy', 'So. Ten dollars, fellas.');
    const i = yield* S.choose('slothhead', ['"We have $3.17 and a promise."', '"Can we pay with this remote?"', '"Sleavis. Get in the van."']);
    if (i === 0) yield* S.lines([say('slothhead', 'Uh huh huh. We got three seventeen. And a promise.'), say('gaspy', 'What\'s the promise?'), say('slothhead', 'Uh huh huh. That we\'re gonna leave.')]);
    if (i === 1) yield* S.lines([say('slothhead', 'Uh huh huh. Can we pay with this remote? It\'s like, government property.'), say('gaspy', 'Buddy, I\'m not touching anything with a skull sticker on it. I have SOME standards. Not many. Some.')]);
    yield* S.lines([say('sleavis', 'Heh heh. Hold on.'), say('sign', '(Sleavis has found a can of spray paint in the dumpster.)')]);
    // the graffiti that makes the van the title-screen van
    yield* S.walkAll([['sleavis', A.van[0] + 1, A.van[1] - 1.4]]);
    S.anim('sleavis', 'mash'); S.sfx('slide'); yield* S.wait(0.5); S.sfx('slide'); yield* S.wait(0.5); S.sfx('slide'); yield* S.wait(0.4);
    S.anim('sleavis', null);
    Game.flags.graffiti = true;
    Stage.cur.root.children.slice().forEach((c) => { if (c.position && Math.abs(c.position.x - A.van[0]) < 0.01 && Math.abs(c.position.z - A.van[1]) < 0.01) Stage.cur.root.remove(c); });
    Props.van(Stage.cur.root, A.van[0], A.van[1], Math.PI / 2, { roof: false, graffiti: true });
    S.shot([A.van[0] + 0.5, 1.6, A.van[1] - 6], [A.van[0], 1.0, A.van[1]], 0.6);
    yield* S.lines([say('sleavis', 'Heh heh. "SLOTHS RULE." Now it\'s OUR van.'), say('slothhead', 'Uh huh huh. That\'s like, how property works.'), say('gaspy', 'That\'s not how ANYTHING works.'), say('slothhead', 'Uh huh huh. Pump and dump. GO.')]);
    // they drive off with the nozzle still in. the pump objects.
    S.shot([-8, 4, 10], [6, 1, -2], 0.01);
    yield* S.wait(0.5);
    FX3.explode(new THREE.Vector3(A.pump[0] - 2.5, 1, A.pump[1]), 2.4);
    Game.damage(18000, new THREE.Vector3(A.pump[0] - 2.5, 2, A.pump[1]));
    yield* S.wait(1.2);
    yield* S.lines([say('gaspy', '...'), say('gaspy', 'I\'m gonna need a bigger suit.')]);
  }
] });
