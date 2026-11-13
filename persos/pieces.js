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
})();
