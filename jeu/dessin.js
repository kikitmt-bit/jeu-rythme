/* ============================================================
   Dessin : images pré-dessinées (notes, cibles, effets, textes), décor, mise en page, effets, et l'image de chaque instant.
   ============================================================ */
"use strict";
/* ============================================================
   Dessin : préparation des images (sprites)
   ============================================================ */
const g = cv.getContext('2d', {alpha: false});
let W = 0, H = 0, DPR = 1, R = 0, RN = 0, XFAR = 0;
const CX = [0, 0, 0, 0], CY = [0, 0, 0, 0];   // position des 4 cibles
function toile(n, h = n) { const c = document.createElement('canvas'); c.width = n; c.height = h; return [c, c.getContext('2d')]; }
const rond = (x, r) => { x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); };

/* ============================================================
   Look façon Final Bar Line (captures de Kiki, 13/11) : notes, cibles, effets, textes du HUD.
   Polices dans polices/ (licence OFL) : Cinzel pour les chiffres et les mots (CHAIN, CRITICAL, TIME),
   Libre Baskerville pour le titre du morceau.
   ============================================================ */
const POLICE = 'Cinzel,"Times New Roman",serif', POLICE_TITRE = '"Libre Baskerville",Georgia,serif';
const POLICE_SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function chargerPolices() {
  if (!window.FontFace || !document.fonts) return Promise.resolve();
  return Promise.all([['Cinzel', 'cinzel-700', '700'], ['Cinzel', 'cinzel-900', '900'], ['Libre Baskerville', 'libre-baskerville-700', '700']]
    .map(([nom, f, w]) => new FontFace(nom, `url(polices/${f}.woff2)`, {weight: w}).load().then(p => document.fonts.add(p)).catch(() => {})));
}
// chemin d'un rectangle aux coins arrondis
function rr(x, l, t, w, h, r) {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
}

/* Couleurs des trois sortes de notes : [clair, vif, foncé, nuit] */
const TEINTES = {tap: ['#ff7a7a', '#f2141f', '#8a0010', '#3a0006'], hold: ['#a4ffa4', '#1fd640', '#0b6a1c', '#03290a'], swipe: ['#ffe98a', '#ffbd0a', '#a86a00', '#2c1c00']};

/* Une note (toile de 160 px, rayon 64) : rouge = taper, verte = maintenir (gros point blanc au centre),
   dorée = glisser (pastille dorée au centre, la flèche est peinte par-dessus) */
function bille(type, k = 1) {
  const [clair, vif, fonce, nuit] = TEINTES[type];
  const [c, x] = toile(Math.ceil(160 * k)); x.scale(k, k); x.translate(80, 80);
  let gr = x.createRadialGradient(0, 0, 52, 0, 0, 80);
  gr.addColorStop(0, vif + 'bb'); gr.addColorStop(1, vif + '00');
  x.fillStyle = gr; rond(x, 80);                                         // halo
  gr = x.createLinearGradient(0, -64, 0, 64);
  gr.addColorStop(0, clair); gr.addColorStop(.45, vif); gr.addColorStop(1, fonce);
  x.fillStyle = gr; rond(x, 64);                                         // gros anneau vif
  if (type === 'swipe') {
    x.fillStyle = 'rgba(46,30,0,.92)'; rond(x, 50);                      // intérieur sombre
    gr = x.createRadialGradient(0, 0, 0, 0, 0, 50); gr.addColorStop(.55, 'rgba(255,190,40,0)'); gr.addColorStop(1, 'rgba(255,190,40,.28)');
    x.fillStyle = gr; rond(x, 50);
    x.fillStyle = '#c66c00'; rond(x, 21);                                 // pastille dorée
    gr = x.createRadialGradient(-3, -4, 1, 0, 0, 17); gr.addColorStop(0, '#fff6b8'); gr.addColorStop(.5, '#ffcf2a'); gr.addColorStop(1, '#f09a00');
    x.fillStyle = gr; rond(x, 17);
  } else {
    gr = x.createRadialGradient(0, 0, 30, 0, 0, 47); gr.addColorStop(0, fonce); gr.addColorStop(1, nuit);
    x.fillStyle = gr; rond(x, 47);                                       // bande sombre
    x.fillStyle = vif; rond(x, 35);                                       // fin anneau vif autour du point
    gr = x.createLinearGradient(0, -30, 0, 30); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dedede');
    x.fillStyle = gr; rond(x, 29);                                       // gros point blanc
  }
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 3.5;            // reflet
  x.beginPath(); x.arc(0, 0, 59, Math.PI * 1.15, Math.PI * 1.6); x.stroke();
  return c;
}
/* Bout d'une note tenue (le début de la bande, côté gauche) : point blanc cerclé de vert */
function boutTenue(k = 1) {
  const [clair, vif, fonce] = TEINTES.hold;
  const [c, x] = toile(Math.ceil(160 * k)); x.scale(k, k); x.translate(80, 80);
  let gr = x.createRadialGradient(0, 0, 50, 0, 0, 80); gr.addColorStop(0, vif + '99'); gr.addColorStop(1, vif + '00');
  x.fillStyle = gr; rond(x, 80);
  gr = x.createLinearGradient(0, -64, 0, 64); gr.addColorStop(0, clair); gr.addColorStop(.5, vif); gr.addColorStop(1, fonce);
  x.fillStyle = gr; rond(x, 64);
  gr = x.createLinearGradient(0, -44, 0, 44); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e2e2e2');
  x.fillStyle = gr; rond(x, 44);
  return c;
}
/* Flèche des notes à glisser : blanche, cernée de foncé, elle part du centre et sort largement du rond.
   Toile de 256 px, même unité (64 px = rayon de la note), pointe vers la droite. */
