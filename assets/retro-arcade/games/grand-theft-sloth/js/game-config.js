/* ============================================================================
   GAME CONFIG — GRAND THEFT SLOTH
   Full-screen arcade game on Lucid Plumbing (monitor.js): a 480x360 pixel picture
   scaled up crisp. Keyboard + mouse, or any standard (Xbox-style) gamepad.
   Action names are the game's own words; Plumbing never interprets them.
   Analogue sticks / triggers and the mouse are read directly in js/controls.js.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'GRAND THEFT SLOTH',
  storage: 'lcc-grand-theft-sloth',          // UNIQUE localStorage namespace
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 0 },

  lcd: {
    width: 480, height: 360,                 // 4:3, matches the title art
    palette: null, direct: true,             // full-colour fast path
    ghost: 0, grid: null, scanlines: 0
  },

  controls: [],

  keys: {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    ControlLeft: 'fire', ControlRight: 'fire', KeyK: 'fire',
    Space: ['hand', 'confirm'],
    KeyE: 'enter', KeyF: 'enter',
    KeyR: 'reload', KeyQ: 'prevw', Tab: 'nextw',
    Digit1: 'w1', Digit2: 'w2', Digit3: 'w3', Digit4: 'w4', Digit5: 'w5', Digit6: 'w6', Digit7: 'w7', Digit8: 'w8',
    KeyT: 'radio', KeyH: 'horn',
    Enter: ['confirm', 'start'], NumpadEnter: ['confirm', 'start'],
    Escape: ['pause', 'back'], KeyP: 'pause', Backspace: 'back',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // standard mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 View, 9 Menu, 10 LS, 11 RS, 12-15 d-pad
  gamepad: {
    stick: true, dead: 0.5,
    buttons: {
      0: ['confirm', 'enter'], 1: ['back', 'padb'], 2: 'padx', 3: 'radio',
      4: 'prevw', 5: 'nextw', 6: 'padlt', 7: 'padrt',
      8: 'back', 9: ['pause', 'start'], 10: 'horn',
      12: 'up', 13: 'down', 14: 'left', 15: 'right'
    }
  },

  power: null,
  settings: { contrast: 4, scanlines: false, fit: 'pixel', cheat: false, station: 0 },
  scores: { max: 10, nameLength: 3, seed: [] },
  audio: { sfxMax: 0.8, musicMax: 0.5 },
  input: { drift: 1.25 },
  debug: false
};
