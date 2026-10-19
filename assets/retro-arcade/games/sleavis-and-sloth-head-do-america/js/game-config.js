/* ============================================================================
   GAME CONFIG — SLEAVIS AND SLOTH-HEAD DO AMERICA
   Full-screen game on Lucid Plumbing (monitor.js). The HUD / menus are a 480x360
   pixel picture; the 3D world is rendered by js/gfx3d.js at full monitor resolution
   (the PS1 world chunky, the two supplied character models crisp) and composited
   underneath through LP.LCD.post.
   Action names are the game's own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SLEAVIS AND SLOTH-HEAD DO AMERICA',
  storage: 'lcc-sleavis-do-america',          // UNIQUE localStorage namespace
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', minFill: 0.8, cursorHide: 2.5 },

  lcd: {
    width: 480, height: 360,                  // 4:3, matches the title art
    palette: null, direct: true,
    ghost: 0, grid: null, scanlines: 0
  },

  controls: [],

  keys: {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Space: ['jump', 'confirm'],
    KeyJ: 'punch', ControlLeft: 'punch', ControlRight: 'punch', KeyK: 'punch',
    KeyE: ['use', 'confirm'], KeyF: 'use',
    Tab: 'swap', KeyQ: 'swap',
    ShiftLeft: 'special', ShiftRight: 'special', KeyL: 'special',
    Enter: ['confirm', 'start'], NumpadEnter: ['confirm', 'start'],
    Escape: ['pause', 'back'], KeyP: 'pause', Backspace: 'back',
    KeyM: 'mute', F2: 'fullscreen'
  },

  // standard mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 View, 9 Menu, 12-15 d-pad
  gamepad: {
    stick: true, dead: 0.5,
    buttons: {
      0: ['jump', 'confirm'], 1: ['use', 'back'], 2: 'punch', 3: 'swap',
      4: 'special', 5: 'special', 6: 'brake', 7: 'gas',
      8: 'back', 9: ['pause', 'start'],
      12: 'up', 13: 'down', 14: 'left', 15: 'right'
    }
  },

  power: null,
  settings: { contrast: 3, scanlines: false, fit: 'pixel', chunk: 2, voice: 1, subs: true, shake: true },
  scores: { max: 10, nameLength: 3, seed: [] },
  audio: { sfxMax: 0.8, musicMax: 0.5 },
  input: { drift: 1.25 },
  debug: false
};
