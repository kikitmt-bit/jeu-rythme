"""Atelier de partitions : les règles d'une bonne partition, et leur vérification automatique.

Une partition est une liste de notes au format du jeu (niveaux/<id>.json) :
  {"y": "t"|"h"|"s", "t": temps, "l": piste 0-3, "e": fin de tenue, "d": sens du glissé, "p": n° de double}

Trois familles de règles, différentes selon la difficulté (REGLES) :
  1. chaque note tombe sur une vraie frappe de la musique (et une tenue se lâche sur une vraie frappe) ;
  2. confort des pouces : écart minimum entre deux notes, repos après une tenue ou un glissé, jamais trois doigts,
     pas de glissé juste après une tenue, rien pile à la fin d'une tenue, pas de mitraillage d'un seul pouce ;
  3. densité : moyenne et pic, par section, dans la fourchette de la difficulté.

Le jeu se joue en touchant n'importe où : une note n'appartient donc à aucun pouce. Pour juger le confort, on simule
un joueur à deux pouces (qui alterne, et dont un pouce reste pris pendant une tenue).
"""

DIFFICULTES = ('facile', 'normal', 'expert')

# Toutes les durées sont en secondes.
REGLES = {
    'facile': dict(
        ecart=.36,            # entre deux notes qui se suivent
        apres_tenue=.45,      # repos après avoir lâché une tenue
        apres_glisse=.45,     # repos après un glissé
        glisse_apres_tenue=.6,  # pas de glissé dans ce délai après une tenue
        meme_pouce=.36,       # entre deux notes du même pouce (quand l'autre est pris par une tenue)
        autour_double=9,      # (pas de doubles en Facile)
        doubles=False, pendant_tenue=False, diagonales=False,
        dens_moy=(.6, 1.85), dens_pic=2.6,
        tenue=(.7, 4.0),
    ),
    'normal': dict(
        ecart=.17, apres_tenue=.36, apres_glisse=.28, glisse_apres_tenue=.5, meme_pouce=.34, autour_double=.3,
        doubles=True, pendant_tenue=True, diagonales=True,
        dens_moy=(1.2, 4.3), dens_pic=5.8,
        tenue=(.5, 4.0),
    ),
    'expert': dict(
        ecart=.12, apres_tenue=.18, apres_glisse=.18, glisse_apres_tenue=.3, meme_pouce=.22, autour_double=.18,
        doubles=True, pendant_tenue=True, diagonales=True,
        dens_moy=(1.8, 6.5), dens_pic=7.8,
        tenue=(.4, 5.0),
    ),
}
FENETRE_PIC = 4.0     # le pic de densité se mesure sur 4 secondes
PILE = .07            # « pile en même temps » : à moins de 70 ms


def fin_de(n):
    return n['e'] if n['y'] == 'h' else n['t']


def pouces(notes):
    """Simule un joueur à deux pouces. Rend la liste des pouces (0 ou 1, ou (0,1) pour une double) note par note,
    et la liste des impossibilités rencontrées (trois doigts à la fois)."""
    libre = [-9.0, -9.0]          # moment où chaque pouce est libéré (fin de tenue)
    dernier = [-9.0, -9.0]        # dernière note jouée par chaque pouce
    qui, soucis, i, prec = [], [], 0, 1
    while i < len(notes):
        n = notes[i]
        double = i + 1 < len(notes) and n.get('p') is not None and notes[i + 1].get('p') == n.get('p')
        if double:
            m = notes[i + 1]
            for h in (0, 1):
                if libre[h] > n['t'] + PILE:
                    soucis.append((n['t'], 'trois doigts : une double pendant une tenue'))
            libre = [fin_de(n), fin_de(m)]
            dernier = [n['t'], n['t']]
            qui += [0, 1]
            i += 2
            continue
        occupe = [libre[h] > n['t'] + PILE for h in (0, 1)]
        if all(occupe):
            soucis.append((n['t'], 'trois doigts : une note pendant deux tenues'))
            h = 0
        elif any(occupe):
            h = 0 if occupe[1] else 1
        else:
            # on alterne ; si l'autre pouce vient de lâcher une tenue ou de glisser, on préfère le plus reposé
            h = 1 - prec
        qui.append(h)
        dernier[h] = n['t']
        libre[h] = fin_de(n)
        prec = h
        i += 1
    return qui, soucis


