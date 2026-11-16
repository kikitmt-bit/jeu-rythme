/* ============================================================
   « Forêt d'émeraude » : le niveau intégré (composition originale jouée par le synthé, partition faite par le code).
   ============================================================ */
"use strict";
const BPM = 120, BEAT = 60 / BPM, START = 2.0;          // la musique démarre 2 s après le lancement
const tb = (bar, beat) => START + (bar * 4 + beat) * BEAT;

/* ============================================================
   Le morceau (composition originale, ré majeur, 120 BPM)
   ============================================================ */
const CH = {
  D:   {b: 38, p: [62, 66, 69], a: [62, 66, 69, 74]},
  Bm:  {b: 35, p: [62, 66, 71], a: [59, 62, 66, 71]},
  G:   {b: 43, p: [62, 67, 71], a: [59, 62, 67, 71]},
  A:   {b: 45, p: [61, 64, 69], a: [57, 61, 64, 69]},
  Fsm: {b: 42, p: [61, 66, 69], a: [57, 61, 66, 69]},
  Em:  {b: 40, p: [59, 64, 67], a: [55, 59, 64, 67]},
};
const PROG = [
  ['D', 'Bm', 'G', 'A'],                                   // intro      mesures 0-3
  ['D', 'Bm', 'G', 'A', 'D', 'Bm', ['G', 'A'], 'D'],       // couplet 1  4-11
  ['G', 'A', 'Fsm', 'Bm', 'G', 'A', 'Em', 'A'],            // pont       12-19
  ['D', 'Bm', 'G', 'A', 'D', 'Bm', ['G', 'A'], 'D'],       // couplet 2  20-27
  ['D', 'D'],                                              // fin        28-29
].flat(1);
const chordAt = (bar, beat) => { const c = PROG[bar]; return CH[Array.isArray(c) ? c[beat < 2 ? 0 : 1] : c]; };

// mélodie : [temps dans la mesure, durée en temps, note]
const MEL_A = [
  [[0, 1, 78], [1, 1, 81], [2, 2, 86]],
  [[0, 1, 83], [1, .5, 81], [1.5, .5, 78], [2, 2, 74]],
  [[0, 1, 79], [1, 1, 83], [2, 1, 86], [3, 1, 83]],
  [[0, 3, 81], [3, 1, 76]],
  [[0, 1, 78], [1, 1, 81], [2, 1, 86], [3, 1, 88]],
  [[0, 2, 86], [2, 1, 83], [3, 1, 81]],
  [[0, 1, 79], [1, 1, 78], [2, 1, 76], [3, 1, 73]],
  [[0, 4, 74]],
];
const MEL_B = [
  [[0, .5, 79], [.5, .5, 81], [1, 1, 83], [2, 1, 79], [3, 1, 74]],
  [[0, .5, 81], [.5, .5, 83], [1, 1, 85], [2, 2, 81]],
  [[0, 1, 78], [1, .5, 81], [1.5, .5, 85], [2, 1, 86], [3, 1, 85]],
  [[0, 3, 83], [3, 1, 81]],
  [[0, .5, 79], [.5, .5, 81], [1, 1, 83], [2, 1, 86], [3, 1, 83]],
  [[0, 1, 85], [1, 1, 88], [2, 2, 85]],
  [[0, 1, 83], [1, 1, 79], [2, 1, 76], [3, 1, 79]],
  [[0, 2, 81], [2, 1, 76], [3, 1, 73]],
];
function melodie() {
  const out = [];
  const put = (mel, bar0) => mel.forEach((bar, i) => bar.forEach(([bt, d, m]) =>
    out.push({bar: bar0 + i, rel: i, bt, d, m, t: tb(bar0 + i, bt)})));
  put(MEL_A, 4); put(MEL_B, 12); put(MEL_A, 20);
  out.push({bar: 28, rel: 0, bt: 0, d: 6, m: 86, t: tb(28, 0)});
  return out;
}
const MELODY = melodie();
const END_T = tb(29, 3) + 2.6;

function evenementsAudio() {
  const ev = [];
  for (let bar = 0; bar < 30; bar++) {
    const last = bar === 29;
    // nappe
    for (const half of [0, 2]) {
      const c = chordAt(bar, half);
      if (half === 0 || Array.isArray(PROG[bar])) ev.push({k: 'pad', t: tb(bar, half), d: (Array.isArray(PROG[bar]) ? 2 : 4) * BEAT, n: c.p});
    }
    // arpège de harpe
    const pat = bar >= 12 && bar < 20 ? [0, 2, 1, 3, 2, 1, 3, 2] : [0, 1, 2, 3, 2, 1, 2, 3];
    for (let i = 0; i < 8; i++) {
      if (last && i >= 6) break;
      const c = chordAt(bar, i / 2);
      const up = bar >= 20 && bar < 28 ? 12 : 0;
      ev.push({k: 'pluck', t: tb(bar, i / 2), m: c.a[pat[i]] + up, v: i % 2 ? .07 : .1});
    }
    // basse
    if (bar < 4) ev.push({k: 'bass', t: tb(bar, 0), d: 3.6 * BEAT, m: chordAt(bar, 0).b});
    else if (bar < 28) for (const bt of [0, 2, 2.5]) {
      if (bt === 2.5 && !(bar >= 12 && bar < 20)) continue;
      ev.push({k: 'bass', t: tb(bar, bt), d: (bt === 2 && bar >= 12 && bar < 20 ? .45 : .9) * BEAT, m: chordAt(bar, bt).b});
    }
    // batterie
    if (bar >= 4 && bar < 28) {
      for (let i = 0; i < 8; i++) ev.push({k: 'hat', t: tb(bar, i / 2), v: i % 2 ? .035 : .05});
      ev.push({k: 'kick', t: tb(bar, 0)}, {k: 'kick', t: tb(bar, 2)}, {k: 'snare', t: tb(bar, 1)}, {k: 'snare', t: tb(bar, 3)});
      if (bar >= 12 && bar < 20) ev.push({k: 'kick', t: tb(bar, 2.5)});
      if (bar === 11 || bar === 19 || bar === 27) ev.push({k: 'snare', t: tb(bar, 3.5)});
    }
    if (bar === 4 || bar === 12 || bar === 20 || bar === 28) ev.push({k: 'crash', t: tb(bar, 0)}, {k: 'kick', t: tb(bar, 0)});
  }
  for (const n of MELODY) ev.push({k: 'lead', t: n.t, d: n.d * BEAT, m: n.m});
  // accord final
  [62, 66, 69, 74, 78, 81].forEach((m, i) => ev.push({k: 'pluck', t: tb(29, 3) + i * .025, m, v: .12}));
  ev.push({k: 'crash', t: tb(29, 3)}, {k: 'kick', t: tb(29, 3)}, {k: 'bass', t: tb(29, 3), d: 2, m: 38});
  return ev.sort((a, b) => a.t - b.t);
}

