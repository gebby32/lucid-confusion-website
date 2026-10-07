/* SPRITES — every piece of pixel art, built once at load from string art.
   '.' / ' ' = transparent. Each enemy has two march frames (they flip on every
   formation step, like the cabinet's own animation). */
'use strict';
const Sprites = (function () {
  // shared palette
  const P = {
    b: '#a8682c', d: '#5e3612', c: '#f6deb0', k: '#1e1008', w: '#ffffff', p: '#ff8aa0',
    g: '#a8b0c0', G: '#545a6c', l: '#e6eaf4', h: '#58d8ff', H: '#1a5aa8', z: '#0a1830',
    r: '#ff3a32', R: '#9a1414', y: '#ffd040', Y: '#b07a10', o: '#ff8a1a', e: '#40ff60', E: '#108a30',
    u: '#3a8aff', m: '#ff50e0', v: '#9a50ff', V: '#4a1a8a', K: '#14141c', s: '#c8ccd8', t: '#7a4a1e'
  };
  const S = (rows, extra) => G.sprite(rows, extra ? Object.assign({}, P, extra) : P);

  // ------------------------------------------------------------------ UFO SLOTH (16x12)
  const UFO_TOP = [
    '.....hhhhhh.....',
    '....hbbbbbbh....',
    '...hbbccccbbh...',
    '...hkkkcckkkh...',
    '...hkwkcckwkh...',
    '...hbccddccbh...',
    '...hbkcccckbh...',
    '..GghbbkkbbhgG..'
  ];
  const ufo = [
    S(UFO_TOP.concat([
      '.gllllllllllllg.',
      'GeGGuGGeGGuGGeGG',
      '.GGGGGGGGGGGGGG.',
      '...GG......GG...'])),
    S(UFO_TOP.concat([
      '.gllllllllllllg.',
      'GuGGeGGuGGeGGuGG',
      '.GGGGGGGGGGGGGG.',
      '....GG....GG....']))
  ];

  // ------------------------------------------------------------------ SPACEWALK SLOTH (16x14)
  // oversized helmet, tiny suit, long sloth claws, profoundly relaxed
  const WALK_HEAD = [
    '....hhhhhhhh....',
    '..hhzzbbbbzzhh..',
    '.hlzbbccccbbzzh.',
    '.hlbbccccccbbzh.',
    'hzzbkkkcckkkbzzh',
    'hzzbkwkcckwkbzzh',
    'hzzbcccddcccbzzh',
    '.hzzbkcccckbzzh.',
    '.hzzzbkkkkbzzzh.',
    '..hhzzbbbbzzhh..',
    '....hhhhhhhh....'
  ];
  const walk = [
    S(WALK_HEAD.concat([
      'kc.llllrlllll.ck',
      '.bllllllullllb..',
      '....ll....ll....'])),
    S(WALK_HEAD.concat([
      '...llllrlllll...',
      '.bbllllllullbbck',
      'kc..ll....ll....']))
  ];

  // ------------------------------------------------------------------ ATTACK SLOTH (16x12)
  // a cross little sloth in a red strike craft (engines on top: it flies DOWN at you)
  const atk = [
    S([
      '..o..........o..',
      '..R...hhhh...R..',
      '.RrR.hbbbbh.RrR.',
      '.RrRhkbccbkhRrR.',
      'RrrRhbkcckbhRrrR',
      'RrrrhkwccwkhrrrR',
      'RryrhbcddcbhryrR',
      '.Rrrhbbkkbbhrrr.',
      '..RrrhhhhhhrrR..',
      '...RryrrrryrR...',
      '....RRrrrrRR....',
      '......RyyR......'
    ]),
    S([
      '..y..........y..',
      '..R...hhhh...R..',
      '.RrR.hbbbbh.RrR.',
      '.RrRhkbccbkhRrR.',
      'RrrRhbkcckbhRrrR',
      'RrrrhkwccwkhrrrR',
      'RryrhbcddcbhryrR',
      '.Rrrhbbkkbbhrrr.',
      '..RrrhhhhhhrrR..',
      '...RryrrrryrR...',
      '....RRrrrrRR....',
      '.......RR.......'
    ])
  ];

  // ------------------------------------------------------------------ COMMANDER SLOTH (18x14)
  // peaked cap with a gold star, epaulettes, a purple command saucer
  const CMD_TOP = [
    '......RRRRRR......',
    '.....RRRyyRRR.....',
    '....RRRRyyRRRR....',
    '...YyyyyyyyyyyY...',
    '....bkkkcckkkb....',
    '....bkwkcckwkb....',
    '....bcccddcccb....',
    '....bbkcccckbb....',
    '...yybbkkkkbbyy...',
    '..vVVvvvvvvvvVVv..'
  ];
  const cmd = [
    S(CMD_TOP.concat([
      '.vlllllllllllllll.',
      'VyVVmVVyVVmVVyVVmV',
      '.VVVVVVVVVVVVVVVV.',
      '...VV...yy...VV...'])),
    S(CMD_TOP.concat([
      '.vlllllllllllllll.',
      'VmVVyVVmVVyVVmVVyV',
      '.VVVVVVVVVVVVVVVV.',
      '...VV...oo...VV...']))
  ];

  // ------------------------------------------------------------------ MINI SLOTH (swarm, 10x9)
  const mini = [
    S([
      '...hhhh...',
      '..hbccbh..',
      '.hkkcckkh.',
      '.hkwccwkh.',
      '.hbcddcbh.',
      'GgghhhhgggG'.slice(0, 10),
      'GuGGeGGuGG',
      '.GGGGGGGG.',
      '..G....G..'
    ]),
    S([
      '...hhhh...',
      '..hbccbh..',
      '.hkkcckkh.',
      '.hkwccwkh.',
      '.hbcddcbh.',
      'GgghhhhggG',
      'GeGGuGGeGG',
      '.GGGGGGGG.',
      '.G......G.'
    ])
  ];

  // asleep variants (SPACE NAP): the eye row of each patch becomes cream, leaving
  // only the dark line above — eyes shut, deeply unbothered.
  function sleepy(src) {
    const c = G.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data, W = c.width;
    const at = (x, y) => (y * W + x) * 4, isW = (i) => a[i] === 255 && a[i + 1] === 255 && a[i + 2] === 255 && a[i + 3];
    const glints = [];
    for (let y = 0; y < c.height; y++) for (let x = 0; x < W; x++) if (isW(at(x, y))) glints.push([x, y]);
    for (const [x, y] of glints) for (let dx = -1; dx <= 1; dx++) {
      const i = at(x + dx, y);
      if (a[i + 3] && a[i] < 0x40) { a[i] = 0xf6; a[i + 1] = 0xde; a[i + 2] = 0xb0; }
      if (dx === 0) { a[i] = 0xf6; a[i + 1] = 0xde; a[i + 2] = 0xb0; }
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  // ------------------------------------------------------------------ THE SLOTHERSHIP (30x16)
  // a big lazy saucer; one crew member hangs off the bottom by its claws, as sloths do
  const SHIP_TOP = [
    '...........hhhhhhhh...........',
    '.........hhbbbbbbbbhh.........',
    '........hbbccccccccbbh........',
    '........hkkkkcccckkkkh........',
    '........hkwwkccccwwkkh........',
    '........hbccccddccccbh........',
    '.....mmmmbbckkkkkkcbbmmmm.....',
    '..mmmllllllllllllllllllllmmm..',
    '.mlllllllllllllllllllllllllllm.'.slice(0, 30),
    'VVyVVVrVVVyVVVrVVVyVVVrVVVyVVV',
    '.VVVVVVVVVVVVVVVVVVVVVVVVVVVV.',
    '....VVVVVVVVVVVVVVVVVVVVVV....'
  ];
  const ship = [
    S(SHIP_TOP.concat([
      '............kc..ck............',
      '............bbbbbb............',
      '...........bbccccbb...........',
      '............bkwwkb............'])),
    S(SHIP_TOP.map((r) => r.replace(/y/g, '#').replace(/r/g, 'y').replace(/#/g, 'r')).concat([
      '............kc..ck............',
      '............bbbbbb............',
      '............bbccccbb..........',
      '.............bkwwkb...........']))
  ];

  // ------------------------------------------------------------------ PENGUIN FIGHTER (17x14)
  const SHIP_ROWS = [
    '........l........',
    '.......lsl.......',
    '......lhhhl......',
    '.....lhKKKhl.....',
    '.....lKwKwKl.....',
    '.....lKwowKl.....',
    '..r..lhwwwhl..r..',
    '..r.lllrrrlll.r..',
    '.rrlllrrrrrlllrr.',
    'rrrlllllllllllrrr',
    'rRrllGllullGllrRr',
    'R.RRlGG.u.GGlRR.R',
    '....GG.....GG....'
  ];
  const player = S(SHIP_ROWS);
  // canopy glare frame (the pilot hides behind the reflection now and then)
  const playerGlare = S(SHIP_ROWS.map((r, i) => (i >= 3 && i <= 5 ? r.replace(/[Kwo]/g, i === 3 ? 'h' : i === 4 ? 'l' : 'h') : r)));
  const lifeIcon = S([
    '....l....',
    '...lhl...',
    'r.lKwKl.r',
    'rlllrlllr',
    'RllGlGllR',
    '...G.G...'
  ]);

  // big pilot portrait for cards: the penguin, helmet on, deeply serious
  const pilot = S([
    '.....hhhhhhhh.....',
    '...hhKKKKKKKKhh...',
    '..hKKKKKKKKKKKKh..',
    '.hKKKKKKKKKKKKKKh.',
    '.hKKwwwKKKKwwwKKh.',
    'hKKwwwwwKKwwwwwKKh',
    'hKKwwKwwwwwwKwwKKh',
    'hKKwwkwwwwwwkwwKKh',
    'hKKwwwwwoowwwwwKKh',
    '.hKKwwwooooowwKKh.',
    '.hKKwwwwoowwwwKKh.',
    '..hKKwwwwwwwwKKh..',
    '...hhKKwwwwKKhh...',
    '..ssslllrrlllsss..',
    '.sslllrryyrrlllss.',
    'sslllllrrrrllllsss'.slice(0, 18)
  ]);

  // ------------------------------------------------------------------ shots
  const shot = S(['.w.', 'hwh', 'hwh', 'hwh', '.h.', '.h.', '.H.']);
  const shotPierce = S(['.w.', 'mwm', 'mwm', 'mwm', 'mwm', '.m.', '.v.', '.v.']);

  // enemy energy fire (the primary threat: bright, simple, readable)
  const zap = [
    S(['e..', '.e.', '..e', '.e.', 'e..', '.e.', '..e'], { e: '#b8ff40' }),
    S(['..e', '.e.', 'e..', '.e.', '..e', '.e.', 'e..'], { e: '#b8ff40' })
  ];
  const drop = [
    S(['.w.', 'yoy', 'ror', 'ror', '.r.', '.R.']),
    S(['.y.', 'oyo', 'ror', '.r.', '.r.', '.R.'])
  ];
  const needle = [
    S(['w', 'm', 'm', 'm', 'm', 'v', 'v']),
    S(['m', 'w', 'm', 'm', 'm', 'v', 'v'])
  ];
  // ... and the unusual ordnance (commanders, mostly)
  const acorn = S(['.ttt.', 'ttYtt', '.yyy.', '.yYy.', '..y..'], { t: '#7a4a1e', y: '#d89a40', Y: '#a86a20' });
  const banana = [
    S(['....yy', '...yy.', '..yy..', '.yy...', 'yy....', 'Y.....']),
    S(['Y.....', 'yy....', '.yyy..', '..yyyy', '....yY']),
    S(['Y.....', 'yy....', '.yy...', '..yy..', '...yy.', '....yy'].reverse()),
    S(['..yyyY', 'yyyy..', 'Y.....'])
  ];
  const couch = [
    S(['.o.y.o.', 'oyoryoy', 'RrrrrrR', 'RppppRR'.replace(/p/g, 'r'), 'R.....R'], { p: '#c02020' }),
    S(['y.o.y.o', 'yoryoyo', 'RrrrrrR', 'RrrrrrR', 'R.....R'])
  ];
  const mug = S(['.l.l.', 'ggggg.', 'gwwwgg', 'gwwwg.g', '.ggg..'].map((r) => r.slice(0, 6)), { g: '#e0e4ee', w: '#7a4a1e' });
  const meteor = S(['..oy.', '.ottt', 'otttt', '.tttt', '..tt.'], { t: '#8a7a6a', o: '#ff8a1a' });

  // ------------------------------------------------------------------ pickups (capsules, 9x9)
  const PICK = {
    double: { c: '#40ff60', d: '#0a6a20', ch: 'D' },
    pierce: { c: '#ff50e0', d: '#6a1a5a', ch: 'P' },
    rapid: { c: '#ffd040', d: '#7a5a10', ch: 'R' },
    shield: { c: '#58d8ff', d: '#1a4a8a', ch: 'S' },
    freeze: { c: '#e8f4ff', d: '#3a6aa0', ch: 'F' }
  };
  const pickups = {};
  for (const k in PICK) {
    const p = PICK[k];
    pickups[k] = [0, 1].map((f) => G.make(9, 9, (g) => {
      g.fillStyle = p.d; g.fillRect(1, 0, 7, 9); g.fillRect(0, 1, 9, 7);
      g.fillStyle = f ? '#ffffff' : p.c; g.fillRect(1, 1, 7, 7);
      g.drawImage(Font.canvas(p.ch, p.d, 'small'), 3, 2);
      g.fillStyle = f ? p.c : '#ffffff'; g.fillRect(1, 1, 1, 1);
    }));
  }

  // ------------------------------------------------------------------ explosions
  const pop = [
    S([
      '.....y....y.....',
      '..y...w..w...y..',
      '...w..y..y..w...',
      '....w......w....',
      'yw.....ww.....wy',
      '......wyyw......',
      '......wyyw......',
      'yw.....ww.....wy',
      '....w......w....',
      '...w..y..y..w...',
      '..y...w..w...y..',
      '.....y....y.....'
    ]),
    S([
      '.......o........',
      '.o...........o..',
      '....y.....y.....',
      '................',
      '..y....yy....y..',
      'o.....y..y.....o',
      '......y..y......',
      '..y....yy....y..',
      '................',
      '....y.....y.....',
      '.o...........o..',
      '........o.......'
    ])
  ];
  const boom = [
    S([
      '........y..........',
      '..y...o...y...o....',
      '.....r..w.o.....y..',
      '...o..wywoy..r.....',
      'y...rwyywwyo....o..',
      '..o.wyyrrwyw..y....',
      '...owwrRRrwwo...r..',
      'r.ollwwwwwwllo...y.',
      '.rrllRRllllRRllrr..'.slice(0, 19),
      'R..RRGG.....GGRR..R'
    ]),
    S([
      '...o.......y....o..',
      '.......r.......... ',
      'y...o....o...y.....',
      '.....y.wy....o...r.',
      '..r..o.ww.yw.......',
      '....wy.rr.ow..o..y.',
      'o..y.ow.R.wy.......',
      '..l.o..w.w..o..l...',
      '.r.l..R.l.l..R.l.r.',
      'R...R.G.....G..R..R'
    ])
  ];
  const spark = S(['w.w', '.y.', 'w.w']);

  // ------------------------------------------------------------------ backdrop planets
  // drawn dim and dithered, the way a 1980 artist would have faked depth
  function planet(r, fn) {
    const c = G.canvas(r * 2 + 2, r * 2 + 2), g = c.getContext('2d');
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = (x * x + y * y) / (r * r);
      if (d > 1) continue;
      const col = fn(x, y, d, r);
      if (col) { g.fillStyle = col; g.fillRect(x + r + 1, y + r + 1, 1, 1); }
    }
    return c;
  }
  const bay = (x, y) => [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][((y & 3) << 2) | (x & 3)];
  const ringed = (function () {
    const r = 15, body = planet(r, (x, y, d) => {
      const lit = (x * -0.6 + y * -0.5) / r + 0.3, band = Math.floor((y + r) / 4) % 2;
      if (lit < -0.35 && bay(x, y) > 5) return '#06102a';
      if (lit < -0.1 && bay(x, y) > 9) return '#0e2a50';
      return band ? (lit > 0.5 ? '#3a8ac8' : '#1e5a8a') : (lit > 0.5 ? '#3ab08a' : '#1a7060');
    });
    const c = G.canvas(56, 36), g = c.getContext('2d');
    const ring = (front) => {
      for (let a = 0; a < 360; a += 1) {
        const rad = a * Math.PI / 180, x = Math.cos(rad) * 26, y = Math.sin(rad) * 6 - x * 0.18;
        if ((Math.sin(rad) > 0) !== front) continue;
        g.fillStyle = a % 7 < 2 ? '#8a6a3a' : '#c8a868';
        g.fillRect(Math.round(28 + x), Math.round(18 + y), 1, 1);
      }
    };
    ring(false); g.drawImage(body, 28 - r - 1, 18 - r - 1); ring(true);
    return c;
  })();
  const moon = planet(13, (x, y, d, r) => {
    const sx = x + 6, sy = y - 2;
    if (sx * sx + sy * sy < (r - 1) * (r - 1)) return null;            // crescent
    const crater = [[-7, -4, 3], [-4, 5, 2.5], [-9, 3, 2], [2, -9, 2]].some(([cx, cy, cr]) => (x - cx) ** 2 + (y - cy) ** 2 < cr * cr);
    if (crater) return '#6a6e80';
    return bay(x, y) > 12 ? '#8a8ea0' : '#c8ccd8';
  });
  const earth = planet(12, (x, y, d, r) => {
    const land = Math.sin(x * 0.55 + 1) + Math.cos(y * 0.6 + x * 0.2) > 0.9 || (x > 2 && y > 3 && y < 8);
    const lit = (x * -0.5 + y * -0.6) / r + 0.4;
    if (lit < -0.3 && bay(x, y) > 4) return '#04081a';
    if (Math.abs(y) > r - 3 && bay(x, y) > 6) return '#e8f0ff';           // polar ice: penguin country
    return land ? (lit > 0.4 ? '#4aa04a' : '#2a6a30') : (lit > 0.4 ? '#3a7ae0' : '#1a4aa0');
  });
  const mars = planet(9, (x, y, d, r) => {
    const lit = (x * 0.6 + y * -0.5) / r + 0.3;
    if (lit < -0.3 && bay(x, y) > 5) return '#200806';
    return (Math.sin(x * 0.9) + Math.cos(y * 0.8)) > 1.1 ? '#a03a1a' : (lit > 0.4 ? '#e86a3a' : '#b04a22');
  });

  return {
    P, ufo, walk, atk, cmd, mini, ship, player, playerGlare, lifeIcon, pilot, shot, shotPierce,
    zap, drop, needle, acorn, banana, couch, mug, meteor, pickups, PICK, pop, boom, spark,
    ringed, moon, earth, mars, sleepy,
    asleep: { ufo: sleepy(ufo[0]), walk: sleepy(walk[0]), atk: sleepy(atk[0]), cmd: sleepy(cmd[0]), mini: sleepy(mini[0]) }
  };
})();
