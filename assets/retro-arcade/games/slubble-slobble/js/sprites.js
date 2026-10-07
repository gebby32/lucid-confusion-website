/* SPRITES — every NES-style pixel sprite in the game (string art, original designs).
   Enemies face RIGHT; mirrored copies are made on demand. Frame B lists only the rows
   that differ from frame A. Each sprite keeps to an outline + 2-3 colours, like a
   cartridge sprite would. Slub and Slob are NOT here — see js/sloths.js. */
'use strict';
const NES = {
  k: '#000000', w: '#fcfcfc', lg: '#bcbcbc', g: '#7c7c7c', dg: '#404040',
  red: '#f83800', dred: '#a81000', pink: '#f878f8', lpink: '#f8b8f8',
  orange: '#e45c10', lorange: '#fca044', yellow: '#f8b800', lyellow: '#f8d878', cream: '#fcd8a8',
  green: '#00a800', lgreen: '#b8f818', dgreen: '#005800', mint: '#58f898',
  blue: '#0058f8', lblue: '#3cbcfc', sky: '#a4e4fc', navy: '#0000bc', dnavy: '#202060',
  purple: '#6844fc', violet: '#9878f8', magenta: '#d800cc', brown: '#ac7c00', dbrown: '#503000', teal: '#008888', cyan: '#00e8d8'
};

