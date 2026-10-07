/* GAME AUDIO — every sound and every song, all original, synthesised live.
   Plumbing (plumbing/audio.js) owns the Web Audio wiring, buses and the step sequencer;
   this file owns the instruments (2-operator FM voices in the YM2612 spirit, PSG squares,
   a sampled-feel drum kit), the song notation, the soundtrack and the effects.

   Song notation (per track, one string per bar, 16 steps = one 4/4 bar):
     'E5:4 G5:2 -:2 C6:8'   note:length (16ths). '-' rest, '~' tie. Default length = track.d
     chord tracks use the song's chords: 'C', 'Am', 'F#m7', 'Bb', 'G/B', two per bar 'F G'
     bass 'R:2 5:2 8:2 b7:2'  chord-relative degrees (R 3 b3 5 6 b7 7 8 9 ...)
     arp  pattern of chord-tone indices, e.g. [0, 2, 1, 2] in steps of track.d
     drums '16-character strings: k kick, s snare, c clap, h hat, o open hat, t/T toms,
            d/D djembe, x shaker, C crash, p timpani, r rim
   Sfx(name) plays an effect (safe before audio has unlocked). */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio;
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parseNote(s) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) throw new Error('bad note ' + s);
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], aug: [0, 4, 8], sus4: [0, 5, 7], sus2: [0, 2, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 14], '5': [0, 7, 12] };
  function parseChord(s) {
    const m = /^([A-G][#b]?)(maj7|m7|m9|add9|sus4|sus2|dim|aug|m|7|5)?(?:\/([A-G][#b]?))?$/.exec(s);
    if (!m) throw new Error('bad chord ' + s);
    const root = parseNote(m[1] + '3') % 12;
    return { root, iv: QUAL[m[2] || ''], bass: m[3] ? parseNote(m[3] + '3') % 12 : root };
  }
  const DEG = { R: 0, '1': 0, b2: 1, '2': 2, b3: 3, '3': 4, '4': 5, b5: 6, '5': 7, b6: 8, '6': 9, b7: 10, '7': 11, '8': 12, '9': 14, '10': 16, '11': 17, '12': 19, '-5': -5, '-4': -7, '-8': -12 };

  // ------------------------------------------------------------------ instruments
  const pans = {};
  function bus(pan) {
    const c = A.ctx, key = Math.round((pan || 0) * 10);
    if (pans[key] && pans[key].ctx === c) return pans[key].node;
    let node;
    if (c.createStereoPanner) { node = c.createStereoPanner(); node.pan.value = key / 10; node.connect(A.musicBus); }
    else node = A.musicBus;
    pans[key] = { ctx: c, node };
    return node;
  }
  function env(p, t, vol, a, d, s, dur, r) {
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(vol, t + a);
    p.setTargetAtTime(vol * s, t + a, d / 3 + 0.001);
    p.setValueAtTime(Math.max(0.0001, vol * s * 0.98), t + Math.max(a, dur));
    p.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + r);
  }
  function osc(type, f, t, end) {
    const o = A.ctx.createOscillator();
    if (A.waves[type]) o.setPeriodicWave(A.waves[type]); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t); o.stop(end);
    return o;
  }
  // P: { ratio, index, index1, idecay, a, d, s, r, wave, vib, vibDepth, vibDelay, detune, ratio2, index2 }
  function fm(t, m, dur, vol, P, out) {
    const c = A.ctx, f = midi(m), end = t + dur + P.r + 0.05;
    const car = osc(P.wave || 'sine', f, t, end), mod = osc('sine', f * P.ratio, t, end), mg = c.createGain();
    const I0 = P.index * f * P.ratio, I1 = Math.max(0.5, (P.index1 === undefined ? P.index * 0.3 : P.index1) * f * P.ratio);
    mg.gain.setValueAtTime(I0, t);
    mg.gain.exponentialRampToValueAtTime(I1, t + (P.idecay || dur));
    mod.connect(mg); mg.connect(car.frequency);
    if (P.ratio2) { const m2 = osc('sine', f * P.ratio2, t, end), g2 = c.createGain(); g2.gain.setValueAtTime(P.index2 * f * P.ratio2, t); g2.gain.exponentialRampToValueAtTime(1, t + 0.15); m2.connect(g2); g2.connect(car.frequency); }
    if (P.vib) { const l = osc('sine', P.vib, t, end), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (P.vibDepth || 0.01), t + (P.vibDelay || 0.2)); l.connect(lg); lg.connect(car.frequency); }
    if (P.detune) car.detune.value = P.detune;
    const g = c.createGain();
    env(g.gain, t, vol, P.a, P.d, P.s, dur, P.r);
    car.connect(g); g.connect(out);
  }
  function pad(t, m, dur, vol, P, out) {
    const c = A.ctx, f = midi(m), end = t + dur + P.r + 0.05;
    const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = P.cut || 1800; flt.Q.value = 0.7;
    const g = c.createGain();
    for (const dt of P.spread || [-7, 7]) { const o = osc(P.wave || 'sawtooth', f, t, end); o.detune.value = dt; o.connect(flt); }
    env(g.gain, t, vol, P.a, P.d, P.s, dur, P.r);
    flt.connect(g); g.connect(out);
  }
  function choir(t, m, dur, vol, P, out) {
    const c = A.ctx, f = midi(m), end = t + dur + P.r + 0.05;
    const g = c.createGain(), mix = c.createGain(); mix.gain.value = 1;
    const src = [osc('sawtooth', f, t, end), osc('sawtooth', f, t, end)];
    src[1].detune.value = 9;
    const l = osc('sine', 5.2, t, end), lg = c.createGain(); lg.gain.value = f * 0.012; l.connect(lg); src.forEach((s) => lg.connect(s.frequency));
    for (const [ff, q, gv] of P.formants || [[720, 7, 1], [1150, 9, 0.7], [2600, 12, 0.25]]) {
      const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q;
      const bg = c.createGain(); bg.gain.value = gv;
      src.forEach((s) => s.connect(b)); b.connect(bg); bg.connect(mix);
    }
    env(g.gain, t, vol * 2.2, P.a, P.d, P.s, dur, P.r);
    mix.connect(g); g.connect(out);
  }
  function psg(t, m, dur, vol, P, out) {
    const c = A.ctx, f = midi(m), end = t + dur + P.r + 0.05;
    const o = osc(P.wave || 'p25', f, t, end), g = c.createGain();
    if (P.vib) { const l = osc('sine', P.vib, t, end), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.25); l.connect(lg); lg.connect(o.frequency); }
    env(g.gain, t, vol, P.a, P.d, P.s, dur, P.r);
    o.connect(g); g.connect(out);
  }
  function flute(t, m, dur, vol, P, out) {
    fm(t, m, dur, vol, P, out);
    const c = A.ctx, s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true; b.type = 'bandpass'; b.frequency.value = midi(m) * 2; b.Q.value = 3;
    g.gain.setValueAtTime(vol * 0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(b); b.connect(g); g.connect(out); s.start(t); s.stop(t + 0.15);
  }

  const PATCHES = {
    bass:    { fn: fm, ratio: 1, index: 2.4, index1: 0.5, idecay: 0.18, a: 0.003, d: 0.12, s: 0.55, r: 0.06, wave: 'sine' },
    slap:    { fn: fm, ratio: 1, index: 4.2, index1: 0.4, idecay: 0.07, a: 0.002, d: 0.1, s: 0.45, r: 0.05, ratio2: 3, index2: 1.2 },
    sub:     { fn: fm, ratio: 0.5, index: 1.2, index1: 0.3, idecay: 0.2, a: 0.004, d: 0.2, s: 0.7, r: 0.08 },
    brass:   { fn: fm, ratio: 1, index: 0.9, index1: 2.6, idecay: 0.12, a: 0.035, d: 0.2, s: 0.82, r: 0.09, vib: 5.5, vibDepth: 0.008, vibDelay: 0.35 },
    horn:    { fn: fm, ratio: 1, index: 0.6, index1: 1.6, idecay: 0.2, a: 0.06, d: 0.3, s: 0.85, r: 0.16, vib: 5, vibDepth: 0.006, vibDelay: 0.4 },
    lead:    { fn: fm, ratio: 2, index: 1.5, index1: 0.9, idecay: 0.25, a: 0.01, d: 0.2, s: 0.75, r: 0.08, vib: 5.8, vibDepth: 0.012, vibDelay: 0.25 },
    flute:   { fn: flute, ratio: 1, index: 0.35, index1: 0.18, idecay: 0.2, a: 0.04, d: 0.2, s: 0.8, r: 0.1, vib: 5.2, vibDepth: 0.01, vibDelay: 0.3, wave: 'sine' },
    marimba: { fn: fm, ratio: 4, index: 2.2, index1: 0.01, idecay: 0.12, a: 0.002, d: 0.16, s: 0.0001, r: 0.05 },
    kalimba: { fn: fm, ratio: 5.07, index: 1.6, index1: 0.01, idecay: 0.08, a: 0.002, d: 0.22, s: 0.0001, r: 0.06 },
    bell:    { fn: fm, ratio: 3.5, index: 2.8, index1: 0.2, idecay: 0.5, a: 0.002, d: 0.6, s: 0.08, r: 0.4 },
    epiano:  { fn: fm, ratio: 1, index: 1.3, index1: 0.15, idecay: 0.4, a: 0.003, d: 0.5, s: 0.25, r: 0.25, ratio2: 14, index2: 0.15 },
    pluck:   { fn: fm, ratio: 3, index: 2, index1: 0.05, idecay: 0.12, a: 0.002, d: 0.15, s: 0.15, r: 0.08 },
    organ:   { fn: fm, ratio: 2, index: 0.5, index1: 0.5, idecay: 1, a: 0.01, d: 0.1, s: 0.9, r: 0.06 },
    strings: { fn: pad, a: 0.16, d: 0.4, s: 0.85, r: 0.35, cut: 2000 },
    warm:    { fn: pad, a: 0.3, d: 0.6, s: 0.8, r: 0.6, cut: 1100, spread: [-9, 0, 9] },
    choir:   { fn: choir, a: 0.18, d: 0.4, s: 0.9, r: 0.4 },
    square:  { fn: psg, wave: 'p25', a: 0.004, d: 0.1, s: 0.6, r: 0.04 },
    sqlead:  { fn: psg, wave: 'square', a: 0.004, d: 0.15, s: 0.7, r: 0.05, vib: 6 },
    tri:     { fn: psg, wave: 'triangle', a: 0.004, d: 0.1, s: 0.8, r: 0.05 }
  };

  // ------------------------------------------------------------------ drum kit
  function drum(ch, t, v) {
    const o = { bus: 'music' };
    switch (ch) {
      case 'k': A.tone('sine', 150, 42, t, 0.16, 0.9 * v, o); A.noise(t, 0.02, 0.25 * v, { bus: 'music', filter: 'lowpass', f0: 3000 }); break;
      case 's': A.noise(t, 0.16, 0.5 * v, { bus: 'music', filter: 'bandpass', f0: 2200, f1: 1400, q: 0.8 }); A.tone('triangle', 210, 150, t, 0.08, 0.35 * v, o); break;
      case 'c': for (let i = 0; i < 3; i++) A.noise(t + i * 0.011, 0.05 + (i === 2 ? 0.08 : 0), 0.38 * v, { bus: 'music', filter: 'bandpass', f0: 1300, q: 1.6 }); break;
      case 'h': A.noise(t, 0.035, 0.16 * v, { bus: 'music', filter: 'highpass', f0: 7500 }); break;
      case 'o': A.noise(t, 0.22, 0.14 * v, { bus: 'music', filter: 'highpass', f0: 6500 }); break;
      case 'x': A.noise(t, 0.05, 0.08 * v, { bus: 'music', filter: 'highpass', f0: 5000, f1: 9000 }); break;
      case 'r': A.noise(t, 0.03, 0.3 * v, { bus: 'music', filter: 'bandpass', f0: 3200, q: 3 }); A.tone('square', 900, 600, t, 0.02, 0.06 * v, o); break;
      case 't': A.tone('sine', 230, 110, t, 0.2, 0.55 * v, o); break;
      case 'T': A.tone('sine', 150, 70, t, 0.26, 0.6 * v, o); break;
      case 'd': A.tone('sine', 360, 220, t, 0.09, 0.45 * v, o); A.noise(t, 0.03, 0.2 * v, { bus: 'music', filter: 'bandpass', f0: 2500, q: 2 }); break;
      case 'D': A.tone('sine', 120, 70, t, 0.2, 0.7 * v, o); A.noise(t, 0.02, 0.15 * v, { bus: 'music', filter: 'lowpass', f0: 1200 }); break;
      case 'C': A.noise(t, 1.3, 0.22 * v, { bus: 'music', filter: 'highpass', f0: 3500, f1: 6000 }); A.noise(t, 0.4, 0.15 * v, { bus: 'music', filter: 'bandpass', f0: 5000, q: 0.5 }); break;
      case 'p': A.tone('sine', 98, 82, t, 0.7, 0.75 * v, o); A.tone('triangle', 196, 160, t, 0.3, 0.2 * v, o); A.noise(t, 0.05, 0.2 * v, { bus: 'music', filter: 'lowpass', f0: 600 }); break;
    }
  }

  // ------------------------------------------------------------------ song compiler
  function tokens(bar) { return bar.trim().split(/\s+/).filter(Boolean); }
  function compileNotes(bars, d, key) {
    return bars.map((bar) => {
      const ev = []; let s = 0;
      if (bar === null || bar === '') return ev;
      for (const tk of tokens(bar)) {
        let [n, l] = tk.split(':'); l = l ? +l : d;
        if (n === '-') { s += l; continue; }
        if (n === '~') { if (ev.length) ev[ev.length - 1].len += l; s += l; continue; }
        const ms = n.startsWith('[') ? n.slice(1, -1).split(',').map(parseNote) : [parseNote(n)];
        ev.push({ s, m: ms.map((x) => x + key), len: l });
        s += l;
      }
      return ev;
    });
  }
  function chordsPerStep(song) {
    // chord at each half bar
    return song.chords.map((c) => { const parts = c.split(' '); if (parts.length === 1) { const one = parseChord(parts[0]); return [one, one]; } return [parseChord(parts[0]), parseChord(parts[1])]; });
  }
  function compile(name, song) {
    const key = song.key || 0;
    const ch = song.chords ? chordsPerStep(song) : null;
    const tracks = [];
    for (const tn in song.tracks) {
      const T = song.tracks[tn], d = T.d || 2, P = PATCHES[T.patch], vol = T.vol || 0.2, pan = T.pan || 0, oct = T.oct || 0;
      let bars;
      if (T.notes) bars = compileNotes(T.notes, d, key + oct * 12);
      else if (T.bass) {
        const pats = Array.isArray(T.bass) ? T.bass : [T.bass];
        bars = ch.map((cc, bi) => {
          const ev = []; let s = 0;
          for (const tk of tokens(pats[bi % pats.length])) {
            let [n, l] = tk.split(':'); l = l ? +l : d;
            if (n === '-') { s += l; continue; }
            const c = cc[s < 8 ? 0 : 1], base = 36 + (T.root === 'bass' ? c.bass : c.root) + (oct * 12);
            ev.push({ s, m: [base + (DEG[n] !== undefined ? DEG[n] : 0) + key], len: l });
            s += l;
          }
          return ev;
        });
      } else if (T.arp) {
        bars = ch.map((cc) => {
          const ev = [];
          for (let s = 0, i = 0; s < 16; s += d, i++) {
            const c = cc[s < 8 ? 0 : 1], idx = T.arp[i % T.arp.length];
            if (idx === null) continue;
            const iv = c.iv, o = Math.floor(idx / iv.length), n = iv[((idx % iv.length) + iv.length) % iv.length] + 12 * o;
            ev.push({ s, m: [60 + oct * 12 + ((c.root + 12 - 0) % 12) + n + key - (c.root > 6 ? 12 : 0)], len: T.len || d });
          }
          return ev;
        });
      } else if (T.pad) {
        bars = ch.map((cc) => {
          const ev = [];
          const sameBar = cc[0] === cc[1];
          for (const [s, l] of sameBar ? [[0, 16]] : [[0, 8], [8, 8]]) {
            const c = cc[s < 8 ? 0 : 1], root = 48 + oct * 12 + c.root - (c.root > 7 ? 12 : 0);
            const ms = c.iv.slice(0, T.voices || 3).map((iv) => root + iv + key + 12);
            ev.push({ s, m: ms, len: l });
          }
          return ev;
        });
      } else if (T.drums) {
        const pats = T.drums;
        bars = pats.map((p) => {
          const ev = [];
          for (let s = 0; s < 16; s++) { const c = p[s]; if (c && c !== '.') ev.push({ s, drum: c }); }
          return ev;
        });
      }
      tracks.push({ bars, P, vol, pan, drums: !!T.drums, echo: T.echo, accent: T.accent, gate: T.gate || 0.92 });
    }
    const total = song.bars || Math.max(...tracks.map((t) => t.bars.length));
    const def = {
      bpm: song.bpm, stepsPerBeat: 4,
      length: song.once ? undefined : total * 16,
      step(i, t, dur) {
        const bar = Math.floor(i / 16), s = i % 16;
        if (song.once && bar >= total) return;
        if (song.swing && s % 2 === 1) t += song.swing * dur;
        for (const tr of tracks) {
          const evs = tr.bars[bar % tr.bars.length];
          if (!evs) continue;
          for (const e of evs) {
            if (e.s !== s) continue;
            if (tr.drums) { drum(e.drum, t, tr.vol * (tr.accent && s % 4 === 0 ? 1.15 : 1)); continue; }
            const out = bus(tr.pan), L = e.len * dur * tr.gate;
            for (const m of e.m) tr.P.fn(t, m, L, tr.vol / Math.sqrt(e.m.length), tr.P, out);
            if (tr.echo) for (let k = 1; k <= (tr.echo.n || 2); k++) for (const m of e.m) tr.P.fn(t + tr.echo.d * dur * k, m, L, tr.vol * Math.pow(tr.echo.fb || 0.4, k), tr.P, bus(-tr.pan || (k % 2 ? 0.5 : -0.5)));
          }
        }
      }
    };
    A.song(name, def);
    return def;
  }

  // ------------------------------------------------------------------ THE SOUNDTRACK (all original)
  const D = {
    savanna: ['k..k..k...k..k..', 'k..k..k...k.kk..'],
    savPerc: ['..d.dd.d..d.D.d.', '..d.dd.d..dDD.dd'],
    shake: ['x.xxx.xxx.xxx.xx'],
    clap24: ['....c.......c...']
  };
  const SONGS = {
    // ---- the title anthem: brass over choir, timpani and talking drums (Eb major)
    title: { bpm: 88, key: 3, chords: ['C', 'F', 'Dm7', 'Am', 'C', 'Em7', 'F G', 'C', 'Am', 'F', 'Dm G', 'G', 'Am', 'Bb', 'F G', 'C'],
      tracks: {
        lead: { patch: 'brass', vol: 0.2, pan: 0.15, notes: [
          'G4:4 C5:6 D5:2 E5:4', 'D5:4 C5:2 A4:2 G4:8', 'A4:4 C5:4 F5:4 E5:2 D5:2', 'E5:12 -:4',
          'G4:4 C5:6 D5:2 E5:4', 'G5:6 F5:2 E5:4 D5:4', 'C5:4 A4:4 D5:4 B4:4', 'C5:16',
          'E5:4 F5:4 G5:8', 'A5:4 G5:4 E5:4 C5:4', 'D5:4 E5:4 F5:6 E5:2', 'D5:16',
          'E5:4 F5:4 G5:6 A5:2', 'Bb5:8 A5:4 G5:4', 'A5:4 G5:4 F5:4 D5:4', 'E5:8 D5:4 C5:4'] },
        choir: { patch: 'choir', pad: true, vol: 0.075, pan: -0.2, voices: 3 },
        str: { patch: 'warm', pad: true, vol: 0.05, pan: 0.3, oct: -1 },
        bass: { patch: 'sub', vol: 0.3, bass: ['R:6 R:2 5:4 R:4', 'R:8 5:4 8:4'] },
        timp: { vol: 0.8, drums: ['p.......p.......', 'p.......p...p.p.', 'p.......p.......', 'p...........pppp'] },
        perc: { vol: 0.55, drums: ['D..d..d.D.d.d...', 'D..d..d.D.d.dDd.'] },
        cym: { vol: 0.6, drums: ['C...............', '................', '................', '................', '................', '................', '................', '................'] }
      } },
    // ---- act 1: a sunny stroll — pan flute over marimba (F major)
    savanna: { bpm: 116, key: 5, chords: ['C', 'F', 'Am', 'G', 'C', 'F', 'Dm', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'G'],
      tracks: {
        lead: { patch: 'flute', vol: 0.19, pan: 0.2, notes: [
          'E5:3 G5:3 A5:2 G5:4 E5:4', 'F5:3 A5:3 C6:2 A5:4 F5:4', 'E5:2 D5:2 C5:2 D5:2 E5:4 A4:4', 'B4:4 D5:4 G5:8',
          'E5:3 G5:3 A5:2 G5:4 E5:4', 'A5:3 C6:3 D6:2 C6:4 A5:4', 'F5:2 E5:2 D5:2 F5:2 A5:4 G5:4', 'G5:4 -:2 D5:2 G5:8',
          'C6:4 B5:2 A5:2 E5:8', 'F5:4 G5:2 A5:2 C6:8', 'G5:4 E5:4 C5:4 E5:4', 'D5:12 -:4',
          'C6:4 B5:2 A5:2 E5:6 A5:2', 'C6:4 D6:2 C6:2 A5:8', 'B5:4 A5:4 G5:4 D5:4', 'G5:8 F5:4 D5:4'] },
        mar: { patch: 'marimba', arp: [0, 2, 1, 2, 3, 2, 1, 2], d: 2, vol: 0.13, pan: -0.35, oct: 0 },
        bass: { patch: 'slap', vol: 0.26, bass: ['R:3 R:1 -:2 5:2 R:2 -:2 8:2 5:2', 'R:3 R:1 -:2 5:2 R:2 3:2 5:2 8:2'] },
        pad: { patch: 'strings', pad: true, vol: 0.035, pan: 0.4 },
        kick: { vol: 0.6, drums: D.savanna },
        perc: { vol: 0.42, drums: D.savPerc },
        shk: { vol: 0.5, drums: D.shake },
        clap: { vol: 0.35, drums: D.clap24 }
      } },
    // ---- act 2: the Bone Barrens — eerie bells over a phrygian ostinato (D minor)
    danger: { bpm: 100, key: -2, chords: ['Em', 'Em', 'F', 'Em', 'Am', 'Em', 'F', 'B7'],
      tracks: {
        bell: { patch: 'bell', vol: 0.14, pan: 0.3, echo: { d: 3, fb: 0.35, n: 2 }, notes: [
          'B5:6 C6:2 B5:4 G5:4', 'E5:12 -:4', 'F5:6 G5:2 A5:4 C6:4', 'B5:12 -:4',
          'A5:4 C6:4 E6:4 D6:2 C6:2', 'B5:8 G5:4 E5:4', 'F5:4 A5:4 G5:4 F5:4', 'D#5:8 F#5:4 B5:4'] },
        bass: { patch: 'bass', vol: 0.3, notes: ['E2:2 E2:1 E3:1 E2:2 F2:2 E2:2 E2:1 E3:1 G2:2 F2:2', 'E2:2 E2:1 E3:1 E2:2 F2:2 E2:2 E2:1 E3:1 G2:2 F2:2', 'F2:2 F2:1 F3:1 F2:2 G2:2 F2:2 F2:1 F3:1 A2:2 G2:2', 'E2:2 E2:1 E3:1 E2:2 F2:2 E2:2 E2:1 E3:1 G2:2 F2:2',
          'A2:2 A2:1 A3:1 A2:2 Bb2:2 A2:2 A2:1 A3:1 C3:2 Bb2:2', 'E2:2 E2:1 E3:1 E2:2 F2:2 E2:2 E2:1 E3:1 G2:2 F2:2', 'F2:2 F2:1 F3:1 F2:2 G2:2 F2:2 F2:1 F3:1 A2:2 G2:2', 'B1:2 B1:1 B2:1 B1:2 C2:2 B1:2 D#2:2 F#2:2 A2:2'] },
        stab: { patch: 'brass', vol: 0.07, pan: -0.3, notes: ['-:6 [E4,G4,B4]:2 -:6 [E4,G4,B4]:2', '-:6 [E4,G4,B4]:2 -:4 [E4,G4,B4]:2 [E4,G4,B4]:2', '-:6 [F4,A4,C5]:2 -:6 [F4,A4,C5]:2', '-:6 [E4,G4,B4]:2 -:6 [E4,G4,B4]:2',
          '-:6 [E4,A4,C5]:2 -:6 [E4,A4,C5]:2', '-:6 [E4,G4,B4]:2 -:6 [E4,G4,B4]:2', '-:6 [F4,A4,C5]:2 -:6 [F4,A4,C5]:2', '-:6 [D#4,F#4,B4]:2 -:2 [D#4,F#4,B4]:2 [D#4,F#4,B4]:2 [D#4,F#4,B4]:2'] },
        pad: { patch: 'warm', pad: true, vol: 0.04, pan: 0, oct: -1 },
        kick: { vol: 0.65, drums: ['k.......k.k.....', 'k.......k.k...k.'] },
        snr: { vol: 0.45, drums: ['........s.......', '........s.......', '........s.......', '........s...tTtT'] },
        hat: { vol: 0.4, drums: ['..h...h...h...h.'] }
      } },
    // ---- act 3: the stampede — galloping drums and urgent brass (E minor)
    chase: { bpm: 152, chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'],
      tracks: {
        lead: { patch: 'brass', vol: 0.18, pan: 0.15, notes: [
          'E5:2 E5:2 G5:2 E5:2 A5:3 G5:3 E5:2', 'B5:4 A5:2 G5:2 F#5:4 E5:4', 'C6:2 C6:2 B5:2 G5:2 E5:4 G5:4', 'F#5:2 F#5:2 G5:2 A5:2 D6:8',
          'E5:2 E5:2 G5:2 E5:2 A5:3 G5:3 E5:2', 'B5:4 D6:2 B5:2 A5:4 G5:4', 'C6:4 B5:2 A5:2 G5:4 E5:4', 'D#5:4 F#5:4 B5:8'] },
        trem: { patch: 'strings', arp: [0, 2, 0, 2], d: 1, len: 1, vol: 0.05, pan: -0.4 },
        bass: { patch: 'bass', vol: 0.3, bass: ['R:2 8:2 R:2 8:2 R:2 8:2 R:2 8:2'] },
        kick: { vol: 0.65, drums: ['k.kkk.kkk.kkk.kk'] },
        snr: { vol: 0.5, drums: ['....s.......s...', '....s.......s...', '....s.......s...', '....s...s.s.ssss'] },
        tom: { vol: 0.45, drums: ['......t.......T.', '................', '......t.......T.', 't.t.T.T.........'] },
        hat: { vol: 0.35, drums: ['h.h.h.h.h.h.h.h.'] },
        cym: { vol: 0.5, drums: ['C...............', '................', '................', '................'] }
      } },
    // ---- act 4: exile through the thornlands — a lonely flute (A minor)
    thorn: { bpm: 90, chords: ['Am', 'Em', 'F', 'C', 'Dm', 'Am', 'E', 'E7'],
      tracks: {
        lead: { patch: 'flute', vol: 0.19, pan: 0.1, notes: [
          'A4:4 C5:4 E5:6 D5:2', 'B4:12 -:4', 'C5:4 D5:4 F5:4 E5:2 D5:2', 'E5:12 -:4',
          'F5:4 E5:4 D5:4 C5:4', 'C5:4 B4:2 A4:2 A4:8', 'G#4:4 B4:4 E5:4 D5:4', 'B4:16'] },
        pl: { patch: 'pluck', arp: [0, 1, 2, 1], d: 4, vol: 0.12, pan: -0.3, oct: -1 },
        pad: { patch: 'warm', pad: true, vol: 0.045, pan: 0.2, oct: -1 },
        bass: { patch: 'bass', vol: 0.24, bass: ['R:8 5:8'] },
        perc: { vol: 0.4, drums: ['D.....d.D.....d.'] },
        shk: { vol: 0.3, drums: ['..x...x...x...x.'] }
      } },
    // ---- act 5: Hushwood Jungle — kalimba, funky bass and a bird-like lead (G mixolydian)
    jungle: { bpm: 128, swing: 0.12, chords: ['G', 'F', 'C', 'G', 'G', 'F', 'C', 'D'],
      tracks: {
        lead: { patch: 'lead', vol: 0.15, pan: 0.25, notes: [
          'D5:2 G5:2 B5:2 A5:2 G5:4 D5:4', 'F5:2 A5:2 C6:2 A5:2 F5:4 C5:4', 'E5:2 G5:2 C6:2 B5:2 G5:4 E5:4', 'D5:4 G5:2 A5:2 B5:8',
          'D6:2 C6:2 B5:2 A5:2 G5:4 D5:4', 'F5:2 G5:2 A5:2 C6:2 F6:4 C6:4', 'E6:4 D6:2 C6:2 B5:4 G5:4', 'A5:4 F#5:4 D5:4 A5:4'] },
        kal: { patch: 'kalimba', arp: [0, 2, 3, 2, 1, 2, 3, 4], d: 2, vol: 0.12, pan: -0.35 },
        bass: { patch: 'slap', vol: 0.26, bass: ['R:2 -:1 R:1 8:2 R:2 -:2 5:2 b7:2 8:2'] },
        kick: { vol: 0.6, drums: ['k..k..k.k..k..k.'] },
        clap: { vol: 0.42, drums: ['....c.......c...', '....c.......c.c.'] },
        hat: { vol: 0.3, drums: ['hhhhohhhhhhhohhh'] },
        perc: { vol: 0.4, drums: ['..d...d.D...d.d.', '..d...d.D.d.dDd.'] }
      } },
    // ---- act 6: Thunder Falls — bright, flowing bells (D major)
    falls: { bpm: 120, key: 2, chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'],
      tracks: {
        lead: { patch: 'horn', vol: 0.17, pan: 0.1, notes: [
          'E5:6 D5:2 C5:4 G5:4', 'E5:6 D5:2 C5:4 A4:4', 'F5:4 E5:4 D5:4 C5:4', 'D5:12 G4:4',
          'E5:6 F5:2 G5:4 C6:4', 'B5:6 A5:2 G5:4 E5:4', 'F5:4 A5:4 G5:4 F5:4', 'D5:8 E5:4 D5:4'] },
        bells: { patch: 'bell', arp: [0, 1, 2, 3, 2, 1, 2, 3], d: 2, vol: 0.07, pan: -0.4, oct: 1 },
        bass: { patch: 'bass', vol: 0.26, bass: ['R:4 5:2 8:2 R:4 5:4'] },
        pad: { patch: 'strings', pad: true, vol: 0.04, pan: 0.35 },
        kick: { vol: 0.6, drums: ['k...k.k.k...k.k.'] },
        snr: { vol: 0.42, drums: ['....s.......s..s'] },
        hat: { vol: 0.35, drums: ['h.h.h.h.h.h.h.h.'] }
      } },
    // ---- act 7: Moonshade — the grown prince; the anthem's motif in B minor
    night: { bpm: 96, key: -1, chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G'],
      tracks: {
        lead: { patch: 'lead', vol: 0.14, pan: 0.15, notes: [
          'G4:4 C5:6 D5:2 Eb5:4', 'D5:4 C5:2 Ab4:2 G4:8', 'Bb4:4 Eb5:4 G5:4 F5:2 Eb5:2', 'D5:12 -:4',
          'G4:4 C5:6 D5:2 Eb5:4', 'Ab5:6 G5:2 F5:4 Eb5:4', 'F5:4 Ab5:4 G5:4 F5:4', 'G5:8 F5:4 D5:4'] },
        ep: { patch: 'epiano', arp: [0, 1, 2, 1, 3, 1, 2, 1], d: 2, vol: 0.09, pan: -0.3, oct: -1 },
        pad: { patch: 'warm', pad: true, vol: 0.05, pan: 0.3 },
        bass: { patch: 'bass', vol: 0.24, bass: ['R:6 5:2 8:4 5:4'] },
        kick: { vol: 0.55, drums: ['k.....k...k.....'] },
        rim: { vol: 0.4, drums: ['....r.......r...', '....r.......r.r.'] },
        shk: { vol: 0.3, drums: ['x.x.x.x.x.x.x.x.'] }
      } },
    // ---- act 8: the Echo Caverns — sparse bells in the dark (C# minor)
    cave: { bpm: 84, key: 1, chords: ['Cm', 'Ab', 'Cm', 'G', 'Fm', 'Cm', 'Db', 'G7'],
      tracks: {
        bell: { patch: 'bell', vol: 0.13, pan: 0.2, echo: { d: 3, fb: 0.45, n: 3 }, notes: [
          'G5:4 -:4 C6:4 Bb5:4', 'Ab5:8 Eb5:8', 'D5:4 Eb5:4 G5:4 F5:4', 'Eb5:8 D5:8',
          'F5:4 Ab5:4 C6:4 Bb5:4', 'G5:8 Eb5:8', 'F5:4 Ab5:4 Db6:4 C6:4', 'B5:8 G5:8'] },
        drone: { patch: 'warm', pad: true, vol: 0.05, pan: -0.2, oct: -1 },
        bass: { patch: 'sub', vol: 0.28, bass: ['R:16'] },
        kick: { vol: 0.5, drums: ['k...............', 'k.........k.....'] },
        tom: { vol: 0.35, drums: ['........T.......', '........T...t...'] },
        drip: { patch: 'kalimba', vol: 0.05, pan: 0.6, notes: ['-:10 G6:2 -:4', '-:4 C7:2 -:10', '-:12 Eb6:2 -:2', '-:16'] }
      } },
    // ---- act 9: the Cinder Wastes — heavy phrygian brass (F# minor)
    volcano: { bpm: 138, key: 2, chords: ['Em', 'F', 'Em', 'D', 'C', 'D', 'Em', 'E'],
      tracks: {
        lead: { patch: 'brass', vol: 0.17, pan: 0.15, notes: [
          'E5:4 G5:2 F5:2 E5:4 B4:4', 'C5:2 D5:2 F5:4 E5:2 D5:2 C5:4', 'B4:4 E5:4 G5:4 B5:4', 'A5:6 G5:2 F#5:8',
          'G5:4 E5:4 C5:4 G5:4', 'F#5:4 D5:4 A4:4 F#5:4', 'G5:2 A5:2 B5:4 A5:2 G5:2 E5:4', 'G#5:8 B5:8'] },
        bass: { patch: 'bass', vol: 0.3, notes: ['E2:2 E2:2 F2:2 E2:2 E2:2 G2:2 F2:2 E2:2', 'F2:2 F2:2 Gb2:2 F2:2 F2:2 A2:2 G2:2 F2:2', 'E2:2 E2:2 F2:2 E2:2 E2:2 G2:2 F2:2 E2:2', 'D2:2 D2:2 Eb2:2 D2:2 D2:2 F2:2 E2:2 D2:2',
          'C2:2 C2:2 Db2:2 C2:2 C2:2 E2:2 D2:2 C2:2', 'D2:2 D2:2 Eb2:2 D2:2 D2:2 F2:2 E2:2 D2:2', 'E2:2 E2:2 F2:2 E2:2 E2:2 G2:2 F2:2 E2:2', 'E2:2 G#2:2 B2:2 E3:2 B2:2 G#2:2 E2:2 E2:2'] },
        org: { patch: 'organ', pad: true, vol: 0.035, pan: -0.35 },
        kick: { vol: 0.65, drums: ['k.k...k.k.k...k.'] },
        snr: { vol: 0.5, drums: ['....s.......s.ss', '....s.......s...', '....s.......s.ss', '....s...s.s.tTtT'] },
        hat: { vol: 0.3, drums: ['h.h.h.h.h.h.h.h.'] }
      } },
    // ---- act 10: Return to Slow Rock — the anthem as a march (D minor)
    final: { bpm: 124, key: 2, chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G'],
      tracks: {
        lead: { patch: 'brass', vol: 0.18, pan: 0.1, notes: [
          'G4:4 C5:6 D5:2 Eb5:4', 'D5:4 C5:2 Ab4:2 G4:8', 'Bb4:4 Eb5:4 G5:4 F5:2 Eb5:2', 'F5:12 -:4',
          'G4:4 C5:6 D5:2 Eb5:4', 'G5:6 F5:2 Eb5:4 C5:4', 'F5:4 Ab5:4 G5:4 F5:4', 'G5:8 B5:4 D5:4'] },
        choir: { patch: 'choir', pad: true, vol: 0.06, pan: -0.25 },
        str: { patch: 'strings', arp: [0, 1, 2, 1], d: 2, vol: 0.05, pan: 0.35 },
        bass: { patch: 'bass', vol: 0.28, bass: ['R:2 R:2 5:2 R:2 R:2 R:2 5:2 8:2'] },
        snr: { vol: 0.38, drums: ['s.ss.s.ss.s.s.ss', 's.ss.s.ss.s.sss.'] },
        kick: { vol: 0.6, drums: ['k...k...k...k...'] },
        timp: { vol: 0.6, drums: ['p...............', '................', 'p...............', '............pppp'] }
      } },
    // ---- bosses
    boss: { bpm: 160, chords: ['Em', 'Em', 'C', 'B'],
      tracks: {
        lead: { patch: 'brass', vol: 0.17, pan: 0.15, notes: ['E5:2 -:2 E5:2 G5:2 F#5:2 -:2 E5:4', 'B5:2 -:2 B5:2 A#5:2 A5:2 G5:2 F#5:4', 'C6:2 -:2 C6:2 B5:2 A5:2 G5:2 E5:4', 'D#5:4 F#5:4 A5:4 B5:4'] },
        bass: { patch: 'bass', vol: 0.3, notes: ['E2:1 E2:1 E3:1 E2:1 G2:1 E2:1 E3:1 E2:1 A#2:1 E2:1 E3:1 E2:1 A2:1 G2:1 E3:1 E2:1', 'E2:1 E2:1 E3:1 E2:1 G2:1 E2:1 E3:1 E2:1 A#2:1 E2:1 E3:1 E2:1 A2:1 G2:1 E3:1 E2:1',
          'C2:1 C2:1 C3:1 C2:1 E2:1 C2:1 C3:1 C2:1 F#2:1 C2:1 C3:1 C2:1 G2:1 E2:1 C3:1 C2:1', 'B1:1 B1:1 B2:1 B1:1 D#2:1 B1:1 B2:1 B1:1 F#2:1 B1:1 B2:1 B1:1 A2:1 F#2:1 D#2:1 B1:1'] },
        stab: { patch: 'organ', vol: 0.06, pan: -0.35, notes: ['[E4,G4,B4]:2 -:6 [E4,G4,B4]:2 -:6', '[E4,G4,B4]:2 -:6 [E4,G4,B4]:2 -:6', '[E4,G4,C5]:2 -:6 [E4,G4,C5]:2 -:6', '[D#4,F#4,B4]:2 -:6 [D#4,F#4,B4]:4 [D#4,F#4,A4]:4'] },
        kick: { vol: 0.65, drums: ['k.k...k.k.k...k.'] },
        snr: { vol: 0.5, drums: ['....s.......s...', '....s.......s...', '....s.......s...', '....s...s.s.ssss'] },
        hat: { vol: 0.32, drums: ['h.h.h.h.h.h.h.h.'] }
      } },
    finalboss: { bpm: 168, key: 0, chords: ['Dm', 'Eb', 'Dm', 'C#dim', 'Dm', 'Gm', 'Bb', 'A7'],
      tracks: {
        lead: { patch: 'brass', vol: 0.17, pan: 0.15, notes: [
          'D5:2 F5:2 A5:2 G#5:2 A5:4 D6:4', 'Eb6:2 D6:2 C6:2 Bb5:2 A5:4 G5:4', 'F5:2 G5:2 A5:2 Bb5:2 C6:2 D6:2 Eb6:2 D6:2', 'C#6:8 E6:8',
          'D6:2 A5:2 F5:2 D5:2 Eb5:4 F5:4', 'G5:2 Bb5:2 D6:2 G6:2 F6:4 Eb6:4', 'D6:4 C6:4 Bb5:4 A5:4', 'C#6:4 E6:4 G6:4 Bb6:4'] },
        choir: { patch: 'choir', vol: 0.07, pan: -0.25, notes: ['[D4,F4,A4]:3 -:5 [D4,F4,A4]:3 -:5', '[Eb4,G4,Bb4]:3 -:5 [Eb4,G4,Bb4]:3 -:5', '[D4,F4,A4]:3 -:5 [D4,F4,A4]:3 -:5', '[C#4,E4,G4]:8 [C#4,E4,Bb4]:8'] },
        bass: { patch: 'bass', vol: 0.3, bass: ['R:1 8:1 R:1 8:1 R:1 8:1 b2:1 9:1 R:1 8:1 R:1 8:1 b3:1 R:1 8:1 R:1'] },
        kick: { vol: 0.65, drums: ['kkk.kkk.kkk.kkk.'] },
        snr: { vol: 0.5, drums: ['....s.......s...', '....s.......s...', '....s.......s...', '....s...s.ssssss'] },
        cym: { vol: 0.5, drums: ['C...............', '................', '................', '................', 'C...............', '................', '................', '................'] }
      } },
    // ---- story & interludes
    story: { bpm: 80, key: 5, chords: ['C', 'G/B', 'Am', 'F', 'C', 'G', 'F', 'G'],
      tracks: {
        lead: { patch: 'flute', vol: 0.16, pan: 0.1, notes: ['E5:8 G5:8', 'D5:12 -:4', 'C5:4 E5:4 A5:8', 'G5:12 -:4', 'E5:6 F5:2 G5:8', 'B5:8 A5:4 G5:4', 'A5:8 F5:8', 'G5:16'] },
        ep: { patch: 'epiano', arp: [0, 1, 2, 1], d: 4, vol: 0.1, pan: -0.3, oct: -1 },
        pad: { patch: 'warm', pad: true, vol: 0.045 },
        bass: { patch: 'sub', vol: 0.22, bass: ['R:8 5:8'], root: 'bass' }
      } },
    sad: { bpm: 64, key: -2, chords: ['Em', 'C', 'Am', 'B', 'Em', 'G', 'Am', 'B7'],
      tracks: {
        lead: { patch: 'horn', vol: 0.15, pan: 0.1, notes: ['G5:8 F#5:4 E5:4', 'E5:8 D5:4 C5:4', 'C5:8 B4:4 A4:4', 'B4:16', 'G5:8 A5:4 B5:4', 'D6:8 B5:4 G5:4', 'A5:6 G5:2 F#5:4 E5:4', 'D#5:16'] },
        str: { patch: 'warm', pad: true, vol: 0.06, pan: -0.2 },
        bass: { patch: 'sub', vol: 0.22, bass: ['R:16'] }
      } },
    montage: { bpm: 126, key: 7, chords: ['C', 'F', 'Am', 'G', 'C', 'F', 'Dm', 'G'],
      tracks: {
        lead: { patch: 'brass', vol: 0.16, pan: 0.15, notes: [
          'E5:3 G5:3 A5:2 G5:4 E5:4', 'F5:3 A5:3 C6:2 A5:4 F5:4', 'E5:2 D5:2 C5:2 D5:2 E5:4 A4:4', 'B4:4 D5:4 G5:8',
          'E5:3 G5:3 A5:2 G5:4 E5:4', 'A5:3 C6:3 D6:2 C6:4 A5:4', 'F5:2 E5:2 D5:2 F5:2 A5:4 G5:4', 'C6:4 B5:2 G5:2 C6:8'] },
        mar: { patch: 'kalimba', arp: [0, 2, 1, 2, 3, 2, 1, 2], d: 2, vol: 0.11, pan: -0.35 },
        bass: { patch: 'slap', vol: 0.25, bass: ['R:3 R:1 -:2 5:2 R:2 3:2 5:2 8:2'] },
        choir: { patch: 'choir', pad: true, vol: 0.045, pan: 0.3 },
        kick: { vol: 0.6, drums: D.savanna }, perc: { vol: 0.4, drums: D.savPerc }, clap: { vol: 0.38, drums: D.clap24 }, shk: { vol: 0.45, drums: D.shake }
      } },
    ending: { bpm: 84, key: 3, chords: ['C', 'F', 'Dm7', 'Am', 'C', 'Em7', 'F G', 'C', 'Am', 'F', 'Dm G', 'G', 'Am', 'Bb', 'F G', 'C'],
      tracks: {
        lead: { patch: 'horn', vol: 0.19, pan: 0.1, notes: [
          'G4:4 C5:6 D5:2 E5:4', 'D5:4 C5:2 A4:2 G4:8', 'A4:4 C5:4 F5:4 E5:2 D5:2', 'E5:12 -:4',
          'G4:4 C5:6 D5:2 E5:4', 'G5:6 F5:2 E5:4 D5:4', 'C5:4 A4:4 D5:4 B4:4', 'C5:16',
          'E5:4 F5:4 G5:8', 'A5:4 G5:4 E5:4 C5:4', 'D5:4 E5:4 F5:6 E5:2', 'D5:16',
          'E5:4 F5:4 G5:6 A5:2', 'Bb5:8 A5:4 G5:4', 'A5:4 G5:4 F5:4 D5:4', 'C5:16'] },
        counter: { patch: 'flute', vol: 0.09, pan: -0.3, notes: ['-:8 G5:4 A5:4', 'A5:8 G5:8', 'F5:8 A5:8', 'G5:8 E5:8', '-:8 G5:4 A5:4', 'B5:8 G5:8', 'A5:8 B5:8', 'C6:8 G5:8',
          'C6:8 B5:8', 'C6:16', 'A5:8 B5:8', 'B5:16', 'C6:8 D6:8', 'D6:16', 'C6:8 B5:8', 'G5:16'] },
        choir: { patch: 'choir', pad: true, vol: 0.07, pan: 0.25 },
        bass: { patch: 'sub', vol: 0.28, bass: ['R:6 R:2 5:4 R:4'] },
        mar: { patch: 'marimba', arp: [0, 2, 1, 2], d: 4, vol: 0.08, pan: -0.5 },
        perc: { vol: 0.45, drums: ['D..d..d.D.d.d...'] },
        timp: { vol: 0.6, drums: ['p...............', '................', '................', '............pppp'] }
      } },
    bonus: { bpm: 150, chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'],
      tracks: {
        lead: { patch: 'sqlead', vol: 0.09, pan: 0.2, notes: ['C5:2 E5:2 G5:2 E5:2 C6:4 G5:4', 'A5:2 C6:2 E6:2 C6:2 A5:4 E5:4', 'F5:2 A5:2 C6:2 A5:2 F5:2 G5:2 A5:2 B5:2', 'C6:4 B5:4 G5:4 -:4',
          'E6:2 D6:2 C6:2 G5:2 E5:4 G5:4', 'A5:2 B5:2 C6:2 E6:2 A6:4 E6:4', 'F6:2 E6:2 D6:2 C6:2 A5:2 C6:2 F6:2 A6:2', 'G6:4 D6:4 B5:4 G5:4'] },
        mar: { patch: 'marimba', arp: [0, 1, 2, 1], d: 2, vol: 0.11, pan: -0.3 },
        bass: { patch: 'slap', vol: 0.24, bass: ['R:2 8:2 R:2 8:2 5:2 8:2 5:2 3:2'] },
        kick: { vol: 0.55, drums: ['k...k...k...k...'] }, clap: { vol: 0.35, drums: D.clap24 }, hat: { vol: 0.3, drums: ['.h.h.h.h.h.h.h.h'] }
      } },
    // ---- jingles (play once)
    clear: { bpm: 140, once: true, bars: 3, chords: ['C', 'F G', 'C'],
      tracks: {
        lead: { patch: 'brass', vol: 0.2, notes: ['C5:2 E5:2 G5:2 C6:6 -:2 G5:2', 'A5:2 B5:2 C6:2 D6:2 B5:4 G5:4', 'C6:12 -:4'] },
        harm: { patch: 'brass', vol: 0.12, pan: -0.3, notes: ['E4:2 G4:2 C5:2 E5:6 -:2 E5:2', 'F5:2 G5:2 A5:2 B5:2 G5:4 D5:4', 'E5:12 -:4'] },
        bass: { patch: 'bass', vol: 0.28, notes: ['C3:6 G2:6 C3:4', 'F2:8 G2:8', 'C2:12 -:4'] },
        timp: { vol: 0.7, drums: ['p.....p.....p...', 'p.......p.p.p.p.', 'C...............'] }
      } },
    lose: { bpm: 120, once: true, bars: 2,
      tracks: {
        lead: { patch: 'square', vol: 0.12, notes: ['B4:2 A#4:2 A4:2 G#4:2 G4:8', '-:16'] },
        bass: { patch: 'bass', vol: 0.25, notes: ['E3:2 D#3:2 D3:2 C#3:2 C3:8', '-:16'] }
      } },
    gameover: { bpm: 72, once: true, bars: 4, chords: ['Am', 'F', 'E', 'Am'],
      tracks: {
        lead: { patch: 'horn', vol: 0.16, notes: ['E5:8 C5:8', 'A4:8 F4:8', 'G#4:8 B4:8', 'A4:16'] },
        pad: { patch: 'warm', pad: true, vol: 0.05 },
        bass: { patch: 'sub', vol: 0.24, bass: ['R:16'] }
      } }
  };
  for (const n in SONGS) { try { compile(n, SONGS[n]); } catch (e) { console.error('song ' + n + ': ' + e.message); } }

  // ------------------------------------------------------------------ sound effects
  const S = A.sound.bind(A), tone = A.tone, noise = A.noise;
  function fmS(t, m, dur, vol, patch, pitchTo) {
    const c = A.ctx, P = Object.assign({}, PATCHES[patch] || patch), f = midi(m);
    const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.setValueAtTime(f, t); mod.frequency.setValueAtTime(f * P.ratio, t);
    if (pitchTo) { car.frequency.exponentialRampToValueAtTime(midi(pitchTo), t + dur); mod.frequency.exponentialRampToValueAtTime(midi(pitchTo) * P.ratio, t + dur); }
    mg.gain.setValueAtTime(P.index * f * P.ratio, t); mg.gain.exponentialRampToValueAtTime(Math.max(1, (P.index1 || 0.1) * f), t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(g); g.connect(A.sfxBus);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
    A.active.add(car); car.onended = () => A.active.delete(car);
  }
  S('jump', (t) => { tone('p25', 330, 720, t, 0.11, 0.14); fmS(t, 64, 0.1, 0.06, { ratio: 2, index: 1 }, 76); });
  S('land', (t) => { noise(t, 0.06, 0.18, { filter: 'lowpass', f0: 600, f1: 200 }); });
  S('swipe', (t) => { noise(t, 0.12, 0.3, { filter: 'bandpass', f0: 1800, f1: 5000, q: 1.5 }); });
  S('swipeBig', (t) => { noise(t, 0.16, 0.42, { filter: 'bandpass', f0: 900, f1: 4000, q: 1.2 }); tone('sawtooth', 160, 90, t, 0.1, 0.08); });
  S('hit', (t) => { noise(t, 0.08, 0.4, { filter: 'lowpass', f0: 3000, f1: 400 }); tone('square', 220, 110, t, 0.07, 0.12); });
  S('stomp', (t) => { tone('square', 180, 520, t, 0.08, 0.14); noise(t, 0.05, 0.25, { filter: 'lowpass', f0: 1500 }); });
  S('defeat', (t) => { tone('p25', 880, 1760, t, 0.06, 0.12); tone('p25', 1320, 2640, t + 0.06, 0.08, 0.1); noise(t, 0.1, 0.2, { filter: 'highpass', f0: 3000 }); });
  S('roll', (t) => { noise(t, 0.2, 0.22, { filter: 'bandpass', f0: 500, f1: 1400, q: 2 }); });
  S('rollstep', (t) => { noise(t, 0.04, 0.08, { filter: 'lowpass', f0: 800 }); });
  S('bump', (t) => { tone('square', 120, 80, t, 0.08, 0.16); });
  S('roarCub', (t) => {   // a determined little "mrrraow!"
    fmS(t, 69, 0.42, 0.2, { ratio: 1, index: 2.5, index1: 0.8 }, 74);
    tone('sawtooth', 300, 520, t, 0.18, 0.06, { vibrato: 18, depth: 30 }); tone('sawtooth', 520, 380, t + 0.18, 0.25, 0.06, { vibrato: 14, depth: 25 });
    noise(t, 0.3, 0.08, { filter: 'bandpass', f0: 1200, q: 2 });
  });
  S('roarBig', (t) => {   // the adult king's roar
    tone('sawtooth', 95, 70, t, 1.0, 0.3, { vibrato: 26, depth: 9 });
    tone('sawtooth', 142, 100, t, 0.9, 0.18, { vibrato: 22, depth: 12 });
    noise(t, 1.0, 0.45, { filter: 'lowpass', f0: 900, f1: 250, q: 3 });
    noise(t, 0.4, 0.2, { filter: 'bandpass', f0: 600, q: 4 });
  });
  S('roarEmpty', (t) => { tone('square', 200, 160, t, 0.06, 0.06); });
  S('hurt', (t) => { tone('square', 520, 200, t, 0.22, 0.16); fmS(t, 70, 0.2, 0.08, { ratio: 1.41, index: 3 }, 58); });
  S('die', (t) => { for (let i = 0; i < 6; i++) tone('p25', 660 - i * 70, 600 - i * 70, t + i * 0.09, 0.08, 0.12); });
  S('grab', (t) => { noise(t, 0.05, 0.16, { filter: 'bandpass', f0: 1200, q: 3 }); tone('triangle', 300, 420, t, 0.05, 0.1); });
  S('pull', (t) => { tone('triangle', 220, 440, t, 0.14, 0.12); });
  S('splash', (t) => { noise(t, 0.5, 0.4, { filter: 'lowpass', f0: 3000, f1: 300 }); noise(t + 0.05, 0.3, 0.2, { filter: 'highpass', f0: 3000 }); });
  S('splashSmall', (t) => { noise(t, 0.18, 0.12, { filter: 'bandpass', f0: 1800, f1: 600, q: 1 }); });
  S('leaf', (t) => { fmS(t, 88, 0.12, 0.09, 'bell'); fmS(t + 0.05, 95, 0.16, 0.08, 'bell'); });
  S('eat', (t) => { noise(t, 0.06, 0.25, { filter: 'bandpass', f0: 1500, q: 2 }); noise(t + 0.09, 0.06, 0.25, { filter: 'bandpass', f0: 1300, q: 2 }); fmS(t + 0.15, 84, 0.2, 0.09, 'bell'); });
  S('bug', (t) => { for (let i = 0; i < 4; i++) fmS(t + i * 0.05, 79 + i * 4, 0.12, 0.08, 'bell'); });
  S('oneup', (t) => { [72, 76, 79, 84, 79, 84].forEach((m, i) => fmS(t + i * 0.07, m, 0.14, 0.1, { ratio: 1, index: 1.2 })); });
  S('gem', (t) => { [84, 88, 91, 96, 100].forEach((m, i) => fmS(t + i * 0.06, m, 0.4, 0.08, 'bell')); });
  S('checkpoint', (t) => { [67, 71, 74, 79].forEach((m, i) => fmS(t + i * 0.08, m, 0.3, 0.1, 'marimba')); });
  S('boing', (t) => { tone('triangle', 160, 640, t, 0.22, 0.24, { vibrato: 30, depth: 40 }); });
  S('geyser', (t) => { noise(t, 1.0, 0.25, { filter: 'bandpass', f0: 600, f1: 2500, q: 0.7 }); });
  S('fireGeyser', (t) => { noise(t, 1.0, 0.35, { filter: 'lowpass', f0: 1200, f1: 400 }); tone('sawtooth', 70, 50, t, 0.8, 0.08); });
  S('crack', (t) => { noise(t, 0.05, 0.3, { filter: 'highpass', f0: 2000 }); noise(t + 0.08, 0.05, 0.25, { filter: 'highpass', f0: 2500 }); });
  S('rubble', (t) => { noise(t, 0.35, 0.45, { filter: 'lowpass', f0: 900, f1: 120 }); tone('square', 90, 50, t, 0.12, 0.14); });
  S('throw', (t) => { noise(t, 0.1, 0.18, { filter: 'bandpass', f0: 900, f1: 2200, q: 2 }); });
  S('hiss', (t) => { noise(t, 0.3, 0.16, { filter: 'highpass', f0: 4500 }); });
  S('growl', (t) => { tone('sawtooth', 110, 90, t, 0.3, 0.1, { vibrato: 30, depth: 8 }); });
  S('cackle', (t) => { for (let i = 0; i < 5; i++) fmS(t + i * 0.08, 76 - (i % 2) * 3, 0.07, 0.09, { ratio: 1.5, index: 2.5 }); });
  S('screech', (t) => { fmS(t, 88, 0.3, 0.09, { ratio: 1.33, index: 4 }, 81); });
  S('snort', (t) => { noise(t, 0.12, 0.3, { filter: 'bandpass', f0: 500, q: 2 }); noise(t + 0.16, 0.12, 0.3, { filter: 'bandpass', f0: 450, q: 2 }); });
  S('thud', (t) => { tone('sine', 120, 40, t, 0.3, 0.5); noise(t, 0.2, 0.3, { filter: 'lowpass', f0: 600 }); });
  S('flap', (t) => { noise(t, 0.06, 0.12, { filter: 'lowpass', f0: 1200 }); noise(t + 0.1, 0.06, 0.12, { filter: 'lowpass', f0: 1200 }); });
  S('hoot', (t) => { fmS(t, 67, 0.25, 0.08, { ratio: 1, index: 0.4 }, 65); fmS(t + 0.3, 67, 0.35, 0.08, { ratio: 1, index: 0.4 }, 64); });
  S('snap', (t) => { noise(t, 0.04, 0.5, { filter: 'highpass', f0: 1200 }); tone('square', 300, 100, t, 0.06, 0.12); });
  S('clink', (t) => { fmS(t, 96, 0.12, 0.1, { ratio: 3.7, index: 2 }); });
  S('deflect', (t) => { fmS(t, 91, 0.1, 0.1, { ratio: 2.5, index: 2 }); tone('p25', 900, 1600, t, 0.06, 0.08); });
  S('flip', (t) => { tone('square', 300, 600, t, 0.1, 0.12); tone('square', 600, 300, t + 0.1, 0.1, 0.1); });
  S('tally', (t) => { fmS(t, 84, 0.08, 0.1, 'marimba'); });
  S('move', (t) => { tone('p25', 880, 880, t, 0.04, 0.1); });
  S('select', (t) => { tone('p25', 660, 660, t, 0.05, 0.12); tone('p25', 990, 990, t + 0.06, 0.08, 0.12); });
  S('back', (t) => { tone('p25', 660, 440, t, 0.08, 0.1); });
  S('pause', (t) => { [76, 72, 79].forEach((m, i) => fmS(t + i * 0.06, m, 0.1, 0.1, { ratio: 2, index: 1 })); });
  S('rumble', (t) => { noise(t, 2.2, 0.35, { filter: 'lowpass', f0: 220, f1: 140 }); tone('sine', 45, 40, t, 2.1, 0.25); });
  S('bossHit', (t) => { noise(t, 0.2, 0.55, { filter: 'lowpass', f0: 2500, f1: 300 }); tone('square', 160, 60, t, 0.18, 0.2); fmS(t, 52, 0.25, 0.12, { ratio: 1.41, index: 4 }, 40); });
  S('bossDie', (t) => { for (let i = 0; i < 8; i++) { noise(t + i * 0.12, 0.3, 0.4, { filter: 'lowpass', f0: 1800 - i * 150, f1: 200 }); tone('square', 200 - i * 15, 60, t + i * 0.12, 0.15, 0.1); } });
  S('bossRoar', (t) => { tone('sawtooth', 80, 60, t, 1.2, 0.28, { vibrato: 20, depth: 10 }); noise(t, 1.2, 0.4, { filter: 'lowpass', f0: 700, f1: 200, q: 4 }); });
  S('quill', (t) => { noise(t, 0.06, 0.2, { filter: 'highpass', f0: 5000 }); });
  S('boulder', (t) => { noise(t, 0.6, 0.35, { filter: 'lowpass', f0: 160 }); });
  S('fire', (t) => { noise(t, 0.4, 0.22, { filter: 'bandpass', f0: 700, f1: 300, q: 0.8 }); });
  S('thunder', (t) => { noise(t, 2.5, 0.6, { filter: 'lowpass', f0: 500, f1: 60 }); noise(t, 0.2, 0.4, { filter: 'highpass', f0: 1500 }); });
  S('web', (t) => { noise(t, 0.2, 0.16, { filter: 'bandpass', f0: 2500, q: 5 }); });
  S('chime', (t) => { [79, 83, 86, 91].forEach((m, i) => fmS(t + i * 0.12, m, 0.8, 0.07, 'bell')); });
  S('text', (t) => { tone('p25', 1100, 1100, t, 0.02, 0.05); });
  S('catch', (t) => { fmS(t, 84, 0.1, 0.1, 'marimba'); fmS(t + 0.04, 91, 0.12, 0.09, 'marimba'); });
  S('miss', (t) => { tone('square', 200, 120, t, 0.12, 0.1); });

  return { compile, SONGS, PATCHES, midi, parseNote };
})();

// play a sound effect by name (quietly ignores names before audio unlocks)
function Sfx(name, opts) { if (LP.Audio.sounds[name]) LP.Audio.play(name, opts); }
