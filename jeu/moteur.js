/* ============================================================
   Moteur de la partie : niveaux, notes, jugement, score, entrées (doigts, souris, clavier).
   Il ne dessine rien et ne connaît ni le dessin ni le HUD : il annonce ce qui se passe (ecouter / annoncer)
   et chacun (dessin, HUD, écran de fin… et plus tard un 2e mode ou le combat) s'y abonne.
   ============================================================ */
"use strict";
/* ============================================================
   Niveaux : « Forêt d'émeraude » est intégré (musique synthétisée).
   Les autres sont décrits dans niveaux/index.json et niveaux/<id>.json ;
   leur musique est dans musiques/<id>.bin, chiffrée (AES-GCM, clé tirée du mot de passe familial).
   Format des notes : y = t (taper) / h (maintenir) / s (glisser), t = temps dans le MP3 (s),
   l = piste (0 = grave), e = fin de la note tenue, d = sens du glissé, p = numéro de note double.
   ============================================================ */
const NIVEAUX = {
  foret: {id: 'foret', nom: "Forêt d'émeraude", notes: () => partition(), synth: true, debut: START, temps: BEAT, fin: END_T},
};
let niveau = NIVEAUX.foret;

/* Annonces du moteur : 'partie' (nouvelle partie prête), 'note' (jugement, note), 'coffre' (attrapé ?, piste),
   'fin' (gagné ?). ecouter(quoi, fonction) pour s'y abonner. */
const ecouteurs = {partie: [], note: [], coffre: [], fin: []};
function ecouter(quoi, f) { ecouteurs[quoi].push(f); }
function annoncer(quoi, a, b) { const l = ecouteurs[quoi]; for (let i = 0; i < l.length; i++) l[i](a, b); }

/* ============================================================
   État de la partie
   ============================================================ */
let etat = 'menu', notes = [], prochaine = 0, total = 0;
let score = 0, points = 0, combo = 0, comboMax = 0, hp = 100, comptes = {};
// Score : 9 999 999 pour une partie parfaite (tout en Critical), quel que soit le morceau.
// scoreBrut = somme des notes réussies, chacune pesée par le Critical/Great/Good et par la chaîne (jusqu'à 120) ;
// poidsMax = ce que vaudrait le morceau joué parfaitement.
const SCORE_MAX = 9999999;
let scoreBrut = 0, poidsMax = 1;
let autoStart = 0;
let coffres = 0, coffresMax = 0, jauge = 0, JAUGE_MAX = 30;
// Mis de côté à la demande de Kiki (14/11), le code est gardé pour plus tard :
// le coup spécial (triangle avec le gros plan du capitaine) et les coffres portés par certaines notes.
const COUP_SPECIAL = false, COFFRES_SUR_NOTES = false;
const gestes = new Map();
let coup = null;   // coup spécial en cours ({age}) : déclenché ici, animé par le HUD
let tempsCourant = 0;

function nouvellePartie() {
  notes = niveau.notes().map(n => ({...n, fait: false, tete: false, queue: false, tenu: false, geste: false}));
  total = notes.reduce((s, n) => s + (n.type === 'hold' ? 2 : 1), 0);
  prochaine = 0; score = 0; points = 0; combo = 0; comboMax = 0; hp = 100;
  scoreBrut = 0; poidsMax = 0;
  for (let k = 1; k <= total; k++) poidsMax += 1 + Math.min(k, 120) / 240;
  comptes = {CRITICAL: 0, GREAT: 0, GOOD: 0, MISS: 0};
  gestes.clear();
  // coffres : quelques notes rouges portent un coffre ; on l'attrape avec un Critical ou un Great
  const cand = !COFFRES_SUR_NOTES ? [] : notes.filter((n, i) => i >= 8 && n.type === 'tap' && n.paire === undefined);
  coffresMax = Math.min(cand.length, Math.max(2, Math.round(notes.length / 45)));
  if (!cand.length) coffresMax = 0;
  for (let k = 0; k < coffresMax; k++) cand[Math.floor((k + .5) * cand.length / coffresMax)].coffre = true;
  coffres = 0;
  // coup spécial du capitaine : la jauge se remplit avec les bonnes notes (environ 4 coups par morceau)
  jauge = 0; JAUGE_MAX = Math.max(20, Math.round(notes.length / 5)); coup = null;
  annoncer('partie');   // dessin (effets), HUD (bandeau, fond)
}

function noter(j, n) {
  if (!j) j = 'GOOD';
  const lane = n.lane;
  comptes[j]++;
  if (j === 'MISS') { combo = 0; hp = Math.max(0, hp - 8); }
  else {
    combo++; comboMax = Math.max(comboMax, combo);
    points += MULT[j];
    scoreBrut += MULT[j] * (1 + Math.min(combo, 120) / 240);
    score = Math.min(SCORE_MAX, Math.round(scoreBrut / poidsMax * SCORE_MAX));
    if (j === 'CRITICAL') hp = Math.min(100, hp + 1);
    if (navigator.vibrate && !AUTO) try { navigator.vibrate(j === 'CRITICAL' ? 18 : 10); } catch (e) {}
    jauge += j === 'CRITICAL' ? 1 : j === 'GREAT' ? .6 : .3;
    if (jauge >= JAUGE_MAX) { if (COUP_SPECIAL && !coup) { jauge = 0; coup = {age: 0}; } else jauge = JAUGE_MAX; }
  }
  if (n.coffre && !n.coffreFini) { n.coffreFini = true; annoncer('coffre', j === 'CRITICAL' || j === 'GREAT', lane); }
  annoncer('note', j, n);   // le dessin affiche le jugement et l'éclat, le HUD fait sauter la chaîne
}

