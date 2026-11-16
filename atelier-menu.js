/* ============================================================
   Maquette du menu (chantier 2.1) : la logique des 6 écrans de atelier-menu.html.
   Rien n'est branché au jeu : la maquette LIT les records, les réglages et la clé du téléphone
   (pour montrer de vrais chiffres et jouer l'extrait), mais n'écrit jamais rien.
   Persos : dessinés par le moule commun (persos/poupee.js), comme dans l'atelier et le jeu.
   ============================================================ */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = new URLSearchParams(location.search), FIGE = Q.has('fige');
const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
const dpr = () => Math.min(3, window.devicePixelRatio || 1);
const espaces = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle) || 'null') || defaut; } catch (e) { return defaut; } };
const hasard = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const teinteDe = txt => { let h = 0; for (const ch of String(txt)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
if (FIGE) document.head.insertAdjacentHTML('beforeend', '<style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}</style>');

/* ---------- données ---------- */
const EQUIPE = ['heros-vert', 'princesse', 'colosse', 'princesse-eaux'];
const ARMES = {'heros-vert': 'Épée et bouclier', princesse: 'Rapière', colosse: 'Poings', 'princesse-eaux': 'Trident'};
const SOCLES = {'heros-vert': 'rgba(110,255,140,.85)', princesse: 'rgba(255,140,205,.85)', colosse: 'rgba(255,190,90,.85)', 'princesse-eaux': 'rgba(90,215,255,.85)'};
const REPLIQUES = {'heros-vert': 'En avant, en rythme !', princesse: 'Quel morceau on joue ?', colosse: 'Mes poings sont prêts.', 'princesse-eaux': 'Laisse couler la musique…'};
const FETE = {'heros-vert': 'Parfait !', princesse: 'En rythme !', colosse: 'Trop facile !', 'princesse-eaux': 'Une autre ?'};
const nomDe = id => (Poupee.fiches[id] || {}).nom || id;
const coupDe = id => (Poupee.fiches[id] || {}).coup || '';
// difficultés du chantier 1.1, avec les couleurs du logo déjà prévues dans le HUD (jeu/hud.js)
const DIFS = [{id: 'facile', nom: 'Facile', c: '#5ad66c', c1: '#8ef08f', c2: '#22a23c'},
              {id: 'normal', nom: 'Normal', c: '#4aa8ff', c1: '#86c6ff', c2: '#1f63d6'},
              {id: 'expert', nom: 'Expert', c: '#ff4a5a', c1: '#ff8a8a', c2: '#c8182c'}];
let comboForet = 0;
try { comboForet = partition().reduce((s, n) => s + (n.type === 'hold' ? 2 : 1), 0); } catch (e) {}
const MORCEAUX = [
  {id: 'gff', titre: "Great Fairy's Fountain", jeu: 'Zelda: Ocarina of Time', notes: {facile: 104, normal: 185, expert: 262}, extrait: {debut: 12.6, duree: 15}},
  {id: 'foret', titre: "Forêt d'émeraude", jeu: 'Composition originale', notes: {facile: Math.round(comboForet * .6) || 70, normal: comboForet || 118, expert: Math.round(comboForet * 1.4) || 165}, synth: true},
];
// records : ceux du téléphone s'il y en a (chantier 0.2), sinon des exemples pour voir les rubans
const EXEMPLES = {
  gff: {facile: {score: 9999999, rang: 'S', combo: 104, full: true}, normal: {score: 9412870, rang: 'A', combo: 151, full: false}, expert: {score: 7120455, rang: 'B', combo: 96, full: false}},
  foret: {normal: {score: 9874310, rang: 'S', combo: 118, full: true}},
};
const vrais = lire('rythme-records', {});
const recordDe = (id, dif) => {
  const r = (vrais[id] || {})[dif];
  if (r && r.score >= 0) return Object.assign({vrai: true}, r);
  return (EXEMPLES[id] || {})[dif] || null;
};

/* ---------- navigation entre les écrans (le geste « retour » du téléphone revient en arrière) ---------- */
const PARENT = {titre: null, menu: null, morceaux: 'menu', equipe: 'menu', options: 'menu', resultats: 'morceaux'};
let ecran = null;
const surEntree = {}, surSortie = {};
function aller(nom, pousser = true) {
  if (!document.getElementById(nom)) nom = 'menu';
  if (ecran === nom) return;
  if (ecran && surSortie[ecran]) surSortie[ecran]();
  if (ecran) oublierFilms();
  for (const e of $$('.ecran')) e.classList.toggle('actif', e.id === nom);
  ecran = nom;
  if (pousser) try { history.pushState({ecran: nom}, ''); } catch (e) {}
  preparerToiles();
  if (surEntree[nom]) surEntree[nom]();
}
addEventListener('popstate', e => aller((e.state && e.state.ecran) || PARENT[ecran] || 'menu', false));
document.addEventListener('click', e => {
  const a = e.target.closest('[data-aller]'); if (a) { aller(a.dataset.aller); return; }
  if (e.target.closest('[data-retour]')) { if (history.state && history.state.ecran && history.length > 1) history.back(); else aller(PARENT[ecran] || 'menu', false); }
});
let toastMin = null;
function toast(txt) { const t = $('#toast'); t.textContent = txt; t.classList.add('vu'); clearTimeout(toastMin); toastMin = setTimeout(() => t.classList.remove('vu'), 2200); }
async function pleinEcran() {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    await document.documentElement.requestFullscreen({navigationUI: 'hide'});
    try { await screen.orientation.lock('landscape'); } catch (e) {}
  } catch (e) { toast('Plein écran impossible ici : « Ajouter à l\'écran d\'accueil »'); }
}

/* ---------- toiles : persos, médaillons, portraits (redessinées seulement sur l'écran visible) ----------
   Comme dans le jeu (jeu/equipe.js), chaque animation d'un perso est PRÉ-DESSINÉE une fois (IMAGES images, recadrées
   au plus juste) : ensuite, un perso = une seule image recopiée, et seulement quand elle change (~10 fois par seconde).
   Une toile = {cv, ecran, l, h (en rem), figs : [{id, X, sol, taille, anim(t), dt}], clip, ombre} ou {peindre(x)} (fixe). */
const toiles = [];
function toile(cv, o) { const t = Object.assign({cv, ecran: cv.closest('.ecran').id, ctx: cv.getContext('2d'), figs: null}, o); toiles.push(t); return t; }
const fabriques = new Map();
function poupee(id, tailleRem, d = dpr()) {        // le perso, préparé à la bonne finesse (une seule fois par taille)
  const ech = tailleRem / 100 * remPx() * d, cle = id + '@' + ech.toFixed(2);
  if (!fabriques.has(cle)) fabriques.set(cle, Poupee.fabrique(id, {echelle: ech}));
  return fabriques.get(cle);
}
const IMAGES = 16, DUREES = {attente: 1.6, fete: .9}, CADRE = [-85, -150, 85, 14];   // cadre en unités de la poupée (saut et bras levés compris)
const films = new Map();
const dFilm = () => Math.min(2, dpr());   // finesse des images pré-dessinées (comme le jeu : 2 au plus)
function film(id, taille, anim) {
  const r = remPx(), d = dFilm(), cle = [id, taille.toFixed(3), anim, r, d].join('|');
  if (films.has(cle)) return films.get(cle);
  const fi = Poupee.fiches[id] || {}, k = taille / 100 * (fi.taille || 1), [x0, y0, x1, y1] = CADRE, e = r * d;
  const lp = Math.ceil((x1 - x0) * k * e), hp = Math.ceil((y1 - y0) * k * e), p = poupee(id, taille, d);
  const poses = [];
  for (let i = 0; i < IMAGES; i++) { const ps = pose(anim, i / IMAGES * DUREES[anim], id); if (anim === 'attente') ps.yeux = 'ouverts'; poses.push(ps); }
  if (anim === 'attente') poses.push(Object.assign({}, poses[0], {yeux: 'fermes'}));   // une image « clin d'œil »
  const brutes = []; let bx0 = lp, by0 = hp, bx1 = -1, by1 = -1;
  for (const ps of poses) {
    const c = document.createElement('canvas'); c.width = lp; c.height = hp;
    const x = c.getContext('2d', {willReadFrequently: true}); x.setTransform(e, 0, 0, e, 0, 0);
    Poupee.dessine(x, p, -x0 * k, -y0 * k, ps, {taille});
    const px = x.getImageData(0, 0, lp, hp).data;
    for (let y = 0; y < hp; y++) for (let X = 0, q = y * lp * 4 + 3; X < lp; X++, q += 4) if (px[q]) { if (X < bx0) bx0 = X; if (X > bx1) bx1 = X; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    brutes.push(c);
  }
  if (bx1 < 0) { bx0 = by0 = 0; bx1 = lp - 1; by1 = hp - 1; }
  const lc = bx1 - bx0 + 1, hc = by1 - by0 + 1;
  const images = brutes.map(c => { const n = document.createElement('canvas'); n.width = lc; n.height = hc; n.getContext('2d').drawImage(c, -bx0, -by0); return n; });
  const f = {images: images.slice(0, IMAGES), cligne: images[IMAGES], ox: -x0 * k - bx0 / e, oy: -y0 * k - by0 / e, l: lc / e, h: hc / e};
  films.set(cle, f);
  return f;
}
// l'image du film à l'instant t (avec un clin d'œil de temps en temps, comme dans le moule)
function imageA(f, anim, t) {
  if (anim === 'attente' && ((t + 2) % 3.4) < .13) return [f.cligne, -1];
  const i = Math.floor(((t / DUREES[anim]) % 1 + 1) % 1 * IMAGES) % IMAGES;
  return [f.images[i], i];
}
let OMBRE = null;   // ombre au sol, pré-dessinée
function ombre() {
  if (OMBRE) return OMBRE;
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 16, 0, 64, 16, 64); g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(.7, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.setTransform(1, 0, 0, .25, 0, 12); x.fillStyle = g; x.fillRect(0, -48, 128, 128);
  return OMBRE = c;
}
function preparerToiles() {
  const r = remPx(), d = dpr();
  for (const t of toiles) if (t.ecran === ecran) {
    const l = t.l || t.cv.offsetWidth / r, h = t.h || t.cv.offsetHeight / r;
    const W = Math.round(l * r * d), H = Math.round(h * r * d);
    if (t.cv.width !== W || t.cv.height !== H || t.rp !== r) {
      t.cv.width = W; t.cv.height = H; t.rp = r;
      if (t.l) { t.cv.style.width = l + 'rem'; t.cv.style.height = h + 'rem'; }
      t.sig = null;
      if (t.placer) t.placer(l, h);
    }
  }
}
let tDebut = performance.now();
function boucle(ms) {
  const t = FIGE ? 0 : (ms - tDebut) / 1000, r = remPx(), d = dpr();
  for (const o of toiles) {
    if (o.ecran !== ecran) continue;
    let choix = null, sig = 'fixe';
    if (o.figs) {
      choix = o.figs.map(fg => { const anim = fg.anim(t), f = film(fg.id, fg.taille, anim), dt = typeof fg.dt === 'function' ? fg.dt(t) : (fg.dt || 0), [img, i] = imageA(f, anim, t + dt); return [fg, f, img, i]; });
      sig = choix.map(c => c[0].id + c[3]).join(',') + (o.sigPlus ? o.sigPlus(t) : '');
    }
    if (o.sig === sig) continue;          // rien n'a changé : on ne redessine pas
    o.sig = sig;
    const x = o.ctx;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, o.cv.width, o.cv.height);
    x.setTransform(r * d, 0, 0, r * d, 0, 0);
    if (o.peindre) { o.peindre(x, t); continue; }
    if (o.clip) { x.save(); o.clip(x); x.clip(); }
    for (const [fg, f, img] of choix) {
      if (fg.ombre) x.drawImage(ombre(), fg.X - fg.taille * .24, fg.sol - fg.taille * .06, fg.taille * .48, fg.taille * .12);
      x.drawImage(img, fg.X - f.ox, fg.sol - f.oy, f.l, f.h);
    }
    if (o.clip) x.restore();
  }
  if (!FIGE || toiles.some(o => o.ecran === ecran && !o.sig)) requestAnimationFrame(boucle);
}
// on ne garde en mémoire que les films de l'écran visible
function oublierFilms() { films.clear(); fabriques.clear(); }
addEventListener('resize', () => { oublierFilms(); preparerToiles(); if (surRedim[ecran]) surRedim[ecran](); if (FIGE) requestAnimationFrame(boucle); });
const surRedim = {};
// un perso dans sa propre petite toile : pieds à « gauche » (CSS, ex. '27%') et à « sol » rem du bas de son parent
function placerPerso(parent, id, o) {
  const fi = Poupee.fiches[id] || {}, k = o.taille / 100 * (fi.taille || 1), [x0, y0, x1, y1] = CADRE;
  const l = (x1 - x0) * k, h = (y1 - y0) * k;
  const cv = document.createElement('canvas'); cv.className = 'fig';
  Object.assign(cv.style, {left: `calc(${o.gauche} - ${(-x0 * k).toFixed(3)}rem)`, bottom: (o.sol - y1 * k).toFixed(3) + 'rem'});
  parent.appendChild(cv);
  return toile(cv, {l, h, figs: [{id, X: -x0 * k, sol: -y0 * k, taille: o.taille, anim: o.anim || (() => 'attente'), dt: o.dt || 0, ombre: o.ombre}]});
}

// les poses : attente (le moule), et une petite fête pour les résultats (la vraie animation viendra avec le chantier 3.1)
// (bras : l'arme se lève vers le haut ; le bras du bouclier reste bas, sinon le bouclier cache le visage)
function pose(nom, t, id) {
  if (nom === 'repos') return Poupee.pose();
  if (nom === 'fete') {
    const u = (t / .9) % 1, air = Math.max(0, Math.sin(Math.min(1, u / .7) * Math.PI)), creux = u > .78 ? Math.sin((u - .78) / .22 * Math.PI) : 0;
    const haut = .55 + .45 * air, bouclier = !!(Poupee.fiches[id] || {}).bouclier;
    return Poupee.pose({y: -14 * air + 2.5 * creux, torse: -3 * air, tete: -5 * air, queue: 8 * air,
      brasD1: 20 * haut, brasD2: 110 * haut, arme: -140 * haut,
      brasG1: bouclier ? -22 * haut : -100 * haut, brasG2: bouclier ? 0 : -30 * haut, bouclier: 0,
      jambeD1: 16 * air, jambeD2: -36 * air, jambeG1: -8 * air, jambeG2: -32 * air, yeux: air > .35 ? 'fermes' : 'ouverts'});
  }
  return Poupee.poseA(nom, t);
}
// gros plan de la tête (comme le panneau du capitaine du HUD) ; TETE = où est la tête dans le repère des poupées
const TETE = {x: -1, y: -71, l: 60};
function portrait(x, id, cote) {
  const f = Poupee.fiches[id] || {}, k = cote * .95 / TETE.l, tl = k * 100 / (f.taille || 1);
  Poupee.dessine(x, poupee(id, tl), cote * .5 - TETE.x * k, cote * .56 - TETE.y * k, Poupee.pose(), {taille: tl});
}

/* ---------- petits dessins du jeu ---------- */
function croche(x, double) {   // la même que dans jeu/dessin.js (tête en 0,0, ~40 de haut)
  x.beginPath(); x.ellipse(0, 0, 9, 6.5, -.4, 0, 7); x.fill();
  x.fillRect(6, -33, 3.4, 33);
  if (double) {
    x.beginPath(); x.ellipse(22, -5, 9, 6.5, -.4, 0, 7); x.fill();
    x.fillRect(28, -38, 3.4, 33);
    x.beginPath(); x.moveTo(6, -33); x.lineTo(31.4, -38); x.lineTo(31.4, -30); x.lineTo(6, -25); x.closePath(); x.fill();
  } else {
    x.beginPath(); x.moveTo(9.4, -33); x.quadraticCurveTo(24, -25, 19, -9); x.quadraticCurveTo(18, -19, 9.4, -22); x.closePath(); x.fill();
  }
}
// jaquette : un petit tableau aux couleurs du morceau (même recette que le bandeau du HUD)
function jaquette(cv, titre) {
  const r = remPx() * dpr(), s = cv.offsetWidth * dpr() || 80;
  cv.width = cv.height = Math.round(s);
  const x = cv.getContext('2d'), hue = teinteDe(titre);
  let gr = x.createRadialGradient(s * .5, s * .42, 0, s * .5, s * .5, s * .75);
  gr.addColorStop(0, `hsl(${hue},85%,78%)`); gr.addColorStop(.45, `hsl(${hue},65%,46%)`); gr.addColorStop(1, `hsl(${(hue + 40) % 360},70%,14%)`);
  x.fillStyle = gr; x.fillRect(0, 0, s, s);
  const rnd = hasard(hue + 5);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const sx = rnd() * s, sy = rnd() * s * .7, sr = s * (.01 + rnd() * .035);
    const g2 = x.createRadialGradient(sx, sy, 0, sx, sy, sr * 3); g2.addColorStop(0, 'rgba(255,255,240,.95)'); g2.addColorStop(1, 'rgba(255,255,240,0)');
    x.fillStyle = g2; x.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  }
  x.globalCompositeOperation = 'source-over';
  x.save(); x.translate(s * .36, s * .52); x.scale(s / 70, s / 70);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 4 * dpr(); croche(x, true); x.restore();
  return r;
}
// logo de difficulté : la page à coin plié du HUD, croche de la couleur de la difficulté
const logoDif = c => `<svg viewBox="0 0 50 50"><path d="M4 4H46V35L35 46H4Z" fill="#1c0d04" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M35 46V35H46" fill="none" stroke="${c}" stroke-width="3"/><use href="#i-croche" x="11" y="8" width="24" height="30" fill="${c}"/></svg>`;
// roue dentée (icône des options)
function cheminRoue(n = 9, R = 20, r = 15, trou = 6.5) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, da = Math.PI / n;
    const p = (rr, aa) => `${(rr * Math.cos(aa)).toFixed(2)} ${(rr * Math.sin(aa)).toFixed(2)}`;
    d += (i ? 'L' : 'M') + p(r, a - da * .55) + 'L' + p(R, a - da * .32) + 'L' + p(R, a + da * .32) + 'L' + p(r, a + da * .55);
  }
  d += `ZM${trou} 0A${trou} ${trou} 0 1 0 ${-trou} 0A${trou} ${trou} 0 1 0 ${trou} 0Z`;
  return d;
}
const ROUE = cheminRoue();
$('#roueTitre').setAttribute('viewBox', '-21 -21 42 42');
$('#roueTitre').innerHTML = `<path d="${ROUE}" fill="currentColor" fill-rule="evenodd"/>`;

