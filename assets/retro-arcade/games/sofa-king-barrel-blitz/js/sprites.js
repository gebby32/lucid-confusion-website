/* SPRITES — all the game's pixel art, built once at load into small canvases.
   String art for characters and props, a few procedural pieces (barrels, tires).
   Hero frames face RIGHT; G.draw(img, x, y, true) mirrors them. */
'use strict';
const Sprites = (function () {
  const S = {};

  // ------------------------------------------------------------------ the sloth
  const SLOTH = {
    k: '#1c0e06', b: '#7a4820', B: '#a8703a', f: '#f2d8a6', d: '#3c2210', e: '#000000', w: '#ffffff',
    r: '#e83428', R: '#a01818', o: '#3a64f0', O: '#2038a8', y: '#ffd23a', t: '#d89a3a', T: '#7a4a14', c: '#fff0cc'
  };
  // round sloth face: cream mask, dark eye patches slanting down and out, button nose, smile.
  // 12 wide, shifted a pixel toward the facing side for a 3/4 look.
  const face = (rows) => rows.map((r) => '...' + r + '.');
  const HEAD = face([
    '...kkkkkk...',
    '..kbBbbBbk..',
    '.kbbbBBbbbk.',
    'kbbffffffbbk',
    'kbfddffddfbk',
    'kbdeffffedbk',
    'kbfffkkfffbk',
    'kbbfdffdfbbk',
    '.kbbfddfbbk.'
  ]);
  const HEAD_HURT = face([
    '...kkkkkk...',
    '..kbBbbBbk..',
    '.kbbbBBbbbk.',
    'kbbffffffbbk',
    'kbfddffddfbk',
    'kbdwffffwdbk',
    'kbfffkkfffbk',
    'kbbffRRffbbk',
    '.kbbfRRfbbk.'
  ]);
  const HEAD_BLINK = HEAD.slice();
  HEAD_BLINK[5] = '...kbddffffddbk.';

  const TORSO = [
    '...kkrrrrrrrkk..',
    '..kbrrOyoyOrrbk.',
    '..kbrooooooorbk.',
    '..kcRoooooooRck.'
  ];
  const TORSO_SWING = [                      // arms swung (walk)
    '...kkrrrrrrrkk..',
    '..kbrrOyoyOrrbk.',
    '.kbkrooooooorkbk',
    '.kc.Roooooooo.ck'
  ];
  const LEGS_STAND = [
    '...ckOoooooOkc..',
    '....kttk.kttk...',
    '...kTTTk.kTTTTk.'
  ];
  const LEGS_A = [
    '....kOoooOook...',
    '...kttk...kttk..',
    '..kTTTk...kTTTTk'
  ];
  const LEGS_B = [
    '.....kOooook....',
    '.....kttttk.....',
    '.....kTTTTTTk...'
  ];
  const JUMP = [
    '......kkkkkk....',
    '.c...kbBbbBbk..c',
    'kbk.kbbbBBbbbkbk',
    'kbkkbbffffffbbkk',
    '.kbkbfddffddfbk.',
    '..kkbdeffffedbk.',
    '...kbfffkkfffbk.',
    '...kbbffRRffbbk.',
    '....kbbfRRfbbk..',
    '...kkrrrrrrrkk..',
    '...krrOyoyOrrk..',
    '...kroooooooork.',
    '...kRoooooooRk..',
    '...kOoook.Oook..',
    '..kttTk...kttTk.',
    '..kkkk.....kkkk.'
  ];
  const CLIMB = [
    '......kkkk......',
    '.c...kbBBbk.....',
    'kbk.kbbbbbbk....',
    'kbk.kbbBbbbk....',
    '.kbkkbbbbbbk.c..',
    '.kbbkbbbbbbkkbk.',
    '..kbbkbbbbkbbbk.',
    '...kkrrrrrrkkk..',
    '...krOrrrrOrk...',
    '...krOrrrrOrk...',
    '...kOooooooOk...',
    '...kooooooook...',
    '...koookkoook...',
    '...kook..kook...',
    '...kttk..kttk...',
    '...kTTk..kTTk...'
  ];
  const sloth = (rows) => G.sprite(rows, SLOTH);
  S.hero = {
    stand: sloth([...HEAD, ...TORSO, ...LEGS_STAND]),
    blink: sloth([...HEAD_BLINK, ...TORSO, ...LEGS_STAND]),
    walkA: sloth([...HEAD, ...TORSO_SWING, ...LEGS_A]),
    walkB: sloth([...HEAD, ...TORSO, ...LEGS_B]),
    jump: sloth(JUMP),
    climbA: sloth(CLIMB),
    hurt: sloth([...HEAD_HURT, ...TORSO_SWING, ...LEGS_STAND])
  };
  S.hero.climbB = G.mirror(S.hero.climbA);
  // lying flat (flop / dead): quarter turns of the hurt frame
  S.hero.flatR = G.rotate(S.hero.hurt, 1);
  S.hero.flatL = G.rotate(S.hero.hurt, 3);
  S.hero.spin = [S.hero.hurt, G.rotate(S.hero.hurt, 1), G.rotate(S.hero.hurt, 2), G.rotate(S.hero.hurt, 3)];

  S.lifeIcon = G.sprite([
    '..kkkk..',
    '.kbBBbk.',
    'kbffffbk',
    'kdefdefk',
    'kfffeefk',
    'kbfdddbk',
    '.kbbbbk.',
    '..kkkk..'
  ], SLOTH);

  // ------------------------------------------------------------------ barrels
  function rollingBarrel(wood, woodHi, plank, hoop, i) {
    return G.make(10, 10, (g) => {
      G.ellipse(4.5, 4.5, 4.5, 4.5, '#1a0c04', g);
      G.ellipse(4.5, 4.5, 3.9, 3.9, hoop, g);
      G.ellipse(4.5, 4.5, 3.0, 3.0, wood, g);
      const a = i * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
      // two plank seams, parallel, rotating with the barrel
      for (const off of [-1.4, 1.4]) {
        const ox = 4.5 - sa * off, oy = 4.5 + ca * off;
        G.line(ox - ca * 2.2, oy - sa * 2.2, ox + ca * 2.2, oy + sa * 2.2, plank, g);
      }
      g.fillStyle = woodHi; g.fillRect(3, 2, 2, 1);
      g.fillStyle = '#140800';
      g.fillRect(Math.round(4.5 + ca * 1.9 - 0.5), Math.round(4.5 + sa * 1.9 - 0.5), 1, 1);   // bung hole
    });
  }
  function uprightBarrel(wood, woodHi, woodDk, hoop) {
    return G.make(10, 12, (g) => {
      const widths = [6, 8, 10, 10, 10, 10, 10, 10, 10, 10, 8, 6];
      widths.forEach((w, y) => {
        const x = (10 - w) / 2;
        g.fillStyle = '#1a0c04'; g.fillRect(x, y, w, 1);
        if (w > 2 && y > 0 && y < 11) {
          g.fillStyle = wood; g.fillRect(x + 1, y, w - 2, 1);
          g.fillStyle = woodHi; g.fillRect(x + 2, y, 2, 1);
          g.fillStyle = woodDk; g.fillRect(x + w - 3, y, 1, 1);
        }
      });
      g.fillStyle = hoop; g.fillRect(1, 2, 8, 1); g.fillRect(1, 9, 8, 1);
      g.fillStyle = woodDk; g.fillRect(3, 0, 4, 1);
    });
  }
  S.barrel = [];
  S.wild = [];
  for (let i = 0; i < 8; i++) {
    S.barrel.push(rollingBarrel('#b8682c', '#f0a050', '#6a3010', '#9aa2b4', i));
    S.wild.push(rollingBarrel('#4a6ab8', '#9ac0ff', '#203060', '#e0e4f0', i));
  }
  S.barrelUp = uprightBarrel('#b8682c', '#f0a050', '#6a3010', '#9aa2b4');
  S.wildUp = uprightBarrel('#4a6ab8', '#9ac0ff', '#203060', '#e0e4f0');

  // ------------------------------------------------------------------ oddball hazards
  const PAL = {
    k: '#101018', w: '#f4f4f8', s: '#a8b0c0', S: '#6a7080', y: '#ffe030', o: '#ff8020', b: '#3a7ac8', B: '#9ad0f0',
    g: '#40e060', n: '#24403a', r: '#e03030', R: '#901818', t: '#8a5a2a', T: '#5a3410', v: '#7ab0d0', V: '#c8e8ff', c: '#d8dce4'
  };
  const art = (rows) => G.sprite(rows, PAL);
  S.items = {
    toilet: art([
      'kkkk........',
      'kwwwk.......',
      'kwwsk.......',
      'kwwsk.......',
      'kwwskkkkkkk.',
      'kwwwwwwwwwwk',
      '.kssssssssk.',
      '..kwwwwwsk..',
      '...kwwwsk...',
      '...kwwsk....',
      '..kwwwwsk...',
      '..kkkkkkk...'
    ]),
    microwave: art([
      'kkkkkkkkkkkk',
      'kccccccccsck',
      'kckkkkkkcsgk',
      'kcknnnnkcsck',
      'kcknVnnkcsgk',
      'kcknnnnkcsck',
      'kckkkkkkcsck',
      'kssssssssssk',
      'kkkkkkkkkkkk'
    ]),
    chair: art([
      '.SSSSSSS..',
      '.SccccccS.',
      '.SSSSSSS..',
      '..S...S...',
      '..S...S...',
      'SSSSSSSSS.',
      'ScccccccSS',
      '..S...S...',
      '...S.S....',
      '....S.....',
      '...S.S....',
      '.SS...SS..'
    ]),
    duck: art([
      '..kkk...',
      '.kyyyk..',
      '.kyykyoo',
      'kkyyyyook',
      'kyyyyyyk.',
      'kyyyyyyk.',
      '.kkkkkk..'
    ]),
    can: art([
      '...kkkk...',
      '..kkSSkk..',
      'kkkkkkkkkk',
      'ksssssSSSk',
      '.kcsSscsk.',
      '.kcsSscsk.',
      '.kcsSscsk.',
      '.kcsSscsk.',
      '.kcsSscsk.',
      '.kcsSscsk.',
      '.kssssssk.',
      '.kkkkkkkk.'
    ]),
    tv: art([
      '...k...k....',
      '....k.k.....',
      '.....k......',
      'kkkkkkkkkkkk',
      'ktkkkkkkkttk',
      'ktkVvvvvktTk',
      'ktkvVvvvktsk',
      'ktkvvvVvkttk',
      'ktkkkkkkktsk',
      'kttttttttttk',
      'kkTkkkkkkTkk'
    ]),
    fish: art([
      '....kkkk...k',
      '..kkBBBBk.kk',
      '.kwBBBBBBkbk',
      'kkBBBBBBBkbk',
      '.kbbbbbbbkbk',
      '..kkbbbbk..k'
    ]),
    toolbox: art([
      '...kkkkkk...',
      '...k....k...',
      'kkkkkkkkkkkk',
      'krrrrrrrrrrk',
      'kRRRRssRRRRk',
      'krrrrrrrrrrk',
      'kRrrrrrrrrRk',
      'kkkkkkkkkkkk'
    ])
  };
  // tire: rotating tread
  S.tire = [];
  for (let i = 0; i < 4; i++) {
    S.tire.push(G.make(12, 12, (g) => {
      G.ellipse(5.5, 5.5, 5.5, 5.5, '#5a5a68', g);
      G.ellipse(5.5, 5.5, 4.7, 4.7, '#2e2e36', g);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6 + i / 24) * Math.PI * 2;
        g.fillStyle = '#8a8a9a'; g.fillRect(Math.round(5.5 + Math.cos(a) * 4.2 - 0.5), Math.round(5.5 + Math.sin(a) * 4.2 - 0.5), 1, 1);
      }
      G.ellipse(5.5, 5.5, 2.4, 2.4, '#a0a4b0', g);
      G.ellipse(5.5, 5.5, 1, 1, '#404048', g);
    }));
  }
  // every oddball gets four quarter-turn frames for tumbling
  S.tumble = {};
  for (const k in S.items) S.tumble[k] = [0, 1, 2, 3].map((q) => G.rotate(S.items[k], q));
  S.fishFlop = [S.items.fish, G.flipV(S.items.fish)];

  // ------------------------------------------------------------------ pickups
  S.pickups = {
    remote: art([
      '.kkk.',
      'kSrSk',
      'kSSSk',
      'kgSbk',
      'kSSSk',
      'kSySk',
      'kSSSk',
      'kSSSk',
      '.kkk.'
    ]),
    chips: art([
      'kkkkkkkk',
      'krrrrrrk',
      'kyyyyyyk',
      'kyoyyoyk',
      'kyyoyyyk',
      'kyoyyoyk',
      'kyyyyyyk',
      'krrrrrrk',
      'kkkkkkkk'
    ]),
    pillow: G.sprite([
      '.kkkkkkkkk.',
      'kpppppppppk',
      'kppPPPPpppk',
      'kpppPPppppk',
      'kppPPPPpppk',
      'kpppppppppk',
      '.kkkkkkkkk.'
    ], { k: '#3a2a6a', p: '#c8a8ff', P: '#5a3aa8' })
  };

  // ------------------------------------------------------------------ the King's sofa (penthouse)
  S.sofa = G.make(40, 18, (g) => {
    const red = '#c0203a', dk = '#7a0c22', hi = '#ff5a70', gold = '#ffd040';
    g.fillStyle = '#000'; g.fillRect(0, 2, 40, 14);
    g.fillStyle = dk; g.fillRect(3, 1, 34, 9);                    // back
    g.fillStyle = red; g.fillRect(4, 2, 32, 7);
    g.fillStyle = hi; g.fillRect(5, 3, 30, 1);
    g.fillStyle = dk; g.fillRect(19, 2, 1, 7);                    // two back cushions
    g.fillStyle = dk; g.fillRect(0, 6, 6, 9); g.fillRect(34, 6, 6, 9);   // arms
    g.fillStyle = red; g.fillRect(1, 7, 4, 7); g.fillRect(35, 7, 4, 7);
    g.fillStyle = hi; g.fillRect(1, 7, 4, 1); g.fillRect(35, 7, 4, 1);
    g.fillStyle = dk; g.fillRect(5, 10, 30, 5);                   // seat
    g.fillStyle = red; g.fillRect(6, 10, 28, 3);
    g.fillStyle = hi; g.fillRect(6, 10, 28, 1);
    g.fillStyle = dk; g.fillRect(19, 10, 1, 3);
    g.fillStyle = gold; g.fillRect(2, 15, 2, 3); g.fillRect(36, 15, 2, 3); g.fillRect(4, 14, 32, 1);   // legs + trim
  });

  return S;
})();
