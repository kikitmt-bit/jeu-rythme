/* ============================================================
   Page de test des partitions (index.html?test, ou atelier-partitions.html) : chantier 1.1.
   Pendant la partie, deux boutons en haut de l'écran : « Trop dur ici » et « On ne sent pas la musique ».
   Chaque appui garde l'instant précis du morceau, le morceau et la difficulté (sur le téléphone, clé « rythme-marques »).
   Au menu : « Copier les marques » → Kiki colle le texte dans la conversation suivante, et Claude le range avec
   python3 outils/partitions/atelier.py marques <id> '<texte>'.
   Aussi : « Regarder » (le jeu joue tout seul avec la musique, pour écouter si les notes tombent juste) et la
   difficulté « Ancienne » (la partition d'avant l'atelier, quand le niveau l'a gardée) pour comparer.
   Sans ?test, ce fichier ne fait rien.
   ============================================================ */
"use strict";
const CLE_MARQUES = 'rythme-marques';
let marques = [];
if (TEST) {
  try { const m = JSON.parse(localStorage.getItem(CLE_MARQUES) || '[]'); if (Array.isArray(m)) marques = m; } catch (e) {}
  const minSec = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const garder = () => { try { localStorage.setItem(CLE_MARQUES, JSON.stringify(marques)); } catch (e) {} majMarques(); };
  function majMarques() {
    const ici = marques.filter(m => m.morceau === niveau.id);
    $('nbMarques').textContent = marques.length ? `${marques.length} marque${marques.length > 1 ? 's' : ''} (${ici.length} sur ce morceau)` : 'Aucune marque';
  }
  function marquer(quoi, bouton) {
    if (etat !== 'jeu') return;
    // instant dans le morceau (pour un morceau en ligne : dans le MP3, comme les notes de la partition)
    const t = Math.round((tempsCourant - (niveau.mp3 ? niveau.avance : 0)) * 100) / 100;
    marques.push({morceau: niveau.id, dif: modeJoue(), t, quoi});
    garder();
    const texte = bouton.textContent;
    bouton.textContent = `✓ noté à ${minSec(Math.max(0, t))}`; bouton.classList.add('note');
    setTimeout(() => { bouton.textContent = texte; bouton.classList.remove('note'); }, 900);
  }
  $('mDur').onclick = () => marquer('trop-dur', $('mDur'));
  $('mMus').onclick = () => marquer('pas-musique', $('mMus'));
  $('copierMarques').onclick = async () => {
    const texte = JSON.stringify({marques});
    try { await navigator.clipboard.writeText(texte); $('nbMarques').textContent = 'Marques copiées ! Colle-les dans la conversation avec Claude.'; }
    catch (e) { $('nbMarques').textContent = texte; $('nbMarques').style.userSelect = 'text'; }
  };
  $('effacerMarques').onclick = () => { if (marques.length && confirm('Effacer toutes les marques ?')) { marques = []; garder(); } };
  // les deux boutons se logent dans les vides du haut de l'écran : entre le bandeau et la chaîne, entre la chaîne et le score
  function placerMarques() {
    const fin = parseFloat($('bpause').style.width) || H * .6;
    const a = $('mDur').style, b = $('mMus').style;
    a.left = (fin + 6) + 'px'; a.width = Math.max(70, W / 2 - H * .2 - fin - 12) + 'px';
    b.left = (W / 2 + H * .31) + 'px'; b.width = Math.max(70, W - H * .36 - (W / 2 + H * .31)) + 'px';
  }
  ecouter('partie', placerMarques);
  addEventListener('resize', () => setTimeout(placerMarques, 50));
  // visibles seulement pendant la partie
  const afficherJeu = afficher;
  afficher = function (id) {
    afficherJeu(id);
    for (const e of ['mDur', 'mMus']) $(e).classList.toggle('cache', id !== null);
    if (id === 'accueil') majMarques();
  };
  $('zoneTest').classList.remove('cache');
  const choisirJeu = choisirNiveau;
  choisirNiveau = function (id) { choisirJeu(id); majMarques(); };
}