/* ---------- fonds dessinés par le code ---------- */
function svgUrl(svg) { return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`; }
function fondEtoiles(seed, tri) {
  const rnd = hasard(seed); let s = '';
  for (let i = 0; i < 16; i++) {
    const x = rnd() * 260, y = rnd() * 260, k = .12 + rnd() * .38, o = .18 + rnd() * .45;
    s += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)})" d="M0-20C1.4-7.6 7.6-1.4 20 0 7.6 1.4 1.4 7.6 0 20-1.4 7.6-7.6 1.4-20 0-7.6-1.4-1.4-7.6 0-20Z" fill="#fff" opacity="${o.toFixed(2)}"/>`;
  }
  for (let i = 0; i < 26; i++) s += `<circle cx="${(rnd() * 260).toFixed(1)}" cy="${(rnd() * 260).toFixed(1)}" r="${(.6 + rnd() * 1.4).toFixed(1)}" fill="#fff" opacity="${(.15 + rnd() * .4).toFixed(2)}"/>`;
  if (tri) for (let i = 0; i < 10; i++) {
    const x = rnd() * 260, y = rnd() * 260, k = 4 + rnd() * 6, a = rnd() * 360;
    s += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})" d="M0 ${-k}L${k * .87} ${k * .5}H${-k * .87}Z" fill="#fff" opacity="${(.15 + rnd() * .3).toFixed(2)}"/>`;
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260">${s}</svg>`);
}
function fondMosaique() {   // la toile de fond de la scène : des triangles bleus
  const rnd = hasard(77), L = 60, Hh = 52; let s = '';
  for (let row = 0; row < 5; row++) for (let col = -1; col < 9; col++) for (const bas of [0, 1]) {
    const x = col * L + (row % 2 ? L / 2 : 0) + (bas ? L / 2 : 0), y = row * Hh;
    const pts = bas ? `${x},${y} ${x + L},${y} ${x + L / 2},${y + Hh}` : `${x + L / 2},${y} ${x + L},${y + Hh} ${x},${y + Hh}`;
    const v = rnd(), c = v < .5 ? `rgba(255,255,255,${(v * .16).toFixed(3)})` : `rgba(0,10,50,${((v - .5) * .3).toFixed(3)})`;
    s += `<polygon points="${pts}" fill="${c}"/>`;
  }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260">${s}</svg>`);
}
function fondLambrequin() {  // le haut du rideau de scène : des drapés bleu nuit bordés de perles dorées
  let perles = '';
  for (let i = 1; i < 12; i++) { const u = i / 12, x = u * 120, y = (1 - u) * (1 - u) * 6 + 2 * (1 - u) * u * 34 + u * u * 6 - 3; perles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#ffd970"/>`; }
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="34"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16307e"/><stop offset="1" stop-color="#081745"/></linearGradient></defs><path d="M0 0H120V6Q60 34 0 6Z" fill="url(#g)"/><path d="M0 6Q60 34 120 6" fill="none" stroke="#e8b84c" stroke-width="1.6"/>${perles}</svg>`);
}
$('#menu .mosaique').style.backgroundImage = fondMosaique();
$('#menu .lambrequin').style.backgroundImage = fondLambrequin();
$('#morceaux .etoiles').style.backgroundImage = fondEtoiles(11, false);
$('#equipe .etoiles').style.backgroundImage = fondEtoiles(23, true);
{ // quelques confettis sur la scène
  const rnd = hasard(5), cols = ['#ffd35a', '#ff7ab8', '#7fe8ff', '#9dff8a', '#ffffff'];
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    Object.assign(c.style, {left: (6 + rnd() * 88) + '%', top: (48 + rnd() * 30) + '%', background: cols[i % cols.length], animationDelay: (-rnd() * 6) + 's', opacity: .7});
    $('#menu').insertBefore(c, $('#menu .cadre'));
  }
}