function fleche(k = 1) {
  const [c, x] = toile(Math.ceil(256 * k)); x.scale(k, k); x.translate(128, 128); x.scale(64, 64);
  x.beginPath();
  x.moveTo(1.85, 0); x.lineTo(.84, -.64); x.lineTo(1.0, -.11); x.lineTo(-.05, -.11);
  x.lineTo(-.05, .11); x.lineTo(1.0, .11); x.lineTo(.84, .64); x.closePath();
  x.lineJoin = 'round';
  x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 10 * k;
  x.lineWidth = .16; x.strokeStyle = '#3a2400'; x.stroke();
  x.shadowBlur = 0;
  const gr = x.createLinearGradient(0, -.6, 0, .6); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#fff3cf');
  x.fillStyle = gr; x.fill();
  return c;
}
/* Cible : gros anneau blanc, intérieur sombre (toile 256, anneau de rayon 100 = R) */
function cible(k = 1) {
  const [c, x] = toile(Math.ceil(256 * k)); x.scale(k, k); x.translate(128, 128);
  let gr = x.createRadialGradient(0, 0, 94, 0, 0, 126);
  gr.addColorStop(0, 'rgba(215,255,250,.5)'); gr.addColorStop(1, 'rgba(215,255,250,0)');
  x.fillStyle = gr; rond(x, 126);                                        // lueur
  gr = x.createLinearGradient(0, -101, 0, 101); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cdd8d9');
  x.fillStyle = gr; rond(x, 101);                                        // anneau blanc
  gr = x.createRadialGradient(0, -10, 4, 0, 0, 80);
  gr.addColorStop(0, '#26423f'); gr.addColorStop(.65, '#0e1c1d'); gr.addColorStop(1, '#020606');
  x.fillStyle = gr; rond(x, 80);                                         // intérieur sombre
  x.strokeStyle = 'rgba(150,230,225,.17)'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 50, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 79, 0, 7); x.stroke();
  return c;
}
function lueur(col, k = 1) {
  const [c, x] = toile(Math.ceil(128 * k)); x.scale(k, k);
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return c;
}
/* Petite croche (ou double croche), tête en (0, 0), ~40 de haut */
function croche(x, double) {
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
/* Effet Critical (toile 512) : cercle magique de la couleur de la note, traits qui rayonnent */
function cercleMagique(type, k = 1) {
  const [clair, vif] = TEINTES[type];
  const [c, x] = toile(Math.ceil(512 * k)); x.scale(k, k); x.translate(256, 256);
  const rnd = hasard(type.length * 97 + 3);
  x.lineCap = 'round'; x.globalCompositeOperation = 'lighter';
  x.shadowColor = vif; x.shadowBlur = 24 * k;
  x.strokeStyle = vif; x.globalAlpha = .6; x.lineWidth = 44; x.beginPath(); x.arc(0, 0, 190, 0, 7); x.stroke();
  x.globalAlpha = 1; x.lineWidth = 16; x.beginPath(); x.arc(0, 0, 190, 0, 7); x.stroke();
  x.strokeStyle = clair; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 192, 0, 7); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 228, 0, 7); x.stroke();
  x.globalAlpha = .9; x.lineWidth = 3.5; x.beginPath(); x.arc(0, 0, 148, 0, 7); x.stroke();
  x.globalAlpha = 1; x.lineWidth = 8;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + rnd() * .25, r0 = 200 + rnd() * 12, r1 = r0 + 20 + rnd() * 30;
    x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); x.stroke();
  }
  return c;
}
/* … et la couronne de notes de musique qui tourne à l'intérieur */
function cercleNotes(type, k = 1) {
  const [clair, vif] = TEINTES[type];
  const [c, x] = toile(Math.ceil(512 * k)); x.scale(k, k); x.translate(256, 256);
  const rnd = hasard(type.length * 31 + 7);
  x.shadowColor = vif; x.shadowBlur = 10 * k;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rnd() * .3, r = 160 + rnd() * 22;
    x.save(); x.translate(Math.cos(a) * r, Math.sin(a) * r); x.rotate(a + Math.PI / 2 + (rnd() - .5) * .8);
    x.scale(.85, .85); x.fillStyle = i % 3 ? '#ffffff' : clair; croche(x, i % 4 === 1); x.restore();
  }
  return c;
}
/* Petit triangle (contour) qui s'envole autour de la cible */
function triangle(col, k = 1) {
  const [c, x] = toile(Math.ceil(48 * k)); x.scale(k, k); x.translate(24, 26);
  x.shadowColor = col; x.shadowBlur = 6 * k; x.strokeStyle = col; x.lineWidth = 3.6; x.lineJoin = 'round';
  x.beginPath();
  for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; x.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); }
  x.closePath(); x.stroke();
  return c;
}
/* Coffre au trésor (toile 96 × 84) */
function coffre() {
  const [c, x] = toile(96, 84); x.translate(48, 48);
  x.lineJoin = 'round';
  const couvercle = () => { x.beginPath(); x.moveTo(-38, -10); x.lineTo(-38, -20); x.bezierCurveTo(-38, -42, 38, -42, 38, -20); x.lineTo(38, -10); x.closePath(); };
  x.fillStyle = '#3a1200'; rr(x, -42, -12, 84, 46, 7); x.fill();                       // contour sombre
  x.strokeStyle = '#3a1200'; x.lineWidth = 8; couvercle(); x.stroke();
  let gr = x.createLinearGradient(0, -10, 0, 30); gr.addColorStop(0, '#f0582a'); gr.addColorStop(1, '#a3240c');
  x.fillStyle = gr; rr(x, -38, -10, 76, 40, 5); x.fill();                              // caisse
  gr = x.createLinearGradient(0, -40, 0, -10); gr.addColorStop(0, '#ff8a4a'); gr.addColorStop(1, '#c2360f');
  x.fillStyle = gr; couvercle(); x.fill();                                             // couvercle bombé
  const or = x.createLinearGradient(0, -40, 0, 30); or.addColorStop(0, '#fff2a0'); or.addColorStop(.5, '#f2c040'); or.addColorStop(1, '#b07818');
  x.fillStyle = or;
  for (const bx of [-30, 22]) x.fillRect(bx, -34, 8, 64);                              // bandes dorées
  x.fillRect(-38, -14, 76, 7);                                                          // bord du couvercle
  rr(x, -8, -16, 16, 20, 3); x.fill();                                                 // serrure
  x.fillStyle = '#3a1200'; x.beginPath(); x.arc(0, -9, 3, 0, 7); x.fill(); x.fillRect(-1.5, -9, 3, 8);
  x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-26, -32, 40, 3);                  // reflet
  return c;
}
/* Cristal du coup spécial (hexagone, toile 128) */
function cristal() {
  const [c, x] = toile(128); x.translate(64, 64);
  const hex = r => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); };
  let gr = x.createLinearGradient(0, -62, 0, 62); gr.addColorStop(0, '#fff3b8'); gr.addColorStop(.5, '#e2a93a'); gr.addColorStop(1, '#8a5a12');
  x.fillStyle = gr; hex(62); x.fill();                                                  // cadre doré
  x.fillStyle = '#2a1800'; hex(54); x.fill();
  gr = x.createLinearGradient(-30, -50, 30, 50); gr.addColorStop(0, '#d8f8ff'); gr.addColorStop(.4, '#52b6ff'); gr.addColorStop(1, '#12307e');
  x.fillStyle = gr; hex(50); x.fill();                                                  // pierre bleue
  for (let i = 0; i < 6; i++) {                                                         // facettes
    const a = -Math.PI / 2 + i * Math.PI / 3, b = a + Math.PI / 3;
    x.fillStyle = i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(0,20,60,.18)';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 50, Math.sin(a) * 50); x.lineTo(Math.cos(b) * 50, Math.sin(b) * 50); x.fill();
  }
  x.fillStyle = 'rgba(255,255,255,.85)'; hex(15); x.fill();
  x.fillStyle = 'rgba(160,230,255,.9)'; hex(11); x.fill();
  return c;
}
/* Ombre au sol d'un perso, anneau qui s'élargit, petit losange blanc (barre TIME) */
function ombreSol() {
  const [c, x] = toile(128, 32); x.translate(64, 16); x.scale(4, 1);
  const gr = x.createRadialGradient(0, 0, 0, 0, 0, 16); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(.7, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 16, 0, 7); x.fill();
  return c;
}
function anneauSprite(col, k = 1) {
  const [c, x] = toile(Math.ceil(128 * k)); x.scale(k, k);
  x.strokeStyle = col; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.stroke();
  return c;
}
function losange(k = 1) {
  const [c, x] = toile(Math.ceil(16 * k), Math.ceil(32 * k)); x.scale(k, k);
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(8, 0); x.lineTo(16, 16); x.lineTo(8, 32); x.lineTo(0, 16); x.fill();
  return c;
}
const TRI_COULEURS = ['#6fe8ff', '#ffe65a', '#8dff7a', '#ff8ac8', '#ffffff'];
const SPR = {
  tap: bille('tap'), hold: bille('hold'), swipe: bille('swipe'), bout: boutTenue(),
  fleche: fleche(), cible: cible(), coffre: coffre(), cristal: cristal(), ombre: ombreSol(), losange: losange(),
  anneau: {tap: anneauSprite(TEINTES.tap[0]), hold: anneauSprite(TEINTES.hold[0]), swipe: anneauSprite(TEINTES.swipe[0])},
  lueurOr: lueur('rgba(255,220,120,.8)'), lueurVert: lueur('rgba(120,255,150,.7)'), lueurBleu: lueur('rgba(130,220,255,.6)'),
  lueur: {tap: lueur('rgba(255,90,90,.8)'), hold: lueur('rgba(110,255,130,.75)'), swipe: lueur('rgba(255,215,90,.8)')},
  cercle: {tap: cercleMagique('tap'), hold: cercleMagique('hold'), swipe: cercleMagique('swipe')},
  notesCercle: {tap: cercleNotes('tap'), hold: cercleNotes('hold'), swipe: cercleNotes('swipe')},
  tri: TRI_COULEURS.map(triangle),
  points: TRI_COULEURS.map(c => lueur(c)),
};
// une flèche déjà tournée par sens de glissé (évite save/rotate/restore à chaque image)
const FLECHES_TOURNEES = {};
function tournerFleches() {
  const n = SPR.fleche.width;
  for (const d of ['r', 'dr', 'd', 'dl', 'l', 'ul', 'u', 'ur']) {
    const [c, x] = toile(n); x.translate(n / 2, n / 2); x.rotate(DIR_ANGLE[d] * Math.PI / 180); x.drawImage(SPR.fleche, -n / 2, -n / 2);
    FLECHES_TOURNEES[d] = c;
  }
}
tournerFleches();
/* Les images des notes, cibles et effets sont refaites à la taille exacte où elles s'affichent
   (pixels de l'écran) : plus nettes, et moins de travail à chaque image. */
