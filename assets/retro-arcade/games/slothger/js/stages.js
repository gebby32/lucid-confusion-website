/* STAGES — 6 worlds, 30 hand-written stages (pure data).
   A stage is a stack of lanes between the HOME row (top) and the START row (bottom).
   Normal stages have 11 lanes and fit the screen; the final stage is a tall scrolling one.

   Lane builders (pattern strings: one character = one 16px cell along the lane's loop;
   the pattern repeats until the loop is wider than the screen; '.' = empty):
     R(pat, speed, o)   road: everything on it squashes sloths.     speed > 0 moves right
        c car  s sports car  x taxi  p police  m motorbike  k tractor  T truck(2)  B bus(3)
        l limo(3)  d bulldozer(2)  R steamroller(2)  M cement mixer(2)  D dump truck(2)
        n snake(2)  u snowplow(2)  g penguin  e snowmobile  z zamboni(2)  f forklift
        o robot cart  i ice-cream truck(2)  w lawnmower  v dog  q swamp truck(2)
     W(pat, speed, o)   water: stand on things or sink.  Runs of a letter = one platform.
        L log  t turtles  T diving turtles  r raft / planks  p lily pad  P sinking lily pad
        G gator(3: the head bites)  f ice floe  F cracking floe  b barrel  c crate  B barge
     S(surface)         safe ground (o.check = respawn checkpoint on the final stage)
     X(every, o)        railway: a train every `every` frames (lights + bell first)
     C(pat, speed)      conveyor belt: carries the sloth. s saw  g gear(2) on it are deadly
     P(kind, pat, per)  timed hazard cells on safe ground (press / manhole / geyser / steam):
                        digits 0-9 = phase group in tenths of the period
     I(o)               thin ice: cracks under a sloth that stands still
   o: { th: theme override, dive: frames per dive cycle, surf: ground under road hazards } */
'use strict';
const WORLDS = [
  { name: 'SLOTH MEADOWS', from: 1, song: 'main' },
  { name: 'RUSH HOUR CITY', from: 6, song: 'city' },
  { name: 'RAILS AND ROADWORK', from: 11, song: 'works' },
  { name: 'BAYOU BLUES', from: 16, song: 'swamp' },
  { name: 'FROSTBITE FALLS', from: 21, song: 'ice' },
  { name: 'THE LAST MILE', from: 26, song: 'factory' }
];

