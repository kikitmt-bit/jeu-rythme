# Atelier de partitions (chantier 1.1, 16-17/11)

D'un MP3 à un niveau en **3 vraies difficultés** (Facile, Normal, Expert : trois partitions différentes, pas la même plus ou moins vite), vérifié automatiquement, avec une **note de difficulté de 1 à 10** par mode.
Remplace `outils/analyse/` (gardé pour l'historique : c'est là qu'est le script jetable de la 1re partition de Great Fairy's Fountain).

Besoins : `ffmpeg`, `python3` avec `numpy` et `scipy` (`pip install scipy` si absent).
Le MP3 et l'analyse restent **hors du dépôt** : dossier de travail `/tmp/rythme/<id>/` (ou `$RYTHME_TRAVAIL`).

## Ajouter un morceau (une session)
Kiki envoie le MP3 dans la conversation + le mot de passe familial (jamais écrit nulle part).

```bash
# 1. Écouter : tempo, grille et sa stabilité, frappes par famille, sections. Crée la fiche outils/partitions/morceaux/<id>.json
python3 outils/partitions/atelier.py analyser <id> /chemin/du/morceau.mp3
# 2. Remplir « titre » et « jeu » dans la fiche, puis écrire et vérifier les 3 partitions (essai, rien dans le dépôt)
python3 outils/partitions/atelier.py proposer <id>
# 3. Si le bilan est bon : écrire niveaux/<id>.json
python3 outils/partitions/atelier.py proposer <id> --ecrire
# 4. Chiffrer la musique (met aussi à jour niveaux/index.json : nombres de notes et notes de difficulté)
MDP_FAMILLE=... python3 outils/chiffrer.py morceau <id> /chemin/du/morceau.mp3
# 5. Parties simulées : 100 % Critical, aucune erreur, dans les 3 difficultés
python3 -m http.server 8765 &
node outils/tests/partie-auto.js 8765 <id> facile ; node outils/tests/partie-auto.js 8765 <id> normal ; node outils/tests/partie-auto.js 8765 <id> expert
```
Puis monter le `?v=` de ce qui a changé dans `index.html` (rien si seuls `niveaux/` et `musiques/` changent : leur version est dans `index.json`), commit, push sur `main`.
Durée : ~10 s d'analyse et ~5 s d'écriture par morceau ; les 4 morceaux du 17/11 ont pris 30 s en tout.

À lire dans le bilan de `analyser` : **tempo** (entre 85 et 175 ; sinon forcer `bpm` ou `bpm_entre` dans `reglages`), **grille stable ou qui bouge** (suivie toute seule),
**part des frappes fortes sur la grille** (sous ~50 % = rythme très libre, partition à écouter de près), **division** (demi-temps, triolets, quarts, sixièmes), **sections**.
Dans le bilan de `proposer` : note, nombre de notes, densité moyenne et pic, tenues, glissés, doubles, notes tapées pendant une tenue, densité par section, sens des glissés, calage sur les frappes, et la liste des soucis (doit être vide).