function preparerSprites() {
  const px = R * DPR, kn = RN * 2.5 * DPR / 160;
  Object.assign(SPR, {tap: bille('tap', kn), hold: bille('hold', kn), swipe: bille('swipe', kn), bout: boutTenue(kn),
    fleche: fleche(RN * 4 * DPR / 256), cible: cible(px * 2.7 / 256)});
  // cercle magique et couronne de croches réunis en une seule image (une seule à peindre par effet)
  for (const s of ['tap', 'hold', 'swipe']) {
    const c = cercleMagique(s, px * 4.4 / 512), n = cercleNotes(s, px * 4.4 / 512);
    c.getContext('2d').drawImage(n, 0, 0, c.width, c.height);
    SPR.cercle[s] = c; SPR.anneau[s] = anneauSprite(TEINTES[s][0], px * 1.8 / 128);
  }
  SPR.losange = losange(Math.max(4, H * .009) * 1.9 * DPR / 32);
  SPR.tri = TRI_COULEURS.map(c => triangle(c, px * .8 / 48));
  SPR.points = TRI_COULEURS.map(c => lueur(c, Math.max(.12, px * .5 / 128)));
  tournerFleches();
}
// dessine une image centrée en (x, y), tournée
function dessinTourne(img, x, y, l, h, angle) {
  const c = Math.cos(angle) * DPR, s = Math.sin(angle) * DPR;
  g.setTransform(c, s, -s, c, x * DPR, y * DPR);
  g.drawImage(img, -l / 2, -h / 2, l, h);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}