/* ============================================================
   La partition (une seule note à la fois)
   ============================================================ */
const laneOf = m => m <= 74 ? 0 : m <= 79 ? 1 : m <= 83 ? 2 : 3;
const dirOf = d => d >= 5 ? 'u' : d >= 1 ? 'ur' : d === 0 ? 'r' : d >= -4 ? 'dl' : 'd';

function partition() {
  const notes = [];
  const add = (type, t, lane, extra = {}) => notes.push({type, t, lane, ...extra});
  // intro : on suit l'arpège
  const sweep = [0, 1, 2, 3, 3, 2, 1, 0]; let k = 0;
  for (let b = 0; b < 3; b++) for (const bt of [0, 2]) add('tap', tb(b, bt), sweep[k++ % 8]);
  add('tap', tb(3, 0), 2); add('tap', tb(3, 1), 1); add('tap', tb(3, 2), 0); add('swipe', tb(3, 3), 3, {dir: 'u'});
  // couplets et pont : on suit la mélodie (aigu = à droite)
  // mesures « course » : une note tous les demi-temps, à jouer en alternant les pouces
  const COURSE = new Set([18, 22, 26]);
  MELODY.forEach((n, i) => {
    if (n.bar >= 28) return;
    const next = MELODY[i + 1];
    const mode = n.bar < 12 ? 'A1' : n.bar < 20 ? 'B' : 'A2';
    const lane = laneOf(n.m);
    if (n.d >= 2) { add('hold', n.t, lane, {end: n.t + (n.d - .75) * BEAT}); return; }
    const gapOk = next && next.t - n.t >= BEAT - 1e-6;
    const course = COURSE.has(n.bar);
    let swipe = false;
    if (mode === 'A1') swipe = n.bt === 0 && (n.rel === 0 || n.rel === 4);
    if (mode === 'B') swipe = n.d >= 1 && (n.bt === 0 || n.bt === 2);
    if (mode === 'A2') swipe = n.bt === 0 && n.rel % 2 === 0;
    if (swipe && gapOk && !course) add('swipe', n.t, lane, {dir: dirOf(next.m - n.m)});
    else add('tap', n.t, lane);
    if (course && n.d === 1) add('tap', n.t + BEAT / 2, lane <= 1 ? 2 + (n.bt % 2) : 1 - (n.bt % 2));
    else if (mode === 'A2' && n.bt === 3 && n.d === 1 && n.rel % 2 === 0 && next) add('tap', n.t + BEAT / 2, laneOf(next.m));
  });
  // fin : longue note tenue, puis un dernier glissé vers le haut
  add('hold', tb(28, 0), 3, {end: tb(28, 0) + 5.25 * BEAT});
  add('swipe', tb(29, 3), 2, {dir: 'u'});
  // notes doubles (un pouce sur chacune) sur les grands temps forts
  const DOUBLES = [tb(4, 0), tb(12, 0), tb(16, 0), tb(20, 0), tb(24, 0)];
  DOUBLES.forEach((td, k) => {
    const i = notes.findIndex(n => Math.abs(n.t - td) < 1e-6);
    const l = i >= 0 ? notes[i].lane : 1;
    if (i >= 0) notes.splice(i, 1);
    const a = l <= 1 ? l : 1, b = l >= 2 ? l : 3 - (k % 2);
    add('tap', td, Math.min(a, b), {paire: k}); add('tap', td, Math.max(a, b), {paire: k});
  });
  // règles de confort : rien pendant une note tenue, du repos après une tenue ou un glissé
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  const propre = []; let libre = -1, prec = null;
  for (const n of notes) {
    const jumelle = prec && n.paire !== undefined && prec.paire === n.paire;
    if (!jumelle && n.t < libre - 1e-6) continue;
    propre.push(n); prec = n;
    libre = n.type === 'hold' ? n.end + .36 : n.type === 'swipe' ? n.t + .28 : n.t + (n.paire !== undefined ? .2 : .12);
  }
  // une double ne doit pas être coupée par la règle de repos (sinon elle redevient simple)
  return propre.filter(n => n.paire === undefined || propre.filter(m => m.paire === n.paire).length === 2);
}
