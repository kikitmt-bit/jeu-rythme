/* ============================================================
   Son : synthé (WebAudio) pour la musique intégrée, et horloge du morceau calée sur le haut-parleur.
   ============================================================ */
"use strict";
const MIDI = m => 440 * Math.pow(2, (m - 69) / 12);

/* ============================================================
   Audio (synthèse WebAudio)
   ============================================================ */
let actx = null, bus = null, rev = null, noise = null, impulse = null;
let events = [], evi = 0, t0 = 0;
function initAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'});
  const n = actx.sampleRate;
  noise = actx.createBuffer(1, n, n);
  const d = noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const len = Math.floor(n * 2.2);
  impulse = actx.createBuffer(2, len, n);
  for (let c = 0; c < 2; c++) { const x = impulse.getChannelData(c); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
}
function nouveauBus() {
  if (bus) { const old = bus; old.gain.setTargetAtTime(0, actx.currentTime, .05); setTimeout(() => old.disconnect(), 400); }
  const comp = actx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  bus = actx.createGain(); bus.gain.value = .85; bus.connect(comp); comp.connect(actx.destination);
  rev = actx.createConvolver(); rev.buffer = impulse;
  const rg = actx.createGain(); rg.gain.value = .32; rev.connect(rg); rg.connect(bus);
}
function sortie(node, send) {
  node.connect(bus);
  if (send) { const s = actx.createGain(); s.gain.value = send; node.connect(s); s.connect(rev); }
}
function env(T, a, peak, dur, rel) {
  const g = actx.createGain();
  g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(peak, T + a);
  g.gain.setValueAtTime(peak, T + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0, T + dur);
  return g;
}
function osc(type, f, T, end) { const o = actx.createOscillator(); o.type = type; o.frequency.value = f; o.start(T); o.stop(end); return o; }
function bruit(T, dur) { const s = actx.createBufferSource(); s.buffer = noise; s.start(T, Math.random() * .5); s.stop(T + dur); return s; }
const SON = {
  pluck(e, T) {
    const g = actx.createGain();
    g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(e.v, T + .004); g.gain.exponentialRampToValueAtTime(.0005, T + 1.1);
    osc('triangle', MIDI(e.m), T, T + 1.15).connect(g);
    const h = actx.createGain(); h.gain.value = .25; osc('sine', MIDI(e.m) * 2, T, T + 1.15).connect(h); h.connect(g);
    sortie(g, .6);
  },
  lead(e, T) {
    const g = env(T, .03, .075, e.d, .12);
    const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = .6; f.connect(g);
    const lfo = osc('sine', 5.5, T, T + e.d + .05), lg = actx.createGain();
    lg.gain.setValueAtTime(0, T); lg.gain.linearRampToValueAtTime(e.d > .6 ? 9 : 0, T + Math.min(.5, e.d)); lfo.connect(lg);
    for (const det of [-7, 7]) { const o = osc('sawtooth', MIDI(e.m), T, T + e.d + .05); o.detune.value = det; lg.connect(o.detune); o.connect(f); }
    const s = osc('sine', MIDI(e.m), T, T + e.d + .05), sg = actx.createGain(); sg.gain.value = .9; s.connect(sg); sg.connect(g);
    sortie(g, .45);
  },
  pad(e, T) {
    const g = env(T, .35, .028, e.d, .4);
    const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1300; f.connect(g);
    for (const m of e.n) { osc('triangle', MIDI(m), T, T + e.d + .05).connect(f); const o = osc('sine', MIDI(m) * 1.003, T, T + e.d + .05); o.connect(f); }
    sortie(g, .5);
  },
  bass(e, T) {
    const g = env(T, .01, .2, e.d, .08);
    osc('triangle', MIDI(e.m), T, T + e.d + .05).connect(g);
    const s = actx.createGain(); s.gain.value = .6; osc('sine', MIDI(e.m), T, T + e.d + .05).connect(s); s.connect(g);
    sortie(g, 0);
  },
  kick(e, T) {
    const o = osc('sine', 140, T, T + .35); o.frequency.exponentialRampToValueAtTime(42, T + .12);
    const g = actx.createGain(); g.gain.setValueAtTime(.55, T); g.gain.exponentialRampToValueAtTime(.001, T + .32);
    o.connect(g); sortie(g, 0);
  },
  snare(e, T) {
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .7;
    const g = actx.createGain(); g.gain.setValueAtTime(.22, T); g.gain.exponentialRampToValueAtTime(.001, T + .16);
    bruit(T, .2).connect(f); f.connect(g);
    const t = osc('triangle', 190, T, T + .1), tg = actx.createGain(); tg.gain.setValueAtTime(.12, T); tg.gain.exponentialRampToValueAtTime(.001, T + .08); t.connect(tg); tg.connect(g);
    sortie(g, .25);
  },
  hat(e, T) {
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = actx.createGain(); g.gain.setValueAtTime(e.v, T); g.gain.exponentialRampToValueAtTime(.001, T + .045);
    bruit(T, .06).connect(f); f.connect(g); sortie(g, 0);
  },
  crash(e, T) {
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4500;
    const g = actx.createGain(); g.gain.setValueAtTime(.09, T); g.gain.exponentialRampToValueAtTime(.001, T + 1.6);
    bruit(T, 1.7).connect(f); f.connect(g); sortie(g, .5);
  },
};
function programmer() {
  if (!actx || etat !== 'jeu') return;
  const now = actx.currentTime;
  while (evi < events.length && t0 + events[evi].t < now + .25) {
    const e = events[evi++], T = t0 + e.t;
    if (T < now - .02) continue;
    SON[e.k](e, T);
  }
}
setInterval(programmer, 40);

