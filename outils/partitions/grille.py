"""Atelier de partitions, étape 2 : le tempo et la grille.

  - tempo (battements par minute) et moment du premier temps, au centième près ;
  - stabilité : le morceau garde-t-il ce tempo du début à la fin ? (dérive mesurée par tranches de 6 s ;
    une dérive lente est suivie, la grille se recale toute seule) ;
  - la plus petite division vraiment jouée (demi-temps, tiers de temps = triolets, quart de temps) ;
  - la mesure (3 ou 4 temps) et son premier temps.

La grille est une liste de « cases » : la case k est au temps cases[k]. Il y a `div` cases par temps.
"""
import numpy as np
from audio import DT


def _peigne(env, periode, phase, t1):
    """Force moyenne de l'enveloppe sur un peigne régulier (un pic attendu toutes les `periode` secondes)."""
    t = np.arange(phase, t1, periode)
    return np.interp(t, np.arange(len(env)) * DT, env).mean()


def chercher_tempo(env, duree, bpm_min=55, bpm_max=215):
    """Rend la liste des tempos candidats (du meilleur au moins bon) : [(note, bpm, phase)]."""
    # 1) autocorrélation : quelles périodes reviennent le plus ?
    e = env - env.mean()
    n = len(e)
    f = np.fft.rfft(e, 2 * n)
    ac = np.fft.irfft(f * np.conj(f))[:n]
    ac /= ac[0] + 1e-12
    lags = np.arange(n) * DT
    cands = []
    for bpm in np.arange(bpm_min, bpm_max, .25):
        P = 60 / bpm
        # une bonne période revient aussi à 2, 3 et 4 fois sa durée
        v = sum(np.interp(k * P, lags, ac) for k in (1, 2, 3, 4)) / 4
        cands.append((v, bpm))
    cands.sort(reverse=True)
    # on garde quelques sommets bien séparés
    choisis = []
    for v, bpm in cands:
        if all(abs(bpm - b) > 3 for _, b in choisis):
            choisis.append((v, bpm))
        if len(choisis) == 6:
            break
    # 2) pour chacun : réglage fin du tempo et de la phase avec le peigne
    out = []
    for _, bpm0 in choisis:
        best = (0, bpm0, 0)
        for pas, largeur in ((.1, 1.5), (.01, .12)):
            centre = best[1]
            for bpm in np.arange(centre - largeur, centre + largeur + 1e-9, pas):
                P = 60 / bpm
                for ph in np.arange(0, P, .004):
                    v = _peigne(env, P, ph, duree)
                    if v > best[0]:
                        best = (v, bpm, ph)
        out.append(best)
    out.sort(reverse=True)
    return out


def affiner_phase(env, bpm, phase, duree):
    """Réglage fin de la phase (au millième de seconde)."""
    P = 60 / bpm
    best = (0, phase)
    for ph in np.arange(phase - .012, phase + .012, .001):
        v = _peigne(env, P, ph % P, duree)
        if v > best[0]:
            best = (v, ph % P)
    return best[1]


def derive(env, bpm, phase, duree, tranche=4.0, pas=2.0):
    """Écart de la musique par rapport à la grille régulière, tranche par tranche : [(milieu, écart en s, netteté, force)].
    On part de la tranche la plus nette et on suit de proche en proche (vers la fin, puis vers le début) : chaque
    tranche cherche son écart près de celui qu'on attend (l'écart d'avant, prolongé de sa pente). Un tempo un peu
    faux, ou qui respire, est ainsi suivi sans limite d'écart ; une tranche floue garde l'écart attendu."""
    P = 60 / bpm
    t = np.arange(len(env)) * DT
    debuts = np.arange(0, max(pas, duree - tranche / 2), pas)

    def mesurer(a, centre, largeur):
        b = min(duree, a + tranche)
        k0 = np.ceil((a - phase) / P)
        base = phase + k0 * P
        best, vals = (0, centre), []
        for d in np.arange(centre - largeur, centre + largeur + 1e-9, .002):
            tt = np.arange(base + d, b, P)
            tt = tt[tt >= a]
            if len(tt) < 3:
                continue
            v = np.interp(tt, t, env).mean()
            vals.append(v)
            if v > best[0]:
                best = (v, d)
        # netteté : le meilleur écart par rapport à la moyenne sur tout un temps (pas seulement la zone cherchée)
        tous = [np.interp(np.arange(base + d, b, P), t, env).mean() for d in np.arange(0, P, P / 12)]
        return best[1], (best[0] / (np.mean(tous) + 1e-9) if vals else 0), best[0]

    libre = [mesurer(a, 0, .02) for a in debuts]
    forces = [f for _, _, f in libre]
    seuil_force = .4 * np.median(forces)
    ancre = int(np.argmax([n if f >= seuil_force else 0 for _, n, f in libre]))
    ecarts = {ancre: libre[ancre]}
    for sens in (1, -1):
        i, prec, pente = ancre + sens, libre[ancre][0], 0.0
        while 0 <= i < len(debuts):
            attendu = prec + pente
            d, net, f = mesurer(debuts[i], attendu, .035)
            if net < 1.5 or f < seuil_force:
                d = attendu                                  # tranche floue (silence, fondu) : on prolonge
                pente *= .5
            else:
                pente = .5 * pente + .5 * (d - prec)
            ecarts[i] = (d, net, f)
            prec = d
            i += sens
    return [(float(debuts[i] + tranche / 2), float(ecarts[i][0]), float(ecarts[i][1]), float(ecarts[i][2])) for i in range(len(debuts))]


