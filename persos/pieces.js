/* ============================================================
   Bibliothèque de pièces pour habiller le mannequin (persos/poupee.js).
   Chaque pièce reçoit ses options (couleurs…) et la fiche, et rend des couches :
     {os: à quel os elle est accrochée, z: ordre d'empilement, dessin(p): ce qu'elle peint}
   On dessine en pose de repos, dans le repère de la poupée (pieds en 0,0, ~100 de haut).
   Nouveau personnage → on réutilise ces pièces ; s'il en manque une, on l'ajoute ici.
   ============================================================ */
(function () {
'use strict';
const P = window.Poupee, Z = P.Z, OS = P.OS, PEAU = '#f9d5b5';
const {coiffures, coiffes, tenues, armes, boucliers} = P.pieces;

/* ---------- Coiffures ---------- */
// raie sur le côté : deux grosses mèches bombées qui encadrent le visage et descendent en pattes jusqu'au menton
coiffures.raie = (o, fiche) => {
  const c = o.couleur, f = P.fonce(c, .7), peau = fiche.peau || PEAU;
  const gauche = 'M -6,-78.5 C -6.6,-83 -6,-86.5 -4,-89.5 C -18.5,-91 -28.6,-80.5 -28.6,-65 C -29.2,-56 -27.6,-49.5 -23.4,-44.6 C -22.2,-50.5 -21.8,-56 -21,-61 C -20.2,-63.2 -19.2,-64.2 -18,-64.4 C -12.5,-66.5 -7,-72 -6,-78.5 Z';
  const droite = 'M -6,-78.5 C -3,-71.5 5,-66.6 12,-64.4 C 12.8,-56 14.2,-46.6 17.8,-39.4 C 22,-45.6 25.2,-53 25,-62 L 24.6,-72 C 18.5,-83.5 8,-89.5 -4,-89.5 C -6,-86.5 -6.6,-83 -6,-78.5 Z';
  return [{os: 'tete', z: Z.cheveux, dessin(p) {
    p.portee(gauche, P.TETE, peau, {dy: 1.4, dx: .5, flou: 2.6, force: .42});
    p.portee(droite, P.TETE, peau, {dy: 1.4, dx: -.4, flou: 2.6, force: .42});
    p.forme(droite, c, {taille: 'g'});
    p.forme(gauche, c, {taille: 'g'});
    // quelques cheveux
    p.trait('M -24.6,-68 C -26,-60 -25.6,-53 -23.6,-47.5', f, .45, .5);
    p.trait('M -13,-71.5 C -16,-69 -18.4,-66.6 -19.6,-63.4', f, .4, .45);
    p.trait('M 19,-70.5 C 21,-62 20.6,-52 18.2,-43.5', f, .45, .5);
    p.trait('M 5,-70.5 C 8,-68.6 10.4,-66.8 11.8,-64.6', f, .4, .45);
  }}];
};

/* ---------- Coiffes ---------- */
// long bonnet souple qui retombe derrière la tête
coiffes.bonnet = o => {
  // Posé à l'arrière du crâne : il passe DERRIÈRE les cheveux, suit la forme de la tête (peu bombé) et redescend
  // derrière l'oreille jusqu'à l'épaule (le bas passe derrière le bouclier). Aucun trait : le volume vient seulement des ombres. (Forme tracée par Kiki le 12/11.)
  return [{os: 'tete', z: Z.coiffeArr, dessin(p) {
    p.forme('M -20,-84 C -17,-91 -10,-96 -2,-98 C 8,-100.5 20,-99.5 28,-93.5 C 34.5,-88.5 37.2,-80 37.3,-71 C 37.4,-62 37.8,-52 36.8,-46 C 36,-41.2 32.6,-38.4 29.6,-39.4 C 27.6,-42 26.4,-46 26,-50 L 20,-62 L -4,-78 Z', o.couleur, {taille: 'g'});
  }}];
};

/* ---------- Tenues ---------- */
// tunique évasée à manches courtes, ceinture et bandoulière en option
tenues.tunique = o => {
  const c = o.couleur, dessous = o.dessous || '#f3eee2';
  const robe = 'M -8,-44.5 L 8,-44.5 C 10.4,-43.6 11.2,-41 11.3,-38.5 L 13.8,-18.6 Q 0,-14.8 -13.8,-18.6 L -11.3,-38.5 C -11.2,-41 -10.4,-43.6 -8,-44.5 Z';
  // boucle : un simple cadre doré, plus large que haut, qui dépasse à peine de la sangle (la même partout)
  const boucle = (p, x, y, a, fond) => p.repere(x, y, a, () => {
    p.forme('M -2.5,-2 L 2.5,-2 L 2.5,2 L -2.5,2 Z', o.boucle, {taille: 'p'});
    p.forme('M -1.6,-1.15 L 1.6,-1.15 L 1.6,1.15 L -1.6,1.15 Z', P.fonce(fond, .8), {taille: 0});
  });
  // Le col : la tunique remonte autour du cou (on ne voit pas le cou), ouverte en V sur le vêtement de dessous.
  // Le perso est de trois quarts : le V est décalé vers la gauche, le pan gauche est très fin, le droit est large.
  // Les pans restent bas et près du cou : ils ne doivent pas dépasser de chaque côté de la tête.
  const V = 'M -7,-49.6 L 1.6,-50 L -3.6,-41 Z';
  const panG = 'M -8.8,-43.6 L -7.9,-48.4 L -6.8,-49.4 L -3.6,-40.6 L -3.6,-39 L -6.2,-43.6 Z';
  const panD = 'M 8.8,-43.4 L 6.4,-48.8 L 1.8,-50.2 L -3.6,-40.6 L -3.6,-39 L -.4,-43.6 Z';
  const couches = [{os: 'torse', z: Z.torse, dessin(p) {
    p.forme(robe, c, {taille: 'g', force: .9});
    p.portee(P.ell(-1, -53, 14, 9.5), robe, c, {dy: 1.2, flou: 3, force: .55});        // l'ombre de la tête
    p.forme(V, dessous, {taille: 0});
    p.portee(P.ell(-1, -53, 13, 7.6), V, dessous, {dy: 1, flou: 1.4, force: .4});
    p.forme(panG, c, {taille: 'p', force: .9}); p.forme(panD, c, {taille: 'p', force: .9});
    if (o.col) { p.trait('M -6.9,-49.4 L -3.7,-40.9', o.col, .6, .9); p.trait('M 1.7,-50 L -3.5,-40.9', o.col, .6, .9); }
    p.dans(robe, () => {
      p.trait('M -6,-21 Q -5.6,-19 -6.4,-16.6', P.fonce(c, .78), .45, .5);              // plis du bas
      p.trait('M 5,-21.4 Q 5.6,-19 5,-16.4', P.fonce(c, .78), .45, .5);
      if (o.ceinture) {
        p.forme('M -14,-27.6 Q 0,-25.4 14,-27.6 L 14,-24.2 Q 0,-22 -14,-24.2 Z', o.ceinture, {taille: 'p'});
        if (o.boucle) boucle(p, -2.6, -25.1, 0, o.ceinture);
      }
    });
  }}];
  // Le V est court : il s'arrête bien avant la bandoulière.
  // La bandoulière passe PAR-DESSUS l'épaule : elle est peinte après le haut du bras.
  // Même largeur que la ceinture d'un bout à l'autre ; elle dépasse des deux côtés (coupée au bord du vêtement).
  if (o.bandouliere) couches.push({os: 'torse', z: Z.brasG + .5, dessin(p) {
    const [ex, ey] = OS.brasG1.p, [cx, cy] = OS.brasG2.p;
    const zone = new Path2D(robe);
    zone.addPath(P.capsule(ex, ey, ex + (cx - ex) * .55, ey + (cy - ey) * .55, 3.7, 3.5));      // la manche (voir poupee.js)
    const A = [12.6, -46.1], B = [-15.4, -25.2], n = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const nx = -(B[1] - A[1]) / n * 1.7, ny = (B[0] - A[0]) / n * 1.7, t = .56;
    p.dans(zone, () => {
      p.forme(`M ${A[0] + nx},${A[1] + ny} L ${A[0] - nx},${A[1] - ny} L ${B[0] - nx},${B[1] - ny} L ${B[0] + nx},${B[1] + ny} Z`, o.bandouliere, {taille: 'p'});
      if (o.boucle) boucle(p, A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, Math.atan2(A[1] - B[1], A[0] - B[0]) * 180 / Math.PI, o.bandouliere);
    });
  }});
  return couches;
};

/* ---------- Armes (dessinées droites, poignée en 0,0, lame vers le haut ; tenues dans la main droite) ---------- */
// épée droite à garde simple
armes.epee = o => {
  const [mx, my] = OS.arme.p, lame = o.lame || '#e4eaf1', garde = o.garde || '#e0b23a', L = o.longueur || 47;
  return [{os: 'arme', z: Z.arme, dessin(p) {
    p.repere(mx, my, o.angle === undefined ? -24 : o.angle, () => {
      p.forme(`M -2.4,-4 L -2.4,${-L + 6} L 0,${-L} L 2.4,${-L + 6} L 2.4,-4 Z`, lame, {taille: 'p', force: .8});
      p.forme(`M 0,-4 L 0,${-L} L 2.4,${-L + 6} L 2.4,-4 Z`, P.fonce(lame, .86), {taille: 0});
      p.forme('M -1.2,-3 L 1.2,-3 L 1.1,5.4 L -1.1,5.4 Z', o.poignee || '#6b4630', {taille: 'p'});
      p.forme('M -6.4,-5.4 Q 0,-3.4 6.4,-5.4 Q 7.4,-4 6.6,-2.6 Q 0,-1 -6.6,-2.6 Q -7.4,-4 -6.4,-5.4 Z', garde, {taille: 'p'});
      p.forme(P.ell(0, -3.7, 1.2, 1.2), o.pierre || '#d8483f', {taille: 'p'});
      p.forme(P.ell(0, 6.2, 1.7, 1.7), garde, {taille: 'p'});
    });
  }}];
};
// grande épée à garde ailée : lame large à la base, deux ailes relevées, pierre au centre
armes['epee-ailee'] = o => {
  const [mx, my] = OS.arme.p, lame = o.lame || '#e6ebf2', garde = o.garde || '#5a4bb8', L = o.longueur || 54;
  // chaque aile part du cœur de la garde, s'écarte puis remonte en corne
  const aile = s => `M ${s * 1.4},-9 C ${s * 4},-8.4 ${s * 6.4},-9 ${s * 7.6},-10.8 C ${s * 8.4},-12 ${s * 8.8},-13.2 ${s * 8.7},-14.6 C ${s * 11.4},-12 ${s * 11.6},-7.6 ${s * 8.4},-5 C ${s * 6.2},-3.4 ${s * 3.4},-3.6 ${s * 1.4},-4.8 Z`;
  const plume = s => `M ${s * 3},-6.2 C ${s * 6},-5.6 ${s * 9.4},-7.6 ${s * 9.8},-12.4`;
  return [{os: 'arme', z: Z.arme, dessin(p) {
    p.repere(mx, my, o.angle === undefined ? -22 : o.angle, () => {
      const forme = `M -2.5,-8 L -3.3,-13.4 L -2.5,-16 L -2.5,${-L + 7} L 0,${-L} L 2.5,${-L + 7} L 2.5,-16 L 3.3,-13.4 L 2.5,-8 Z`;
      p.forme(forme, lame, {taille: 'p', force: .9});
      p.forme(`M 0,-8 L 0,${-L} L 2.5,${-L + 7} L 2.5,-16 L 3.3,-13.4 L 2.5,-8 Z`, P.fonce(lame, .85), {taille: 0});
      p.trait(`M 0,-15 L 0,${-L + 8}`, P.clair(lame, .6), .35, .8);
      p.forme('M -1.35,-5 L 1.35,-5 L 1.2,5.2 L -1.2,5.2 Z', P.fonce(garde, .85), {taille: 'p'});      // poignée
      for (const y of [-1.4, .6, 2.6]) p.trait(`M -1.2,${y} L 1.2,${y + .8}`, P.clair(garde, .3), .35, .7);
      p.forme('M -1.9,5 L 1.9,5 L 1.5,7.6 Q 0,8.6 -1.5,7.6 Z', garde, {taille: 'p'});                 // pommeau
      p.forme(aile(-1), garde, {taille: 'p', force: 1.2}); p.forme(aile(1), garde, {taille: 'p', force: 1.2});
      p.trait(plume(-1), P.clair(garde, .35), .4, .8); p.trait(plume(1), P.clair(garde, .35), .4, .8);
      p.forme('M -2.2,-9.4 L 2.2,-9.4 L 2.6,-4.4 L -2.6,-4.4 Z', garde, {taille: 'p'});               // cœur de la garde
      p.forme('M 0,-9 L 1.5,-7 L 0,-5 L -1.5,-7 Z', o.pierre || '#f2cf4a', {taille: 'p'});
    });
  }}];
};

// arme dont l'image est fournie par Kiki (paquet chiffré). `ancre` = l'endroit de l'image que la main tient
// (0 à 1 en largeur et en hauteur). Tant qu'elle n'est pas chargée, on dessine `secours`.
armes.image = (o, fiche) => {
  const [mx, my] = OS.arme.p, [ax, ay] = o.ancre || [.5, .85];
  if (!P.images[o.image]) return o.secours ? armes[o.secours.modele](o.secours, fiche) : [];
  return [{os: 'arme', z: Z.arme, dessin(p) {
    p.repere(mx, my, o.angle || 0, () => p.image(o.image, 0, 0, o.hauteur || 60, ax, ay));
  }}];
};

/* ---------- Boucliers (dessinés droits, centrés en 0,0 ; portés au bras gauche) ---------- */
const EMBLEMES = {
  // une croche : le blason de l'équipe
  note(p, c) {
    p.forme(P.ell(-2.6, 6.4, 3.5, 2.6, -20), c, {taille: 'p'});
    p.forme('M -.2,6.6 L -.2,-8.6 L 1.3,-8.6 L 1.3,6.6 Z', c, {taille: 0});
    p.forme('M 1.2,-8.6 C 5.4,-6.6 7.6,-3.2 6,1.2 C 5.8,-2 3.8,-4 1.2,-4.6 Z', c, {taille: 'p'});
  },
  etoile(p, c) {
    let d = '';
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L ' : 'M ') + (Math.cos(a) * r).toFixed(2) + ',' + (Math.sin(a) * r + 1).toFixed(2) + ' '; }
    p.forme(d + 'Z', c, {taille: 'p'});
  },
};
// écu à large bord de métal riveté
boucliers.ecu = o => {
  const [mx, my] = OS.bouclier.p, bord = o.bord || '#c9d1da', fond = o.fond || '#3b68c6';
  const forme = 'M -13.6,-15.4 Q -7,-17.6 0,-16 Q 7,-17.6 13.6,-15.4 L 13.2,-3 C 12.6,8 6,14.6 0,19.6 C -6,14.6 -12.6,8 -13.2,-3 Z';
  return [{os: 'bouclier', z: Z.bouclier, dessin(p) {
    p.repere(mx + 5, my - 1, o.angle === undefined ? 7 : o.angle, () => {
      p.forme(forme, bord, {taille: 'g'});
      p.repere(0, .4, 0, () => {
        p.forme(forme, P.fonce(bord, .72), {taille: 0});
      }, .86);
      p.repere(0, .5, 0, () => p.forme(forme, fond, {taille: 'g', force: .9}), .8);
      for (const [x, y] of [[-11.8, -14.2], [11.8, -14.2], [-11.9, -3], [11.9, -3], [-7.8, 9.6], [7.8, 9.6], [0, 17.2], [0, -14.8], [-10.6, 4], [10.6, 4]])
        p.forme(P.ell(x, y, .75, .75), P.fonce(bord, .62), {taille: 0}).forme(P.ell(x - .2, y - .2, .3, .3), P.clair(bord, .6), {taille: 0});
      const e = EMBLEMES[o.embleme];
      if (e) e(p, o.couleurEmbleme || '#f0c648');
    }, o.taille || 1);
  }}];
};
// bouclier dont l'image est fournie par Kiki (paquet chiffré) ; tant qu'elle n'est pas chargée, on dessine `secours`
boucliers.image = (o, fiche) => {
  const [mx, my] = OS.bouclier.p;
  if (!P.images[o.image]) return o.secours ? boucliers[o.secours.modele](o.secours, fiche) : [];
  return [{os: 'bouclier', z: Z.bouclier, dessin(p) {
    p.repere(mx + (o.dx === undefined ? 5 : o.dx), my + (o.dy || 0), o.angle === undefined ? 6 : o.angle, () => p.image(o.image, 0, 0, o.hauteur || 44));
  }}];
};

/* ============================================================
   Pièces de la princesse (13/11)
   ============================================================ */
// Une mèche : une forme fine et ondulée qui suit une ligne (points de passage, courbe douce) et s'affine jusqu'à la pointe.
// w = largeur à la racine. Les mèches posées les unes sur les autres montrent les mèches (voulu pour les cheveux, 14/11).
function mecheBords(pts, w, forme = 1.4, ronde = false) {   // ronde = racine arrondie (visible, pas cachée sous une autre mèche)
  const N = 40, P2 = [], cr = (a, b, c, d, t) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let k = 0; k <= N; k++) {
    const u = k / N * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), t = u - i;
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    P2.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
  }
  const g = [], d = [];
  for (let k = 0; k <= N; k++) {
    const a = P2[Math.max(0, k - 1)], b = P2[Math.min(N, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, t = k / N;
    const r = w / 2 * (1 - Math.pow(t, forme)) * (ronde ? Math.sqrt(Math.min(1, t / .14)) : t < .08 ? .75 + t / .08 * .25 : 1);
    g.push((P2[k][0] + nx * r).toFixed(2) + ',' + (P2[k][1] + ny * r).toFixed(2));
    d.unshift((P2[k][0] - nx * r).toFixed(2) + ',' + (P2[k][1] - ny * r).toFixed(2));
  }
  return [g, d];   // g : un bord, de la racine à la pointe ; d : l'autre bord, de la pointe à la racine
}
const meche = (...a) => { const [g, d] = mecheBords(...a); return 'M ' + g.join(' L ') + ' L ' + d.join(' L ') + ' Z'; };

// cheveux longs « vivants » (refaits le 14/11 d'après une poupée Theatrhythm envoyée par Kiki) :
//  - le dessus : raie au milieu (décalée à gauche, vue de trois quarts) et deux grosses mèches qui s'envolent aux tempes,
//    fondues dans le dessus (une seule forme, juste une ombre très douce sous chacune) ; rien sur le front (Kiki, 13/11) ;
//  - de chaque côté une mèche ondulée qui passe DEVANT l'oreille (les deux oreilles d'elfe restent visibles) et part vers l'extérieur au bout ;
//  - derrière, plus sombres : les cheveux longs qui tombent dans le dos en plusieurs mèches ondulées qui s'écartent vers l'extérieur.
// Le volume vient des ombres ; ce sont les mèches posées les unes sur les autres qui dessinent les cheveux (pas de traits).
coiffures.longs = (o, fiche) => {
  const c = o.couleur, fd = o.derriere || P.fonce(c, .86), peau = fiche.peau || PEAU;
  // Le dessus et ses deux grosses mèches (de la raie vers les tempes, qui s'envolent au bout) ne font qu'UNE forme :
  // aucun trait entre elles. Seule une ombre très douce sous chaque grosse mèche montre leur volume.
  const dessus = 'M -4,-79.4 C -9,-77.4 -15.5,-75 -20,-71.4 C -23.4,-69.4 -27.6,-68.2 -32.4,-67.4 C -30.4,-68.8 -29.4,-70.4 -29.2,-72.6 '
    + 'C -28.8,-80 -24,-89 -12.1,-93 C -9,-93.8 -6,-93.4 -3.8,-91.8 C -2,-93.6 1,-94.4 4,-94.2 C 14,-93.4 23.4,-86 25.8,-76 '
    + 'C 26.2,-73.6 26.6,-71 29,-68.6 C 26.8,-68.4 24.6,-67.6 23,-66.6 C 20,-68 16.6,-69.4 14,-70.2 C 8,-73 2,-76 -4,-79.4 Z';
  const [Lg, Ld] = mecheBords([[-3.4, -87], [-6, -89.2], [-13, -89], [-21, -84.6], [-26.4, -77.4], [-28.6, -71], [-32.4, -67.4]], 9.4, 1.3, true);
  const [Rg, Rd] = mecheBords([[-3.6, -87], [-1, -89.6], [7, -90], [17, -86], [23.2, -78.2], [25.4, -71.4], [29, -68.6]], 9.8, 1.3, true);
  const lobes = 'M ' + Lg.join(' L ') + ' L ' + Ld.join(' L ') + ' Z M ' + Rg.join(' L ') + ' L ' + Rd.join(' L ') + ' Z';
  const sousLobes = 'M ' + Ld.join(' L ') + ' L ' + Rg.join(' L ')                 // la bande entre les grosses mèches et le front
    + ' L 23,-66.6 C 20,-68 16.6,-69.4 14,-70.2 C 8,-73 2,-76 -4,-79.4 C -9,-77.4 -15.5,-75 -20,-71.4 C -23.4,-69.4 -27.6,-68.2 -32.4,-67.4 Z';
  const mechesDevant = [
    meche([[-21.4, -78], [-24, -66], [-21.8, -56], [-24, -47], [-26.6, -41], [-30, -39]], 6.6),     // côté gauche
    meche([[15.4, -77], [18.4, -65], [16.2, -55], [18.8, -46.4], [21.4, -40.6], [25, -39.4]], 7.2),       // côté droit, devant l'oreille
  ];
  const mechesCote = [meche([[-23.4, -60], [-26.6, -55], [-29.6, -50.8], [-32.6, -50]], 5)];   // petite mèche qui s'envole à la joue gauche, sous l'oreille
  const masse = 'M -6,-90 C 12,-91 26,-84 27.4,-70 C 28.2,-60 27.6,-50 26,-42 L 12,-34 L 8,-44 L -14,-44 L -24,-40 '
    + 'C -28,-46 -29.4,-56 -28.8,-66 C -28,-80 -19,-89.6 -6,-90 Z';
  const mechesDerriere = [
    meche([[24, -64], [27.6, -52], [26.6, -42], [28.6, -33], [31.6, -27.2], [33.6, -26.6]], 9),
    meche([[-26.4, -60], [-29.4, -50], [-28.6, -41], [-30, -33.6], [-32.4, -30]], 7),
    meche([[18, -52], [21.4, -41], [20.2, -32], [22, -25], [24.6, -21]], 8),
    meche([[-18, -50], [-20, -41], [-19.4, -33], [-20.8, -28]], 6),
  ];
  return [
    {os: 'tete', z: Z.cheveuxArr, dessin(p) {
      p.forme(masse, fd, {taille: 'g'});
      for (const m of mechesDerriere) p.forme(m, fd, {taille: 'm', force: 1.2});
    }},
    {os: 'tete', z: Z.cheveux, dessin(p) {
      for (const m of [dessus, ...mechesCote, ...mechesDevant]) p.portee(m, P.TETE, peau, {dy: 1.3, flou: 2.4, force: .4});
      for (const m of [...mechesCote, ...mechesDevant]) p.forme(m, c, {taille: 'm', force: 1.2});   // elles sortent de sous le dessus
      p.forme(dessus, c, {taille: 'g', force: .8});
      p.portee(lobes, sousLobes, c, {dy: .8, flou: 3.4, force: .15});
    }},
  ];
};

// diadème : un bandeau doré qui passe sur le front et disparaît sous les cheveux de chaque côté,
// avec un bijou en goutte au milieu (au niveau de la raie)
coiffes.diademe = o => {
  const or = o.couleur || '#e8bc45';
  return [
    {os: 'tete', z: Z.oreille + 1, dessin(p) {        // sous les cheveux, sur le front
      p.dans(P.TETE, () => p.forme('M -27,-68 Q -5,-74.4 25,-68.2 L 25,-65.6 Q -5,-71.8 -27,-65.4 Z', or, {taille: 'p'}));
    }},
    {os: 'tete', z: Z.coiffe, dessin(p) {
      p.forme('M -4.6,-76.4 C -2.4,-75 -1.6,-72.6 -2,-70.8 C -2.5,-69 -3.6,-67.9 -4.6,-67.3 C -5.6,-67.9 -6.7,-69 -7.2,-70.8 C -7.6,-72.6 -6.8,-75 -4.6,-76.4 Z', or, {taille: 'p', force: 1.2});
      p.forme(P.ell(-4.6, -71.4, 1.35, 1.9), o.pierre || '#d8323f', {taille: 'p'});
    }},
  ];
};

// robe longue de princesse : corsage, jupe jusqu'au sol, ceinture dorée à médaillon rond, tablier pointu à bord doré
// qui pend devant la jupe, deux gouttes dorées de chaque côté, épaulières dorées.
// Comme la tunique : le col remonte autour du cou (on ne voit pas le cou) ; l'ouverture est décalée à gauche (trois quarts).
tenues.robe = o => {
  const haut = o.haut, jupe = o.jupe, or = o.or || '#e8bc45', dessous = o.dessous || jupe;
  const corsage = 'M -8.8,-43.6 C -8.6,-46.4 -8,-48.6 -6.6,-49.5 L 1.8,-50.2 C 4.2,-49.8 6,-48.8 7,-47.4 C 7.8,-46.2 8.4,-44.8 8.8,-43.4 C 10.6,-42 11.2,-40 11.3,-38.5 L 10.6,-27.5 Q 0,-25.5 -10.6,-27.5 L -11.3,-38.5 C -11.2,-40 -10.6,-42 -8.8,-43.6 Z';
  const robe = 'M -10.4,-29.5 Q 0,-28 10.4,-29.5 C 12.5,-21 16,-10 18.2,-2.2 Q 0,2 -18.2,-2.2 C -16,-10 -12.5,-21 -10.4,-29.5 Z';
  const col = 'M -6.6,-49.5 L 1.6,-50.1 C 1,-46.6 -1,-44.2 -3.4,-43.6 C -5.2,-44.6 -6.2,-46.8 -6.6,-49.5 Z';
  const xc = -2.6;                                    // milieu du corps, décalé à gauche (trois quarts)
  const couches = [{os: 'torse', z: Z.torse, dessin(p) {
    p.forme(robe, jupe, {taille: 'g', force: .55});
    p.forme(corsage, haut, {taille: 'g', force: .9});
    p.portee(P.ell(-1, -53, 14, 9.5), corsage, haut, {dy: 1.2, flou: 3, force: .55});   // l'ombre de la tête
    p.forme(col, dessous, {taille: 0});
    p.portee(P.ell(-1, -53, 13, 7.6), col, dessous, {dy: 1, flou: 1.4, force: .4});
    // la ceinture va pile jusqu'au bord du vêtement
    const vetement = new Path2D(corsage); vetement.addPath(new Path2D(robe));
    p.dans(vetement, () => p.forme('M -13,-30.2 Q 0,-28 13,-30.2 L 13,-26.8 Q 0,-24.6 -13,-26.8 Z', or, {taille: 'p'}));
    // le tablier : un cadre doré (le bord) et le tissu dedans, terminé en pointe
    if (o.tablier) {
      p.forme(`M ${xc - 4.6},-27 L ${xc + 4.6},-27 L ${xc + 5.2},-8.6 L ${xc},-3.8 L ${xc - 5.2},-8.6 Z`, or, {taille: 'p'});
      p.forme(`M ${xc - 3.7},-26.2 L ${xc + 3.7},-26.2 L ${xc + 4.2},-9 L ${xc},-5.2 L ${xc - 4.2},-9 Z`, o.tablier, {taille: 'm'});
      // l'emblème : image fournie par Kiki (paquet chiffré) ; sans le mot de passe, un losange doré
      if (!(o.embleme && p.image(o.embleme, xc, -20.4, 5)))
        p.forme(`M ${xc},-22.6 L ${xc + 2},-19.6 L ${xc},-16.6 L ${xc - 2},-19.6 Z`, or, {taille: 'p'});
    }
    // deux gouttes dorées qui pendent de la ceinture, de chaque côté du tablier
    for (const x of [xc - 6.6, xc + 6.6])
      p.forme(`M ${x},-26.8 C ${x + 1.3},-25.2 ${x + 1.5},-23.2 ${x},-21.8 C ${x - 1.5},-23.2 ${x - 1.3},-25.2 ${x},-26.8 Z`, or, {taille: 'p'});
    // le médaillon rond de la ceinture (un simple cadre, comme les boucles)
    p.forme(P.ell(xc, -28.2, 3.1, 2.8), or, {taille: 'p', force: 1.2});
    p.forme(P.ell(xc, -28.2, 1.7, 1.5), P.fonce(or, .84), {taille: 0});
  }}];
  // épaulières dorées : une coque arrondie sur le haut de chaque bras, avec un second étage plus petit dessous
  if (o.epaulieres) for (const [os1, os2, z] of [['brasG1', 'brasG2', Z.brasG + .6], ['brasD1', 'brasD2', Z.brasD + .6]]) {
    const [ex, ey] = OS[os1].p, [cx, cy] = OS[os2].p, a = Math.atan2(cy - ey, cx - ex) * 180 / Math.PI - 90;
    couches.push({os: os1, z, dessin(p) {
      p.repere(ex, ey, a, () => {
        p.forme('M -4.9,2.6 Q 0,4.6 4.9,2.6 L 4.4,5.6 Q 0,7.4 -4.4,5.6 Z', P.fonce(o.epaulieres, .9), {taille: 'p'});
        p.forme('M -5.6,3.2 C -6.2,-1.6 -3.6,-4.8 0,-5 C 3.6,-4.8 6.2,-1.6 5.6,3.2 Q 0,5 -5.6,3.2 Z', o.epaulieres, {taille: 'm', force: 1.2});
      });
    }});
  }
  return couches;
};

// rapière : lame fine, garde dorée (quillons à boules et anneau de garde), pierre au centre ; la main tient le milieu du manche
armes.rapiere = o => {
  const [mx, my] = OS.arme.p, lame = o.lame || '#e4eaf1', garde = o.garde || '#e8bc45', L = o.longueur || 46;
  return [{os: 'arme', z: Z.arme, dessin(p) {
    p.repere(mx, my, o.angle === undefined ? -24 : o.angle, () => {
      p.forme(`M -.8,-5 L -.8,${-L + 3} L 0,${-L} L .8,${-L + 3} L .8,-5 Z`, lame, {taille: 'p', force: .7});
      p.forme(`M 0,-5 L 0,${-L} L .8,${-L + 3} L .8,-5 Z`, P.fonce(lame, .86), {taille: 0});
      p.forme('M -1.1,-3.8 L 1.1,-3.8 L 1,5.2 L -1,5.2 Z', o.poignee || '#8a3b5c', {taille: 'p'});
      p.forme('M 1.4,-4.4 C 4.8,-3.2 5.2,3 2,6.4 L 1.2,5.6 C 3.8,2.6 3.6,-2.4 1,-3.4 Z', garde, {taille: 'p'});   // anneau de garde
      p.forme('M -5.8,-5.7 Q 0,-4.5 5.8,-5.7 Q 6.5,-4.8 5.8,-3.9 Q 0,-2.9 -5.8,-3.9 Q -6.5,-4.8 -5.8,-5.7 Z', garde, {taille: 'p'});
      p.forme(P.ell(-6.2, -4.8, 1.1, 1.1), garde, {taille: 'p'}); p.forme(P.ell(6.2, -4.8, 1.1, 1.1), garde, {taille: 'p'});
      p.forme(P.ell(0, -4.8, 1.05, 1.05), o.pierre || '#4f8fe0', {taille: 'p'});
      p.forme(P.ell(0, 6.3, 1.6, 1.7), garde, {taille: 'p'});
    });
  }}];
};
/* ============================================================
   Pièces du colosse de roc (refaites le 14/11 d'après l'image de Kiki, détail par détail)
   Les « cheveux » et ce qui couvre les épaules et les avant-bras ne sont pas des poils mais une ÉPAISSEUR DE CAILLOUX
   gris clair : une base sombre (les creux) et des éclats clairs posés dessus.
   Tatouages clairs (dessins plats) : T sur le front, motif des pectoraux autour des tétons (étoiles de pierre), grand arc et deux spirales
   sur le ventre, motif sur le haut des bras, rond sur les genoux. Slip blanc, bandages blancs aux chevilles.
   ============================================================ */
// Un trait de tatouage : un ruban de largeur constante, aux bouts arrondis, qui passe par des points (courbe douce).
function ruban(pts, w) {
  const N = Math.max(24, pts.length * 10), P2 = [], cr = (a, b, c, d, t) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let k = 0; k <= N; k++) {
    const u = k / N * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), t = u - i;
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    P2.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
  }
  let long = 0; const cum = [0];
  for (let k = 1; k <= N; k++) cum.push(long += Math.hypot(P2[k][0] - P2[k - 1][0], P2[k][1] - P2[k - 1][1]));
  const g = [], d = [], r0 = w / 2;
  for (let k = 0; k <= N; k++) {
    const a = P2[Math.max(0, k - 1)], b = P2[Math.min(N, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, e = Math.min(cum[k], long - cum[k]);
    const r = e < r0 ? r0 * Math.sqrt(Math.max(.02, 1 - Math.pow(1 - e / r0, 2))) : r0;     // bouts arrondis
    g.push((P2[k][0] + nx * r).toFixed(2) + ',' + (P2[k][1] + ny * r).toFixed(2));
    d.unshift((P2[k][0] - nx * r).toFixed(2) + ',' + (P2[k][1] - ny * r).toFixed(2));
  }
  return 'M ' + g.join(' L ') + ' L ' + d.join(' L ') + ' Z';
}
const miroir = (pts, axe, k = 1) => pts.map(([x, y]) => [axe + (axe - x) * k, y]);
// un anneau (rond de tatouage)
function anneau(cx, cy, r, w, ry = 1) {
  const p = new Path2D(); p.ellipse(cx, cy, r + w / 2, (r + w / 2) * ry, 0, 0, 2 * Math.PI); p.ellipse(cx, cy, r - w / 2, (r - w / 2) * ry, 0, 2 * Math.PI, 0, true); return p;
}
// Un éclat de caillou : une forme anguleuse allongée (coins à peine adoucis) qui pointe dans la direction `angle` (degrés).
function eclat(x, y, l, w, angle, graine = 1) {
  let s = graine * 7919 + 104729;
  const h = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const a = angle * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const loc = [[-.15, -.5 - h() * .15], [.45 + h() * .15, -.42], [1, (h() - .5) * .3], [.5 + h() * .1, .45], [-.1, .5 + h() * .1]];
  const pts = loc.map(([t, n]) => [x + ux * t * l + vx * n * w, y + uy * t * l + vy * n * w]);
  const k = .22, lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], f2 = q => q[0].toFixed(2) + ',' + q[1].toFixed(2);
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const z = pts[(i + pts.length - 1) % pts.length], p = pts[i], q = pts[(i + 1) % pts.length];
    d += (i ? 'L ' : 'M ') + f2(lerp(p, z, k)) + ' Q ' + f2(p) + ' ' + f2(lerp(p, q, k)) + ' ';
  }
  return d + 'Z';
}
// Une épaisseur de cailloux le long d'une ligne : base sombre (les creux), puis des éclats clairs qui la recouvrent et
// dépassent vers l'extérieur (du côté `cote` = 1 ou -1 de la ligne). Rend la liste des formes à peindre.
// Une croûte de cailloux posée le long d'une ligne (côté `cote` = 1 ou -1 = l'extérieur) : une masse de pierre claire dont le
// bord extérieur est cassé (angles irréguliers), avec quelques facettes plus claires et quelques creux plus sombres dedans.
function cailloux(pts, epaisseur, cote, graine, o = {}) {
  let s = graine * 31 + 7;
  const h = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  // la ligne, lissée
  const N = Math.max(16, (o.nombre || pts.length * 3) * 2), L = [], cr = (a, b, c, d, t) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let k = 0; k <= N; k++) {
    const u = k / N * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), t = u - i;
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    L.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
  }
  const nor = k => { const a = L[Math.max(0, k - 1)], b = L[Math.min(N, k + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l * cote, -(b[0] - a[0]) / l * cote]; };
  const fin = k => Math.sin(Math.PI * Math.min(1, Math.max(0, k / N)) ) ** .5;          // plus mince aux deux bouts
  const dedans = [], dehors = [];
  for (let k = 0; k <= N; k++) {
    const [nx, ny] = nor(k), e = epaisseur * (.25 + .75 * fin(k));
    dedans.unshift([L[k][0] - nx * e * .45, L[k][1] - ny * e * .45]);
    dehors.push([L[k][0], L[k][1], nx, ny, e]);
  }
  // bord cassé : des blocs de largeurs inégales (2 à 4 pas), chacun avec un angle qui ressort plus ou moins
  for (let k = 0, bloc = 0; k <= N; bloc++) {
    const ca = o.casse === undefined ? 1 : o.casse, lg = 2 + Math.floor(h() * 3), haut = .75 - .2 * ca + h() * .45 * ca, pic = Math.floor(h() * lg);
    for (let j = 0; j < lg && k <= N; j++, k++) {
      const [x, y, nx, ny, e] = dehors[k], r = e * (j === pic ? haut + .15 * ca : haut - (.12 + h() * .12) * ca);
      dehors[k] = [x + nx * r, y + ny * r];
    }
  }
  const f2 = q => q[0].toFixed(2) + ',' + q[1].toFixed(2);
  const base = 'M ' + dehors.map(f2).join(' L ') + ' L ' + dedans.map(f2).join(' L ') + ' Z';
  // facettes : de petits polygones dans la masse (clairs = faces qui prennent la lumière, sombres = creux)
  const formes = [];
  const nf = o.facettes || Math.round(N * .3);
  for (let i = 0; i < nf; i++) {
    const k = Math.min(N, Math.floor((i + h()) / nf * N)), [nx, ny] = nor(k), e = epaisseur * (.25 + .75 * fin(k));
    const c = [L[k][0] + nx * e * (h() * .45 + .05), L[k][1] + ny * e * (h() * .45 + .05)], r = e * (.3 + h() * .22), a0 = h() * 6.3, n = 3 + Math.floor(h() * 2);
    let d = '';
    for (let j = 0; j < n; j++) { const a = a0 + j / n * 6.283 + (h() - .5) * .6; d += (j ? 'L ' : 'M ') + f2([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * .8]) + ' '; }
    formes.push({d: d + 'Z', clair: i % 3 !== 1});
  }
  return {base, formes};
}
const GRIS = ['#d3cbba', '#ece6da', '#8f877a'];
function peindreCailloux(p, c, clair, sombre) {
  p.forme(c.base, clair, {taille: 'p', force: 1.8});
  p.dans(c.base, () => c.formes.forEach(f => p.forme(f.d, f.clair ? GRIS[1] : sombre, {taille: 'p', force: .6})));
}
// petite étoile de cristal (tétons)
function cristal(cx, cy, r, n = 6, graine = 1) {          // étoile de pierre : branches inégales, un peu de travers
  let s = graine * 97 + 13, d = '';
  const h = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n + (h() - .5) * .35, rr = i % 2 ? r * (.38 + h() * .14) : r * (.72 + h() * .35); d += (i ? 'L ' : 'M ') + (cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr * .9).toFixed(2) + ' '; }
  return d + 'Z';
}
// Un tatouage est INCRUSTÉ dans la peau (Kiki, 14/11) : peint en transparence, il garde les ombres et le volume de la peau dessous.
// Tous les traits d'un même tatouage sont d'abord peints ensemble, pleins, sur une feuille à part (un seul dessin, aucun
// croisement visible), puis la feuille est fondue dans la peau d'un coup (Kiki, 14/11 : « un seul trait », « intégrés à la peau »).
P.ENCRE_VISAGE = .6;   // mesuré le 14/11 : à 1, le T éclaircissait la peau de 57 points contre 36 pour ceux du corps
P.ENCRE = {passes: [['source-over', .3], ['soft-light', 1]], flou: .12};   // un voile léger + « lumière douce » : l'encre suit les ombres et les reflets de la peau
function encre(p, couleur, formes, force = 1) {   // force < 1 : encre plus discrète (le T, sur la peau plus claire du visage)
  const c = p.ctx, cv = c.canvas, f = document.createElement('canvas'); f.width = cv.width; f.height = cv.height;
  const o = f.getContext('2d'); o.setTransform(c.getTransform()); o.fillStyle = couleur;
  for (const d of formes) o.fill(typeof d === 'string' ? new Path2D(d) : d);
  const E = P.ENCRE;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (E.flou) c.filter = `blur(${(E.flou * p.S).toFixed(2)}px)`;
  for (const [mode, a] of E.passes || [[E.mode, E.a]]) { c.globalCompositeOperation = mode; c.globalAlpha = Math.min(1, a * force); c.drawImage(f, 0, 0); }
  c.restore();
}
function etoileDePierre(p, cx, cy, r, graine) {
  p.portee(cristal(cx, cy, r, 7, graine), P.ell(cx, cy, r * 2, r * 2), '#c08a3a', {dy: .6, flou: .9, force: .6});
  p.forme(cristal(cx, cy, r, 7, graine), '#cfc6b4', {taille: 'p', force: 1.4});
  p.forme(cristal(cx + r * .1, cy + r * .12, r * .5, 5, graine + 3), '#8f877a', {taille: 0});
  p.forme(cristal(cx - r * .25, cy - r * .28, r * .32, 4, graine + 5), '#efeadf', {taille: 0});
}
// Croûte de pierre FINE, qui épouse la peau (bras, épaules, dos) : rien ne dépasse, elle est peinte dans la forme `zone` ;
// `bord` = points le long du bord extérieur du membre ; `cote` = le côté vers l'intérieur du membre ; `p2` = profondeur.
function croute(p, zone, bord, p2, cote, graine) {
  const c = cailloux(bord, p2 * 2, cote, graine, {nombre: Math.max(3, bord.length), casse: .45, facettes: Math.max(2, bord.length - 2)});
  p.dans(zone, () => {
    p.portee(c.base, zone, '#c08a3a', {dy: .5, flou: 1, force: .35});
    p.forme(c.base, '#cdc4b2', {taille: 'p', force: .7});
    c.formes.forEach(f => p.forme(f.d, f.clair ? '#e4ddd0' : '#a1988a', {taille: 0}));
  });
}

