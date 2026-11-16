"use strict";
/* ============================================================
   HUD façon Final Bar Line (captures de Kiki, 13/11) :
   en haut à gauche le titre (jaquette, logo de difficulté, nom du morceau, jeu et nombre de notes),
   en haut au centre la chaîne (« 196 CHAIN »), en haut à droite le score, en bas la barre TIME,
   en bas à droite le panneau du capitaine (sa tête dans un rond, PV, jauge du coup spécial, coffres),
   et le coup spécial (gros plan du capitaine dans un triangle + nom du coup).
   Tout ce qui ne bouge pas est pré-dessiné ; chaque image ne peint que des images toutes prêtes.
   ============================================================ */
const DIFFICULTES = [['Facile', '#5ad66c'], ['Normal', '#4aa8ff'], ['Difficile', '#ff9b22'], ['Expert', '#ff4a5a']];
function infosNiveau() {
  const nb = notes.length, t0n = nb ? notes[0].t : 0, t1n = nb ? notes[nb - 1].t : 1;
  const dens = nb / Math.max(10, t1n - t0n);
  // nb = combo maximal (une tenue compte double : tête + queue), le même nombre que dans le menu
  const combo = notes.reduce((s, n) => s + (n.type === 'hold' ? 2 : 1), 0);
  return {titre: niveau.nom, jeu: niveau.info ? niveau.info.jeu : 'Composition originale', nb: combo,
          dif: dens < 1.5 ? 0 : dens < 2.5 ? 1 : dens < 3.5 ? 2 : 3};
}
const teinteDe = txt => { let h = 0; for (const ch of String(txt)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };

/* Bandeau du titre, en haut à gauche */
let BANDEAU = null;
function preparerBandeau() {
  if (!notes.length) { BANDEAU = null; return; }
  const inf = infosNiveau(), col = DIFFICULTES[inf.dif][1];
  const m = H * .016, h = H * .07, jq = h, ic = h * .52, tt = H * .033, ts = H * .0145;
  const [, mx] = toile(4);
  mx.font = `700 ${tt}px ${POLICE_TITRE}`; const lt = mx.measureText(inf.titre).width;
  const sous = `${inf.jeu}   ·   ${inf.nb} notes`.toUpperCase();
  mx.font = `600 ${ts}px ${POLICE_SANS}`; const ls = mx.measureText(sous).width + sous.length * ts * .06;
  const xt = m + jq + h * .14 + ic + h * .2, fin = Math.max(H * .44, xt + Math.max(lt, ls) + h * .95);
  const L = fin + m, Ht = h + m * 2;
  const [c, x] = toile(Math.ceil(L * DPR), Math.ceil(Ht * DPR)); x.scale(DPR, DPR);
  const y0 = m + h * .02, y1 = m + h * .98, pente = h * .45;
  // bande sombre au bout biseauté, filets dorés en haut et en bas, portée de musique en fond
  const forme = () => { x.beginPath(); x.moveTo(m + jq * .5, y0); x.lineTo(fin, y0); x.lineTo(fin - pente, y1); x.lineTo(m + jq * .5, y1); x.closePath(); };
  let gr = x.createLinearGradient(m, 0, fin, 0); gr.addColorStop(0, 'rgba(22,9,3,.9)'); gr.addColorStop(.7, 'rgba(22,9,3,.78)'); gr.addColorStop(1, 'rgba(22,9,3,.55)');
  x.fillStyle = gr; forme(); x.fill();
  x.save(); forme(); x.clip();
  x.fillStyle = 'rgba(255,190,130,.1)';
  for (let i = 1; i <= 4; i++) x.fillRect(m + jq, y0 + (y1 - y0) * i / 5, fin, 1);
  x.restore();
  x.strokeStyle = '#e8963a'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(m + jq * .5, y0); x.lineTo(fin, y0); x.lineTo(fin - pente, y1); x.lineTo(m + jq * .5, y1); x.stroke();
  x.strokeStyle = 'rgba(232,150,58,.45)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(m + jq, y0 + 3); x.lineTo(fin - 4, y0 + 3); x.moveTo(m + jq, y1 - 3); x.lineTo(fin - pente - 2, y1 - 3); x.stroke();
  // jaquette : un petit tableau aux couleurs du morceau
  const hue = teinteDe(inf.titre);
  gr = x.createRadialGradient(m + jq * .5, m + jq * .42, 0, m + jq * .5, m + jq * .5, jq * .75);
  gr.addColorStop(0, `hsl(${hue},85%,78%)`); gr.addColorStop(.45, `hsl(${hue},65%,46%)`); gr.addColorStop(1, `hsl(${(hue + 40) % 360},70%,14%)`);
  x.fillStyle = gr; x.fillRect(m, m, jq, jq);
  const rnd = hasard(hue + 5);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const sx = m + rnd() * jq, sy = m + rnd() * jq, sr = jq * (.01 + rnd() * .035);
    const g2 = x.createRadialGradient(sx, sy, 0, sx, sy, sr * 3); g2.addColorStop(0, 'rgba(255,255,240,.95)'); g2.addColorStop(1, 'rgba(255,255,240,0)');
    x.fillStyle = g2; x.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  }
  x.globalCompositeOperation = 'source-over';
  x.save(); x.translate(m + jq * .4, m + jq * .66); x.scale(jq / 60, jq / 60);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 4; croche(x, true); x.restore();
  x.strokeStyle = '#e07a1a'; x.lineWidth = 2; x.strokeRect(m + 1, m + 1, jq - 2, jq - 2);
  // logo de difficulté : une page à coin plié, croches de la couleur de la difficulté
  const ix = m + jq + h * .14, iy = m + h * .16, coin = ic * .26;
  const page = () => { x.beginPath(); x.moveTo(ix, iy); x.lineTo(ix + ic, iy); x.lineTo(ix + ic, iy + ic - coin); x.lineTo(ix + ic - coin, iy + ic); x.lineTo(ix, iy + ic); x.closePath(); };
  x.fillStyle = '#1c0d04'; page(); x.fill();
  x.strokeStyle = col; x.lineWidth = Math.max(1.5, ic * .08); page(); x.stroke();
  x.save(); x.translate(ix + ic * .24, iy + ic * .74); x.scale(ic / 50, ic / 50); x.fillStyle = col; croche(x, true); x.restore();
  // nom du morceau (serif) et, dessous, le jeu et le nombre de notes
  x.textBaseline = 'alphabetic';
  x.font = `700 ${tt}px ${POLICE_TITRE}`; x.fillStyle = '#ffffff'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 4 * DPR; x.shadowOffsetY = 1;
  x.fillText(inf.titre, xt, m + h * .54);
  x.font = `600 ${ts}px ${POLICE_SANS}`; if ('letterSpacing' in x) x.letterSpacing = (ts * .06) + 'px';
  x.fillText(sous, xt + h * .04, m + h * .86);
  x.shadowColor = 'transparent';
  // pause : deux petits traits au bout du bandeau (on touche le bandeau pour mettre en pause)
  x.fillStyle = 'rgba(255,255,255,.55)';
  const px = fin - pente * .5 - h * .42, pw = h * .055, ph = h * .24;
  x.fillRect(px, m + h * .5 - ph / 2, pw, ph); x.fillRect(px + pw * 2.2, m + h * .5 - ph / 2, pw, ph);
  Object.assign(c, {l: L, h: Ht});
  BANDEAU = c;
  const b = $('bpause').style;
  b.left = '0px'; b.top = '0px'; b.width = Math.round(fin) + 'px'; b.height = Math.round(Ht) + 'px';
}

