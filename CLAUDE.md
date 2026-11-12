# Jeu de rythme — instructions pour Claude

Jeu de rythme façon Theatrhythm (3DS / Final Bar Line sur Switch), joué au doigt sur téléphone.
Projet familial de Kiki : seuls Kiki (Pixel 7 Pro, Android) et son frère (peut-être iPhone) y jouent.
Jamais vendu. Kiki ne code pas : il dicte ses demandes à la voix. Réponds-lui toujours en français,
simplement, sans jargon. Mémoire commune du projet : `kiki-cerveau/projets/jeu-rythme/CONTEXTE.md`.

## En ligne
- Site : https://kikitmt-bit.github.io/jeu-rythme/ (GitHub Pages, branche `main`, racine). Chaque envoi sur `main` met le site à jour en ~1 min.
- Dépôt **public** : n'y mettre aucun secret.

## Structure
| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (JS pur, aucune dépendance) ; il charge les trois fichiers de `persos/` |
| `niveaux/index.json` | Catalogue des niveaux + paramètres de chiffrement (sel, témoin). Généré par `outils/chiffrer.py`, ne pas éditer à la main |
| `niveaux/<id>.json` | Un niveau : tempo, décalages, partition (`notes`) |
| `musiques/<id>.bin` | Musique du niveau, MP3 128 kbit/s **chiffré** (AES-256-GCM) |
| `persos/poupee.js` | **Le moule des personnages** : squelette, mannequin (tête, visage, bras, jambes), pinceau (ombrage), animations. Commun à tous, c'est lui qui garantit le style unique |
| `persos/pieces.js` | Bibliothèque de pièces : coiffures, coiffes, tenues, armes, boucliers |
| `persos/fiches.js` | Les personnages : une fiche = des pièces + des couleurs |
| `atelier.html` | Atelier des personnages (https://kikitmt-bit.github.io/jeu-rythme/atelier.html) : voir un perso, ses animations, ombrage oui/non, squelette |
| `reserve/solarus-alttp-pack.zip.bin` | Réserve **chiffrée** : tout le pack Solarus ALTTP envoyé par Kiki (sprites, sons, musiques .it, tilesets) pour piocher plus tard |
| `outils/chiffrer.py` | Verrouille musiques (`morceau`), paquets d'images (`images`) et fichiers (`fichier`) avec le mot de passe familial |
| `images/` | Vide depuis le 12/11 (anciens sprites chiffrés retirés ; ils restent dans l'historique Git) |
| `outils/analyse/` | Analyse audio (numpy + scipy) qui a servi à mapper Great Fairy's Fountain |
| `manifest.webmanifest`, `icones/` | Installation sur l'écran d'accueil (plein écran, paysage) |

## Règles absolues
1. **Jamais de musique ni d'image de jeu en clair dans le dépôt** (droits d'auteur : Nintendo, Square Enix…). Seulement des `.bin` chiffrés. `.gitignore` bloque les `.mp3`.
   Les ressources Nintendo, c'est **Kiki qui les fournit** (fichiers envoyés dans la conversation) ; Claude ne les télécharge pas lui-même et ne dessine pas de personnages existants.
2. **Jamais le mot de passe familial dans un fichier**, un commit, un message de commit ou le cerveau. Kiki le redonne dans la conversation quand il faut chiffrer un morceau ; le passer par `MDP_FAMILLE=... python3 outils/chiffrer.py ...`.
   S'il l'a oublié : bouton « Clé de secours » du menu du jeu (visible quand le téléphone est déverrouillé) → il colle la clé → `CLE_FAMILLE=... python3 outils/chiffrer.py ...`. Même règle : jamais écrite nulle part.
3. Le mot de passe ne change pas (sinon il faut rechiffrer toutes les musiques et chacun doit le retaper).

## Format d'un niveau (`niveaux/<id>.json`)
`bpm`, `grille` (s, premier temps de la grille dans le MP3), `avance` (s de silence avant le MP3, 1,5),
`fin` (s dans le MP3 où la partie se termine), `musique`, puis `notes` : une note par ligne
`{"y": "t"|"h"|"s", "t": temps dans le MP3 (s), "l": piste 0-3 (0 = grave, en bas en paysage), "e": fin de tenue, "d": sens du glissé (u, d, l, r, ur, ul, dr, dl), "p": n° de note double}`.

## Gameplay (décisions de Kiki)
- Paysage = style Switch (notes de gauche à droite, cibles à droite, pistes dans la moitié haute, le bas est pour les pouces). **Pas de mode portrait** (décision de Kiki, 08/11) : en portrait, un écran demande de tourner le téléphone et la partie se met en pause.
- On touche **n'importe où** : c'est le moment qui compte, pas l'endroit. 1 ou 2 pouces.
- Surtout une note à la fois ; doubles (barre bleue, comme sur Switch) et tenue d'un pouce + tape de l'autre aux moments forts.
- Le geste « retour » d'Android est ignoré pendant une partie.
- Look des notes repris de Final Bar Line (captures de Kiki, 08/11) : rond rouge à point blanc (taper), vert + bande verte (maintenir), doré avec grande flèche blanche qui sort du rond (glisser), cibles sombres cerclées de blanc, « CRITICAL » arc-en-ciel, « CHAIN » en haut au centre.
- Personnages (12/11) : style « poupée » façon Theatrhythm (grosse tête, yeux ovales, joues roses, petit corps), en **marionnettes articulées dessinées par le code** (plus de planches d'images, plus de ChatGPT). L'ancienne scène (Link pixel art, Ganon, Grande Fée, planche chibi de Link) a été supprimée à la demande de Kiki.
- Pour l'instant : un seul héros (`heros-vert`) en bas de l'écran, qui marche au rythme (un pas par temps). `EQUIPE` et `dessinerEquipe` dans index.html.
- Vision de Kiki pour la suite (capture Final Bar Line, 12/11) : l'équipe de 4 regroupée en bas à droite, une piste par perso (il tape quand on réussit sa note), attaque spéciale au bout de N notes avec un bandeau en triangle à droite (gros plan du perso + nom du coup), monstres à gauche qui meurent et sont remplacés. Une dizaine d'actions par perso (attaque, coup spécial, touché, à genoux, saut de victoire…), les mêmes pour tous.
- Fluidité : 60 i/s visés. Pistes et textes pré-dessinés, horloge lissée, résolution qui baisse toute seule si le téléphone peine.

## Créer un personnage (process du 12/11)
Kiki envoie 2-3 croquis ou images + une description. Claude :
1. Écrit une **fiche** dans `persos/fiches.js` : couleurs (peau, yeux) + pièces choisies (`cheveux`, `coiffe`, `tenue`, `bras`, `jambes`, `arme`, `bouclier`).
2. S'il manque une pièce (nouvelle coiffure, nouvelle arme…), l'ajoute dans `persos/pieces.js`, dessinée en pose de repos dans le repère de la poupée (pieds en 0,0, ~100 de haut, regarde à gauche), toujours avec `p.forme(...)` pour avoir le même ombrage. Regarder `coiffures.raie` et `armes.epee` comme modèles.
3. **Ne touche jamais** au visage, aux proportions ni au pinceau de `poupee.js` pour un seul perso : tout changement là s'applique à tous (c'est voulu).
4. Vérifie à l'œil : `atelier.html?perso=<id>&anim=repos&fond=sombre&t=0` (image figée, `&plat` = sans ombrage, `&os` = squelette), capture Playwright, comparer avec les modèles de Kiki, corriger, recommencer.
5. Les animations sont dans `Poupee.animations` (poupee.js), écrites une fois pour le squelette : `attente`, `marche`. Angles en degrés par os ; positif = dans le sens des aiguilles d'une montre (jambe vers l'avant).
- Personnages **originaux ou « inspirés de »** uniquement dans `fiches.js` (dépôt public). Claude ne redessine pas les emblèmes d'un vrai jeu.
- **Images fournies par Kiki** (emblème, bouclier d'un vrai jeu…) : Kiki envoie le PNG dans la conversation, Claude le détoure et le range dans un paquet chiffré : `MDP_FAMILLE=... python3 outils/chiffrer.py images images/persos.bin <dossier> <image.png>...`, puis ajoute `'images/persos.bin?v=1'` à `Poupee.paquets` (fiches.js). Une pièce l'utilise avec `p.image(nom, x, y, hauteur)` (voir `boucliers.image`) et prévoit un dessin de `secours` tant que le jeu n'est pas déverrouillé. Le jeu et l'atelier chargent le paquet dès qu'ils ont la clé (`Poupee.chargerImages`).
- Réglages communs décidés avec Kiki (12/11) : tête ronde (pas carrée), réduite à 0,9 et relevée pour voir le cou (`OS.tete`), yeux pleins à peine plus sombres en bas, petite bouche neutre, ombres roses et légères sur la peau (jamais jaunes), coiffe posée derrière les cheveux (`Z.coiffeArr`), bouclier au premier plan.
- Monstres : plus tard, même pinceau, squelettes plus simples.

## Mapper un nouveau morceau (méthode validée par Kiki le 08/11)
Ne pas mapper seulement la mélodie (« on ne sent pas la musique », comme Guitar Hero en très facile).
**Suivre ce que fait réellement l'instrument** : sa pulsation et sa texture.
1. Décoder : `mkdir -p /tmp/rythme && ffmpeg -i morceau.mp3 -ac 1 -ar 22050 -f f32le /tmp/rythme/morceau.raw`.
2. `outils/analyse/grid.py` : tempo + phase (grille qui maximise les attaques). Vérifier la stabilité (dérive par tranches de 6 s).
3. `outils/analyse/notes.py` : note frappée à chaque demi-temps → repérer mélodie, accompagnement, sections.
4. Écrire la partition par sections avec des codes (voir `outils/analyse/partition_gff.py`) :
   pulsation de base, cascades aux moments forts, tenues lâchées sur une vraie frappe, doubles quand deux voix frappent ensemble,
   difficulté qui monte puis redescend (GFF : 2,1 → 3,1 → 3,0 → 3,7 → 1,5 notes/s).
   Confort : écart mini d'un demi-temps entre deux notes (hors doubles), rien ne démarre pile à la fin d'une tenue.
5. `outils/analyse/verif.py` : chaque note doit tomber sur une vraie attaque (GFF : 172/172, max 10,5 ms).
6. Écrire `niveaux/<id>.json`, puis `MDP_FAMILLE=... python3 outils/chiffrer.py morceau <id> morceau.mp3`.
7. Tester (ci-dessous), commit, push sur `main`.

## Tester sans écran
- `python3 -m http.server 8765` à la racine (avec une copie chiffrée d'essai si besoin : `cp -r` du dépôt dans /tmp, `init` avec un mot de passe bidon).
- `?auto` dans l'adresse : le jeu joue tout seul (pas de son) ; `?auto&niveau=gff` pour un niveau en ligne.
- `?fps` dans l'adresse : compteur d'images par seconde (et résolution) en bas à gauche.
- Playwright + `/usr/bin/google-chrome` : simuler de vrais doigts avec des `PointerEvent` dont les `pointerId` sont des **entiers distincts**.
- Objectif : partie complète simulée = 100 % Critical, aucune erreur dans la console.