// La tête du colosse : en cloche, plus étroite en haut, large à la mâchoire (pas une tête ronde : ce n'est pas un humain).
P.TETE_COLOSSE = 'M -2,-84.4 C 8.8,-84.6 16.4,-80.2 19.8,-73.2 C 22.8,-67 25,-60 25.8,-54 C 26.6,-48 22.4,-43.4 13.8,-42.4 '
  + 'C 5.6,-41.4 -8.6,-41.4 -16.4,-42.4 C -25,-43.4 -29.2,-48 -28.4,-54 C -27.6,-60 -25.6,-67 -22.8,-73.2 C -19.6,-80.2 -12.8,-84.4 -2,-84.4 Z';

// Crête de cailloux sur le crâne (du front jusque derrière la tête, où elle rejoint les épaules), sourcils en cailloux froncés,
// barbichette en caillou pointu sous le menton, et le T tatoué sur le front.
coiffures.cailloux = (o, fiche) => {
  const clair = o.couleur || GRIS[0], sombre = o.creux || '#a39a8a', tat = o.tatouage || '#fbe197', peau = fiche.peau, tete = P.teteDe(fiche);
  // La coiffure : une coupe EN BROSSE de pierre (Kiki, 14/11) : courte, posée sur tout le dessus du crâne, de la tempe gauche
  // jusqu'à l'arrière de la tête, le dessus hérissé de petites pointes courtes. On suit le contour de la tête (mêmes courbes que TETE_COLOSSE).
  const bez = (a, b, c, d, t) => { const u = 1 - t; return [u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]; };
  const SEG = [[[-28.4, -54], [-27.6, -60], [-25.6, -67], [-22.8, -73.2]], [[-22.8, -73.2], [-19.6, -80.2], [-12.8, -84.4], [-2, -84.4]],
               [[-2, -84.4], [8.8, -84.6], [16.4, -80.2], [19.8, -73.2]], [[19.8, -73.2], [22.8, -67], [25, -60], [25.8, -54]]];
  const contour = [];
  for (let k = 0; k < SEG.length; k++) for (let i = 0; i < 22; i++) { const t = i / 22; if (k === 0) continue; if (k === 1 && t < .06) continue; if (k === 3 && t > .78) continue; contour.push(bez(...SEG[k], t)); }
  let gr = 7; const hz = () => (gr = (gr * 9301 + 49297) % 233280) / 233280;
  const dehors = contour.map((q, i) => {
    const a = contour[Math.max(0, i - 1)], b = contour[Math.min(contour.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l, u = i / (contour.length - 1), bout = Math.min(1, u / .1, (1 - u) / .14);
    const r = (1.9 + (i % 2 ? hz() * .35 : .45 + hz() * .9)) * Math.max(.15, bout);
    return [q[0] + nx * r, q[1] + ny * r];
  });
  const lisiere = [[24, -59], [22.2, -64.4], [19.6, -69.2], [15.4, -73.6], [9.6, -76.8], [3, -78.4], [-5, -78.8], [-12.4, -77.8], [-18.4, -75.6], [-21.8, -73]];
  const f2 = q => q[0].toFixed(2) + ',' + q[1].toFixed(2);
  const brosse = 'M ' + dehors.map(f2).join(' L ') + ' L ' + lisiere.map(f2).join(' L ') + ' Z';
  // texture de pierre : de petites facettes claires et de fines fentes sombres, dressées comme les poils d'une brosse
  const grain = [];
  for (let i = 0; i < 34; i++) {
    const k = 2 + Math.floor(hz() * (contour.length - 4)), q = contour[k], a = contour[k - 1], b = contour[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l, prof = hz() * 3.4 - .6, lg = 1.6 + hz() * 1.8, w = .22 + hz() * .22;   // un poil, dressé vers l'extérieur
    const x0 = q[0] - nx * prof + (hz() - .5) * 1.4, y0 = q[1] - ny * prof;
    grain.push({d: `M ${x0 - ny * w},${y0 + nx * w} L ${x0 + nx * lg},${y0 + ny * lg} L ${x0 + ny * w},${y0 - nx * w} Z`, clair: i % 2 === 0});
  }
  const sourcils = [
    cailloux([[-11, -64.6], [-16.6, -66.8], [-22.8, -67.4]], 3.6, -1, 11, {nombre: 4, facettes: 3}),
    cailloux([[-.6, -64.6], [5, -67], [11.8, -67.6]], 3.6, 1, 17, {nombre: 4, facettes: 3}),
  ];
  const barbe = 'M -7.2,-44.6 L -1.4,-44.8 L -3.6,-38.4 Q -4.2,-37.6 -4.8,-38.4 Z';
  const T = [ruban([[-14.4, -73.4], [-5, -74.4], [4.4, -74]], 2.8), ruban([[-4.9, -73.6], [-5.2, -66], [-5.8, -59.4]], 2.6)];
  return [
    {os: 'tete', z: Z.visage - .5, dessin(p) {          // le T tatoué (sous les yeux et les sourcils)
      p.dans(tete, () => encre(p, tat, T, P.ENCRE_VISAGE));
    }},
    {os: 'tete', z: Z.cheveux, dessin(p) {
      p.portee(brosse, tete, peau, {dy: 1.4, flou: 2.2, force: .55});
      for (const s of sourcils) p.portee(s.base, tete, peau, {dy: 1.4, flou: 1.8, force: .6});
      p.forme(brosse, '#c9c0ad', {taille: 'g', force: .9});
      p.dans(brosse, () => grain.forEach(g => p.forme(g.d, g.clair ? '#e2dccf' : '#ada494', {taille: 0})));
      for (const s of sourcils) peindreCailloux(p, s, clair, sombre);
      p.forme(barbe, clair, {taille: 'p', force: 1.4});
      p.forme('M -4.3,-44.7 L -1.4,-44.8 L -3.6,-38.4 Z', P.fonce(clair, .78), {taille: 0});          // une facette dans l'ombre
    }},
  ];
};

// Le corps du colosse : épaules hautes (la tête s'enfonce entre elles), gros pectoraux, gros ventre rond, slip blanc ;
// cailloux sur le haut des épaules et du dos, sur le dessus des épaules et sur le dehors des avant-bras ;
// biceps et épaules bien ronds ; tatouages ; bandages aux chevilles, rond tatoué sur chaque genou.
tenues.colosse = (o, fiche) => {
  const peau = fiche.peau, OS = P.osDe(fiche), tat = o.tatouage || '#fbe197';
  const clair = o.cailloux || GRIS[0], sombre = o.creux || '#a39a8a', blanc = o.slip || '#ece8df';
  const corps = 'M -11,-49.6 C -16.6,-49.2 -21.4,-47 -23,-43 C -24,-39.8 -23.4,-36.6 -21.8,-34.4 C -23.8,-30.8 -24,-25.6 -21.2,-22 '
    + 'C -17,-18 -8.4,-17 .4,-17 C 9.2,-17 17.6,-18.2 21.6,-22 C 24.6,-25.6 24.6,-30.8 22.2,-34.4 C 24,-36.8 24.8,-40 23.6,-43 '
    + 'C 22,-47.2 16.8,-49.4 11,-49.8 C 4,-50.4 -4,-50.2 -11,-49.6 Z';
  const ventre = P.ell(-.6, -28.2, 20.8, 11.6);
  // pectoraux (vue de trois quarts : celui de gauche, côté éloigné, est plus étroit)
  const pecG = 'M -23.2,-46 C -17.6,-48.4 -9.8,-48.4 -4.6,-46.6 C -3,-43 -3.4,-38 -5.6,-35.6 C -9.8,-33.2 -16.6,-33.2 -21,-35.2 C -25,-37.4 -26,-42.8 -23.2,-46 Z';   // jusqu'au bras (coupé au bord du corps)
  const pecD = 'M -3,-46.6 C 3,-48.4 12,-48.2 18.4,-45.6 C 21,-42.4 21,-38 18.6,-35.4 C 14,-33 5.6,-33.2 -.8,-35.4 C -3.6,-38 -4.2,-42.8 -3,-46.6 Z';
  // tatouages
  // motif de chaque pectoral (variante de l'image de Kiki) : un grand arc et un petit arc par-dessus l'étoile du téton, reliés par une
  // petite barre en haut ; il entoure l'étoile sans jamais la toucher. kx < 1 : le pec du côté éloigné est plus étroit (trois quarts)
  const arcAutour = (cx, cy, r, kx, a0, a1, w) => { const pts = []; for (let k = 0; k <= 10; k++) { const a = (a0 + (a1 - a0) * k / 10) * Math.PI / 180; pts.push([cx + Math.cos(a) * r * kx, cy + Math.sin(a) * r]); } return ruban(pts, w); };
  const motifPec = (cx, cy, kx) => [arcAutour(cx, cy, 5.8, kx, 160, 380, 1.25), arcAutour(cx, cy, 3.7, kx, 185, 355, 1.05), ruban([[cx, cy - 3.9], [cx, cy - 5.6]], 1.05)];
  const TETONS = [[-13.7, -39.5], [6.7, -39.5]];            // au milieu de chaque pectoral (ronds verts de Kiki, 14/11)
  const arc = ruban([[-10.4, -19.6], [-15.6, -22], [-17.8, -26.8], [-15.8, -31.2], [-9, -33.6], [-.6, -34.2], [8, -33.6], [14.6, -31.2], [16.8, -26.8], [14.6, -22], [9.6, -19.6]], 1.6);
  // les deux spirales face à face : leur queue descend par l'extérieur et revient vers le nombril
  const spG = [[-6.6, -28.4], [-5.6, -29.2], [-6.6, -30.4], [-8.4, -29.8], [-8.9, -27.8], [-7.6, -26.2], [-5.1, -26.3], [-3.9, -28.4], [-4.6, -31], [-7, -32.2], [-9.8, -31.4], [-11.4, -28.6], [-10.9, -24.8], [-8.4, -22], [-5, -21]];
  const spirales = [ruban(spG, 1.4), ruban(miroir(spG, -.6, 1.06), 1.4)];
  const couches = [];
  // le slip : sous le ventre (le ventre retombe dessus)
  couches.push({os: 'torse', z: Z.torse - .5, dessin(p) {
    const slip = 'M -16.4,-21.4 Q -.6,-16.6 16.6,-21.6 L 13.4,-16.4 Q 5.2,-10.6 -.6,-10.6 Q -6.4,-10.6 -13.4,-16.4 Z';
    p.forme(slip, blanc, {taille: 'm', force: 1.1});
    p.dans(slip, () => { p.forme('M -3,-17 Q -1,-14 -.4,-10.6 L -1.6,-10.6 Q -2.4,-14 -4.4,-17 Z', P.fonce(blanc, .9), {taille: 0}); });   // un pli
  }});
  couches.push({os: 'torse', z: Z.torse, dessin(p) {
    p.forme(corps, peau, {taille: 'g', force: .9});
    p.dans(corps, () => {
      p.forme(ventre, peau, {taille: 'g', force: .8});
      p.portee(P.ell(-.6, -37, 21, 5.4), ventre, peau, {dy: 1.4, flou: 2, force: .45});              // l'ombre des pectoraux sur le ventre
      encre(p, tat, [arc, ...spirales]);
      p.forme(P.ell(-.6, -21.6, 1.15, .62), P.fonce(peau, .55), {taille: 0});                          // nombril
      // les pectoraux : bien bombés, avec leur ombre sur le ventre et un creux entre les deux
      const pecs = new Path2D(pecG); pecs.addPath(new Path2D(pecD));
      p.portee(pecs, corps, peau, {dy: 1.9, flou: 2, force: .8});
      p.forme(pecG, peau, {taille: 'g', force: 1.25}); p.forme(pecD, peau, {taille: 'g', force: 1.25});
      p.portee(pecD, pecG, peau, {dx: -1.2, dy: .4, flou: 1.4, force: .55});
      p.portee(P.ell(-1, -53, 15, 9.5), corps, peau, {dy: 1.6, flou: 3, force: .6});                    // l'ombre de la tête
      encre(p, tat, motifPec(...TETONS[0], .82)); encre(p, tat, motifPec(...TETONS[1], 1));
      // les tétons : de petites étoiles de pierre (argentées), au milieu de chaque pectoral, à l'écart des traits
      etoileDePierre(p, ...TETONS[0], 1.8, 2); etoileDePierre(p, ...TETONS[1], 2, 4);
    });
  }});
  // les cailloux du haut du dos (derrière la tête, jusqu'à l'épaule du côté proche)
  couches.push({os: 'torse', z: Z.torse + .5, dessin(p) {
    croute(p, corps, [[8.6, -50.4], [15, -50], [20.6, -48], [23.6, -44.4], [24.4, -40]], 1.8, -1, 29);
  }});
  // les bras : épaule ronde, biceps, motif tatoué, cailloux sur l'épaule et sur le dehors de l'avant-bras
  for (const [os1, os2, z, cote] of [['brasD1', 'brasD2', Z.brasD, -1], ['brasG1', 'brasG2', Z.brasG, 1]]) {
    const [ex, ey] = OS[os1].p, [cx, cy] = OS[os2].p, [mx, my] = OS[os1 === 'brasD1' ? 'arme' : 'bouclier'].p;
    const a = Math.atan2(cy - ey, cx - ex) * 180 / Math.PI;
    const epaule = P.ell(ex + cote * .6, ey + 1.6, 6.8, 6.4);
    const biceps = P.ell(ex + (cx - ex) * .6 + cote * .6, ey + (cy - ey) * .6, 5.4, 4.4, a);
    couches.push({os: os1, z: z + .3, dessin(p) {
      p.forme(epaule, peau, {taille: 'g', force: .9});
      p.forme(biceps, peau, {taille: 'm', force: 1.1});
      const q = (x, y) => [ex + .6 * cote + x * cote, ey + 1.6 + y];
      // bras proche (à droite de l'écran) : une patte à trois griffes sur le biceps, là où Kiki l'a dessinée (14/11) :
      // un coussinet arrondi et trois griffes fines en triangle, penchées vers l'avant
      if (cote > 0) {
        // Plus grosse (Kiki, 14/11) : à cheval sur l'épaule et le biceps, dans l'axe du bras (griffes vers l'épaule).
        // L'astuce pour la cassure de l'articulation : la patte est coupée au bord du biceps, et la partie posée sur le biceps est
        // légèrement décalée et agrandie, comme si l'encre suivait le muscle qui avance.
        const PATTE = ['M -2.7,1 C -2.9,3.4 -1.4,5 0,5.4 C 1.4,5 2.9,3.4 2.7,1 Q 0,-.3 -2.7,1 Z',
          'M -.7,-.6 L .7,-.6 L 0,-5.6 Z', 'M -2.9,.1 L -1.6,-.7 L -4.2,-4.4 Z', 'M 2.9,.1 L 1.6,-.7 L 4.2,-4.4 Z'];
        const axe = Math.atan2(ey - cy, ex - cx) * 180 / Math.PI + 90;            // les griffes pointent vers l'épaule
        const [bx, by] = [ex + (cx - ex) * .6 + .6, ey + (cy - ey) * .6], [px, py] = [25.4, -38.9], K = .7;
        const horsBiceps = new Path2D(); horsBiceps.rect(-400, -400, 800, 800); horsBiceps.ellipse(bx, by, 5.4, 4.4, a * Math.PI / 180, 2 * Math.PI, 0, true);
        p.dans(epaule, () => p.dans(horsBiceps, () => p.repere(px, py, axe, () => encre(p, tat, PATTE, 1.9), K)));   // l'épaule est dans l'ombre : encre un peu plus forte
        p.dans(biceps, () => p.repere(px + .35, py + .3, axe - 3, () => encre(p, tat, PATTE), K * 1.04));
      }
      // bras éloigné : une large bande qui monte en travers de l'épaule, une barre qui la croise, un crochet autour de deux points
      else p.dans(epaule, () => encre(p, tat, [
        ruban([q(-4.6, 4.4), q(-1, 3.2), q(2.4, .6), q(4.4, -2.6)], 1.7), ruban([q(.2, -1.6), q(2.2, .6), q(4.6, 2.4)], 1.3),
        ruban([q(-3.4, 6.8), q(-.4, 7.4), q(2.6, 6.2), q(3.8, 3.6)], 1.2), P.ell(...q(-1.4, 5.4), .85, .85), P.ell(...q(1, 5), .85, .85)]));
      // la croûte de pierre sur le dessus de l'épaule, dans le prolongement de la peau
      const [ox, oy] = [ex + cote * .6, ey + 1.6], arcs = [];
      for (let k = 0; k <= 6; k++) { const a = (cote > 0 ? -128 + k * 22 : -52 - k * 22) * Math.PI / 180; arcs.push([ox + Math.cos(a) * 6.5, oy + Math.sin(a) * 6.1]); }
      croute(p, epaule, arcs, cote > 0 ? 1.4 : 1.7, -cote, 41 + z);
    }});
    // avant-bras : la croûte fine sur le dehors, du coude jusque sur le dos du poing (elle ne dépasse jamais du bras)
    const kb = (fiche.corps && fiche.corps.bras) || 1, poing = 3.1 * ((fiche.corps && fiche.corps.main) || 1);
    const n = Math.hypot(mx - cx, my - cy), ux = (mx - cx) / n, uy = (my - cy) / n;
    let vx = -uy, vy = ux; if (vx * cote < 0) { vx = -vx; vy = -vy; }                 // vers le dehors (loin du corps)
    const R = t => t < 1 ? 2.7 * kb + (2.5 * kb - 2.7 * kb) * t : poing;
    const bord = [0, .25, .5, .75, 1, 1.18].map(t => [cx + ux * n * t + vx * (R(Math.min(t, 1)) - .25), cy + uy * n * t + vy * (R(Math.min(t, 1)) - .25)]);
    couches.push({os: os2, z: z + 1.05, dessin(p) {
      const bras = new Path2D(P.capsule(cx, cy, mx, my, 2.7 * kb, 2.5 * kb)); bras.addPath(P.ell(mx, my, poing, poing * .97));
      croute(p, bras, bord, 1.6, -cote, 53 + z);
    }});
  }
  // les jambes : rond tatoué sur le genou, bandage blanc à la cheville
  for (const [os2, z] of [['jambeD2', Z.jambeD], ['jambeG2', Z.jambeG]]) {
    const [gx, gy] = OS[os2].p, kj = (fiche.corps && fiche.corps.jambes) || 1;
    couches.push({os: os2, z: z + 1.5, dessin(p) {
      encre(p, tat, [anneau(gx - 1.6, gy + .4, 1.9, 1.1, 1.1)]);
      const w = 2.9 * kj + .25, tour = (y0, y1) => `M ${gx - w},${y0} Q ${gx},${y0 + 1} ${gx + w},${y0 - .4} L ${gx + w},${y1 - .4} Q ${gx},${y1 + 1} ${gx - w},${y1} Z`;
      p.forme(tour(-9, -6.6), blanc, {taille: 'p', force: 1.3});
      p.forme(tour(-6.9, -4.6), P.fonce(blanc, .94), {taille: 'p', force: 1.3});
    }});
  }
  return couches;
};
/* ============================================================
   Pièces de la princesse des eaux (14/11, d'après 3 images de Kiki)
   Pas de cheveux : une capuche de peau rouge framboise (crâne, pointe entre les yeux), deux longs pans de chaque côté du
   visage et une grande queue de poisson dans le dos. Visage vert pâle, yeux dorés, lèvres rouges. Bijoux d'argent et
   pierres turquoise. Corps : devant crème, côtés et membres rouges. Écharpe bleue sur l'épaule proche, nageoires aux
   épaules et aux avant-bras (rayures jaunes et turquoise). Arme : un trident.
   ============================================================ */
const ARGENT = '#c3bdb5', TURQUOISE = '#2ccdd6', ROUGE_VIF = '#e8162a';
function joyau(p, x, y, r, c = TURQUOISE) {             // une petite pierre taillée (losange) avec un reflet
  p.forme(`M ${x},${y - r * 1.3} L ${x + r},${y} L ${x},${y + r * 1.3} L ${x - r},${y} Z`, c, {taille: 'p', force: 1.2});
  p.forme(`M ${x},${y - r * 1.3} L ${x + r * .45},${y - r * .3} L ${x},${y} Z`, P.clair(c, .55), {taille: 0});
}
function goutte(p, x, y, r, c = TURQUOISE) {            // une pierre en goutte, pointe en haut
  p.forme(`M ${x},${y - r * 1.6} C ${x + r * .9},${y - r * .4} ${x + r},${y + r * .4} ${x},${y + r} C ${x - r},${y + r * .4} ${x - r * .9},${y - r * .4} ${x},${y - r * 1.6} Z`, c, {taille: 'p', force: 1.2});
}
// rayures de nageoire (jaune et turquoise) peintes dans une forme
function rayures(p, zone, x0, y0, x1, y1, n, couleurs = ['#f3d92a', '#16c4c9']) {
  p.dans(zone, () => {
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + .55) / n, ax = x0 + (x1 - x0) * t0, ay = y0 + (y1 - y0) * t0, bx = x0 + (x1 - x0) * t1, by = y0 + (y1 - y0) * t1;
      p.forme(`M ${ax - 6},${ay - 6} L ${bx - 6},${by - 6} L ${bx + 6},${by + 6} L ${ax + 6},${ay + 6} Z`, couleurs[i % 2], {taille: 0});
    }
  });
}

// Une feuille (lobe de nageoire) : forme pointue aux deux bouts, la plus large vers 40 % de sa longueur.
function feuille(x0, y0, x1, y1, w, courbe = 0) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
  const P1 = t => [x0 + dx * t + nx * courbe * Math.sin(Math.PI * t), y0 + dy * t + ny * courbe * Math.sin(Math.PI * t)];
  const g = [], d = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24, r = w / 2 * Math.pow(Math.sin(Math.PI * Math.min(1, t / .8 * .5 + (t > .4 ? (t - .4) / .6 * .5 : 0))), .8) * (t < .4 ? Math.sqrt(t / .4) : 1), [x, y] = P1(t);
    g.push((x + nx * r).toFixed(2) + ',' + (y + ny * r).toFixed(2)); d.unshift((x - nx * r).toFixed(2) + ',' + (y - ny * r).toFixed(2));
  }
  return 'M ' + g.join(' L ') + ' L ' + d.join(' L ') + ' Z';
}
// Le visage de la princesse des eaux : plus fin et plus féminin, en V, menton fin (option `tete`).
P.TETE_EAUX = 'M -1,-87 C 12.5,-87 22.6,-77.5 22.6,-64.5 C 22.4,-56.6 17.8,-50.4 11.4,-46.4 C 6.4,-43.4 1,-41.6 -2.8,-41.4 '
  + 'C -6.6,-41.6 -12,-43.4 -16.8,-46.6 C -22.2,-50.4 -24.6,-56.6 -24.6,-64.5 C -24.6,-77.5 -14.5,-87 -1,-87 Z';

