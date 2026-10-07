/* WAVES — pure data + the difficulty curve. No final level: every cleared wave makes
   a harder one. Every 5th wave is THE GREAT SLOTHERSHIP; the 3rd of every five is a
   SPECIAL WAVE. Formation layouts: C commander, A attack, S spacewalk, U ufo, M mini. */
'use strict';
const Waves = {
  LAYOUTS: [
    { name: 'PARADE', rows: [
      'AAAAAAAAAA',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'UUUUUUUUUU',
      'UUUUUUUUUU'] },
    { name: 'COMMAND', rows: [
      '...C..C...',
      'AAAAAAAAAA',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'UUUUUUUUUU',
      'UUUUUUUUUU'] },
    { name: 'WEDGE', rows: [
      'C...AA...C',
      'AA.AAAA.AA',
      'SSSSSSSSSS',
      '.SSSSSSSS.',
      '..UUUUUU..',
      '...UUUU...'] },
    { name: 'CHECKERS', rows: [
      '.C.A.A.C..',
      'A.A.A.A.A.',
      '.S.S.S.S.S',
      'S.S.S.S.S.',
      '.U.U.U.U.U',
      'U.U.U.U.U.'] },
    { name: 'FORTRESS', rows: [
      'CAAAAAAAAC',
      'AS.SSSS.SA',
      'ASSSSSSSSA',
      'UUUUUUUUUU',
      'UUUUUUUUUU'] },
    { name: 'TWIN TOWERS', rows: [
      'CAAA..AAAC',
      'SSSS..SSSS',
      'SSSS..SSSS',
      'UUUU..UUUU',
      'UUUU..UUUU',
      'UUUU..UUUU'] },
    { name: 'ARROWHEAD', rows: [
      '....CC....',
      '...AAAA...',
      '..AASSAA..',
      '.SSSSSSSS.',
      'UUUUUUUUUU',
      'UU.UUUU.UU'] }
  ],
  SWARM: { name: 'SWARM', cols: 13, rows: [
    'MMMMMMMMMMMMM',
    'MMMMMMMMMMMMM',
    'MMMMMMMMMMMMM',
    'MMMMMMMMMMMMM',
    'MMMMMMMMMMMMM',
    'MMMMMMMMMMMMM'] },

  SPECIALS: [
    { id: 'nap', name: 'SPACE NAP', blurb: ['SOME OF THEM HAVE', 'FALLEN ASLEEP.', 'DO NOT WAKE THEM.'] },
    { id: 'swarm', name: 'SLOTH SWARM', blurb: ['SMALLER. WEAKER.', 'SO. MANY. SLOTHS.'] },
    { id: 'low', name: 'LOW ORBIT', blurb: ['THEY ARE ALREADY', 'DANGEROUSLY CLOSE.'] },
    { id: 'hyper', name: 'HYPER SLOTHS', blurb: ['SOMEBODY GAVE', 'THEM COFFEE.'] },
    { id: 'revenge', name: 'REVENGE OF THE SLOTHS', blurb: ['THEY REMEMBER', 'EVERY SINGLE ONE.'] }
  ],

  kind(w) { return w % 5 === 0 ? 'boss' : w % 5 === 3 ? 'special' : 'normal'; },

  // everything one wave needs, from its number alone
  def(w) {
    const kind = Waves.kind(w), k = w - 1;
    const d = {
      w, kind, special: null, name: 'WAVE ' + w,
      stepBase: Math.max(14, 48 - 3 * k),            // frames per formation step with everyone alive
      lower: [0, 4, 8, 12, 14, 16, 18, 20][Math.min(k, 7)],   // formations start lower each wave (to a limit)
      fireEvery: Math.max(0.3, 1.45 * Math.pow(0.9, k)),
      maxBullets: Math.min(7, 2 + Math.floor(w / 2)),
      bulletSpeed: Math.min(2.7, 1.35 + 0.09 * k),
      aimed: Math.min(0.7, 0.2 + 0.06 * k),
      comedy: w >= 3 ? 0.035 : 0,                    // ordinary sloths occasionally lob something silly
      cmdEvery: Math.max(2.6, 7 - 0.3 * k),            // commanders' own unusual projectiles
      diveEvery: w >= 4 ? Math.max(3.2, 13 - (w - 4) * 1.1) : 0,
      barrierDamage: w >= 6 ? Math.min(0.35, 0.05 * (w - 5)) : 0,
      pickups: w >= 2,
      sleepers: 0, hyper: false,
      layout: null
    };
    // normal formations cycle (wave 1 is always PARADE)
    const normalIdx = (w - 1) - Math.floor((w - 1) / 5) - Math.floor((w + 1) / 5);   // normal waves before this one
    d.layout = Waves.LAYOUTS[Math.max(0, normalIdx) % Waves.LAYOUTS.length];
    if (kind === 'special') {
      const sp = Waves.SPECIALS[Math.floor(w / 5) % Waves.SPECIALS.length];
      d.special = sp; d.name = sp.name;
      if (sp.id === 'nap') { d.sleepers = 0.4; }
      if (sp.id === 'swarm') { d.layout = Waves.SWARM; d.lower = Math.max(0, d.lower - 12); d.fireEvery *= 0.85; d.maxBullets += 1; }
      if (sp.id === 'low') { d.lower += 30; d.stepBase += 6; }
      if (sp.id === 'hyper') { d.stepBase = Math.max(7, Math.round(d.stepBase * 0.33)); d.hyper = true; d.comedy = 0.08; }
      if (sp.id === 'revenge') { d.fireEvery *= 0.5; d.maxBullets += 3; d.aimed = 0.85; d.comedy = 0.12; d.cmdEvery *= 0.6; }
    }
    if (kind === 'boss') { d.level = w / 5; d.name = 'THE GREAT SLOTHERSHIP'; }
    return d;
  }
};