/* Textes stylés, pré-dessinés à la bonne résolution (on ne redessine que quand la taille change).
   o = {taille, poids, police, remplissage (couleur ou fonction(x, haut, bas, largeur)), contours: [[épaisseur en taille, couleur]],
        lueur: [flou en px, couleur], penche (italique), etire (largeur)} */
function stylise(txt, o) {
  const t = o.taille, police = `${o.poids || 900} ${t}px ${o.police || POLICE}`, et = o.etire || 1, pe = o.penche || 0;
  const [, mx] = toile(4); mx.font = police;
  const larg = mx.measureText(txt).width;
  const marge = t * .25 + (o.lueur ? o.lueur[0] : 0);
  const haut = t * 1.05 + marge * 2, base = marge + t * .82;
  const l = larg * et + t * pe * .8 + marge * 2;
  const [c, x] = toile(Math.ceil(l * DPR), Math.ceil(haut * DPR));
  x.scale(DPR, DPR); x.translate(marge, base); x.transform(et, 0, -pe, 1, 0, 0);
  x.font = police; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
  if (o.espace && 'letterSpacing' in x) x.letterSpacing = o.espace + 'px';
  if (o.lueur) { x.shadowColor = o.lueur[1]; x.shadowBlur = o.lueur[0] * DPR; }
  for (const [ep, col] of o.contours || []) { x.lineWidth = ep * t; x.strokeStyle = col; x.strokeText(txt, 0, 0); x.shadowColor = 'transparent'; }
  const r = o.remplissage || '#fff';
  x.fillStyle = typeof r === 'function' ? r(x, -t * .72, 0, larg) : r; x.fillText(txt, 0, 0);
  Object.assign(c, {l, h: haut, base, marge, t, avance: larg * et});
  return c;
}
const degrade = (x, h, b, stops) => { const gr = x.createLinearGradient(0, h, 0, b); stops.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
const CHROME = (x, h, b) => degrade(x, h, b, [[0, '#ffffff'], [.4, '#ddf0fb'], [.5, '#8eaec4'], [.58, '#d3e8f4'], [1, '#ffffff']]);
const IRISE = (x, h, b, l) => {
  const gr = x.createLinearGradient(0, h, l * .9, b);
  ['#ffa6dc', '#ffe98c', '#adffb4', '#8eeaff', '#c9adff', '#ffb3e0'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
  return gr;
};
const ARC_EN_CIEL = (x, h, b, l) => {
  const gr = x.createLinearGradient(0, 0, l, 0);
  [[0, '#ff86d2'], [.2, '#ffbf5c'], [.37, '#fff27a'], [.55, '#90ff9e'], [.72, '#70e2ff'], [.87, '#86a2ff'], [1, '#c88cff']].forEach(([p, c]) => gr.addColorStop(p, c));
  return gr;
};
const DEGRADE = (...cs) => (x, h, b) => degrade(x, h, b, cs.map((c, i) => [i / (cs.length - 1), c]));
function chiffresStyle(o) { const a = {}; for (const ch of '0123456789') a[ch] = stylise(ch, o); return a; }
// écrit un nombre avec des chiffres pré-dessinés ; cale = 1 : aligné à droite sur x, 0 : à gauche. Rend le bord gauche.
function ecrireNombre(atlas, txt, x, yBase, ech = 1, cale = 1) {
  let w = 0;
  for (const ch of txt) w += atlas[ch].avance;
  let px = x - w * ech * cale;
  const gauche = px;
  for (const ch of txt) {
    const img = atlas[ch];
    g.drawImage(img, px - img.marge * ech, yBase - img.base * ech, img.l * ech, img.h * ech);
    px += img.avance * ech;
  }
  return gauche;
}

/* Textes pré-dessinés (jugements, chiffres du score et de la chaîne) : refaits quand la taille de l'écran change */
let TXT = {}, CHIF = {};
function preparerTextes() {
  const tj = R * 1.02;
  const jug = (txt, rempl, sombre = '#151a3e') => stylise(txt, {taille: tj, remplissage: rempl, contours: [[.2, sombre], [.075, '#ffffff']], lueur: [tj * .2, 'rgba(255,255,255,.5)'], etire: .74});
  TXT = {
    CRITICAL: jug('CRITICAL', ARC_EN_CIEL),
    GREAT: jug('GREAT', DEGRADE('#fff8d0', '#ffd04a', '#ff9a1a')),
    GOOD: jug('GOOD', DEGRADE('#eafff4', '#7dffb0', '#22b86a')),
    MISS: stylise('MISS', {taille: tj, remplissage: DEGRADE('#ececf4', '#8a8aa0'), contours: [[.2, '#1a1a26']], etire: .74}),
  };
  const ts = H * .083;
  CHIF.score = chiffresStyle({taille: ts, poids: 700, remplissage: CHROME, contours: [[.085, '#0c1a2c']], lueur: [ts * .1, 'rgba(0,0,0,.55)']});
  const tc = H * .135;
  CHIF.chaine = chiffresStyle({taille: tc, poids: 900, remplissage: IRISE, contours: [[.12, '#0b1630'], [.045, 'rgba(255,255,255,.95)']], lueur: [tc * .13, 'rgba(110,230,255,.85)'], penche: .2});
  TXT.CHAIN = stylise('CHAIN', {taille: tc * .34, poids: 900, remplissage: CHROME, contours: [[.17, '#0b1e2e']], lueur: [tc * .34 * .3, 'rgba(110,230,255,.9)']});
  const td = H * .5;
  CHIF.decompte = {};
  for (const ch of '321') CHIF.decompte[ch] = stylise(ch, {taille: td, poids: 900, remplissage: IRISE, contours: [[.1, '#0b1630'], [.04, 'rgba(255,255,255,.95)']], lueur: [td * .08, 'rgba(110,230,255,.85)']});
  CHIF.petit = chiffresStyle({taille: H * .036, poids: 700, remplissage: DEGRADE('#ffffff', '#e6e6e6'), contours: [[.18, '#2a1a08']]});
  cacheHud = {};
}
/* Petits textes d'aide (police du système) */
function texteImage(txt, taille, remplissage, contourCol) {
  return stylise(txt, {taille, poids: 800, police: POLICE_SANS, remplissage, contours: [[.24, contourCol]]});
}
let cacheHud = {};
function texteCache(cle, txt, ...args) {
  const e = cacheHud[cle];
  if (e && e.txt === txt) return e.img;
  const img = texteImage(txt, ...args);
  cacheHud[cle] = {txt, img};
  return img;
}

/* Décor original : clairière de forêt */
let fond = null;
function hasard(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
/* Décor de chaque niveau : une image fixe (faite avec ChatGPT, 1536×1024), posée « en couvrant » et centrée
   (en paysage, ~15 % coupés en haut et en bas). Peinte une seule fois dans le fond : aucun coût pendant la partie. */
const DECORS = {gff: 'decors/gff.webp?v=1'};
const DECOR_IMG = {};
let fondDe = null;
function chargerDecor(id) {
  if (!DECORS[id]) return Promise.resolve(null);
  if (!DECOR_IMG[id]) DECOR_IMG[id] = new Promise(ok => {
    const im = new Image();
    im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => ok(im));
    im.onerror = () => ok(null);
    im.src = DECORS[id];
  }).then(im => (DECOR_IMG[id].img = im, im));
  return DECOR_IMG[id];
}
function decor() {
  const [c, x] = [document.createElement('canvas'), null];
  c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
  const d = c.getContext('2d'); d.scale(DPR, DPR);
  const im = niveau && DECOR_IMG[niveau.id] && DECOR_IMG[niveau.id].img;
  fondDe = im ? niveau.id : null;
  if (im) {
    const k = Math.max(W / im.width, H / im.height), lw = im.width * k, lh = im.height * k;
    d.imageSmoothingQuality = 'high';
    d.drawImage(im, (W - lw) / 2, (H - lh) / 2, lw, lh);
    // un voile léger pour que les notes ressortent
    const gr = d.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(10,0,20,.12)'); gr.addColorStop(.6, 'rgba(10,0,20,.18)'); gr.addColorStop(1, 'rgba(10,0,20,.1)');
    d.fillStyle = gr; d.fillRect(0, 0, W, H);
    return c;
  }
  const rnd = hasard(7);
  let gr = d.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#5fb8e6'); gr.addColorStop(.38, '#bfe9e0'); gr.addColorStop(.42, '#d8f2d0'); gr.addColorStop(1, '#1d4a24');
  d.fillStyle = gr; d.fillRect(0, 0, W, H);
  // soleil
  gr = d.createRadialGradient(W * .3, H * .12, 0, W * .3, H * .12, H * .6);
  gr.addColorStop(0, 'rgba(255,250,220,.9)'); gr.addColorStop(.15, 'rgba(255,245,200,.35)'); gr.addColorStop(1, 'rgba(255,245,200,0)');
  d.fillStyle = gr; d.fillRect(0, 0, W, H);
  // nuages
  d.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 6; i++) { const cx = rnd() * W, cy = H * (.06 + rnd() * .16), s = 18 + rnd() * 26; for (let j = 0; j < 5; j++) { d.beginPath(); d.ellipse(cx + (j - 2) * s * .9, cy + Math.sin(j * 2.1) * s * .25, s, s * .55, 0, 0, 7); d.fill(); } }
  const crete = (base, amp, col, seed) => {
    const r = hasard(seed), ph = [r() * 6, r() * 6, r() * 6];
    d.fillStyle = col; d.beginPath(); d.moveTo(0, H);
    for (let px = 0; px <= W + 10; px += 8) {
      const u = px / W;
      d.lineTo(px, H * base - H * amp * (Math.sin(u * 5 + ph[0]) * .5 + Math.sin(u * 11 + ph[1]) * .3 + Math.sin(u * 23 + ph[2]) * .2));
    }
    d.lineTo(W, H); d.fill();
  };
  crete(.40, .06, '#8fbfb4', 3);
  crete(.45, .05, '#5f9c6f', 11);
  // arbres du fond
  const arbres = (yb, n, sz, c1, c2, seed) => {
    const r = hasard(seed);
    for (let i = 0; i < n; i++) {
      const ax = r() * W, ay = H * yb + r() * H * .04, s = sz * (.7 + r() * .6);
      d.fillStyle = c1; d.fillRect(ax - s * .08, ay, s * .16, s * .6);
      for (let j = 0; j < 4; j++) { d.fillStyle = j % 2 ? c1 : c2; d.beginPath(); d.arc(ax + (r() - .5) * s * .7, ay - r() * s * .6, s * (.35 + r() * .2), 0, 7); d.fill(); }
    }
  };
  arbres(.47, 22, H * .09, '#3c7a46', '#4c8e52', 5);
  crete(.56, .03, '#4f8f45', 19);
  // forêt sur les côtés (cadre)
  const cote = (gauche) => {
    const r = hasard(gauche ? 31 : 37);
    for (let i = 0; i < 16; i++) {
      const ax = gauche ? r() * W * .2 - W * .04 : W - r() * W * .2 + W * .04, ay = H * (.25 + r() * .55), s = H * (.12 + r() * .12);
      d.fillStyle = i % 2 ? '#1e5a2c' : '#24683a'; d.beginPath(); d.arc(ax, ay, s, 0, 7); d.fill();
    }
  };
  cote(true); cote(false);
  // sol
  gr = d.createLinearGradient(0, H * .55, 0, H);
  gr.addColorStop(0, 'rgba(70,140,60,0)'); gr.addColorStop(.25, 'rgba(60,120,52,.9)'); gr.addColorStop(1, '#173a1c');
  d.fillStyle = gr; d.fillRect(0, H * .55, W, H * .45);
  // rayons de lumière
  d.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x0 = W * (.15 + i * .1 + rnd() * .05), w0 = W * (.02 + rnd() * .03);
    gr = d.createLinearGradient(0, 0, 0, H * .9); gr.addColorStop(0, 'rgba(255,250,210,.13)'); gr.addColorStop(1, 'rgba(255,250,210,0)');
    d.fillStyle = gr; d.beginPath(); d.moveTo(x0, 0); d.lineTo(x0 + w0, 0); d.lineTo(x0 + w0 * 5 + W * .2, H * .9); d.lineTo(x0 + W * .2, H * .9); d.fill();
  }
  d.globalCompositeOperation = 'source-over';
  // assombrir autour des pistes pour la lisibilité
  gr = d.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, 'rgba(0,10,5,.05)'); gr.addColorStop(.6, 'rgba(0,10,5,.2)'); gr.addColorStop(1, 'rgba(0,10,5,.5)');
  d.fillStyle = gr; d.fillRect(0, 0, W, H);
  gr = d.createRadialGradient(W / 2, H * .55, H * .3, W / 2, H * .55, Math.max(W, H) * .75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)');
  d.fillStyle = gr; d.fillRect(0, 0, W, H);
  return c;
}

