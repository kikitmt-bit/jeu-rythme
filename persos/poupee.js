/* ============================================================
   Poupées articulées : le moule commun à tous les personnages.

   Un personnage = une FICHE (persos/fiches.js) qui choisit des PIÈCES
   (persos/pieces.js : coiffures, coiffes, tenues, armes, boucliers) et des couleurs.
   Tout le reste est ici et ne change jamais d'un personnage à l'autre :
   proportions, visage, squelette, ombrage, animations. C'est ce qui garantit
   que tous les personnages ont exactement le même style.

   Repère : unités « poupée » (une poupée fait ~100 de haut), x vers la droite,
   y vers le bas, les pieds posés en (0, 0). La poupée regarde vers la gauche.
   Tout se dessine en pose de repos ; chaque morceau est accroché à un os.
   ============================================================ */
(function (G) {
'use strict';
const P = {};

/* ---------- Squelette (pivots en pose de repos) ---------- */
const OS = {
  racine:   {p: [0, -21]},
  jambeD1:  {p: [-4.6, -21],   parent: 'racine'},
  jambeD2:  {p: [-4.6, -12],   parent: 'jambeD1'},
  jambeG1:  {p: [4.6, -21],    parent: 'racine'},
  jambeG2:  {p: [4.6, -12],    parent: 'jambeG1'},
  torse:    {p: [0, -22],      parent: 'racine'},
  tete:     {p: [0, -45],      parent: 'torse', e: .9, d: [0, -2.6]},   // tête un peu réduite ; le cou est caché dans le col
  queue:    {p: [20, -82],     parent: 'tete'},     // ce qui pend derrière la tête (bonnet, couette…)
  brasD1:   {p: [-8.5, -40],   parent: 'torse'},    // bras droit du perso = côté éloigné (à gauche à l'écran)
  brasD2:   {p: [-14, -33.5],  parent: 'brasD1'},
  arme:     {p: [-20.5, -30],  parent: 'brasD2'},
  brasG1:   {p: [8.5, -40],    parent: 'torse'},    // bras gauche = côté proche
  brasG2:   {p: [13, -33],     parent: 'brasG1'},
  bouclier: {p: [15.5, -27.5], parent: 'brasG2'},
};
const ORDRE_OS = Object.keys(OS);
P.OS = OS;

/* Ordre d'empilement des couches (du fond vers le devant) */
const Z = {queue: 5, cheveuxArr: 8, brasD: 20, jambeD: 30, jambeG: 40, cou: 45, torse: 50,
           brasG: 60, coiffeArr: 78, tete: 80, visage: 82, oreille: 84, cheveux: 86, coiffe: 90, arme: 92, mainD: 93, bouclier: 95};   // l'arme est au premier plan, la main qui la tient par-dessus
P.Z = Z;

/* Tête : mêmes mesures pour tout le monde */
const TETE = 'M -1,-87 C 12.5,-87 22.6,-77.5 22.6,-64.5 C 22.6,-51.2 13.6,-43 -1,-43 C -15.6,-43 -24.6,-51.2 -24.6,-64.5 C -24.6,-77.5 -14.5,-87 -1,-87 Z';
P.TETE = TETE;

/* ---------- Couleurs ---------- */
function rvb(c) {
  if (c[0] === '#') {
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  return [128, 128, 128];
}
function tsl([r, v, b]) {
  r /= 255; v /= 255; b /= 255;
  const M = Math.max(r, v, b), m = Math.min(r, v, b), l = (M + m) / 2, d = M - m;
  let t = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    t = M === r ? ((v - b) / d) % 6 : M === v ? (b - r) / d + 2 : (r - v) / d + 4;
    t *= 60; if (t < 0) t += 360;
  }
  return [t, s, l];
}
const css = (t, s, l, a) => `hsla(${t.toFixed(1)},${(Math.min(1, s) * 100).toFixed(1)}%,${(Math.max(0, Math.min(1, l)) * 100).toFixed(1)}%,${a})`;
// l'ombre d'une couleur : plus foncée, un peu plus saturée, tirée vers le froid
function ombreDe(c, a) {
  let [t, s, l] = tsl(rvb(c));
  if (t >= 70 && t < 200) t += 14; else if (t < 70) t = Math.max(8, t - 12); else if (t > 320) t -= 10;
  return css(t, s * 1.15 + .05, l * .55, a);
}
function lumiereDe(c, a) { const [t, s, l] = tsl(rvb(c)); return css(t, s * .8, l + (1 - l) * .6, a); }
P.fonce = (c, k = .8) => { const [t, s, l] = tsl(rvb(c)); return css(t, s, l * k, 1); };
P.clair = (c, k = .3) => { const [t, s, l] = tsl(rvb(c)); return css(t, s, l + (1 - l) * k, 1); };

/* ---------- Formes ---------- */
P.ell = (cx, cy, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot * Math.PI / 180, 0, 7); return p; };
P.capsule = (x1, y1, x2, y2, r1, r2 = r1) => {
  const a = Math.atan2(y2 - y1, x2 - x1), p = new Path2D();
  p.arc(x1, y1, r1, a + Math.PI / 2, a - Math.PI / 2);
  p.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2);
  p.closePath(); return p;
};
const chemin = d => typeof d === 'string' ? new Path2D(d) : d;