/* Barre TIME, tout en bas */
let TEMPS = null;
function preparerTemps() {
  const hb = H * .028, [c, x] = toile(Math.ceil(W * DPR), Math.ceil(hb * DPR)); x.scale(DPR, DPR);
  const a = H * .05, b = H * .095;
  let gr = x.createLinearGradient(0, 0, 0, hb); gr.addColorStop(0, 'rgba(0,0,0,.72)'); gr.addColorStop(1, 'rgba(0,0,0,.92)');
  x.fillStyle = gr; x.beginPath(); x.moveTo(a, hb); x.quadraticCurveTo(b - H * .03, hb, b, 0); x.lineTo(W - b, 0); x.quadraticCurveTo(W - b + H * .03, hb, W - a, hb); x.closePath(); x.fill();
  const t = stylise('TIME', {taille: hb * .78, poids: 700, remplissage: '#9c9c9c', etire: .78});
  x.drawImage(t, H * .118 - t.marge, hb * .5 + t.t * .36 - t.base, t.l, t.h);
  const x0 = H * .2, x1 = W - H * .2, e = Math.max(4, H * .009), y = hb / 2 - e / 2;
  x.fillStyle = '#121212'; x.fillRect(x0 - 1.5, y - 1.5, x1 - x0 + 3, e + 3);
  gr = x.createLinearGradient(0, y, 0, y + e); gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(1, '#3e3e3e');
  x.fillStyle = gr; x.fillRect(x0, y, x1 - x0, e);
  const rempl = g.createLinearGradient(0, H - hb + y, 0, H - hb + y + e); rempl.addColorStop(0, '#6f7bff'); rempl.addColorStop(1, '#2f3ce6');
  Object.assign(c, {h: hb, x0, x1, e, y: H - hb + y, rempl});
  TEMPS = c;
}