/* Qualité adaptative : si le téléphone n'arrive plus à suivre, on baisse un peu la résolution
   (l'image reste nette, mais il y a moins de pixels à peindre) */
const QUALITES = [2, 1.75, 1.5, 1.25, 1];
let qualite = 0;
function miseEnPage() {
  DPR = Math.min(window.devicePixelRatio || 1, QUALITES[qualite]);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  // jeu en paysage uniquement (style Switch, proportions de Final Bar Line) : notes de gauche à droite,
  // cibles à droite, pistes dans la moitié haute, le bas de l'écran est libre pour les pouces et l'équipe.
  const haut = H * .2, ecart = H * .118;
  R = Math.min(H * .051, W * .035);
  for (let i = 0; i < 4; i++) { CX[i] = W - H * .298; CY[i] = haut + (3 - i) * ecart; }   // aigu = en haut
  XFAR = -R * 1.5;
  RN = R * .74;   // rayon d'une note
  preparerHud();
  peindreFond();
  lucioles = Array.from({length: 14}, () => ({x: Math.random() * W, y: Math.random() * H * .8, p: Math.random() * 6, v: .2 + Math.random() * .5, s: 2 + Math.random() * 3}));
}
// Baisse de résolution en pleine partie : on change seulement la taille de la toile. Rien n'est redessiné
// (décor, textes et images gardent leur résolution), sinon le jeu gèlerait un instant au milieu du morceau.
function changerQualite() {
  DPR = Math.min(window.devicePixelRatio || 1, QUALITES[qualite]);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}
