/* FONT — bold 8x8 arcade face (7x7 glyphs) + coloured access to Plumbing's 3x5 face.
   Glyphs are baked once per colour into a strip canvas, then blitted.
   Font.draw(ctx, str, x, y, color, { face: 'big'|'small', align, shadow, outline, scale })
   Font.width(str, face, scale)   Font.canvas(str, color, face) -> canvas */
'use strict';
const Font = (function () {
  // 7 rows of 7 columns; '#' = on. Row 8 and column 8 are the gap.
  const BIG = {
    A: '..###.. .##.##. ##...## ##...## ####### ##...## ##...##',
    B: '######. ##...## ##...## ######. ##...## ##...## ######.',
    C: '..####. .##..## ##..... ##..... ##..... .##..## ..####.',
    D: '#####.. ##..##. ##...## ##...## ##...## ##..##. #####..',
    E: '####### ##..... ##..... ######. ##..... ##..... #######',
    F: '####### ##..... ##..... ######. ##..... ##..... ##.....',
    G: '..##### .##.... ##..... ##..### ##...## .##..## ..#####',
    H: '##...## ##...## ##...## ####### ##...## ##...## ##...##',
    I: '.####.. ..##... ..##... ..##... ..##... ..##... .####..',
    J: '....### .....## .....## .....## ##...## ##...## .#####.',
    K: '##...## ##..##. ##.##.. ####... #####.. ##.###. ##..###',
    L: '##..... ##..... ##..... ##..... ##..... ##..... #######',
    M: '##...## ###.### ####### ####### ##.#.## ##...## ##...##',
    N: '##...## ###..## ####.## ####### ##.#### ##..### ##...##',
    O: '.#####. ##...## ##...## ##...## ##...## ##...## .#####.',
    P: '######. ##...## ##...## ##...## ######. ##..... ##.....',
    Q: '.#####. ##...## ##...## ##...## ##.#### ##..##. .####.#',
    R: '######. ##...## ##...## ##..### #####.. ##.###. ##..###',
    S: '.####.. ##..##. ##..... .#####. .....## ##...## .#####.',
    T: '######. ..##... ..##... ..##... ..##... ..##... ..##...',
    U: '##...## ##...## ##...## ##...## ##...## ##...## .#####.',
    V: '##...## ##...## ##...## ###.### .#####. ..###.. ...#...',
    W: '##...## ##...## ##.#.## ####### ####### ###.### ##...##',
    X: '##...## ###.### .#####. ..###.. .#####. ###.### ##...##',
    Y: '##..##. ##..##. ##..##. .####.. ..##... ..##... ..##...',
    Z: '####### ....### ...###. ..###.. .###... ###.... #######',
    0: '..###.. .#..##. ##...## ##...## ##...## .##..#. ..###..',
    1: '..##... .###... ..##... ..##... ..##... ..##... ######.',
    2: '.#####. ##...## ....### ..####. .####.. ###.... #######',
    3: '.###### ....##. ...##.. ..####. .....## ##...## .#####.',
    4: '...###. ..####. .##.##. ##..##. ####### ....##. ....##.',
    5: '######. ##..... ######. .....## .....## ##...## .#####.',
    6: '..####. .##.... ##..... ######. ##...## ##...## .#####.',
    7: '####### ##...## ....##. ...##.. ..##... ..##... ..##...',
    8: '.####.. ##...#. ###..#. .####.. #..#### #....## .#####.',
    9: '.#####. ##...## ##...## .###### .....## ....##. .####..',
    '.': '....... ....... ....... ....... ....... ..##... ..##...',
    ',': '....... ....... ....... ....... ..##... ..##... .##....',
    '!': '..##... ..##... ..##... ..##... ..##... ....... ..##...',
    '?': '.#####. ##...## ....### ...###. ..##... ....... ..##...',
    '-': '....... ....... ....... ######. ....... ....... .......',
    ':': '....... ..##... ..##... ....... ..##... ..##... .......',
    "'": '..##... ..##... .##.... ....... ....... ....... .......',
    '"': '##.##.. ##.##.. .#..#.. ....... ....... ....... .......',
    '/': '.....## ....##. ...##.. ..##... .##.... ##..... .......',
    '(': '...##.. ..##... .##.... .##.... .##.... ..##... ...##..',
    ')': '.##.... ..##... ...##.. ...##.. ...##.. ..##... .##....',
    '=': '....... ....... ######. ....... ######. ....... .......',
    '+': '....... ..##... ..##... ######. ..##... ..##... .......',
    '*': '...#... ...#... ####### .#####. ..###.. .##.##. .#...#.',
    '<': '....##. ...##.. ..##... .##.... ..##... ...##.. ....##.',
    '>': '.##.... ..##... ...##.. ....##. ...##.. ..##... .##....',
    '%': '##...## ##..##. ...##.. ..##... .##.... ##..##. #...##.',
    '#': '.##.##. ####### .##.##. .##.##. .##.##. ####### .##.##.',
    '@': '.#####. ##...## ##.#### ##.#.## ##.#### ##..... .#####.',   // used as a "clock" icon
    '~': '....... ....... .###..# ##.#### #..###. ....... .......',
    '_': '....... ....... ....... ....... ....... ....... #######',
    ' ': '....... ....... ....... ....... ....... ....... .......'
  };
  const SMALL = LP.LCD.FONT;      // Plumbing's 3x5 table (rows of 3-bit masks)
  const FACES = {
    big: { cell: 8, h: 8, glyphs: BIG },
    small: { cell: 4, h: 6, glyphs: SMALL }
  };
  const order = {}, cache = {};
  for (const f in FACES) order[f] = Object.keys(FACES[f].glyphs);

  function bake(face, color) {
    const key = face + color;
    if (cache[key]) return cache[key];
    const F = FACES[face], keys = order[face];
    const c = document.createElement('canvas');
    c.width = keys.length * F.cell; c.height = F.h;
    const g = c.getContext('2d');
    g.fillStyle = color;
    keys.forEach((ch, i) => {
      const x0 = i * F.cell;
      if (face === 'big') {
        const rows = F.glyphs[ch].split(' ');
        rows.forEach((row, y) => { for (let x = 0; x < row.length && x < 7; x++) if (row[x] === '#') g.fillRect(x0 + x, y, 1, 1); });
      } else {
        const g5 = F.glyphs[ch];
        for (let r = 0; r < 5; r++) { const bits = +g5[r]; for (let col = 0; col < 3; col++) if (bits & (4 >> col)) g.fillRect(x0 + col, r, 1, 1); }
      }
    });
    const idx = {};
    keys.forEach((ch, i) => { idx[ch] = i; });
    return (cache[key] = { c, idx, F });
  }

  const Font = {
    width(str, face, scale) {
      const F = FACES[face || 'big'], s = scale || 1, n = String(str).length;
      return n ? (n * F.cell - 1) * s : 0;
    },
    height(face, scale) { return (face === 'small' ? 5 : 7) * (scale || 1); },

    // o: { face, align: 'left'|'center'|'right', shadow: color, outline: color, scale }
    draw(ctx, str, x, y, color, o) {
      o = o || {};
      const face = o.face || 'big', s = o.scale || 1;
      str = String(str).toUpperCase();
      x = Math.round(x); y = Math.round(y);
      const w = Font.width(str, face, s);
      if (o.align === 'center') x = Math.round(x - w / 2);
      else if (o.align === 'right') x -= w;
      if (o.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) run(ctx, str, x + dx * s, y + dy * s, o.outline, face, s);
      if (o.shadow) run(ctx, str, x + s, y + s, o.shadow, face, s);
      run(ctx, str, x, y, color, face, s);
      return w;
    },

    // a standalone canvas of the text (for drawing at other resolutions, e.g. over title art)
    canvas(str, color, face) {
      face = face || 'big';
      str = String(str).toUpperCase();
      const c = document.createElement('canvas');
      c.width = Math.max(1, Font.width(str, face)); c.height = FACES[face].h;
      run(c.getContext('2d'), str, 0, 0, color, face, 1);
      return c;
    }
  };

  function run(ctx, str, x, y, color, face, s) {
    const b = bake(face, color), cell = b.F.cell, h = b.F.h;
    for (const ch of str) {
      const i = b.idx[ch];
      if (i !== undefined && ch !== ' ') ctx.drawImage(b.c, i * cell, 0, cell, h, x, y, cell * s, h * s);
      x += cell * s;
    }
  }

  return Font;
})();
