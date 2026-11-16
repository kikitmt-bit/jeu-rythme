"use strict";
/* ============================================================
   Équipe : des poupées articulées, toutes sorties du même moule (persos/poupee.js,
   pièces dans persos/pieces.js, personnages dans persos/fiches.js ; essais dans atelier.html).
   Pour l'instant : le héros, la princesse et le colosse de roc en bas de l'écran, qui marchent au rythme du morceau.
   ============================================================ */
const EQUIPE = ['heros-vert', 'princesse', 'colosse', 'princesse-eaux'];
let poupees = [], poupeesEchelle = 0;
function chargerImagesPersos() { if (cle && window.Poupee) Poupee.chargerImages(cle).then(neuf => { if (neuf) { equipeAPrepar = true; if (etat !== 'jeu' && etat !== 'decompte') preparerEquipe(true); preparerCapitaine(true); peindreFond(); } }); }
/* Pour la fluidité, la marche de chaque perso est pré-dessinée en IMAGES_MARCHE images au début de la partie :
   pendant le morceau, un perso = une seule image à recopier (au lieu de ~22 pièces à placer une par une).
   Indispensable pour avoir 4 persos et des monstres à l'écran sans ralentir. */
const IMAGES_MARCHE = 24, CADRE_POUPEE = [-75, -112, 75, 12];
let equipeAPrepar = false;
function preparerEquipe(force) {
  if (!window.Poupee) return;
  const taille = H * .27, dpr = Math.min(window.devicePixelRatio || 1, QUALITES[0]), ech = taille * dpr / 100;
  if (!force && Math.abs(ech - poupeesEchelle) <= poupeesEchelle * .01) return;
  poupeesEchelle = ech;
  const k = taille / 100, [x0, y0, x1, y1] = CADRE_POUPEE, L = (x1 - x0) * k, Hc = (y1 - y0) * k;
  poupees = EQUIPE.map(id => {
    const p = Poupee.fabrique(id, {echelle: ech});
    const brutes = [], lp = Math.ceil(L * dpr), hp = Math.ceil(Hc * dpr);
    let bx0 = lp, by0 = hp, bx1 = -1, by1 = -1;
    for (let i = 0; i < IMAGES_MARCHE; i++) {
      const [c, x] = toile(lp, hp); x.scale(dpr, dpr);
      Poupee.dessine(x, p, -x0 * k, -y0 * k, Poupee.animations.marche.pose(i / IMAGES_MARCHE, 0), {taille});
      brutes.push(c);
      const px = x.getImageData(0, 0, lp, hp).data;          // la zone vraiment peinte (le reste est transparent)
      for (let y = 0; y < hp; y++) for (let X = 0, q = y * lp * 4 + 3; X < lp; X++, q += 4) if (px[q]) {
        if (X < bx0) bx0 = X; if (X > bx1) bx1 = X; if (y < by0) by0 = y; if (y > by1) by1 = y;
      }
    }
    // Les 24 images sont recadrées au plus juste (même cadre pour toutes) : à chaque image du jeu, on ne recopie que
    // les pixels utiles (deux à trois fois moins qu'avant). C'est ce qui paie l'arrivée d'un perso de plus.
    if (bx1 < 0) { bx0 = by0 = 0; bx1 = lp - 1; by1 = hp - 1; }
    bx0 = Math.max(0, bx0 - 1); by0 = Math.max(0, by0 - 1); bx1 = Math.min(lp - 1, bx1 + 1); by1 = Math.min(hp - 1, by1 + 1);
    const lc = bx1 - bx0 + 1, hc = by1 - by0 + 1;
    p.marche = brutes.map(c => { const [d, x] = toile(lc, hc); x.drawImage(c, -bx0, -by0); return d; });
    Object.assign(p, {mx: -x0 * k - bx0 / dpr, my: -y0 * k - by0 / dpr, ml: lc / dpr, mh: hc / dpr});
    return p;
  });
  equipeAPrepar = false;
}
function dessinerEquipe(st, horloge) {
  if (!window.Poupee) return;
  if (!poupees.length || (equipeAPrepar && etat !== 'jeu' && etat !== 'decompte')) preparerEquipe(true);
  const taille = H * .29, sol = H * .885, enRoute = (etat === 'jeu' || etat === 'decompte') && st > niveau.avance;
  // un pas par temps de la musique
  const u = ((st - niveau.debut) / niveau.temps / 2 % 1 + 1) % 1, pose = enRoute ? null : Poupee.poseA('attente', horloge);
  for (let i = 0; i < poupees.length; i++) {
    const p = poupees[i], x = W * .6 - (poupees.length - 2) * taille * .55 + i * taille * .75;   // à 3 et plus, le groupe recule pour ne pas passer sous le panneau du capitaine
    g.drawImage(SPR.ombre, x - taille * .22, sol - taille * .045, taille * .44, taille * .09);   // ombre au sol
    if (enRoute) g.drawImage(p.marche[Math.floor(u * IMAGES_MARCHE) % IMAGES_MARCHE], x - p.mx, sol - p.my, p.ml, p.mh);
    else Poupee.dessine(g, p, x, sol, pose, {taille});
  }
}
