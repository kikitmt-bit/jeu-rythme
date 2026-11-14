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
| `images/persos.bin` | Images des personnages fournies par Kiki, **chiffrées** : JSON `{nom.png: PNG base64}`. Pour l'instant `epee-heros.png` et `bouclier-heros.png` (belles images détourées envoyées par Kiki le 12/11, réduites à ~700 px de haut). `triforce.png` (emblème du tablier de la princesse, envoyé le 13/11) est prévu dans la fiche mais pas encore dans le paquet : il faut le mot de passe pour l'ajouter (sans lui, losange doré). Pour ajouter une image il faut **redonner toutes les images** à `chiffrer.py images` (le paquet est réécrit en entier) : les récupérer d'abord en déchiffrant le paquet |
| `outils/persos/` | `capture.js` (captures de l'atelier, avec les images chiffrées si on donne `MDP=…`) et `comparer.py` (modèle de Kiki et poupée côte à côte) |
| `outils/analyse/` | Analyse audio (numpy + scipy) qui a servi à mapper Great Fairy's Fountain |
| `polices/` | Polices du HUD (licence OFL, venues de fontsource) : Cinzel 700/900 (score, chaîne, CRITICAL, TIME), Libre Baskerville 700 (titre du morceau) |
| `manifest.webmanifest`, `icones/` | Installation sur l'écran d'accueil (plein écran, paysage) |

## Règles absolues
1. **Jamais de musique ni d'image de jeu en clair dans le dépôt** (droits d'auteur : Nintendo, Square Enix…). Seulement des `.bin` chiffrés. `.gitignore` bloque les `.mp3`.
   Les ressources Nintendo, c'est **Kiki qui les fournit** (fichiers envoyés dans la conversation) ; Claude ne les télécharge pas lui-même et ne dessine pas de personnages existants.
2. **Jamais le mot de passe familial dans un fichier**, un commit, un message de commit ou le cerveau. Kiki le redonne dans la conversation quand il faut chiffrer un morceau ; le passer par `MDP_FAMILLE=... python3 outils/chiffrer.py ...`.
   S'il l'a oublié : bouton « Clé de secours » du menu du jeu (visible quand le téléphone est déverrouillé) → il colle la clé → `CLE_FAMILLE=... python3 outils/chiffrer.py ...`. Même règle : jamais écrite nulle part.
