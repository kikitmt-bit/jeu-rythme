"""Atelier de partitions, étape 3 : les sections du morceau (intro, couplet, pont, reprise, fin…).

On résume chaque mesure (ses notes, son volume, le nombre de frappes), on cherche les endroits où la musique change,
et on reconnaît les sections qui reviennent (même lettre : A, B, A…). Chaque section reçoit une « intensité »
de 0 à 1 (volume + nombre de frappes) : elle sert à faire monter puis redescendre la difficulté.
"""
import numpy as np
from audio import DT, FAMILLES


class Sections:
    def __init__(self, ecoute, grille, debut=None, fin=None):
        e, g = ecoute, grille
        self.ecoute, self.grille = e, g
        par = g.mesure * g.div
        # bornes des mesures (en cases), en commençant avant le premier « 1 » s'il y a de la musique avant
        k0 = g.depart * g.div
        while k0 - par >= 0:
            k0 -= par
        actif = np.where(e.volume > np.percentile(e.volume, 95) - 30)[0]
        self.fin_son = float(actif[-1] * DT) if len(actif) else e.duree
        self.cases_mesures = [k for k in range(k0, len(g.cases) - par + 1, par) if g.cases[k] < self.fin_son - g.P]
        self.t_mesures = [float(g.cases[k]) for k in self.cases_mesures] + [float(g.cases[min(len(g.cases) - 1, self.cases_mesures[-1] + par)])]
        n = len(self.cases_mesures)
        # ce que contient chaque mesure
        self.chroma = g.chroma_par(self.t_mesures)[:n]
        vol = np.array([e.volume[int(a / DT):max(int(a / DT) + 1, int(b / DT))].mean() for a, b in zip(self.t_mesures, self.t_mesures[1:])])
        self.volume = vol
        fr = np.array([f['t'] for f in e.frappes])
        fo = np.array([f['force'] for f in e.frappes])
        self.frappes = np.array([fo[(fr >= a) & (fr < b)].sum() / max(.1, b - a) for a, b in zip(self.t_mesures, self.t_mesures[1:])])
        self.familles = {nom: np.array([sum(f[nom] for f in e.frappes if a <= f['t'] < b) / max(.1, b - a)
                                        for a, b in zip(self.t_mesures, self.t_mesures[1:])]) for nom in FAMILLES}
        # où la musique commence et finit vraiment (le silence du début, le fondu de la fin)
        self.debut = float(e.frappes[0]['t']) if debut is None else debut
        dernier = max((f['t'] for f in e.frappes if f['force'] > .12), default=e.duree)
        self.fin = float(min(e.duree - .3, max(dernier + 1.5, min(self.fin_son, dernier + 4)))) if fin is None else fin
        # fin du jeu : après ce moment la musique s'éteint (fondu : plus de 12 dB sous son volume habituel) et on n'y met
        # plus de notes ; seule une dernière tenue peut s'y prolonger
        i0, i1 = int(self.debut / DT), max(int(self.debut / DT) + 1, int(self.fin_son / DT))
        habituel = float(np.median(e.volume[i0:i1]))
        forts = np.where(e.volume[:i1] >= habituel - 12)[0]
        self.fin_jeu = float(forts[-1] * DT) if len(forts) else self.fin_son
        # énergie du morceau : la force des frappes par seconde, toutes familles réunies (sur la musique elle-même,
        # sans les silences du début et de la fin). Great Fairy's Fountain vaut 11 ; Boss Battle 18 ; une berceuse 6.
        corps = [i for i in range(n) if self.t_mesures[i] >= self.debut - .5 and self.t_mesures[i + 1] <= self.fin_son]
        self.energie = float(np.mean([sum(self.familles[c][i] for c in FAMILLES) for i in corps])) if corps else 0.0
        self.bornes = self._bornes()
        self.liste = self._decrire()

    def _vecteurs(self):
        """Un résumé par mesure : ses 12 notes + son volume + ses frappes par famille (tout ramené à la même échelle)."""
        v = (self.volume - self.volume.mean()) / (self.volume.std() + 1e-9)
        cols = [self.chroma * 1.0, v[:, None] * .6]
        for nom in FAMILLES:
            x = self.familles[nom]
            cols.append(((x - x.mean()) / (x.std() + 1e-9))[:, None] * .35)
        return np.hstack(cols)

    def _bornes(self):
        """Numéros des mesures où une nouvelle section commence.
        Les phrases font presque toujours 4 mesures : on cale une règle de 4 mesures sur les endroits où la musique
        change le plus, on coupe sur cette règle là où ça change (ou tous les 8 au plus), et un changement très net
        en dehors de la règle la recale (phrase de longueur inhabituelle)."""
        V = self._vecteurs()
        n = len(V)
        if n < 8:
            return [0, n]
        nouv = np.zeros(n + 1)
        for i in range(2, n - 1):                     # (les bords ne comptent pas : il n'y a rien à comparer)
            for L in (2, 4):
                a, b = V[max(0, i - L):i], V[i:min(n, i + L)]
                nouv[i] += np.linalg.norm(a.mean(0) - b.mean(0)) / 2
        self.nouveaute = nouv
        seuil, tres = nouv[2:n - 1].mean() + .5 * nouv[2:n - 1].std(), nouv[2:n - 1].mean() + 2 * nouv[2:n - 1].std()
        dec = int(np.argmax([nouv[o::4].sum() for o in range(4)]))
        bornes = [0]
        if dec and nouv[dec] >= seuil:
            bornes.append(dec)
        ancre = dec
        i = ancre + 4 if dec else 4
        while i < n:
            # changement très net hors de la règle, entre la dernière coupe et la prochaine : on recale
            hors = [p for p in range(bornes[-1] + 2, min(n - 1, i + 2)) if (p - ancre) % 4 and nouv[p] >= tres
                    and nouv[p] == nouv[max(0, p - 1):p + 2].max() and nouv[p] > 1.4 * max(nouv[i - 4 if i >= 4 else 0], nouv[min(i, n)])]
            if hors:
                p = hors[0]
                bornes.append(p)
                ancre, i = p, p + 4
                continue
            if nouv[i] >= seuil or i - bornes[-1] >= 8:
                if n - i >= 2:
                    bornes.append(i)
            i += 4
        bornes.append(n)
        return bornes

    def _decrire(self):
        V, n = self.chroma, len(self.bornes) - 1
        secs = []
        for i in range(n):
            a, b = self.bornes[i], self.bornes[i + 1]
            secs.append({'m0': a, 'm1': b, 't0': self.t_mesures[a], 't1': self.t_mesures[b],
                         'volume': float(self.volume[a:b].mean()), 'frappes': float(self.frappes[a:b].mean()),
                         'chroma': V[a:b].mean(0)})
        # intensité : volume et frappes, ramenés entre 0 et 1 sur l'ensemble du morceau
        vol = np.array([s['volume'] for s in secs])
        fr = np.array([s['frappes'] for s in secs])
        nz = lambda x: (x - x.min()) / (x.max() - x.min() + 1e-9)
        inten = .5 * nz(vol) + .5 * nz(fr)
        # lettres : deux sections se ressemblent si leurs mesures, prises une à une, ont les mêmes notes
        lettres, modeles = [], []
        for i, s in enumerate(secs):
            s['intensite'] = round(float(inten[i]), 2)
            A = self.chroma[s['m0']:s['m1']]
            trouve = None
            for j, (B, lettre) in enumerate(modeles):
                m = min(len(A), len(B))
                if m >= 3 and abs(len(A) - len(B)) <= max(2, m // 2):
                    sim = float(np.mean([A[k] @ B[k] for k in range(m)]))
                    if sim > .9:
                        trouve = lettre
                        break
            if trouve is None:
                trouve = chr(ord('A') + len(modeles))
                modeles.append((A, trouve))
            s['lettre'] = trouve
            lettres.append(trouve)
        for i, s in enumerate(secs):
            s['passage'] = lettres[:i + 1].count(s['lettre'])       # 1 = première fois qu'on entend cette section
            s['nom'] = f"{s['lettre']}{s['passage']}"
            del s['chroma']
        return secs

    def de(self, t):
        for i, s in enumerate(self.liste):
            if t < s['t1']:
                return i
        return len(self.liste) - 1
