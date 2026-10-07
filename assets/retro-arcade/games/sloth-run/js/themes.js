/* THEMES — the ten stages of the road trip, as pure data, plus the route pyramid.

   Route pyramid (left fork = gentler, right fork = tougher):
       leg 1            COCONUT COAST
       leg 2       PALM BEACH     CACTUS CANYON
       leg 3   SUNSET STRIP   REDWOOD RUN   SUMMIT PASS
       leg 4  NEON NIGHTS  TIKI TROPICS  MOONLIGHT MARINA  AURORA PASS      (each one a different ending)

   Stage fields
     colors   road / rumble / lane / grass / water (shore) / fog
     bg       sky gradient, sun / moon / stars / aurora / clouds, far + near parallax layers
     shore    { side: -1 left | 1 right, near, far } water beyond that many road half-widths
     decor    roadside rules: { s: sprites, side: 'L' | 'R' | 'B', every, chance, off: [min, max], rows }
     road     { len: segments, curve: max bend, curvy: 0..1, hilly: 0..1, hill: max height }
     traffic  { n: cars kept on the road ahead, kinds, slow, fast }    lanes: lanes per road
     time     seconds added at this stage's checkpoint (stage 1: the starting clock)
     tint     colour wash for the roadside sprites (sunset / night)
   ============================================================================ */
