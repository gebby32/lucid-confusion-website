/* ============================================================================
   GAME CONFIG — SOFA KING: BARREL BLITZ
   Full-screen arcade game: plumbing/monitor.js shows the 320x240 picture as large
   as the browser allows (integer scaling by default). Action names are the game's
   own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SOFA KING: BARREL BLITZ',
  storage: 'lcc-sofa-king-barrel-blitz',     // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', cursorHide: 2.5 },

  lcd: {
    width: 320, height: 240,                 // 4:3, square pixels (matches the title artwork)
    palette: null,                           // full colour
    ghost: 0, grid: null,
    scanlines: 0.2                           // CRT scanline strength (toggle in OPTIONS)
  },

  controls: [],                              // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action
  keys: {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump',
    KeyX: 'action', ShiftLeft: 'action', ShiftRight: 'action', KeyC: 'action',
    Enter: 'start', NumpadEnter: 'start',
    Escape: 'back', Backspace: 'back', KeyP: 'pause',
    KeyM: 'mute', KeyF: 'fullscreen'
  },

  gamepad: { buttons: { 0: 'jump', 1: 'jump', 2: 'action', 3: 'action', 9: 'start', 8: 'back' }, stick: true },

  power: null,
  settings: { contrast: 4, scanlines: true, fit: 'pixel' },   // contrast 4 = colours untouched
  scores: {
    max: 10, nameLength: 3,
    seed: [['LCC', 30000], ['KNG', 25000], ['SLO', 20000], ['PNG', 16000], ['BRL', 12000],
      ['ZZZ', 9000], ['FSH', 7000], ['DUK', 5000], ['MOP', 3000], ['TOY', 1000]]
  },
  audio: { sfxMax: 0.8, musicMax: 0.38 },
  input: { drift: 1.25 },
  debug: false,

  // ---------------- game tuning (Plumbing never reads below this line) ----------------
  hero: {
    walk: 0.82,          // px / frame — a little lumbering
    accel: 0.22,         // ground acceleration (puddles use much less)
    climb: 0.95,         // sloths climb better than they walk
    jumpV: 1.65,         // take-off speed
    gravity: 0.09,       // floaty, predictable: ~37 frame arc, ~15px apex
    maxFall: 3.2,
    flopFall: 30,        // drop (px from apex) that knocks him flat for a moment
    deathFall: 60,       // drop that's one tier too many
    ladderGrab: 6,       // generous ladder detection (px either side)
    edge: 3,             // feet may overhang a platform edge this far
    coyote: 6,           // frames after walking off an edge where jump still works
    spawnInvul: 2.0      // seconds
  },
  rules: {
    lives: 3,
    extraLife: [10000, 40000],   // first award, then every N after
    bonusStart: 5000, bonusLoopAdd: 1000, bonusMax: 8000,
    bonusTick: 100, bonusEvery: 2.0,
    clearBonus: 1000,
    slothTime: { seconds: 4, scale: 0.35, maxCharges: 3 },
    points: { barrel: 100, wild: 200, odd: 300, industrial: 200, duck: 500, tier: 100, crush: 50 }
  }
};
