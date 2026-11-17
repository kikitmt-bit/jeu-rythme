/* ============================================================
   Boucle de jeu, surveillance de la fluidité, démarrage (chargé en dernier).
   ============================================================ */
"use strict";
let dernier = performance.now();
/* Écrans 90/120 Hz (le Pixel 7 Pro monte à 120) : une image toutes les 8 ms. Si le téléphone ne tient pas ce rythme
   parfaitement, le jeu se cale sur 60 images/s bien régulières (une image sur deux), plus fluide à l'œil qu'un 120 qui hoquette. */
let cale60 = false;
function boucle(now) {
  requestAnimationFrame(boucle);
  if (cale60 && now - dernier < 12) return;
  const brut = now - dernier, dt = Math.min(.05, brut / 1000); dernier = now;
  if (etat === 'jeu') { programmer(); synchroniser(); mettreAJour(now / 1000 + ecartHorloge, dt); surveiller(brut); }
  else if (etat === 'decompte' && performance.now() - decompte.debut >= 3 * PAS_DECOMPTE * 1000) finDecompte();
  const t1 = performance.now();
  dessiner(etat === 'menu' ? -10 : tempsCourant, etat === 'decompte' ? 0 : dt, now / 1000);   // pendant le décompte, tout est figé (dt = 0)
  if (FPS) compteur(brut, performance.now() - t1);
}
/* Surveillance de la fluidité pendant la partie */
let mesures = 0, lentes = 0, rapides = 0, rates120 = 0, calme = 0;
function surveiller(ms) {
  if (tempsCourant < (niveau.debut || 0) + 1 || (calme -= ms) > 0) return;
  mesures++;
  if (!cale60) { if (ms < 10.5) rapides++; else if (ms > 12.5) rates120++; }
  if (ms > 24) lentes++;
  if (mesures < 150) return;
  // écran rapide (la plupart des images à ~8 ms) mais quelques images ratées : on se cale sur 60
  if (!cale60 && rapides > 60 && rates120 > 3) { cale60 = true; calme = 2000; }
  // à 60 i/s et encore des images ratées : on baisse un peu la résolution
  else if (lentes > 6 && qualite < QUALITES.length - 1 && DPR > 1) { qualite++; changerQualite(); calme = 3000; }
  mesures = lentes = rapides = rates120 = 0;
}

addEventListener('resize', () => { if (innerHeight > innerWidth) mettrePause(); miseEnPage(); });

majDifficulte();   // boutons de difficulté et records du menu
miseEnPage();
chargerPolices().then(() => miseEnPage());   // les textes du HUD sont redessinés avec les bonnes polices
demarrer();
requestAnimationFrame(boucle);
