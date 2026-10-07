/* GAME AUDIO — every sound recipe and the music, all original.
   Early-arcade palette: pulse waves, a triangle bass, filtered noise. Two voices and
   a whisper of percussion — catchy, not busy.
   A.tone(type, f0, f1, t, dur, vol, { bus, attack, hold, vibrato, depth })
   A.noise(t, dur, vol, { filter, f0, f1, q, bus })
   GameAudio.music(stage) · setHurry(on) · setSlow(on) */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio, m = A.midi;
  const seq = (notes, t, type, vol, gap, o) => notes.forEach((n, i) => { if (n) A.tone(type, n, n, t + i * gap, gap * 0.95, vol, o); });
  let stepAlt = 0;

  // ------------------------------------------------------------------ interface
  A.sound('menu', (t) => A.tone('p25', 1180, 1180, t, 0.04, 0.1));
  A.sound('select', (t) => { A.tone('p25', 880, 880, t, 0.05, 0.12); A.tone('p25', 1320, 1320, t + 0.05, 0.08, 0.12); });
  A.sound('start', (t) => { A.tone('square', 988, 988, t, 0.07, 0.12); A.tone('square', 1319, 1319, t + 0.07, 0.3, 0.12); });
  A.sound('pause', (t) => { A.tone('p25', 880, 880, t, 0.06, 0.12); A.tone('p25', 440, 440, t + 0.07, 0.1, 0.12); });
  A.sound('tick', (t) => A.tone('p25', 2000, 2000, t, 0.025, 0.07));
  A.sound('denied', (t) => A.tone('square', 110, 100, t, 0.16, 0.14));

  // ------------------------------------------------------------------ the sloth
  A.sound('step', (t) => { stepAlt ^= 1; A.tone('triangle', stepAlt ? 150 : 118, 80, t, 0.05, 0.32); });
  A.sound('climb', (t) => { stepAlt ^= 1; A.tone('p25', stepAlt ? 620 : 520, 480, t, 0.03, 0.06); });
  A.sound('jump', (t) => { A.tone('square', 260, 700, t, 0.13, 0.11); A.tone('p12', 520, 1100, t + 0.02, 0.1, 0.04); });
  A.sound('land', (t) => A.noise(t, 0.05, 0.18, { f0: 800, f1: 150 }));
  A.sound('flop', (t) => { A.noise(t, 0.18, 0.35, { f0: 700, f1: 90 }); A.tone('triangle', 130, 55, t, 0.2, 0.35); A.tone('p25', 520, 300, t + 0.05, 0.16, 0.06); });
  A.sound('pickup', (t) => seq([1047, 1319, 1568, 2093], t, 'p25', 0.11, 0.045));
  A.sound('points', (t) => { A.tone('p25', 1568, 1568, t, 0.05, 0.09); A.tone('p25', 2093, 2093, t + 0.05, 0.09, 0.09); });
  A.sound('combo', (t) => seq([1568, 2093, 2637, 3136], t, 'p25', 0.09, 0.04));
  A.sound('oneup', (t) => seq([523, 659, 784, 1047, 1319, 1568, 2093, 2637], t, 'p25', 0.11, 0.04));
  A.sound('slowmo', (t) => { A.tone('square', 900, 110, t, 0.7, 0.1, { vibrato: 9, depth: 25 }); A.noise(t, 0.4, 0.06, { filter: 'bandpass', f0: 2000, f1: 300 }); });
  A.sound('speedup', (t) => A.tone('square', 160, 900, t, 0.3, 0.08));
  A.sound('hit', (t) => { A.noise(t, 0.22, 0.6, { f0: 2500, f1: 150 }); A.tone('square', 420, 90, t, 0.16, 0.22); });
  A.sound('death', (t) => {
    A.tone('p25', 880, 196, t, 0.7, 0.12, { vibrato: 14, depth: 30 });
    A.tone('p25', 196, 196, t + 0.78, 0.16, 0.13);
    A.tone('p25', 147, 140, t + 0.98, 0.55, 0.13, { vibrato: 6, depth: 6, hold: 0.3 });
    A.tone('triangle', 73, 73, t + 0.98, 0.55, 0.3);
  });

  // ------------------------------------------------------------------ hazards + world
  A.sound('roll', (t) => A.noise(t, 0.14, 0.05, { f0: 260, f1: 140, q: 2 }));
  A.sound('thud', (t) => { A.noise(t, 0.07, 0.2, { f0: 500, f1: 80 }); A.tone('triangle', 95, 50, t, 0.08, 0.25); });
  A.sound('thudBig', (t) => { A.noise(t, 0.12, 0.35, { f0: 700, f1: 60 }); A.tone('triangle', 80, 40, t, 0.12, 0.4); });
  A.sound('throw', (t) => A.noise(t, 0.16, 0.18, { filter: 'bandpass', f0: 700, f1: 2800, q: 2 }));
  A.sound('kick', (t) => { A.tone('square', 220, 60, t, 0.09, 0.2); A.noise(t, 0.06, 0.3, { f0: 1500, f1: 200 }); });
  A.sound('hiss', (t) => A.noise(t, 0.85, 0.06, { filter: 'highpass', f0: 3500, f1: 6000 }));
  A.sound('steam', (t) => A.noise(t, 1.0, 0.2, { filter: 'bandpass', f0: 3000, f1: 1400, q: 0.7 }));
  A.sound('clank', (t) => { A.tone('p12', 1800, 1700, t, 0.04, 0.1); A.tone('p12', 1250, 1200, t + 0.06, 0.05, 0.1); });
  A.sound('slam', (t) => { A.noise(t, 0.28, 0.6, { f0: 2200, f1: 90 }); A.tone('sine', 85, 32, t, 0.32, 0.6); });
  A.sound('klaxon', (t) => [0, 1, 2, 3].forEach((i) => A.tone('square', i % 2 ? 554 : 440, i % 2 ? 554 : 440, t + i * 0.15, 0.13, 0.07)));
  A.sound('clunk', (t) => { A.noise(t, 0.08, 0.25, { f0: 900, f1: 120 }); A.tone('square', 150, 90, t, 0.08, 0.12); });
  A.sound('crunch', (t) => { A.noise(t, 0.16, 0.4, { filter: 'bandpass', f0: 1400, f1: 400, q: 1.5 }); A.tone('square', 300, 70, t, 0.12, 0.15); });
  A.sound('boing', (t) => A.tone('sine', 180, 520, t, 0.22, 0.35, { vibrato: 28, depth: 70 }));
  A.sound('hurry', (t) => [0, 1, 2, 3].forEach((i) => A.tone('p25', 1760, 1760, t + i * 0.09, 0.05, 0.08)));
  A.sound('squeak', (t) => A.tone('sine', 1700, 2500, t, 0.12, 0.13, { vibrato: 30, depth: 300 }));
  A.sound('flush', (t) => A.noise(t, 0.7, 0.16, { filter: 'bandpass', f0: 900, f1: 220, q: 1.2 }));
  A.sound('ding', (t) => { A.tone('sine', 2093, 2093, t, 0.6, 0.12); A.tone('sine', 4186, 4186, t, 0.3, 0.03); });
  A.sound('static', (t) => A.noise(t, 0.3, 0.1, { filter: 'highpass', f0: 2500 }));
  A.sound('fishflop', (t) => { A.noise(t, 0.05, 0.22, { filter: 'bandpass', f0: 900, q: 2 }); A.tone('triangle', 320, 150, t, 0.06, 0.15); });
  A.sound('clatter', (t) => { for (let i = 0; i < 3; i++) A.tone('p12', 1500 + Math.random() * 1200, 1200, t + i * 0.05, 0.04, 0.07); A.noise(t, 0.12, 0.12, { filter: 'highpass', f0: 2000 }); });

  // ------------------------------------------------------------------ Sofa King
  const haw = (t, f, vol) => { A.tone('sawtooth', f, f * 0.66, t, 0.15, vol, { vibrato: 18, depth: 14 }); A.tone('p25', f * 2, f * 1.3, t, 0.13, vol * 0.35); };
  A.sound('laugh', (t) => { [340, 330, 320, 300].forEach((f, i) => haw(t + i * 0.19, f, 0.12)); haw(t + 0.8, 280, 0.12); });
  A.sound('laughShort', (t) => { haw(t, 400, 0.08); haw(t + 0.16, 380, 0.08); });
  A.sound('thump', (t) => A.tone('triangle', 120, 60, t, 0.06, 0.32));
  A.sound('grumble', (t) => A.tone('sawtooth', 115, 85, t, 0.45, 0.09, { vibrato: 11, depth: 9 }));
  A.sound('windup', (t) => A.tone('p25', 180, 820, t, 0.6, 0.07, { vibrato: 16, depth: 20 }));
  A.sound('stomp', (t) => { A.tone('sine', 95, 28, t, 0.5, 0.75); A.noise(t, 0.4, 0.55, { f0: 1300, f1: 50 }); });
  A.sound('flapaway', (t) => { for (let i = 0; i < 10; i++) A.noise(t + i * 0.07, 0.04, 0.14, { filter: 'bandpass', f0: 800, q: 1.5 }); });
  A.sound('launch', (t) => { A.tone('sine', 150, 900, t, 0.45, 0.4, { vibrato: 26, depth: 90 }); A.noise(t + 0.1, 0.4, 0.12, { filter: 'bandpass', f0: 600, f1: 3000 }); });
  A.sound('whistle', (t) => A.tone('sine', 2100, 380, t, 1.6, 0.09));
  A.sound('crash', (t) => {
    A.noise(t, 0.7, 0.8, { f0: 3000, f1: 80 }); A.tone('square', 200, 40, t, 0.4, 0.3);
    for (let i = 0; i < 5; i++) A.tone('p12', 900 + Math.random() * 1500, 600, t + 0.15 + i * 0.07, 0.05, 0.06);
  });
  A.sound('crown', (t) => { seq([1568, 2093, 2637], t, 'p25', 0.1, 0.07); A.tone('p25', 3136, 3136, t + 0.21, 0.5, 0.08, { vibrato: 8, depth: 20 }); });

  // ------------------------------------------------------------------ jingles
  A.sound('titleJingle', (t) => {
    seq([m(67), m(72), m(75), m(79), 0, m(77), m(75), m(74), m(79)], t, 'p25', 0.11, 0.1);
    seq([m(43), 0, m(48), 0, m(51), 0, m(43), 0, m(55)], t, 'triangle', 0.35, 0.1);
  });
  A.sound('intro', (t) => {
    seq([m(72), m(75), m(79), m(84), 0, m(82), m(84)], t, 'p25', 0.11, 0.11);
    seq([m(48), 0, m(55), 0, m(46), 0, m(48)], t, 'triangle', 0.35, 0.11);
  });
  A.sound('clear', (t) => {
    seq([m(72), m(76), m(79), m(84), 0, m(79), m(84)], t, 'p25', 0.11, 0.09);
    A.tone('p25', m(88), m(88), t + 0.63, 0.45, 0.1, { vibrato: 7, depth: 12 });
    seq([m(48), m(52), m(55), m(60), 0, m(55), m(48)], t, 'triangle', 0.32, 0.09);
  });
  A.sound('victory', (t) => {
    const L = [67, 72, 76, 79, 0, 76, 79, 84, 0, 0, 81, 79, 77, 76, 74, 72];
    seq(L.map((n) => n && m(n)), t, 'p25', 0.11, 0.13);
    seq([48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 53, 0, 55, 0, 55, 48].map((n) => n && m(n)), t, 'triangle', 0.32, 0.13);
    A.tone('p25', m(84), m(84), t + 16 * 0.13, 0.7, 0.1, { vibrato: 6, depth: 14, hold: 0.3 });
  });
  A.sound('gameover', (t) => {
    seq([m(67), m(64), m(60), m(62), m(59), m(60)], t, 'p25', 0.1, 0.32);
    seq([m(43), m(40), m(36), m(38), m(35), m(36)], t, 'triangle', 0.3, 0.32);
  });

  // ------------------------------------------------------------------ music
  // One original theme (i - VI - VII - V in C minor), dressed differently per stage.
  const LEAD = [
    [0, 67, 2], [2, 72, 2], [4, 75, 2], [6, 74, 1], [7, 72, 1], [8, 70, 2], [10, 72, 2], [12, 67, 4],
    [16, 68, 2], [18, 72, 2], [20, 75, 2], [22, 77, 1], [23, 75, 1], [24, 72, 2], [26, 75, 2], [28, 72, 4],
    [32, 65, 2], [34, 70, 2], [36, 74, 2], [38, 77, 1], [39, 75, 1], [40, 74, 2], [42, 70, 2], [44, 77, 4],
    [48, 79, 2], [50, 77, 1], [51, 75, 1], [52, 74, 2], [54, 71, 2], [56, 74, 2], [58, 67, 2], [60, 71, 2], [62, 74, 2]
  ];
  const LEAD_AT = {};
  LEAD.forEach(([s, n, l]) => { LEAD_AT[s] = [n, l]; });
  const ROOTS = [36, 32, 34, 31];
  const STYLE = [
    { bpm: 136, tr: 0, wave: 'p25', busy: false },          // condemned construction
    { bpm: 140, tr: 2, wave: 'p12', busy: false },          // pipe dreams
    { bpm: 144, tr: -2, wave: 'square', busy: true },       // industrial: machine pulse
    { bpm: 152, tr: 5, wave: 'p25', busy: true, harm: true } // penthouse
  ];
  const M = { slow: false, hurry: false, cur: -1 };

  STYLE.forEach((st, k) => {
    A.song('stage' + k, {
      bpm: st.bpm, base: st.bpm, stepsPerBeat: 4, length: 64,
      step(i, t, dur) {
        const tr = st.tr + (M.slow ? -5 : 0), mb = { bus: 'music' };
        const root = ROOTS[i >> 4] + tr, b = i % 16;
        // bass: root / fifth / octave bounce
        if (b % 4 === 0) A.tone('triangle', m(root + [0, 7, 12, 7][b >> 2]), 0, t, dur * 2.6, 0.38, { bus: 'music', hold: dur });
        else if (st.busy && b % 2 === 0) A.tone('triangle', m(root), 0, t, dur * 0.8, 0.22, mb);
        // lead
        const L = LEAD_AT[i];
        if (L) {
          A.tone(st.wave, m(L[0] + tr), 0, t, dur * (L[1] + 0.6), 0.1, { bus: 'music', hold: dur * L[1] * 0.7, vibrato: L[1] >= 4 ? 6 : 0, depth: 6 });
          if (st.harm && L[1] >= 2) A.tone('p12', m(L[0] + tr - 5), 0, t, dur * L[1], 0.035, mb);
        }
        // a whisper of percussion
        if (b === 0 || b === 8) A.tone('sine', 140, 45, t, 0.09, 0.32, mb);
        if (b === 4 || b === 12) A.noise(t, 0.06, 0.09, { filter: 'highpass', f0: 2500, bus: 'music' });
        if (st.busy && b % 2 === 1) A.noise(t, 0.02, 0.04, { filter: 'highpass', f0: 7000, bus: 'music' });
      }
    });
  });

  function tempo() {
    if (M.cur < 0) return;
    const s = A.songs['stage' + M.cur];
    s.bpm = s.base * (M.hurry ? 1.22 : 1) * (M.slow ? 0.5 : 1);
  }

  return {
    music(stage) { M.cur = stage; tempo(); A.startMusic('stage' + stage); },
    setHurry(on) { M.hurry = !!on; tempo(); },
    setSlow(on) { M.slow = !!on; tempo(); }
  };
})();