// les pistes ne bougent pas : on les peint une fois pour toutes dans le décor (fins traits blancs, comme sur Switch)
function pistesFixes() {
  const d = fond.getContext('2d');
  d.setTransform(DPR, 0, 0, DPR, 0, 0);
  const y0 = CY[3] - R * 1.4, y1 = CY[0] + R * 1.4;
  const gb = d.createLinearGradient(0, 0, W, 0);
  gb.addColorStop(0, 'rgba(5,12,20,0)'); gb.addColorStop(.35, 'rgba(5,12,20,.14)'); gb.addColorStop(1, 'rgba(5,12,20,.2)');
  d.fillStyle = gb; d.fillRect(0, y0, W, y1 - y0);
  for (let i = 0; i < 4; i++) {
    const gr = d.createLinearGradient(0, 0, CX[i], 0);
    gr.addColorStop(0, 'rgba(225,248,255,.1)'); gr.addColorStop(.3, 'rgba(225,248,255,.4)'); gr.addColorStop(1, 'rgba(225,248,255,.5)');
    d.fillStyle = 'rgba(0,0,0,.2)'; d.fillRect(0, CY[i] + .6, CX[i], 1.4);
    d.fillStyle = gr; d.fillRect(0, CY[i] - .8, CX[i], 1.4);
  }
}
let lucioles = [];

function proj(lane, s) {
  return {x: CX[lane] - s * (CX[lane] - XFAR), y: CY[lane], k: 1};
}
// bande qui suit une piste entre deux distances, largeur w (à l'échelle de la perspective)
function bande(lane, s0, s1, w) {
  const a = proj(lane, s0), b = proj(lane, s1);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  g.beginPath();
  g.moveTo(a.x + nx * w * a.k, a.y + ny * w * a.k); g.lineTo(b.x + nx * w * b.k, b.y + ny * w * b.k);
  g.lineTo(b.x - nx * w * b.k, b.y - ny * w * b.k); g.lineTo(a.x - nx * w * a.k, a.y - ny * w * a.k); g.closePath();
  return [a, b];
}
const doux = u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

/* Ce que le moteur annonce : le jugement s'affiche à droite de la cible, avec son éclat */
let effets = [], textes = [], appuis = [0, 0, 0, 0];
ecouter('partie', () => { effets = []; textes = []; });
ecouter('note', (j, n) => {
  const lane = n.lane;
  for (let i = textes.length - 1; i >= 0; i--) if (textes[i].lane === lane) textes.splice(i, 1);
  textes.push({j, lane, age: 0});
  eclat(j, n);
});
ecouter('coffre', (attrape, lane) => attrape ? attraperCoffre(lane) : perdreCoffre(lane));

/* Effets quand on réussit une note : comme sur Switch, un cercle magique de la couleur de la note
   (rouge, vert ou doré) avec des croches qui tournent, des traits qui rayonnent et des petits triangles. */
