"""Atelier de partitions, étape 1 : écouter le morceau.

À partir d'un fichier son (MP3, WAV…), on calcule :
  - les « frappes » (attaques) de la musique, séparées par familles :
      basse      = le grave (basse, grosse caisse)                      30 à 180 Hz
      caisse     = les coups secs sans hauteur (caisse claire, charley)  partie « percussive » au-dessus de 180 Hz
      accomp     = l'accompagnement (notes du bas-médium)                partie « harmonique » de 180 à 700 Hz
      melodie    = le chant (notes du médium-aigu)                       partie « harmonique » de 700 à 4500 Hz
  - pour chaque frappe : son moment exact, sa force dans chaque famille, la hauteur de la note qui vient d'être jouée.

Rien n'est écrit dans le dépôt : tout reste en mémoire ou dans le dossier de travail (/tmp/rythme/<id>/).
"""
import subprocess
import numpy as np
from scipy.ndimage import maximum_filter1d, median_filter, uniform_filter1d
from scipy.signal import find_peaks

SR = 22050          # échantillons par seconde après décodage
NFFT = 1024         # fenêtre d'analyse (46 ms)
HOP = 128           # une mesure toutes les 5,8 ms
DT = HOP / SR
FAMILLES = ('basse', 'caisse', 'accomp', 'melodie')


def decoder(chemin):
    """Le morceau en mono, 22 050 Hz (ffmpeg fait le décodage, comme le navigateur du téléphone)."""
    brut = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', chemin, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                          check=True, capture_output=True).stdout
    return np.frombuffer(brut, dtype=np.float32).copy()