class Grille:
    def __init__(self, ecoute, bpm_entre=None, bpm=None, premier_temps=None, mesure=None, div=None):
        self.ecoute = ecoute
        env, duree = ecoute.tout, ecoute.duree
        self.journal = []
        if bpm is None:
            cands = chercher_tempo(env, duree)
            # Le même morceau peut se compter à 78 ou à 156 : on prend la version entre 85 et 175 (un pas de marche),
            # sauf demande contraire (bpm_entre).
            lo, hi = bpm_entre or (85, 175)
            note0, bpm0, ph0 = cands[0]
            vus = []
            for mult in (1, 2, .5, 3, 1 / 3, 1.5, 2 / 3):
                b = bpm0 * mult
                if lo <= b < hi:
                    vus.append(b)
            bpm = vus[0] if vus else bpm0
            self.journal.append('tempos entendus : ' + ', '.join(f'{b:.1f}' for _, b, _ in cands[:4]))
            # réglage fin autour du tempo retenu
            best = (0, bpm, 0)
            for pas, largeur in ((.05, .8), (.005, .06)):
                centre = best[1]
                for bb in np.arange(centre - largeur, centre + largeur + 1e-9, pas):
                    P = 60 / bb
                    for ph in np.arange(0, P, .004):
                        v = _peigne(env, P, ph, duree)
                        if v > best[0]:
                            best = (v, bb, ph)
            bpm, phase = best[1], best[2]
        else:
            P = 60 / bpm
            phase = max((( _peigne(env, P, ph, duree)), ph) for ph in np.arange(0, P, .004))[1]
        phase = affiner_phase(env, bpm, phase, duree)
        self.bpm, self.P = float(bpm), 60 / float(bpm)
        # stabilité
        self.derive = derive(env, self.bpm, phase, duree)
        vmed = np.median([v for _, _, _, v in self.derive]) if self.derive else 0
        nets = [(t, d) for t, d, net, v in self.derive if net >= 1.5 and v >= .4 * vmed]
        tt = np.array([t for t, _, _, _ in self.derive])
        dd = np.array([d for _, d, _, _ in self.derive])
        dn = np.array([d for _, d in nets]) if nets else np.zeros(1)
        self.nettes = len(nets)
        self.ecart_max = float(dn.max() - dn.min())
        self.stable = self.ecart_max <= .016
        # les temps : grille régulière ; si la musique s'en écarte, la grille la suit (écarts interpolés)
        K = int((duree - phase) / self.P) + 1
        temps = phase + np.arange(K) * self.P
        if not self.stable and len(nets) >= 3:
            temps = temps + np.interp(temps, tt, dd)
            locaux = 60 / np.diff(temps)
            self.journal.append(f'tempo qui bouge : de {locaux.min():.1f} à {locaux.max():.1f} ; la grille suit la musique')
        # même calage que les frappes (voir Ecoute.RETARD)
        self.temps = temps - ecoute.RETARD
        # division : que joue vraiment la musique entre les temps ?
        self.div = div or self._division()
        self.cases = self._cases(self.div)
        # mesure
        self.mesure = mesure or self._mesure()
        self.depart = self._premier_temps(premier_temps)

    def _cases(self, div):
        k = np.arange((len(self.temps) - 1) * div + 1)
        return np.interp(k / div, np.arange(len(self.temps)), self.temps)

    def _force_cases(self, cases, env=None):
        e = self.ecoute.tout if env is None else env
        t = np.arange(len(e)) * DT
        # maximum à ±25 ms autour de la case
        out = np.zeros(len(cases))
        for d in (-.025, -.0125, 0, .0125, .025):
            out = np.maximum(out, np.interp(cases + d + self.ecoute.RETARD, t, e))
        return out

    def _division(self):
        """Demi-temps (2), triolets (3), quarts de temps (4) ou sixièmes (6) ? Pour chaque découpage on mesure la part
        des frappes qui tombent sur ses cases, moins ce qu'un découpage aussi fin attraperait par simple hasard."""
        fr = self.ecoute.frappes
        tf = np.array([f['t'] for f in fr])
        w = np.array([f['force'] for f in fr])
        res, gain, duree = {}, {}, {}
        for div in (2, 3, 4, 6):
            c = self._cases(div)
            duree[div] = float(np.median(np.diff(c)))
            tol = min(.035, .3 * duree[div])
            d = np.abs(tf[:, None] - c[None, :]).min(1)
            res[div] = float((w * (d < tol)).sum() / (w.sum() + 1e-9))
            gain[div] = res[div] - 2 * tol / duree[div]
        self.forces_div = res
        noms = {2: 'demi-temps', 3: 'triolets', 4: 'quarts de temps', 6: 'sixièmes de temps'}
        self.journal.append('frappes sur la grille selon le découpage : ' + ', '.join(f'{noms[d]} {100 * v:.0f} %' for d, v in res.items()))
        div = max(gain, key=lambda d: gain[d] - .001 * d)
        # un découpage deux fois plus fin, s'il attrape nettement plus de frappes et reste jouable (0,11 s par case)
        if div * 2 in res and res[div * 2] >= res[div] + .15 and duree[div * 2] >= .11:
            div *= 2
        return div

    def _mesure(self):
        """3 ou 4 temps par mesure : on regarde si la force des temps (basse + changement d'accord) revient tous les
        3 ou tous les 4 temps."""
        f = self._accents()
        f = f - f.mean()
        ac = {m: float((f[:-m] * f[m:]).mean()) for m in (2, 3, 4, 6, 8)}
        s3, s4 = ac[3] + ac[6], ac[4] + ac[8]
        self.journal.append(f'retour des accents : tous les 3 temps {s3:.3f}, tous les 4 temps {s4:.3f}')
        return 3 if s3 > s4 * 1.15 and s3 > 0 else 4

    def _accents(self):
        """Force de chaque temps comme « premier temps » possible : basse, et nouveauté des notes (changement d'accord)."""
        e = self.ecoute
        basse = self._force_cases(self.temps, e.env['basse'])
        # chroma (12 notes) par temps, puis différence avec le temps d'avant
        chroma = self.chroma_par(self.temps)
        nouveau = np.concatenate([[0], np.abs(np.diff(chroma, axis=0)).sum(1)])
        nouveau /= nouveau.max() + 1e-9
        return basse / (basse.max() + 1e-9) + nouveau

    def chroma_par(self, bornes):
        """Les 12 notes (do, do#… si) présentes entre deux bornes de temps consécutives."""
        e = self.ecoute
        fq = e.freqs
        ok = (fq > 60) & (fq < 2000)
        classe = np.round(12 * np.log2(np.maximum(fq, 1) / 440) + 69).astype(int) % 12
        M = np.zeros((12, len(fq)), np.float32)
        for c in range(12):
            M[c, ok & (classe == c)] = 1
        idx = np.clip((np.asarray(bornes) / DT).astype(int), 0, len(e.Hm) - 1)
        out = np.zeros((len(idx), 12), np.float32)
        for i in range(len(idx)):
            a, b = idx[i], idx[i + 1] if i + 1 < len(idx) else min(len(e.Hm), idx[i] + int(self.P / DT))
            if b > a:
                v = M @ e.Hm[a:b].mean(0)
                out[i] = v / (np.linalg.norm(v) + 1e-9)
        return out

    def _premier_temps(self, force=None):
        """Numéro du temps (dans self.temps) qui est le premier « 1 » : le décalage où les accents sont les plus forts."""
        if force is not None:
            k = int(np.argmin(np.abs(self.temps - force)))
            return k % self.mesure
        f = self._accents()
        notes = [f[d::self.mesure].mean() for d in range(self.mesure)]
        self.journal.append('accent selon le décalage de la mesure : ' + ', '.join(f'{v:.2f}' for v in notes))
        return int(np.argmax(notes))

    # ---- accès pratiques ----
    def case_de(self, t):
        return int(np.argmin(np.abs(self.cases - t)))

    def pos_mesure(self, k):
        """Position d'une case dans sa mesure (0 = premier temps), et numéro de la mesure."""
        par = self.mesure * self.div
        k2 = k - self.depart * self.div
        return k2 % par, k2 // par

    @property
    def phase(self):
        return float(self.temps[0])

    def resume(self):
        return {
            'bpm': round(self.bpm, 2), 'premier_temps': round(float(self.temps[self.depart]), 3),
            'grille': round(self.phase, 4), 'division': self.div, 'mesure': self.mesure,
            'stable': bool(self.stable), 'ecart_max_ms': round(self.ecart_max * 1000, 1),
            'tranches_nettes': self.nettes, 'tranches': len(self.derive),
        }