const STAGES = (function () {
const R = (pat, sp, o) => Object.assign({ type: 'road', pat, sp }, o);
const W = (pat, sp, o) => Object.assign({ type: 'water', pat, sp }, o);
const S = (surf, o) => Object.assign({ type: 'safe', surf }, o);
const X = (every, o) => Object.assign({ type: 'rail', every, sp: 7, cars: 5, off: 0 }, o);
const C = (pat, sp, o) => Object.assign({ type: 'belt', pat, sp }, o);
const P = (kind, pat, per, o) => Object.assign({ type: 'timed', kind, pat, per }, o);
const I = (o) => Object.assign({ type: 'ice' }, o);

return [
  // ======================================================== WORLD 1: SLOTH MEADOWS
  { name: 'FIRST STEPS', theme: 'meadow', time: 60, tip: 'RIDE THE LOGS. DODGE THE CARS.', lanes: [
    W('LLLL......', 0.45), W('ttt.....', -0.5), W('LLLLLL.......', 0.6), W('LLL.....', -0.4), W('tttt....', 0.5),
    S('grass'),
    R('c.........', -0.5), R('k...........', 0.35), R('c.......c.........', -0.65), R('TT..........', 0.4), R('c..........', -0.45)] },
  { name: 'MEADOW DASH', theme: 'meadow', time: 55, fly: true, tip: 'FLIES IN A HOME ARE WORTH 200!', lanes: [
    W('LLL.....', 0.55), W('ttt....', -0.6), W('LLLLL......', 0.75), W('LLL....', -0.5), W('ttt.....', 0.6),
    S('grass'),
    R('c......c.......', -0.65), R('TT.........', 0.45), R('c.....', -0.8), R('k........k.....', 0.4), R('c.........c....', -0.55)] },
  { name: 'TURTLE TROUBLE', theme: 'meadow', time: 55, fly: true, tip: 'SOME TURTLES DIVE. WATCH THEM SINK.', lanes: [
    W('LLLL......', 0.55), W('TTT....ttt....', -0.65, { dive: 300 }), W('LLLLLL......', 0.8), W('ttt...TT....', -0.6, { dive: 260 }), W('LLL......', 0.5),
    S('grass'),
    R('c....c.......', -0.7), R('TT........', 0.55), R('s..........', -1.2), R('k.......', 0.45), R('c.......c...', -0.6)] },
  { name: 'SNAKE IN THE GRASS', theme: 'meadow', time: 55, fly: true, tip: 'THE MIDDLE GRASS HAS A SNAKE.', lanes: [
    W('LLL......', 0.6), W('TTT....TT.....', -0.7, { dive: 260 }), W('LLLLL.....', 0.85), W('ttt.....', -0.65), W('LLLL......', 0.6),
    R('nn..............', 0.45, { surf: 'grass' }),
    R('c...c........', -0.8), R('TT.......TT......', 0.6), R('s.............', -1.4), R('c......c...', 0.7), R('k.........', -0.5)] },
  { name: 'HARVEST RUSH', theme: 'meadow', time: 50, fly: true, tip: 'THE FARM TRAFFIC IS IN A HURRY.', lanes: [
    W('LLL.......', 0.7), W('TTT...TTT.....', -0.75, { dive: 240 }), W('LLLLL.......', 0.95), W('TT....ttt....', -0.7, { dive: 220 }), W('LLL......', 0.75),
    R('nn...............', -0.55, { surf: 'grass' }),
    R('k...k........', 0.6), R('TT.....TT.........', -0.75), R('s..........s.....', 1.5), R('c....c......', -0.9), R('k........kk......', 0.55)] },

  // ======================================================== WORLD 2: RUSH HOUR CITY
  { name: 'DOWNTOWN', theme: 'city', time: 55, fly: true, tip: 'TAXIS AND BUSES. LOOK BOTH WAYS.', lanes: [
    W('rrr......', 0.6), W('BBBB.......', -0.5), W('rr.....', 0.75), W('BBBBB........', -0.55), W('rrr.......', 0.65),
    S('sidewalk'),
    R('x.....x..........', -0.8), R('BBB...........', 0.55), R('c....x.......', -0.9), R('m...............', 1.6), R('c.......c.....', -0.7)] },
  { name: 'CANAL STREET', theme: 'city', time: 55, fly: true, tip: 'THE CANAL IS BUSY TODAY.', lanes: [
    W('rr......', 0.7), W('BBBB.......', -0.6), W('ccc.....', 0.8), W('rrr.......', -0.75), W('BBBBB.........', 0.55), W('rr.....', -0.85),
    S('sidewalk'),
    R('x......x.......', 0.9), R('BBB.........', -0.6), R('c.....c.......', -0.8), R('m.........m..........', 1.8)] },
  { name: 'BUS LANE', theme: 'city', time: 55, fly: true, tip: 'POLICE CARS DO NOT STOP FOR SLOTHS.', lanes: [
    W('rrr.....', -0.7), W('BBBB......', 0.65), W('rr.....', -0.85), W('BBB.......', 0.7), W('rrr......', -0.65),
    S('sidewalk'),
    R('BBB.........BBB.......', 0.7), R('p...............', -2.1), R('lll..........', 0.8), R('x....c......', -1), R('BBB..........', 0.6)] },
  { name: 'GRIDLOCK', theme: 'city', time: 60, fly: true, tip: 'NO WATER. JUST TRAFFIC. SO MUCH TRAFFIC.', lanes: [
    R('x....x.......', 0.9), R('BBB........', -0.65), R('c...m.........', 1.2), R('lll.........', -0.75),
    S('sidewalk'),
    R('p..............', 2.2), R('c.....x.....', -0.95), R('BBB..........', 0.7), R('m.......m..........', -1.9), R('x..c.......', 0.85), R('c.......', -0.7)] },
  { name: 'MIDNIGHT TRAFFIC', theme: 'city', time: 55, fly: true, night: true, tip: 'IT IS DARK. FOLLOW THE HEADLIGHTS.', lanes: [
    W('rrr......', 0.7), W('BBBB.......', -0.65), W('rr......', 0.85), W('BBBBB........', -0.6), W('rrr......', 0.75),
    S('sidewalk'),
    R('x......x.......', -1), R('BBB..........', 0.7), R('p...............', -2.2), R('c....c.......', 1), R('lll...........', -0.75)] },

  // ======================================================== WORLD 3: RAILS AND ROADWORK
  { name: 'WRONG SIDE OF THE TRACKS', theme: 'works', time: 55, fly: true, tip: 'TRAINS! WAIT FOR THE LIGHTS TO STOP.', lanes: [
    W('rrr......', 0.65), W('LLLL.......', -0.6), W('rr......', 0.8), W('LLL......', -0.7), W('rrr.......', 0.6),
    S('gravel'),
    X(420, { cars: 4, off: 0 }), S('gravel'),
    R('dd..........', -0.5), R('c.....c......', 0.85), R('DD.........', -0.65)] },
  { name: 'ROADWORK AHEAD', theme: 'works', time: 55, fly: true, tip: 'OPEN MANHOLES ARE VERY DEEP.', lanes: [
    W('rrr......', -0.7), W('LLLL......', 0.65), W('TT....rr.....', -0.75, { dive: 260 }), W('LLL.......', 0.7), W('rrrr.......', -0.6),
    P('manhole', '..0....5....0....5..', 200),
    R('RR..........', 0.4), R('MM.......MM.........', -0.7), P('manhole', '....3.....8.....3....', 180), R('DD........', 0.75), R('c....c.......', -0.95)] },
  { name: 'DOUBLE TRACK', theme: 'works', time: 55, fly: true, tip: 'TWO TRACKS. TWO TRAINS. ONE SLOTH.', lanes: [
    W('LLL......', 0.75), W('rrr.......', -0.7), W('LLLL......', 0.8), W('rr.....', -0.85), W('LLL......', 0.7),
    S('gravel'),
    X(360, { cars: 5, off: 0 }), X(400, { cars: 4, off: 170, sp: -7 }),
    S('gravel'),
    R('dd.........dd........', 0.6), R('c.....DD.........', -0.85)] },
  { name: 'HARD HAT ZONE', theme: 'works', time: 55, fly: true, tip: 'EVERYTHING HERE IS HEAVY.', lanes: [
    W('rrr......', 0.8), W('TTT.....LLL.....', -0.75, { dive: 240 }), W('rr.....', 0.9), W('LLLL.......', -0.75), W('rrr......', 0.7),
    P('manhole', '.1...6...1...6...1..', 160),
    X(380, { cars: 5, off: 100, sp: 8 }),
    R('MM.....MM..........', -0.8), R('RR.........', 0.5), P('manhole', '...4....9....4....9..', 150), R('DD.....dd.........', -0.9)] },
  { name: 'LAST TRAIN', theme: 'works', time: 55, fly: true, night: true, tip: 'NIGHT SHIFT. TRAINS HAVE HEADLIGHTS.', lanes: [
    W('rrr......', -0.8), W('LLLL......', 0.75), W('TT...rr.....', -0.9, { dive: 220 }), W('LLL......', 0.8), W('rrr.......', -0.7),
    S('gravel'),
    X(330, { cars: 4, off: 0, sp: 8 }), X(390, { cars: 6, off: 150, sp: -7 }), X(360, { cars: 3, off: 260, sp: 9 }),
    S('gravel'),
    R('dd.......DD..........', -0.75)] },

  // ======================================================== WORLD 4: BAYOU BLUES
  { name: 'MUDDY WATERS', theme: 'swamp', time: 55, fly: true, tip: 'LILY PADS DO NOT MOVE. NICE.', lanes: [
    W('LLL.......', 0.6), W('p..p...p..p..p...', 0), W('LLLL......', -0.7), W('.p...p..p...p..p.', 0), W('LLL......', 0.65),
    S('mud'),
    R('q..........', -0.6), R('k......k........', 0.5), R('nn.............', -0.6, { surf: 'mud' }), R('q.......q.........', 0.75), R('k.........', -0.5)] },
  { name: 'GATOR ALLEY', theme: 'swamp', time: 55, fly: true, gator: true, tip: 'STAND ON GATOR BACKS. NOT HEADS.', lanes: [
    W('GGG.......', 0.55), W('LLL.......', -0.7), W('GGG.....LLL......', 0.65), W('LLLL......', -0.6), W('GGG........', 0.6),
    S('mud'),
    R('q.....q.........', -0.75), R('nn.........', 0.55, { surf: 'mud' }), R('k....k.........', -0.6), R('q...........', 0.9), R('nn........nn.......', -0.5, { surf: 'mud' })] },
  { name: 'LILY HOP', theme: 'swamp', time: 55, fly: true, gator: true, tip: 'PINK LILY PADS SINK. MUD GEYSERS POP.', lanes: [
    W('LLL......', 0.7), W('p.P..p.P...P.p..P.', 0, { dive: 240 }), W('GGG.......', -0.6), W('P..p..P..P..p..P.', 0, { dive: 200 }), W('LLLL.......', 0.65),
    P('geyser', '.0..3..6..9..0..3..6.', 140),
    R('q......q.........', 0.85), R('nn........', -0.6, { surf: 'mud' }), P('geyser', '..5..8..1..4..7..5..', 120), R('k.....k.....', 0.7), R('q.........', -0.9)] },
  { name: 'SNAKE BAYOU', theme: 'swamp', time: 55, fly: true, gator: true, tip: 'THE SNAKES ARE FASTER HERE.', lanes: [
    W('GGG......', 0.7), W('LLL.....', -0.8), W('P.P..P..P.P..P..', 0, { dive: 220 }), W('GGG.....LL......', -0.7), W('LLL......', 0.75),
    R('nn.........nn.......', 0.8, { surf: 'mud' }),
    R('q.....q......', -0.95), R('nn..........', 0.7, { surf: 'mud' }), R('k.....q........', -0.75), R('nn.......', -0.65, { surf: 'mud' }), R('q........q...', 1)] },
  { name: 'FIREFLY NIGHT', theme: 'swamp', time: 55, fly: true, gator: true, night: true, tip: 'THE BAYOU AT NIGHT. STAY CLOSE TO THE LIGHT.', lanes: [
    W('LLL......', 0.7), W('GGG.......', -0.65), W('p.P..p.P..P.p..P.', 0, { dive: 220 }), W('LLLL......', -0.7), W('GGG......', 0.6),
    S('mud'),
    R('q.......', 0.85), R('nn.........', -0.65, { surf: 'mud' }), P('geyser', '.2..6..0..4..8..2..6.', 130), R('k....q.........', -0.8), R('q........', 0.95)] },

  // ======================================================== WORLD 5: FROSTBITE FALLS
  { name: 'COLD FEET', theme: 'ice', time: 55, fly: true, tip: 'ICE FLOES ARE SLOW BUT STEADY.', lanes: [
    W('fff.......', 0.5), W('ffff.......', -0.6), W('ff......', 0.7), W('fff.......', -0.55), W('ffff........', 0.6),
    S('snow'),
    R('g.........', -1.1), R('e......e.........', 0.9), R('uu..........', -0.6), R('g...g..........', 1.2), R('e........', -0.85)] },
  { name: 'THIN ICE', theme: 'ice', time: 55, fly: true, tip: 'THIN ICE CRACKS IF YOU STAND STILL.', lanes: [
    W('fff......', 0.6), W('FFF....fff.....', -0.65, { dive: 280 }), W('ff......', 0.75), W('ffff.......', -0.6), W('fff.......', 0.65),
    I(),
    R('g......g........', -1.2), I(), R('uu.........', 0.65), I(), R('e.......e...', -1)] },
  { name: 'AVALANCHE ROAD', theme: 'ice', time: 55, fly: true, tip: 'SNOWPLOWS. ZAMBONIS. PENGUINS.', lanes: [
    W('FFF....ff.....', 0.7, { dive: 250 }), W('ffff......', -0.7), W('fff.....', 0.85), W('FF...fff.....', -0.75, { dive: 230 }), W('fff......', 0.7),
    S('snow'),
    R('uu.......uu...........', -0.8), R('zz.........', 0.6), R('g....g.....g..........', -1.4), R('e......', 1.1), R('uu.........', -0.75)] },
  { name: 'CRACK UP', theme: 'ice', time: 55, fly: true, tip: 'NOTHING HERE WANTS TO HOLD YOU UP.', lanes: [
    W('FFF.....', 0.75, { dive: 230 }), W('fff......', -0.8), W('FF...FFF.....', 0.85, { dive: 210 }), W('ffff.......', -0.7), W('FFF.....', 0.8, { dive: 250 }),
    I(),
    R('g.....g.......', -1.3), R('zz.........', 0.7), I(), R('uu......e......', -0.9), I()] },
  { name: 'AURORA', theme: 'ice', time: 55, fly: true, night: true, tip: 'NORTHERN LIGHTS. SOUTHERN SLOTH.', lanes: [
    W('fff......', 0.75), W('FFF....fff....', -0.8, { dive: 230 }), W('ff.....', 0.9), W('FFFF.......', -0.7, { dive: 260 }), W('fff......', 0.8),
    S('snow'),
    R('e.......e.....', 1.2), I(), R('uu.........', -0.8), R('g....g.........', 1.4), R('zz..........', -0.65)] },

  // ======================================================== WORLD 6: THE LAST MILE
  { name: 'SLOTHWORKS', theme: 'factory', time: 55, fly: true, tip: 'CONVEYOR BELTS CARRY YOU. SAWS DO NOT.', lanes: [
    W('bb......', 0.7), W('ccc......', -0.7), W('b.b.......', 0.85), W('ccc.......', -0.65), W('bbb......', 0.7),
    S('metal'),
    C('s..........', 0.6), R('f......f........', -0.9), C('......s.........s...', -0.7), R('o....o..........', 1.1), R('ff..........', -0.8)] },
  { name: 'CRUSH HOUR', theme: 'factory', time: 55, fly: true, tip: 'PRESSES SHAKE BEFORE THEY SLAM.', lanes: [
    W('ccc......', -0.75), W('bb.....', 0.8), W('ccc.......', -0.8), W('b..b......', 0.75), W('cc......', -0.85),
    P('press', '.0..2..4..6..8..0..2.', 150),
    C('s.......gg........', 0.7), P('steam', '..3...7...1...5...9..', 140), R('o.....f.......', -1), P('press', '..5..7..9..1..3..5..', 130), R('ff........', 0.9)] },
  { name: 'TOXIC NIGHT SHIFT', theme: 'factory', time: 55, fly: true, night: true, tip: 'THE FACTORY NEVER SLEEPS. YOU MIGHT.', lanes: [
    W('bbb......', 0.8), W('cc.....', -0.85), W('b.b......', 0.9), W('ccc.......', -0.75), W('bb......', 0.85),
    P('steam', '.0...4...8...2...6...', 130),
    C('s.........s.....', -0.75), R('o......o.........', 1.2), P('press', '..0..3..6..9..2..5..', 120), C('gg..........', 0.7), R('f.....f.......', -1)] },
  { name: 'EVERYTHING EVERYWHERE', theme: 'mix', time: 60, fly: true, gator: true, tip: 'A LITTLE BIT OF EVERY WORLD. GOOD LUCK.', lanes: [
    W('GGG.......', 0.7, { th: 'swamp' }), W('FFF....fff.....', -0.75, { th: 'ice', dive: 240 }), W('TTT....LLL.....', 0.8, { th: 'meadow', dive: 230 }), W('ccc......', -0.8, { th: 'factory' }), W('P.p..P..p.P..P..', 0, { th: 'swamp', dive: 200 }),
    I({ th: 'ice' }),
    X(360, { cars: 4, th: 'works', sp: 8 }), C('s.........s......', -0.8, { th: 'factory' }), R('p..............', 2.2, { th: 'city' }), P('manhole', '..2...6...0...4...8..', 150, { th: 'works' }), R('BBB.......x.......', -0.8, { th: 'city' })] },
  { name: 'THE SLOW ROAD HOME', theme: 'home', time: 99, fly: false, final: true, tip: 'ONE LAST TRIP. CHECKPOINTS ON THE WAY.', lanes: [
    W('LLLL......', 0.6, { th: 'meadow' }), W('TTT....ttt.....', -0.7, { th: 'meadow', dive: 260 }), W('LLL......', 0.75, { th: 'meadow' }),
    S('lawn'),
    R('c.....c.........', -0.85), R('ii..........', 0.6), R('w.....w.........', -0.5, { surf: 'lawn' }), R('v.........', 1.1, { surf: 'lawn' }),
    S('lawn', { check: true }),
    X(380, { cars: 5, th: 'works', sp: 8 }), X(420, { cars: 4, th: 'works', sp: -8, off: 180 }),
    S('metal', { th: 'factory' }),
    C('s..........', 0.7, { th: 'factory' }), P('press', '.0..3..6..9..2..5..8.', 140, { th: 'factory' }), C('.....gg..........', -0.75, { th: 'factory' }),
    S('mud', { th: 'swamp', check: true }),
    W('GGG......', 0.6, { th: 'swamp' }), W('P.p..P..p.P..P..', 0, { th: 'swamp', dive: 220 }), W('LLLL......', -0.7, { th: 'swamp' }),
    S('snow', { th: 'ice' }),
    I({ th: 'ice' }), W('fff......', 0.75, { th: 'ice' }), R('uu.........', -0.75, { th: 'ice' }),
    S('sidewalk', { th: 'city', check: true }),
    R('x....c........', 0.95, { th: 'city' }), R('BBB..........', -0.65, { th: 'city' }), R('m.............', 1.8, { th: 'city' })] }
];
})();

const StageInfo = {
  count: STAGES.length,
  world(n) { let w = 0; for (let i = 0; i < WORLDS.length; i++) if (n >= WORLDS[i].from) w = i; return w; },
  def(n) { return STAGES[LP.clamp(n, 1, STAGES.length) - 1]; },
  song(n) {
    const d = StageInfo.def(n);
    if (d.final) return 'final';
    if (d.night) return 'night';
    return WORLDS[StageInfo.world(n)].song;
  }
};