/* ============ 0 · Écran titre ============ */
$('#titre').style.backgroundImage = 'url(decors/gff.webp?v=1)';
EQUIPE.forEach((id, i) => placerPerso($('#titre .cadre'), id, {gauche: `calc(50% + ${((i - 1.5) * 12 * .82).toFixed(2)}rem)`, sol: 1.4, taille: 12, dt: i * .37, ombre: true}));
$('#titre').addEventListener('click', () => { pleinEcran(); aller('menu'); });

/* ============ 1 · Menu principal ============ */
// médaillons des bannières : les persos sortent du rond (le bas est coupé par le rond, la tête dépasse)
for (const cv of $$('#menu canvas[data-pop]')) {
  const ids = cv.dataset.pop.split(',');
  if (ids[0] === 'roue') {   // options : une roue dentée dorée qui tourne doucement (image, tournée par le navigateur)
    const med = cv.parentElement.querySelector('.medaillon'); cv.parentElement.removeChild(cv);
    med.insertAdjacentHTML('beforeend', `<svg class="roue-med" viewBox="-21 -21 42 42"><defs><radialGradient id="ro" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff7c8"/><stop offset=".55" stop-color="#ffd04a"/><stop offset="1" stop-color="#cf870a"/></radialGradient></defs><path d="${ROUE}" fill="url(#ro)" fill-rule="evenodd"/></svg><svg class="croche-med"><use href="#i-double"/></svg>`);
    continue;
  }
  const [a, b] = ids, taille = 14.6, kb = 1 / Math.sqrt((Poupee.fiches[b] || {}).taille || 1), cx = 10.5, cy = 11.7, R = 5.7;
  toile(cv, {l: 21, h: 17.4, clip(x) { x.beginPath(); x.rect(0, 0, 21, cy); x.moveTo(cx + R, cy); x.arc(cx, cy, R, 0, Math.PI * 2); },
    figs: [{id: b, X: cx + 3.6, sol: cy + 6.4, taille: taille * .9 * kb, anim: () => 'attente', dt: .5}, {id: a, X: cx - 2.4, sol: cy + 7.8, taille, anim: () => 'attente', dt: 0}]});
}
{ // étincelles autour de la bannière choisie
  const b = $('#menu .banniere.choisie');
  [[4, 22], [86, 18], [92, 62], [8, 70], [50, -6]].forEach(([l, tp], i) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'etincelle');
    s.innerHTML = '<use href="#i-etoile"/>'; s.style.left = l + '%'; s.style.top = tp + '%'; s.style.animationDelay = (i * .27) + 's'; s.style.fill = 'currentColor';
    b.appendChild(s);
  });
}
for (const b of $$('#menu .banniere')) b.addEventListener('pointerdown', () => { $('#aideMenu').textContent = b.dataset.aide; });
$('#bPlein').onclick = pleinEcran;
$('#bCombat').onclick = () => toast('Le combat arrive plus tard (chantiers 4.2 et 4.3)');
// la scène : l'équipe sur ses socles, et une bulle qui passe d'un perso à l'autre
{
  const scene = $('#scene'), pos = [.27, .42, .58, .73];
  EQUIPE.forEach((id, i) => {
    const s = document.createElement('div'); s.className = 'socle'; s.style.left = (pos[i] * 100) + '%'; s.style.bottom = '1.2rem'; s.style.setProperty('--s', SOCLES[id]);
    scene.appendChild(s);
  });
  EQUIPE.forEach((id, i) => placerPerso(scene, id, {gauche: (pos[i] * 100) + '%', sol: 2.6, taille: 12.6, dt: i * .41}));
  const bulle = document.createElement('div'); bulle.className = 'bulle'; scene.appendChild(bulle);
  let n = 0;
  const parle = () => {
    const id = EQUIPE[n % 4]; bulle.textContent = REPLIQUES[id];
    bulle.style.left = `calc(${pos[n % 4] * 100}% - 4.4rem)`; bulle.style.top = '.5rem'; bulle.style.setProperty('--q', '4.4rem');
    bulle.classList.remove('pop'); void bulle.offsetWidth; bulle.classList.add('pop'); n++;
  };
  parle(); if (!FIGE) setInterval(() => { if (ecran === 'menu') parle(); }, 3600);
}

