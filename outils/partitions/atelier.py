#!/usr/bin/env python3
"""L'atelier de partitions : d'un MP3 à un niveau en 3 difficultés (Facile, Normal, Expert).

Mode d'emploi complet : outils/partitions/LISEZMOI.md. En bref :

  python3 outils/partitions/atelier.py analyser <id> <morceau.mp3>
      Écoute le morceau : tempo, grille (et sa stabilité), frappes par famille (basse, caisse, accompagnement,
      mélodie), sections. Crée la fiche outils/partitions/morceaux/<id>.json si elle n'existe pas.

  python3 outils/partitions/atelier.py proposer <id> [--ecrire]
      Écrit les 3 partitions, les vérifie (vraies frappes, confort des pouces, densité) et affiche le bilan.
      Avec --ecrire : écrit niveaux/<id>.json (sinon rien n'est touché dans le dépôt).

  python3 outils/partitions/atelier.py verifier <id>
      Vérifie le niveau niveaux/<id>.json tel qu'il est (même retouché à la main).

  python3 outils/partitions/atelier.py marques <id> '<texte copié depuis la page de test du jeu>'
      Range les marques de Kiki (« trop dur ici », « on ne sent pas la musique ») dans la fiche du morceau.

  python3 outils/partitions/atelier.py frappes <id> <début> <fin>
      Affiche les frappes entendues entre deux instants (pour retoucher un passage à la main).

Le MP3 et l'analyse restent dans le dossier de travail (/tmp/rythme/<id>/, ou $RYTHME_TRAVAIL) : jamais dans le dépôt.
"""
import json
import os
import pickle
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(os.path.dirname(ICI))
sys.path.insert(0, ICI)
TRAVAIL = os.environ.get('RYTHME_TRAVAIL', '/tmp/rythme')
NOMS = {'facile': 'Facile', 'normal': 'Normal', 'expert': 'Expert'}


def chemin_fiche(ident):
    return os.path.join(ICI, 'morceaux', f'{ident}.json')


def lire_fiche(ident):
    c = chemin_fiche(ident)
    return json.load(open(c, encoding='utf-8')) if os.path.exists(c) else {}


def ecrire_fiche(ident, fiche):
    os.makedirs(os.path.dirname(chemin_fiche(ident)), exist_ok=True)
    with open(chemin_fiche(ident), 'w', encoding='utf-8') as f:
        json.dump(fiche, f, ensure_ascii=False, indent=2)
        f.write('\n')


def chemin_analyse(ident):
    return os.path.join(TRAVAIL, ident, 'analyse.pkl')


def analyser(ident, fichier):
    import audio, grille, sections
    fiche = lire_fiche(ident)
    reg = fiche.get('reglages', {})
    e = audio.Ecoute(fichier)
    g = grille.Grille(e, bpm_entre=reg.get('bpm_entre'), bpm=reg.get('bpm'), premier_temps=reg.get('premier_temps'),
                      mesure=reg.get('mesure'), div=reg.get('division'))
    s = sections.Sections(e, g, debut=reg.get('debut'), fin=reg.get('fin'))
    e.S = None                                   # (le spectrogramme brut ne sert plus : on allège le fichier)
    os.makedirs(os.path.dirname(chemin_analyse(ident)), exist_ok=True)
    pickle.dump((e, g, s), open(chemin_analyse(ident), 'wb'))
    if not fiche:
        fiche = {'id': ident, 'titre': ident, 'jeu': '', 'graine': 1, 'reglages': {}, 'sections': {}, 'marques': [], 'manuel': []}
        ecrire_fiche(ident, fiche)
        print(f'fiche créée : {os.path.relpath(chemin_fiche(ident), RACINE)} (titre et jeu à remplir)')
    bilan_analyse(e, g, s)
    return e, g, s