// La capuche (refaite le 14/11 d'après les gros plans de Kiki) :
//  - le crâne rouge framboise ; juste au-dessus des yeux une bande plus sombre (le masque) qui descend en pointe entre les yeux ;
//  - sur cette bande, trois petits points rouge vif en arc au-dessus de chaque œil ; une goutte rouge vif au milieu du front (large en haut, pointue en bas) ;
//  - du coin intérieur des yeux, un V rouge vif qui descend jusqu'au nez ;
//  - deux pans fins qui tombent des tempes, le long du visage, jusqu'à la poitrine ;
//  - derrière, la queue : elle descend dans le dos, remonte vers l'arrière au bout et finit en nageoire fourchue ; tout son dessous est blanc.
coiffures.capuche = (o, fiche) => {
  const c = o.couleur, blanc = o.dessous || '#eeeadb', peau = fiche.peau, vif = o.marques || ROUGE_VIF, masque = o.masque || P.fonce(o.couleur, .74);
  const tete = P.teteDe(fiche);
  // bord bas de la capuche, de la gauche vers la droite (au-dessus des yeux, pointe entre les deux)
  const BORD = [[-27, -50], [-25.4, -58], [-23, -62.8], [-19.4, -64.7], [-14.6, -64.9], [-10.8, -63.6], [-7.8, -61.4], [-5.6, -59.6],
                [-3.4, -61.4], [-.4, -63.6], [3, -64.9], [7.6, -64.9], [11.2, -63.6], [14.6, -60.4], [18.6, -55.4], [23.2, -50]];   // il touche juste le haut des yeux
  const HAUT = [[-25.2, -61.6], [-22.2, -67.6], [-18.4, -70.2], [-13.6, -70], [-9.8, -68.4], [-5.6, -64.8], [-1.6, -68.4], [2.6, -70.2], [7.8, -70.4], [12, -68.4], [15.8, -64]];
  const f2 = q => q[0].toFixed(2) + ',' + q[1].toFixed(2);
  const capuche = 'M ' + f2(BORD[0]) + ' C -28.6,-60 -27.6,-68 -24.6,-75 C -20.6,-84.6 -11.4,-90 -1,-90 C 10,-90 19.4,-84.6 23.4,-75.4 C 26,-68.4 25.8,-58 23.2,-50 L '
    + BORD.slice().reverse().slice(1).map(f2).join(' L ') + ' Z';
  const bande = 'M ' + BORD.slice(1, 14).map(f2).join(' L ') + ' L ' + HAUT.slice().reverse().map(f2).join(' L ') + ' Z';
  // le V rouge vif part du coin intérieur des yeux (sans mordre sur les yeux) et descend jusqu'au nez
  // le V rouge vif (d'après le coloriage de Kiki, 14/11) : ses deux bras continuent par-dessus le haut des yeux vers l'extérieur,
  // puis il descend en pointe jusqu'au nez ; les yeux sont peints PAR-DESSUS (ils sont redessinés dans cette couche)
  // (14/11, 2e retouche : les bras du V sont prolongés vers l'extérieur et vers le haut, et ils passent SOUS la bande violet foncé du masque)
  const bec = 'M -23.4,-68.4 C -17.4,-69.6 -11.4,-67.6 -7.8,-63.4 L -5.6,-61 L -3.4,-63.4 C .2,-67.6 6.2,-69.6 12.4,-68.4 L 12.6,-64.6 '
    + 'C 7.4,-64.4 2.4,-63.2 -.2,-60.6 Q -2.8,-58 -5.6,-54.2 Q -8.4,-58 -11,-60.6 C -13.8,-63.2 -18.6,-64.4 -23.6,-64.6 Z';
  const panG = 'M -26.8,-63 C -28,-56 -27.6,-49 -26.2,-44 C -25.4,-41 -24.2,-38.6 -22.8,-37 C -22.8,-40 -22.6,-43.6 -22.4,-47 C -22.2,-52 -22.6,-57.6 -23.2,-63 Z';
  const panD = 'M 24.6,-63 C 25.6,-56 25.4,-49 24.2,-44 C 23.6,-41 22.8,-38.6 21.8,-37 C 21.4,-40 21,-43.6 20.8,-47 C 20.6,-52 20.6,-57.6 20.8,-63 Z';
  // la queue (repère de la tête, avant la réduction de 0,9) : elle descend derrière la tête et s'arrête au niveau des épaules,
  // où elle finit par deux GRANDES nageoires qui tombent vers le bas et l'arrière (Kiki, 14/11) ; tout son dessous (côté corps) est blanc
  // elle passe derrière la tête puis s'écarte vers l'arrière : on la voit à droite du pan de la capuche, avec sa bande blanche
  // UNE seule forme : le bout de la queue s'élargit et se sépare en deux grandes nageoires tombantes (vers le bas et vers l'arrière),
  // avec une encoche entre les deux (Kiki, 14/11 : elles doivent être la continuité de la queue, pas accrochées à un point)
  const queue = 'M 4,-89.4 C 16,-89.4 26.4,-84 31.2,-74 C 33.8,-68 35,-61 35,-54.4 C 35,-51 35.6,-48.4 37,-46.4 '
    + 'C 40.6,-46 45,-42.4 47.8,-35.8 C 48.4,-34.4 48.6,-33.2 48.2,-32.2 C 45.6,-32.6 42.6,-34.2 40.4,-36.4 C 39.6,-37.2 39,-38 38.6,-38.8 '
    + 'C 39,-35.8 38.4,-32.4 36.6,-29.4 C 35.8,-28.4 35,-27.8 34.2,-27.6 C 31.6,-30 29.6,-34 29,-38.6 '
    + 'C 28.6,-41.6 28.4,-44.4 28.2,-47 C 28,-49 28,-51 28,-53 C 27,-58.6 25.8,-64 23.4,-69 C 20,-77 13.4,-84 4,-89.4 Z';
  // la bande blanche du dessous, qui descend jusque dans la nageoire du bas
  const dessous = 'M 23.4,-69 C 25.8,-64 27,-58.6 28,-53 C 28,-51 28,-49 28.2,-47 C 28.4,-44.4 28.6,-41.6 29,-38.6 C 29.6,-34 31.6,-30 34.2,-27.6 '
    + 'C 33,-30.6 32.4,-34.6 32.2,-38.6 C 32,-42 32,-45 31.8,-47.6 C 31.6,-50 31.6,-52 31.6,-53.8 '
    + 'C 31,-59 30,-64.4 28.2,-69.4 C 26.6,-74 24,-78 20.6,-81.6 C 21.8,-77.6 22.8,-73.4 23.4,-69 Z';
  return [
    {os: 'tete', z: Z.queue, dessin(p) {
      p.forme(queue, c, {taille: 'g'});
      p.dans(queue, () => p.forme(dessous, blanc, {taille: 'm', force: .9}));
    }},
    {os: 'tete', z: Z.cheveux, dessin(p) {
      for (const d of [panG, panD]) { p.portee(d, tete, peau, {dy: .8, dx: 0, flou: 1.6, force: .35}); p.forme(d, c, {taille: 'm', force: 1.1}); }
      p.portee(capuche, tete, peau, {dy: 1.4, flou: 2, force: .5});
      p.dans(tete, () => p.forme(bec, vif, {taille: 'p', force: .5}));      // le V rouge, sous la capuche et sa bande sombre
      p.forme(capuche, c, {taille: 'g', force: .9});
      p.dans(capuche, () => {
        p.forme(bande, masque, {taille: 'm', force: .7});
        // trois petits points en arc au-dessus de chaque œil, vers l'extérieur
        for (const [x, y, r, a] of [[-19.8, -68.2, .85, -20], [-22.4, -66.6, .8, -40], [-24, -64.2, .7, -60], [9.4, -68.6, .85, 20], [12.2, -67.2, .8, 40], [14.2, -65, .7, 60]])
          p.forme(P.ell(x, y, r * 1.25, r * .85, a), vif, {taille: 0});
        // la goutte du front : large en haut, pointue en bas
        p.forme('M -4.9,-80.4 C -3.5,-80.4 -3.2,-78.6 -3.6,-77.2 C -4,-75.8 -4.5,-74.6 -4.9,-73 C -5.3,-74.6 -5.8,-75.8 -6.2,-77.2 C -6.6,-78.6 -6.3,-80.4 -4.9,-80.4 Z', vif, {taille: 'p', force: .6});
      });
    }},
    // les yeux repassent par-dessus le V rouge (mêmes yeux que le moule : ovales pleins, à peine plus sombres en bas)
    {os: 'tete', z: Z.cheveux + .1, si: {yeux: 'ouverts'}, dessin(p) {
      const y = fiche.yeux, bas = P.fonce(y, .8);
      for (const x of [-15.6, 5.2]) p.forme(P.ell(x, -60.4, 3.15, 3.95), p.degrade(0, -64.3, 0, -56.4, y, y, bas), {taille: 0});
    }},
    {os: 'tete', z: Z.cheveux + .1, si: {yeux: 'fermes'}, dessin(p) {
      for (const x of [-15.6, 5.2]) p.trait(`M ${x - 3},-59.8 Q ${x},-57.5 ${x + 3},-59.8`, P.fonce(fiche.yeux, .5), .9);
    }},
  ];
};