/* Temps du morceau, synchronisé avec ce qui sort réellement du haut-parleur */
let tPause = 0;
let carte = null;   // correspondance horloge audio <-> horloge de l'écran (reprise à chaque image)
function horlogeAudio() {
  if (AUTO && !actx) return (performance.now() - autoStart) / 1000;
  const now = performance.now();
  if (actx.getOutputTimestamp && actx.state === 'running') {
    const ts = actx.getOutputTimestamp();
    if (ts.contextTime > 0 && ts.performanceTime > 0 && now - ts.performanceTime < 200) carte = {c: ts.contextTime, p: ts.performanceTime};
  }
  const ct = carte && actx.state === 'running' ? carte.c + (now - carte.p) / 1000
    : actx.currentTime - (actx.outputLatency || 0) - (actx.baseLatency || 0);
  return ct - t0 + reglages.decalage / 1000;
}
/* L'horloge du son avance par à-coups (paquets audio) : si on s'en servait directement, les notes
   tressauteraient. On garde donc un écart lissé entre l'horloge de l'écran et celle du son :
   les notes glissent parfaitement régulièrement, et restent calées sur la musique. */
let ecartHorloge = null;
function synchroniser() {
  const p = performance.now() / 1000, brut = horlogeAudio();
  if (ecartHorloge === null || Math.abs(brut - (p + ecartHorloge)) > .04) ecartHorloge = brut - p;
  else ecartHorloge += (brut - (p + ecartHorloge)) * .02;
}
function oublierHorloge() { carte = null; ecartHorloge = null; }
// moment du morceau où a eu lieu un toucher (horodaté par le téléphone)
function tempsA(stamp) {
  if (ecartHorloge === null) synchroniser();
  const ecart = (performance.now() - stamp) / 1000;
  return (ecart >= 0 && ecart < .3 ? stamp : performance.now()) / 1000 + ecartHorloge;
}

// musique d'un niveau en ligne (MP3 déchiffré, joué d'un bloc)
let source = null;
function arreterSource() { if (source) { try { source.stop(); } catch (e) {} source = null; } }
