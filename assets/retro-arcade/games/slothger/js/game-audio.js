/* GAME AUDIO — every sound and every note is original and generated live with Web Audio.
   Arcade-style: two pulse channels (lead + offbeat chords), a triangle bass, a noise drum
   channel. One jaunty 8-bar main theme ("The Slow Road Home") is re-voiced for each world so
   the whole game sounds like one cartridge:
     title / main (meadows) / city / works / swamp (minor, lazy) / ice / factory (minor, busy)
     night (minor, soft)  final (fast, bright)  ending (slow, full)
   setHurry(true) speeds up the current song when the timer runs low.
   Jingles (ready, home, clear, game over, high score...) are one-shot sounds. */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio, m = A.midi;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (tok) => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(tok); if (!r) return null; return 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); };
  const seq = (notes, t, type, vol, gap, o) => notes.forEach((n, i) => { if (n) A.tone(type, n, n, t + i * gap, gap * 0.95, vol, o); });

  // ------------------------------------------------------------------ the tracker
  // channel string: tokens separated by spaces, one per 16th: C5 / F#4 / Bb3 note, '-' hold, '.' rest
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
  // G major -> E minor, same contour (shift two scale degrees down)
  const SCALE = [7, 9, 11, 0, 2, 4, 6];          // G A B C D E F#
  function toMinor(n) {
    const pc = ((n % 12) + 12) % 12;
    const d = SCALE.indexOf(pc);
    if (d < 0) return n - 3;
    const nd = (d + 5) % 7;                       // two degrees down = five up, mod 7
    let diff = SCALE[nd] - pc; if (diff > 0) diff -= 12;
    return n + diff;
  }
  function song(name, def) {
    const ch = {};
    for (const k of ['lead', 'harm', 'bass', 'drums', 'arp']) if (def[k]) ch[k] = k === 'drums' ? def[k].trim().split(/\s+/) : parse(def[k], k === 'drums' ? null : def.xf);
    const length = Math.max(...Object.values(ch).map((c) => c.length));
    const s = {
      bpm: def.bpm, base: def.bpm, stepsPerBeat: 4, length,
      step(i, t, dur) {
        const v = def.vol || 1;
        const L = ch.lead && ch.lead[i];
        if (L) A.tone(def.leadType || 'p25', m(L.n), m(L.n), t, L.len * dur * 0.9, 0.12 * v, { bus: 'music', vibrato: L.len >= 3 ? 6 : 0, depth: 5, hold: Math.min(L.len * dur * 0.5, 0.2) });
        if (def.echo && L) A.tone('p12', m(L.n), m(L.n), t + dur * 1.5, L.len * dur * 0.7, 0.032 * v, { bus: 'music' });
        const H = ch.harm && ch.harm[i];
        if (H) A.tone(def.harmType || 'p12', m(H.n), m(H.n), t, Math.max(1, H.len) * dur * 0.55, 0.055 * v, { bus: 'music' });
        const R = ch.arp && ch.arp[i];
        if (R) A.tone('p12', m(R.n), m(R.n), t, dur * 0.5, 0.04 * v, { bus: 'music' });
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
    if (d === 'k') A.tone('triangle', 150, 45, t, 0.09, 0.42 * v, { bus: 'music' });
    else if (d === 's') { A.noise(t, 0.09, 0.15 * v, { filter: 'bandpass', f0: 2200, f1: 1200, q: 0.8, bus: 'music' }); A.tone('triangle', 220, 140, t, 0.05, 0.12 * v, { bus: 'music' }); }
    else if (d === 'h') A.noise(t, 0.025, 0.05 * v, { filter: 'highpass', f0: 7000, bus: 'music' });
    else if (d === 'o') A.noise(t, 0.09, 0.05 * v, { filter: 'highpass', f0: 6000, bus: 'music' });
    else if (d === 'b') A.tone('sine', 900, 880, t, 0.08, 0.06 * v, { bus: 'music' });   // woodblock "clop"
  }

  // ---------------------------------------------------------------- THE SLOW ROAD HOME (8 bars, G major)
  const MAIN = {
    lead:
      'G4 . B4 . D5 . . . B4 . D5 . G5 - - . ' +
      'F#5 . E5 . D5 . B4 . C5 - - . A4 - - . ' +
      'A4 . C5 . E5 . . . C5 . E5 . A5 - - . ' +
      'G5 . F#5 . E5 . C5 . D5 - - - . . . . ' +
      'G4 . B4 . D5 . . . B4 . D5 . G5 - - . ' +
      'B5 . A5 . G5 . E5 . F#5 . G5 . A5 - - . ' +
      'C6 . B5 . A5 . F#5 . G5 . E5 . D5 . B4 . ' +
      'C5 . A4 . F#4 . A4 . G4 - - - . . . .',
    harm:
      '. . B3 . . . D4 . . . B3 . . . D4 . ' +
      '. . A3 . . . F#4 . . . A3 . . . F#4 . ' +
      '. . C4 . . . E4 . . . C4 . . . E4 . ' +
      '. . A3 . . . F#4 . . . A3 . . . C4 . ' +
      '. . B3 . . . D4 . . . B3 . . . D4 . ' +
      '. . G3 . . . B3 . . . F#3 . . . A3 . ' +
      '. . E4 . . . G4 . . . D4 . . . B3 . ' +
      '. . F#3 . . . A3 . . . B3 . . . . .',
    bass:
      'G2 . G3 . D3 . G3 . G2 . G3 . D3 . G3 . ' +
      'D2 . D3 . A2 . D3 . D2 . D3 . A2 . D3 . ' +
      'A2 . A3 . E3 . A3 . A2 . A3 . E3 . A3 . ' +
      'D2 . D3 . A2 . D3 . D2 . D3 . F#2 . A2 . ' +
      'G2 . G3 . D3 . G3 . G2 . G3 . D3 . G3 . ' +
      'E2 . E3 . B2 . E3 . D2 . D3 . A2 . D3 . ' +
      'C3 . C4 . G2 . C3 . G2 . G3 . D3 . G3 . ' +
      'D2 . D3 . A2 . D3 . G2 . . . G1 . . .',
    drums:
      ('k . h . s . h b k . h k s . h h ').repeat(3) + 'k . h . s . h . k . s . k . s s ' +
      ('k . h . s . h b k . h k s . h h ').repeat(3) + 'k . h . s . s . k k s . s s s s'
  };
  const tr = (k) => (n) => n + k;
  const ARP_G = ('G4 B4 D5 G5 '.repeat(4) + 'D4 F#4 A4 D5 '.repeat(4) + 'A4 C5 E5 A5 '.repeat(4) + 'D4 F#4 A4 C5 '.repeat(4)) +
    ('G4 B4 D5 G5 '.repeat(4) + 'E4 G4 B4 E5 '.repeat(2) + 'D4 F#4 A4 D5 '.repeat(2) + 'C5 E5 G5 C6 '.repeat(2) + 'G4 B4 D5 G5 '.repeat(2) + 'D4 F#4 A4 D5 '.repeat(2) + 'G4 B4 D5 G5 '.repeat(2));
  song('title', Object.assign({}, MAIN, { bpm: 120, leadType: 'square', echo: true, vol: 0.9 }));
  song('main', Object.assign({}, MAIN, { bpm: 138 }));
  song('city', Object.assign({}, MAIN, { bpm: 150, xf: tr(2), leadType: 'p12', arp: ARP_G, vol: 0.9 }));
  const HEAVY = ('k . h k s . h . k k h . s . h k ').repeat(7) + 'k k s k s s s s k s s s s s s s';
  song('works', Object.assign({}, MAIN, { bpm: 146, xf: tr(-2), leadType: 'square', drums: HEAVY, vol: 0.85 }));
  const SWAMP_DRUMS = ('k . . h s . . h k . k h s . . h ').repeat(8);
  song('swamp', Object.assign({}, MAIN, { bpm: 124, xf: toMinor, leadType: 'p25', echo: true, drums: SWAMP_DRUMS }));
  song('ice', Object.assign({}, MAIN, { bpm: 134, xf: tr(5), leadType: 'p12', echo: true, arp: ARP_G }));
  song('factory', Object.assign({}, MAIN, { bpm: 156, xf: (n) => toMinor(n) + 1, leadType: 'square', drums: HEAVY, arp: ARP_G, vol: 0.85 }));
  song('night', Object.assign({}, MAIN, { bpm: 118, xf: toMinor, leadType: 'p12', echo: true, drums: SWAMP_DRUMS, vol: 0.9 }));
  song('final', Object.assign({}, MAIN, { bpm: 162, xf: tr(3), leadType: 'square', arp: ARP_G, echo: true, vol: 0.9 }));
  song('ending', Object.assign({}, MAIN, { bpm: 108, leadType: 'p25', echo: true, arp: ARP_G }));

  // ------------------------------------------------------------------ interface
  A.sound('menu', (t) => A.tone('p25', 1180, 1180, t, 0.04, 0.1));
  A.sound('select', (t) => { A.tone('p25', 880, 880, t, 0.05, 0.12); A.tone('p25', 1320, 1320, t + 0.05, 0.08, 0.12); });
  A.sound('start', (t) => seq([m(67), m(71), m(74), m(79)], t, 'square', 0.12, 0.06));
  A.sound('pause', (t) => { A.tone('p25', 988, 988, t, 0.06, 0.12); A.tone('p25', 659, 659, t + 0.07, 0.06, 0.12); A.tone('p25', 988, 988, t + 0.14, 0.06, 0.12); A.tone('p25', 659, 659, t + 0.21, 0.1, 0.12); });
  A.sound('tick', (t) => A.tone('p25', 2000, 2000, t, 0.025, 0.07));
  A.sound('continue', (t) => seq([m(69), 0, m(69), 0, m(72)], t, 'square', 0.12, 0.09));
  A.sound('highscore', (t) => seq([m(67), m(71), m(74), m(79), m(74), m(79), m(83)], t, 'p25', 0.12, 0.08));

  // ------------------------------------------------------------------ the sloth
  // the hop: a soft "plap" (fleece!) with a tiny pitch rise, a little different per direction
  A.sound('hop', (t, o) => {
    const k = o.d === 'up' ? 1.12 : o.d === 'down' ? 0.9 : 1;
    A.tone('square', 260 * k, 520 * k, t, 0.05, 0.07);
    A.tone('triangle', 180 * k, 90 * k, t, 0.06, 0.18);
    A.noise(t, 0.03, 0.05, { filter: 'bandpass', f0: 1800, q: 1.5 });
  });
  A.sound('bonk', (t) => { A.tone('square', 180, 120, t, 0.08, 0.1); A.noise(t, 0.04, 0.08, { f0: 800, f1: 200 }); });
  A.sound('plip', (t) => A.tone('sine', 700, 1100, t, 0.06, 0.12));
  A.sound('thunk', (t) => { A.tone('triangle', 200, 110, t, 0.07, 0.25); A.noise(t, 0.03, 0.05, { filter: 'lowpass', f0: 900 }); });
  A.sound('respawn', (t) => seq([m(67), m(71), m(74)], t, 'p12', 0.08, 0.05));

  // ------------------------------------------------------------------ deaths (each ends with the same sad little tail)
  const tail = (t) => {
    seq([m(74), m(73), m(72), m(71), m(70), m(69)], t, 'p25', 0.1, 0.08);
    A.tone('triangle', m(43), m(31), t + 0.48, 0.45, 0.28);
  };
  A.sound('squash', (t) => { A.noise(t, 0.22, 0.42, { f0: 2400, f1: 150 }); A.tone('square', 420, 70, t, 0.25, 0.15); A.tone('sine', 900, 200, t + 0.05, 0.12, 0.08); tail(t + 0.35); });
  A.sound('crunch', (t) => { A.noise(t, 0.3, 0.5, { f0: 3000, f1: 100 }); A.tone('square', 120, 40, t, 0.3, 0.2); tail(t + 0.4); });
  A.sound('splash', (t) => { A.noise(t, 0.45, 0.32, { filter: 'bandpass', f0: 1800, f1: 300, q: 0.7 }); A.tone('sine', 600, 150, t, 0.35, 0.12); tail(t + 0.45); });
  A.sound('chomp', (t) => { A.tone('square', 1200, 300, t, 0.06, 0.14); A.tone('square', 1100, 200, t + 0.1, 0.07, 0.14); A.noise(t + 0.1, 0.2, 0.3, { f0: 1500, f1: 200 }); tail(t + 0.4); });
  A.sound('trainhit', (t) => { A.noise(t, 0.4, 0.5, { f0: 3000, f1: 100 }); A.tone('sine', 1400, 300, t, 0.5, 0.14); tail(t + 0.5); });
  A.sound('fall', (t) => { A.tone('sine', 1200, 150, t, 0.6, 0.15); A.tone('triangle', 100, 50, t + 0.6, 0.2, 0.3); tail(t + 0.75); });
  A.sound('launch', (t) => { A.noise(t, 0.35, 0.25, { filter: 'bandpass', f0: 600, f1: 3000, q: 1 }); A.tone('sine', 300, 1600, t, 0.4, 0.12); tail(t + 0.5); });
  A.sound('zap', (t) => { for (let i = 0; i < 6; i++) A.tone('sawtooth', 1800 - i * 200, 900 - i * 100, t + i * 0.04, 0.04, 0.07); A.noise(t, 0.2, 0.2, { filter: 'highpass', f0: 3000 }); tail(t + 0.35); });
  A.sound('yawn', (t) => { A.tone('triangle', 330, 520, t, 0.35, 0.22, { vibrato: 5, depth: 8 }); A.tone('triangle', 520, 200, t + 0.35, 0.6, 0.22, { vibrato: 4, depth: 10 }); seq([m(79), 0, m(76), 0, m(72)], t + 1.0, 'p12', 0.07, 0.16); });

  // ------------------------------------------------------------------ world
  A.sound('bell', (t) => { for (let i = 0; i < 4; i++) { A.tone('square', 1568, 1568, t + i * 0.22, 0.12, 0.06); A.tone('square', 1976, 1976, t + i * 0.22 + 0.11, 0.1, 0.05); } });
  A.sound('horn', (t) => { A.tone('sawtooth', 311, 311, t, 0.5, 0.07, { hold: 0.35 }); A.tone('sawtooth', 392, 392, t, 0.5, 0.06, { hold: 0.35 }); });
  A.sound('slam', (t) => { A.noise(t, 0.12, 0.3, { f0: 1200, f1: 80 }); A.tone('triangle', 120, 40, t, 0.12, 0.3); });
  A.sound('clank', (t) => { A.tone('p12', 1800, 1700, t, 0.05, 0.08); A.tone('p12', 1250, 1200, t + 0.05, 0.06, 0.08); });
  A.sound('whoosh', (t) => A.noise(t, 0.3, 0.24, { filter: 'bandpass', f0: 400, f1: 2400, q: 1.5 }));
  A.sound('buzz', (t) => A.tone('sawtooth', 220, 240, t, 0.25, 0.04, { vibrato: 40, depth: 30 }));

  // ------------------------------------------------------------------ goodies + scoring
  A.sound('home', (t) => { seq([m(79), m(83), m(86), m(91)], t, 'p25', 0.12, 0.07); A.tone('triangle', m(55), m(55), t, 0.3, 0.25); });
  A.sound('fly', (t) => seq([m(88), m(91), m(96)], t, 'p25', 0.1, 0.05));
  A.sound('leaf', (t) => { A.tone('p25', 1319, 1319, t, 0.04, 0.1); A.tone('p25', 1760, 1760, t + 0.05, 0.04, 0.1); A.tone('p25', 2093, 2093, t + 0.1, 0.07, 0.1); });
  A.sound('checkpoint', (t) => seq([m(72), m(76), m(79), m(84), 0, m(84)], t, 'square', 0.11, 0.07));
  A.sound('oneup', (t) => seq([m(76), m(79), m(88), m(84), m(86), m(91)], t, 'p25', 0.12, 0.07));
  A.sound('tally', (t) => { for (let i = 0; i < 10; i++) A.tone('p25', 1500 + i * 60, 1500 + i * 60, t + i * 0.04, 0.03, 0.06); });
  A.sound('hurry', (t) => { for (let i = 0; i < 6; i++) A.tone('p25', i % 2 ? 1568 : 1760, i % 2 ? 1568 : 1760, t + i * 0.08, 0.06, 0.09); });

  // ------------------------------------------------------------------ jingles
  A.sound('ready', (t) => { seq([m(67), 0, m(67), m(74)], t, 'p25', 0.11, 0.1); A.tone('triangle', m(43), m(43), t, 0.4, 0.25); });
  A.sound('go', (t) => { A.tone('square', m(79), m(79), t, 0.08, 0.12); A.tone('square', m(86), m(86), t + 0.08, 0.14, 0.12); });
  A.sound('clear', (t) => {
    seq([m(67), m(71), m(74), 0, m(72), m(76), m(79), 0, m(74), m(78), m(81), m(83)], t, 'square', 0.12, 0.09);
    seq([m(55), 0, m(59), 0, m(60), 0, m(64), 0, m(62), 0, m(66), m(67)], t, 'triangle', 0.3, 0.09);
    A.tone('square', m(91), m(91), t + 1.08, 0.6, 0.11, { vibrato: 6, depth: 6, hold: 0.3 });
    A.tone('p12', m(86), m(86), t + 1.08, 0.6, 0.06);
  });
  A.sound('fanfare', (t) => {
    const mel = [67, 67, 67, 71, 74, 0, 71, 74, 79, 0, 79, 79, 83, 86, 91];
    seq(mel.map((n) => (n ? m(n) : 0)), t, 'square', 0.13, 0.1);
    seq(mel.map((n) => (n ? m(n - 12) : 0)), t, 'triangle', 0.28, 0.1);
  });
  A.sound('gameover', (t) => {
    seq([m(74), 0, m(71), 0, m(67), 0, m(66), m(64), 0, 0, m(62)], t, 'p25', 0.12, 0.16);
    seq([m(43), 0, 0, 0, m(40), 0, 0, 0, m(38), 0, m(31)], t, 'triangle', 0.3, 0.16);
  });

  return {
    setHurry(on) {
      for (const k in A.songs) A.songs[k].bpm = A.songs[k].base;
      if (on && A.song_) A.song_.bpm = A.song_.base * 1.2;
    }
  };
})();