3. Le mot de passe change rarement : `MDP_FAMILLE=ancien MDP_NOUVEAU=nouveau python3 outils/chiffrer.py changer` (ou `CLE_FAMILLE=...` pour l'ancien) rechiffre tous les `.bin` d'un coup ; chacun doit ensuite retaper le nouveau mot de passe dans le jeu.

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
- Pour l'instant : trois persos en bas de l'écran, qui marchent au rythme (un pas par temps) : le héros (`heros-vert`, terminé le 12/11 après 10 passes avec Kiki ; son épée et son bouclier sont des images de Kiki), la princesse (`princesse`, créée le 13/11 en carte blanche d'après 3 images de Kiki) et le colosse de roc (`colosse`, 14/11, d'après 3 images de Kiki). `EQUIPE` et `dessinerEquipe` dans index.html ; à 3 et plus, le groupe recule vers la gauche pour ne pas passer sous le panneau du capitaine.
- Vision de Kiki pour la suite (capture Final Bar Line, 12/11) : l'équipe de 4 regroupée en bas à droite, une piste par perso (il tape quand on réussit sa note), attaque spéciale au bout de N notes avec un bandeau en triangle à droite (gros plan du perso + nom du coup), monstres à gauche qui meurent et sont remplacés. Une dizaine d'actions par perso (attaque, coup spécial, touché, à genoux, saut de victoire…), les mêmes pour tous.
- **Interface de la partie (HUD) façon Final Bar Line** (13/11, d'après 4 captures de Kiki ; le menu, lui, n'a pas changé) :
  pistes = fins traits blancs, cibles = gros anneaux blancs à droite (x = W − 0,298 H, pistes de 0,2 H à 0,554 H) ;
  en haut à gauche, bandeau du titre (jaquette aux couleurs du morceau, logo de difficulté dont la couleur dépend des notes/s :
  vert Facile < 1,5, bleu Normal < 2,5, orange Difficile < 3,5, rouge Expert ; nom du morceau, jeu, nombre de notes) — **toucher le bandeau = pause** ;
  en haut au centre « 196 CHAIN » (chiffres irisés penchés) ; en haut à droite le score (chiffres chromés, il défile) ;
  en bas la barre TIME ; en bas à droite le panneau du capitaine (= `EQUIPE[0]`, sa tête dans un rond, PV, jauge du coup spécial, coffres).
  Effet Critical = cercle magique **de la couleur de la note** (rouge, vert, doré) avec croches qui tournent + petits triangles, texte à droite de la cible.
  **Coffres sur les notes** et **coup spécial** (triangle avec le gros plan du capitaine + nom du coup, `coup:` dans la fiche) : codés le 13/11 puis **mis de côté par Kiki le 14/11** (`COFFRES_SUR_NOTES = false`, `COUP_SPECIAL = false` dans index.html, code gardé). Les coffres viendront d'un autre système ; le compteur du panneau reste à 0. La jauge se remplit (Critical 1, Great 0,6, Good 0,3) et reste pleine.
  Code : section « Look façon Final Bar Line » (sprites, `stylise` = textes stylés pré-dessinés) et section « HUD » (`preparerHud`, `hud`, `dessinerCoup`) de index.html. `TETE` = position de la tête dans le repère des poupées (portrait et gros plan).
- Fluidité : **standard validé par Kiki le 14/11 : 120 i/s stables sur son Pixel 7 Pro, à garder TOUJOURS** (« très agréable à jouer »). Toute nouveauté (persos, monstres, effets, décors) doit le respecter : mesurer avant/après et ne rien livrer qui coûte plus cher sans le compenser. Minimum absolu : 60 i/s réguliers. Pistes et textes pré-dessinés, horloge lissée, résolution qui baisse toute seule si le téléphone peine.
  Phase de test : compteur **toujours affiché** sous le titre (`FPS = true`) : i/s · pire écart entre deux images · temps de dessin moyen · résolution ; il passe en rouge sous 58 i/s ou au-delà de 25 ms.
  Règles apprises le 14/11 (la 1re version du HUD saccadait sur le Pixel) : rien de lourd ne se prépare pendant la partie (la baisse de résolution `changerQualite` ne redessine rien) ;
  tout ce qui ne bouge pas du HUD est peint dans le fond (`peindreFond`) ; les images des notes, cibles et effets sont faites à la taille exacte d'affichage (`preparerSprites`) ;
  peu de particules (Critical = 1 cercle avec ses croches en une seule image + 5 triangles + 3 points).
  **Personnages** (14/11) : la marche de chaque perso est pré-dessinée en 24 images au lancement (`preparerEquipe`) → 1 seule image par perso et par image du jeu (avant : ~22 pièces chacun). Obligatoire pour 4 persos + monstres : faire pareil pour les monstres et les futures animations.
  **Pendant la partie, aucun tracé** (chemins, arcs, cercles, coins arrondis) : seulement des images pré-dessinées et des rectangles (barres = image pleine recadrée).
  **Écrans 120 Hz** (Pixel 7 Pro) : budget 8 ms par image. Si le téléphone rate des images à 120, le jeu se cale sur 60 bien réguliers (`cale60`, affiché « calé à 60 » sur le compteur), puis seulement ensuite baisse la résolution.
  Coût mesuré (mesure.js) : 6,5 ms avant le HUD, 7,4 avec le 1er HUD, 3,7 ms après tout ça.
  Mesurer avant/après : `outils/perf/mesure.js` (coût d'une image, rendu logiciel) en comparant à l'ancienne version (`git worktree add`), objectif ≤ l'ancienne.

## Créer un personnage (process du 12/11)
Kiki envoie 2-3 croquis ou images + une description. Claude :
1. Écrit une **fiche** dans `persos/fiches.js` : couleurs (peau, yeux) + pièces choisies (`cheveux`, `coiffe`, `tenue`, `bras`, `jambes`, `arme`, `bouclier`).
2. S'il manque une pièce (nouvelle coiffure, nouvelle arme…), l'ajoute dans `persos/pieces.js`, dessinée en pose de repos dans le repère de la poupée (pieds en 0,0, ~100 de haut, regarde à gauche), toujours avec `p.forme(...)` pour avoir le même ombrage. Regarder `coiffures.raie` et `armes.epee` comme modèles.
3. **Ne touche jamais** au visage, aux proportions ni au pinceau de `poupee.js` pour un seul perso : tout changement là s'applique à tous (c'est voulu).
4. Vérifie à l'œil : `atelier.html?perso=<id>&anim=repos&fond=sombre&t=0` (image figée, `&plat` = sans ombrage, `&os` = squelette), capture Playwright, comparer avec les modèles de Kiki, corriger, recommencer.
5. Les animations sont dans `Poupee.animations` (poupee.js), écrites une fois pour le squelette : `attente`, `marche`. Angles en degrés par os ; positif = dans le sens des aiguilles d'une montre (jambe vers l'avant).
- Personnages **originaux ou « inspirés de »** uniquement dans `fiches.js` (dépôt public). Claude ne redessine pas les emblèmes d'un vrai jeu.
- **Images fournies par Kiki** (emblème, bouclier d'un vrai jeu…) : Kiki envoie le PNG dans la conversation, Claude le détoure et le range dans un paquet chiffré : `MDP_FAMILLE=... python3 outils/chiffrer.py images images/persos.bin <dossier> <image.png>...`, puis ajoute `'images/persos.bin?v=1'` à `Poupee.paquets` (fiches.js) ; **monter le `?v=` à chaque fois que le paquet change** (sinon le téléphone garde l'ancien). Une pièce l'utilise avec `p.image(nom, x, y, hauteur, ancreX, ancreY)` (voir `armes.image` et `boucliers.image`) et prévoit un dessin de `secours` tant que le jeu n'est pas déverrouillé. Le jeu et l'atelier chargent le paquet dès qu'ils ont la clé (`Poupee.chargerImages`).
- Réglages communs décidés avec Kiki (12/11) : tête ronde (pas carrée), réduite à 0,9 (`OS.tete`), **cou caché** dans le col (la tunique remonte, col en V ouvert sur le vêtement blanc de dessous), deux yeux **de même taille**, ovales pleins (pas trop allongés), bien écartés, à peine plus sombres en bas ; nez = tout petit ovale couché presque noir ; bouche = petit toit rose très plat (modèles : gros plans Theatrhythm envoyés par Kiki), ombres roses et légères sur la peau (jamais jaunes), coiffe posée derrière les cheveux (`Z.coiffeArr`), bouclier et arme au premier plan (la main qui tient l'arme est une couche à part, `Z.mainD`, peinte par-dessus ; elle tient le **milieu du manche**), boucles = simples cadres dorés plus larges que hauts, **les mêmes** sur la ceinture et la bandoulière, qui dépassent à peine ; bandoulière de la même largeur que la ceinture, peinte **par-dessus l'épaule** (couche à part, après le haut du bras), et qui va jusqu'au bord du vêtement ; col en V décalé à gauche (vue de trois quarts : pan gauche très fin, pan droit large), pans bas et près du cou (ils ne dépassent pas de chaque côté de la tête) ; **pas de traits ni de mèches rapportées pour donner du volume** (bonnet, cheveux) : le volume vient seulement des ombres ; bonnet peu bombé, qui suit la forme de la tête et redescend jusqu'à l'épaule (le bas passe derrière le bouclier) ; oreille pointue courte, bord du haut presque horizontal, bout légèrement arrondi ; la main est une **boule** ; le gant est **une seule forme** (sans revers ni trait de séparation) qui couvre la moitié de la boule, se resserre nettement au poignet puis s'évase vers le coude (sinon on dirait un moignon), ses deux bords sont de légers arcs ; on voit le vêtement blanc de dessous entre la manche et le gant, avec des bords bien droits (pas de creux au coude), et toujours **plus fin que le gant** (c'est lui qui sort du gant, avec une marge en haut et en bas) ; la manche courte se termine par un bord droit ; le V du col est court (il s'arrête bien avant la bandoulière).
- Monstres : plus tard, même pinceau, squelettes plus simples.

## Leçons du premier personnage (à relire AVANT chaque nouveau perso)
Le héros vert a demandé une dizaine de passes avec Kiki le 12/11. Kiki a le souci du détail : le perso doit être simple, mais chaque élément juste et cohérent. Pour y arriver plus vite :
1. **Le modèle de Kiki fait foi.** Avant de dessiner, regarder son image en grand, zone par zone (tête, col, bras, mains, ceinture, arme), et noter ce qu'on voit vraiment. Au moindre doute, y revenir plutôt que d'inventer.
2. **Comparer côte à côte à chaque passe** : `outils/persos/capture.js` (capture de l'atelier) puis `outils/persos/comparer.py` (modèle à gauche, poupée à droite). Puis **recadrer et agrandir chaque détail** : les défauts que Kiki relève ne se voient qu'en gros plan.
3. **Les plans (qui passe devant quoi)** se vérifient un par un sur le modèle : arme et bouclier au premier plan, main devant l'arme, lanière par-dessus l'épaule, coiffe derrière les cheveux, bas de la coiffe derrière le bouclier. L'ordre est dans `Z` (poupee.js) ; une pièce qui doit passer entre deux autres devient une couche à part.
4. **Ce qui s'emboîte doit être plus fin que ce qui le recouvre** (le bras sort de la manche, le maillot sort du gant), et une sangle va jusqu'au bord du vêtement (pas de pixels de tissu qui dépassent).
5. **Le volume vient des ombres, jamais de traits** ni de formes rapportées plus claires. Une pièce = une forme pleine peinte avec `p.forme`. Deux formes de la même couleur posées l'une sur l'autre font un trait de séparation : faire **une seule forme**.
   **Exception, les cheveux** (13/11) : Kiki veut des cheveux « vivants » où l'on voit les mèches, comme les poupées Theatrhythm. On les construit avec `meche(points, largeur)` (pieces.js) : chaque mèche est une forme fine et ondulée qui finit en pointe, et ce sont les mèches posées les unes sur les autres (avec leurs ombres) qui dessinent la chevelure. Toujours aucun trait. Une racine visible doit être arrondie (`ronde`) ou cachée sous une autre mèche. Les grosses mèches posées sur le dessus de la tête, elles, ne doivent pas se voir comme des pièces posées : les fondre dans le dessus (une seule forme). Les cheveux de derrière sont plus sombres que ceux de devant, pour bien les distinguer.
   Pour un nouveau perso, **chaque pièce repart des images de Kiki**, pas des pièces du héros (seul le moule de `poupee.js` est commun) : la première coiffure de la princesse, copiée sur celle du héros, a été refusée.
6. **Formes** : rondes et douces (tête ronde, main en boule, poignet fin, bouts arrondis), bords d'un tube = arcs très légers, bord d'une manche = ligne droite, boucles = simples cadres. Pas de pointe qui pique, pas de creux aux articulations.
7. **Vue de trois quarts** : ce qui est au centre du corps est décalé vers la gauche (col, visage) ; le côté gauche est plus étroit que le droit.
8. **Quand Kiki dessine sur une capture** (traits rouges ou jaunes), convertir ses traits en coordonnées de la poupée (repérer deux points connus sur la capture : pieds et sommet) plutôt que d'estimer à l'œil.
9. **Images fournies par Kiki** : demander une image nette, grande et déjà détourée (fond transparent). Vérifier l'ancrage (où la main tient l'arme) sur un gros plan.
10. **Ne pas changer ce qui est validé** : une retouche demandée = cette retouche et rien d'autre. Annoncer ce qu'on a gardé ou choisi quand ce n'était pas demandé.
11. À chaque passe : partie simulée (100 % Critical, aucune erreur), monter le `?v=` des fichiers `persos/` dans `index.html` et `atelier.html`, pousser sur `main`, envoyer à Kiki l'image côte à côte (et le gros plan du détail retouché).
- Réutiliser pour les prochains persos : `coiffures.raie`, `coiffes.bonnet`, `tenues.tunique` (col, ceinture, bandoulière, boucles), `armes.image`, `boucliers.image`, bras avec gant.
  Pièces de la princesse (13/11) : `coiffures.longs` (cheveux « vivants », refaits 3 fois le 13/11, le modèle final vient d'une poupée Theatrhythm envoyée par Kiki : dessus avec raie au milieu et deux grosses mèches qui s'envolent aux tempes, fondues dans le dessus (une seule forme + ombre très douce `portee` sous chacune : Kiki ne veut aucun trait visible), rien sur le front (petites mèches refusées), mèches ondulées devant les oreilles qui partent vers l'extérieur au bout, cheveux longs derrière plus sombres et moins saturés (`derriere`) en plusieurs mèches ondulées jusqu'au milieu du dos), `coiffes.diademe` (bandeau doré sous les cheveux + bijou en goutte), `tenues.robe` (corsage, jupe jusqu'au sol qui cache les jambes, ceinture à médaillon rond, tablier pointu à bord doré, gouttes dorées, épaulières dorées), `armes.rapiere`.
- Options du moule ajoutées le 13/11 (sans effet sur le héros, vérifié au pixel près) : `oreilleLoin: true` = on voit aussi le bout de l'oreille pointue du côté éloigné (en miroir, plus petite, derrière la tête ; demandé par Kiki pour la princesse, le héros ne l'a pas) ; `bras.main` = couleur de la main ; si elle est égale à `bras.gant`, le gant couvre toute la main (gants de princesse). La peau nue des bras a des ombres légères (comme le visage), sinon elles tirent vers l'orange.
- **Colosse de roc** (`colosse`, 14/11, carte blanche d'après 3 images de Kiki : créature massive brun orangé au dos couvert de rochers) : premier perso avec une **carrure à part**, grâce à des options du moule (toutes sans effet sur le héros et la princesse, vérifié au pixel près) :
  `taille` (1,1 = 10 % plus grand ; `fabrique` peint d'autant plus fin, `dessine` agrandit), `os` (pivots déplacés : épaules larges, jambes courtes ; `Poupee.osDe(fiche)`, la poupée fabriquée garde son squelette dans `poupee.os`),
  `corps` (`bras`, `main`, `jambes` = épaisseur ×, `pieds: 'nus'`), `bras.manche: null` (bras nus), `bouche: 'large'` + `levres` (large sourire fermé), `joues` (couleur des joues).
  Pièces : `tenues.roc` (corps à gros ventre sans cou, rochers du dos `rocher()` = cailloux à côtés droits et coins adoucis, derrière le corps et au-dessus des épaules, pagne blanc, tatouages en spirale `spirale()`), `coiffures.touffe` (crête de mèches claires ; `arcade: true` = arcade sourcilière lourde, une forme couleur peau dont seule l'ombre se voit ; `favoris` existe mais ressemblait à des défenses, pas utilisé). Pas d'arme pour l'instant (il se bat aux poings).
- Coût des persos en partie (14/11) : les 24 images de marche sont **recadrées au plus juste** (même cadre pour les 24) : 3 persos coûtent moins cher que 2 avant (3,8 ms par image contre 4,0, mesure.js).
- Avant de livrer un perso : vérifier aussi la **marche** (captures `anim=marche&t=…`) et le **jeu** (`?auto`), où les persos se suivent et peuvent se chevaucher (arme de l'un sur le bouclier de l'autre). Tout ce qui est dans `poupee.js` (tête, visage, oreille, bras, main, jambes) est déjà validé et commun à tous.

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
- Compteur d'images par seconde affiché en permanence pendant la phase de test (sous le titre).
- Playwright + `/usr/bin/google-chrome` : simuler de vrais doigts avec des `PointerEvent` dont les `pointerId` sont des **entiers distincts**.
- Objectif : partie complète simulée = 100 % Critical, aucune erreur dans la console.
