"""Atelier de partitions : la note de difficulté de 1 à 10 (demande de Kiki, 16/11).

Chaque morceau reçoit une note par mode. Elle est calculée sur la partition elle-même, donc elle s'adapte à la
musique : un morceau calme peut valoir 2 / 4 / 6 (Facile / Normal / Expert), un morceau déchaîné 6 / 8 / 10.

Ce qui compte :
  - le nombre de notes par seconde (en moyenne, et dans le passage le plus chargé) ;
  - la vitesse : la part des notes qui arrivent moins de 0,2 s après la précédente ;
  - la technique : glissés (les diagonales comptent plus), doubles, notes à taper pendant qu'un pouce tient.
Repère : Great Fairy's Fountain en Normal (la partition validée par Kiki) vaut 5.
"""
import confort


def brut(notes):
    st = confort.statistiques(notes)
    if not st['notes']:
        return 0
    ts = sorted({n['t'] for n in notes})
    ecarts = [b - a for a, b in zip(ts, ts[1:])]
    rapide = sum(1 for e in ecarts if e < .2) / max(1, len(ecarts))
    diag = sum(v for d, v in st['sens'].items() if len(d) > 1)
    tech = (st['glisser'] + .5 * diag + 1.5 * st['doubles'] + st['pendant_tenue']) / st['notes']
    return .8 * st['densite'] + .3 * st['pic'] + 3.5 * tech + 1.6 * rapide


def noter(partitions):
    """{'facile': 2, 'normal': 5, 'expert': 8} : toujours croissant d'un mode au suivant."""
    out, prec = {}, 0
    for dif in confort.DIFFICULTES:
        if dif not in partitions:
            continue
        n = int(round(brut(partitions[dif])))
        n = max(1, prec + 1, min(10, n))
        out[dif] = min(10, n)
        prec = out[dif]
    return out
