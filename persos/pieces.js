/* ============================================================
   Bibliothèque de pièces pour habiller le mannequin (persos/poupee.js).
   Chaque pièce reçoit ses options (couleurs…) et rend des couches :
     {os: à quel os elle est accrochée, z: ordre d'empilement, dessin(p): ce qu'elle peint}
   On dessine en pose de repos, dans le repère de la poupée (pieds en 0,0, ~100 de haut).
   Nouveau personnage → on réutilise ces pièces ; s'il en manque une, on l'ajoute ici.
   ============================================================ */
(function () {
'use strict';
const P = window.Poupee, Z = P.Z, OS = P.OS;
const {coiffures, coiffes, tenues, armes, boucliers} = P.pieces;

/* ---------- Coiffures ---------- */
// raie sur le côté, deux grandes mèches qui encadrent le visage, longues pattes devant les oreilles
coiffures.raie = o => {
  const c = o.couleur, f = P.fonce(c, .72);
  return [{os: 'tete', z: Z.cheveux, dessin(p) {
    // le dessus du crâne
    p.forme('M -8,-84 C -17,-88 -4,-91 6,-89.5 C 16,-88 23,-80 23,-70 L 20,-74 C 12,-82 2,-85 -8,-84 Z', c);
    // mèche de gauche (deux épaisseurs)
    p.forme('M -8,-84.8 C -18,-87 -28,-79 -27.4,-64 C -27,-58.5 -22.5,-56 -18.6,-59.6 C -18.6,-69 -14.5,-77.5 -8,-84.8 Z', c);
    p.forme('M -26.6,-67 C -28,-58 -26.4,-50.5 -22.4,-45.5 C -21.2,-51.5 -21.6,-58 -20.6,-63.5 Z', c);
    // mèche de droite
    p.forme('M -8,-84.8 C 3,-88 16,-84 22,-73 L 23,-61 C 20.5,-64.5 16.5,-65 13,-62.2 C 10.5,-71.5 3,-79.5 -8,-84.8 Z', c);
    p.forme('M 13.2,-70 C 19.5,-72 24.4,-66.5 24.4,-60 C 24.8,-51.5 21.6,-45 18.4,-39.6 C 15.4,-46 14.4,-55 13.4,-64 Z', c);
    // quelques cheveux
    p.trait('M -11,-82.6 C -18,-79 -23,-72 -23.8,-63', f, .45, .55);
    p.trait('M -3,-83.3 C 6,-81.5 13.5,-76 17.5,-68', f, .45, .55);
    p.trait('M 18.6,-66 C 20,-58 19.6,-52 18.2,-46', f, .45, .5);
  }}];
};

/* ---------- Coiffes ---------- */
// long bonnet souple qui retombe derrière la tête
coiffes.bonnet = o => {
  const c = o.couleur, f = P.fonce(c, .8);
  return [
    {os: 'queue', z: Z.queue, dessin(p) {
      p.forme('M 8,-90 C 21,-97 33.5,-88 33.5,-72 C 33.5,-60 31.5,-51 27.5,-44 C 23.5,-49 21.5,-58 20.5,-66 L 8,-80 Z', c, {taille: 'g'});
    }},
    {os: 'tete', z: Z.coiffe, dessin(p) {
      const dome = 'M -11.5,-86.2 C -5,-96.5 13,-99.5 22.5,-89 C 28,-82.5 27.6,-72.5 24.2,-65.5 L 20.8,-69.5 C 16.5,-78.5 6,-85.5 -11.5,-86.2 Z';
      p.forme(dome, c, {taille: 'g'});
      p.dans(dome, () => p.trait('M -11.5,-86.2 C 6,-85.5 16.5,-78.5 22.4,-67.2', f, 2.6, .8));
    }},
  ];
};

/* ---------- Tenues ---------- */
// tunique évasée à manches courtes, ceinture et bandoulière en option
tenues.tunique = o => {
  const c = o.couleur;
  const robe = 'M -8,-44.5 L 8,-44.5 C 10.4,-43.6 11.2,-41 11.3,-38.5 L 13.8,-18.6 Q 0,-14.8 -13.8,-18.6 L -11.3,-38.5 C -11.2,-41 -10.4,-43.6 -8,-44.5 Z';
  return [{os: 'torse', z: Z.torse, dessin(p) {
    p.forme(robe, c, {taille: 'g', force: .9});
    p.dans(robe, () => {
      if (o.col) p.forme('M -5.2,-45 L 0,-38.6 L 5.2,-45 L 3,-45 L 0,-41.2 L -3,-45 Z', o.col, {taille: 'p'});
      if (o.bandouliere) {
        p.forme('M 6.6,-45 L 9.4,-43.6 L -11.6,-26 L -12.6,-28.8 Z', o.bandouliere, {taille: 'p'});
        if (o.boucle) p.forme('M -4.4,-36.6 L -1.6,-36.2 L -2.4,-33 L -5.2,-33.4 Z', o.boucle, {taille: 'p'});
      }
      if (o.ceinture) {
        p.forme('M -14,-27.4 Q 0,-25.4 14,-27.4 L 14,-24.4 Q 0,-22.4 -14,-24.4 Z', o.ceinture, {taille: 'p'});
        if (o.boucle) {
          p.forme('M -4.6,-27.2 L -.6,-27 L -.6,-23.2 L -4.6,-23.4 Z', o.boucle, {taille: 'p'});
          p.forme('M -3.5,-26.1 L -1.7,-26 L -1.7,-24.2 L -3.5,-24.3 Z', o.ceinture, {taille: 0});
        }
      }
    });
  }}];
};

/* ---------- Armes (dessinées droites, poignée en 0,0, lame vers le haut ; tenues dans la main droite) ---------- */
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
boucliers.ecu = o => {
  const [mx, my] = OS.bouclier.p, bord = o.bord || '#c9d1da', fond = o.fond || '#3b68c6';
  const forme = 'M -13,-15 Q 0,-18.5 13,-15 L 13,-2 C 13,9 6,15 0,19 C -6,15 -13,9 -13,-2 Z';
  return [{os: 'bouclier', z: Z.bouclier, dessin(p) {
    p.repere(mx + 4.5, my - .5, o.angle === undefined ? 7 : o.angle, () => {
      p.forme(forme, bord, {taille: 'g'});
      p.repere(0, .3, 0, () => p.forme(forme, fond, {taille: 'g', force: .8}), .8);
      for (const [x, y] of [[-11.6, -14], [11.6, -14], [-11.7, -3], [11.7, -3], [-7.6, 9.4], [7.6, 9.4], [0, 16.8], [0, -15.6]])
        p.forme(P.ell(x, y, .7, .7), P.fonce(bord, .7), {taille: 0});
      const e = EMBLEMES[o.embleme];
      if (e) e(p, o.couleurEmbleme || '#f0c648');
    }, o.taille || 1);
  }}];
};
})();