function eclat(j, n) {
  const lane = n.lane, x = CX[lane], y = CY[lane], sorte = n.type;
  appuis[lane] = 1;
  if (j === 'MISS') return;
  const crit = j === 'CRITICAL', great = j === 'GREAT';
  effets.push({type: 'flash', x, y, age: 0, vie: .25, spr: SPR.lueur[sorte], taille: R * (crit ? 3.6 : 2.8)});
  if (crit || great) effets.push({type: 'cercle', x, y, age: 0, vie: crit ? .6 : .45, sorte, taille: R * (crit ? 4.4 : 3.3), rot: Math.random() * 6});
  if (!crit && !great) effets.push({type: 'anneau', x, y, age: 0, vie: .3, sorte});
  const nt = crit ? 5 : great ? 3 : 0;
  for (let i = 0; i < nt; i++) {
    const a = Math.random() * Math.PI * 2, r0 = R * (1 + Math.random() * .7), v = R * (2.5 + Math.random() * 3.5);
    effets.push({type: 'tri', x: x + Math.cos(a) * r0, y: y + Math.sin(a) * r0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, vie: .5 + Math.random() * .35,
      s: R * (.24 + Math.random() * .16), rot: Math.random() * 6, vr: (Math.random() - .5) * 10, k: Math.floor(Math.random() * SPR.tri.length)});
  }
  for (let i = 0; i < (crit ? 3 : great ? 1 : 0); i++) {
    const a = Math.random() * Math.PI * 2, v = R * (1.5 + Math.random() * 4);
    effets.push({type: 'point', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, vie: .4 + Math.random() * .3, s: R * (.12 + Math.random() * .12), k: Math.floor(Math.random() * SPR.points.length)});
  }
}
/* Coffres : attrapé, il s'envole vers le compteur du panneau ; raté, il tombe */
function attraperCoffre(lane) {
  const x0 = CX[lane], y0 = CY[lane] - RN * 1.55;
  effets.push({type: 'coffre', x: x0, y: y0, age: 0, vie: .75, fin: () => {
    coffres++; coffrePop = 1;
    if (PANNEAU) effets.push({type: 'flash', x: PANNEAU.coffre[0], y: PANNEAU.coffre[1], age: 0, vie: .35, spr: SPR.lueurOr, taille: H * .12});
  }});
}
function perdreCoffre(lane) {
  effets.push({type: 'coffreTombe', x: CX[lane], y: CY[lane] - RN * 1.55, vx: -R * 1.5, vy: -R * 3, age: 0, vie: .7, rot: 0});
}