/* ============================================================
   Entrées : un doigt n'importe où (ou la souris, ou le clavier)
   ============================================================ */
function candidate(tm) {
  for (let i = prochaine; i < notes.length; i++) {
    const n = notes[i];
    if (n.fait || n.tete || n.geste) continue;
    if (tm < n.t - W_GOOD) return null;
    if (Math.abs(tm - n.t) <= W_GOOD) return n;
  }
  return null;
}
const juger = dt => { dt = Math.abs(dt); return dt <= W_CRIT ? 'CRITICAL' : dt <= W_GREAT ? 'GREAT' : dt <= W_GOOD ? 'GOOD' : null; };

function appui(id, tm, x, y) {
  const n = candidate(tm);
  if (!n) { gestes.set(id, {vide: true}); return; }
  if (n.type === 'tap') { n.fait = true; noter(juger(tm - n.t), n); gestes.set(id, {vide: true}); }
  else if (n.type === 'hold') { n.tete = true; n.tenu = true; noter(juger(tm - n.t), n); gestes.set(id, {note: n, sorte: 'hold'}); }
  else { n.geste = true; gestes.set(id, {note: n, sorte: 'swipe', x, y, tm, age: performance.now()}); }
}
function bouge(id, x, y) {
  const ge = gestes.get(id);
  if (!ge || ge.sorte !== 'swipe' || ge.note.fait) return;
  const dx = x - ge.x, dy = y - ge.y;
  if (Math.hypot(dx, dy) < 24) return;
  finGlisse(ge, Math.atan2(dy, dx) * 180 / Math.PI);
}
function finGlisse(ge, angle) {
  const n = ge.note;
  n.fait = true;
  let diff = Math.abs(angle - DIR_ANGLE[n.dir]) % 360; if (diff > 180) diff = 360 - diff;
  noter(diff <= 55 ? juger(ge.tm - n.t) || 'GOOD' : 'MISS', n);
}
function lache(id, tm) {
  const ge = gestes.get(id); gestes.delete(id);
  if (!ge || ge.vide) return;
  const n = ge.note;
  if (ge.sorte === 'hold' && n.tenu && !n.queue) { n.tenu = false; n.queue = true; n.fait = true; noter(juger(tm - n.end) || 'MISS', n); }
  if (ge.sorte === 'swipe' && !n.fait) { n.fait = true; noter('MISS', n); }
}

cv.addEventListener('pointerdown', e => {
  if (etat !== 'jeu' || AUTO) return;
  e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  appui(e.pointerId, tempsA(e.timeStamp), e.clientX, e.clientY);
});
cv.addEventListener('pointermove', e => { if (etat === 'jeu') bouge(e.pointerId, e.clientX, e.clientY); });
for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, e => { if (etat === 'jeu') lache(e.pointerId, tempsA(e.timeStamp)); });

const TOUCHES = new Set(['Space', 'Enter', 'KeyD', 'KeyF', 'KeyJ', 'KeyK']);
const FLECHES = {ArrowUp: -90, ArrowDown: 90, ArrowLeft: 180, ArrowRight: 0};
addEventListener('keydown', e => {
  if (etat !== 'jeu' || e.repeat || AUTO) return;
  const tm = tempsA(e.timeStamp);
  if (TOUCHES.has(e.code)) { e.preventDefault(); appui(e.code, tm, 0, 0); }
  else if (FLECHES[e.code] !== undefined) {
    e.preventDefault();
    const n = candidate(tm);
    if (n && n.type === 'swipe') { n.geste = true; const want = DIR_ANGLE[n.dir], a = FLECHES[e.code]; let diff = Math.abs(a - want) % 360; if (diff > 180) diff = 360 - diff; finGlisse({note: n, tm}, diff <= 45 ? want : a); }
  }
  else if (e.code === 'Escape') mettrePause();
});
addEventListener('keyup', e => { if (etat === 'jeu' && TOUCHES.has(e.code)) lache(e.code, tempsA(e.timeStamp)); });

function mettreAJour(st, dt) {
  tempsCourant = st;
  for (let i = prochaine; i < notes.length; i++) {
    const n = notes[i];
    if (n.t > st + 2.5) break;
    if (AUTO) {
      if (!n.fait && !n.tete && st >= n.t) { if (n.type === 'hold') { n.tete = n.tenu = true; noter('CRITICAL', n); } else { n.fait = true; noter('CRITICAL', n); } }
      if (n.type === 'hold' && n.tenu && st >= n.end) { n.tenu = false; n.queue = n.fait = true; noter('CRITICAL', n); }
      continue;
    }
    if (n.type !== 'hold' && !n.fait && !n.geste && st > n.t + W_GOOD) { n.fait = true; noter('MISS', n); }
    if (n.type === 'hold') {
      if (!n.tete && st > n.t + W_GOOD) { n.tete = true; n.queue = true; n.fait = true; noter('MISS', n); comptes.MISS++; }
      if (n.tenu && st > n.end + W_GOOD) { n.tenu = false; n.queue = true; n.fait = true; noter('GOOD', n); }
    }
  }
  // glissé commencé mais trop court : raté au bout de 0,35 s
  for (const [id, ge] of gestes) if (ge.sorte === 'swipe' && !ge.note.fait && performance.now() - ge.age > 350) { ge.note.fait = true; noter('MISS', ge.note); gestes.delete(id); }
  while (prochaine < notes.length && notes[prochaine].fait) prochaine++;
  if (hp <= 0) return annoncer('fin', false);   // l'écran de fin (menu.js) s'en charge
  if (st > niveau.fin) annoncer('fin', true);
}