// Les bijoux de tête : un diadème d'argent en arc par-dessus la capuche avec un croissant au sommet, un ornement en étoile
// sur chaque tempe et des pendants d'oreilles (pierre turquoise et pointe d'argent).
coiffes.bijouxEaux = o => {
  const ag = o.argent || ARGENT;
  const etoile = (x, y, r, a0) => { let d = ''; for (let i = 0; i < 6; i++) { const a = a0 + i * Math.PI / 3, rr = i % 2 ? r * .45 : r; d += (i ? 'L ' : 'M ') + (x + Math.cos(a) * rr).toFixed(2) + ',' + (y + Math.sin(a) * rr).toFixed(2) + ' '; } return d + 'Z'; };
  return [{os: 'tete', z: Z.coiffe, dessin(p) {
    p.forme(ruban([[-24, -70], [-19, -79.6], [-9.4, -86.6], [2, -88.2], [12.6, -84.4], [20.6, -75.6]], 1.4), ag, {taille: 'p', force: 1.3});
    // le croissant au sommet, pointes vers le haut, et sa pierre
    p.forme('M -5.6,-89.6 C -4.8,-86.6 -2.4,-85.4 0,-85.6 C 2.4,-85.4 4.8,-86.6 5.6,-89.6 C 4,-88 2,-87.4 0,-87.6 C -2,-87.4 -4,-88 -5.6,-89.6 Z', ag, {taille: 'p', force: 1.3});
    goutte(p, 0, -84.2, 1);
    // les tempes : une étoile d'argent à trois branches, une goutte turquoise dessous, puis le pendant d'oreille
    for (const [x, y, s] of [[-25, -66.6, -1], [22.8, -67.6, 1]]) {
      p.forme(etoile(x, y, 3.6, s > 0 ? -1.2 : -1.9), ag, {taille: 'p', force: 1.4});
      p.forme(P.ell(x, y, 1.1, 1.1), P.fonce(ag, .8), {taille: 0});
      goutte(p, x + s * .2, y + 4.4, 1.05);
      p.forme(ruban([[x + s * .2, y + 5.6], [x + s * .3, y + 8.4]], .6), ag, {taille: 0});
      joyau(p, x + s * .3, y + 9.8, 1.1);
      p.forme(`M ${x + s * .3 - .9},${y + 11.4} L ${x + s * .3 + .9},${y + 11.4} L ${x + s * .3},${y + 15.4} Z`, ag, {taille: 'p'});
    }
  }}];
};