def charger(ident):
    c = chemin_analyse(ident)
    if not os.path.exists(c):
        sys.exit(f"Pas d'analyse pour « {ident} » : lance d'abord  atelier.py analyser {ident} <morceau.mp3>")
    return pickle.load(open(c, 'rb'))


def bilan_analyse(e, g, s):
    r = g.resume()
    print(f"\nDurée {e.duree:.1f} s · {len(e.frappes)} frappes entendues")
    print(f"Tempo {r['bpm']} · premier temps à {r['premier_temps']} s · mesure à {r['mesure']} temps · "
          f"division {({2: 'demi-temps', 3: 'triolets', 4: 'quarts de temps', 6: 'sixièmes de temps'})[r['division']]}")
    etat = 'stable' if r['stable'] else 'FLOTTANT (la grille suit la musique)'
    print(f"Grille {etat} : écart maximal {r['ecart_max_ms']} ms sur {r['tranches_nettes']}/{r['tranches']} tranches nettes")
    for ligne in g.journal:
        print('  · ' + ligne)
    # part des frappes qui tombent sur la grille
    import numpy as np
    tf = np.array([f['t'] for f in e.frappes if f['force'] >= .2])
    if len(tf):
        d = np.abs(tf[:, None] - g.cases[None, :]).min(1)
        print(f"Frappes fortes sur la grille (à 35 ms près) : {100 * (d < .035).mean():.0f} %")
    print(f"Musique de {s.debut:.2f} s à {s.fin_son:.1f} s · fin de partie proposée {s.fin:.1f} s · énergie du morceau {s.energie:.1f}")
    print('Sections :')
    for x in s.liste:
        fam = ' '.join(f"{c[:3]} {s.familles[c][x['m0']:x['m1']].mean():.1f}" for c in ('basse', 'caisse', 'accomp', 'melodie'))
        print(f"  {x['nom']:<4} {x['t0']:6.1f} → {x['t1']:6.1f} s  ({x['m1'] - x['m0']:2d} mesures)  intensité {x['intensite']:.2f}  frappes/s : {fam}")


def attaque_de(e):
    """Y a-t-il une vraie frappe de la musique à cet instant ? Rend l'écart (s) jusqu'à la plus proche, None au-delà de 50 ms."""
    import numpy as np
    tf = np.array([f['t'] for f in e.frappes])

    def attaque(t, tol=.05):
        d = tf - t
        j = int(np.argmin(np.abs(d)))
        return float(d[j]) if abs(d[j]) <= tol else None
    return attaque


def proposer(ident, ecrire=False):
    import composer, confort, difficulte
    e, g, s = charger(ident)
    fiche = lire_fiche(ident)
    m = composer.Matiere(e, g, s)
    secs = [(x['nom'], x['t0'], x['t1']) for x in s.liste]
    partitions, bilans, fins = {}, {}, {}
    for dif in confort.DIFFICULTES:
        p = composer.Partition(m, dif, graine=fiche.get('graine', 1), plan=fiche)
        notes = p.notes
        fins[dif] = composer.tenue_finale(notes, m, dif)
        notes = appliquer_manuel(notes, fiche, dif)
        partitions[dif] = notes
        bilans[dif] = confort.verifier(notes, dif, attaque_de(e), secs, fin_libre=fins[dif])
        bilans[dif]['journal'] = p.journal
    notes_dif = difficulte.noter(partitions)
    afficher_bilan(ident, s, partitions, bilans, notes_dif)
    niveau = fabriquer_niveau(ident, fiche, e, g, s, partitions, notes_dif)
    sortie = os.path.join(RACINE, 'niveaux', f'{ident}.json') if ecrire else os.path.join(TRAVAIL, ident, 'niveau.json')
    ecrire_niveau(sortie, niveau)
    print(f"\n{'Écrit' if ecrire else 'Essai écrit (rien de changé dans le dépôt)'} : {sortie}")
    return partitions, bilans