/* ============ 2 · Choix du morceau ============ */
let choix = 0, dif = 'normal';
const carrousel = $('#carrousel');
const reglagesJeu = Object.assign({vitesse: 1.6, decalage: 0, performances: true}, lire('rythme-reglages', {}));
function construireCarrousel() {
  carrousel.innerHTML = '';
  MORCEAUX.forEach((m, i) => {
    const c = document.createElement('button'); c.className = 'carte'; c.dataset.i = i;
    c.innerHTML = `<span class="etiquette"><svg style="width:1.3rem;height:1.3rem;fill:#fff"><use href="#i-play"/></svg>Jouer</span><canvas></canvas><span class="nom">${m.titre}</span><span class="rg"></span><span class="ruban"></span>`;
    carrousel.appendChild(c);
  });
  for (let i = 0; i < 6; i++) {
    const v = document.createElement('div'); v.className = 'carte vide'; v.style.scrollSnapAlign = 'none';
    v.innerHTML = '<svg><use href="#i-croche"/></svg>Bientôt'; carrousel.appendChild(v);
  }
}
function majCartes() {
  $$('.carte[data-i]', carrousel).forEach(c => {
    const m = MORCEAUX[+c.dataset.i], r = recordDe(m.id, dif), rg = c.querySelector('.rg'), rb = c.querySelector('.ruban');
    c.classList.toggle('choisie', +c.dataset.i === choix);
    rg.textContent = r ? r.rang : ''; rg.style.display = r ? '' : 'none';
    rb.className = 'ruban ' + (r && r.full ? 'or' : 'bleu'); rb.textContent = r ? (r.full ? 'FULL COMBO' : 'RÉUSSI') : ''; rb.style.display = r ? '' : 'none';
  });
}
function majInfos() {
  const m = MORCEAUX[choix], d = DIFS.find(x => x.id === dif), r = recordDe(m.id, dif);
  $('#mTitre').textContent = m.titre; $('#mJeu').textContent = m.jeu;
  $('#difs').innerHTML = DIFS.map(x => `<button class="dif${x.id === dif ? ' choisi' : ''}" data-dif="${x.id}" style="--d1:${x.c1};--d2:${x.c2}">${logoDif(x.id === dif ? '#fff' : x.c)}<span class="ct-fin" style="--b:${x.id === dif ? x.c2 : 'transparent'}">${x.nom}</span></button>`).join('');
  const ex = r && !r.vrai ? '<span class="exemple">ex.</span>' : '';
  $('#mInfos').innerHTML = `
    <div class="l"><span>Notes</span><span class="v">${m.notes[dif]}</span></div>
    <div class="l"><span>Record</span><span class="v">${r ? espaces(r.score) + ex : '—'}</span></div>
    <div class="l"><span>Rang</span><span class="v">${r ? `<span class="lettre" style="font-size:2.3rem">${r.rang}</span>` : '—'}</span></div>
    <div class="l"><span>Combo max</span><span class="v">${r ? `${r.combo} / ${m.notes[dif]}` : '—'}${r && r.full ? '<span class="ruban or" style="height:1.8rem;font-size:1rem;margin-left:.4rem">FULL COMBO</span>' : ''}</span></div>`;
  $('#marqueEx').style.visibility = r && !r.vrai ? '' : 'hidden';
  majCartes();
}
function choisir(i, centrer = true, ecouter = true) {
  choix = i; majInfos();
  const c = carrousel.querySelector(`.carte[data-i="${i}"]`);
  if (centrer && c) carrousel.scrollTo({left: c.offsetLeft - (carrousel.clientWidth - c.offsetWidth) / 2, behavior: FIGE ? 'auto' : 'smooth'});
  if (ecouter) Extrait.jouer(MORCEAUX[i]);
}
carrousel.addEventListener('click', e => {
  const c = e.target.closest('.carte[data-i]'); if (!c) return;
  if (+c.dataset.i === choix) lancer(); else choisir(+c.dataset.i);
});
let finDefil = null;
carrousel.addEventListener('scroll', () => {
  const p = $('#poignee'), max = carrousel.scrollWidth - carrousel.clientWidth, piste = p.parentElement.clientWidth - p.offsetWidth;
  p.style.left = (max > 0 ? carrousel.scrollLeft / max * piste : 0) + 'px';
  clearTimeout(finDefil);
  finDefil = setTimeout(() => {   // la jaquette au centre devient la jaquette choisie
    const mil = carrousel.scrollLeft + carrousel.clientWidth / 2;
    let best = choix, dmin = 1e9;
    for (const c of $$('.carte[data-i]', carrousel)) { const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mil); if (dd < dmin) { dmin = dd; best = +c.dataset.i; } }
    if (best !== choix && dmin < carrousel.clientWidth * .2) choisir(best, false);
  }, 180);
}, {passive: true});
$('#difs').addEventListener('click', e => { const b = e.target.closest('.dif'); if (b) { dif = b.dataset.dif; majInfos(); } });
$('#bExtrait').onclick = () => Extrait.actif ? Extrait.arreter() : Extrait.jouer(MORCEAUX[choix]);
function lancer() { Extrait.arreter(); toast('Maquette : la partie se jouerait ici… voici l\'écran de fin'); aller('resultats'); }
$('#bJouer').onclick = lancer;
let equipeM = [];   // l'équipe au centre (plus petite si l'écran est étroit, iPhone)
function placerEquipeM() {
  const box = $('#mEquipe');
  for (const t of equipeM) { box.removeChild(t.cv); toiles.splice(toiles.indexOf(t), 1); }
  const L = box.clientWidth / remPx(), taille = Math.min(12.2, L / 2.2), place = [[.17, 0], [.39, 1.3], [.61, 0], [.83, 1.3]];
  equipeM = [1, 3, 0, 2].map(i => placerPerso(box, EQUIPE[i], {gauche: (place[i][0] * 100) + '%', sol: 1.6 + place[i][1], taille, dt: i * .41, ombre: true}));
  preparerToiles();
}
surRedim.morceaux = placerEquipeM;
surEntree.morceaux = () => {
  if (!carrousel.children.length) construireCarrousel();
  if (!equipeM.length) placerEquipeM();
  requestAnimationFrame(() => {
    for (const c of $$('.carte[data-i] canvas', carrousel)) jaquette(c, MORCEAUX[+c.closest('.carte').dataset.i].titre);
    choisir(choix, true, false);
  });
};
surSortie.morceaux = () => Extrait.arreter();