// La tenue : le corps (devant crème, côtés rouges), les bijoux (haut collier, parure des clavicules, chaîne et pendentif,
// ceinture en croissants, chaîne de hanche), l'écharpe bleue (épaule proche → hanche opposée, tour de taille, cape dans le dos),
// les nageoires des épaules et des avant-bras, les bracelets, et le bas des jambes (devant des cuisses crème, tache au genou,
// marques rouge vif sur les tibias, anneaux d'argent aux chevilles, griffe et talon des pieds).
tenues.eaux = (o, fiche) => {
  const rouge = o.rouge, creme = fiche.peau, bleu = o.echarpe || '#1f9fd2', bleuClair = o.echarpeClair || '#c9ecf4', ag = o.argent || ARGENT;
  // corps plus féminin : cou fin, épaules qui descendent en pente douce, taille marquée, hanches un peu plus larges
  const corps = 'M -4.4,-49.8 L 1,-50 C 1.2,-47.2 1.8,-45.6 3.6,-44.8 C 6.4,-44 8.6,-43.2 9.8,-41.8 C 11,-40.6 11.4,-39.6 11.4,-38 '
    + 'C 11,-35 9.6,-32.8 9.4,-30.4 C 9.4,-27 10.8,-24 12,-20.6 Q 0,-14.6 -12,-20.6 C -10.8,-24 -9.4,-27 -9.4,-30.4 C -9.6,-32.8 -11,-35 -11.4,-38 '
    + 'C -11.4,-39.8 -10.8,-41 -9.6,-42 C -8.4,-43.2 -6.6,-44 -5.6,-44.8 C -4.8,-45.6 -4.4,-47.2 -4.4,-49.8 Z';
  const devant = 'M -4.6,-50 L 1.2,-50.2 C 1.4,-47 2.4,-45.4 4.4,-44.4 C 6,-40 6.6,-36 6.4,-32.4 C 6.2,-26.6 5.2,-21.4 3.2,-17.4 Q -1.8,-15.6 -6.8,-17.4 '
    + 'C -8.6,-21.4 -9.2,-26.6 -9,-32.4 C -8.8,-36 -8.2,-40.4 -6.8,-44.2 C -5.2,-45.4 -4.6,-47 -4.6,-50 Z';
  const couches = [];
  // les deux petites nageoires des hanches (Kiki, 14/11) : elles sortent de derrière les hanches, de chaque côté, sous la ceinture ;
  // rouges, avec un bord rayé jaune et turquoise en dessous
  couches.push({os: 'torse', z: Z.torse + .2, dessin(p) {   // par-dessus les cuisses
    // (14/11, 2e retouche : elles tombent vers le bas et reposent sur le côté des cuisses ; plus longues, plus allongées)
    for (const [x0, y0, x1, y1, c] of [[-9.6, -24, -10, -14.2, -1], [9.6, -24.2, 10.4, -14.4, 1]]) {
      const raye = feuille(x0 - c * .5, y0 + .3, x1 - c * .7, y1 + .3, 3.4, c * .7), nag = feuille(x0, y0, x1, y1, 3.4, c * .7);
      p.forme(raye, '#f3d92a', {taille: 0}); rayures(p, raye, x0, y0, x1, y1, 9);
      p.forme(nag, rouge, {taille: 'm', force: 1.1});
    }
  }});
  couches.push({os: 'torse', z: Z.torse, dessin(p) {
    p.forme(corps, rouge, {taille: 'g', force: .9});
    p.dans(corps, () => {
      p.forme(devant, creme, {taille: 'g', force: .7});
      p.portee(P.ell(-1, -53, 14, 9.5), corps, creme, {dy: 1.2, flou: 3, force: .45});         // l'ombre de la tête
    });
    // le collier (Kiki, 14/11) : un petit collier simple, une fine chaîne d'argent et trois gouttes bleues ;
    // on voit celle du milieu et celle de gauche, la troisième passe sous le drap
    p.forme(ruban([[-7.6, -43.8], [-5.4, -42.6], [-2.4, -42], [.6, -42.4], [3.4, -43.6]], .42), ag, {taille: 'p'});
    for (const [x, y] of [[-5.6, -41.4], [-2.4, -40.8], [.8, -41.2]]) { p.forme(P.ell(x, y - 1.3, .38, .38), ag, {taille: 0}); goutte(p, x, y, .78); }
    // la ceinture : des croissants d'argent sur les hanches, avec de petites pointes qui pendent
    p.dans(corps, () => {
      p.forme(ruban([[-12.6, -22.6], [-6, -20.4], [0, -19.8], [6, -20.4], [12.6, -22.6]], 1), ag, {taille: 'p', force: 1.2});
      for (let i = 0; i < 6; i++) {
        const x = -10.4 + i * 4.2, y = -21.4 + Math.abs(x) * .06;
        p.forme(`M ${x - 1.8},${y - 1.2} C ${x - 1},${y + .8} ${x + 1},${y + .8} ${x + 1.8},${y - 1.2} C ${x + .8},${y - .2} ${x - .8},${y - .2} ${x - 1.8},${y - 1.2} Z`, ag, {taille: 'p'});
        p.forme(`M ${x - .45},${y + .5} L ${x + .45},${y + .5} L ${x},${y + 2} Z`, P.fonce(ag, .85), {taille: 0});
      }
    });
    // le vêtement bleu, D'UN SEUL TENANT (Kiki, 14/11 : « un seul vêtement », on sent les plis mais pas les morceaux) :
    // il part de l'épaule proche, descend en biais vers la hanche opposée (le devant de la poitrine reste visible à gauche),
    // couvre tout le côté proche de la poitrine et fait le tour de la taille ; plis doux, triangles clairs au bord du bas, emblème devant.
    const drap = 'M 2.6,-46.8 C 6.4,-48.4 10.4,-47.6 11.8,-44.6 C 12.4,-41 12,-37.4 11.4,-34 C 12.2,-30.6 12.6,-27.6 12.2,-25 '
      + 'C 7.6,-23.2 3.2,-22.4 -1,-22.4 C -5.2,-22.4 -9,-23.4 -12.2,-25 C -12.6,-27.8 -12.6,-30.8 -11.8,-33.4 '
      + 'C -8.2,-34.8 -4.6,-37 -1.8,-40 C .2,-42.2 1.6,-44.4 2.6,-46.8 Z';
    const fonce = P.fonce(bleu, .8), clair = P.clair(bleu, .22);
    p.portee(drap, corps, creme, {dy: 1.2, dx: -.4, flou: 2.2, force: .45});
    p.forme(drap, bleu, {taille: 'g', force: 1});
    p.dans(drap, () => {
      // les plis : ils descendent de l'épaule et s'arrondissent autour de la taille (de longues formes douces, pas des traits)
      for (const [pts, w, c] of [
        [[[9.4, -45.6], [5.6, -40.6], [.6, -36], [-5.6, -32.4], [-11.6, -30.6]], 1.3, fonce],
        [[[11.4, -41.6], [7.6, -36.4], [2.6, -32.2], [-3.6, -29.4], [-11, -28]], 1, fonce],
        [[[6.8, -46.4], [3.2, -41.8], [-1.6, -37.6], [-7.6, -33.8]], .8, clair],
        [[[11.8, -36], [8.6, -31.4], [3.6, -28.2], [-4, -26.6], [-11.6, -26.4]], .8, clair],
        [[[12, -28.8], [6, -26.2], [-1, -25.2], [-8, -25.6]], .7, fonce]]) p.forme(meche(pts, w, 2.2), c, {taille: 'p', force: .35});
      for (let x = -12.4; x < 13; x += 2.3) { const y = -23.4 - Math.cos(x / 13 * 1.5) * 1.1 + 1.1; p.forme(`M ${x},${y} L ${x + 1.15},${y - 2} L ${x + 2.3},${y} Z`, bleuClair, {taille: 0}); }
      // l'emblème de Kiki (image chiffrée) devant, au milieu ; sans le mot de passe : des vagues claires
      if (!(o.embleme && p.image(o.embleme, -1.6, -28.6, 6.2))) {
        p.forme(ruban([[-6.4, -30], [-4.6, -31.4], [-2.6, -30], [-.6, -31.4], [1.4, -30], [3.4, -31.4]], .7), bleuClair, {taille: 0});
        p.forme(ruban([[-5.4, -27.8], [-3.4, -29], [-1.4, -27.8], [.6, -29], [2.6, -27.8]], .55), bleuClair, {taille: 0});
      }
    });
  }});
  // La MANCHE sur l'épaule proche (d'après le trait bleu de Kiki, 14/11) : son bord intérieur descend de la broche vers le bras,
  // son ourlet est un trait droit et franc en travers du haut du bras (on voit bien que c'est une manche), puis elle remonte vers l'épaule.
  // Elle recouvre l'articulation de l'épaule.
  couches.push({os: 'brasG1', z: Z.brasG + .7, dessin(p) {
    // (14/11, 2e retouche : l'ourlet suit l'angle du trait jaune de Kiki, il monte vers l'extérieur ; le bord intérieur passe plus à gauche
    // pour qu'on ne voie plus le haut du bras entre la broche et l'ourlet)
    const manche = 'M 2.8,-46.8 C 3.4,-44.8 3.8,-42.6 4.2,-40.6 C 4.8,-38.6 5.6,-36.8 6.6,-35.2 L 14.6,-38 '
      + 'C 14.9,-39.6 14.8,-41 14.2,-42.4 C 13.4,-44.8 11.8,-46.6 9.6,-47.5 C 7.2,-48.3 4.8,-48 2.8,-46.8 Z';
    p.forme(manche, bleu, {taille: 'g', force: 1});
    p.dans(manche, () => {
      p.forme(meche([[7.2, -46.6], [8.4, -42.4], [9.2, -39], [9.6, -36.6]], 1.1, 2.4), P.fonce(bleu, .8), {taille: 'p', force: .35});
      p.forme(meche([[10.4, -47.2], [12, -43.6], [12.8, -40.6], [13.2, -38.2]], .7, 2.4), P.clair(bleu, .22), {taille: 'p', force: .35});
      p.forme('M 6,-36 L 15,-39.2 L 15,-38 L 6.6,-35 Z', P.clair(bleu, .55), {taille: 0});    // l'ourlet, bien net
    });
    // la broche ronde, pierre bleue au centre
    p.forme(P.ell(7.9, -45, 2.5, 2.4), ag, {taille: 'p', force: 1.3});
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.forme(P.ell(7.9 + Math.cos(a) * 1.85, -45 + Math.sin(a) * 1.8, .32, .32), P.fonce(ag, .7), {taille: 0}); }
    joyau(p, 7.9, -45, 1.15, '#2f7fe0');
  }});
  // les nageoires des épaules (rouges, bord rayé jaune et turquoise) et des avant-bras (longues, plus bas que la main)
  for (const [os1, os2, z, s] of [['brasD1', 'brasD2', Z.brasD, -1], ['brasG1', 'brasG2', Z.brasG, 1]]) {
    const [ex, ey] = OS[os1].p, [cx, cy] = OS[os2].p, [mx, my] = OS[os1 === 'brasD1' ? 'arme' : 'bouclier'].p;
    if (s < 0) couches.push({os: os1, z: z + .4, dessin(p) {   // seulement l'épaule éloignée : la proche est sous la manche
      // la nageoire de l'épaule : elle part du haut du bras vers l'extérieur et finit en pointe, son bord du bas est rayé
      const nag = `M ${ex - s * 1.2},${ey - 3.6} C ${ex + s * 3.2},${ey - 4.2} ${ex + s * 7},${ey - 3} ${ex + s * 9.6},${ey + 2.2} `
        + `C ${ex + s * 7.6},${ey + 3} ${ex + s * 5.2},${ey + 4.2} ${ex + s * 3},${ey + 6} C ${ex + s * 1.2},${ey + 3.4} ${ex},${ey} ${ex - s * 1.2},${ey - 3.6} Z`;
      const bord = `M ${ex + s * 9.6},${ey + 2.2} C ${ex + s * 7.6},${ey + 3} ${ex + s * 5.2},${ey + 4.2} ${ex + s * 3},${ey + 6} L ${ex + s * 3.4},${ey + 7.6} C ${ex + s * 5.6},${ey + 6} ${ex + s * 8},${ey + 4.6} ${ex + s * 9.6},${ey + 2.2} Z`;
      p.forme(bord, '#f3d92a', {taille: 0}); rayures(p, bord, ex + s * 3.2, ey + 6.8, ex + s * 9.6, ey + 2.4, 8);
      p.forme(nag, rouge, {taille: 'm', force: 1.1});
    }});
    const n = Math.hypot(mx - cx, my - cy), ux = (mx - cx) / n, uy = (my - cy) / n;
    // le bracelet d'argent au poignet (avec un petit cœur creusé), sans passer sur la main
    const w = 2.75, bx = cx + ux * n * .62, by = cy + uy * n * .62, a = Math.atan2(uy, ux) * 180 / Math.PI;
    couches.push({os: os2, z: z + 1.05, dessin(p) {
      const hors = new Path2D(); hors.rect(-400, -400, 800, 800); hors.ellipse(mx, my, 3.15, 3.05, 0, 2 * Math.PI, 0, true);
      p.dans(hors, () => p.repere(bx, by, a, () => {
        p.forme(`M -1.4,${-w} L 1.4,${-w} L 1.4,${w} L -1.4,${w} Z`, ag, {taille: 'p', force: 1.3});
        p.forme('M 0,.9 C -.9,.1 -.9,-.8 0,-.4 C .9,-.8 .9,.1 0,.9 Z', P.fonce(ag, .7), {taille: 0});
      }));
    }});
  }
  // les jambes : devant des cuisses crème avec une tache rouge au genou, marques rouge vif sur les tibias,
  // anneaux d'argent aux chevilles (avec de petites pointes), griffe d'argent au bout du pied et talon orangé
  for (const [os1, os2, z] of [['jambeD1', 'jambeD2', Z.jambeD], ['jambeG1', 'jambeG2', Z.jambeG]]) {
    const [hx, hy] = OS[os1].p, [gx, gy] = OS[os2].p;
    couches.push({os: os1, z: z + .5, dessin(p) {
      const cuisse = P.capsule(hx, hy, gx, gy, 3.3, 3);
      p.dans(cuisse, () => {
        const crem = `M ${hx - 3.4},${hy - 1} L ${hx + 1.8},${hy - 1} C ${hx + 2},${hy + 3} ${gx + 1.6},${gy - 3} ${gx + .6},${gy - .2} C ${gx - .4},${gy + 1} ${gx - 2},${gy + 1} ${gx - 2.8},${gy - .4} C ${gx - 3.6},${gy - 3} ${hx - 3.6},${hy + 3} ${hx - 3.4},${hy - 1} Z`;
        p.forme(crem, creme, {taille: 'm', force: .8});
        p.forme(P.ell(gx - 1, gy - 1.9, 1.45, 1.3), rouge, {taille: 'p', force: .6});
      });
    }});
    couches.push({os: os2, z: z + 1.5, dessin(p) {
      for (const [dy, l] of [[-10.6, 1.2], [-9, 1], [-7.6, .8]]) p.forme(P.ell(gx + 2.3, gy + 11.4 + dy, .38, l * .7, 10), ROUGE_VIF, {taille: 0});
      const w = 3.25;
      p.forme(`M ${gx - w},-8 Q ${gx},-7.2 ${gx + w},-8 L ${gx + w},-5.6 Q ${gx},-4.8 ${gx - w},-5.6 Z`, ag, {taille: 'p', force: 1.3});
      for (const x of [gx - 1.6, gx + .4]) p.forme(`M ${x - .8},-7.4 L ${x + .8},-7.4 L ${x},-5.6 Z`, P.fonce(ag, .72), {taille: 0});
      for (const x of [gx - w, gx + w]) p.forme(P.ell(x, -7.6, .55, .55), ag, {taille: 'p'});
      p.forme(`M ${gx - 1.4},-4.8 L ${gx - .4},-4.8 L ${gx - .9},-3.2 Z`, ag, {taille: 'p'});
      // la griffe d'argent et le talon orangé font partie du pied : peints DANS la forme du pied (même contour que le moule),
      // ils vont jusqu'au bord et jusqu'en bas, sans écart
      const x = gx, pied = `M ${x + 3.4},-6.4 C ${x + 4.6},-4 ${x + 4.8},-1.6 ${x + 3.6},0 L ${x - 6.2},0 C ${x - 8.8},0 ${x - 9.6},-1.6 ${x - 8.6},-3.2 `
        + `C ${x - 7.4},-4.8 ${x - 4.6},-5.6 ${x - 2.4},-6.6 C ${x - .4},-7.6 ${x + 2.2},-7.6 ${x + 3.4},-6.4 Z`;
      p.dans(pied, () => {
        p.forme(`M ${x - 11},-4.6 L ${x - 8.2},-3.4 L ${x - 6},.6 L ${x - 11},.6 Z`, ag, {taille: 'p', force: 1.2});
        p.forme(`M ${x - 9.6},-2.4 L ${x - 8.2},-3 L ${x - 7.4},-1.4 Z`, P.clair(ag, .5), {taille: 0});
        p.forme(`M ${x + 2.2},.6 L ${x + 3.2},-2.8 L ${x + 6},-2.8 L ${x + 6},.6 Z`, '#f2a51e', {taille: 'p', force: .8});
      });
    }});
  }
  return couches;
};