def appliquer_manuel(notes, fiche, dif):
    """Retouches à la main rangées dans la fiche : {"dif": "normal", "de": 12.0, "a": 15.5, "notes": [...]} remplace
    tout ce que l'outil avait écrit entre « de » et « a » par les notes données (au format du jeu)."""
    for r in fiche.get('manuel', []):
        if r.get('dif') not in (dif, 'toutes'):
            continue
        notes = [n for n in notes if not (r['de'] <= n['t'] < r['a'])] + [dict(n) for n in r['notes']]
    notes.sort(key=lambda n: (n['t'], n['l']))
    return notes


def fabriquer_niveau(ident, fiche, e, g, s, partitions, notes_dif):
    import confort
    fin_notes = max(confort.fin_de(n) for p in partitions.values() for n in p)
    fin = fiche.get('reglages', {}).get('fin') or round(min(e.duree - .3, max(fin_notes + 2.5, min(s.fin, fin_notes + 5))), 1)
    return {
        'id': ident, 'titre': fiche.get('titre', ident), 'jeu': fiche.get('jeu', ''),
        'bpm': round(g.bpm, 2), 'grille': round(g.phase, 4), 'avance': 1.5, 'fin': fin, 'duree': round(e.duree, 1),
        'musique': f'musiques/{ident}.bin',
        'methode': "Atelier de partitions (outils/partitions/) : pulsation de l'instrument section par section, cascades aux "
                   "moments forts, tenues lâchées sur la frappe suivante, doubles quand deux voix frappent ensemble.",
        'difficulte': notes_dif,
        'partitions': partitions,
    }