def verifier(notes, dif, attaque=None, sections=None, fin_libre=None):
    """Rend {'soucis': [(temps, texte)], 'stats': {...}}.
    attaque(t) -> écart (s) jusqu'à la vraie frappe la plus proche, ou None s'il n'y en a pas à ±50 ms.
    sections : [(nom, t0, t1)] pour la densité par section.
    fin_libre : temps de fin de la toute dernière tenue (elle peut finir dans le fondu, sans frappe)."""
    R = REGLES[dif]
    S = []
    notes = sorted(notes, key=lambda n: (n['t'], n['l']))
    # ---- format ----
    paires = {}
    for n in notes:
        if n['y'] not in 'ths' or not 0 <= n['l'] <= 3:
            S.append((n['t'], 'note mal formée'))
        if n['y'] == 'h' and not n.get('e', 0) > n['t']:
            S.append((n['t'], 'tenue sans fin'))
        if n['y'] == 's' and n.get('d') not in ('u', 'd', 'l', 'r', 'ur', 'ul', 'dr', 'dl'):
            S.append((n['t'], 'glissé sans sens'))
        if n['y'] == 's' and not R['diagonales'] and len(n.get('d', '')) > 1:
            S.append((n['t'], 'glissé en diagonale (pas dans cette difficulté)'))
        if n.get('p') is not None:
            paires.setdefault(n['p'], []).append(n)
    for p, g in paires.items():
        t = g[0]['t']
        if not R['doubles']:
            S.append((t, 'double (pas dans cette difficulté)'))
        if len(g) != 2 or abs(g[0]['t'] - g[1]['t']) > 1e-6 or g[0]['l'] == g[1]['l']:
            S.append((t, 'double mal formée (il faut 2 notes au même moment sur 2 pistes)'))
        elif g[0]['y'] != g[1]['y'] or g[0].get('d') != g[1].get('d') or g[0].get('e') != g[1].get('e'):
            # le jeu donne la première note au premier doigt posé : les deux notes doivent donc demander le même geste
            S.append((t, 'double dont les deux notes ne demandent pas le même geste'))
    # ---- chaque note sur une vraie frappe ----
    ecarts = []
    if attaque:
        for n in notes:
            d = attaque(n['t'])
            if d is None:
                S.append((n['t'], 'aucune frappe de la musique à cet instant'))
            else:
                ecarts.append(abs(d))
            if n['y'] == 'h' and not (fin_libre is not None and abs(n['e'] - fin_libre) < 1e-6) and attaque(n['e']) is None:
                S.append((n['e'], 'tenue lâchée sans frappe de la musique'))
    # ---- confort ----
    qui, s3 = pouces(notes)
    S += s3
    for i, n in enumerate(notes):
        for j in range(i + 1, len(notes)):
            m = notes[j]
            if m['t'] - n['t'] > 6:
                break
            jumelles = n.get('p') is not None and n.get('p') == m.get('p')
            if jumelles:
                continue
            dt = m['t'] - n['t']
            if dt < R['ecart'] - 1e-3 and n['y'] != 'h':
                S.append((m['t'], f'trop près de la note précédente ({dt * 1000:.0f} ms)'))
            if dt < PILE and n['y'] == 'h':
                S.append((m['t'], 'note en même temps que le début d\'une tenue'))
            if (n.get('p') is not None or m.get('p') is not None) and dt < R['autour_double'] - 1e-3:
                S.append((m['t'], f'trop près d\'une double ({dt * 1000:.0f} ms)'))
            if n['y'] == 's' and dt < R['apres_glisse'] - 1e-3:
                S.append((m['t'], f'trop tôt après un glissé ({dt * 1000:.0f} ms)'))
            if n['y'] == 'h':
                fin = n['e']
                if abs(m['t'] - fin) < PILE:
                    S.append((m['t'], 'note pile à la fin d\'une tenue'))
                elif m['t'] < fin:
                    if not R['pendant_tenue']:
                        S.append((m['t'], 'note pendant une tenue (pas dans cette difficulté)'))
                    elif m['t'] - n['t'] < R['ecart'] - 1e-3:
                        S.append((m['t'], 'trop près du début de la tenue'))
                    elif m['y'] == 'h' and m['e'] > fin - PILE:
                        S.append((m['t'], 'deux tenues qui se chevauchent'))
                    elif fin - fin_de(m) < R['ecart'] - 1e-3:
                        S.append((m['t'], 'trop près de la fin de la tenue'))
                else:
                    apres = m['t'] - fin
                    meme = qui[i] == qui[j]
                    # en Expert l'autre pouce peut enchaîner ; sinon tout le monde se repose
                    if apres < R['apres_tenue'] - 1e-3 and (meme or dif != 'expert'):
                        S.append((m['t'], f'trop tôt après une tenue ({apres * 1000:.0f} ms)'))
                    if m['y'] == 's' and apres < R['glisse_apres_tenue'] - 1e-3 and (meme or dif != 'expert'):
                        S.append((m['t'], f'glissé juste après une tenue ({apres * 1000:.0f} ms)'))
    # mitraillage d'un seul pouce (pendant que l'autre tient)
    der = {}
    for n, h in zip(notes, qui):
        # (juste après une double, c'est la règle « autour d'une double » qui s'applique)
        if h in der and n['t'] - der[h]['t'] < R['meme_pouce'] - 1e-3 and n.get('p') is None and der[h].get('p') is None:
            S.append((n['t'], f'deux notes du même pouce trop rapprochées ({(n["t"] - der[h]["t"]) * 1000:.0f} ms)'))
        der[h] = n
    # tenues : durée
    for n in notes:
        if n['y'] == 'h':
            d = n['e'] - n['t']
            if d < R['tenue'][0] - 1e-3 or (d > R['tenue'][1] + 1e-3 and not (fin_libre is not None and abs(n['e'] - fin_libre) < 1e-6)):
                S.append((n['t'], f'tenue de {d:.2f} s (hors de {R["tenue"][0]}–{R["tenue"][1]} s)'))
    # ---- densité ----
    stats = statistiques(notes, sections)
    lo, hi = R['dens_moy']
    if stats['densite'] > hi + 1e-6:
        S.append((0, f'trop de notes pour cette difficulté ({stats["densite"]:.2f} par seconde, maximum {hi})'))
    if stats['pic'] > R['dens_pic'] + 1e-6:
        S.append((stats['t_pic'], f'passage trop chargé ({stats["pic"]:.2f} notes par seconde sur {FENETRE_PIC:.0f} s, maximum {R["dens_pic"]})'))
    if ecarts:
        e = sorted(ecarts)
        stats['calage_ms'] = {'median': round(e[len(e) // 2] * 1000, 1), 'max': round(e[-1] * 1000, 1)}
    S = sorted(set(S))
    return {'soucis': S, 'stats': stats}


def statistiques(notes, sections=None):
    notes = sorted(notes, key=lambda n: (n['t'], n['l']))
    if not notes:
        return {'notes': 0, 'combo': 0, 'densite': 0, 'pic': 0, 't_pic': 0}
    t0, t1 = notes[0]['t'], max(fin_de(n) for n in notes)
    duree = max(10.0, t1 - t0)
    ts = [n['t'] for n in notes]
    pic, t_pic, j = 0, t0, 0
    for i, t in enumerate(ts):
        while ts[j] < t - FENETRE_PIC:
            j += 1
        if (i - j + 1) / FENETRE_PIC > pic:
            pic, t_pic = (i - j + 1) / FENETRE_PIC, ts[j]
    sortes = {'taper': 0, 'tenir': 0, 'glisser': 0}
    for n in notes:
        sortes[{'t': 'taper', 'h': 'tenir', 's': 'glisser'}[n['y']]] += 1
    sens = {}
    for n in notes:
        if n['y'] == 's':
            sens[n['d']] = sens.get(n['d'], 0) + 1
    paires = len({n['p'] for n in notes if n.get('p') is not None})
    pendant = sum(1 for n in notes for h in notes if h['y'] == 'h' and h is not n and h['t'] + PILE < n['t'] < h['e'] - PILE)
    st = {'notes': len(notes), 'combo': sum(2 if n['y'] == 'h' else 1 for n in notes),
          'densite': round(len(notes) / duree, 2), 'pic': round(pic, 2), 't_pic': round(t_pic, 1),
          **sortes, 'sens': dict(sorted(sens.items())), 'doubles': paires, 'pendant_tenue': pendant}
    if sections:
        st['sections'] = [(nom, round(sum(1 for n in notes if a <= n['t'] < b) / max(.1, b - a), 2)) for nom, a, b in sections]
    return st