/* Capitaine (premier perso de l'équipe) : sa tête dans un rond et son gros plan pour le coup spécial.
   TETE = où est la tête dans le repère des poupées (unités : pieds en 0, ~100 de haut). */
const TETE = {x: -1, y: -71, l: 60};
let PORTRAIT = null, GROS_PLAN = null, capH = 0;
function preparerCapitaine(force) {
  if (!window.Poupee || !Poupee.fiches[EQUIPE[0]] || (!force && capH === H)) return;
  capH = H;
  const id = EQUIPE[0], pose = Poupee.pose({}), dpr = Math.min(window.devicePixelRatio || 1, 2);
  // portrait (rond de rayon r)
  const r = H * .046, k = r * 2.15 / TETE.l;
  const [p, px] = toile(Math.ceil(r * 2 * dpr)); px.scale(dpr, dpr);
  px.beginPath(); px.arc(r, r, r, 0, 7); px.clip();
  let gr = px.createRadialGradient(r, r * .8, 0, r, r, r); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#e8d7b4');
  px.fillStyle = gr; px.fillRect(0, 0, r * 2, r * 2);
  Poupee.dessine(px, Poupee.fabrique(id, {echelle: k * dpr}), r - TETE.x * k, r * 1.08 - TETE.y * k, pose, {taille: k * 100});
  Object.assign(p, {r});
  PORTRAIT = p;
  // gros plan : la tête en très grand, découpée plus tard par le triangle
  if (!COUP_SPECIAL) { preparerPanneau(); return; }
  const L = H * .64, Hc = H * .39, k2 = H * .28 / TETE.l;
  const [q, qx] = toile(Math.ceil(L * dpr), Math.ceil(Hc * dpr)); qx.scale(dpr, dpr);
  Poupee.dessine(qx, Poupee.fabrique(id, {echelle: k2 * dpr}), L * .52 - TETE.x * k2, H * .21 - TETE.y * k2, pose, {taille: k2 * 100});
  Object.assign(q, {l: L, h: Hc});
  GROS_PLAN = q;
  preparerPanneau();
}

