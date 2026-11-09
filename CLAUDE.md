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
| `index.html` | Tout le jeu (JS pur, un seul fichier, aucune dépendance) |
| `niveaux/index.json` | Catalogue des niveaux + paramètres de chiffrement (sel, témoin). Généré par `outils/chiffrer.py`, ne pas éditer à la main |
| `niveaux/<id>.json` | Un niveau : tempo, décalages, partition (`notes`) |
| `musiques/<id>.bin` | Musique du niveau, MP3 128 kbit/s **chiffré** (AES-256-GCM) |
| `images/zelda.bin` | Sprites de la scène de combat (Link, Ganon, Grande Fée…), **chiffrés** : JSON `{chemin: PNG base64}` |
| `images/equipe.bin` | Planches des persos de l'équipe, **chiffrées** : JSON `{"link.png": PNG base64}`. Chaque planche = 4 × 4 poses calées sur les pieds (attente, course, attaque, touché / à genoux / victoire / content). Réglages dans `PERSOS` et `EQUIPE` (index.html) |
| `reserve/solarus-alttp-pack.zip.bin` | Réserve **chiffrée** : tout le pack Solarus ALTTP envoyé par Kiki (sprites, sons, musiques .it, tilesets) pour piocher plus tard |
| `outils/chiffrer.py` | Verrouille musiques (`morceau`), paquets d'images (`images`) et fichiers (`fichier`) avec le mot de passe familial |
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
- Scène de combat façon Theatrhythm (08/11), avec les sprites ALTTP fournis par Kiki : Link en bas (attaque à chaque note réussie, blessé sur un raté, victoire à la fin), Ganon en face (se dandine en rythme, clignote, barre de vie ; explose puis revient à chaque vague), la Grande Fée sur GFF. Affichée seulement si le mot de passe est entré. Pixel art agrandi sans flou. Poses décrites dans `POSES` (index.html), d'après les `.dat` Solarus du pack.
- Équipe de 4 (10/11) : un perso à droite de chaque piste (`EQUIPE`, piste 0 = bas). Il attaque sur une note réussie de SA piste, est touché sur un raté, fait un coup spécial (élan + grand coup) sur un glissé, pose de victoire / à genoux en fin de partie. Style lisse « chibi » (planches faites par Kiki avec une IA, PNG à fond transparent) : tous les persos dans ce même style. Pour l'instant : Link (tunique recolorée en vert) sur la piste du haut ; l'ancien petit Link pixel art en bas a été retiré, Ganon et la Fée restent.
- Fluidité : 60 i/s visés. Pistes et textes pré-dessinés, horloge lissée, résolution qui baisse toute seule si le téléphone peine.

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