const vis = [];
function dessiner(st, dt, horloge) {
  g.drawImage(fond, 0, 0, W, H);   // décor + pistes, peints une seule fois
  const A = reglages.vitesse;
  // lucioles
  g.globalCompositeOperation = 'lighter';
  for (const l of lucioles) {
    l.y -= l.v * dt * 12; l.x += Math.sin(horloge * .7 + l.p) * dt * 8;
    if (l.y < -10) { l.y = H * .85; l.x = Math.random() * W; }
    g.globalAlpha = .35 + .35 * Math.sin(horloge * 2 + l.p); g.drawImage(SPR.lueurOr, l.x - l.s * 3, l.y - l.s * 3, l.s * 6, l.s * 6);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';

  // légère pulsation des cibles sur le temps
  const beatPhase = st > niveau.debut ? ((st - niveau.debut) / niveau.temps) % 1 : 1;
  const pulse = 1 + .02 * Math.max(0, 1 - beatPhase * 4);
  if (etat !== 'menu') { dessinerEquipe(st, horloge); dessinerCoup(etat === 'jeu' ? dt : 0); }

  // cibles
  for (let i = 0; i < 4; i++) {
    const s = R * 2.56 * pulse * (1 + appuis[i] * .06);
    g.drawImage(SPR.cible, CX[i] - s / 2, CY[i] - s / 2, s, s);
    if (appuis[i] > 0) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = appuis[i] * .5;
      const f = R * 2.6; g.drawImage(SPR.lueurBleu, CX[i] - f / 2, CY[i] - f / 2, f, f);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      appuis[i] = Math.max(0, appuis[i] - dt * 5);
    }
  }
  // notes visibles (sans créer de tableau à chaque image)
  vis.length = 0;
  for (let i = prochaine; i < notes.length; i++) {
    const n = notes[i];
    if ((n.t - st) / A > 1.02) break;
    if (n.fait && !(n.type === 'hold' && n.tenu)) continue;
    vis.push(n);
  }
  // barre bleue qui relie les deux notes d'une double
  g.fillStyle = 'rgba(50,190,225,.92)';
  for (let i = 0; i + 1 < vis.length; i++) {
    const n = vis[i], m = vis[i + 1];
    if (n.paire === undefined || m.paire !== n.paire || n.fait || m.fait) continue;
    const s = (n.t - st) / A, pa = proj(n.lane, s), pb = proj(m.lane, s);
    g.globalAlpha = Math.max(0, Math.min(1, (1.02 - s) * 6));
    const e = RN * .16 * pa.k, y0 = Math.min(pa.y, pb.y), hh = Math.abs(pb.y - pa.y);
    g.fillRect(pa.x - e, y0, e * 2, hh);
    g.fillStyle = 'rgba(200,250,255,.7)'; g.fillRect(pa.x - e * .3, y0, e * .6, hh); g.fillStyle = 'rgba(50,190,225,.92)';
  }
  g.globalAlpha = 1;
  // corps des notes tenues (bande verte pleine, comme sur Switch)
  for (const n of vis) {
    if (n.type !== 'hold') continue;
    const s = (n.t - st) / A, sh = n.tenu ? 0 : s, se = Math.min(1, (n.end - st) / A);
    if (se <= sh) continue;
    g.globalAlpha = Math.max(0, Math.min(1, (1.02 - s) * 6));
    const a0 = Math.max(sh, -.2), lb = RN * .56;
    // bande verte translucide aux bords plus clairs (les pistes sont horizontales)
    const xa = proj(n.lane, a0).x, xb = proj(n.lane, se).x, yl = CY[n.lane], ep = Math.max(1.5, lb * .1);
    g.fillStyle = n.tenu ? 'rgba(60,235,85,.8)' : 'rgba(25,205,55,.68)'; g.fillRect(xb, yl - lb, xa - xb, lb * 2);
    g.fillStyle = 'rgba(175,255,180,.9)'; g.fillRect(xb, yl - lb, xa - xb, ep); g.fillRect(xb, yl + lb - ep, xa - xb, ep);
    if (se < 1) { const b = proj(n.lane, se), r = RN * .62 * b.k; g.drawImage(SPR.bout, b.x - r * 1.25, b.y - r * 1.25, r * 2.5, r * 2.5); }
    if (n.tenu) {
      g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
      const f = R * (2.6 + .3 * Math.sin(horloge * 30));
      g.drawImage(SPR.lueurVert, CX[n.lane] - f / 2, CY[n.lane] - f / 2, f, f);
      g.globalCompositeOperation = 'source-over';
      if (Math.random() < dt * 30) effets.push({type: 'point', x: CX[n.lane] + (Math.random() - .5) * R, y: CY[n.lane], vx: (Math.random() - .5) * R * 2, vy: -R * (3 + Math.random() * 3), age: 0, vie: .4, s: R * .2, k: 2});
    }
  }
  g.globalAlpha = 1;
  // têtes des notes (de la plus lointaine à la plus proche), flèches par-dessus
  for (let pass = 0; pass < 2; pass++) for (let i = vis.length - 1; i >= 0; i--) {
    const n = vis[i];
    if (pass === 1 && n.type !== 'swipe') continue;
    const s = n.tenu ? 0 : (n.t - st) / A;
    const p = proj(n.lane, s), r = RN * p.k;
    g.globalAlpha = Math.max(0, Math.min(1, (1.02 - s) * 6)) * (s < -.05 ? Math.max(0, 1 + (s + .05) * 8) : 1);
    if (pass === 0) {
      g.drawImage(SPR[n.type], p.x - r * 1.25, p.y - r * 1.25, r * 2.5, r * 2.5);
      if (n.coffre && !n.coffreFini) { const cl = r * 1.55, ch = cl * 84 / 96; g.drawImage(SPR.coffre, p.x - cl / 2, p.y - r * .92 - ch * .96 + Math.sin(horloge * 6) * r * .05, cl, ch); }
    }
    else g.drawImage(FLECHES_TOURNEES[n.dir], p.x - r * 2, p.y - r * 2, r * 4, r * 4);
  }
  g.globalAlpha = 1;
  // effets (nettoyés sur place, sans créer de nouveau tableau)
  g.globalCompositeOperation = 'lighter';
  let k = 0;
  for (const e of effets) {
    if ((e.age += dt) >= e.vie) { if (e.fin) e.fin(); continue; }
    effets[k++] = e;
    if (e.age < 0) continue;
    const u = e.age / e.vie;
    if (e.type === 'cercle') {
      const s = e.taille * (.55 + .45 * doux(u * 1.6));
      g.globalAlpha = u < .65 ? 1 : (1 - u) / .35;
      dessinTourne(SPR.cercle[e.sorte], e.x, e.y, s, s, e.rot + u * .9);
    }
    else if (e.type === 'tri') {
      const fr = Math.pow(.06, dt); e.vx *= fr; e.vy *= fr; e.x += e.vx * dt; e.y += e.vy * dt; e.rot += e.vr * dt;
      g.globalAlpha = u < .6 ? 1 : (1 - u) / .4;
      dessinTourne(SPR.tri[e.k], e.x, e.y, e.s * 2, e.s * 2, e.rot);
    }
    else if (e.type === 'coffre' || e.type === 'coffreTombe') {
      g.globalCompositeOperation = 'source-over';
      let x = e.x, y = e.y, s = RN * 1.6, rot = 0;
      if (e.type === 'coffre' && PANNEAU) {
        const v = doux(u), [x1, y1] = PANNEAU.coffre, cx = (e.x + x1) / 2 - H * .02, cy = Math.min(e.y, y1) - H * .18;
        x = (1 - v) * (1 - v) * e.x + 2 * (1 - v) * v * cx + v * v * x1; y = (1 - v) * (1 - v) * e.y + 2 * (1 - v) * v * cy + v * v * y1;
        s = RN * 1.6 * (1 + Math.sin(u * Math.PI) * .6) * (1 - v * .25); g.globalAlpha = 1;
      } else {
        e.vy += R * 14 * dt; e.x += e.vx * dt; e.y += e.vy * dt; rot = -u * 2.5; g.globalAlpha = 1 - u;
      }
      dessinTourne(SPR.coffre, x, y, s, s * 84 / 96, rot);
      g.globalCompositeOperation = 'lighter';
    }
    else if (e.type === 'flash') { g.globalAlpha = 1 - u; const s = e.taille * (.7 + u * .5); g.drawImage(e.spr, e.x - s / 2, e.y - s / 2, s, s); }
    else if (e.type === 'anneau') { g.globalAlpha = 1 - u; const s = R * (1 + .8 * doux(u)) * 2.2; g.drawImage(SPR.anneau[e.sorte], e.x - s / 2, e.y - s / 2, s, s); }
    else {
      const fr = Math.pow(.15, dt); e.vx *= fr; e.vy *= fr; e.x += e.vx * dt; e.y += e.vy * dt;
      g.globalAlpha = 1 - u * u;
      const s = e.s * (1 - u * .5);
      g.drawImage(SPR.points[e.k], e.x - s, e.y - s, s * 2, s * 2);
    }
  }
  effets.length = k;
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // jugements (images pré-dessinées), à droite de la cible, comme sur Switch
  k = 0;
  for (const t of textes) {
    t.age += dt;
    if (t.age > .55) continue;
    textes[k++] = t;
    const pop = t.age < .07 ? 1.15 - t.age / .07 * .15 : 1;
    g.globalAlpha = t.age > .4 ? 1 - (t.age - .4) / .15 : 1;
    const img = TXT[t.j], cx = CX[t.lane] + R * 1.12 + img.avance / 2;   // grossit depuis son centre
    g.drawImage(img, cx - (img.avance / 2 + img.marge) * pop, CY[t.lane] - (img.base - img.t * .36) * pop, img.l * pop, img.h * pop);
  }
  textes.length = k;
  g.globalAlpha = 1;
  if (etat === 'jeu' && st < niveau.debut + 4) {
    const yz = (CY[0] + R * 1.6 + H) / 2;
    g.globalAlpha = Math.min(1, (niveau.debut + 4 - st) / 1.5) * .7;
    const img = texteCache('aide', "Tape n'importe où", Math.round(Math.max(14, Math.min(W, H) * .045)), '#ffffff', 'rgba(20,10,20,.9)');
    g.drawImage(img, W / 2 - img.l / 2, yz - img.h / 2, img.l, img.h);
    g.globalAlpha = 1;
  }
  if (etat !== 'menu') hud(st, dt);
  if (etat === 'decompte') dessinerDecompte();
}