def spectre(y):
    """Spectrogramme (images × fréquences). L'image i est centrée sur le temps i × DT."""
    y = np.concatenate([np.zeros(NFFT // 2, np.float32), y, np.zeros(NFFT, np.float32)])
    n = 1 + (len(y) - NFFT) // HOP
    w = np.hanning(NFFT).astype(np.float32)
    S = np.empty((n, NFFT // 2 + 1), np.float32)
    for a in range(0, n, 4096):                       # par blocs, pour ne pas remplir la mémoire sur un long morceau
        b = min(n, a + 4096)
        idx = np.arange(NFFT)[None, :] + HOP * np.arange(a, b)[:, None]
        S[a:b] = np.abs(np.fft.rfft(y[idx] * w, axis=1))
    return S


def separer(S):
    """Sépare ce qui dure (notes : lignes horizontales du spectrogramme) de ce qui claque (percussions : lignes
    verticales). Méthode classique des médianes (Fitzgerald 2010)."""
    H = median_filter(S, size=(17, 1))                # lissé dans le temps  -> les notes tenues
    P = median_filter(S, size=(1, 17))                # lissé en fréquence   -> les coups secs
    tot = H * H + P * P + 1e-12
    return S * (H * H / tot), S * (P * P / tot)


def flux(S, f0, f1, freqs):
    """Force des attaques dans une bande de fréquences : ce qui apparaît d'une image à l'autre (flux spectral).
    On compare à l'image d'il y a ~17 ms, élargie d'une case en fréquence, pour ne pas prendre un vibrato pour une frappe."""
    m = (freqs >= f0) & (freqs < f1)
    L = np.log1p(100 * S[:, m])
    ref = maximum_filter1d(L, 3, axis=1)
    lag = 3
    d = np.maximum(0, L[lag:] - ref[:-lag]).sum(1)
    return np.concatenate([np.zeros(lag, np.float32), d])


def relief(e, fenetre=1.5):
    """Enlève le niveau moyen local et ramène entre 0 et 1 : il ne reste que les pics (les attaques)."""
    n = max(3, int(fenetre / DT))
    e = np.maximum(0, e - uniform_filter1d(e, n))
    # échelle : le 99,5e centile (un seul énorme coup de cymbale ne doit pas écraser tout le reste)
    ref = np.percentile(e, 99.5) if e.any() else 1
    return np.minimum(1.5, e / (ref + 1e-9))


class Ecoute:
    """Tout ce qu'on a entendu dans le morceau."""

    def __init__(self, chemin):
        self.y = decoder(chemin)
        self.duree = len(self.y) / SR
        S = spectre(self.y)
        self.S = S
        self.freqs = np.fft.rfftfreq(NFFT, 1 / SR)
        self.temps = np.arange(S.shape[0]) * DT
        Hm, Pm = separer(S)
        f = self.freqs
        self.env = {
            'basse': relief(flux(S, 30, 180, f)),
            'caisse': relief(flux(Pm, 180, 11000, f)),
            'accomp': relief(flux(Hm, 180, 700, f)),
            'melodie': relief(flux(Hm, 700, 4500, f)),
        }
        # enveloppe générale (pour le tempo) : toutes les familles, chacune à égalité
        self.tout = sum(self.env.values()) / 4
        # volume (dB) et hauteur dominante au fil du temps
        self.volume = 10 * np.log10(uniform_filter1d((S * S).sum(1), int(.4 / DT)) + 1e-9)
        self.Hm = Hm
        self.frappes = self._frappes()

    def _frappes(self):
        """Liste des frappes : pour chaque famille on prend les pics, puis on réunit les pics simultanés (à 30 ms près)."""
        pics = []
        for nom in FAMILLES:
            e = self.env[nom]
            pk, pr = find_peaks(e, height=.06, distance=int(.07 / DT), prominence=.04)
            for i in pk:
                # moment précis : pic affiné par une parabole sur les 3 points voisins
                a, b, c = e[i - 1], e[i], e[min(i + 1, len(e) - 1)]
                d = .5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
                pics.append(((i + d) * DT, nom, float(b)))
        pics.sort()
        frappes, k = [], 0
        while k < len(pics):
            groupe = [pics[k]]
            while k + 1 < len(pics) and pics[k + 1][0] - groupe[0][0] < .03:
                k += 1
                groupe.append(pics[k])
            k += 1
            forces = {n: 0.0 for n in FAMILLES}
            for t, nom, v in groupe:
                forces[nom] = max(forces[nom], v)
            poids = sum(v for _, _, v in groupe)
            t = sum(t * v for t, _, v in groupe) / poids      # moment = moyenne pesée par la force
            fr = {'t': t - self.RETARD, 'force': min(1.0, max(forces.values())), **forces}
            fr['note'] = self.hauteur(t)
            frappes.append(fr)
        return frappes

    # Calage : le moment d'une frappe est celui du pic, moins RETARD.
    # Mesures du 16/11 : sur un son d'essai dont on connaît les frappes (essais/rendre_foret.js), le pic tombe 4 ms
    # après la vraie attaque ; mais la partition de Great Fairy's Fountain validée par Kiki (calée à la main le 08/11)
    # est 22 ms avant le pic (172 notes sur 172, de 15 à 30 ms). C'est ELLE la référence : tous les morceaux doivent
    # avoir le même calage qu'elle, sinon le réglage « décalage audio » du téléphone ne vaudrait que pour un morceau.
    RETARD = 0.022

    def hauteur(self, t):
        """Note (numéro MIDI) qui vient d'être frappée à l'instant t : le pic le plus fort de ce qui est apparu,
        entre 150 et 4500 Hz. None s'il n'y a pas de note nette (percussion seule)."""
        i = int(round(t / DT))
        apres = self.Hm[min(i + 4, len(self.Hm) - 1):min(i + 12, len(self.Hm))].mean(0) if i + 4 < len(self.Hm) else None
        if apres is None:
            return None
        avant = self.Hm[max(0, i - 14):max(1, i - 5)].mean(0)
        d = np.maximum(0, apres - avant)
        m = (self.freqs > 150) & (self.freqs < 4500)
        d = d * m
        if d.max() <= 1e-6 or d.max() < .15 * apres.max():
            return None
        # on privilégie la note la plus aiguë parmi les fortes (le chant est en haut)
        fort = np.where(d >= .5 * d.max())[0]
        j = fort[-1] if len(fort) else int(d.argmax())
        j = int(np.clip(j, 1, len(d) - 2))
        a, b, c = d[j - 1], d[j], d[j + 1]
        dec = .5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
        fq = (j + dec) * SR / NFFT
        return round(float(69 + 12 * np.log2(max(fq, 20) / 440)), 1)

    def force_a(self, t, famille=None, tol=.045):
        """Force de l'attaque la plus proche de t (à ±tol), 0 s'il n'y en a pas. Rend (force, écart en s)."""
        e = self.tout if famille is None else self.env[famille]
        i0, i1 = int((t + self.RETARD - tol) / DT), int((t + self.RETARD + tol) / DT) + 1
        i0, i1 = max(0, i0), min(len(e), i1)
        if i1 <= i0:
            return 0.0, 0.0
        j = i0 + int(e[i0:i1].argmax())
        return float(e[j]), j * DT - self.RETARD - t
