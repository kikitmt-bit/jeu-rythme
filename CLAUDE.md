# Jeu de rythme — instructions pour Claude

Jeu de rythme façon Theatrhythm (3DS / Final Bar Line sur Switch), joué au doigt sur téléphone.
Projet familial de Kiki : seuls Kiki (Pixel 7 Pro, Android) et son frère (peut-être iPhone) y jouent. Jamais vendu.
Kiki ne code pas : il dicte à la voix. Réponds-lui toujours en français, simplement, sans jargon.
Mémoire commune : `kiki-cerveau/projets/jeu-rythme/` (`CONTEXTE.md`, `CHANTIERS.md`, et **`PERSOS-HISTORIQUE.md`** = tout l'historique détaillé des passes de chaque perso et du HUD, à lire avant de créer ou retoucher un perso).

## En ligne
- Site : https://kikitmt-bit.github.io/jeu-rythme/ (GitHub Pages, branche `main`, racine). Chaque envoi sur `main` met le site à jour en ~1 min.
- Dépôt **public** : n'y mettre aucun secret.

## Structure
| Fichier | Rôle |
|---|---|
| `index.html` | La page du jeu : écrans (menu, mot de passe, pause, fin) et styles ; charge les 3 fichiers de `persos/` puis ceux de `jeu/`, **dans cet ordre** |
| `jeu/*.js` | Le code du jeu (JS pur, aucune dépendance), en **scripts classiques** (pas de modules ni d'outil de construction, comme `persos/`) ; ce qui est déclaré au premier niveau d'un fichier est visible des suivants. **Monter le `?v=` du fichier changé** dans `index.html` (sinon le téléphone garde l'ancien) |
| `jeu/reglages.js` | Fenêtres de jugement, `AUTO`, `DIR_ANGLE`, réglages mémorisés (`rythme-reglages`), `$`, `cv` (la toile) |
| `jeu/son.js` | Synthé WebAudio, `programmer`, horloge du morceau calée sur le haut-parleur (`synchroniser`, `tempsA`), musique MP3 (`source`) |
| `jeu/foret.js` | Le niveau intégré « Forêt d'émeraude » : composition originale + `partition()` |
| `jeu/moteur.js` | `NIVEAUX`, état de la partie, `nouvellePartie`, `noter` (score, chaîne, PV, jauge), entrées (doigts, clavier), `mettreAJour`. **Ne connaît ni le dessin ni le HUD** : il annonce (`annoncer('partie' / 'note' / 'coffre' / 'fin')`) et les autres s'abonnent (`ecouter`). Garder ça pour le futur 2e mode et le combat |
| `jeu/dessin.js` | Sprites pré-dessinés (notes, cibles, effets, `stylise`), décor (`DECORS`), `miseEnPage`, qualité, effets (`eclat`), `dessiner()` = l'image de chaque instant |
| `jeu/hud.js` | HUD façon Final Bar Line (bandeau, chaîne, score, TIME, panneau du capitaine, coup spécial), `peindreFond`, compteur de performances (`FPS`) |
| `jeu/equipe.js` | `EQUIPE`, marche pré-dessinée (`preparerEquipe`), `dessinerEquipe` |
| `jeu/menu.js` | Écrans, `lancer`, plein écran, geste retour, pause et décompte 3-2-1, records, écran de fin (`terminer`), niveaux en ligne, mot de passe, cache des musiques, réglages du menu |
| `jeu/boucle.js` | Boucle de jeu (`boucle`), surveillance de la fluidité (`surveiller`, `cale60`), démarrage (chargé en dernier) |
| `niveaux/index.json` | Catalogue + chiffrement (sel, témoin). Généré par `outils/chiffrer.py`, ne pas éditer à la main. `notes` = combo maximal (une tenue compte double) |
| `niveaux/<id>.json` | Un niveau : tempo, décalages, partition |
| `musiques/<id>.bin` | Musique, MP3 128 kbit/s **chiffré** (AES-256-GCM) |
| `persos/poupee.js` | **Le moule des personnages** : squelette, mannequin (tête, visage, bras, jambes), pinceau (ombrage), animations. Commun à tous = le style unique |
| `persos/pieces.js` | Pièces : coiffures, coiffes, tenues, armes, boucliers |
| `persos/fiches.js` | Les personnages : une fiche = des pièces + des couleurs |
| `atelier.html` | Atelier des persos (voir un perso, ses animations, ombrage, squelette) |
| `atelier-menu.html` + `atelier-menu.js` | **Maquette du menu** (chantier 2.1, rien de branché au jeu) : titre, menu principal, morceaux, équipe, résultats animés, options ; `?ecran=titre\|menu\|morceaux\|equipe\|resultats\|options`, `&fige` = animations arrêtées (captures). Lit records, réglages et clé du téléphone, n'écrit rien. Persos en films pré-dessinés (16 images par animation, une image recopiée par perso) |
| `images/persos.bin` | Images fournies par Kiki (épée et bouclier du héros, emblème de la princesse des eaux, triforce), **chiffrées** : JSON `{nom.png: PNG base64}`, paquet `?v=4`. Sans mot de passe : losange doré. Ajouter une image = **redonner toutes les images** à `chiffrer.py images` (paquet réécrit en entier : déchiffrer l'ancien d'abord) |
| `decors/<id>.webp` | Décor fixe de chaque niveau (1536×1024, fait avec ChatGPT par Kiki), déclaré dans `DECORS`, peint une seule fois dans le fond. Image immobile ; changer `?v=` si elle change. Prompt en 3 blocs : voir le CONTEXTE du cerveau |
| `polices/` | Polices (OFL) : Cinzel 700/900, Libre Baskerville 700 (HUD) ; M PLUS Rounded 1c 700/800 (menus, typo ronde, via fontsource) |
| `reserve/solarus-alttp-pack.zip.bin` | Réserve **chiffrée** du pack Solarus ALTTP envoyé par Kiki, pour piocher plus tard |
| `outils/chiffrer.py` | Verrouille musiques (`morceau`), images (`images`), fichiers (`fichier`) ; `changer` = nouveau mot de passe |
| `outils/analyse/` | Analyse audio (numpy + scipy) : `base`, `grid`, `notes`, `partition_gff`, `verif`. **Seule version à jour** (le cerveau n'a plus que des renvois) |
| `outils/persos/` | `capture.js` (captures de l'atelier, `MDP=…` pour les images chiffrées), `comparer.py` (modèle de Kiki / poupée côte à côte) |
| `outils/perf/mesure.js` | Coût d'une image (rendu logiciel) |
| `outils/menu/` | Maquette du menu : `capture.js` (captures figées, finesse 2 pour Kiki), `verif.js` (rien hors écran, zones à toucher ≥ 44 px, textes coupés), `parcours.js` (parcours au doigt), `perf.js` (coût par image) ; comparaison avec les modèles de Kiki : `outils/persos/comparer.py` (modèles dans le cerveau, jamais ici) |
| `outils/tests/` | `records-pause.js` (pause, décompte 3-2-1, records), `partie-auto.js` (partie simulée complète, doit donner 9 999 999), `pixels.js` + `comparer-pixels.py` (captures à horloge et hasard figés du menu et de 3 instants de `?auto&niveau=gff`, comparées pixel par pixel avec une ancienne version : pour vérifier qu'un rangement du code ne change rien à l'image) |
| `manifest.webmanifest`, `icones/` | Installation sur l'écran d'accueil (plein écran, paysage) |

## Règles absolues
1. **Jamais de musique ni d'image de jeu en clair dans le dépôt** (Nintendo, Square Enix…) : seulement des `.bin` chiffrés. `.gitignore` bloque les `.mp3`.
   Les ressources Nintendo, c'est **Kiki qui les fournit** (envoyées dans la conversation) ; Claude ne les télécharge pas et ne dessine pas de personnages existants.
2. **Jamais le mot de passe familial dans un fichier**, un commit, un message de commit ou le cerveau. Kiki le redonne dans la conversation ; le passer par `MDP_FAMILLE=... python3 outils/chiffrer.py ...`.
   Oublié : bouton « Clé de secours » du menu (visible téléphone déverrouillé) → il colle la clé → `CLE_FAMILLE=... python3 outils/chiffrer.py ...`. Jamais écrite nulle part.
3. Changer le mot de passe : `MDP_FAMILLE=ancien MDP_NOUVEAU=nouveau python3 outils/chiffrer.py changer` (ou `CLE_FAMILLE=...` pour l'ancien) rechiffre tous les `.bin` ; chacun retape ensuite le nouveau mot de passe dans le jeu.

## Format d'un niveau (`niveaux/<id>.json`)
`bpm`, `grille` (s, premier temps de la grille dans le MP3), `avance` (s de silence avant le MP3, 1,5), `fin` (s dans le MP3 où la partie se termine), `musique`, puis `notes`, une par ligne :
`{"y": "t"|"h"|"s", "t": temps dans le MP3 (s), "l": piste 0-3 (0 = grave, en bas en paysage), "e": fin de tenue, "d": sens du glissé (u, d, l, r, ur, ul, dr, dl), "p": n° de note double}`.
y : t = taper, h = tenue (compte 2 dans le combo : tête + queue), s = glissé.

## Gameplay (décisions de Kiki)
- Paysage = style Switch (notes de gauche à droite, cibles à droite, pistes dans la moitié haute, le bas pour les pouces). **Pas de portrait** : un écran demande de tourner le téléphone et la partie se met en pause.
- On touche **n'importe où** (le moment compte, pas l'endroit), 1 ou 2 pouces. Surtout une note à la fois ; doubles (barre **bleue**) et tenue d'un pouce + tape de l'autre aux moments forts. Le geste « retour » d'Android est ignoré en partie.
- **Score** (16/11) : 9 999 999 pour une partie parfaite (tout en Critical), quel que soit le morceau (`SCORE_MAX`, `scoreBrut` / `poidsMax`).
- **Records** (16/11) : sur le téléphone, `localStorage` clé `rythme-records` = `{morceau: {normal: {score, rang, combo, full}}}` (meilleur de chaque, séparément ; une clé par difficulté, `DIFFICULTE = 'normal'` pour le chantier 1.1). Seules les parties **terminées** comptent, et pas `?auto`. L'écran de fin dit « Nouveau record ! » avec l'ancien ; le menu montre le record sous chaque morceau. Tests : `outils/tests/records-pause.js` (pause, décompte, records) et `outils/tests/partie-auto.js` (partie simulée complète).
- **Pause** : à la reprise, décompte 3-2-1 (`etat = 'decompte'`, `PAS_DECOMPTE` 0,8 s par chiffre) : son suspendu et notes figées (dt = 0), chiffres pré-dessinés (`CHIF.decompte`), horloge resynchronisée à la fin (`finDecompte`). Toucher le bandeau pendant le décompte redonne la pause.
- Notes façon Final Bar Line : rond rouge à point blanc (taper), vert + bande (maintenir), doré avec grande flèche blanche (glisser), cibles sombres cerclées de blanc, « CRITICAL » arc-en-ciel, « CHAIN » en haut au centre.
- **HUD façon Final Bar Line** : pistes = fins traits blancs, cibles = gros anneaux à droite (x = W − 0,298 H, pistes de 0,2 H à 0,554 H) ; bandeau du titre en haut à gauche (jaquette, difficulté selon notes/s : Facile < 1,5, Normal < 2,5, Difficile < 3,5, Expert ; **toucher le bandeau = pause**) ; chaîne en haut au centre, score en haut à droite, barre TIME en bas, panneau du capitaine (`EQUIPE[0]`) en bas à droite. Critical = cercle magique de la couleur de la note.
  Coffres sur les notes et coup spécial : codés puis **mis de côté par Kiki le 14/11** (`COFFRES_SUR_NOTES = false`, `COUP_SPECIAL = false`, code gardé). Détails : PERSOS-HISTORIQUE.md.
- Équipe (14/11) : 4 persos au complet, un pas par temps : héros (`heros-vert`), princesse, colosse de roc (attaque aux **poings**, `attaque: 'poings'`), princesse des eaux. Pieds à 88,5 % de la hauteur, taille 0,29 H. Héros et princesse attaquent à l'épée. À 3+ le groupe recule à gauche (panneau du capitaine).
- Vision de Kiki (à faire) : équipe en bas à droite, une piste par perso (il tape quand on réussit), attaque spéciale au bout de N notes avec bandeau triangle, monstres à gauche qui meurent et sont remplacés, une dizaine d'actions par perso (attaque, coup spécial, touché, à genoux, saut de victoire…), les mêmes pour tous.

## Fluidité (standard validé par Kiki le 14/11 : 120 i/s stables sur son Pixel 7 Pro, à garder TOUJOURS)
- Toute nouveauté (persos, monstres, effets, décors) : **mesurer avant/après** (`outils/perf/mesure.js`, ancienne version via `git worktree add`), objectif ≤ l'ancienne ; ne rien livrer de plus cher sans compenser. Minimum absolu : 60 i/s réguliers. Coût actuel : ~3,7 ms par image.
- Rien de lourd ne se prépare pendant la partie. **Aucun tracé en partie** (chemins, arcs, cercles, coins arrondis) : seulement des images pré-dessinées et des rectangles. Tout ce qui ne bouge pas du HUD est peint dans le fond (`peindreFond`) ; sprites à la taille exacte d'affichage (`preparerSprites`) ; peu de particules.
- Persos : marche pré-dessinée en 24 images au lancement (`preparerEquipe`), recadrées au plus juste → 1 image par perso et par image du jeu. Obligatoire aussi pour monstres et futures animations.
- 120 Hz : budget 8 ms par image ; si des images sont ratées, le jeu se cale sur 60 (`cale60`), puis seulement baisse la résolution (`changerQualite`, ne redessine rien).
- Compteur (i/s · pire écart · temps de dessin · résolution, rouge sous 58 i/s ou au-delà de 25 ms) sous le titre : réglage **« Afficher les performances »** du menu (`FPS`, activé par défaut, mémorisé dans `rythme-reglages`).

## Créer un personnage
Kiki envoie 2-3 croquis/images + une description. Claude :
1. Écrit une **fiche** dans `persos/fiches.js` : couleurs + pièces (`cheveux`, `coiffe`, `tenue`, `bras`, `jambes`, `arme`, `bouclier`).
2. S'il manque une pièce, l'ajoute dans `persos/pieces.js` : pose de repos, repère de la poupée (pieds en 0,0, ~100 de haut, regarde à gauche), toujours avec `p.forme(...)`. Modèles : `coiffures.raie`, `armes.epee`.
3. **Ne touche jamais** au visage, aux proportions ni au pinceau de `poupee.js` pour un seul perso (tout s'applique à tous). Une option du moule ajoutée doit être sans effet sur les autres (vérifié au pixel près).
4. Vérifie à l'œil : `atelier.html?perso=<id>&anim=repos&fond=sombre&t=0` (`&plat` sans ombrage, `&os` squelette), capture Playwright, comparaison côte à côte, retouche. Vérifier aussi la **marche** (`anim=marche&t=…`) et le **jeu** (`?auto`, chevauchements).
5. Animations : `Poupee.animations` (`attente`, `marche`), angles en degrés par os, positif = sens horaire.
- Personnages **originaux ou « inspirés de »** uniquement (dépôt public). Claude ne redessine pas les emblèmes d'un vrai jeu.
- **Images fournies par Kiki** : il envoie un PNG net, grand, déjà détouré ; Claude le range dans le paquet chiffré (`MDP_FAMILLE=... python3 outils/chiffrer.py images images/persos.bin <dossier> <image.png>...`), ajoute `'images/persos.bin?v=N'` à `Poupee.paquets` (**monter le `?v=` à chaque changement**). Pièce : `p.image(nom, x, y, hauteur, ancreX, ancreY)` avec un dessin de `secours`.
- Ne pas montrer ni intégrer un perso au jeu avant que Kiki ait validé le look dans l'atelier. Monstres : plus tard, même pinceau, squelettes plus simples.

### Leçons (à relire AVANT chaque perso ; le héros a coûté 10 passes, le colosse 6, la princesse des eaux 7)
1. **Le modèle de Kiki fait foi** : l'examiner en grand zone par zone, recopier **tous les codes** qui rendent le perso reconnaissable, avant de penser au style. Chaque pièce repart des images de Kiki, pas des pièces d'un autre perso.
2. **Comparer côte à côte à chaque passe** (`capture.js` puis `comparer.py`), puis agrandir chaque détail retouché : les défauts ne se voient qu'en gros plan.
3. **Plans** (qui passe devant quoi) : à vérifier un par un sur le modèle ; l'ordre est dans `Z` (poupee.js) ; une pièce qui passe entre deux autres = couche à part.
4. Ce qui s'emboîte est **plus fin** que ce qui le recouvre (bras dans la manche, maillot dans le gant) ; une sangle va jusqu'au bord du vêtement.
5. **Le volume vient des ombres, jamais de traits** ni de formes plus claires rapportées. Une pièce = une forme pleine (`p.forme`) ; deux formes de même couleur superposées font un trait : faire **une seule forme**. Exception : cheveux « vivants » en mèches (`meche(points, largeur)`), tatouages fondus par `encre()`.
6. Formes rondes et douces (tête ronde, main en boule, poignet fin, bouts arrondis), bords de tube = arcs légers, bord de manche = droit, pas de creux aux articulations.
7. Vue de trois quarts : le centre du corps (col, visage) est décalé à gauche ; le côté gauche est plus étroit.
8. Kiki dessine sur une capture : convertir ses traits en coordonnées de la poupée (deux points connus : pieds et sommet), pas à l'œil.
9. **Ne pas changer ce qui est validé** : une retouche = cette retouche seule ; annoncer ce qu'on a gardé ou choisi sans demande.
10. À chaque passe : partie simulée à 100 % Critical sans erreur, monter le `?v=` des fichiers `persos/` dans `index.html` et `atelier.html`, pousser sur `main`, envoyer l'image côte à côte (+ gros plan du détail).
- Pièces réutilisables : `coiffures.raie`, `coiffes.bonnet`, `tenues.tunique`, `armes.image`, `boucliers.image`, bras avec gant ; princesse : `coiffures.longs`, `coiffes.diademe`, `tenues.robe`, `armes.rapiere` ; options du moule : `oreilleLoin`, `bras.main`, `taille`, `os`, `corps`, `bras.manche`, `tete`, `yeuxTaille`, `joues`, `nez`, `pupilles`, `bouche`, `couleurBouche`, `taillePieds`.
- Colosse (`colosse`), princesse des eaux (`princesse-eaux`) : looks **validés par Kiki** (« parfait »), ne pas y toucher sans demande. Toutes leurs passes : PERSOS-HISTORIQUE.md.

## Mapper un nouveau morceau (méthode validée le 08/11)
Ne pas mapper seulement la mélodie : **suivre ce que fait l'instrument** (pulsation, texture).
1. Décoder : `mkdir -p /tmp/rythme && ffmpeg -i morceau.mp3 -ac 1 -ar 22050 -f f32le /tmp/rythme/morceau.raw` et copier `outils/analyse/base.py` dans `/tmp/rythme/`.
2. `outils/analyse/grid.py` : tempo + phase (écrit `/tmp/rythme/grid.npy`) ; vérifier la dérive par tranches de 6 s.
3. `outils/analyse/notes.py` : note frappée à chaque demi-temps → mélodie, accompagnement, sections.
4. Écrire la partition par sections avec des codes (modèle : `partition_gff.py`, mode d'emploi en tête du fichier) : pulsation de base, cascades aux moments forts, tenues lâchées sur une vraie frappe, doubles quand deux voix frappent ensemble, difficulté qui monte puis redescend (GFF : 2,1 → 3,1 → 3,0 → 3,7 → 1,5 notes/s). Confort : écart mini d'un demi-temps (hors doubles), rien ne démarre pile à la fin d'une tenue.
5. `outils/analyse/verif.py` : chaque note sur une vraie attaque (GFF : 172/172, max 10,5 ms).
6. Écrire `niveaux/<id>.json`, puis `MDP_FAMILLE=... python3 outils/chiffrer.py morceau <id> morceau.mp3`. 7. Tester, commit, push sur `main`.

## Tester sans écran
- `python3 -m http.server 8765` à la racine (avec une copie chiffrée d'essai si besoin : `cp -r` dans /tmp, `init` avec un mot de passe bidon).
- `?auto` : le jeu joue tout seul (pas de son) ; `?auto&niveau=gff` pour un niveau en ligne.
- Playwright + `/usr/bin/google-chrome` : vrais doigts avec des `PointerEvent` dont les `pointerId` sont des **entiers distincts**.
- Objectif : partie complète simulée = 100 % Critical, aucune erreur dans la console.
