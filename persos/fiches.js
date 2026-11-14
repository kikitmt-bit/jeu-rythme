/* ============================================================
   Les fiches des personnages : uniquement des choix de pièces et de couleurs.
   Le style (proportions, visage, ombrage, animations) vient de persos/poupee.js.
   Personnages originaux seulement dans ce fichier (le dépôt est public).
   ============================================================ */
/* Paquets d'images chiffrées à charger (voir Poupee.chargerImages). */
Poupee.paquets = ['images/persos.bin?v=2'];

Poupee.fiche({
  id: 'heros-vert', nom: 'Héros vert', coup: 'Attaque tourbillon',
  peau: '#f9d5b5', yeux: '#1d6b5d', oreilles: 'pointues',
  cheveux: {modele: 'raie', couleur: '#e2bf66'},
  coiffe: {modele: 'bonnet', couleur: '#3f9b3f'},
  tenue: {modele: 'tunique', couleur: '#3f9b3f', col: '#6cc05e', dessous: '#f3eee2', ceinture: '#7a4a2c', bandouliere: '#7a4a2c', boucle: '#e8be45'},
  bras: {manche: '#3f9b3f', dessous: '#f3eee2', gant: '#7a4a2c'},
  jambes: {collant: '#f3eee2', botte: '#84502e'},
  // l'épée et le bouclier viennent d'une image de Kiki (paquet chiffré) ; `secours` = ce qu'on voit sans le mot de passe
  arme: {modele: 'image', image: 'epee-heros.png', hauteur: 74, ancre: [.715, .842],   // le milieu du manche
         secours: {modele: 'epee-ailee', lame: '#e6ebf2', garde: '#5a4bb8', pierre: '#f2cf4a'}},
  bouclier: {modele: 'image', image: 'bouclier-heros.png', hauteur: 47, dx: 9, dy: -1.5, angle: 6,
             secours: {modele: 'ecu', bord: '#c9d1da', fond: '#3b68c6', embleme: 'note', couleurEmbleme: '#f0c648', taille: 1.18}},
});

Poupee.fiche({
  id: 'princesse', nom: 'Princesse', coup: 'Lumière sacrée',
  peau: '#f9d5b5', yeux: '#3a66b8', oreilles: 'pointues', oreilleLoin: true,
  cheveux: {modele: 'longs', couleur: '#e1ae56', derriere: '#c39249'},
  coiffe: {modele: 'diademe', couleur: '#e8bc45', pierre: '#d8323f'},
  tenue: {modele: 'robe', haut: '#d34b92', jupe: '#f3eaf6', or: '#e8bc45', tablier: '#6a3d9e', embleme: 'triforce.png', epaulieres: '#e8bc45'},
  // longs gants blancs qui couvrent toute la main (main = couleur du gant) ; entre la manche et le gant, la peau
  bras: {manche: '#d34b92', gant: '#f7f1f9', main: '#f7f1f9'},
  jambes: {collant: '#f7f1f9', botte: '#c25591'},
  arme: {modele: 'rapiere', lame: '#e4eaf1', garde: '#e8bc45', poignee: '#8a3b5c', pierre: '#4f8fe0'},
});

// colosse de roc : créature massive et musclée, peau brun doré, crête et épaules couvertes de cailloux (14/11, d'après les images de Kiki).
// Même pinceau, mêmes yeux et même nez que les autres ; tête en cloche (option `tete`), carrure à part (options `taille`, `os`, `corps`).
Poupee.fiche({
  id: 'colosse', nom: 'Colosse de roc', coup: 'Roulade de roc', taille: 1.15,   // un peu plus grand que les autres
  peau: '#cf9a42', yeux: '#3c33a6', yeuxTaille: [2.6, 2.9], nez: 1.5, bouche: 'dents', levres: '#5a3a14', joues: null,
  tete: Poupee.TETE_COLOSSE,
  os: {
    racine: {p: [0, -20]}, torse: {p: [0, -21]},
    jambeD1: {p: [-8.6, -20]}, jambeD2: {p: [-11.6, -11.6]}, jambeG1: {p: [8.6, -20]}, jambeG2: {p: [11.8, -11.6]},
    brasD1: {p: [-21, -43]}, brasD2: {p: [-31, -31.4]}, arme: {p: [-26, -19.6]},
    brasG1: {p: [21.4, -43]}, brasG2: {p: [31.6, -31.4]}, bouclier: {p: [26.6, -19.8]},
  },
  corps: {bras: 1.85, main: 1.75, jambes: 1.7, pieds: 'nus', taillePieds: 1},
  cheveux: {modele: 'cailloux'},
  tenue: {modele: 'colosse'},
  bras: {manche: null},
  jambes: {collant: '#cf9a42'},
});