/* Panneau du capitaine, en bas à droite */
let PANNEAU = null;
function preparerPanneau() {
  const u = H, [c, x] = toile(Math.ceil(u * .42 * DPR), Math.ceil(u * .2 * DPR)); x.scale(DPR, DPR);
  const X = v => u * .42 - v, Y = v => u * .2 - v;          // positions comptées depuis le coin en bas à droite
  // bande du haut (jauge + coffres) : sombre
  x.fillStyle = 'rgba(46,28,12,.78)';
  x.beginPath(); x.moveTo(X(.33 * u), Y(.113 * u)); x.lineTo(X(.09 * u), Y(.113 * u)); x.lineTo(X(.09 * u), Y(.074 * u)); x.lineTo(X(.345 * u), Y(.074 * u)); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,240,210,.75)'; x.lineWidth = 1.2;
  x.beginPath(); x.moveTo(X(.33 * u), Y(.113 * u)); x.lineTo(X(.09 * u), Y(.113 * u)); x.stroke();
  // bande du bas (PV) : claire
  let gr = x.createLinearGradient(0, Y(.074 * u), 0, Y(.03 * u)); gr.addColorStop(0, 'rgba(250,242,222,.92)'); gr.addColorStop(1, 'rgba(196,182,152,.92)');
  x.fillStyle = gr;
  x.beginPath(); x.moveTo(X(.35 * u), Y(.074 * u)); x.lineTo(X(.09 * u), Y(.074 * u)); x.lineTo(X(.09 * u), Y(.03 * u)); x.lineTo(X(.375 * u), Y(.03 * u)); x.closePath(); x.fill();
  // rail des PV
  const bx0 = X(.36 * u), bx1 = X(.125 * u), by = Y(.064 * u), bh = u * .022;
  x.fillStyle = '#14242a'; rr(x, bx0 - 1.5, by - 1.5, bx1 - bx0 + 3, bh + 3, bh / 2 + 1.5); x.fill();
  x.fillStyle = '#33464c'; rr(x, bx0, by, bx1 - bx0, bh, bh / 2); x.fill();
  // rail de la jauge du coup spécial (bout biseauté)
  const jx0 = X(.305 * u), jx1 = X(.22 * u), jy = Y(.1 * u), jh = u * .014;
  const rail = (a, b) => { x.beginPath(); x.moveTo(a, jy); x.lineTo(b + jh * .6, jy); x.lineTo(b, jy + jh); x.lineTo(a, jy + jh); x.closePath(); };
  x.fillStyle = 'rgba(255,255,255,.75)'; rail(jx0 - 1.5, jx1 + 1.5); x.lineWidth = 3; x.strokeStyle = 'rgba(230,230,230,.8)'; x.stroke();
  x.fillStyle = '#3c3c3c'; rail(jx0, jx1); x.fill();
  // coffre
  const cl = u * .042, ch = cl * 84 / 96;
  x.drawImage(SPR.coffre, X(.205 * u), Y(.094 * u) - ch * .55, cl, ch);
  // cadre du portrait
  const pr = u * .046, pcx = X(.074 * u), pcy = Y(.095 * u);
  gr = x.createLinearGradient(0, pcy - pr, 0, pcy + pr); gr.addColorStop(0, '#fff2c4'); gr.addColorStop(.5, '#d6b064'); gr.addColorStop(1, '#8a6626');
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(pcx, pcy + 2, pr * 1.2, 0, 7); x.fill();
  x.fillStyle = gr; x.beginPath(); x.arc(pcx, pcy, pr * 1.17, 0, 7); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(pcx, pcy, pr * 1.04, 0, 7); x.fill();
  if (PORTRAIT) x.drawImage(PORTRAIT, pcx - pr, pcy - pr, pr * 2, pr * 2);
  else { x.fillStyle = '#e8d7b4'; x.beginPath(); x.arc(pcx, pcy, pr, 0, 7); x.fill(); }
  // cristal
  const cr = u * .036;
  x.drawImage(SPR.cristal, X(.345 * u) - cr, Y(.112 * u) - cr, cr * 2, cr * 2);
  const ox = W - u * .42, oy = H - u * .2;
  const pv = g.createLinearGradient(ox + bx0, 0, ox + bx1, 0); pv.addColorStop(0, '#22e2b4'); pv.addColorStop(1, '#2f8cff');
  const pvBas = g.createLinearGradient(ox + bx0, 0, ox + bx1, 0); pvBas.addColorStop(0, '#ffb43a'); pvBas.addColorStop(1, '#ff4a3a');
  // barres pleines pré-dessinées : à chaque image, on n'en recopie que la partie remplie
  const barre = (l, h, peindre) => { const [b, y] = toile(Math.ceil(l * DPR), Math.ceil(h * DPR)); y.scale(DPR, DPR); peindre(y, l, h); return b; };
  const pvImg = cols => barre(bx1 - bx0, bh, (y, l, h) => {
    const d = y.createLinearGradient(0, 0, l, 0); d.addColorStop(0, cols[0]); d.addColorStop(1, cols[1]);
    y.fillStyle = d; rr(y, 0, 0, l, h, h / 2); y.fill();
    y.fillStyle = 'rgba(255,255,255,.28)'; rr(y, h * .3, h * .14, l - h * .6, h * .3, h * .15); y.fill();
  });
  const jgImg = barre(jx1 - jx0 + jh, jh, (y, l, h) => {
    y.fillStyle = '#5cbcff'; y.beginPath(); y.moveTo(0, 0); y.lineTo(l, 0); y.lineTo(l - h * .6, h); y.lineTo(0, h); y.closePath(); y.fill();
    y.fillStyle = 'rgba(255,255,255,.35)'; y.fillRect(0, 1, l - h * .6, h * .3);
  });
  PANNEAU = {img: c, x: ox, y: oy, l: u * .42, h: u * .2, pv, pvBas, pvImg: pvImg(['#22e2b4', '#2f8cff']), pvBasImg: pvImg(['#ffb43a', '#ff4a3a']), jgImg,
    b: [ox + bx0, oy + by, bx1 - bx0, bh], j: [ox + jx0, oy + jy, jx1 - jx0, jh],
    coffre: [ox + X(.205 * u) + cl / 2, oy + Y(.094 * u) - ch * .05], nombre: [ox + X(.155 * u), oy + Y(.08 * u)],
    cristal: [ox + X(.345 * u), oy + Y(.112 * u), cr]};
}

