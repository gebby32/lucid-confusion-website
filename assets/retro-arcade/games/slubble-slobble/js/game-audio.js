/* GAME AUDIO — every sound and every note is original and generated live with Web Audio.
   NES-style: two pulse channels (lead + offbeat harmony), a triangle bass, a noise drum
   channel. One bouncy, deliberately-repetitive 8-bar main theme ("the Slubble Slobble
   song") is re-voiced into the other tracks so the whole cartridge sounds like one game:
     main / main2 / main3   world variations (key, tempo, pulse width)
     danger / danger2       the same tune shifted into minor, faster, busier
     title / ending         slower, fuller versions     boss / final / final2   boss themes
   Jingles (ready, clear, fanfare, game over, high score...) are one-shot sounds. */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio, m = A.midi;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (tok) => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(tok); if (!r) return null; return 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); };
  const seq = (notes, t, type, vol, gap, o) => notes.forEach((n, i) => { if (n) A.tone(type, n, n, t + i * gap, gap * 0.95, vol, o); });

  // ------------------------------------------------------------------ the tracker
  // channel string: tokens separated by spaces, one per 16th: C5 / D#4 / Bb3 note, '-' hold, '.' rest
  function parse(str, xf) {
    const toks = str.trim().split(/\s+/), ev = new Array(toks.length).fill(null);
    for (let i = 0; i < toks.length; i++) {
      let n = midiOf(toks[i]);
      if (n === null) continue;
      if (xf) n = xf(n);
      let len = 1; while (toks[i + len] === '-') len++;
      ev[i] = { n, len };
    }
    return ev;
  }
  // shift a C-major melody down two scale degrees -> the relative minor, same contour
  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  function toMinor(n) {
    const pc = ((n % 12) + 12) % 12, oct = Math.floor(n / 12);
    let d = SCALE.indexOf(pc);
    if (d < 0) return n - 3;
    d -= 2; let o = oct; if (d < 0) { d += 7; o--; }
    return o * 12 + SCALE[d];
  }
  function song(name, def) {
    const ch = {};
    for (const k of ['lead', 'harm', 'bass', 'drums', 'arp']) if (def[k]) ch[k] = k === 'drums' ? def[k].trim().split(/\s+/) : parse(def[k], def.xf);
    const length = Math.max(...Object.values(ch).map((c) => c.length));
    const s = {
      bpm: def.bpm, base: def.bpm, stepsPerBeat: 4, length,
      step(i, t, dur) {
        const v = def.vol || 1;
        const L = ch.lead && ch.lead[i];
        if (L) A.tone(def.leadType || 'p25', m(L.n), m(L.n), t, L.len * dur * 0.92, 0.13 * v, { bus: 'music', vibrato: L.len >= 3 ? 6 : 0, depth: 5, hold: Math.min(L.len * dur * 0.5, 0.2) });
        if (def.echo && L) A.tone('p12', m(L.n), m(L.n), t + dur * 1.5, L.len * dur * 0.7, 0.035 * v, { bus: 'music' });
        const H = ch.harm && ch.harm[i];
        if (H) A.tone(def.harmType || 'p12', m(H.n), m(H.n), t, Math.max(1, H.len) * dur * 0.6, 0.06 * v, { bus: 'music' });
        const R = ch.arp && ch.arp[i];
        if (R) A.tone('p12', m(R.n), m(R.n), t, dur * 0.5, 0.045 * v, { bus: 'music' });
        const B = ch.bass && ch.bass[i];
        if (B) A.tone('triangle', m(B.n), m(B.n), t, B.len * dur * 0.85, 0.3 * v, { bus: 'music' });
        const D = ch.drums && ch.drums[i];
        if (D && D !== '.') drum(D, t, v);
      }
    };
    A.song(name, s);
    return s;
  }
  function drum(d, t, v) {
    if (d === 'k') { A.tone('triangle', 160, 45, t, 0.09, 0.42 * v, { bus: 'music' }); }
    else if (d === 's') { A.noise(t, 0.09, 0.16 * v, { filter: 'bandpass', f0: 2200, f1: 1200, q: 0.8, bus: 'music' }); A.tone('triangle', 220, 140, t, 0.05, 0.12 * v, { bus: 'music' }); }
    else if (d === 'h') A.noise(t, 0.025, 0.05 * v, { filter: 'highpass', f0: 7000, bus: 'music' });
    else if (d === 'o') A.noise(t, 0.09, 0.05 * v, { filter: 'highpass', f0: 6000, bus: 'music' });
  }

  // ---------------------------------------------------------------- THE SLUBBLE SLOBBLE SONG (8 bars)
  const MAIN = {
    lead:
      'E5 . G5 . C6 . G5 . A5 - G5 . E5 . C5 . ' +
      'D5 . F5 . A5 . F5 . G5 - F5 . D5 . B4 . ' +
      'E5 . G5 . C6 . E6 . D6 . C6 . B5 . G5 . ' +
      'A5 - - . G5 - - . C6 - - - . . . . ' +
      'E5 . G5 . C6 . G5 . A5 - G5 . E5 . C5 . ' +
      'F5 . A5 . C6 . A5 . G5 - E5 . D5 . C5 . ' +
      'D5 . D5 . E5 F5 G5 . A5 . B5 . C6 . D6 . ' +
      'C6 - - . G5 - E5 . C5 - - - . . G4 .',
    harm:
      '. . E4 . . . G4 . . . E4 . . . G4 . ' +
      '. . D4 . . . B3 . . . D4 . . . B3 . ' +
      '. . E4 . . . G4 . . . E4 . . . G4 . ' +
      '. . C4 . . . C4 . . . B3 . . . E4 . ' +
      '. . E4 . . . G4 . . . E4 . . . G4 . ' +
      '. . A3 . . . C4 . . . B3 . . . D4 . ' +
      '. . B3 . . . D4 . . . B3 . . . D4 . ' +
      '. . E4 . . . G4 . . . E4 . . . . .',
    bass:
      'C3 . C4 . G3 . C4 . C3 . C4 . G3 . C4 . ' +
      'G2 . G3 . D3 . G3 . G2 . G3 . D3 . G3 . ' +
      'C3 . C4 . G3 . C4 . C3 . C4 . G3 . C4 . ' +
      'F2 . F3 . F2 . F3 . G2 . G3 . C3 . C4 . ' +
      'C3 . C4 . G3 . C4 . C3 . C4 . G3 . C4 . ' +
      'F2 . F3 . C3 . F3 . G2 . G3 . D3 . G3 . ' +
      'G2 . G3 . D3 . G3 . G2 . G3 . B2 . D3 . ' +
      'C3 . C4 . G3 . E3 . C3 . . . G2 . . .',
    drums:
      ('k . h . s . h . k . h k s . h h ').repeat(3) + 'k . h . s . h . k . s . k . s s ' +
      ('k . h . s . h . k . h k s . h h ').repeat(3) + 'k . h . s . s . k k s . s s s s'
  };
  const tr = (k) => (n) => n + k;
  song('main', Object.assign({}, MAIN, { bpm: 152 }));
  song('main2', Object.assign({}, MAIN, { bpm: 144, xf: tr(5), leadType: 'p12', echo: true }));
  song('main3', Object.assign({}, MAIN, { bpm: 160, xf: tr(2), leadType: 'square', vol: 0.85 }));
  song('title', Object.assign({}, MAIN, { bpm: 132, leadType: 'square', echo: true, vol: 0.9 }));
  song('ending', Object.assign({}, MAIN, { bpm: 126, xf: tr(5), leadType: 'p25', echo: true,
    arp: ('C5 E5 G5 C6 '.repeat(4) + 'B4 D5 G5 B5 '.repeat(4) + 'C5 E5 G5 C6 '.repeat(4) + 'A4 C5 F5 G5 '.repeat(4)).repeat(2) }));
  // the same tune, shifted into minor — haunted / lava worlds
  const DANGER_DRUMS = ('k h s h k h s h k h s h k k s h ').repeat(7) + 'k k s k s s s s k s s s s s s s';
  const DANGER_BASS = ('A2 A2 A3 A2 A2 A2 A3 A2 E2 E2 E3 E2 E2 E2 E3 E2 ').repeat(2) + ('F2 F2 F3 F2 F2 F2 F3 F2 E2 E2 E3 E2 G#2 G#2 G#3 G#2 ').repeat(2) +
    ('A2 A2 A3 A2 A2 A2 A3 A2 E2 E2 E3 E2 E2 E2 E3 E2 ').repeat(2) + ('D2 D2 D3 D2 E2 E2 E3 E2 A2 A2 A3 A2 A2 . A1 . ').repeat(2);
  song('danger', { lead: MAIN.lead, harm: MAIN.harm, bass: DANGER_BASS, drums: DANGER_DRUMS, bpm: 166, xf: toMinor, leadType: 'p25' });
  song('danger2', { lead: MAIN.lead, harm: MAIN.harm, bass: DANGER_BASS, drums: DANGER_DRUMS, bpm: 176, xf: (n) => toMinor(n) + 1, leadType: 'square', vol: 0.85,
    arp: ('A4 C5 E5 A5 '.repeat(4) + 'G#4 B4 E5 G#5 '.repeat(4)).repeat(4) });
  // the boss theme: the opening motif, minor, chugging
  const BOSS = {
    lead:
      'A4 . C5 . E5 . C5 . F5 - E5 . C5 . A4 . ' +
      'G4 . B4 . D5 . B4 . E5 - D5 . B4 . G#4 . ' +
      'A4 . C5 . E5 . A5 . G5 . F5 . E5 . D5 . ' +
      'E5 - - . D5 - - . C5 - B4 - G#4 - E4 . ' +
      'A5 . A5 . G5 . A5 . F5 - E5 . C5 . A4 . ' +
      'G4 . B4 . D5 . E5 . F5 - E5 . D5 . B4 . ' +
      'C5 . E5 . A5 . C6 . B5 . A5 . G#5 . E5 . ' +
      'A5 - - - G#5 - - - A5 - - - . . E5 .',
    bass: ('A1 A2 A1 A2 A1 A2 A1 A2 ').repeat(2) + ('E1 E2 E1 E2 E1 E2 E1 E2 ').repeat(2) + ('A1 A2 A1 A2 C2 C3 C2 C3 ').repeat(2) + ('E1 E2 E1 E2 E1 E2 G#1 G#2 ').repeat(2) +
      ('F1 F2 F1 F2 F1 F2 F1 F2 ').repeat(2) + ('G1 G2 G1 G2 G1 G2 G1 G2 ').repeat(2) + ('A1 A2 A1 A2 A1 A2 A1 A2 ').repeat(2) + ('E1 E2 E1 E2 E2 E1 E2 E1 ').repeat(2),
    harm: ('. . C4 . . . E4 . . . C4 . . . E4 . ').repeat(8),
    drums: ('k h k h s h k h k h k h s h s h ').repeat(7) + 'k k s k k s s s s s s s s s s s'
  };
  song('boss', Object.assign({}, BOSS, { bpm: 170 }));
  song('final', Object.assign({}, BOSS, { bpm: 180, xf: tr(1), leadType: 'square', vol: 0.9,
    arp: ('A4 E5 A5 E5 '.repeat(4) + 'G#4 E5 G#5 E5 '.repeat(4)).repeat(4) }));
  song('final2', Object.assign({}, BOSS, { bpm: 196, xf: tr(3), leadType: 'square', vol: 0.9, echo: true,
    arp: ('C5 G5 C6 G5 '.repeat(4) + 'B4 G5 B5 G5 '.repeat(4)).repeat(4) }));

  // ------------------------------------------------------------------ interface sounds
  A.sound('menu', (t) => A.tone('p25', 1180, 1180, t, 0.04, 0.1));
  A.sound('select', (t) => { A.tone('p25', 880, 880, t, 0.05, 0.12); A.tone('p25', 1320, 1320, t + 0.05, 0.08, 0.12); });
  A.sound('start', (t) => seq([m(72), m(76), m(79), m(84)], t, 'square', 0.12, 0.06));
  A.sound('pause', (t) => { A.tone('p25', 988, 988, t, 0.06, 0.12); A.tone('p25', 659, 659, t + 0.07, 0.06, 0.12); A.tone('p25', 988, 988, t + 0.14, 0.06, 0.12); A.tone('p25', 659, 659, t + 0.21, 0.1, 0.12); });
  A.sound('tick', (t) => A.tone('p25', 2000, 2000, t, 0.025, 0.07));
  A.sound('continue', (t) => seq([m(69), 0, m(69), 0, m(72)], t, 'square', 0.12, 0.09));
  A.sound('highscore', (t) => seq([m(72), m(76), m(79), m(84), m(79), m(84), m(88)], t, 'p25', 0.12, 0.08));

  // ------------------------------------------------------------------ sloths
  A.sound('jump', (t) => { A.tone('square', 300, 760, t, 0.12, 0.1); A.tone('p12', 600, 1300, t + 0.02, 0.09, 0.035); });
  A.sound('land', (t) => A.noise(t, 0.04, 0.12, { f0: 900, f1: 200 }));
  A.sound('fire', (t, o) => {
    const f = o.who === 'slob' ? 1.12 : 1;
    A.tone('p25', 520 * f, 1250 * f, t, 0.07, 0.11);
    A.tone('sine', 900 * f, 400 * f, t + 0.02, 0.08, 0.12);
    A.noise(t, 0.04, 0.05, { filter: 'bandpass', f0: 3000, q: 2 });
  });
  A.sound('float', (t) => A.tone('sine', 300, 520, t, 0.18, 0.05, { vibrato: 18, depth: 40 }));
  A.sound('trap', (t) => { A.tone('p25', 660, 330, t, 0.06, 0.1); A.tone('sine', 400, 900, t + 0.05, 0.16, 0.14, { vibrato: 22, depth: 60 }); });
  // the pop: a bright little "plip" that climbs with the chain
  A.sound('pop', (t, o) => { const k = Math.pow(1.06, Math.min(12, o.n || 0)); A.tone('sine', 1500 * k, 2600 * k, t, 0.045, 0.16); A.noise(t, 0.03, 0.08, { filter: 'highpass', f0: 4000 }); });
  A.sound('popBig', (t, o) => {
    const k = Math.pow(1.122, Math.min(10, (o.n || 1) - 1));
    A.tone('sine', 900 * k, 2400 * k, t, 0.06, 0.2);
    A.tone('square', 1200 * k, 600 * k, t + 0.02, 0.08, 0.07);
    A.noise(t, 0.08, 0.16, { filter: 'bandpass', f0: 3200 * k, f1: 900, q: 1.2 });
    A.tone('p25', 1568 * k, 1568 * k, t + 0.07, 0.07, 0.08); A.tone('p25', 2093 * k, 2093 * k, t + 0.12, 0.1, 0.07);
  });
  A.sound('pip', (t) => A.tone('sine', 1300, 1900, t, 0.035, 0.08));
  A.sound('escape', (t) => { A.tone('sawtooth', 220, 440, t, 0.18, 0.08, { vibrato: 20, depth: 30 }); A.tone('p25', 330, 660, t + 0.1, 0.12, 0.08); });
  A.sound('boing', (t) => A.tone('sine', 220, 660, t, 0.18, 0.22, { vibrato: 26, depth: 60 }));
  A.sound('spring', (t) => { A.tone('sine', 150, 900, t, 0.25, 0.26, { vibrato: 30, depth: 80 }); A.tone('p25', 400, 1200, t, 0.15, 0.05); });
  A.sound('swim', (t) => A.noise(t, 0.08, 0.08, { filter: 'bandpass', f0: 700, f1: 1500, q: 2 }));
  A.sound('warp', (t) => { for (let i = 0; i < 6; i++) A.tone('p25', 400 + i * 220, 600 + i * 220, t + i * 0.025, 0.03, 0.07); });
  A.sound('hurt', (t) => { A.noise(t, 0.18, 0.4, { f0: 2500, f1: 200 }); A.tone('square', 600, 120, t, 0.22, 0.16); });
  A.sound('death', (t) => {
    seq([m(76), m(75), m(74), m(73), m(72), m(71), m(70), m(69)], t, 'p25', 0.12, 0.07);
    A.tone('triangle', 180, 50, t + 0.56, 0.5, 0.3);
  });
  A.sound('respawn', (t) => seq([m(67), m(72), m(76)], t, 'p12', 0.08, 0.05));
  A.sound('shieldPop', (t) => { A.tone('sine', 2000, 500, t, 0.15, 0.16); A.noise(t, 0.12, 0.2, { filter: 'highpass', f0: 3000 }); });

  // ------------------------------------------------------------------ goodies + scoring
  A.sound('pickup', (t) => { A.tone('p25', 1319, 1319, t, 0.04, 0.1); A.tone('p25', 1976, 1976, t + 0.04, 0.07, 0.1); });
  A.sound('treasure', (t) => seq([m(84), m(88), m(91), m(96), m(91), m(96)], t, 'p25', 0.1, 0.04));
  A.sound('powerup', (t) => { for (let i = 0; i < 10; i++) A.tone('square', 300 + i * 90, 380 + i * 90, t + i * 0.03, 0.03, 0.08); seq([m(84), m(88), m(91)], t + 0.3, 'p25', 0.1, 0.05); });
  A.sound('freeze', (t) => { for (let i = 0; i < 8; i++) A.tone('sine', 3000 - i * 250, 2800 - i * 250, t + i * 0.035, 0.04, 0.08); });
  A.sound('oneup', (t) => seq([m(76), m(79), m(88), m(84), m(86), m(91)], t, 'p25', 0.12, 0.07));
  A.sound('chain', (t, o) => { const n = Math.min(6, o.n || 2); for (let i = 0; i < n + 2; i++) A.tone('p25', m(72 + [0, 4, 7, 12, 16, 19, 24, 28][i]), m(72 + [0, 4, 7, 12, 16, 19, 24, 28][i]), t + i * 0.045, 0.05, 0.09); });
  A.sound('thud', (t) => { A.tone('triangle', 140, 60, t, 0.06, 0.22); A.noise(t, 0.03, 0.06, { f0: 600, f1: 100 }); });

  // ------------------------------------------------------------------ jingles
  A.sound('ready', (t) => { seq([m(72), 0, m(72), m(79)], t, 'p25', 0.11, 0.09); A.tone('triangle', m(48), m(48), t, 0.36, 0.25); });
  A.sound('clear', (t) => {
    seq([m(76), m(79), m(84), 0, m(81), m(84), m(88)], t, 'square', 0.12, 0.09);
    seq([m(72), m(76), m(79), 0, m(77), m(81), m(84)], t, 'p12', 0.06, 0.09);
    seq([m(48), 0, m(55), 0, m(53), 0, m(48)], t, 'triangle', 0.3, 0.09);
    A.tone('square', m(91), m(91), t + 0.63, 0.5, 0.11, { vibrato: 6, depth: 6, hold: 0.25 });
  });
  A.sound('fanfare', (t) => {
    const mel = [72, 72, 72, 76, 79, 0, 76, 79, 84, 0, 84, 84, 88, 91, 96];
    seq(mel.map((n) => (n ? m(n) : 0)), t, 'square', 0.13, 0.1);
    seq(mel.map((n) => (n ? m(n - 12) : 0)), t, 'triangle', 0.28, 0.1);
  });
  A.sound('gameover', (t) => {
    seq([m(76), 0, m(74), 0, m(72), 0, m(71), m(69), 0, 0, m(64)], t, 'p25', 0.12, 0.14);
    seq([m(45), 0, 0, 0, m(41), 0, 0, 0, m(40), 0, m(33)], t, 'triangle', 0.3, 0.14);
  });
  A.sound('warning', (t) => { for (let i = 0; i < 6; i++) A.tone('square', i % 2 ? 660 : 880, i % 2 ? 660 : 880, t + i * 0.22, 0.2, 0.09); });
  A.sound('hurry', (t) => { for (let i = 0; i < 8; i++) A.tone('p25', i % 2 ? 1568 : 1760, i % 2 ? 1568 : 1760, t + i * 0.08, 0.06, 0.09); });
  A.sound('landlord', (t) => { A.tone('sawtooth', 110, 90, t, 0.6, 0.12, { vibrato: 5, depth: 6 }); seq([m(57), m(56), m(55), m(54)], t + 0.1, 'p25', 0.08, 0.16); });

  // ------------------------------------------------------------------ enemies + world
  A.sound('hop', (t) => A.tone('p12', 300, 600, t, 0.06, 0.04));
  A.sound('bonk', (t) => { A.noise(t, 0.08, 0.25, { f0: 900, f1: 120 }); A.tone('square', 180, 80, t, 0.09, 0.12); });
  A.sound('snort', (t) => A.noise(t, 0.2, 0.15, { filter: 'bandpass', f0: 500, f1: 300, q: 3 }));
  A.sound('shoot', (t, o) => {
    if (o.k === 'laser') A.tone('square', 1800, 400, t, 0.12, 0.07);
    else if (o.k === 'egg') A.tone('p25', 900, 500, t, 0.08, 0.06);
    else A.tone('p25', 700, 300, t, 0.1, 0.06);
  });
  A.sound('splat', (t) => A.noise(t, 0.1, 0.14, { filter: 'bandpass', f0: 1200, f1: 400, q: 1 }));
  A.sound('clank', (t) => { A.tone('p12', 1800, 1700, t, 0.05, 0.12); A.tone('p12', 1250, 1200, t + 0.05, 0.06, 0.12); A.noise(t, 0.05, 0.12, { filter: 'highpass', f0: 3000 }); });
  A.sound('jet', (t) => A.noise(t, 0.4, 0.06, { filter: 'bandpass', f0: 600, f1: 1400, q: 0.7 }));

  // ------------------------------------------------------------------ bosses
  A.sound('bossHit', (t) => { A.noise(t, 0.25, 0.45, { f0: 3000, f1: 150 }); A.tone('square', 500, 90, t, 0.25, 0.18); A.tone('sine', 120, 40, t, 0.3, 0.4); });
  A.sound('boom', (t) => { A.noise(t, 0.35, 0.4, { f0: 1500, f1: 60 }); A.tone('triangle', 100, 30, t, 0.35, 0.35); });
  A.sound('bossDown', (t) => { for (let i = 0; i < 5; i++) { A.noise(t + i * 0.25, 0.3, 0.35, { f0: 2000, f1: 80 }); A.tone('triangle', 120 - i * 15, 30, t + i * 0.25, 0.3, 0.3); } });
  A.sound('spit', (t) => { A.tone('sawtooth', 300, 140, t, 0.12, 0.08); A.noise(t, 0.08, 0.1, { filter: 'bandpass', f0: 1500, q: 2 }); });
  A.sound('tongue', (t) => A.tone('sine', 200, 1200, t, 0.18, 0.18, { vibrato: 40, depth: 50 }));
  A.sound('bigHop', (t) => A.tone('square', 120, 400, t, 0.2, 0.12));
  A.sound('thudBig', (t) => { A.noise(t, 0.2, 0.45, { f0: 700, f1: 50 }); A.tone('sine', 90, 30, t, 0.3, 0.5); });
  A.sound('throw', (t) => A.noise(t, 0.15, 0.15, { filter: 'bandpass', f0: 700, f1: 2600, q: 2 }));
  A.sound('snap', (t) => { A.tone('square', 1200, 300, t, 0.06, 0.12); A.tone('square', 1200, 300, t + 0.1, 0.06, 0.12); });
  A.sound('quack', (t) => { A.tone('sawtooth', 520, 380, t, 0.12, 0.12, { vibrato: 30, depth: 40 }); A.tone('sawtooth', 500, 350, t + 0.16, 0.14, 0.12, { vibrato: 30, depth: 40 }); });
  A.sound('splash', (t) => A.noise(t, 0.35, 0.25, { filter: 'bandpass', f0: 1200, f1: 400, q: 0.8 }));
  A.sound('whoosh', (t) => A.noise(t, 0.25, 0.12, { filter: 'bandpass', f0: 400, f1: 2400, q: 1.5 }));
  A.sound('daze', (t) => { for (let i = 0; i < 6; i++) A.tone('sine', 1200 + (i % 2) * 300, 1200 + (i % 2) * 300, t + i * 0.08, 0.07, 0.08); });
  A.sound('coat', (t) => A.tone('sine', 700, 1000, t, 0.08, 0.12));
  A.sound('missile', (t) => { A.noise(t, 0.3, 0.12, { filter: 'highpass', f0: 1500, f1: 600 }); A.tone('square', 200, 600, t, 0.2, 0.06); });
  A.sound('laserBig', (t) => { A.tone('sawtooth', 120, 60, t, 0.7, 0.14); A.tone('square', 2400, 2000, t, 0.7, 0.04); });
  A.sound('charge', (t) => A.tone('square', 200, 1600, t, 0.6, 0.05));
  A.sound('vacuum', (t) => A.noise(t, 2.4, 0.12, { filter: 'bandpass', f0: 300, f1: 900, q: 0.6 }));
  A.sound('nom', (t) => { A.tone('square', 300, 200, t, 0.06, 0.1); A.tone('square', 260, 160, t + 0.08, 0.06, 0.1); });
  A.sound('returnShot', (t) => seq([m(84), m(79), m(91)], t, 'p25', 0.1, 0.04));

  return {
    setHurry(on) {
      for (const k in A.songs) A.songs[k].bpm = A.songs[k].base;
      if (on && A.song_) A.song_.bpm = A.song_.base * 1.18;
    }
  };
})();
