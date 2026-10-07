/* ============================================================================
   GAME CONFIG — SLOTH INVADERS
   Full-screen arcade game: plumbing/monitor.js shows the 384x216 picture as large
   as the browser allows (5x on 1080p, 10x on 4K, integer scaling whenever it fills
   the screen). 16:9 so it matches the title artwork. Action names are the game's
   own words; Plumbing never interprets them.
   ============================================================================ */
'use strict';
window.GAME_CONFIG = {
  title: 'SLOTH INVADERS',
  storage: 'lcc-sloth-invaders',             // UNIQUE localStorage namespace for this game
  fps: 60,

  monitor: { background: '#000', fit: 'pixel', cursorHide: 2.5 },

  lcd: {
    width: 384, height: 216,                 // 16:9, square pixels (matches the title artwork)
    palette: null,                           // full colour
    ghost: 0, grid: null,
    scanlines: 0.22                          // CRT scanline strength (toggle in OPTIONS)
  },

  controls: [],                              // keyboard / gamepad game: no on-screen zones

  // KeyboardEvent.code -> action
  keys: {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'fire', KeyZ: 'fire',
    Enter: 'start', NumpadEnter: 'start',
    Escape: 'back', KeyP: 'pause',
    KeyM: 'mute', KeyF: 'fullscreen'
  },

  gamepad: { buttons: { 0: 'fire', 1: 'fire', 2: 'fire', 3: 'fire', 9: 'start', 8: 'back' }, stick: true },

  power: null,
  settings: { contrast: 4, scanlines: true },  // contrast 4 = colours untouched
  scores: {
    max: 10, nameLength: 3,
    seed: [['LCC', 25000], ['PNG', 20000], ['ICE', 16000], ['FLP', 12500], ['FSH', 10000],
      ['SLO', 7500], ['ZZZ', 5000], ['NAP', 3000], ['MOO', 2000], ['ACN', 1000]]
  },
  audio: { sfxMax: 0.8, musicMax: 0.4 },
  input: { drift: 1.25 },
  debug: false,

  // ---------------- game tuning (Plumbing never reads below this line) ----------------
  player: {
    speed: 1.75,          // px / frame, no acceleration: instant and exact
    minX: 10, maxX: 374,  // ship centre limits
    y: 186,               // ship top
    shotSpeed: 5,
    cooldown: 10,         // frames between shots (one shot on screen unless RAPID)
    respawnInvul: 1.5     // seconds
  },
  rules: {
    lives: 3,
    extraLife: [7500, 20000],          // first award, then every N after
    landLine: 184,                     // a sloth's feet past this = THE SLOTHS HAVE LANDED
    points: { ufo: 10, walk: 20, attack: 30, commander: 100, mini: 10 },
    diveMultiplier: 2,
    waveBonus: 100,                    // x wave number, capped
    waveBonusMax: 2500,
    specialBonus: 2000,
    accuracyMin: 50,                   // % hit rate before the accuracy bonus pays
    slothership: [50, 100, 150, 200, 300],
    slothershipFast: 1000,
    lucky: 13,                         // hit the Slothership with your 13th shot of a wave...
    luckyPoints: 500,
    projectilePoints: 50,              // shooting an acorn / mug / couch out of the sky
    powerups: { double: 12, pierce: 10, rapid: 12, shield: 20, freeze: 6 }   // seconds
  }
};
