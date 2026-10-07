/* ============================================================================
   GAME CONFIG — THE SLOTH KING
   Full-screen 16-bit platformer: plumbing/monitor.js shows the 320x240 picture
   (Genesis-wide, 4:3 square pixels, the same shape as the title art) as large as
   the browser allows. The title screen is the supplied artwork, painted untouched
   at full monitor resolution through LP.LCD.post (see main.js).
   Action names are the game's own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'THE SLOTH KING',
  storage: 'lcc-sloth-king',                // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 2.5 },

  lcd: {
    width: 320, height: 240,
    palette: null,                          // full colour
    direct: true,                           // fast path: no per-pixel LCD pass
    ghost: 0, grid: null,
    scanlines: 0                            // the game draws its own (optional setting)
  },

  controls: [],                             // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action(s)
  keys: {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Space: ['jump', 'confirm'], KeyZ: ['jump', 'confirm'],
    KeyX: 'attack', KeyC: 'roar',
    Enter: ['start', 'confirm', 'pause'], NumpadEnter: ['start', 'confirm', 'pause'],
    Escape: ['back', 'pause'], Backspace: 'back', KeyP: 'pause',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // Standard-mapping (Xbox-style) pads, laid out like a 3-button Genesis pad:
  //   A = jump (Genesis B)   X / Y = swipe (Genesis A)   B / RB / LB = roar (Genesis C)
  //   Start = start / pause   View (Back) = back.   D-pad or left stick move.
  // In menus A / Start confirm and B / View go back.
  gamepad: {
    stick: true, dead: 0.45,
    buttons: {
      0: ['jump', 'confirm'], 1: ['roar', 'back'], 2: 'attack', 3: 'attack',
      4: 'roar', 5: 'roar', 6: 'attack', 7: 'jump',
      8: 'back', 9: ['start', 'confirm', 'pause'],
      12: 'up', 13: 'down', 14: 'left', 15: 'right'
    }
  },

  power: null,
  settings: { contrast: 4, scanlines: false, fit: 'pixel', difficulty: 1 },   // difficulty 0 easy, 1 normal, 2 hard
  scores: {
    max: 10, nameLength: 3,
    seed: [['MOB', 250000], ['BRM', 200000], ['WLW', 160000], ['TTS', 120000], ['DZR', 100000],
      ['LUN', 80000], ['SLO', 60000], ['ZZZ', 40000], ['NAP', 25000], ['YAW', 10000]]
  },
  audio: { sfxMax: 0.75, musicMax: 0.5 },
  input: { drift: 1.25 },
  debug: false
};