// Le trident : long manche d'argent, garde en croissant avec une pierre turquoise, trois pointes à crochet (celle du milieu
// plus longue), petite pointe en bas. Tenu par le milieu du manche, presque droit, la tête vers le haut.
armes.trident = o => {
  const [mx, my] = OS.arme.p, ag = o.metal || '#d3d8de', fonce = P.fonce(o.metal || '#d3d8de', .7), or = o.or || '#d9b24a';
  return [{os: 'arme', z: Z.arme, dessin(p) {
    p.repere(mx, my, o.angle === undefined ? -9 : o.angle, () => {
      p.forme('M -.75,28 L .75,28 L .75,-46 L -.75,-46 Z', ag, {taille: 'p', force: .9});                     // le manche
      p.forme('M 0,28 L .75,28 L .75,-46 L 0,-46 Z', P.fonce(ag, .86), {taille: 0});
      for (const y of [-2.4, 2.4, 14, -30]) p.forme(`M -1.15,${y - .6} L 1.15,${y - .6} L 1.15,${y + .6} L -1.15,${y + .6} Z`, or, {taille: 'p'});   // bagues
      p.forme('M -1.3,27.4 L 1.3,27.4 L 0,32 Z', ag, {taille: 'p'});                                         // la pointe du bas
      // la garde en croissant, avec deux volutes et la pierre
      p.forme('M -5.4,-49.4 C -4.6,-46.4 -2.4,-45 0,-45 C 2.4,-45 4.6,-46.4 5.4,-49.4 C 3.6,-47.8 1.8,-47.2 0,-47.2 C -1.8,-47.2 -3.6,-47.8 -5.4,-49.4 Z', or, {taille: 'p', force: 1.2});
      p.forme(ruban([[-1.6, -44.6], [-3.4, -43.4], [-3.6, -41.6], [-2.4, -41.2]], .55), or, {taille: 0});
      p.forme(ruban([[1.6, -44.6], [3.4, -43.4], [3.6, -41.6], [2.4, -41.2]], .55), or, {taille: 0});
      // les trois pointes (celles des côtés s'écartent puis remontent), chacune avec un petit crochet
      const pointe = s => `M ${s * .3},-47.4 C ${s * 3},-48 ${s * 4.4},-50 ${s * 4.4},-53.4 L ${s * 4.6},-58.4 L ${s * 5.6},-55.6 L ${s * 5.2},-55.4 C ${s * 5.2},-51 ${s * 4},-47 ${s * .3},-45.8 Z`;
      p.forme(pointe(-1), ag, {taille: 'p', force: 1.1}); p.forme(pointe(1), ag, {taille: 'p', force: 1.1});
      p.forme('M -.8,-46.6 L .8,-46.6 L .9,-59 L 0,-63.4 L -.9,-59 Z', ag, {taille: 'p', force: 1.1});
      p.forme('M -.9,-59 L -2,-57 L -.8,-57.4 Z', ag, {taille: 0}); p.forme('M .9,-59 L 2,-57 L .8,-57.4 Z', ag, {taille: 0});
      p.forme('M 0,-46.6 L .8,-46.6 L .9,-59 L 0,-63.4 Z', fonce, {taille: 0});
      joyau(p, 0, -46.6, 1.1);
    });
  }}];
};
})();