## Retoucher (fiche `morceaux/<id>.json`)
- `reglages` : `bpm`, `bpm_entre` ([85, 175]), `premier_temps` (s), `mesure` (3 ou 4), `division` (2, 3, 4, 6), `debut`, `fin` (s). Après un changement : relancer `analyser`.
- `sections` : `{"B2": {"plus": 0.2}}` rend la section B2 plus chargée dans les 3 modes (`"arc": 0.8` impose son niveau, de 0 calme à 1 sommet) ; `{"B2": {"expert": 0.8}}` = 80 % des notes visées en Expert seulement.
- `graine` : changer le nombre donne d'autres choix (glissés, doubles) à densité égale.
- `manuel` : `[{"dif": "normal", "de": 12.0, "a": 15.5, "notes": [...]}]` remplace tout ce que l'outil a écrit entre deux instants (notes au format du jeu ; `"dif": "toutes"` possible).
- `en_plus` : partitions gardées telles quelles à côté des 3 (ex. `ancienne` de Great Fairy's Fountain, pour comparer ; visible seulement sur la page de test).
- `marques` : rangées par `atelier.py marques` (voir plus bas). Une marque « trop dur » (`"quoi": "trop-dur"`) allège tout seul les 3 s avant et 1 s après dans sa difficulté (pas de cascade, de figure ni de tape pendant une tenue). `"ignore": true` la désactive ; `"traite": true` = vue par Claude.
- Pour voir les frappes entendues dans un passage : `python3 outils/partitions/atelier.py frappes <id> 12.0 15.5`.
- Pour vérifier un niveau retouché à la main : `python3 outils/partitions/atelier.py verifier <id>`.

## Page de test (pour Kiki)
`https://kikitmt-bit.github.io/jeu-rythme/index.html?test` (ou `atelier-partitions.html`). Le jeu normal, plus :
- pendant la partie, deux boutons en haut : **« Trop dur ici »** et **« On ne sent pas la musique »** (l'instant exact est gardé, avec le morceau et la difficulté) ;
- au menu : **Regarder** (le jeu joue tout seul, avec la musique : pour écouter si les notes tombent juste), la difficulté **Ancienne** (partition d'avant l'atelier, pour comparer, quand le niveau l'a gardée), **Copier les marques**, **Effacer**.
Kiki colle le texte copié dans la conversation ; Claude le range : `python3 outils/partitions/atelier.py marques <id> '<texte>'`, puis regarde chaque marque (`frappes`, densité de la section), retouche la fiche et relance `proposer --ecrire`.
Les parties du mode test comptent pour les records (sauf « Regarder » et « Ancienne »).

## Comment l'outil écrit (méthode validée par Kiki le 08/11, généralisée)
Fichiers : `audio.py` (écoute), `grille.py` (tempo), `sections.py`, `composer.py` (écriture), `confort.py` (règles et vérification), `difficulte.py` (note de 1 à 10), `atelier.py` (commandes).
1. **Écoute** (`audio.py`) : spectrogramme, séparation notes tenues / coups secs, puis frappes de 4 familles : **basse** (30–180 Hz), **caisse** (coups secs), **accompagnement** (notes 180–700 Hz), **mélodie** (notes 700–4500 Hz), avec la hauteur de la note jouée.
   Calage : `RETARD = 22 ms`, mesuré sur la partition de GFF calée à la main et validée par Kiki (172 notes sur 172 entre 15 et 30 ms) : tous les morceaux ont ainsi le même calage, et le réglage « Décalage audio » du téléphone vaut pour tous.
2. **Tempo et grille** (`grille.py`) : autocorrélation puis peigne ; tempo ramené entre 85 et 175 ; dérive suivie tranche par tranche (4 s) de proche en proche ; division choisie selon la part des frappes qui tombent sur la grille (moins le hasard) ; mesure 3 ou 4 temps ; premier temps.
3. **Sections** (`sections.py`) : règle de 4 mesures calée là où la musique change le plus, coupe au plus tous les 8 ; lettres (A, B, A…) par ressemblance des notes ; intensité 0–1 ; fin de jeu = là où la musique s'éteint (12 dB sous son volume habituel) ; **énergie du morceau** (force des frappes par seconde : GFF 10,8, Boss Battle 17,2, Zelda's Theme 6,8).
4. **Écriture** (`composer.py`), comme la partition de GFF faite à la main :
   - **cellules** : dans chaque mesure, les **accents** = frappes les plus fortes (préférence pour les positions où la musique frappe d'habitude), ~1,45 par seconde (Facile, et seulement sur les temps) ou ~1,6 (Normal, Expert) ; une cellule va d'un accent au suivant ;
   - chaque cellule se joue à un **niveau** : 0 = l'accent, 1 = + la pulsation (les frappes régulières entre deux accents), 2 = **cascade** (tout ce que joue la musique) ; la densité visée décide du mélange, les cascades vont où la musique est la plus chargée ;
   - **densité visée** qui monte puis redescend : moitié intensité de la musique, moitié une cloche (sommet aux trois quarts), une reprise un peu plus corsée, la fin qui redescend ; multipliée par l'**allure** du morceau (énergie / 10,8, puissance 0,6, entre 0,7 et 1,3) ;
   - **phrases** (3 à 6,5 s) avec une **formule** par section (début : simple, glissé, double, ou les deux en alternance ; fin : tenue lâchée sur l'accent suivant, tenue puis pulsation, ou glissé), qui change d'une section à l'autre et va du calme à l'intense ;
   - **tenues** lâchées sur une vraie frappe (l'accent suivant) ; tenue aussi là où la musique tient vraiment une note ; dernière note tenue dans le fondu si la musique résonne ;
   - **doubles** quand le grave et le chant frappent ensemble sur un temps fort ; Expert : doubles en plus et un double glissé par section intense ;
   - **glissés** dans le sens où va la mélodie (monte = haut, descend = bas, reste = côté), aux débuts de phrase et aux grands sauts ; le côté alterne, jamais 3 fois le même geste ; Facile : seulement haut, bas, gauche, droite ;
   - **pistes** : le chant selon sa hauteur parmi les notes des 8 s autour (aigu en haut ; Normal et Expert : pistes 1–3), la pulsation juste en dessous, les cascades en escalier ;
   - **pendant une tenue** : rien en Facile ; en Normal une tape de l'autre pouce vers le milieu, aux moments forts ; en Expert la pulsation continue ;
   - **réparation** : tant que `confort.py` trouve un souci, la figure fautive redevient une note simple, sinon la note la moins importante est retirée (jamais l'accent du chant si on peut l'éviter).
5. **Vérification** (`confort.py`, règles par difficulté dans `REGLES`) : chaque note et chaque fin de tenue sur une vraie frappe (à 50 ms) ; écart mini entre deux notes (Facile 0,36 s, Normal 0,17, Expert 0,12) ; repos après une tenue et après un glissé ; pas de glissé juste après une tenue ; rien pile à la fin d'une tenue ; jamais trois doigts ; pas deux notes trop rapides du même pouce (joueur à deux pouces simulé) ; les deux notes d'une double demandent le même geste ; durée des tenues ; densité moyenne et pic sur 4 s dans la fourchette de la difficulté.
6. **Note de difficulté** (`difficulte.py`) : notes par seconde (moyenne et pic), part des notes rapides (moins de 0,2 s), technique (glissés, diagonales, doubles, tapes pendant une tenue) ; toujours croissante de Facile à Expert. Repère : GFF Normal = 5.

## Résultats du 17/11
| Morceau | Facile | Normal | Expert |
|---|---|---|---|
| Great Fairy's Fountain (156 bpm) | 2 · 88 notes | 5 · 204 | 8 · 303 |
| Zelda's Theme (110 bpm, 3 temps, tempo qui bouge) | 2 · 70 | 4 · 151 | 5 · 224 |
| Title Theme (90 bpm) | 2 · 113 | 4 · 251 | 6 · 368 |
| Boss Battle (120 bpm, triolets) | 2 · 119 | 4 · 206 | 7 · 359 |
| Hyrule Field Main Theme (144 bpm) | 2 · 140 | 4 · 307 | 6 · 492 |
(note de 1 à 10 · combo maximal). Ancienne partition de GFF, faite à la main : 185 (sert de référence au Normal).

## Morceau d'essai sans musique protégée
`essais/rendre_foret.js` enregistre la démo « Forêt d'émeraude » (composition originale, synthé du jeu) en WAV : pour essayer l'outil sans MP3.
`node outils/partitions/essais/rendre_foret.js 8765 /tmp/rythme/foret.wav` (serveur lancé à la racine).

## Pistes d'amélioration (non faites)
- Le Facile vaut 2 partout : la musique décide peu (il reste sous 1,5 note/s par décision de Kiki). Si Kiki veut des Faciles plus variés (3 ou 4 sur un morceau rapide), relever `REGLES['facile']` et `VISEE['facile']`.
- Rythme très libre (moins de 50 % des frappes sur la grille) : l'outil le détecte mais n'a pas encore été essayé sur un vrai morceau sans pulsation.
- Les marques « on ne sent pas la musique » ne sont pas encore traitées automatiquement : Claude regarde le passage (`frappes`) et retouche à la main.
