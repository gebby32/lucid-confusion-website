/* STAGES — the four boards. Pure data; js/world.js turns it into geometry.

   plats:   [x0, y0, x1, y1, opts]   top surface from (x0,y0) to (x1,y1). Hazards roll
            downhill; flat belts carry them. opts: { goal, belt: +1|-1 }
            Gaps between segments are openings hazards fall through.
   ladders: [x, upperPlat, lowerPlat, broken]   (indexes into plats)
   items:   [kind, plat, x]          remote 300 · chips 500 · pillow = +1 SLOTH TIME
   Stage-specific fixtures: vents (steam), puddles (slippery), presses (hydraulic),
   belts reverse every beltPeriod seconds. */
'use strict';
const STAGES = [
  // ---------------------------------------------------------------- 1
  {
    name: 'CONDEMNED CONSTRUCTION', style: 'girder', ladder: '#38c0f8', tierH: 34.5,
    taunt: 'BETTER START CLIMBING, SLOWPOKE!',
    spawn: { x: 34, f: 1 },
    king: { x: 62, y: 52, f: 1 }, stack: true,
    plats: [
      [0, 226, 320, 226],
      [16, 190, 292, 196],
      [36, 164, 304, 156],
      [16, 122, 136, 126],
      [152, 126, 304, 129],
      [28, 94, 304, 86],
      [16, 52, 96, 52, { goal: true }],
      [96, 52, 284, 58, { goal: true }]
    ],
    ladders: [
      [96, 1, 0], [200, 1, 0, true], [258, 1, 0],
      [56, 2, 1], [232, 2, 1],
      [104, 3, 2], [272, 4, 2], [200, 4, 2, true],
      [60, 5, 3], [232, 5, 4], [176, 5, 4, true],
      [180, 7, 5], [128, 7, 5, true]
    ],
    items: [['remote', 1, 150], ['chips', 4, 290], ['pillow', 5, 250]],
    decor: ['scaffold', 'signs']
  },
  // ---------------------------------------------------------------- 2
  {
    name: 'PIPE DREAMS', style: 'pipe', ladder: '#58d8c8', tierH: 34,
    taunt: 'HOPE YOU LIKE HOT STEAM!',
    spawn: { x: 30, f: 1 },
    king: { x: 58, y: 52, f: 1 }, stack: true,
    plats: [
      [0, 226, 320, 226],
      [16, 190, 148, 196],
      [168, 196, 304, 190],
      [24, 156, 296, 164],
      [32, 126, 160, 120],
      [160, 120, 288, 126],
      [40, 94, 304, 88],
      [16, 52, 92, 52, { goal: true }],
      [92, 52, 280, 58, { goal: true }]
    ],
    ladders: [
      [40, 1, 0], [120, 1, 0], [250, 2, 0], [290, 2, 0, true],
      [110, 3, 1], [200, 3, 2], [268, 3, 2], [140, 3, 1, true],
      [56, 4, 3], [240, 5, 3], [150, 4, 3, true],
      [100, 6, 4], [210, 6, 5], [280, 6, 5, true],
      [136, 8, 6], [248, 8, 6]
    ],
    items: [['remote', 2, 284], ['chips', 4, 46], ['pillow', 6, 292]],
    vents: [
      { plat: 3, x: 120, dir: 1, len: 52, period: 4.2, offset: 0 },
      { plat: 6, x: 200, dir: -1, len: 52, period: 4.2, offset: 2.1 },
      { plat: 1, x: 50, dir: 1, len: 40, period: 3.8, offset: 1.0 }
    ],
    puddles: [{ plat: 2, x0: 198, x1: 236 }, { plat: 5, x0: 192, x1: 226 }],
    decor: ['pipes']
  },
  // ---------------------------------------------------------------- 3
  {
    name: 'PENGUIN INDUSTRIAL COMPLEX', style: 'industrial', ladder: '#58c8f8', tierH: 34,
    taunt: 'WELCOME TO THE FACTORY FLOOR!',
    spawn: { x: 160, f: 1 },
    king: { x: 58, y: 52, f: 1 }, stack: true, industrial: true,
    beltPeriod: 7,
    plats: [
      [0, 226, 320, 226],
      [24, 192, 296, 192, { belt: -1 }],
      [16, 156, 272, 164],
      [28, 124, 150, 124, { belt: 1 }],
      [170, 124, 292, 124, { belt: -1 }],
      [36, 94, 304, 88],
      [16, 52, 92, 52, { goal: true }],
      [92, 52, 280, 58, { goal: true }]
    ],
    ladders: [
      [48, 1, 0], [210, 1, 0], [120, 1, 0, true],
      [100, 2, 1], [240, 2, 1], [180, 2, 1, true],
      [56, 3, 2], [250, 4, 2], [130, 3, 2, true],
      [120, 5, 3], [230, 5, 4], [80, 5, 3, true],
      [250, 7, 5], [150, 7, 5, true]
    ],
    items: [['remote', 2, 40], ['chips', 4, 280], ['pillow', 5, 60]],
    presses: [{ plat: 1, x: 150, period: 3.6, offset: 0 }, { plat: 5, x: 196, period: 3.2, offset: 1.6 }],
    decor: ['factory']
  },
  // ---------------------------------------------------------------- 4
  {
    name: "SOFA KING'S PENTHOUSE", style: 'penthouse', ladder: '#ffd860', tierH: 29, thick: 6,
    taunt: 'NOBODY TOUCHES MY SOFA!',
    spawn: { x: 290, f: -1 },
    king: { x: 80, y: 52, f: 1 }, sofa: { x: 18 }, penthouse: true,
    plats: [
      [0, 226, 320, 226],
      [16, 198, 96, 196], [112, 196, 208, 199], [224, 199, 304, 197],
      [28, 167, 124, 170], [140, 170, 196, 168], [212, 168, 300, 170],
      [16, 140, 92, 138], [108, 138, 212, 141], [228, 141, 304, 138],
      [36, 111, 140, 113], [156, 113, 244, 110], [260, 110, 304, 113],
      [16, 84, 112, 82], [128, 82, 220, 85], [236, 85, 296, 82],
      [16, 52, 104, 52, { goal: true }],
      [104, 52, 256, 57, { goal: true }]
    ],
    ladders: [
      [60, 1, 0], [160, 2, 0], [270, 3, 0],
      [40, 4, 1], [180, 5, 2], [250, 6, 3],
      [60, 7, 4], [116, 8, 4], [280, 9, 6],
      [76, 10, 7], [180, 11, 8], [290, 12, 9],
      [56, 13, 10], [200, 14, 11], [270, 15, 12],
      [160, 17, 14], [240, 17, 15], [92, 16, 13, true]
    ],
    items: [['remote', 5, 168], ['chips', 7, 30], ['pillow', 15, 284], ['chips', 12, 296]],
    decor: ['skyline']
  }
];
