/* ============================================================================
   GAME CONFIG — SLUBBLE SLOBBLE: Bubble-Blasting Sloth Bros.
   Full-screen arcade game: plumbing/monitor.js shows the 256x192 NES-style picture
   as large as the browser allows. Slub and Slob are NOT drawn into that picture:
   js/sloths.js paints them at full monitor resolution on top of it.
   Action names are the game's own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SLUBBLE SLOBBLE',
  storage: 'lcc-slubble-slobble',           // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 2.5 },

  lcd: {
    width: 256, height: 192,                // 4:3 with square pixels (matches the title art)
    palette: null,                          // full colour
    ghost: 0, grid: null,
    scanlines: 0                            // the game draws its own (under the sloths)
  },

  controls: [],                             // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action(s). p1* = Player 1 (Slub), p2* = Player 2 (Slob).
  // In one-player mode the chosen sloth listens to BOTH sets.
  keys: {
    ArrowLeft: ['p1left', 'left'], ArrowRight: ['p1right', 'right'],
    ArrowUp: ['p1jump', 'p1up', 'up'], ArrowDown: ['p1down', 'down'],
    KeyZ: ['p1fire', 'confirm'], KeyX: 'p1jump', Space: 'p1jump',
    KeyA: ['p2left', 'left'], KeyD: ['p2right', 'right'],
    KeyW: ['p2jump', 'p2up', 'up'], KeyS: ['p2down', 'down'],
    KeyF: ['p2fire', 'confirm'], KeyG: 'p2jump',
    Enter: ['start', 'confirm'], NumpadEnter: ['start', 'confirm'],
    Escape: ['back', 'pause'], Backspace: 'back', KeyP: 'pause',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // standard-mapping pads: A/B jump, X/Y fire, Start, Back. Pad 1 = Slub, pad 2 = Slob.
  gamepad: {
    stick: true, dead: 0.45,
    pads: [
      { buttons: { 0: ['p1jump', 'confirm'], 1: 'p1jump', 2: ['p1fire', 'confirm'], 3: 'p1fire', 9: 'start', 8: 'back', 12: ['p1jump', 'p1up', 'up'], 13: ['p1down', 'down'], 14: ['p1left', 'left'], 15: ['p1right', 'right'] },
        stick: { left: ['p1left', 'left'], right: ['p1right', 'right'], up: ['p1up', 'up'], down: ['p1down', 'down'] } },
      { buttons: { 0: ['p2jump', 'confirm'], 1: 'p2jump', 2: ['p2fire', 'confirm'], 3: 'p2fire', 9: 'start', 8: 'back', 12: ['p2jump', 'p2up', 'up'], 13: ['p2down', 'down'], 14: ['p2left', 'left'], 15: ['p2right', 'right'] },
        stick: { left: ['p2left', 'left'], right: ['p2right', 'right'], up: ['p2up', 'up'], down: ['p2down', 'down'] } }
    ]
  },

  power: null,
  settings: { contrast: 4, scanlines: false, fit: 'pixel' },   // contrast 4 = colours untouched
  scores: {
    max: 10, nameLength: 3,
    seed: [['SLB', 100000], ['SLO', 80000], ['LCC', 60000], ['BUB', 45000], ['POP', 30000],
      ['ZZZ', 20000], ['DNO', 12000], ['FRG', 8000], ['YAW', 4000], ['NAP', 1000]]
  },
  audio: { sfxMax: 0.8, musicMax: 0.36 },
  input: { drift: 1.25 },
  debug: false,

  // ---------------- game tuning (Plumbing never reads below this line) ----------------
  sloth: {
    w: 12, h: 16,             // hitbox (much smaller than the gorgeous render)
    drawH: 27,                // rendered height in game pixels
    walk: 1.4, accel: 0.3, turn: 0.55, decel: 0.26, airAccel: 0.22,
    iceAccel: 0.045, iceDecel: 0.018,
    jumpV: 3.95, superJumpV: 4.9, gravity: 0.17, cutGravity: 0.3, maxFall: 3.3,
    coyote: 7, buffer: 7,
    fireCool: 15, rapidCool: 7,
    invul: 2.2, hurtStun: 22,
    swimV: 2.3, waterGravity: 0.07, waterMaxFall: 1.1
  },
  bubble: {
    r: 7, giantR: 11, speed: 5, drag: 0.93, longDrag: 0.955,
    rise: 0.42, life: 9, trapLife: [11, 6],   // trapped-bubble seconds at level 1 / level 99
    maxShots: 7
  },
  rules: {
    lives: 5, continues: 3,
    extraLife: [30000, 100000],               // first award, then every N after
    trap: 50, emptyPop: 10, kill: 1000, killCap: 64000,
    timePar: 40, timeBonus: 100, perfect: 5000,
    hurry: 50                                 // seconds before HURRY UP on a normal stage
  }
};