/* Nom du coup spécial : bandeau bleu à bord blanc */
let NOM_COUP = null;
function preparerNomCoup() {
  const f = window.Poupee && Poupee.fiches[EQUIPE[0]], nom = (f && f.coup) || 'Coup spécial';
  const l = H * .33, h = H * .05, m = 6;
  const [c, x] = toile(Math.ceil((l + m * 2) * DPR), Math.ceil((h + m * 2) * DPR)); x.scale(DPR, DPR);
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 6 * DPR;
  x.fillStyle = '#d8dde6'; rr(x, m, m, l, h, h * .16); x.fill(); x.shadowColor = 'transparent';
  let gr = x.createLinearGradient(0, m, 0, m + h); gr.addColorStop(0, '#3f77ec'); gr.addColorStop(.5, '#2154d2'); gr.addColorStop(1, '#173ea8');
  x.fillStyle = gr; rr(x, m + 3, m + 3, l - 6, h - 6, h * .12); x.fill();
  x.fillStyle = 'rgba(255,255,255,.12)'; rr(x, m + 3, m + 3, l - 6, (h - 6) * .45, h * .12); x.fill();
  x.font = `500 ${h * .46}px ${POLICE_SANS}`; x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(nom, m + l / 2, m + h * .53);
  Object.assign(c, {l: l + m * 2, h: h + m * 2, m});
  NOM_COUP = c;
}

function preparerHud() {
  preparerSprites(); preparerTextes(); preparerBandeau(); preparerTemps(); preparerCapitaine(); preparerPanneau();
  if (COUP_SPECIAL) preparerNomCoup();
}
/* Le décor est peint une seule fois, avec les pistes et tout ce qui ne bouge pas dans le HUD :
   chaque image n'a plus qu'à recopier ce fond. */
