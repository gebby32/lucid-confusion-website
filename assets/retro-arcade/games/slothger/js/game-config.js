/* ============================================================================
   GAME CONFIG — SLOTHGER: The Slow Road Home
   Full-screen arcade game: plumbing/monitor.js shows the 320x240 retro picture as
   large as the browser allows. The sloth is NOT drawn into that picture: js/sloth.js
   paints the supplied renders at full monitor resolution on top of it.
   Action names are the game's own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SLOTHGER',
  storage: 'lcc-slothger',                  // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 2.5 },

  lcd: {
    width: 320, height: 240,                // 4:3 with square pixels (matches the title art)
    palette: null,                          // full colour
    ghost: 0, grid: null,
    scanlines: 0                            // the game draws its own (under the sloth)
  },

  controls: [],                             // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action(s)
  keys: {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Enter: ['start', 'confirm', 'pause'], NumpadEnter: ['start', 'confirm', 'pause'],
    Space: 'confirm',
    Escape: ['back', 'pause'], Backspace: 'back', KeyP: 'pause',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // standard-mapping (Xbox-style) pads: d-pad / left stick move, A confirm, B back, Start pause
  gamepad: {
    stick: true, dead: 0.5,
    buttons: { 0: 'confirm', 1: 'back', 8: 'back', 9: ['start', 'pause'], 12: 'up', 13: 'down', 14: 'left', 15: 'right' }
  },

  power: null,
  settings: { contrast: 4, scanlines: false, fit: 'pixel' },   // contrast 4 = colours untouched
  scores: {
    max: 10, nameLength: 3,
    seed: [['SLO', 60000], ['THG', 45000], ['LCC', 35000], ['FRG', 25000], ['HOP', 18000],
      ['ZZZ', 12000], ['LOG', 8000], ['NAP', 5000], ['YAW', 2500], ['MEH', 1000]]
  },
  audio: { sfxMax: 0.8, musicMax: 0.34 },
  input: { drift: 1.25 },
  debug: false,

  // ---------------- game tuning (Plumbing never reads below this line) ----------------
  sloth: {
    drawH: 25,               // rendered height in game pixels (the render towers over its 16px cell)
    hop: 8,                  // frames per hop
    repeat: 5,               // extra frames before a HELD direction hops again
    hitW: 9                  // hit box width (much narrower than the 16px cell: forgiving)
  },
  rules: {
    lives: 5, continues: 3,
    extraLife: 20000,        // every N points
    step: 10,                // each new furthest row this life
    home: 50, timeBonus: 10, // + per remaining second
    allHomes: 1000, fly: 200, leaf: 100,
    lowTime: 10              // seconds left when the timer turns red
  }
};