/* ---------- extrait musical du morceau choisi ----------
   Great Fairy's Fountain : la vraie musique (déchiffrée avec la clé du téléphone, depuis le cache du jeu si elle y est).
   Forêt d'émeraude : le synthé du jeu (jeu/son.js et jeu/foret.js), couplet 1. En boucle, avec fondu. */
const Extrait = {
  actif: null, jeton: 0, src: null, gain: null, minuteur: null, buffers: {},
  etat(txt, lecture) { $('#extraitEtat').textContent = txt; $('#bExtrait').classList.toggle('lecture', !!lecture); },
  arreter() {
    this.jeton++; this.actif = null; clearTimeout(this.minuteur); clearInterval(this.prog);
    if (this.src && actx) { const s = this.src, g = this.gain; g.gain.setTargetAtTime(0, actx.currentTime, .12); setTimeout(() => { try { s.stop(); } catch (e) {} }, 700); }
    this.src = null;
    if (bus && actx) bus.gain.setTargetAtTime(0, actx.currentTime, .1);
    this.etat('Touche pour écouter', false);
  },
  async jouer(m) {
    this.arreter(); const j = this.jeton; this.actif = m.id;
    try { initAudio(); if (actx.state !== 'running') await actx.resume(); } catch (e) { this.etat('Son indisponible'); return; }
    if (m.synth) return this.synth(j);
    this.etat('Chargement…', false);
    let buf = this.buffers[m.id];
    if (!buf) {
      try { buf = this.buffers[m.id] = await musique(m.id); }
      catch (e) { if (j === this.jeton) { this.actif = null; this.etat(e.message === 'cle' ? 'Mot de passe à taper dans le jeu' : 'Extrait indisponible'); } return; }
    }
    if (j !== this.jeton) return;
    const tour = () => {
      if (j !== this.jeton) return;
      const {debut, duree} = m.extrait, T = actx.currentTime + .05;
      const s = actx.createBufferSource(), g = actx.createGain(); s.buffer = buf; s.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(.9, T + .6); g.gain.setValueAtTime(.9, T + duree - 1.6); g.gain.linearRampToValueAtTime(0, T + duree);
      s.start(T, debut, duree); this.src = s; this.gain = g;
      this.minuteur = setTimeout(tour, (duree + .6) * 1000);
    };
    tour(); this.etat('En écoute · touche pour couper', true);
  },
  synth(j) {   // couplet 1 de « Forêt d'émeraude » (mesures 4 à 11), joué par le synthé du jeu
    const t0x = tb(4, 0), t1x = tb(12, 0), evs = evenementsAudio().filter(e => e.t >= t0x && e.t < t1x);
    const tour = () => {
      if (j !== this.jeton) return;
      nouveauBus(); bus.gain.value = 0; bus.gain.setTargetAtTime(.85, actx.currentTime, .15);
      const base = actx.currentTime + .1 - t0x; let k = 0;
      clearInterval(this.prog);
      this.prog = setInterval(() => {
        if (j !== this.jeton) { clearInterval(this.prog); return; }
        while (k < evs.length && base + evs[k].t < actx.currentTime + .3) { const e = evs[k++]; if (SON[e.k]) SON[e.k](e, base + e.t); }
        if (k >= evs.length) clearInterval(this.prog);
      }, 50);
      bus.gain.setTargetAtTime(0, actx.currentTime + (t1x - t0x) - .6, .3);
      this.minuteur = setTimeout(tour, (t1x - t0x + .8) * 1000);
    };
    tour(); this.etat('En écoute · touche pour couper', true);
  },
};
// musique d'un niveau en ligne : cache du jeu (IndexedDB) ou téléchargement, puis déchiffrement avec la clé du téléphone
async function musique(id) {
  let brut = null; try { brut = localStorage.getItem('jeu-rythme-cle'); } catch (e) {}
  if (!brut) throw new Error('cle');
  const b64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  const cle = await crypto.subtle.importKey('raw', b64(brut), {name: 'AES-GCM'}, false, ['decrypt']);
  const cat = await (await fetch('niveaux/index.json', {cache: 'no-cache'})).json(), n = cat.niveaux.find(v => v.id === id), k = `${id}@${n.version}`;
  let octets = await new Promise(ok => {
    try {
      const r = indexedDB.open('jeu-rythme', 2);
      r.onupgradeneeded = () => { for (const s of ['mp3', 'musiques']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
      r.onsuccess = () => { try { const q = r.result.transaction('musiques').objectStore('musiques').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); } catch (e) { ok(null); } };
      r.onerror = () => ok(null);
    } catch (e) { ok(null); }
  });
  if (!octets) { const d = await (await fetch(`niveaux/${id}.json?v=${n.version}`)).json(); octets = await (await fetch(`${d.musique}?v=${n.version}`)).arrayBuffer(); }
  const o = new Uint8Array(octets);
  return actx.decodeAudioData(await crypto.subtle.decrypt({name: 'AES-GCM', iv: o.slice(0, 12)}, cle, o.slice(12)));
}

/* ============ 3 · Équipe ============ */
let membre = 0;
{
  const box = $('#portraits');
  EQUIPE.forEach((id, i) => {
    const m = document.createElement('button'); m.className = 'membre'; m.dataset.i = i;
    m.innerHTML = `<div class="cadre-p"><canvas></canvas><div class="nomp ct-fin">${nomDe(id)}</div></div>
      ${i === 0 ? '<span class="chef" title="Capitaine"><svg><use href="#i-couronne"/></svg></span>' : ''}<span class="choix"></span>
      <span class="pastille"><svg><use href="#i-epee"/></svg><span>${ARMES[id]}</span></span>
      <span class="pastille"><svg><use href="#i-eclair"/></svg><span>${coupDe(id)}</span></span>`;
    box.appendChild(m);
    toile(m.querySelector('canvas'), {peindre(x) { portrait(x, id, 11.6); }});
  });
  box.addEventListener('click', e => { const m = e.target.closest('.membre'); if (m) { membre = +m.dataset.i; majMembre(); } });
}
const vedette = placerPerso($('#vedette'), EQUIPE[0], {gauche: '50%', sol: 2.6, taille: 17.5});
function majMembre() {
  const id = EQUIPE[membre];
  $$('.membre').forEach(m => m.classList.toggle('choisi', +m.dataset.i === membre));
  Object.assign(vedette.figs[0], {id, taille: 17.5 / ((Poupee.fiches[id] || {}).taille || 1)}); vedette.sig = null;   // même hauteur pour tous
  $('#fRole').innerHTML = membre === 0 ? '<svg><use href="#i-couronne"/></svg>Capitaine' : '<svg><use href="#i-etoile"/></svg>Équipier';
  $('#fNom').textContent = nomDe(id);
  $('#fSous').textContent = membre === 0 ? 'Chef de l\'équipe' : 'Membre de l\'équipe';
  $('#fDesc').innerHTML = `Arme : ${ARMES[id].toLowerCase()} · Coup spécial : « ${coupDe(id)} »`;
  $('#vedette .socle').style.setProperty('--s', SOCLES[id]);
}
majMembre();

/* ============ 4 · Résultats ============ */
const RES = {morceau: MORCEAUX[0], dif: 'normal', score: 9734211, rang: 'S', combo: 185, total: 185,
  jug: [['CRITICAL', 'j-crit', 171], ['GREAT', 'j-great', 11], ['GOOD', 'j-good', 3], ['MISS', 'j-miss', 0]], full: true,
  ancien: {score: 9412870, rang: 'A'}};
{
  const d = DIFS.find(x => x.id === RES.dif);
  $('#rTitre').innerHTML = `${logoDif(d.c)}<span>${RES.morceau.titre}</span>`;
  $('#rJeu').textContent = RES.morceau.jeu;
  $('#rJug').innerHTML = RES.jug.map(([n, c]) => `<div><b class="${c}">${n}</b><span>0</span></div>`).join('');
  $('#rAncien').textContent = $('#rAncien').dataset.t = espaces(RES.ancien.score); $('#rAncienRang').textContent = RES.ancien.rang;
  $('#rRang').textContent = RES.rang;
  // macaron « Full combo » (dessin original : sceau doré en étoile, rubans rouges)
  let pts = ''; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 40 : 47; pts += `${(50 + rr * Math.cos(a)).toFixed(1)},${(50 + rr * Math.sin(a)).toFixed(1)} `; }
  $('#macaron').innerHTML = `<defs><linearGradient id="mo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ffcc3a"/><stop offset="1" stop-color="#d08a0a"/></linearGradient>
    <linearGradient id="mb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4ff"/><stop offset="1" stop-color="#1a4fc0"/></linearGradient></defs>
    <path d="M30 70l-10 28 11-5 7 9 8-26zM70 70l10 28-11-5-7 9-8-26z" fill="#e2333a" stroke="#7a0f15" stroke-width="1.5"/>
    <polygon points="${pts}" fill="url(#mo)" stroke="#8a5200" stroke-width="1.6"/>
    <circle cx="50" cy="50" r="31" fill="url(#mb)" stroke="#fff" stroke-width="3"/>
    <use href="#i-etoile" x="42" y="18" width="16" height="16" fill="#fff8c8"/>
    <text x="50" y="52" text-anchor="middle" font-family="Rond" font-weight="800" font-size="15" fill="#fff" stroke="#0b2466" stroke-width="4" paint-order="stroke" letter-spacing=".5">FULL</text>
    <text x="50" y="68" text-anchor="middle" font-family="Rond" font-weight="800" font-size="13.5" fill="#fff" stroke="#0b2466" stroke-width="4" paint-order="stroke">COMBO</text>`;
  $('#macaron').style.display = RES.full ? '' : 'none';
  // éclats autour du rang
  const ec = $('#eclat'); for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = '<use href="#i-etoile"/>';
    s.style.setProperty('--dx', (Math.cos(a) * 7) + 'rem'); s.style.setProperty('--dy', (Math.sin(a) * 6) + 'rem'); s.style.fill = 'currentColor';
    const i2 = document.createElement('i'); i2.appendChild(s); s.setAttribute('class', 'ico'); ec.appendChild(i2);
  }
  // les 4 persos qui fêtent, chacun dans sa carte penchée, avec sa bulle
  EQUIPE.forEach((id, i) => {
    const c = document.createElement('div'); c.className = 'carte-p';
    c.innerHTML = `<div class="dedans"><canvas class="fig"></canvas></div><div class="nom ct-fin">${nomDe(id)}</div>`;
    $('#rPersos').appendChild(c);
    const b = document.createElement('div'); b.className = 'bulle'; b.textContent = FETE[id]; $('#rBulles').appendChild(b);
    const cv = c.querySelector('canvas'); Object.assign(cv.style, {left: 0, top: 0, width: '100%', height: '100%'});
    const enFete = t => FIGE || t - tRes > 3.3;
    toile(cv, {placer(l, h) { Object.assign(this.figs[0], {X: l * .5, sol: h - 3.4, taille: Math.min(17.6, (l - 3) * 1.9) / Math.sqrt((Poupee.fiches[id] || {}).taille || 1)}); },   // l - 3 = largeur de la carte
      figs: [{id, X: 5, sol: 20, taille: 17.6 / Math.sqrt((Poupee.fiches[id] || {}).taille || 1), ombre: true,
        anim: t => enFete(t) ? 'fete' : 'attente', dt: t => FIGE ? .32 + i * .09 : enFete(t) ? -tRes - 3.3 + i * .12 : i * .4}]});
  });
}
function placerBulles() {   // chaque bulle au-dessus de sa carte
  const cartes = $$('#rPersos .carte-p'), cadre = $('#resultats .cadre').getBoundingClientRect(), r = remPx();
  $$('#rBulles .bulle').forEach((b, i) => {
    const cr = cartes[i].getBoundingClientRect();
    b.style.maxWidth = cartes[i].offsetWidth + 'px';   // largeur de la carte sans le penché
    b.style.fontSize = cartes[i].offsetWidth < 9 * r ? '1rem' : ''; b.style.padding = cartes[i].offsetWidth < 9 * r ? '.45rem .7rem' : '';
    b.style.left = (cr.left - cadre.left + cr.width / 2 - b.offsetWidth / 2) + 'px'; b.style.top = Math.max(.2 * r, cr.top - cadre.top - b.offsetHeight - .9 * r) + 'px';
  });
}
let tRes = -99, compteurs = [];
function compter(el, fin, retard, duree) {
  const t0 = performance.now() + retard, maj = v => { el.textContent = espaces(v); if (el.classList.contains('grad')) el.dataset.t = el.textContent; };
  if (FIGE) { maj(fin); return; }
  maj(0);
  const pas = ms => {
    const u = Math.min(1, Math.max(0, (ms - t0) / duree)), e = 1 - Math.pow(1 - u, 3);
    maj(Math.round(fin * e)); if (u < 1 && ecran === 'resultats') compteurs.push(requestAnimationFrame(pas));
  };
  compteurs.push(requestAnimationFrame(pas));
}
function jouerResultats() {
  compteurs.forEach(cancelAnimationFrame); compteurs = [];
  const e = $('#resultats'); e.classList.remove('joue'); void e.offsetWidth; e.classList.add('joue');
  tRes = (performance.now() - tDebut) / 1000;
  compter($('#rScore'), RES.score, 450, 1600);
  compter($('#rCombo'), RES.combo, 650, 1300);
  $$('#rJug span').forEach((s, i) => compter(s, RES.jug[i][2], 750 + i * 180, 900));
}
surEntree.resultats = () => {
  jaquette($('#rJaq'), RES.morceau.titre);
  requestAnimationFrame(() => { placerBulles(); jouerResultats(); });
};
addEventListener('resize', () => { if (ecran === 'resultats') placerBulles(); });
$('#bRejouer').onclick = () => { toast('Maquette : on rejouerait le morceau'); jouerResultats(); };