function peindreFond() {
  fond = decor();
  pistesFixes();
  const d = fond.getContext('2d'); d.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (BANDEAU) d.drawImage(BANDEAU, 0, 0, BANDEAU.l, BANDEAU.h);
  if (TEMPS) d.drawImage(TEMPS, 0, H - TEMPS.h, W, TEMPS.h);
  if (PANNEAU) d.drawImage(PANNEAU.img, PANNEAU.x, PANNEAU.y, PANNEAU.l, PANNEAU.h);
}

/* Le coup spécial : le triangle avec le gros plan du capitaine glisse depuis la droite, le nom du coup s'affiche */
const DUREE_COUP = 2;
function coinCoup() { return [[W - H * .635, H - H * .26], [W + 2, H - H * .55], [W + 2, H - H * .165]]; }
function dessinerCoup(dt) {
  if (!coup) return;
  coup.age += dt;
  const a = coup.age;
  if (a > DUREE_COUP) { coup = null; return; }
  const dx = (1 - doux(a / .22)) * H * .8 + doux((a - DUREE_COUP + .28) / .28) * H * .8;
  const [T, A, B] = coinCoup().map(([x, y]) => [x + dx, y]);
  const forme = () => { g.beginPath(); g.moveTo(T[0], T[1]); g.lineTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.closePath(); };
  g.save();
  forme();
  let gr = g.createLinearGradient(T[0], 0, W, 0); gr.addColorStop(0, '#0c2a7a'); gr.addColorStop(.5, '#1d52c8'); gr.addColorStop(1, '#2d6be4');
  g.fillStyle = gr; g.fill();
  g.clip();
  // petits triangles blancs qui défilent
  g.strokeStyle = 'rgba(190,225,255,.55)'; g.lineWidth = 2;
  const pas = H * .09, dec = (a * H * .5) % pas;
  for (let i = -1; i < 9; i++) for (let j = 0; j < 5; j++) {
    const cx = T[0] + i * pas + dec + (j % 2) * pas * .5, cy = A[1] + (j + .5) * (B[1] - A[1]) / 5, s = H * .014;
    g.beginPath(); g.moveTo(cx + s, cy); g.lineTo(cx - s * .6, cy - s * .9); g.lineTo(cx - s * .6, cy + s * .9); g.closePath(); g.stroke();
  }
  if (GROS_PLAN) g.drawImage(GROS_PLAN, W - GROS_PLAN.l + dx * 1.15, A[1] + H * .005, GROS_PLAN.l, GROS_PLAN.h);
  g.restore();
  // bord blanc épais, filet sombre à l'intérieur
  g.lineJoin = 'miter';
  forme(); g.strokeStyle = '#ffffff'; g.lineWidth = H * .016; g.stroke();
  forme(); g.strokeStyle = '#0d1d4a'; g.lineWidth = H * .004; g.stroke();
}
function dessinerNomCoup() {
  if (!coup || !NOM_COUP) return;
  const a = coup.age, al = Math.min(1, a / .15) * Math.min(1, (DUREE_COUP - a) / .25);
  g.globalAlpha = Math.max(0, al);
  g.drawImage(NOM_COUP, W - H * .022 - NOM_COUP.l + NOM_COUP.m, H - H * .215 - NOM_COUP.m, NOM_COUP.l, NOM_COUP.h);
  g.globalAlpha = 1;
}