def ecrire_niveau(chemin, niveau):
    """Même présentation que gff.json : une note par ligne."""
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    tete = {k: v for k, v in niveau.items() if k not in ('partitions', 'notes')}
    lignes = json.dumps(tete, ensure_ascii=False, indent=2)
    lignes = lignes[:lignes.rindex('}')].rstrip()      # (on rouvre l'accolade finale pour ajouter les partitions)
    out = [lignes + ',', '  "partitions": {']
    difs = list(niveau['partitions'])
    for i, dif in enumerate(difs):
        out.append(f'    "{dif}": [')
        notes = niveau['partitions'][dif]
        for j, n in enumerate(notes):
            out.append('      ' + json.dumps(n, ensure_ascii=False, separators=(',', ':')) + (',' if j < len(notes) - 1 else ''))
        out.append('    ]' + (',' if i < len(difs) - 1 else ''))
    out += ['  }', '}']
    with open(chemin, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def afficher_bilan(ident, s, partitions, bilans, notes_dif):
    print(f'\n===== {ident} : les 3 partitions =====')
    noms_sec = [x['nom'] for x in s.liste]
    print(f"{'':<8}{'note':>5}{'notes':>7}{'combo':>7}{'/s':>6}{'pic':>6}{'tenir':>7}{'glisser':>9}{'doubles':>9}{'tenue+tape':>12}   " + ' '.join(f'{n:>5}' for n in noms_sec))
    for dif, notes in partitions.items():
        st = bilans[dif]['stats']
        dens = ' '.join(f'{d:5.2f}' for _, d in st.get('sections', []))
        print(f"{NOMS[dif]:<8}{notes_dif[dif]:>5}{st['notes']:>7}{st['combo']:>7}{st['densite']:>6.2f}{st['pic']:>6.2f}{st['tenir']:>7}{st['glisser']:>9}{st['doubles']:>9}{st['pendant_tenue']:>12}   {dens}")
    for dif in partitions:
        st, soucis = bilans[dif]['stats'], bilans[dif]['soucis']
        cal = st.get('calage_ms')
        print(f"\n{NOMS[dif]} : sens des glissés {st['sens']} · calage sur les frappes : médiane {cal['median']} ms, max {cal['max']} ms" if cal else f'\n{NOMS[dif]}')
        if soucis:
            print(f'  {len(soucis)} SOUCI(S) :')
            for t, quoi in soucis[:25]:
                print(f'    {t:7.2f} s  {quoi}')
        else:
            print('  aucun souci : chaque note sur une vraie frappe, pouces à l\'aise, densité dans la fourchette')
    n = [bilans[d]['stats']['notes'] for d in ('facile', 'normal', 'expert')]
    if not n[0] < n[1] < n[2]:
        print(f'\nATTENTION : le nombre de notes ne monte pas de Facile à Expert ({n})')
    elif n[2] < 1.25 * n[1]:
        print(f"\nÀ savoir : l'Expert n'a que {n[2]} notes contre {n[1]} en Normal : la musique n'en offre pas beaucoup plus.")


def verifier_niveau(ident):
    import confort
    e, g, s = charger(ident)
    d = json.load(open(os.path.join(RACINE, 'niveaux', f'{ident}.json'), encoding='utf-8'))
    partitions = d.get('partitions') or {'normal': d['notes']}
    secs = [(x['nom'], x['t0'], x['t1']) for x in s.liste]
    bilans = {}
    for dif, notes in partitions.items():
        if dif not in confort.DIFFICULTES:
            continue
        der = max(notes, key=lambda n: confort.fin_de(n))
        bilans[dif] = confort.verifier(notes, dif, attaque_de(e), secs, fin_libre=der.get('e'))
    import difficulte
    afficher_bilan(ident, s, {k: partitions[k] for k in bilans}, bilans, difficulte.noter({k: partitions[k] for k in bilans}))
    return bilans


def frappes(ident, t0, t1):
    e, g, s = charger(ident)
    print(' temps    case pos  force basse caisse accomp melodie note')
    for f in e.frappes:
        if t0 <= f['t'] <= t1:
            k = g.case_de(f['t'])
            pos, mes = g.pos_mesure(k)
            sur = abs(g.cases[k] - f['t']) < .035
            print(f"{f['t']:7.3f} {k:5d} {pos if sur else '-':>3}  {f['force']:5.2f} {f['basse']:5.2f} {f['caisse']:6.2f} {f['accomp']:6.2f} {f['melodie']:7.2f} {f['note'] if f['note'] is not None else '':>5}")


def marques(ident, texte):
    """Texte copié depuis la page de test : une ligne JSON {"morceau": id, "marques": [{dif, t, quoi}]}."""
    fiche = lire_fiche(ident)
    d = json.loads(texte)
    nouvelles = d['marques'] if isinstance(d, dict) else d
    deja = {(m['dif'], round(m['t'], 1), m['quoi']) for m in fiche.get('marques', [])}
    ajout = [m for m in nouvelles if m.get('morceau', ident) == ident and (m['dif'], round(m['t'], 1), m['quoi']) not in deja]
    fiche.setdefault('marques', []).extend({'dif': m['dif'], 't': round(m['t'], 2), 'quoi': m['quoi'], 'traite': False} for m in ajout)
    ecrire_fiche(ident, fiche)
    print(f"{len(ajout)} marque(s) rangée(s) dans {os.path.relpath(chemin_fiche(ident), RACINE)}")
    for m in fiche['marques']:
        print(f"  {NOMS.get(m['dif'], m['dif']):<7} {m['t']:6.1f} s  {m['quoi']}{'  (traitée)' if m.get('traite') else ''}")


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    cmd = a[0]
    if cmd == 'analyser' and len(a) == 3:
        analyser(a[1], a[2])
    elif cmd == 'proposer' and len(a) >= 2:
        proposer(a[1], ecrire='--ecrire' in a)
    elif cmd == 'verifier' and len(a) == 2:
        bilans = verifier_niveau(a[1])
        sys.exit(1 if any(b['soucis'] for b in bilans.values()) else 0)
    elif cmd == 'marques' and len(a) == 3:
        marques(a[1], a[2])
    elif cmd == 'frappes' and len(a) == 4:
        frappes(a[1], float(a[2]), float(a[3]))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
