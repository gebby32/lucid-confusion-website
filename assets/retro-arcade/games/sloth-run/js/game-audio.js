/* GAME AUDIO — every note and every sound is original and generated live with Web Audio.
   Plumbing provides the buses, the step sequencer and the volume settings; this file owns the
   instruments (detuned saw pads, filtered saw bass, square leads, gated snares), a stereo-ish
   echo on the music, the four tunes plus jingles, the engine and every effect.

   Songs:  title   "Sloth Run"            anthem, C major
           drive0  "Hang Loose Highway"   station 88.8, bright and fast
           drive1  "Lazy Breeze"          station 101.1, laid-back funk
           drive2  "Neon Sloth"           station 107.7, minor-key synthwave
           ending  "Sunset Cruise"        the goal, the ending, name entry
   Engine.update(...) every frame while driving. */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (tok) => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(tok); if (!r) return null; return 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------------------------------------------------------------- our own graph (built on unlock)
  let G = null;
  function graph() {
    if (G && G.ctx === A.ctx) return G;
    if (!A.ctx) return null;
    const c = A.ctx;
    const musicIn = c.createGain();
    musicIn.connect(A.musicBus);
    const delay = c.createDelay(1.0), fb = c.createGain(), wet = c.createGain(), lp = c.createBiquadFilter();
    delay.delayTime.value = 0.36; fb.gain.value = 0.32; wet.gain.value = 0.22; lp.type = 'lowpass'; lp.frequency.value = 2600;
    musicIn.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(A.musicBus);
    G = { ctx: c, musicIn, delay };
    return G;
  }

  // a synth voice: 1-2 oscillators -> lowpass (with an envelope) -> amp envelope
  function voice(type, f, t, dur, vol, o) {
    const g0 = graph(); if (!g0) return;
    const c = A.ctx; o = o || {};
    const out = o.bus === 'sfx' ? A.sfxBus : g0.musicIn;
    const amp = c.createGain(), filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.Q.value = o.q || 1;
    const cut = o.cutoff || 3000, env = o.env || 0;
    filt.frequency.setValueAtTime(cut + env, t);
    if (env) filt.frequency.exponentialRampToValueAtTime(Math.max(60, cut), t + (o.decay || 0.15));
    const a = o.attack || 0.005, rel = o.release || 0.06, sus = o.sustain === undefined ? 1 : o.sustain;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(vol, t + a);
    if (sus < 1) amp.gain.exponentialRampToValueAtTime(Math.max(0.0005, vol * sus), t + a + (o.decay || 0.15));
    amp.gain.setValueAtTime(Math.max(0.0005, vol * sus), t + Math.max(a, dur));
    amp.gain.exponentialRampToValueAtTime(0.0005, t + dur + rel);
    filt.connect(amp); amp.connect(out);
    const dets = o.detune ? [-o.detune, o.detune] : [0];
    for (const d of dets) {
      const s = c.createOscillator();
      if (A.waves[type]) s.setPeriodicWave(A.waves[type]); else s.type = type;
      s.frequency.setValueAtTime(f, t);
      if (o.slide) s.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
      s.detune.value = d;
      if (o.vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = o.vib; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.35));
        l.connect(lg); lg.connect(s.frequency); l.start(t); l.stop(t + dur + rel + 0.05);
      }
      s.connect(filt); s.start(t); s.stop(t + dur + rel + 0.05);
    }
  }
  function noiseHit(t, dur, vol, o) {
    const g0 = graph(); if (!g0) return;
    const c = A.ctx; o = o || {};
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true;
    s.playbackRate.value = o.rate || 1;
    f.type = o.filter || 'highpass'; f.frequency.setValueAtTime(o.f0 || 6000, t); f.Q.value = o.q || 0.7;
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    if (o.gate) { g.gain.setValueAtTime(vol * 0.7, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0005, t + dur); }
    else g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus === 'sfx' ? A.sfxBus : g0.musicIn);
    s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------------------------------------------------------------- drums
  function drum(d, t, v) {
    switch (d) {
      case 'k': voice('sine', 150, t, 0.12, 0.9 * v, { slide: 42, release: 0.05 }); noiseHit(t, 0.015, 0.25 * v, { f0: 3000 }); break;
      case 's': noiseHit(t, 0.2, 0.42 * v, { filter: 'bandpass', f0: 1800, q: 0.6, gate: true }); voice('triangle', 210, t, 0.08, 0.3 * v, { slide: 150 }); break;
      case 'c': for (let i = 0; i < 3; i++) noiseHit(t + i * 0.011, 0.09, 0.3 * v, { filter: 'bandpass', f0: 1400, q: 1.2 }); break;
      case 'h': noiseHit(t, 0.03, 0.12 * v, { f0: 8000 }); break;
      case 'o': noiseHit(t, 0.16, 0.1 * v, { f0: 7000 }); break;
      case 't': voice('sine', 180, t, 0.18, 0.5 * v, { slide: 90 }); break;
      case 'T': voice('sine', 120, t, 0.22, 0.55 * v, { slide: 60 }); break;
      case 'x': noiseHit(t, 0.9, 0.16 * v, { f0: 5000, f1: 3000 }); break;     // crash cymbal
    }
  }
  const DRUMS = {
    drive: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
    driveFill: { k: 'x.......x.......', s: '....x.......x.xx', h: 'x.x.x.x.x.x.....', t: '..........x.T...' },
    funk: { k: 'x..x......x.....', s: '....x..x....x...', h: 'xxxxxxxxxxxxxxxx', o: '' },
    funkFill: { k: 'x..x......x.....', s: '....x..x..x.xxxx', h: 'xxxxxxxxxx......' },
    wave: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', c: '............x...' },
    waveFill: { k: 'x...x...x...x...', s: '....x.......xxxx', h: '..x...x...x.....', T: '........x.x.....' },
    title: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    titleFill: { k: 'x.......x.x.x.x.', s: '....x.......x.xx', h: 'x.x.x.x.........' },
    calm: { k: 'x.........x.....', s: '....x.......x...', h: '..x...x...x...x.' },
    none: {}
  };

  // ---------------------------------------------------------------- chords
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7] };
  function chord(sym) {
    const r = /^([A-G])([#b]?)(.*)$/.exec(sym);
    const root = NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
    return { root, iv: QUAL[r[3]] || QUAL[''] };
  }
  // bass patterns (one token per 16th): R root, O octave, 5 fifth, 7 seventh, . rest
  const BASS = {
    octave: 'R . O . R . O . R . O . R . O .',
    pump: 'R . R . R . R . R . R . R . R .',
    funk: 'R . . R O . R . . R . 5 . O 7 .',
    half: 'R - - - - - - . 5 - - . O - - .',
    calm: 'R - - - - - - - 5 - - - - - - .'
  };

  // ---------------------------------------------------------------- song compiler
  // def: { bpm, bars: [[chord or 'C/G' (two halves), lead (16 tokens), drum pattern]], bass, pad, arp, leadType, vol }
  function compile(name, def) {
    const steps = [];
    def.bars.forEach((bar) => {
      const [ch, lead, dr] = bar;
      const halves = ch.split('/').map(chord);
      const toks = lead.trim().split(/\s+/);
      if (toks.length !== 16) console.warn('song ' + name + ': bar has ' + toks.length + ' steps', lead);
      const bt = BASS[def.bass].split(/\s+/);
      for (let i = 0; i < 16; i++) {
        const C = halves.length > 1 && i >= 8 ? halves[1] : halves[0];
        const st = { chord: C, first: i === 0 || (halves.length > 1 && i === 8), padLen: halves.length > 1 ? 8 : 16, drums: [] };
        const n = midiOf(toks[i]);
        if (n !== null) { let len = 1; while (toks[i + len] === '-') len++; st.lead = { n, len }; }
        const b = bt[i];
        if (b !== '.' && b !== '-') {
          let len = 1; while (bt[i + len] === '-') len++;
          const base = 36 + C.root;
          st.bass = { n: b === 'O' ? base + 12 : b === '5' ? base + 7 : b === '7' ? base + (C.iv[3] || 10) : base, len };
        }
        const D = DRUMS[dr || def.drums] || {};
        for (const k in D) if (D[k][i] === 'x') st.drums.push(k);
        steps.push(st);
      }
    });
    const v = def.vol || 1;
    A.song(name, {
      bpm: def.bpm, stepsPerBeat: 4, length: steps.length,
      step(i, t, dur) {
        const s = steps[i];
        if (s.lead) {
          const f = hz(s.lead.n), L = s.lead.len * dur;
          voice(def.leadType || 'square', f, t, L * 0.92, 0.11 * v, { cutoff: 2600, env: 1800, decay: 0.2, detune: 7, vib: L > 0.3 ? 5.5 : 0, sustain: 0.7, release: 0.08 });
          if (def.leadOct) voice('p25', f * 2, t, L * 0.9, 0.032 * v, { cutoff: 4000, sustain: 0.6 });
        }
        if (s.bass) voice('sawtooth', hz(s.bass.n), t, s.bass.len * dur * 0.85, 0.22 * v, { cutoff: 260, env: 900, decay: 0.12, q: 4, sustain: 0.6, release: 0.04 });
        if (s.first && def.pad) {
          const barDur = s.padLen * dur;
          for (const iv of s.chord.iv.slice(0, 4)) {
            const m = 60 + ((s.chord.root + iv) % 12) - (((s.chord.root + iv) % 12) > 7 ? 12 : 0);
            voice('sawtooth', hz(m), t, barDur * 0.95, 0.034 * v, { cutoff: def.padCut || 1100, detune: 12, attack: 0.08, release: 0.3 });
          }
        }
        if (def.stabs && (i % 16 === 6 || i % 16 === 14)) {
          for (const iv of s.chord.iv.slice(0, 3)) voice('square', hz(60 + ((s.chord.root + iv) % 12)), t, dur * 0.9, 0.022 * v, { cutoff: 1800, release: 0.03 });
        }
        if (def.arp) {
          const iv = s.chord.iv, k = i % 4 === 3 ? 12 : iv[i % iv.length];
          voice('p12', hz(72 + s.chord.root % 12 + k), t, dur * 0.6, 0.028 * v, { cutoff: 3500 });
        }
        for (const d of s.drums) drum(d, t, v);
      }
    });
  }

  // ---------------------------------------------------------------- THE SONGS (all original)
  compile('drive0', {           // Hang Loose Highway
    bpm: 140, bass: 'octave', pad: true, arp: false, stabs: true, drums: 'drive', leadOct: true,
    bars: [
      ['C', 'G4 . C5 . E5 - - D5 - - C5 . D5 - E5 -'],
      ['G', 'D5 - - - - . B4 . D5 . G5 - - - . .'],
      ['Am', 'A4 . C5 . E5 - - D5 - - C5 . E5 - A5 -'],
      ['F', 'G5 - - - F5 - E5 - F5 . E5 . C5 - - -'],
      ['C', 'G4 . C5 . E5 - - D5 - - C5 . D5 - E5 -'],
      ['G', 'D5 - - - - . B4 . D5 . G5 - A5 - B5 -'],
      ['F', 'C6 - - - A5 - - G5 - - F5 . A5 - G5 -'],
      ['G', 'G5 - - - - - - - D5 . E5 . F5 . G5 .', 'driveFill'],
      ['Am', 'E5 - - - - - D5 - C5 - - - B4 - C5 -'],
      ['F', 'A4 - - - - - - - . . C5 . F5 . A5 .'],
      ['C', 'G5 - - - - - E5 - C5 - - - D5 - E5 -'],
      ['G', 'D5 - - - - - - - . . B4 . D5 . G5 .'],
      ['Am', 'E5 - - - - - D5 - C5 - - - B4 - C5 -'],
      ['F', 'A4 - - - - - - - . . F5 . A5 . C6 .'],
      ['Dm', 'D6 - - - C6 - A5 - F5 - - - D5 - F5 -'],
      ['G', 'G5 - - - - - - - G5 . A5 . B5 . D6 .', 'driveFill']
    ]
  });
  compile('drive1', {           // Lazy Breeze
    bpm: 108, bass: 'funk', pad: true, padCut: 900, stabs: true, drums: 'funk', leadType: 'p25',
    bars: [
      ['Dm7', 'F5 - - E5 - - D5 - C5 - - - - - A4 -'],
      ['G7', 'B4 - - - D5 - - F5 - - E5 - D5 - - -'],
      ['Cmaj7', 'E5 - - - - - G5 - B5 - - - A5 - G5 -'],
      ['Am7', 'E5 - - - - - - - . . C5 . E5 . G5 .'],
      ['Dm7', 'F5 - - E5 - - D5 - C5 - - - - - A4 -'],
      ['G7', 'B4 - - - D5 - - F5 - - A5 - G5 - F5 -'],
      ['Em7', 'G5 - - - - - E5 - B4 - - - D5 - E5 -'],
      ['A7', 'C#5 - - - - - - - E5 . G5 . A5 . C#6 .', 'funkFill'],
      ['Dm7', 'D6 - - C6 - - A5 - F5 - - - - - D5 -'],
      ['G7', 'F5 - - - G5 - - A5 - - B5 - D6 - - -'],
      ['Cmaj7', 'E6 - - - - - D6 - B5 - - - G5 - E5 -'],
      ['Am7', 'C6 - - - - - - - . . A5 . G5 . E5 .'],
      ['Dm7', 'F5 - - E5 - - D5 - A5 - - - - - F5 -'],
      ['G7', 'G5 - - - F5 - - D5 - - B4 - D5 - - -'],
      ['Cmaj7', 'C5 - - - - - - - . . . . . . . .'],
      ['A7', 'A4 . C#5 . E5 . G5 . A5 . . . . . . .', 'funkFill']
    ]
  });
  compile('drive2', {           // Neon Sloth
    bpm: 124, bass: 'octave', pad: true, arp: true, drums: 'wave',
    bars: [
      ['Am', 'A4 . . A4 C5 . E5 . A5 - - - G5 - E5 -'],
      ['F', 'F5 - - - - - E5 - C5 - - - A4 - C5 -'],
      ['C', 'G5 - - - - - E5 - G5 - - - C6 - B5 -'],
      ['G', 'B5 - - - - - - - G5 . A5 . B5 . D6 .'],
      ['Am', 'E6 - - - - - D6 - C6 - - - B5 - A5 -'],
      ['F', 'A5 - - - - - G5 - F5 - - - E5 - F5 -'],
      ['G', 'G5 - - - - - F5 - D5 - - - B4 - D5 -'],
      ['E', 'E5 - - - - - - - G#5 - - - B5 - - -', 'waveFill'],
      ['F', 'C6 - - - A5 - - - F5 - - - A5 - C6 -'],
      ['G', 'D6 - - - B5 - - - G5 - - - B5 - D6 -'],
      ['Am', 'E6 - - - - - - - - - - - D6 - C6 -'],
      ['Am', 'A5 - - - - - - - . . . . . . . .'],
      ['F', 'C6 - - - A5 - - - F5 - - - A5 - C6 -'],
      ['G', 'D6 - - - B5 - - - G5 - - - D6 - F6 -'],
      ['E', 'E6 - - - - - - - D6 - - - B5 - - -'],
      ['E', 'G#5 - - - - - - - B5 - - - E5 - - -', 'waveFill']
    ]
  });
  compile('title', {            // Sloth Run (title anthem)
    bpm: 116, bass: 'half', pad: true, padCut: 1400, arp: true, drums: 'title', leadOct: true,
    bars: [
      ['C', 'C5 - - - E5 - - - G5 - - - C6 - - -'],
      ['Am', 'B5 - - - A5 - - - E5 - - - A5 - - -'],
      ['F', 'A5 - - - G5 - F5 - - - C5 - F5 - A5 -'],
      ['G', 'G5 - - - - - - - D5 - G5 - B5 - D6 -'],
      ['C', 'E6 - - - D6 - C6 - - - G5 - - - E5 -'],
      ['Am', 'C6 - - - B5 - A5 - - - E5 - - - C5 -'],
      ['F/G', 'F5 - - - A5 - - - G5 - - - B5 - - -'],
      ['C', 'C6 - - - - - - - - - - - . . . .', 'titleFill']
    ]
  });
  compile('ending', {           // Sunset Cruise
    bpm: 92, bass: 'calm', pad: true, padCut: 1000, arp: true, drums: 'calm', leadType: 'p25',
    bars: [
      ['Fmaj7', 'A5 - - - - - G5 - E5 - - - C5 - - -'],
      ['G', 'D5 - - - - - - - . . B4 . D5 . G5 .'],
      ['Em7', 'G5 - - - - - E5 - B4 - - - D5 - - -'],
      ['Am', 'C5 - - - - - - - . . A4 . C5 . E5 .'],
      ['Dm7', 'F5 - - - - - E5 - D5 - - - A5 - - -'],
      ['G', 'G5 - - - - - F5 - D5 - - - B4 - - -'],
      ['Cmaj7', 'E5 - - - - - - - G5 - - - B5 - - -'],
      ['C', 'C6 - - - - - - - - - - - . . . .']
    ]
  });
  // station 4 is the sound of crickets: an empty song so startMusic('quiet') just stops music
  A.song('quiet', { bpm: 60, length: 16, step() {} });

  // ---------------------------------------------------------------- jingles & effects
  const now = (t) => t;
  const S = (name, fn) => A.sound(name, (t, o) => { if (graph()) fn(t, o); });
  const blip = (f, t, d, v, type) => voice(type || 'square', f, t, d, v, { bus: 'sfx', cutoff: 5000, release: 0.03 });
  S('menu', (t) => blip(1320, t, 0.04, 0.12));
  S('select', (t) => { blip(880, t, 0.05, 0.14); blip(1760, t + 0.06, 0.09, 0.14); });
  S('back', (t) => { blip(990, t, 0.05, 0.12); blip(660, t + 0.06, 0.07, 0.12); });
  S('start', (t) => {
    voice('sawtooth', 220, t, 0.5, 0.2, { bus: 'sfx', slide: 880, cutoff: 800, env: 3000, decay: 0.4 });
    [523, 659, 784, 1047].forEach((f, i) => blip(f, t + 0.3 + i * 0.07, 0.22, 0.12));
  });
  S('beep', (t) => blip(880, t, 0.16, 0.2, 'p25'));
  S('go', (t) => { blip(1760, t, 0.5, 0.22, 'p25'); blip(880, t, 0.5, 0.1, 'square'); });
  S('tick', (t) => blip(1500, t, 0.05, 0.12, 'p12'));
  S('radio', (t) => { noiseHit(t, 0.25, 0.25, { bus: 'sfx', filter: 'bandpass', f0: 2500, q: 0.5 }); blip(440, t + 0.2, 0.04, 0.06); });
  S('checkpoint', (t) => {
    const seq = [72, 76, 79, 84, 88, 91, 96];
    seq.forEach((m, i) => voice('square', hz(m), t + i * 0.055, 0.12, 0.12, { bus: 'sfx', cutoff: 4000 }));
    [72, 76, 79, 84].forEach((m) => voice('sawtooth', hz(m), t + 0.42, 0.7, 0.07, { bus: 'sfx', cutoff: 2600, detune: 10, release: 0.3 }));
    voice('square', hz(96), t + 0.42, 0.7, 0.06, { bus: 'sfx', vib: 6 });
  });
  S('choose', (t) => { blip(660, t, 0.08, 0.12); blip(990, t + 0.08, 0.12, 0.12); });
  S('extend', (t) => { [84, 88, 91, 96, 91, 96].forEach((m, i) => blip(hz(m), t + i * 0.07, 0.09, 0.1, 'p25')); });
  S('bump', (t) => {
    noiseHit(t, 0.18, 0.5, { bus: 'sfx', filter: 'lowpass', f0: 1800, f1: 200 });
    voice('square', 140, t, 0.14, 0.25, { bus: 'sfx', slide: 50, cutoff: 900 });
    voice('triangle', 620, t + 0.01, 0.12, 0.12, { bus: 'sfx', slide: 560 });
  });
  S('crash', (t) => {
    noiseHit(t, 0.7, 0.7, { bus: 'sfx', filter: 'lowpass', f0: 3000, f1: 120 });
    voice('square', 110, t, 0.4, 0.3, { bus: 'sfx', slide: 35, cutoff: 700 });
    [610, 845, 1320].forEach((f, i) => voice('triangle', f, t + 0.02 + i * 0.05, 0.25, 0.1, { bus: 'sfx', slide: f * 0.9 }));
    noiseHit(t + 0.15, 0.6, 0.15, { bus: 'sfx', f0: 4000 });
  });
  S('closecall', (t, o) => {
    noiseHit(t, 0.3, 0.3, { bus: 'sfx', filter: 'bandpass', f0: 500, f1: 3500, q: 1.5 });
    const k = Math.min(4, (o && o.combo) || 1);
    blip(hz(84 + k * 2), t + 0.12, 0.08, 0.12, 'p25'); blip(hz(91 + k * 2), t + 0.2, 0.18, 0.12, 'p25');
  });
  S('pass', (t) => noiseHit(t, 0.22, 0.12, { bus: 'sfx', filter: 'bandpass', f0: 900, f1: 300, q: 1.2 }));
  S('fork', (t) => { blip(784, t, 0.1, 0.1, 'p25'); blip(988, t + 0.12, 0.1, 0.1, 'p25'); blip(784, t + 0.24, 0.1, 0.1, 'p25'); blip(988, t + 0.36, 0.1, 0.1, 'p25'); });
  S('timeup', (t) => { [79, 76, 72, 67].forEach((m, i) => voice('square', hz(m), t + i * 0.2, 0.18, 0.14, { bus: 'sfx', cutoff: 2400 })); });
  S('gameover', (t) => {
    [67, 66, 65].forEach((m, i) => voice('square', hz(m), t + i * 0.42, 0.36, 0.13, { bus: 'sfx', cutoff: 1400, env: 1500, decay: 0.3, vib: 5 }));
    voice('square', hz(64), t + 1.26, 1.2, 0.13, { bus: 'sfx', cutoff: 1400, vib: 4, slide: hz(57) });
    voice('sawtooth', 160, t + 2.2, 1.1, 0.08, { bus: 'sfx', slide: 70, cutoff: 600, attack: 0.3 });        // the yawn
  });
  S('goal', (t) => {
    [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => voice('square', hz(m), t + i * 0.08, 0.16, 0.12, { bus: 'sfx', cutoff: 4000 }));
    [60, 64, 67, 72].forEach((m) => voice('sawtooth', hz(m), t + 0.6, 1.4, 0.06, { bus: 'sfx', cutoff: 2000, detune: 10, release: 0.6 }));
    drum('x', t + 0.6, 0.8);
  });
  S('shaka', (t) => { blip(hz(88), t, 0.06, 0.07, 'p12'); blip(hz(95), t + 0.07, 0.1, 0.07, 'p12'); });
  S('entry', (t) => blip(1100, t, 0.03, 0.1, 'p25'));

  // ---------------------------------------------------------------- the engine (continuous)
  const Engine = { on: false, n: null };
  function build() {
    const g0 = graph(); if (!g0) return null;
    const c = A.ctx, n = {};
    n.out = c.createGain(); n.out.gain.value = 0; n.out.connect(A.sfxBus);
    n.o1 = c.createOscillator(); n.o1.type = 'sawtooth';
    n.o2 = c.createOscillator(); n.o2.type = 'square';
    n.o3 = c.createOscillator(); n.o3.type = 'sawtooth';
    n.f = c.createBiquadFilter(); n.f.type = 'lowpass'; n.f.Q.value = 3;
    n.g = c.createGain(); n.g.gain.value = 0.5;
    const g2 = c.createGain(); g2.gain.value = 0.35;
    n.g3 = c.createGain(); n.g3.gain.value = 0.25;
    n.o1.connect(n.f); n.o2.connect(g2); g2.connect(n.f); n.o3.connect(n.g3); n.g3.connect(n.f); n.f.connect(n.g); n.g.connect(n.out);
    // noises: off-road rumble, tyre screech, wind
    const mk = (type, f, q) => { const s = c.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gg = c.createGain(); gg.gain.value = 0; s.connect(fl); fl.connect(gg); gg.connect(n.out); s.start(); return { s, fl, gg }; };
    n.rumble = mk('bandpass', 160, 1.2);
    n.rumble.s.playbackRate.value = 0.5;
    n.screech = mk('bandpass', 2600, 9);
    n.wind = mk('highpass', 1800, 0.5);
    n.lfo = c.createOscillator(); n.lfo.frequency.value = 13; const lg = c.createGain(); lg.gain.value = 400; n.lfo.connect(lg); lg.connect(n.screech.fl.frequency);
    [n.o1, n.o2, n.o3, n.lfo].forEach((o) => o.start());
    n.ctx = c;
    return n;
  }
  const GEARS = [0, 0.2, 0.4, 0.6, 0.8, 1.01];
  // pct 0..1 speed, thr 0..1 throttle, off: off-road, skid 0..1
  Engine.update = function (pct, thr, off, skid, revOnly) {
    if (!A.ctx || A.ctx.state !== 'running') return;
    if (!Engine.n || Engine.n.ctx !== A.ctx) Engine.n = build();
    const n = Engine.n; if (!n) return;
    const t = A.ctx.currentTime;
    let rpm;
    if (revOnly) rpm = 0.25 + thr * 0.6;
    else {
      let gI = 0; while (gI < GEARS.length - 2 && pct > GEARS[gI + 1]) gI++;
      rpm = 0.32 + 0.68 * (pct - GEARS[gI]) / (GEARS[gI + 1] - GEARS[gI]);
      rpm = rpm * (0.8 + gI * 0.06) + thr * 0.05;
    }
    const f = 42 + rpm * 120;
    n.o1.frequency.setTargetAtTime(f, t, 0.03); n.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03); n.o3.frequency.setTargetAtTime(f * 1.505, t, 0.03);
    n.f.frequency.setTargetAtTime(260 + rpm * 900 + thr * 900, t, 0.05);
    n.out.gain.setTargetAtTime(Engine.on ? 1 : 0, t, 0.08);
    n.g.gain.setTargetAtTime(0.045 + thr * 0.035, t, 0.05);
    n.rumble.gg.gain.setTargetAtTime(off ? 0.2 + pct * 0.3 : 0, t, 0.05);
    n.screech.gg.gain.setTargetAtTime(skid * 0.16, t, 0.04);
    n.wind.gg.gain.setTargetAtTime(pct * pct * 0.02, t, 0.1);
  };
  Engine.start = function () { Engine.on = true; };
  Engine.stop = function () {
    Engine.on = false;
    if (Engine.n && A.ctx) { const t = A.ctx.currentTime; Engine.n.out.gain.setTargetAtTime(0, t, 0.05); }
  };

  return { Engine, voice, drum, now };
})();