const Sprites = (function () {
  const N = NES;
  // ------------------------------------------------------------------ enemies
  const E = {
    penguin: { pal: { k: N.k, a: N.dnavy, b: N.w, c: N.lorange, w: N.w, r: N.red }, a: [
      '......kkkk......',
      '.....kaaaak.....',
      '....kaaaaaak....',
      '...kaaaakkkk....',
      '...kaaaakwkak...',
      '...kaaaaakkakk..',
      '...kaaaaaaakcck.',
      '..kaaabbbbakkk..',
      '.kaakbbbbbbk....',
      '.kaakbbbbbbbk...',
      'kaak.kbbbbbbk...',
      '.kk..kbbbbbbk...',
      '.....kbbbbbak...',
      '......kaaaak....',
      '.....kcckcck....',
      '....kcck.kcck...'], b: { 14: '......kcckcck...', 15: '.....kcck..kcck.' } },

    raccoon: { pal: { k: N.k, a: N.g, b: N.lg, c: N.w, w: N.w }, a: [
      '....kk....kk....',
      '...kbak..kabk...',
      '...kaaakkaaak...',
      '..kaaaaaaaaaak..',
      '..kkkkaaaakkkk..',
      '..kkwkkaakkwkk..',
      '..kcaaaccaaack..',
      '...kcaakkaack...',
      '....kaaaaaak....',
      'kk.kaabbbbaak...',
      'kakaaabbbbbaak..',
      'kkkaaabbbbbaak..',
      'kak.kaabbbbaak..',
      '.k..kaaaaaaak...',
      '....kak..kak....',
      '...kkk...kkk....'], b: { 14: '...kak....kak...', 15: '..kkk......kkk..' } },

    frog: { pal: { k: N.k, a: N.green, b: N.lgreen, w: N.w, r: N.red }, a: [
      '..kkk......kkk..',
      '.kwwwk....kwwwk.',
      '.kwkwk....kwkwk.',
      '.kwwwkkkkkkwwwk.',
      '..kaaaaaaaaaak..',
      '.kaaaaaaaaaaaak.',
      '.kaarrrrrrrraak.',
      'kaaakrrrrrrkaaak',
      'kaaabbbbbbbbaaak',
      'kaak.kbbbbk.kaak',
      'kak..kaaaak..kak',
      'kk..kkk..kkk..kk'], b: { 9: 'kaak.kbbbbk.kaak', 10: '.kak.kaaaak.kak.', 11: '.kak.k....k.kak.' } },

    rat: { pal: { k: N.k, a: N.g, b: N.lpink, w: N.w }, a: [
      '..........kk....',
      '.........kbbk...',
      '......kkkkabk...',
      '.....kaaaaaakk..',
      '....kaaaaaaakwk.',
      'k..kaaaaaaaaaakb',
      'bk.kaaaaaaaaaak.',
      '.bkkaaaaaaaaak..',
      '..bkaaaaaaaak...',
      '....kbk..kbk....'], b: { 9: '...kbk....kbk...' } },

    bat: { pal: { k: N.k, a: N.purple, b: N.violet, w: N.w, r: N.red }, a: [
      'k..............k',
      'kk....k..k....kk',
      'kak...kkkk...kak',
      'kaak.kaaaak.kaak',
      'kaaakarkkrakaaak',
      'kaaaaaaaaaaaaaak',
      '.kaaakawwakaaak.',
      '..kak.kaak.kak..',
      '...k...kk...k...',
      '................'], b: [
      '................',
      '......k..k......',
      '......kkkk......',
      '.....kaaaak.....',
      '....karkkrak....',
      '..kkaaaaaaaakk..',
      '.kaaakawwakaaak.',
      'kaaak.kaak.kaaak',
      'kaak...kk...kaak',
      'kk............kk'] },

    crab: { pal: { k: N.k, a: N.red, b: N.lorange, w: N.w }, a: [
      'kkk..........kkk',
      'kbbk.k....k.kbbk',
      'kbkk.kw..wk.kkbk',
      'kbbk..kk.kk.kbbk',
      '.kak.kaaaak.kak.',
      '..kaaaaaaaaaak..',
      '.kaaaaaaaaaaaak.',
      'kaakaaaaaaaakaak',
      'k.kbbbbbbbbbbk.k',
      '..kkkkkkkkkkkk..',
      '.ka.ka....ak.ak.',
      'kk..k......k..kk'], b: { 10: '..ka.ka..ak.ak..', 11: '.kk..k....k..kk.' } },

    turtle: { pal: { k: N.k, a: N.green, b: N.brown, c: N.yellow, w: N.w }, a: [
      '................',
      '....kkkkkk......',
      '...kbcbcbbk.....',
      '..kbbcbbcbbk.kk.',
      '.kbcbbbbbbcbkaak',
      '.kbbbcbbcbbbkawk',
      'kbbcbbbbbbcbkaak',
      'kbbbbcbbcbbbbkak',
      'kkkkkkkkkkkkkkk.',
      '.kaak.....kaak..',
      '.kaak.....kaak..',
      '..kk.......kk...'], b: { 9: '..kaak...kaak...', 10: '..kaak...kaak...', 11: '...kk.....kk....' } },
    turtleBare: { pal: { k: N.k, a: N.green, w: N.w, r: N.lpink }, a: [
      '................',
      '................',
      '................',
      '...........kk...',
      '....kkkkkk.kaak.',
      '...kaaaaaakkawk.',
      '..kaaaaaaaaaaak.',
      '..krrrrrrrraak..',
      '..kaaaaaaaaak...',
      '...kkkkkkkkk....',
      '...kaak.kaak....',
      '....kk...kk.....'], b: { 10: '..kaak...kaak...', 11: '...kk.....kk....' } },

    rabbit: { pal: { k: N.k, a: N.w, b: N.lpink, r: N.red }, a: [
      '......kk.kk.....',
      '.....kbkkbk.....',
      '.....kbkkbk.....',
      '.....kbkkbk.....',
      '......kakak.....',
      '.....kaaaaak....',
      '....kaaaakrak...',
      '....kaaaaaaakb..',
      '.....kaaaaakk...',
      '....kaaaaaak....',
      '..kkaaaaaaaak...',
      '.kaakaaaaaaak...',
      '.kaakaaaaaaak...',
      '..kk.kaaaaak....',
      '....kaak.kak....',
      '...kkkk.kkk.....'], b: { 13: '..kk.kaaaaakk...', 14: '...kaak...kaak..', 15: '..kkkk.....kkkk.' } },

    squirrel: { pal: { k: N.k, a: N.orange, b: N.lorange, w: N.w }, a: [
      '.kkkk...........',
      'kaaaak..........',
      'kaabaak....kk...',
      'kabbbaak..kak...',
      '.kabbaak.kaaak..',
      '..kaaak.kaaaawk.',
      '...kaak.kaaaaakk',
      '...kaakkaaaaak..',
      '....kakaabbaak..',
      '....kaaabbbak...',
      '.....kaabbbak...',
      '.....kaaaaaak...',
      '......kaakak....',
      '.....kkk.kkk....'], b: { 12: '.....kak..kak...', 13: '....kkk...kkk...' } },

    possum: { pal: { k: N.k, a: N.lg, b: N.w, c: N.lpink }, a: [
      '...........k....',
      '..........kak...',
      '......kkkkkabk..',
      '.....kaaaaaabbk.',
      '....kaaaaaaakbbc',
      'c..kaaaaaaaaabk.',
      '.ckaaaaaaaaaak..',
      '..ckaaaaaaaaak..',
      '...kkaakkkaak...',
      '....kk....kk....'], b: { 8: '...kaakk.kaakk..', 9: '...kk.....kk....' } },

    goat: { pal: { k: N.k, a: N.lg, b: N.w, c: N.g, d: N.yellow }, a: [
      '..........kk.k..',
      '.........kcckck.',
      '........kcckkk..',
      '.......kaaaak...',
      '......kaaadkak..',
      '......kaaaaaaak.',
      '.kkkkkkaaaaakkk.',
      'kbbbbbbaaaak.k..',
      'kbbbbbbbaak.kk..',
      'kbbbbbbbbak.....',
      '.kbbbbbbbk......',
      '.kak.kak.kak....',
      '.kak.kak.kak....',
      '.kk..kk..kk.....'], b: { 11: 'kak..kak..kak...', 12: '.kak..kak..kak..', 13: '..kk...kk...kk..' } },

    chicken: { pal: { k: N.k, a: N.w, b: N.red, c: N.yellow }, a: [
      '.......kbk......',
      '......kbbbk.....',
      '.....kaaaak.....',
      '....kaaakak.....',
      '....kaaaaakcc...',
      '....kaaaaakkk...',
      '..kkaaaaaab.....',
      '.kaakaaaaaak....',
      'kaaaakaaaaak....',
      'kaaaaaaaaaak....',
      '.kaaaaaaaak.....',
      '..kkkkkkkk......',
      '....kc.kc.......',
      '...kcc.kcc......'], b: { 6: 'kkkkaaaaaab.....', 7: 'kaaaaaaaaaak....', 8: '.kkaaaaaaaak....' } },

    pig: { pal: { k: N.k, a: N.lpink, b: N.pink, c: N.g, w: N.w }, a: [
      '....kkkkkk......',
      '...kcccccck.....',
      '..kcwccccccck...',
      '..kkkkkkkkkkk...',
      '..kaaaaaakaak...',
      '..kaaaakaaaabk..',
      '.kaaaaaaaaakbbk.',
      '.kaaaaaaaaaakbk.',
      'kaaaaaaaaaaaak..',
      'kaaaaaaaaaaak...',
      '.kaaaaaaaaak....',
      '..kbk.kbk.kbk...',
      '..kk..kk..kk....'], b: { 11: '.kbk..kbk.kbk...', 12: '.kk...kk..kk....' } },
    pigBare: { pal: { k: N.k, a: N.lpink, b: N.pink }, a: [
      '................',
      '................',
      '....kk...kk.....',
      '...kbak.kabk....',
      '..kaaaaaakaak...',
      '..kaaaakaaaabk..',
      '.kaaaaaaaaakbbk.',
      '.kaaaaaaaaaakbk.',
      'kaaaaaaaaaaaak..',
      'kaaaaaaaaaaak...',
      '.kaaaaaaaaak....',
      '..kbk.kbk.kbk...',
      '..kk..kk..kk....'], b: { 11: '.kbk..kbk.kbk...', 12: '.kk...kk..kk....' } },

    cat: { pal: { k: N.k, a: N.lorange, b: N.orange, c: N.mint, w: N.w }, a: [
      '..........k...k.',
      '.........kak.kak',
      '.........kaakaak',
      'k........kaaaaak',
      'ak......kacakcak',
      'ak......kaaaaaak',
      '.ak.....kaawwak.',
      '.akkkkkkkaaaak..',
      '..kabababaaak...',
      '..kaaaaaaaaak...',
      '..kababababak...',
      '..kaaaaaaaaak...',
      '...kak.kak.kak..',
      '...kk..kk..kk...'], b: { 12: '..kak..kak..kak.', 13: '..kk...kk...kk..' } },

    fish: { pal: { k: N.k, a: N.lblue, b: N.blue, w: N.w, r: N.red }, a: [
      '......kkkk......',
      '.k...kbbbbk.....',
      'kbk.kaaaaaakk...',
      'kbbkaaaaaarwak..',
      'kbbaaaaaaawkaak.',
      'kbbaaaaaaaaaaaak',
      'kbbkaaaaaaakkkk.',
      'kbk.kaaaaaaaak..',
      '.k...kbbbaakk...',
      '.......kkkk.....'], b: { 1: '.....kbbbbk.....', 2: 'k...kaaaaaakk...', 7: 'k...kaaaaaaaak..', 8: '.....kbbbaakk...' } },

    octopus: { pal: { k: N.k, a: N.magenta, b: N.pink, w: N.w }, a: [
      '.....kkkkkk.....',
      '....kaaaaaak....',
      '...kaabaaaaak...',
      '..kabbaaaaaaak..',
      '..kaaawkaawkak..',
      '..kaaakkaakkak..',
      '..kaaaaaaaaaak..',
      '...kaaakkaaak...',
      '..kaaaaaaaaaak..',
      '.kakakakakakak..',
      '.ka.ka.ka.ka.ak.',
      'kk..kk.kk..k..k.'], b: { 9: '..kakakakakakak.', 10: '..ak.ak.ak.ak.ak', 11: '..kk..kk..kk..kk' } },

    snake: { pal: { k: N.k, a: N.green, b: N.yellow, r: N.red, w: N.w }, a: [
      '...........kkk..',
      '..........kaaak.',
      '.........kaawkak',
      '.........kaaaaakr',
      '..........kaaak.r',
      '....kkkk...kak..',
      '...kaaaak..kak..',
      '..kaakkaak.kak..',
      '..kak..kaakaak..',
      '.kak....kaaak...',
      'kbbk.....kkk....',
      '.kk.............'], b: { 6: '...kaaak...kak..', 7: '..kaakaak..kak..', 8: '.kak..kaakaak...', 9: 'kak....kaaak....', 10: 'kbk.....kkk.....', 11: 'kk..............' } },

    spider: { pal: { k: N.k, a: N.dred, b: N.red, w: N.w }, a: [
      'k.....kkk.....k',
      '.k...kaaak...k.',
      '..k.kaaaaak.k..',
      'kkkkkawawakkkkk',
      '..k.kaaaaak.k..',
      '.k.kkabbbakk.k.',
      'k..k.kaaak.k..k',
      '...k..kkk..k...'], b: { 0: '.k....kkk....k.', 1: 'k.k..kaaak..k.k', 6: '.k.k.kaaak.k.k.', 7: '..k...kkk...k..' } },

    beetle: { pal: { k: N.k, a: N.dgreen, b: N.mint, c: N.g, w: N.w }, a: [
      '.......kk.......',
      '......kbak......',
      '...kkkkkkkkk....',
      '..kaabaakaaak.k.',
      '.kabbaaakaaaakck',
      '.kaabaaakaaaawk.',
      'kaaaaaaakaaaakk.',
      'kaaaaaaakaaaak..',
      '.kkkkkkkkkkkk...',
      '..kck.kck.kck...',
      '..kk..kk..kk....'], b: { 9: '.kck..kck..kck..', 10: '.kk...kk...kk...' } },

    ghost: { pal: { k: N.k, a: N.w, b: N.lpink, c: N.sky }, a: [
      '.....kkkkk......',
      '...kkaaaaakk....',
      '..kaaaaaaaaak...',
      '.kaaaaaaaaaaak..',
      '.kaakkaaakkaak..',
      'kaaakkaaakkaaak.',
      'kaaaaaaaaaaaaak.',
      'kaaaaakkkaaaaak.',
      'kaaaakbbbkaaaak.',
      'kaaaaakkkaaaaak.',
      'kaaaaaaaaaaaaak.',
      'kacaaaacaaaacak.',
      'kckcaackcaackck.',
      'k.k.kk.k.kk.k.k.'], b: { 12: 'kcackcaackcaack.', 13: '.k.kk.k.kk.k.kk.' } },

    skeleton: { pal: { k: N.k, a: N.w, b: N.lg }, a: [
      '....kkkkkk......',
      '...kaaaaaak.....',
      '..kaaaaaaaak....',
      '..kakkaakkak....',
      '..kakkaakkak....',
      '..kaaaakaaak....',
      '...kakakakk.....',
      '....kkkkkk......',
      '..kk.kaak.kk....',
      '.kak.kbbk.kak...',
      '..kkkaaaakkk....',
      '.....kbbk.......',
      '....kakkak......',
      '....kak.kak.....',
      '...kak...kak....',
      '...kk.....kk....'], b: { 13: '....kak.kak.....', 14: '....kak.kak.....', 15: '....kk...kk.....' } },

    imp: { pal: { k: N.k, a: N.red, b: N.dred, c: N.yellow, w: N.w }, a: [
      '.k..........k...',
      'kak........kak..',
      'kaak.kkkk.kaak..',
      '.kaakaaaakaak...',
      '..kaaaaaaaak....',
      '..kacckkccak....',
      '..kaaaaaaaak....',
      '..kakwkkwkak....',
      '...kaaaaaak..k..',
      '..kkbaaaabkk.kk.',
      '.kak.kaaak.kakak',
      '.kk..kbbbk..kk..',
      '.....kakak......',
      '....kk...kk.....'], b: { 12: '.....kakak......', 13: '.....kk.kk......' } },

    blob: { pal: { k: N.k, a: N.mint, b: N.green, w: N.w }, a: [
      '.....kkkkk......',
      '...kkaaaaakk....',
      '..kaawaaaaaak...',
      '.kaawwaaaaaaak..',
      '.kaaaakaaakaak..',
      'kaaaaakaaakaaak.',
      'kaaaaaaaaaaaaak.',
      'kaaaakaaaaakaak.',
      'kbaaaakkkkkaabk.',
      'kbbaaaaaaaaabbk.',
      '.kbbbbbbbbbbbk..',
      '..kkkkkkkkkkk...'], b: [
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkaaaaaakk...',
      '..kaawaaaaaaak..',
      '.kaawwakaaakaak.',
      'kaaaaaakaaakaaak',
      'kaaaaakaaaaakaak',
      'kbaaaaakkkkkaabk',
      'kbbaaaaaaaaaabbk',
      '.kbbbbbbbbbbbbk.',
      '..kkkkkkkkkkkk..'] },

    slime: { pal: { k: N.k, a: N.violet, b: N.purple, w: N.w }, a: [
      '......kkk.......',
      '.....kaaak......',
      '....kawaaak.....',
      '...kawaaaaak....',
      '..kaaaaaaaaak...',
      '..kaakaaakaak...',
      '.kaaakaaakaaak..',
      '.kaaaaaaaaaaak..',
      'kaaaakkkkkaaaak.',
      'kbaaaaaaaaaaabk.',
      'kbbkbbbbbkbbbbk.',
      '.kk.kkkkk.kkkk..'], b: { 10: 'kbbbbkbbbbbkbbk.', 11: '.kkkk.kkkkk.kk..' } },

    mushroom: { pal: { k: N.k, a: N.red, b: N.cream, w: N.w }, a: [
      '.....kkkkkk.....',
      '...kkaawwaakk...',
      '..kawwaaaawwak..',
      '.kaawwaaaaaaaak.',
      '.kaaaaaawwaaaak.',
      'kaawaaaawwaawaak',
      'kkkkkkkkkkkkkkkk',
      '...kbbbbbbbbk...',
      '...kbkbbbbkbk...',
      '...kbkbbbbkbk...',
      '...kbbbkkbbbk...',
      '....kbbbbbbk....',
      '...kkk....kkk...'], b: { 11: '....kbbbbbbk....', 12: '....kkk..kkk....' } },

    eyeball: { pal: { k: N.k, w: N.w, a: N.red, c: N.blue }, a: [
      '....kkkkkk....',
      '..kkwwwwwwkk..',
      '.kwawwwwwwwwk.',
      '.kwwwwwcccwwk.',
      'kwwawwcckccwwk',
      'kwwwwwcckccwwk',
      'kwwawwwcccwawk',
      '.kwwwwwwwwwwk.',
      '.kwwawwwwwawk.',
      '..kkwwwwwwkk..',
      '....kkkkkk....',
      '....k.kk.k....',
      '...kk.kk.kk...'], b: { 11: '....k.k.k.....', 12: '...kk.kk.kk...' } },

    teeth: { pal: { k: N.k, a: N.red, w: N.w, c: N.yellow }, a: [
      '......kkk.......',
      '......kck.......',
      '....kkkckkk.....',
      '..kkaaaaaaakk...',
      '.kaaaaaaaaaaak..',
      'kaawkwkwkwkwaak.',
      'kawwwwwwwwwwwak.',
      '.kkkkkkkkkkkkk..',
      'kawwwwwwwwwwwak.',
      'kaawkwkwkwkwaak.',
      '.kaaaaaaaaaaak..',
      '..kkkkkkkkkkk...',
      '...kcck.kcck....'], b: { 6: 'kawwwwwwwwwwwak.', 7: 'k.............k.', 8: 'kkkkkkkkkkkkkkk.', 12: '..kcck...kcck...' } },

    robot: { pal: { k: N.k, a: N.lg, b: N.g, c: N.red, d: N.lblue }, a: [
      '.......k........',
      '......kck.......',
      '.......k........',
      '...kkkkkkkkk....',
      '..kaaaaaaaaak...',
      '..kabbbbbbbak...',
      '..kabbbbbcdak...',
      '..kabbbbbbbak...',
      '..kaaaaaaaaak...',
      '...kkkkkkkkk....',
      '....kbaaabk.kk..',
      '...kkbaaabkkak..',
      '....kbaaabk.kk..',
      '....kkkkkkk.....',
      '....kak.kak.....',
      '...kkkk.kkkk....'], b: { 1: '......kdk.......', 14: '...kak...kak....', 15: '..kkkk...kkkk...' } },

    trashcan: { pal: { k: N.k, a: N.g, b: N.lg, c: N.green, w: N.w }, a: [
      '......kkk.......',
      '...kkkkbkkkk....',
      '..kbbbbbbbbbk...',
      '.kkkkkkkkkkkkk..',
      '..kkwkkkkwkk....',
      '..kaaaaaaaaak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kaaaaaaaaak...',
      '...kkkkkkkkk....',
      '...kk.....kk....'], b: { 12: '....kk...kk.....' } },
    trashcanBare: { pal: { k: N.k, a: N.g, b: N.lg, c: N.green, w: N.w }, a: [
      '................',
      '.....k...k......',
      '....kck.kck.k...',
      '..kkckckkckkck..',
      '..kckwkcckwkk...',
      '..kaaaaaaaaak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kabaabaabak...',
      '..kaaaaaaaaak...',
      '...kkkkkkkkk....',
      '...kk.....kk....'], b: { 12: '....kk...kk.....' } },

    boot: { pal: { k: N.k, a: N.brown, b: N.dbrown, c: N.w, r: N.red }, a: [
      '..kkkkkkk.......',
      '..kaaaaaak......',
      '..kakcckak......',
      '..kaaaaaak......',
      '..kakcckak......',
      '..kaaaaaak......',
      '..karkarkakk....',
      '..kaaaaaaaaak...',
      '..kaaaaaaaaaak..',
      '.kaaaaaaaaaaaak.',
      '.kbbbbbbbbbbbbk.',
      '..kkkkkkkkkkkk..'] },

    apple: { pal: { k: N.k, a: N.red, b: N.dred, c: N.green, d: N.dbrown, w: N.w }, a: [
      '........dc......',
      '.......dccc.....',
      '...kkkkdkkkk....',
      '..kaaaaaaaaak...',
      '.kawaaaaaaaaak..',
      '.kawaaaaaaaaak..',
      'kaaakkaaakkaaak.',
      'kaaaakwakwkaaak.',
      'kaaaaaaaaaaaaak.',
      'kaaaakkkkkaaaak.',
      '.kaaaawwwaaaak..',
      '.kbaaaaaaaaabk..',
      '..kbbbbbbbbbk...',
      '...kkkkkkkkk....'] },

    sandwich: { pal: { k: N.k, a: N.cream, b: N.green, c: N.red, d: N.yellow, w: N.w }, a: [
      'w..............w',
      'ww............ww',
      '.wwkkkkkkkkkkww.',
      '..kaaaaaaaaaak..',
      '.kaaakwkakwkaak.',
      '.kaaaaaaaaaaaak.',
      '.kbbbbbbbbbbbbk.',
      '.kccdcccdccdcck.',
      '.kddddddddddddk.',
      '.kaaaaaaaaaaaak.',
      '..kkkkkkkkkkkk..'], b: { 0: '................', 1: '................', 2: '..kkkkkkkkkkkk..', 4: 'wkaaakwkakwkaakw', 5: 'wwaaaaaaaaaaaaww' } },

    skull: { pal: { k: N.k, a: N.w, b: N.lg, r: N.red }, a: [
      '....kkkkkk....',
      '..kkaaaaaakk..',
      '.kaaaaaaaaaak.',
      'kaaaaaaaaaaaak',
      'kakkkaaaakkkak',
      'kakrkaaaakrkak',
      'kakkkaakakkkak',
      '.kaaaakkaaaak.',
      '..kaaaaaaaak..',
      '..kakakakakk..',
      '...kbkbkbkk...',
      '....kkkkkk....'] },

    mutant: { pal: { k: N.k, a: N.lgreen, b: N.green, c: N.pink, w: N.w }, a: [
      '..kkk.kkk.kkk...',
      '.kwkwkkwkkwkwk..',
      '..kkk.kkk.kkk...',
      '...k...k...k....',
      '..kkkkkkkkkkk...',
      '.kaaaaaaaaaaak..',
      'kaabaaaaaabaaak.',
      'kaaaaaaaaaaaaak.',
      'kaakwkwkwkwkaak.',
      'kaakkkkkkkkkaak.',
      '.kaaaaaaaaaaak..',
      '..kbak...kabk...',
      '..kbak...kabk...',
      '.kkkk...kkkkk...'], b: { 11: '.kbak.....kabk..', 12: '.kbak.....kabk..', 13: 'kkkk.....kkkkk..' } },

    duckling: { pal: { k: N.k, a: N.yellow, c: N.orange, w: N.w }, a: [
      '....kkkk....',
      '...kaaaak...',
      '...kaakwak..',
      '...kaaaakcck',
      '....kaaakkk.',
      '..kkaaaaak..',
      '.kaaaaaaaak.',
      'kaaaaaaaaak.',
      '.kaaaaaaak..',
      '..kkkkkkk...',
      '...kc.kc....'], b: { 10: '..kc...kc...' } },

    fly: { pal: { k: N.k, a: N.g, w: N.sky, r: N.red }, a: [
      '..ww..ww..',
      '.wwww.wwww',
      '..wwkkww..',
      '..kaaaak..',
      '.krkaakrk.',
      '.kaaaaaak.',
      '..kakkak..',
      '...kkkk...'], b: { 0: '..........', 1: '.ww....ww.', 2: 'wwwwkkwwww' } },

    landlord: { pal: { k: N.k, a: N.dg, b: N.lyellow, c: N.g, w: N.w, r: N.red }, a: [
      '....kkkkkk......',
      '....kaaaak......',
      '....kaaaak......',
      '..kkkkkkkkkk....',
      '...kbbbbbbk.....',
      '..kbbrbbrbbk....',
      '..kbbbbbbbbk....',
      '..kbbkkkkbbk....',
      '...kbbbbbbk..k..',
      '..kccccccccckwk.',
      '.kcccccccccckwk.',
      '.kccccccccck.k..',
      '..kcccccccck....',
      '...kc.kc.kck....',
      '....k..k...k....'], b: { 13: '..kc.kc.kc.k....', 14: '...k..k..k......' } }
  };

  // ------------------------------------------------------------------ food + treasure
  const I = {
    cherry: { pal: { k: N.k, r: N.red, d: N.dred, c: N.green, w: N.w }, a: [
      '........kk..', '......kkck..', '.....kc.k...', '....kc...k..', '...kc....ck.', '..kkk...kkk.',
      '.krwrk.krwrk', '.krrrk.krrrk', '.kdrrk.kdrrk', '..kkk...kkk.'] },
    strawberry: { pal: { k: N.k, r: N.red, c: N.green, y: N.lyellow }, a: [
      '...kckck....', '..kcccccck..', '.krrcccrrrk.', 'krryrrryrrk.', 'krrrryrrrrk.', 'kryrrrrryrk.',
      '.krrryrrrk..', '..krrrryk...', '...krrrk....', '....kkk.....'] },
    banana: { pal: { k: N.k, y: N.lyellow, d: N.yellow, b: N.dbrown }, a: [
      '........kk..', '.......kbk..', '......kyk...', '.....kyyk...', '....kyydk...', '...kyyydk...',
      '.kkyyyydk...', 'kyyyyydk....', '.kdddddk....', '..kkkkk.....'] },
    grapes: { pal: { k: N.k, p: N.purple, l: N.violet, c: N.green }, a: [
      '.....kck....', '...kk.ck.kk.', '..klpkkkplk.', '..kpppkpppk.', '...kklpklk..', '..klpkppppk.',
      '..kpppkpk...', '...kkklpk...', '....kpppk...', '.....kkk....'] },
    melon: { pal: { k: N.k, r: N.red, l: N.lgreen, g: N.green }, a: [
      '.....kk.....', '....krrk....', '...krkrrk...', '..krrrrkrk..', '.krkrrrrrrk.', 'krrrrrkrrrrk',
      'kllllllllllk', 'kggggggggggk', '.kkkkkkkkkk.'] },
    coffee: { pal: { k: N.k, b: N.brown, w: N.w, s: N.lg }, a: [
      '...s..s.....', '..s..s......', '...s..s.....', '.kkkkkkkk...', '.kbbbbbbkkk.', '.kwwwwwwk.k.',
      '.kwwwwwwk.k.', '.kwwwwwwkkk.', '..kwwwwk....', '.kkkkkkkk...'] },
    donut: { pal: { k: N.k, p: N.pink, d: N.lorange, c: N.lblue, y: N.yellow }, a: [
      '...kkkkkk...', '.kkppcppykk.', 'kppypppcpppk', 'kpcppkkppypk', 'kpppk..kpppk', 'kdppk..kpcdk',
      'kddppkkpppdk', '.kddddddddk.', '..kkkkkkkk..'] },
    cupcake: { pal: { k: N.k, p: N.lpink, r: N.red, w: N.w, l: N.lblue }, a: [
      '.....kk.....', '....krrk....', '...kkrrkk...', '..kppppppk..', '.kpwpppppk..', '.kppppwpppk.',
      'kpppppppppk.', 'kkkkkkkkkkk.', '.klklklklk..', '.klklklklk..', '..kkkkkkk...'] },
    taco: { pal: { k: N.k, y: N.yellow, g: N.lgreen, r: N.red, b: N.dbrown }, a: [
      '...kkkkk....', '..kgrgrgk...', '.kbbgbbgbk..', 'kyybbbbbyyk.', 'kyyyyyyyyyk.', '.kyyyyyyyk..', '..kkkkkkk...'] },
    burger: { pal: { k: N.k, y: N.lorange, w: N.w, g: N.lgreen, b: N.dbrown, d: N.yellow }, a: [
      '...kkkkkk...', '.kkyywyyykk.', 'kyyyyyyywyyk', 'kkkkkkkkkkkk', 'kggggggggggk', 'kbbbbbbbbbbk',
      'kddddddddddk', 'kyyyyyyyyyyk', '.kkkkkkkkkk.'] },
    pizza: { pal: { k: N.k, b: N.brown, y: N.lyellow, r: N.red }, a: [
      'kkkkkkkkkkkk', 'kbbbbbbbbbbk', '.kyyryyyryk.', '.kyyyyryyyk.', '..kyryyyyk..', '..kyyyyryk..',
      '...kyyyyk...', '...kyryk....', '....kyk.....', '.....k......'] },
    icecream: { pal: { k: N.k, p: N.pink, w: N.w, y: N.lorange }, a: [
      '...kkkk.....', '..kppppk....', '.kpwppppk...', '.kppppppk...', '.kwwwwwwk...', 'kwwwwwwwwk..',
      '.kyyyyyyk...', '..kykyyk....', '..kyyyyk....', '...kyyk.....', '....kk......'] },
    sandwich: { pal: { k: N.k, a: N.cream, g: N.lgreen, r: N.red, d: N.yellow, b: N.brown }, a: [
      '.kkkkkkkkkk.', 'kaaaaaaaaaak', 'kggggggggggk', 'krrrrrrrrrrk', 'kddddddddddk', 'kbbbbbbbbbbk',
      'kaaaaaaaaaak', '.kkkkkkkkkk.'] },
    coin: { pal: { k: N.k, y: N.yellow, d: N.brown, w: N.lyellow }, a: [
      '..kkkkkk..', '.kyyyyyyk.', 'kywyyyyydk', 'kyykkkkydk', 'kyykyyyydk', 'kyykkkkydk',
      'kyyyyykydk', 'kyykkkkydk', '.kddddddk.', '..kkkkkk..'] },
    gem: { pal: { k: N.k, c: N.lblue, b: N.blue, w: N.w }, a: [
      '..kkkkkkk..', '.kwcwccbck.', 'kcccccbbbbk', 'kkkkkkkkkkk', '.kccbcbbbk.', '..kcbcbbk..',
      '...kcbbk...', '....kbk....', '.....k.....'] },
    ruby: { pal: { k: N.k, c: N.red, b: N.dred, w: N.lpink }, a: [
      '..kkkkkkk..', '.kwcwccbck.', 'kcccccbbbbk', 'kkkkkkkkkkk', '.kccbcbbbk.', '..kcbcbbk..',
      '...kcbbk...', '....kbk....', '.....k.....'] },
    bag: { pal: { k: N.k, b: N.brown, y: N.yellow }, a: [
      '....kkk.....', '...kbbbk....', '....kkk.....', '...kbbbbk...', '..kbbbbbbk..', '.kbbkyykbbk.',
      '.kbbykbbbbk.', '.kbbbkykbbk.', '.kbbyykbbbk.', '..kbbbbbbk..', '...kkkkkk...'] },
    crown: { pal: { k: N.k, y: N.yellow, d: N.brown, r: N.red, b: N.lblue }, a: [
      'k....k....k', 'kk..kyk..kk', 'kyk.kyk.kyk', 'kyykyyykyyk', 'kyyyyyyyyyk', 'kyryyyyyryk',
      'kyyyybyyyyk', 'kdddddddddk', 'kkkkkkkkkkk'] },
    idol: { pal: { k: N.k, y: N.yellow, d: N.brown, w: N.lyellow }, a: [
      '...kkkkkk...', '..kywyyyyk..', '.kyddyyddyk.', '.kydkyydkyk.', '.kyddyyddyk.', '.kyyykkyyyk.',
      '..kyykkyyk..', '..kyyyyyyk..', '...kddddk...', '..kkkkkkkk..', '.kddddddddk.', '.kkkkkkkkkk.'] }
  };
  const FOOD = [
    // [name, points, tier] — tier 0 common ... 4 legendary
    ['cherry', 100, 0], ['strawberry', 200, 0], ['banana', 300, 0], ['grapes', 500, 1], ['melon', 700, 1],
    ['coffee', 800, 1], ['donut', 1000, 1], ['cupcake', 1200, 2], ['taco', 1500, 2], ['burger', 2000, 2],
    ['pizza', 2500, 2], ['icecream', 3000, 3], ['sandwich', 4000, 3], ['coin', 5000, 3], ['gem', 6000, 3],
    ['ruby', 7000, 4], ['bag', 8000, 4], ['crown', 10000, 4], ['idol', 20000, 4]
  ];

  // ------------------------------------------------------------------ small icons
  const ICON = {
    heart: { pal: { k: N.k, r: N.red, w: N.w }, a: ['.kk.kk.', 'krwkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'] },
    slubHead: { pal: { k: N.k, a: N.green, y: N.yellow, f: N.lorange, w: N.w }, a: ['.y.y...', 'kakaakk', 'kawkwak', 'kffffak', 'kfkfkak', '.kffkk.', '..kk...'] },
    slobHead: { pal: { k: N.k, a: N.blue, y: N.pink, f: N.lorange, w: N.w }, a: ['.y.y...', 'kakaakk', 'kawkwak', 'kffffak', 'kfkfkak', '.kffkk.', '..kk...'] },
    star: { pal: { k: N.k, y: N.yellow, w: N.w }, a: ['...k...', '..kyk..', 'kkkwykk', 'kyyyyyk', '.kyyyk.', '.kykyk.', 'kk...kk'] },
    swirl: { pal: { y: N.yellow }, a: ['.yyy.', 'y...y', 'y.y.y', 'y..y.', '.yy..'] },
    vein: { pal: { r: N.red }, a: ['r.r.r', '.r.r.', 'rr.rr', '.r.r.', 'r.r.r'] },
    sweat: { pal: { b: N.lblue, w: N.w }, a: ['..b..', '.bwb.', 'bwbbb', 'bbbbb', '.bbb.'] },
    quest: { pal: { w: N.w }, a: ['.www.', 'w...w', '...w.', '..w..', '.....', '..w..'] },
    bang: { pal: { y: N.yellow }, a: ['.y.', '.y.', '.y.', '.y.', '...', '.y.'] },
    note: { pal: { w: N.w }, a: ['..www', '..w.w', '..w.w', 'www.w', 'ww.ww'] },
    egg: { pal: { k: N.k, w: N.w, c: N.cream }, a: ['.kk.', 'kwwk', 'kwwk', 'kwck', '.kk.'] },
    bone: { pal: { k: N.k, w: N.w }, a: ['kk...kk', 'kwkkkwk', '.kwwwk.', 'kwkkkwk', 'kk...kk'] },
    fireball: { pal: { r: N.red, y: N.yellow, w: N.w }, a: ['..r..', '.ryr.', 'rywyr', '.ryr.', '..r..'] },
    ink: { pal: { k: N.k, a: N.purple }, a: ['.kk.', 'kaak', 'kaak', '.kk.'] },
    laser: { pal: { r: N.red, w: N.w }, a: ['rrrrrr', 'wwwwww', 'rrrrrr'] },
    spore: { pal: { y: N.lyellow, b: N.brown }, a: ['.y.', 'yby', '.y.'] },
    can: { pal: { k: N.k, a: N.lg, g: N.green }, a: ['kkkk', 'kagk', 'kgak', 'kkkk'] },
    acorn: { pal: { k: N.k, b: N.brown, d: N.dbrown }, a: ['.kk.', 'kddk', 'kbbk', '.kk.'] }
  };

  const built = {};
  const cache = {};

  function build(def) {
    const A = G.sprite(def.a, def.pal);
    let B = A;
    if (def.b) {
      const rows = Array.isArray(def.b) ? def.b : def.a.map((r, i) => (def.b[i] !== undefined ? def.b[i] : r));
      B = G.sprite(rows, def.pal);
    }
    return [A, B];
  }

  const S = {
    E, I, ICON, FOOD,
    init() {
      for (const k in E) built['e:' + k] = build(E[k]);
      for (const k in I) built['i:' + k] = build(I[k]);
      for (const k in ICON) built['c:' + k] = build(ICON[k]);
    },
    // enemy frame canvas. mode: '' | 'angry' | 'frozen' | 'white'
    enemy(name, frame, flip, mode) {
      const key = name + (frame & 1) + (flip ? 'f' : '') + (mode || '');
      let c = cache[key];
      if (c) return c;
      let src = built['e:' + name][frame & 1];
      if (mode === 'angry') src = G.tint(src, '#f83800', 0.6);
      else if (mode === 'frozen') src = G.tint(src, '#3cbcfc', 0.7);
      else if (mode === 'white') src = G.silhouette(src, '#fcfcfc');
      else if (mode === 'happy') src = G.tint(src, '#f8b8f8', 0.25);
      if (flip) src = G.mirror(src);
      return (cache[key] = src);
    },
    item(name) { return built['i:' + name][0]; },
    icon(name, frame) { return built['c:' + name][frame & 1 || 0]; },
    has(name) { return !!built['e:' + name]; }
  };
  return S;
})();