/* ============ 5 · Options ============ */
// la maquette montre les réglages du téléphone mais ne les enregistre pas
const VITESSES = [2.1, 1.6, 1.25];
const OPTIONS = [
  {lib: 'Vitesse des notes', type: 'curseur', valeurs: ['Lente', 'Normale', 'Rapide'], v: Math.max(0, VITESSES.indexOf(reglagesJeu.vitesse)),
   aide: 'Vitesse des notes : plus rapide, elles arrivent plus vite et sont plus espacées.'},
  {lib: 'Volume de la musique', type: 'curseur', valeurs: ['Non', '1', '2', '3', '4', '5'], v: 5, aide: 'Volume de la musique des morceaux.'},
  {lib: 'Sons de frappe', sous: 'Petit son à chaque note', type: 'curseur', valeurs: ['Non', '1', '2', '3', '4', '5'], v: 3,
   aide: 'Un petit son quand tu touches une note (prévu avec le chantier 1.3).'},
  {lib: 'Réglage du son', sous: 'Décalage en millisecondes', type: 'curseur', min: -150, max: 150, pas: 5, v: reglagesJeu.decalage || 0,
   grad: ['-150', '-75', '0', '+75', '+150'], bouton: 'Guidé',
   aide: 'Si les notes semblent en avance ou en retard sur la musique. « Guidé » : tu tapes en rythme, le jeu règle tout seul (chantier 1.3).'},
  {lib: 'Afficher les performances', sous: 'Images par seconde', type: 'bascule', v: reglagesJeu.performances !== false,
   aide: 'Le compteur d\'images par seconde sous le titre, pendant la partie (phase de test).'},
  {lib: 'Plein écran', type: 'action', bouton: 'Activer', etat: 'Cache les barres du téléphone',
   aide: 'Pour jouer comme une appli : menu du navigateur, « Ajouter à l\'écran d\'accueil ».'},
  {lib: 'Mot de passe familial', type: 'mdp', bouton: 'Clé de secours',
   aide: 'Il déverrouille les musiques. La clé de secours sert si on oublie le mot de passe : à garder pour soi.'},
];
function ligneOption(o, i) {
  const el = document.createElement('div'); el.className = 'opt'; el.dataset.i = i;
  let droite = '';
  if (o.type === 'curseur') {
    const grad = o.valeurs || o.grad, n = grad.length;
    droite = `<div class="curseur"><div class="graduations">${grad.map((g, k) => `<span style="left:${k / (n - 1) * 100}%">${g}</span>`).join('')}</div><div class="rail"><div class="rempli"></div><div class="bouton"></div></div></div><div class="valeur"></div>`
      + (o.bouton ? `<button class="act">${o.bouton}</button>` : '');
  } else if (o.type === 'bascule') droite = `<div class="interrupteur"><button class="bascule"><span>Non</span><span>Oui</span><i></i></button></div>`;
  else if (o.type === 'action') droite = `<div class="etat">${o.etat}</div><button class="act">${o.bouton}</button>`;
  else if (o.type === 'mdp') {
    let ok = false; try { ok = !!localStorage.getItem('jeu-rythme-cle'); } catch (e) {}
    droite = `<div class="etat">${ok ? '<svg><use href="#i-ok"/></svg>Déverrouillé sur ce téléphone' : 'Pas encore tapé sur ce téléphone'}</div><button class="act">${ok ? o.bouton : 'Taper'}</button>`;
  }
  el.innerHTML = `<div class="lib ct-fin">${o.lib}${o.sous ? `<small>${o.sous}</small>` : ''}</div>${droite}`;
  return el;
}
function majOption(el, o) {
  if (o.type === 'curseur') {
    const u = o.valeurs ? o.v / (o.valeurs.length - 1) : (o.v - o.min) / (o.max - o.min);
    el.querySelector('.rempli').style.width = (u * 100) + '%'; el.querySelector('.bouton').style.left = (u * 100) + '%';
    el.querySelector('.valeur').textContent = o.valeurs ? o.valeurs[o.v] : `${o.v > 0 ? '+' : ''}${o.v} ms`;
  } else if (o.type === 'bascule') el.querySelector('.bascule').classList.toggle('oui', o.v);
}
{
  const liste = $('#liste');
  OPTIONS.forEach((o, i) => { const el = ligneOption(o, i); liste.appendChild(el); majOption(el, o); });
  const choisirLigne = el => { $$('.opt', liste).forEach(x => x.classList.toggle('choisie', x === el)); $('#aideOpt').textContent = OPTIONS[+el.dataset.i].aide; };
  choisirLigne(liste.firstElementChild);
  const barre = $('#barreOpt'), majBarre = () => {
    const max = liste.scrollHeight - liste.clientHeight, h = liste.clientHeight / liste.scrollHeight * barre.parentElement.clientHeight;
    barre.style.height = h + 'px'; barre.style.top = (max > 0 ? liste.scrollTop / max * (barre.parentElement.clientHeight - h) : 0) + 'px';
  };
  liste.addEventListener('scroll', majBarre, {passive: true}); surEntree.options = () => requestAnimationFrame(majBarre);
  liste.addEventListener('pointerdown', e => { const el = e.target.closest('.opt'); if (el) choisirLigne(el); });
  // curseurs : on touche ou on fait glisser n'importe où sur la piste
  for (const el of $$('.opt', liste)) {
    const o = OPTIONS[+el.dataset.i], c = el.querySelector('.curseur');
    if (c) {
      const regle = e => {
        const r = c.querySelector('.rail').getBoundingClientRect(), u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        o.v = o.valeurs ? Math.round(u * (o.valeurs.length - 1)) : Math.round((o.min + u * (o.max - o.min)) / o.pas) * o.pas;
        majOption(el, o);
      };
      c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); regle(e); });
      c.addEventListener('pointermove', e => { if (c.hasPointerCapture(e.pointerId)) regle(e); });
    }
    const b = el.querySelector('.bascule'); if (b) b.onclick = () => { o.v = !o.v; majOption(el, o); };
    const a = el.querySelector('.act');
    if (a) a.onclick = () => {
      if (o.type === 'action') pleinEcran();
      else if (o.bouton === 'Guidé') toast('Le réglage guidé arrive avec le chantier 1.3');
      else toast('Dans le jeu : la fenêtre du mot de passe ou de la clé de secours');
    };
  }
}

/* ---------- images chiffrées des persos (épée et bouclier du héros, emblèmes) si le jeu est déverrouillé ---------- */
(async () => {
  try {
    const brut = localStorage.getItem('jeu-rythme-cle'); if (!brut || !Poupee.paquets.length) return;
    const k = await crypto.subtle.importKey('raw', Uint8Array.from(atob(brut), c => c.charCodeAt(0)), {name: 'AES-GCM'}, false, ['decrypt']);
    if (await Poupee.chargerImages(k)) { oublierFilms(); for (const t of toiles) t.sig = null; if (FIGE) requestAnimationFrame(boucle); }
  } catch (e) {}
})();

/* ---------- démarrage ---------- */
const depart = Q.get('ecran') || 'titre';
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  try { history.replaceState({ecran: depart}, ''); } catch (e) {}
  aller(depart, false);
  requestAnimationFrame(boucle);
});
window.maquette = {aller, toiles};   // pour les captures
})();
