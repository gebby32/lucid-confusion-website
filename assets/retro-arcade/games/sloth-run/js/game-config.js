/* ============================================================================
   GAME CONFIG — SLOTH RUN
   Full-screen arcade racer: plumbing/monitor.js shows the 400x300 pixel picture as
   large as the browser allows. The title screen is the supplied artwork, painted at
   full monitor resolution through LP.LCD.post (see main.js).
   Action names are the game's own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SLOTH RUN',
  storage: 'lcc-sloth-run',                 // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 2.5 },

  lcd: {
    width: 400, height: 300,                // 4:3 with square pixels (matches the title art)
    palette: null,                          // full colour
    direct: true,                           // fast path: no per-pixel LCD pass (see plumbing/lcd.js)
    ghost: 0, grid: null,
    scanlines: 0                            // the game draws its own (optional setting)
  },

  controls: [],                             // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action(s)
  keys: {
    ArrowUp: ['up', 'accel'], ArrowDown: ['down', 'brake'], ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: ['up', 'accel'], KeyS: ['down', 'brake'], KeyA: 'left', KeyD: 'right',
    KeyX: 'accel', KeyZ: 'brake', Space: ['accel', 'confirm'],
    Enter: ['start', 'confirm', 'pause'], NumpadEnter: ['start', 'confirm', 'pause'],
    Escape: ['back', 'pause'], Backspace: 'back', KeyP: 'pause',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // standard-mapping (Xbox-style) pads.  A / RT accelerate, B / LT brake, Start pause, Back = back.
  // The left stick also steers ANALOGUE (read directly in race.js); here it also gives digital
  // left / right / up / down for menus.
  gamepad: {
    stick: true, dead: 0.5,
    buttons: {
      0: ['confirm', 'accel'], 1: ['back', 'brake'], 2: 'accel', 3: 'brake',
      6: 'brake', 7: 'accel',
      8: 'back', 9: ['start', 'pause'],
      12: 'up', 13: 'down', 14: 'left', 15: 'right'
    }
  },

  power: null,
  settings: { contrast: 4, scanlines: false, fit: 'pixel', station: 0 },   // contrast 4 = colours untouched
  scores: {
    max: 10, nameLength: 3,
    seed: [['SLO', 900000], ['RUN', 800000], ['LCC', 700000], ['ZZZ', 600000], ['NAP', 500000],
      ['YAW', 400000], ['CHL', 300000], ['HNG', 200000], ['LSE', 120000], ['MEH', 60000]]
  },
  audio: { sfxMax: 0.8, musicMax: 0.55 },
  input: { drift: 1.25 },
  debug: false
};