/* ---------- Le pinceau : la seule façon de peindre, donc le même rendu partout ----------
   forme(d, couleur, {taille})  : aplat + volume (ombre douce en bas à droite, lumière en haut à gauche)
     taille : 'g' gros volume (tête, bouclier), 'm' moyen (membres, vêtements), 'p' petit détail, 0 = à plat */
const VOLUMES = {g: [6, 2.8, .78, .55], m: [2.8, 1.3, .72, .45], p: [1.1, .5, .55, .35]};
function pinceau(ctx, S, volume) {
  const LOIN = 30000;
  const p = {
    ctx, S,
    forme(d, couleur, o = {}) {
      const ch = chemin(d), t = o.taille === undefined ? 'm' : o.taille;
      ctx.fillStyle = couleur; ctx.fill(ch);
      if (!t || volume <= 0 || couleur[0] !== '#') return p;
      const [flou, dec, fo, fl] = VOLUMES[t], f = volume * (o.force === undefined ? 1 : o.force);
      const inv = new Path2D(); inv.rect(-400, -400, 800, 800); inv.addPath(ch);
      ctx.save(); ctx.clip(ch);
      const m = ctx.getTransform();
      ctx.setTransform(m.a, m.b, m.c, m.d, m.e - LOIN, m.f);
      ctx.fillStyle = '#000';
      ctx.shadowBlur = flou * S; ctx.shadowColor = ombreDe(couleur, fo * f);
      ctx.shadowOffsetX = LOIN - dec * S; ctx.shadowOffsetY = -dec * S;
      ctx.fill(inv, 'evenodd');
      ctx.shadowBlur = flou * .8 * S; ctx.shadowColor = lumiereDe(couleur, fl * f);
      ctx.shadowOffsetX = LOIN + dec * .9 * S; ctx.shadowOffsetY = dec * .9 * S;
      ctx.fill(inv, 'evenodd');
      ctx.restore();
      return p;
    },
    // ombre portée par une forme sur ce qui est dessous (visible seulement à l'intérieur de `limite`) ;
    // couleur = celle de la surface qui reçoit l'ombre
    portee(d, limite, couleur, o = {}) {
      if (volume <= 0) return p;
      ctx.save(); ctx.clip(chemin(limite));
      const m = ctx.getTransform();
      ctx.setTransform(m.a, m.b, m.c, m.d, m.e - LOIN, m.f);
      ctx.shadowColor = ombreDe(couleur, (o.force || .5) * volume); ctx.shadowBlur = (o.flou || 2.5) * S;
      ctx.shadowOffsetX = LOIN + (o.dx || 0) * S; ctx.shadowOffsetY = (o.dy === undefined ? 1.5 : o.dy) * S;
      ctx.fillStyle = '#000'; ctx.fill(chemin(d)); ctx.restore(); return p;
    },
    // image fournie (paquet chiffré), hauteur h ; son point d'ancrage (ax, ay : 0 à 1 dans l'image, le centre par défaut)
    // est posé en (x, y) ; rend false si elle n'est pas chargée
    image(nom, x, y, h, ax = .5, ay = .5) {
      const im = P.images[nom]; if (!im) return false;
      const l = h * im.width / im.height;
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, x - l * ax, y - h * ay, l, h); return true;
    },
    trait(d, couleur, largeur = .6, a = 1) {
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke(chemin(d)); ctx.restore(); return p;
    },
    // tache douce (joues, reflets)
    halo(cx, cy, r, couleur, a = .5) {
      const [R, V, B] = rvb(couleur), gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(${R},${V},${B},${a})`); gr.addColorStop(.55, `rgba(${R},${V},${B},${a * .6})`); gr.addColorStop(1, `rgba(${R},${V},${B},0)`);
      ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); return p;
    },
    degrade(x0, y0, x1, y1, ...couleurs) {
      const gr = ctx.createLinearGradient(x0, y0, x1, y1);
      couleurs.forEach((c, i) => gr.addColorStop(i / (couleurs.length - 1), c)); return gr;
    },
    // dessiner seulement à l'intérieur d'une forme
    dans(d, fn) { ctx.save(); ctx.clip(chemin(d)); fn(p); ctx.restore(); return p; },
    // dessiner dans un repère local (pièces dessinées droites puis posées en biais : armes, boucliers)
    repere(x, y, angle, fn, ech = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180); ctx.scale(ech, ech); fn(p); ctx.restore(); return p; },
  };
  return p;
}

/* ---------- Le mannequin : le corps commun ---------- */
function couchesDuCorps(f) {
  const peau = f.peau || '#f9d5b5', yeux = f.yeux || '#2a4a6b';
  const b = Object.assign({manche: '#cccccc', dessous: null, gant: null}, f.bras);
  const j = Object.assign({collant: '#eeeeee', botte: '#7a4a2c'}, f.jambes);
  const c = [];
  const bras = (os1, os2, z) => {
    const [ex, ey] = OS[os1].p, [cx, cy] = OS[os2].p, [mx, my] = OS[os1 === 'brasD1' ? 'arme' : 'bouclier'].p;
    c.push({os: os1, z, dessin(p) {
      p.forme(P.capsule(ex, ey, cx, cy, 3.1, 2.7), b.dessous || peau);
      p.forme(P.capsule(ex, ey, ex + (cx - ex) * .55, ey + (cy - ey) * .55, 3.7, 3.5), b.manche);   // manche courte
    }});
    c.push({os: os2, z: z + 1, dessin(p) {
      p.forme(P.capsule(cx, cy, mx, my, 2.7, 2.5), b.gant || b.dessous || peau);
    }});
    // la main est une couche à part : celle qui tient l'arme passe devant l'arme
    c.push({os: os2, z: os1 === 'brasD1' ? Z.mainD : z + 1, dessin(p) {
      const main = P.ell(mx, my, 3.1, 3);
      p.forme(main, peau);                                                                          // la main
      if (b.gant) {                                                                                 // gant : la moitié de la main, côté poignet
        const n = Math.hypot(cx - mx, cy - my), ux = (cx - mx) / n, uy = (cy - my) / n, d = -.4;
        const q = (a, t) => (mx + ux * a - uy * t).toFixed(2) + ',' + (my + uy * a + ux * t).toFixed(2);
        p.dans(main, () => p.forme(`M ${q(d, -5)} L ${q(d, 5)} L ${q(6, 5)} L ${q(6, -5)} Z`, b.gant, {taille: 'p'}));
        const m2 = .82;                                                                             // revers du gant, près du coude
        const r = (a, t) => (cx + (mx - cx) * a + uy * t).toFixed(2) + ',' + (cy + (my - cy) * a - ux * t).toFixed(2);
        p.forme(`M ${r(.05, -3.3)} L ${r(.05, 3.3)} L ${r(.3, 3.1)} L ${r(.3, -3.1)} Z`, P.clair(b.gant, .14), {taille: 'p'});
      }
    }});
  };
  const jambe = (os1, os2, z) => {
    const [hx, hy] = OS[os1].p, [gx, gy] = OS[os2].p;
    c.push({os: os1, z, dessin(p) { p.forme(P.capsule(hx, hy, gx, gy, 3.3, 3), j.collant); }});
    c.push({os: os2, z: z + 1, dessin(p) {
      p.forme(P.capsule(gx, gy, gx, -6, 3, 2.9), j.collant);
      const x = gx;   // botte, pointe vers la gauche
      p.forme(`M ${x - 3.7},-9.6 L ${x + 3.7},-9.6 L ${x + 3.9},-1.6 Q ${x + 3.9},0 ${x + 2.3},0 L ${x - 6.4},0 Q ${x - 8.4},0 ${x - 7.9},-2.1 Q ${x - 6.8},-4.3 ${x - 3.9},-4.8 Z`, j.botte);
      p.forme(`M ${x - 4.1},-10.4 L ${x + 4.1},-10.4 L ${x + 4.1},-8 L ${x - 4.1},-8 Z`, P.clair(j.botte, .12), {taille: 'p'});
    }});
  };
  bras('brasD1', 'brasD2', Z.brasD);
  bras('brasG1', 'brasG2', Z.brasG);
  jambe('jambeD1', 'jambeD2', Z.jambeD);
  jambe('jambeG1', 'jambeG2', Z.jambeG);
  c.push({os: 'torse', z: Z.cou, dessin(p) { const cou = P.capsule(-1.5, -49, -1.5, -42, 2.4);
    p.forme(cou, peau, {taille: 'p'});
    p.portee(P.ell(-1, -53, 12, 6), cou, peau, {dy: 1, flou: 1.6, force: .5});                // l'ombre du menton
  }});
  // la tête et le visage : identiques pour tous (seules les couleurs changent)
  c.push({os: 'tete', z: Z.tete, dessin(p) {
    p.forme(TETE, peau, {taille: 'g', force: .5});
    p.dans(TETE, () => { p.halo(-19, -53.4, 4.8, '#ff7d8c', .3); p.halo(12.5, -53.4, 5.4, '#ff7d8c', .3); });
    // le nez : un tout petit ovale couché, presque noir
    p.forme(P.ell(-6.6, -55.9, 1.25, .52), '#4a2c1c', {taille: 0});
    // la bouche : un petit toit rose très plat, pointe vers la gauche
    p.forme('M -8.4,-49.1 Q -6.6,-50.1 -5.3,-50.7 Q -1.5,-49.3 2.2,-48.3 Q -3.1,-47 -8.4,-49.1 Z', p.degrade(0, -50.7, 0, -47.4, '#e9539a', '#f77fb4'), {taille: 0});
  }});
  // les deux yeux ont exactement la même taille : ovales pleins, bien écartés, à peine plus sombres en bas
  c.push({os: 'tete', z: Z.visage, si: {yeux: 'ouverts'}, dessin(p) {
    const bas = P.fonce(yeux, .8);
    for (const x of [-15.6, 5.2]) p.forme(P.ell(x, -60.4, 3.15, 3.95), p.degrade(0, -64.3, 0, -56.4, yeux, yeux, bas), {taille: 0});
  }});
  c.push({os: 'tete', z: Z.visage, si: {yeux: 'fermes'}, dessin(p) {
    for (const x of [-15.6, 5.2]) p.trait(`M ${x - 3},-59.8 Q ${x},-57.5 ${x + 3},-59.8`, P.fonce(yeux, .5), .9);
  }});
  if (f.oreilles === 'pointues') c.push({os: 'tete', z: Z.oreille, dessin(p) {
    p.forme('M 19,-66 Q 27.5,-63.5 33.5,-56 Q 26.5,-52 18.8,-52.4 Z', peau, {taille: 'p', force: 1.4});
    p.forme('M 21.5,-62.6 Q 26.5,-60.6 30,-56.6 Q 25.5,-55 21.4,-55.4 Z', ombreDe(peau, .28), {taille: 0});
  }});
  return c;
}

/* ---------- Fabrication : chaque couche est peinte une fois, puis réutilisée à chaque image ---------- */
P.pieces = {coiffures: {}, coiffes: {}, tenues: {}, armes: {}, boucliers: {}};
P.fiches = {};
/* Images qui ne peuvent pas être dessinées par le code (emblèmes de vrais jeux…) : c'est Kiki qui les fournit,
   elles sont rangées dans un paquet chiffré avec le mot de passe familial (outils/chiffrer.py images). */
P.images = {};
P.paquets = [];
P.chargerImages = async function (cle) {
  let neuf = false;
  for (const url of P.paquets) try {
    const r = await fetch(url); if (!r.ok) continue;
    const o = new Uint8Array(await r.arrayBuffer());
    const clair = await crypto.subtle.decrypt({name: 'AES-GCM', iv: o.slice(0, 12)}, cle, o.slice(12));
    const paquet = JSON.parse(new TextDecoder().decode(clair));
    await Promise.all(Object.entries(paquet).map(([nom, b]) => new Promise(ok => {
      const i = new Image(); i.onload = () => { P.images[nom] = i; neuf = true; ok(); }; i.onerror = ok; i.src = 'data:image/png;base64,' + b;
    })));
  } catch (e) {}
  return neuf;
};
P.fiche = f => { P.fiches[f.id] = f; return f; };

const CADRE = [-75, -112, 75, 12];   // zone de travail en unités
function couchesDe(f) {
  let c = couchesDuCorps(f);
  const ajoute = (famille, o) => {
    if (!o) return;
    const piece = P.pieces[famille][o.modele];
    if (!piece) { console.warn('Pièce inconnue : ' + famille + ' / ' + o.modele); return; }
    c = c.concat(piece(o, f));
  };
  ajoute('coiffures', f.cheveux); ajoute('coiffes', f.coiffe); ajoute('tenues', f.tenue);
  ajoute('armes', f.arme); ajoute('boucliers', f.bouclier);
  return c.map((x, i) => Object.assign({i}, x)).sort((a, b) => a.z - b.z || a.i - b.i);
}
/* fabrique(fiche, {echelle, volume}) : echelle = pixels par unité (taille d'affichage / 100), volume 0 (à plat) à 1 */
P.fabrique = function (f, o = {}) {
  if (typeof f === 'string') f = P.fiches[f];
  const S = o.echelle || 4, volume = o.volume === undefined ? 1 : o.volume;
  const L = Math.ceil((CADRE[2] - CADRE[0]) * S), H = Math.ceil((CADRE[3] - CADRE[1]) * S);
  const tmp = document.createElement('canvas'); tmp.width = L; tmp.height = H;
  const ctx = tmp.getContext('2d', {willReadFrequently: true});
  const couches = [];
  for (const def of couchesDe(f)) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, L, H);
    ctx.setTransform(S, 0, 0, S, -CADRE[0] * S, -CADRE[1] * S);
    def.dessin(pinceau(ctx, S, volume));
    // on ne garde que le rectangle utile
    const px = ctx.getImageData(0, 0, L, H).data;
    let x0 = L, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0, k = y * L * 4 + 3; x < L; x++, k += 4) if (px[k]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) continue;
    const img = document.createElement('canvas'); img.width = x1 - x0 + 1; img.height = y1 - y0 + 1;
    img.getContext('2d').drawImage(tmp, -x0, -y0);
    couches.push({os: def.os, si: def.si, img, x: x0 / S + CADRE[0], y: y0 / S + CADRE[1], l: img.width / S, h: img.height / S});
  }
  return {fiche: f, echelle: S, couches};
};

/* ---------- Poses et animations ---------- */
const REPOS = {x: 0, y: 0, yeux: 'ouverts'};
for (const o of ORDRE_OS) REPOS[o] = 0;
P.pose = o => Object.assign({}, REPOS, o);

const rad = Math.PI / 180;
function matrices(pose) {
  const m = {};
  for (const nom of ORDRE_OS) {
    const os = OS[nom], a = (pose[nom] || 0) * rad, c = Math.cos(a), s = Math.sin(a), [px, py] = os.p;
    // rotation autour du pivot (+ déplacement pour la racine)
    const e = os.e || 1, dx = os.d ? os.d[0] : 0, dy = os.d ? os.d[1] : 0;
    let l = [c * e, s * e, -s * e, c * e, px - e * (c * px - s * py) + dx, py - e * (s * px + c * py) + dy];
    if (!os.parent) { l[4] += pose.x || 0; l[5] += pose.y || 0; }
    const q = os.parent && m[os.parent];
    m[nom] = q ? [q[0] * l[0] + q[2] * l[1], q[1] * l[0] + q[3] * l[1], q[0] * l[2] + q[2] * l[3], q[1] * l[2] + q[3] * l[3],
                  q[0] * l[4] + q[2] * l[5] + q[4], q[1] * l[4] + q[3] * l[5] + q[5]] : l;
  }
  return m;
}
/* dessine(ctx, poupee, x, y, pose, {taille, miroir}) : pieds en (x, y), en pixels ; taille = hauteur d'une poupée de 100 */
P.dessine = function (ctx, poupee, x, y, pose, o = {}) {
  const k = (o.taille || poupee.echelle * 100) / 100, sx = o.miroir ? -k : k, m = matrices(pose || REPOS);
  const B = ctx.getTransform();   // on respecte l'échelle déjà en place sur la toile
  ctx.save();
  for (const c of poupee.couches) {
    if (c.si) { let ok = true; for (const cle in c.si) if ((pose && pose[cle] || REPOS[cle]) !== c.si[cle]) ok = false; if (!ok) continue; }
    const q = m[c.os];
    const a = sx * q[0], b = k * q[1], c2 = sx * q[2], d = k * q[3], e = sx * q[4] + x, f = k * q[5] + y;
    ctx.setTransform(B.a * a + B.c * b, B.b * a + B.d * b, B.a * c2 + B.c * d, B.b * c2 + B.d * d, B.a * e + B.c * f + B.e, B.b * e + B.d * f + B.f);
    ctx.drawImage(c.img, c.x, c.y, c.l, c.h);
  }
  ctx.restore();
};
P.matrices = matrices;

/* Animations : nom → {duree (s), boucle, pose(u)} avec u de 0 à 1.
   Elles sont écrites une fois pour le squelette : tous les personnages les ont. */
const sin = u => Math.sin(u * 2 * Math.PI);
const clin = t => ((t + 2) % 3.4) < .13 ? 'fermes' : 'ouverts';
P.animations = {
  attente: {duree: 1.6, boucle: true, pose(u, t) {
    const r = sin(u);
    return P.pose({y: r * .5 + .5, torse: r * .6, tete: -r * 1.2, queue: r * 3, brasD1: r * 2, brasG1: -r * 2, arme: r * 1.5, yeux: clin(t)});
  }},
  marche: {duree: .72, boucle: true, pose(u, t) {
    const a = sin(u), b = sin(u + .25), pli = v => Math.max(0, v);
    return P.pose({
      y: -Math.abs(b) * 1.5 + .6, torse: 2 + a * 1.5, tete: -1.5 + sin(u * 2 + .1) * 1.6,
      jambeD1: a * 26, jambeD2: -pli(sin(u - .2)) * 42, jambeG1: -a * 26, jambeG2: -pli(sin(u + .3)) * 42,
      brasD1: -a * 8, brasD2: -a * 4, arme: -a * 3, brasG1: a * 12, brasG2: a * 4, bouclier: -a * 3,
      queue: sin(u * 2 - .2) * 7 + 3, yeux: clin(t),
    });
  }},
};
P.poseA = (nom, t) => { const a = P.animations[nom] || P.animations.attente; return a.pose(a.boucle ? (t / a.duree) % 1 : Math.min(1, t / a.duree), t); };

G.Poupee = P;
})(window);