let scoreAffiche = 0, comboAge = 9, coffrePop = 0;
function hud(st, dt) {
  // score (il défile vers sa valeur)
  scoreAffiche += (score - scoreAffiche) * Math.min(1, dt * 12);
  if (Math.abs(score - scoreAffiche) < 1) scoreAffiche = score;
  ecrireNombre(CHIF.score, String(Math.round(scoreAffiche)), W - H * .022, H * .084);
  // chaîne : « 196 CHAIN »
  comboAge += dt;
  if (combo >= 1) {
    const xr = W / 2 + H * .19, yb = H * .118, z = 1 + .16 * Math.max(0, 1 - comboAge * 9);
    ecrireNombre(CHIF.chaine, String(combo), xr, yb, z);
    const m = TXT.CHAIN;
    g.drawImage(m, xr - H * .008 - m.marge, yb - m.base, m.l, m.h);
  }
  // barre TIME
  if (TEMPS) {
    const prog = Math.max(0, Math.min(1, st / niveau.fin)), xm = TEMPS.x0 + (TEMPS.x1 - TEMPS.x0) * prog, e = TEMPS.e;
    g.fillStyle = TEMPS.rempl; g.fillRect(TEMPS.x0, TEMPS.y, xm - TEMPS.x0, e);
    g.drawImage(SPR.losange, xm - e * .5, TEMPS.y - e * .45, e, e * 1.9);
  }
  // panneau du capitaine
  if (PANNEAU) {
    const P = PANNEAU;
    const [bx, by, bl, bh] = P.b, v = Math.max(0, hp / 100);
    if (v > 0) {
      const img = hp > 30 ? P.pvImg : P.pvBasImg, w = Math.max(bh, bl * v);
      g.drawImage(img, 0, 0, img.width * w / bl, img.height, bx, by, w, bh);
    }
    const [jx, jy, jl, jh] = P.j, ratio = Math.min(1, jauge / JAUGE_MAX);
    if (ratio > 0) {
      const img = P.jgImg, w = jl * ratio + jh * .6;
      g.drawImage(img, 0, 0, img.width * w / (jl + jh), img.height, jx, jy, w, jh);
    }
    const [cx, cy, cr] = P.cristal;
    if (ratio > .85 || coup) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5 + .3 * Math.sin(performance.now() / 90);
      g.drawImage(SPR.lueurBleu, cx - cr * 2, cy - cr * 2, cr * 4, cr * 4);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    coffrePop = Math.max(0, coffrePop - dt * 4);
    ecrireNombre(CHIF.petit, String(coffres), P.nombre[0], P.nombre[1], 1 + coffrePop * .45, 0);
  }
  dessinerNomCoup();
}
// ce que le moteur annonce : nouvelle partie (HUD remis à zéro, bandeau du morceau), note réussie (la chaîne saute)
ecouter('partie', () => { coffrePop = 0; scoreAffiche = 0; comboAge = 9; preparerBandeau(); peindreFond(); });
ecouter('note', j => { if (j !== 'MISS') comboAge = 0; });

// Compteur d'images par seconde, affiché en permanence pendant la phase de test (sous le titre) :
// images/s · pire écart entre deux images (ms) · temps de dessin moyen d'une image (ms) · résolution
let FPS = reglages.performances !== false;   // réglage « Afficher les performances » du menu (activé par défaut)
let fpsN = 0, fpsT = 0, fpsPire = 0, fpsDessin = 0, fpsTxt = '', fpsAlerte = false;
function compteur(ms, dessin) {
  fpsN++; fpsT += ms; fpsDessin += dessin; if (ms > fpsPire) fpsPire = ms;
  if (fpsT >= 500) {
    const ips = Math.round(fpsN * 1000 / fpsT);
    fpsTxt = `${ips} i/s${cale60 ? ' (calé à 60)' : ''} · pire ${Math.round(fpsPire)} ms · dessin ${(fpsDessin / fpsN).toFixed(1)} ms · ×${DPR}`;
    fpsAlerte = ips < 58 || fpsPire > 25;
    fpsN = fpsT = fpsDessin = fpsPire = 0;
  }
  if (!fpsTxt) return;
  const img = texteCache('fps', fpsTxt, 11, fpsAlerte ? '#ff8a7a' : '#7dff96', 'rgba(0,0,0,.85)');
  g.drawImage(img, 4 - img.marge * .5, (BANDEAU && etat !== 'menu' ? BANDEAU.h : 0) + 2, img.l, img.h);
}