'use strict';
const STAGES = [
  // ------------------------------------------------------------------ 0  COCONUT COAST
  {
    id: 0, name: 'COCONUT COAST', short: 'COCONUT COAST', leg: 0, col: 0, blurb: 'Sun, sea, and a sloth with nowhere to be.',
    colors: { road: '#6c6c78', road2: '#656571', rumble: ['#e8283a', '#f4f4f4'], lane: '#f4f4f4', grass: ['#e8d08c', '#dcc27a'], water: ['#1e7ad8', '#2a8ae6'], foam: '#e8f6ff', fog: '#c4e8ff' },
    bg: {
      sky: [[0, '#1650d0'], [0.55, '#4aa0ff'], [1, '#c4ecff']],
      sun: { x: 560, y: 34, r: 16, color: '#fffbe0', color2: '#fff0a0', glow: '#fff6c0', glowTo: '#7ac0ff' },
      clouds: { color: '#ffffff', shade: '#c8dcf8', n: 6, y: [18, 70], seed: 3 },
      far: { kind: 'coast', cols: ['#8a94d0', '#6070b4'], h: 52, seed: 2, city: '#7480b8' }
    },
    shore: { side: -1, near: 2.0, far: 3.8 },
    decor: [
      { s: ['palm0', 'palm1', 'palm2'], side: 'R', every: 9, off: [1.35, 1.9] },
      { s: ['palm0', 'palm2', 'palmTall'], side: 'L', chance: 0.06, off: [1.4, 2.0] },
      { s: ['umbrella', 'umbrella2', 'umbrella3'], side: 'L', chance: 0.08, off: [1.6, 2.4] },
      { s: ['lifeguard', 'surfRack'], side: 'L', chance: 0.012, off: [1.7, 2.2] },
      { s: ['bush', 'flowerBush'], side: 'R', chance: 0.12, off: [1.3, 3.5] },
      { s: ['rock'], side: 'R', chance: 0.02, off: [1.6, 3] },
      { s: ['billHang', 'billSlow', 'billFM'], side: 'R', chance: 0.008, off: [2.0, 2.4] },
      { s: ['sailboat', 'buoy'], side: 'L', chance: 0.02, off: [6, 14], water: true }
    ],
    road: { len: 2700, curve: 4, curvy: 0.45, hilly: 0.2, hill: 30 },
    traffic: { n: 10, kinds: ['bug', 'cabrio', 'van', 'wagon', 'pickup', 'coupe'], slow: 0.3, fast: 0.55 },
    lanes: 3, time: 75, song: 'drive'
  },
  // ------------------------------------------------------------------ 1  PALM BEACH BLVD
  {
    id: 1, name: 'PALM BEACH BLVD', short: 'PALM BEACH', leg: 1, col: 0, blurb: 'Golden hour on the boulevard.',
    colors: { road: '#5e5e6c', road2: '#585866', rumble: ['#ffd23c', '#f4f4f4'], lane: '#fff4c8', grass: ['#5ab84a', '#4eac40'], water: ['#2a8ad8', '#3a9ae4'], foam: '#fff4dc', sand: '#f0d896', fog: '#ffdcb0' },
    bg: {
      sky: [[0, '#3050c8'], [0.5, '#8aa0e8'], [0.85, '#ffc898'], [1, '#ffe0b0']],
      sun: { x: 300, y: 58, r: 22, color: '#fffbe0', color2: '#ffd080', glow: '#ffd8a0', glowTo: '#ffb070' },
      clouds: { color: '#ffe8d8', shade: '#f0a890', n: 5, y: [24, 64], seed: 9 },
      far: { kind: 'coast', cols: ['#b088b8', '#8a6aa0'], h: 46, seed: 6 }
    },
    shore: { side: 1, near: 2.3, far: 4.5 },
    decor: [
      { s: ['palmTall', 'palm0'], side: 'B', every: 6, off: [1.3, 1.35] },
      { s: ['hibiscus', 'flowerBush'], side: 'L', chance: 0.15, off: [1.6, 3.5] },
      { s: ['umbrella', 'umbrella2', 'umbrella3', 'flamingo'], side: 'R', chance: 0.1, off: [1.7, 2.6] },
      { s: ['beachHut', 'lifeguard', 'surfRack'], side: 'R', chance: 0.012, off: [2.0, 2.4] },
      { s: ['tower2', 'tower3'], side: 'L', chance: 0.012, off: [3.0, 3.6] },
      { s: ['billHang', 'billSun', 'billNap'], side: 'L', chance: 0.01, off: [2.0, 2.4] },
      { s: ['sailboat'], side: 'R', chance: 0.015, off: [7, 15], water: true }
    ],
    road: { len: 2900, curve: 4, curvy: 0.5, hilly: 0.25, hill: 35 },
    traffic: { n: 14, kinds: ['bug', 'cabrio', 'van', 'coupe', 'wagon', 'bus'], slow: 0.3, fast: 0.55 },
    lanes: 3, time: 64, song: 'drive', tint: { color: '#ffb070', amount: 0.12 }
  },
  // ------------------------------------------------------------------ 2  CACTUS CANYON
  {
    id: 2, name: 'CACTUS CANYON', short: 'CACTUS CANYON', leg: 1, col: 1, blurb: 'Big sky, bigger hills, zero shade.',
    colors: { road: '#5a5a64', road2: '#54545e', rumble: ['#e8283a', '#f4f4f4'], lane: '#f4f0d8', grass: ['#e8b474', '#dca666'], fog: '#ffe2b0' },
    bg: {
      sky: [[0, '#2a70e0'], [0.6, '#7ab8f8'], [1, '#ffe4b0']],
      sun: { x: 180, y: 26, r: 14, color: '#ffffff', color2: '#fff8d0', glow: '#fffbe0', glowTo: '#9ad0ff' },
      clouds: { color: '#ffffff', shade: '#d8e8f8', n: 3, y: [16, 40], seed: 21 },
      far: { kind: 'mesas', cols: ['#d89a6a', '#c8643a', '#9a4426'], h: 64, seed: 3 },
      near: { kind: 'dunes', cols: ['#e8b070', '#f8d498'], h: 22, seed: 8 }
    },
    decor: [
      { s: ['cactus', 'cactus2'], side: 'B', chance: 0.1, off: [1.4, 4] },
      { s: ['desertBush'], side: 'B', chance: 0.12, off: [1.3, 4] },
      { s: ['redRock', 'rock'], side: 'B', chance: 0.025, off: [1.8, 4] },
      { s: ['tumbleweed'], side: 'B', chance: 0.02, off: [1.2, 2.5] },
      { s: ['windmill'], side: 'L', chance: 0.006, off: [2.6, 3.4] },
      { s: ['gasStation'], side: 'R', chance: 0.003, off: [2.6, 2.8] },
      { s: ['billFast', 'billLeaf', 'billNap'], side: 'B', chance: 0.008, off: [2.0, 2.4] },
      { s: ['post'], side: 'B', every: 8, off: [1.18, 1.18], curvesOnly: true }
    ],
    road: { len: 3100, curve: 5, curvy: 0.45, hilly: 0.8, hill: 70 },
    traffic: { n: 14, kinds: ['truck', 'pickup', 'wagon', 'bug', 'van', 'bus'], slow: 0.32, fast: 0.6 },
    lanes: 3, time: 68, song: 'drive'
  },
  // ------------------------------------------------------------------ 3  SUNSET STRIP
  {
    id: 3, name: 'SUNSET STRIP', short: 'SUNSET STRIP', leg: 2, col: 0, blurb: 'The city glows pink. So does the sloth.',
    colors: { road: '#4e4458', road2: '#494052', rumble: ['#ff4fd0', '#f4e8f4'], lane: '#ffe0f0', grass: ['#6a7a3a', '#627234'], fog: '#ff9a7a' },
    bg: {
      sky: [[0, '#2a1060'], [0.35, '#8a2a8a'], [0.7, '#ff5a7a'], [0.9, '#ff9a5a'], [1, '#ffd078']],
      sun: { x: 420, y: 90, r: 34, color: '#ffe86a', color2: '#ff3c8a', glow: '#ff7a8a', glowTo: '#ffb070', stripes: true },
      clouds: { color: '#ff9ac0', shade: '#a04a90', hi: '#ffd0e0', n: 5, y: [22, 60], seed: 4 },
      far: { kind: 'skyline', cols: ['#7a3a8a', '#5a2a74'], lit: '#ffc88a', h: 70, seed: 5 },
      near: { kind: 'palms', cols: ['#3a1a4a', '#2a1038'], h: 40, seed: 3 }
    },
    decor: [
      { s: ['palm0', 'palmTall'], side: 'B', every: 7, off: [1.3, 1.4] },
      { s: ['tower1', 'tower2', 'tower3', 'tower4'], side: 'B', chance: 0.05, off: [2.6, 3.8] },
      { s: ['lamp'], side: 'B', every: 14, off: [1.2, 1.2] },
      { s: ['neonMotel', 'neonDiner', 'neonOpen'], side: 'B', chance: 0.012, off: [1.8, 2.2] },
      { s: ['billHang', 'billSun', 'billFM', 'billSlow'], side: 'B', chance: 0.012, off: [2.0, 2.4] },
      { s: ['hibiscus'], side: 'B', chance: 0.06, off: [1.5, 2.4] }
    ],
    road: { len: 3100, curve: 4, curvy: 0.55, hilly: 0.25, hill: 35 },
    traffic: { n: 18, kinds: ['coupe', 'cabrio', 'bug', 'van', 'bus', 'wagon'], slow: 0.32, fast: 0.6 },
    lanes: 4, time: 66, song: 'drive', tint: { color: '#ff6a5a', amount: 0.22 }
  },
  // ------------------------------------------------------------------ 4  REDWOOD RUN
  {
    id: 4, name: 'REDWOOD RUN', short: 'REDWOOD RUN', leg: 2, col: 1, blurb: 'Giant trees. Tiny sloth. Massive vibes.',
    colors: { road: '#5a5e62', road2: '#54585c', rumble: ['#f4f4f4', '#3a8a3a'], lane: '#f4f4e0', grass: ['#3a8c3c', '#348236'], fog: '#cae4da' },
    bg: {
      sky: [[0, '#5aa0e0'], [0.6, '#a0d0ec'], [1, '#e0f4ec']],
      sun: { x: 640, y: 30, r: 15, color: '#fffbe8', color2: '#fff8d0', glow: '#ffffff', glowTo: '#b0d8f0' },
      clouds: { color: '#ffffff', shade: '#c0d8e0', n: 7, y: [12, 56], seed: 11 },
      far: { kind: 'mountains', cols: ['#7aa4b8', '#5a8a98'], h: 60, seed: 7 },
      near: { kind: 'treeline', cols: ['#2a6a44', '#1e5634'], h: 46, seed: 4 }
    },
    decor: [
      { s: ['redwood'], side: 'B', chance: 0.1, off: [1.6, 3.5] },
      { s: ['pine', 'pine2'], side: 'B', chance: 0.1, off: [1.5, 4] },
      { s: ['fern', 'bush'], side: 'B', chance: 0.2, off: [1.25, 3] },
      { s: ['log', 'rock'], side: 'B', chance: 0.02, off: [1.5, 2.6] },
      { s: ['cabin'], side: 'B', chance: 0.004, off: [2.6, 3.0] },
      { s: ['billLeaf', 'billNap'], side: 'B', chance: 0.005, off: [2.0, 2.4] }
    ],
    road: { len: 3100, curve: 5, curvy: 0.75, hilly: 0.55, hill: 50 },
    traffic: { n: 14, kinds: ['pickup', 'wagon', 'van', 'bug', 'truck', 'cabrio'], slow: 0.3, fast: 0.55 },
    lanes: 3, time: 68, song: 'drive'
  },
  // ------------------------------------------------------------------ 5  SUMMIT PASS
  {
    id: 5, name: 'SUMMIT PASS', short: 'SUMMIT PASS', leg: 2, col: 2, blurb: 'Switchbacks all the way to the clouds.',
    colors: { road: '#60606c', road2: '#5a5a66', rumble: ['#e8283a', '#f4f4f4'], lane: '#f4f4f4', grass: ['#5c9c4a', '#529244'], fog: '#c8dcff' },
    bg: {
      sky: [[0, '#1838c0'], [0.6, '#5a88f0'], [1, '#bcd4ff']],
      sun: { x: 120, y: 30, r: 15, color: '#ffffff', color2: '#fffbe0', glow: '#ffffff', glowTo: '#8ab0ff' },
      clouds: { color: '#ffffff', shade: '#b8c8f0', n: 5, y: [16, 50], seed: 13 },
      far: { kind: 'peaks', cols: ['#9aa6d8', '#6a78b0'], snow: '#ffffff', h: 84, seed: 9 },
      near: { kind: 'hills', cols: ['#3a7a44', '#4a8a50'], trees: '#245a30', h: 30, seed: 12 }
    },
    decor: [
      { s: ['pine', 'pine2', 'snowPine'], side: 'B', chance: 0.12, off: [1.5, 4] },
      { s: ['rock', 'snowRock'], side: 'B', chance: 0.04, off: [1.5, 3.5] },
      { s: ['post'], side: 'B', every: 5, off: [1.18, 1.18], curvesOnly: true },
      { s: ['chalet'], side: 'B', chance: 0.004, off: [2.6, 3.0] },
      { s: ['bush'], side: 'B', chance: 0.06, off: [1.4, 3] },
      { s: ['billSun', 'billFast'], side: 'B', chance: 0.005, off: [2.0, 2.4] }
    ],
    road: { len: 3200, curve: 6, curvy: 0.9, hilly: 0.8, hill: 65 },
    traffic: { n: 14, kinds: ['truck', 'bus', 'pickup', 'wagon', 'coupe', 'van'], slow: 0.3, fast: 0.55 },
    lanes: 3, time: 70, song: 'drive'
  },
  // ------------------------------------------------------------------ 6  NEON NIGHTS
  {
    id: 6, name: 'NEON NIGHTS', short: 'NEON NIGHTS', leg: 3, col: 0, night: true, blurb: 'The city never sleeps. The sloth might.',
    ending: ['THE SLOTH ROLLS UP TO CLUB CHILL,', 'GETS THE BEST PARKING SPOT IN TOWN,', 'AND FALLS ASLEEP AT THE VALET STAND.', 'LEGEND.'],
    colors: { road: '#2c2a3c', road2: '#282638', rumble: ['#ff4fd0', '#3cf0ff'], lane: '#ffe14a', grass: ['#1c1a30', '#1a182c'], fog: '#3a1a5a' },
    bg: {
      sky: [[0, '#04020e'], [0.5, '#1a0a3a'], [0.85, '#5a1a7a'], [1, '#c03a9a']],
      stars: 140,
      moon: { x: 180, y: 34, r: 12, color: '#fff4e0', glow: '#a080ff' },
      far: { kind: 'skyline', cols: ['#2a1a4a', '#1a1032'], lit: '#ffd08a', neon: ['#ff4fd0', '#3cf0ff', '#ffe14a'], h: 84, seed: 8 },
      near: { kind: 'city', cols: ['#140c26', '#100820'], lit: '#ffe08a', lit2: '#ff4fd0', h: 50, seed: 9 }
    },
    decor: [
      { s: ['nightTower1', 'nightTower2', 'nightTower3'], side: 'B', chance: 0.06, off: [2.6, 3.8] },
      { s: ['lampLit'], side: 'B', every: 10, off: [1.2, 1.2] },
      { s: ['palmNeonPink', 'palmNeonCyan'], side: 'B', every: 9, off: [1.45, 1.6] },
      { s: ['neonMotel', 'neonDiner', 'neonChill', 'neonZzz', 'neonDisco', 'neonOpen'], side: 'B', chance: 0.03, off: [1.8, 2.3] },
      { s: ['billHang', 'billNap', 'billFM'], side: 'B', chance: 0.008, off: [2.0, 2.4] }
    ],
    road: { len: 3300, curve: 4, curvy: 0.6, hilly: 0.3, hill: 35 },
    traffic: { n: 20, kinds: ['coupe', 'cabrio', 'bug', 'van', 'bus', 'wagon', 'truck'], slow: 0.32, fast: 0.6 },
    lanes: 4, time: 75, song: 'drive', tint: { color: '#3a2a8a', amount: 0.6, night: true }, headlights: true
  },
  // ------------------------------------------------------------------ 7  TIKI TROPICS
  {
    id: 7, name: 'TIKI TROPICS', short: 'TIKI TROPICS', leg: 3, col: 1, blurb: 'A volcano, a lagoon, and a lot of torches.',
    ending: ['A HAMMOCK. A COCONUT. A VOLCANO', 'POLITELY RUMBLING IN THE DISTANCE.', 'THE SLOTH WILL NOT BE MOVING', 'UNTIL ABOUT 1987.'],
    colors: { road: '#54485a', road2: '#4e4254', rumble: ['#ffb43c', '#f4f0e0'], lane: '#fff0c8', grass: ['#2a8a46', '#268040'], water: ['#1a7aa8', '#2088b4'], foam: '#d8fff4', sand: '#e8c890', fog: '#ff9a7a' },
    bg: {
      sky: [[0, '#2a1458'], [0.4, '#8a2a7a'], [0.75, '#ff5a5a'], [1, '#ffb45a']],
      sun: { x: 240, y: 92, r: 30, color: '#ffe060', color2: '#ff5a3c', glow: '#ff8a5a', glowTo: '#ff5a7a', stripes: true },
      clouds: { color: '#ff8ab0', shade: '#8a2a6a', hi: '#ffc0d8', n: 6, y: [20, 66], seed: 17 },
      far: { kind: 'volcano', cols: ['#6a3a7a', '#4a2a5a', '#3a1e48'], vx: 560, smoke: '#d890b0', h: 80, seed: 10 },
      near: { kind: 'jungle', cols: ['#1e4a34', '#2a5e40'], trees: '#163a28', h: 34, seed: 14 }
    },
    shore: { side: -1, near: 3.0, far: 6.0 },
    decor: [
      { s: ['palm0', 'palm1', 'palm2', 'palmTall'], side: 'B', chance: 0.1, off: [1.4, 3] },
      { s: ['monstera', 'hibiscus', 'fern'], side: 'R', chance: 0.2, off: [1.3, 3] },
      { s: ['tikiTorch'], side: 'B', every: 8, off: [1.22, 1.22] },
      { s: ['tiki'], side: 'R', chance: 0.012, off: [1.6, 2.2] },
      { s: ['lavaRock'], side: 'R', chance: 0.03, off: [1.6, 3.5] },
      { s: ['beachHut', 'umbrella', 'flamingo'], side: 'L', chance: 0.02, off: [1.7, 2.3] },
      { s: ['billHang', 'billSun'], side: 'R', chance: 0.006, off: [2.0, 2.4] },
      { s: ['sailboat'], side: 'L', chance: 0.01, off: [7, 14], water: true }
    ],
    road: { len: 3300, curve: 5, curvy: 0.7, hilly: 0.5, hill: 50 },
    traffic: { n: 17, kinds: ['cabrio', 'van', 'bug', 'pickup', 'bus', 'coupe'], slow: 0.32, fast: 0.6 },
    lanes: 3, time: 77, song: 'drive', tint: { color: '#ff6a5a', amount: 0.2 }
  },
  // ------------------------------------------------------------------ 8  MOONLIGHT MARINA
  {
    id: 8, name: 'MOONLIGHT MARINA', short: 'MOONLIGHT MARINA', leg: 3, col: 2, night: true, blurb: 'Bay lights, moonbeams, and fast curves.',
    ending: ['THE MOON RISES OVER THE BAY.', 'A YACHT CLUB OFFERS MEMBERSHIP.', 'THE SLOTH IS TOO COOL TO ANSWER.', 'IT IS ALREADY NAPTIME.'],
    colors: { road: '#3a3a4e', road2: '#363648', rumble: ['#3cf0ff', '#e8eef8'], lane: '#e8eef8', grass: ['#4a4a6a', '#444462'], water: ['#0c2c62', '#10346e'], foam: '#a8c8ff', fog: '#1a2a5a' },
    bg: {
      sky: [[0, '#020616'], [0.55, '#0a1a4a'], [1, '#2a4a8a']],
      stars: 180,
      moon: { x: 470, y: 46, r: 22, color: '#fffbe8', glow: '#8ab0ff' },
      far: { kind: 'coast', cols: ['#1c2850', '#141c3c'], h: 46, seed: 14, city: '#2a3460' },
      near: null
    },
    shore: { side: -1, near: 2.8, far: 6.0 },
    decor: [
      { s: ['palm0', 'palm2'], side: 'R', every: 10, off: [1.35, 1.6] },
      { s: ['lampLit'], side: 'L', every: 12, off: [1.2, 1.2] },
      { s: ['neonDiner', 'neonMotel', 'neonChill'], side: 'R', chance: 0.015, off: [1.8, 2.3] },
      { s: ['nightTower2', 'nightTower3'], side: 'R', chance: 0.03, off: [2.8, 3.8] },
      { s: ['rock', 'bush'], side: 'R', chance: 0.05, off: [1.5, 3] },
      { s: ['post'], side: 'L', every: 6, off: [1.18, 1.18], curvesOnly: true },
      { s: ['sailboat', 'buoy'], side: 'L', chance: 0.03, off: [6, 14], water: true }
    ],
    road: { len: 3300, curve: 6, curvy: 0.8, hilly: 0.45, hill: 45 },
    traffic: { n: 17, kinds: ['coupe', 'cabrio', 'van', 'wagon', 'bug', 'truck'], slow: 0.32, fast: 0.6 },
    lanes: 3, time: 77, song: 'drive', tint: { color: '#2a3a8a', amount: 0.55, night: true }, headlights: true
  },
  // ------------------------------------------------------------------ 9  AURORA PASS
  {
    id: 9, name: 'AURORA PASS', short: 'AURORA PASS', leg: 3, col: 3, night: true, blurb: 'Snow, switchbacks, and the northern lights.',
    ending: ['THE NORTHERN LIGHTS PUT ON A SHOW.', 'THE SLOTH GIVES THEM A SLOW,', 'APPRECIATIVE THUMBS UP.', 'IT TAKES ABOUT TEN MINUTES.'],
    colors: { road: '#4a4a5c', road2: '#454556', rumble: ['#e8283a', '#f4f4f4'], lane: '#f4f4f4', grass: ['#c4d0e8', '#b8c6e0'], fog: '#2a3a6a' },
    bg: {
      sky: [[0, '#02040e'], [0.5, '#0a1636'], [1, '#1e3a62']],
      stars: 200, aurora: true,
      far: { kind: 'peaks', cols: ['#2a3a62', '#1c2a4c'], snow: '#c8d8f4', h: 86, seed: 15 },
      near: { kind: 'treeline', cols: ['#0e2a2a', '#0a2222'], snow: '#c8d8f0', h: 40, seed: 16 }
    },
    decor: [
      { s: ['darkPine', 'snowPine'], side: 'B', chance: 0.16, off: [1.45, 4] },
      { s: ['snowbank'], side: 'B', chance: 0.12, off: [1.2, 2] },
      { s: ['snowRock'], side: 'B', chance: 0.03, off: [1.6, 3.5] },
      { s: ['post'], side: 'B', every: 5, off: [1.18, 1.18], curvesOnly: true },
      { s: ['lampLit'], side: 'B', chance: 0.01, off: [1.25, 1.25] },
      { s: ['chalet', 'cabin'], side: 'B', chance: 0.005, off: [2.6, 3.0] }
    ],
    road: { len: 3400, curve: 6, curvy: 0.95, hilly: 0.85, hill: 65 },
    traffic: { n: 14, kinds: ['truck', 'wagon', 'pickup', 'van', 'bus', 'bug'], slow: 0.3, fast: 0.55 },
    lanes: 3, time: 80, song: 'drive', tint: { color: '#3a4a9a', amount: 0.5, night: true }, headlights: true
  }
];

// the pyramid: leg -> stage ids, left to right
const ROUTE = [[0], [1, 2], [3, 4, 5], [6, 7, 8, 9]];
const Route = {
  legs: ROUTE.length,
  // the two choices offered at the end of a stage (null on the last leg)
  next(id) {
    const s = STAGES[id];
    if (s.leg >= ROUTE.length - 1) return null;
    const row = ROUTE[s.leg + 1];
    return [STAGES[row[s.col]], STAGES[row[s.col + 1]]];
  },
  isFinal(id) { return STAGES[id].leg === ROUTE.length - 1; }
};
