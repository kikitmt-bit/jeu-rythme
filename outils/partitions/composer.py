"""Atelier de partitions, étape 4 : écrire les 3 partitions (Facile, Normal, Expert).

Méthode validée par Kiki le 08/11 : on ne suit pas seulement la mélodie, on suit ce que fait l'instrument.
L'outil écrit comme la partition de Great Fairy's Fountain faite à la main :

  1. LA CELLULE. Dans chaque section on cherche où la musique frappe toujours : les positions les plus fortes de la
     mesure sont les « accents » (le chant), les suivantes la « pulsation ». Une cellule va d'un accent au suivant.
     Chaque cellule se joue à l'un de ces niveaux :
        0 = l'accent seul            1 = accent + pulsation            2 = cascade (toutes les frappes de la cellule)
     La densité visée (qui monte puis redescend au fil du morceau) décide du mélange ; les cascades vont aux
     cellules où la musique est la plus chargée.
  2. LA PHRASE (3 à 6 secondes). Chaque phrase a un début et une fin :
        début : une double (si le grave et le chant frappent ensemble) ou un glissé dans le sens de la mélodie ;
        fin   : une tenue lâchée sur l'accent suivant (la cellule d'après repart donc sur la pulsation),
                parfois avec une tape de l'autre pouce au milieu.
     Chaque section a sa formule (début et/ou fin), qui change d'une section à l'autre et d'une reprise à l'autre.
  3. LES PISTES. Le chant suit la hauteur des notes (aigu en haut) ; la pulsation se met juste en dessous ;
     les cascades descendent (ou montent) en escalier.

Les 3 difficultés sont 3 partitions différentes :
  Facile : les accents, taper / tenir / quelques flèches droites, jamais deux notes ensemble ;
  Normal : accents + pulsation, cascades aux moments forts, doubles, flèches en diagonale, tenue + tape ;
  Expert : cascades presque partout, doubles et doubles flèches, tenues accompagnées par l'autre pouce.
"""
import random
import numpy as np
import confort
from confort import REGLES, PILE

# ce que vise chaque difficulté
VISEE = {
    # dens : notes par seconde, du passage le plus calme au sommet du morceau
    # formules : (début de phrase, fin de phrase), de la section la plus calme à la plus intense
    #   début : None (simple), 'glisse', 'double', 'mixte' (une double, un glissé, une double…)
    #   fin   : None, 'fin' (tenue sur le dernier accent, lâchée sur le premier de la phrase suivante),
    #           'avant' (tenue sur l'avant-dernier accent, puis la pulsation), 'glisse' (glissé sur le dernier accent) ;
    #           deux valeurs entre parenthèses = une phrase sur deux
    'facile': dict(dens=(1.0, 1.45), part_glisses=.07, seuil_double=9, tape=9, pistes_chant=(0, 3),
                   formules=[(None, 'fin'), ('glisse', None), (None, ('avant', None)), ('glisse', ('fin', None))]),
    'normal': dict(dens=(2.0, 3.8), part_glisses=.10, seuil_double=.3, tape=.5, pistes_chant=(1, 3),
                   formules=[(None, 'fin'), ('glisse', 'fin'), ('mixte', (None, 'glisse')), ('double', 'avant'), ('mixte', ('avant', 'glisse'))]),
    'expert': dict(dens=(3.2, 5.4), part_glisses=.12, seuil_double=.15, tape=0, pistes_chant=(1, 3),
                   formules=[('glisse', ('fin', None)), ('mixte', ('fin', 'glisse')), ('mixte', ('avant', None)), ('mixte', ('avant', 'glisse'))]),
}
POIDS = {'melodie': 1.0, 'accomp': .6, 'basse': .5, 'caisse': .5}   # ce qu'on a le plus envie de taper


class Matiere:
    """La musique rangée case par case : pour chaque case de la grille, la frappe réelle qui s'y trouve (ou rien)."""

    def __init__(self, ecoute, grille, sections):
        self.e, self.g, self.s = ecoute, grille, sections
        g = grille
        case = float(np.median(np.diff(g.cases)))
        self.case = case
        tol = min(.05, .32 * case)
        fr = ecoute.frappes
        tf = np.array([f['t'] for f in fr])
        champs = ('force', 'basse', 'caisse', 'accomp', 'melodie', 'note')
        ev, pris = [], set()
        for k, t in enumerate(g.cases):
            j = np.where(np.abs(tf - t) <= tol)[0]
            if not len(j):
                continue
            j = j[np.argmax([fr[i]['force'] for i in j])]
            f = fr[j]
            if f['force'] < .08:
                continue
            pris.add(int(j))
            pos, mes = g.pos_mesure(k)
            # la note est posée sur la grille ; si la musique s'en écarte nettement (jeu libre), sur la vraie frappe
            tn = float(t) if abs(f['t'] - t) < .022 else float(f['t'])
            ev.append({'t': tn, 'k': k, 'pos': int(pos), 'mes': int(mes), 'grille': True, **{c: f[c] for c in champs}})
        # frappes fortes hors de la grille (passages en rythme libre) : gardées à part
        for j, f in enumerate(fr):
            if j not in pris and f['force'] >= .2:
                k = g.case_de(f['t'])
                pos, mes = g.pos_mesure(k)
                ev.append({'t': float(f['t']), 'k': k, 'pos': None, 'mes': int(mes), 'grille': False, **{c: f[c] for c in champs}})
        ev = [x for x in ev if sections.debut - .05 <= x['t'] <= sections.fin - .4]
        ev.sort(key=lambda x: x['t'])
        for x in ev:
            x['sec'] = sections.de(x['t'])
            x['w'] = min(1.6, max(POIDS[c] * x[c] for c in POIDS) + .25 * sum(POIDS[c] * x[c] for c in POIDS))
        self.ev = ev
        self.par = g.mesure * g.div
        # rythme libre ? (par section : part des frappes fortes qui tombent hors de la grille)
        for i, s in enumerate(sections.liste):
            dans = [x for x in ev if x['sec'] == i]
            hors = sum(x['w'] for x in dans if not x['grille'])
            s['libre'] = bool(dans) and hors > .45 * sum(x['w'] for x in dans)
        dm = float(np.median(np.diff(sections.t_mesures)))
        self.duree_mesure = dm
        # phrase : le nombre de mesures qui dure de 3 à 6,5 s (là où l'on respire)
        self.phrase = next((n for n in (1, 2, 4, 8) if 3 <= n * dm <= 6.5), 2 if dm > 3 else 4)


def courbe(x):
    """La cloche de la difficulté selon l'avancement dans le morceau (0 = début, 1 = fin) :
    ça monte jusqu'aux trois quarts, puis ça redescend."""
    return float(np.interp(x, [0, .12, .45, .72, .88, 1], [.1, .35, .7, 1, .45, .1]))


def arc_des_sections(sections, plan=None):
    """Pour chaque section, un nombre de 0 (calme) à 1 (sommet) : l'intensité de la musique et la cloche."""
    L = sections.liste
    t0, t1 = L[0]['t0'], L[-1]['t1']
    # si toutes les sections sonnent aussi fort (Great Fairy's Fountain), c'est la cloche qui fait la forme ;
    # si la musique a de vrais creux et de vrais sommets, on la suit davantage
    coeur = [s['intensite'] for s in L[1:-1]] or [s['intensite'] for s in L]
    part = float(np.clip((max(coeur) - min(coeur)) / .5, .15, .6))
    arcs = []
    for i, s in enumerate(L):
        x = ((s['t0'] + s['t1']) / 2 - t0) / max(1, t1 - t0)
        a = part * s['intensite'] + (1 - part) * courbe(x)
        if s['passage'] > 1:
            a += .06                                   # une reprise est un peu plus corsée que la première fois
        if i == len(L) - 1 and len(L) > 2:
            a = min(a, .25)                            # la fin redescend
        arcs.append(float(a))
    # on étale entre 0 et 1 pour que le morceau ait toujours un vrai calme et un vrai sommet
    lo, hi = min(arcs), max(arcs)
    if hi - lo > .15:
        arcs = [(a - lo) / (hi - lo) for a in arcs]
    for i, s in enumerate(L):                          # réglage à la main dans la fiche du morceau
        r = (plan or {}).get(s['nom'], {})
        arcs[i] = float(np.clip(r.get('arc', arcs[i]) + r.get('plus', 0), 0, 1))
    return arcs


ENERGIE_REFERENCE = 10.8      # Great Fairy's Fountain (voir Sections.energie)


def allure(energie):
    return float(np.clip((energie / ENERGIE_REFERENCE) ** .6, .7, 1.3))


class Partition:
    def __init__(self, matiere, dif, graine=1, plan=None):
        self.m, self.dif, self.R, self.V = matiere, dif, REGLES[dif], VISEE[dif]
        self.rnd = random.Random(f'{graine}-{dif}')
        self.plan = plan or {}
        self.arcs = arc_des_sections(matiere.s, self.plan.get('sections'))
        self.marques = [q for q in self.plan.get('marques', []) if q.get('dif') == dif and not q.get('ignore')]
        self.journal = []
        # l'allure du morceau : un morceau calme donne des partitions plus calmes dans les 3 modes, un morceau déchaîné
        # des partitions plus chargées (référence : Great Fairy's Fountain = 1). Le Facile reste sous 1,5 note/s.
        self.allure = allure(matiere.s.energie)
        if dif == 'facile':
            self.allure = min(1.25, max(.85, self.allure))    # (le Facile reste facile : 1,8 note/s au plus)
        cellules = self._cellules()
        self._eclaircir(cellules)
        self._figures(cellules)
        self._niveaux(cellules)
        notes = self._notes(cellules)
        self.notes = self._reparer(notes)

    # ------------------------------------------------------------------ 1. les cellules
    def _profil(self, i):
        """Où la musique frappe-t-elle d'habitude dans la mesure, pour la section i ? Rend une préférence de 0 à 1 par
        position (les positions solides : premier temps > milieu de mesure > temps > demi-temps comptent un peu plus)."""
        m, sec = self.m, self.m.s.liste[i]
        par, div = m.par, m.g.div
        profil, compte = np.zeros(par), np.zeros(par)
        nb_mes = max(1, sec['m1'] - sec['m0'])
        for x in m.ev:
            if x['sec'] == i and x['grille']:
                profil[x['pos']] += x['w']
                compte[x['pos']] += 1
        profil /= nb_mes
        presence = np.minimum(1, compte / nb_mes)
        metrique = np.array([.3 if p == 0 else .22 if p * 2 == par else .15 if p % div == 0 else .05 if (2 * p) % div == 0 else 0 for p in range(par)])
        note = profil * (.5 + .5 * presence) + metrique * (profil.max() + 1e-9)
        return note / (note.max() + 1e-9)

    def _espacer(self, evs, garder=()):
        """Garde les frappes les plus fortes en respectant l'écart minimum de la difficulté."""
        ecart = self.R['ecart']
        pris = [x for x in evs if any(x is g for g in garder)]
        for x in sorted(evs, key=lambda x: -x['w']):
            if any(x is p for p in pris):
                continue
            if all(abs(x['t'] - p['t']) >= ecart - 1e-3 for p in pris):
                pris.append(x)
        return sorted(pris, key=lambda x: x['t'])

    def _cellules(self):
        """Découpe chaque section en cellules. Dans chaque mesure on choisit les accents : les frappes les plus fortes
        (avec une préférence pour les positions où la musique frappe d'habitude), au plus ~1,45 par seconde et à
        0,36 s au moins l'une de l'autre. Une harpe régulière donne toujours les mêmes positions ; un chant libre
        donne son propre rythme. Une cellule va d'un accent au suivant."""
        m, cellules = self.m, []
        div = m.g.div
        for i, sec in enumerate(m.s.liste):
            dans = [x for x in m.ev if x['sec'] == i and (x['grille'] or sec['libre'])]
            if not dans:
                continue
            pref = self._profil(i)
            vise = self._densite(i)
            ref = float(np.percentile([x['w'] for x in dans], 75)) + 1e-9
            facile_temps = self.dif == 'facile' and not sec['libre']
            for x in dans:
                # envie d'en faire un accent : sa force, et la préférence de sa position ; envie d'en faire une note de
                # pulsation : surtout sa position (une pulsation doit rester régulière)
                p = pref[x['pos']] if x['pos'] is not None else .5
                x['_envie'] = min(1.4, x['w'] / ref) + p
                x['_pouls'] = .4 * min(1.4, x['w'] / ref) + 1.2 * p
            # tranches : les mesures (ou des demi-mesures de temps en rythme libre)
            if sec['libre']:
                pas = max(1.4, m.duree_mesure)
                tranches = [(t, min(sec['t1'], t + pas)) for t in np.arange(sec['t0'], sec['t1'] - 1e-6, pas)]
            else:
                tranches = [(m.s.t_mesures[me], m.s.t_mesures[me + 1]) for me in range(sec['m0'], sec['m1'])]
            accents = []
            for a, b in tranches:
                evs = [x for x in dans if a - 1e-6 <= x['t'] < b - 1e-6]
                if facile_temps:
                    sur_temps = [x for x in evs if x['pos'] is not None and x['pos'] % div == 0]
                    evs = sur_temps or evs
                # Facile : au plus ~1,45 accent par seconde ; Normal et Expert : ~1,6 (un par temps sur un morceau posé)
                nb = max(1, int(1.45 * (b - a) + .05) if self.dif == 'facile' else int(round(1.6 * (b - a))))
                pris = []
                for x in sorted(evs, key=lambda x: -x['_envie']):
                    if len(pris) >= nb:
                        break
                    if x['w'] < .4 * ref and pris:
                        continue                                   # pas d'accent faible s'il y en a déjà un vrai
                    if all(abs(x['t'] - y['t']) >= .36 - 1e-3 for y in pris + accents[-1:]):
                        pris.append(x)
                accents += sorted(pris, key=lambda x: x['t'])
            if not accents:
                continue
            # cellules : d'un accent au suivant (la première commence au début de la section)
            sec_cells = []
            bornes = [sec['t0'] - 1e-3] + [x['t'] for x in accents[1:]] + [sec['t1']]
            if accents[0]['t'] - sec['t0'] > .36 and any(x['t'] < accents[0]['t'] - .17 for x in dans):
                bornes = [sec['t0'] - 1e-3, accents[0]['t']] + bornes[1:]
                accents = [None] + accents
            for acc, a, b in zip(accents, bornes, bornes[1:]):
                evs = [x for x in dans if a - 1e-6 <= x['t'] < b - 1e-6]
                if facile_temps:
                    evs = [x for x in evs if x is acc or (x['pos'] is not None and x['pos'] % div == 0)]
                if not evs:
                    continue
                t0 = acc['t'] if acc is not None else evs[0]['t']
                n0 = [acc] if acc is not None else []
                # niveau 1 : la pulsation = les meilleures frappes entre deux accents, à 0,17 s au moins des accents et
                # à 0,3 s au moins entre elles (une par tranche de ~0,6 s de cellule) ; + les frappes vraiment fortes
                libres = [x for x in evs if x is not acc and x['t'] - t0 >= max(.17, self.R['ecart']) - 1e-3 and b - x['t'] >= max(.17, self.R['ecart']) - 1e-3]
                # combien de notes de pulsation ? assez pour approcher la densité visée dans cette section (au moins une
                # par cellule de plus d'une demi-seconde) : un morceau aux accents espacés reçoit une pulsation plus fournie
                nb_pul = int(np.clip(round(.85 * vise * (b - t0)) - 1, 1 if b - t0 >= .5 else 0, 4))
                if self.dif == 'facile':
                    nb_pul = min(nb_pul, 1)
                pul = []
                for x in sorted(libres, key=lambda x: -x['_pouls']):
                    if len(pul) < nb_pul or x['w'] >= 1.25 * ref:
                        if all(abs(x['t'] - y['t']) >= max(.3, self.R['ecart']) - 1e-3 for y in pul):
                            pul.append(x)
                if acc is None and not pul and evs:
                    pul = [max(evs, key=lambda x: x['w'])]
                n1 = sorted(n0 + pul, key=lambda x: x['t'])
                n2 = self._espacer(evs, n1)
                me = acc['mes'] if acc is not None else evs[0]['mes']
                sec_cells.append({'t0': float(t0), 't1': float(b), 'acc': acc, 'evs': evs, 'mes': me, 'n': [n0, n1, n2],
                                  'sec': i, 'niveau': 0, 'fig': None, 'energie': sum(x['w'] for x in evs)})
            # phrases : par blocs de m.phrase mesures depuis le début de la section
            for c in sec_cells:
                c['phrase'] = (i, max(0, c['mes'] - sec['m0']) // m.phrase)
            cellules += sec_cells
            pos = {}
            for c in sec_cells:
                if c['acc'] is not None and c['acc']['pos'] is not None:
                    pos[c['acc']['pos']] = pos.get(c['acc']['pos'], 0) + 1
            hab = ' '.join(f'{p}×{n}' for p, n in sorted(pos.items(), key=lambda kv: -kv[1])[:5])
            self.journal.append(f"{sec['nom']} : {len(sec_cells)} cellules · accents aux positions {hab}{' · rythme libre' if sec['libre'] else ''}")
        for j, c in enumerate(cellules):
            c['j'] = j
        return cellules

    # ------------------------------------------------------------------ 2. la densité : niveau de chaque cellule
    def _densite(self, i):
        lo, hi = self.V['dens']
        d = (lo + (hi - lo) * self.arcs[i]) * self.allure
        r = (self.plan.get('sections') or {}).get(self.m.s.liste[i]['nom'], {}).get(self.dif)
        return d * (r if r else 1)

    def _trop_dur(self, t):
        """Kiki a marqué « trop dur » près de cet instant (de 3 s avant la marque à 1 s après)."""
        return any(q['quoi'] == 'trop-dur' and q['t'] - 3 <= t <= q['t'] + 1 for q in self.marques)

    def _eclaircir(self, cellules):
        """Avant tout : s'il y a trop de notes même en ne jouant que les accents (Facile sur un morceau rapide), on ne
        garde, dans les phrases les plus calmes, que l'accent le plus fort de la mesure (deux fois plus lent, régulier)."""
        for i, sec in enumerate(self.m.s.liste):
            cs = [c for c in cellules if c['sec'] == i]
            if not cs:
                continue
            but = self._densite(i) * max(1.0, cs[-1]['t1'] - cs[0]['t0'])
            compte = lambda: sum(len(c['n'][0]) for c in cs if c['niveau'] >= 0)
            if compte() <= but * 1.2:
                continue
            # dans les phrases les plus calmes, un accent sur deux (le plus faible de chaque paire) est retiré
            phrases = {}
            for c in cs:
                phrases.setdefault(c['phrase'], []).append(c)
            for cle in sorted(phrases, key=lambda k: sum(c['energie'] for c in phrases[k]) / len(phrases[k])):
                if compte() <= but * 1.15:
                    break
                ph = [c for c in phrases[cle] if c['n'][0]]
                for a, b in zip(ph[::2], ph[1::2]):
                    faible = a if a['n'][0][0]['_envie'] < b['n'][0][0]['_envie'] else b
                    faible['niveau'] = -1

    def _joue(self, c, niveau=None):
        """Nombre de notes que donnera la cellule à ce niveau (son accent ne compte pas s'il est pris par un lâcher)."""
        niveau = c['niveau'] if niveau is None else niveau
        if niveau < 0:
            return 0
        return len(c['n'][niveau]) - (1 if c.get('lache') and c['n'][0] else 0)

    def _niveaux(self, cellules):
        """Après les figures : le niveau de chaque cellule (0 accent, 1 pulsation, 2 cascade) pour tenir la densité
        visée. D'abord la pulsation partout, puis les cascades là où la musique est la plus chargée."""
        m = self.m
        for i, sec in enumerate(m.s.liste):
            cs = [c for c in cellules if c['sec'] == i]
            if not cs:
                continue
            but = self._densite(i) * max(1.0, cs[-1]['t1'] - cs[0]['t0'])
            for c in cs:
                if c['niveau'] >= 0:
                    c['niveau'] = max(c['niveau'], min(c.get('plancher', 0), c.get('plafond', 2)))
            compte = lambda: sum(self._joue(c) for c in cs)
            for niv in (1, 2):
                cand = [c for c in cs if 0 <= c['niveau'] < niv <= c.get('plafond', 2) and len(c['n'][niv]) > len(c['n'][c['niveau']])
                        and not self._trop_dur(c['t0'])]
                gain = lambda c: sum(x['w'] for x in c['n'][niv] if not any(x is y for y in c['n'][c['niveau']])) / (len(c['n'][niv]) - len(c['n'][c['niveau']]))
                for c in sorted(cand, key=lambda c: -(gain(c) + .1 * self.rnd.random())):
                    if niv == 2 and c['niveau'] == 0 and len(c['n'][1]) > len(c['n'][0]):
                        continue                                   # (on ne saute pas la pulsation)
                    if compte() + len(c['n'][niv]) - len(c['n'][c['niveau']]) > but + .5:
                        continue
                    c['niveau'] = niv
            self.journal.append(f"   {sec['nom']} : visé {self._densite(i):.2f}/s → niveaux {''.join('·' if c['niveau'] < 0 else str(c['niveau']) for c in cs)}")

    # ------------------------------------------------------------------ 3. les figures : début et fin de phrase
    def _voix(self, x):
        """Deux voix frappent-elles ensemble ? (le grave et le chant)"""
        return min(x['basse'], max(x['melodie'], x['accomp']))

    def _figures(self, cellules):
        m, R, V = self.m, self.R, self.V
        tmin, tmax = R['tenue']
        phrases = {}
        for c in cellules:
            phrases.setdefault(c['phrase'], []).append(c)
        cles = sorted(phrases)
        formules = V['formules']
        fin_prec = False          # la phrase d'avant finit-elle par une tenue lâchée sur notre premier accent ?
        alterne = 0
        self.formule = {}
        for cle in cles:
            i = cle[0]
            ph = [c for c in phrases[cle] if c['niveau'] >= 0 and c['n'][0]]
            sec = m.s.liste[i]
            # la formule de la section : elle tourne d'une section à l'autre, et une reprise prend la suivante
            if i not in self.formule:
                # du calme (première formule) à l'intense (dernière) ; une reprise prend la suivante ; jamais la même
                # formule que la section d'avant
                rang = min(len(formules) - 1, int(self.arcs[i] * len(formules)) + (sec['passage'] - 1))
                if self.formule and formules[rang] == list(self.formule.values())[-1]:
                    rang = rang - 1 if rang else rang + 1
                self.formule[i] = formules[rang]
                self.journal.append(f"   {sec['nom']} : formule début = {formules[rang][0]}, fin = {formules[rang][1]}")
            debut, fin = self.formule[i]
            if isinstance(fin, tuple):
                fin = fin[cle[1] % len(fin)]                     # une phrase sur deux
            consomme = fin_prec
            fin_prec = False
            if len(ph) < 2:
                continue
            trop_dur = self._trop_dur(ph[0]['t0']) or self._trop_dur(ph[-1]['t0'])
            # ---- fin de phrase : la tenue (ou un glissé sur le dernier accent) ----
            if fin in ('fin', 'avant') and not (trop_dur and fin == 'avant'):
                cible = ph[-1] if fin == 'fin' else ph[-2] if len(ph) >= 3 else None
                if cible is not None:
                    acc = cible['n'][0][0]
                    # la tenue se lâche sur l'accent suivant (au besoin celui d'après, si c'est trop court)
                    suite = [c for c in cellules[cible['j'] + 1:cible['j'] + 4] if c['n'][0] and c['niveau'] >= 0]
                    fins = [c for c in suite if tmin - 1e-3 <= c['n'][0][0]['t'] - acc['t'] <= min(tmax, 3.2)]
                    if fins:
                        but = fins[0]
                        cible['fig'], cible['fin'] = 'tenue', but['n'][0][0]['t']
                        for c in cellules[cible['j'] + 1:but['j'] + 1]:
                            c['lache'] = True                      # son accent est joué par le lâcher (ou sauté)
                        if self.dif != 'facile':
                            but['plancher'] = 1                    # … et sa cellule repart sur la pulsation
                        if self.dif == 'normal':
                            cible['plafond'] = but['plafond'] = 1
                        if but['phrase'] != cle:
                            fin_prec = True
            elif fin == 'glisse' and not trop_dur and ph[-1]['n'][0][0]['note'] is not None and len(ph) >= 3:
                ph[-1]['fig'] = 'glisse'
                if self.dif == 'normal':
                    ph[-1]['plafond'] = 1
            # ---- début de phrase : double ou glissé ----
            if debut and not consomme and ph[0]['fig'] is None and not ph[0].get('lache') and not trop_dur:
                x = ph[0]['n'][0][0]
                sorte = debut
                if sorte == 'mixte':
                    sorte = 'double' if alterne % 2 == 0 else 'glisse'
                    alterne += 1
                if sorte == 'double' and (not R['doubles'] or self.arcs[i] < V['seuil_double'] or self._voix(x) < .2):
                    sorte = 'glisse'
                if sorte == 'glisse' and x['note'] is None:
                    sorte = None
                if self.dif == 'facile' and sorte == 'glisse' and cle[1] % 2:
                    sorte = None                                   # en Facile : une phrase sur deux
                if sorte:
                    ph[0]['fig'] = sorte
                    if self.dif == 'normal':
                        ph[0]['plafond'] = 1                       # une double ou un glissé, puis la pulsation
        # ---- la musique tient vraiment une note (morceaux lents) : tenue, où que ce soit dans la phrase ----
        for c in cellules:
            if c['fig'] or c.get('lache') or c['niveau'] < 0 or not c['n'][0] or self._trop_dur(c['t0']):
                continue
            acc = c['n'][0][0]
            suiv = next((d for d in cellules[c['j'] + 1:c['j'] + 3] if d['n'][0] and d['niveau'] >= 0), None)
            if suiv is None or suiv['fig'] or suiv.get('lache'):
                continue
            fin = suiv['n'][0][0]['t']
            vide = not any(acc['t'] + .1 < x['t'] < fin - .1 and x['w'] >= .35 for x in m.ev)
            if vide and max(1.0, tmin) <= fin - acc['t'] <= min(tmax, 3.2) and self._melodie(acc):
                prec = cellules[c['j'] - 1] if c['j'] else None
                if prec is not None and (prec['fig'] == 'tenue' or prec.get('lache')):
                    continue
                c['fig'], c['fin'] = 'tenue', fin
                suiv['lache'] = True
        # ---- glissés en plus, sur les grands sauts du chant, jusqu'à la part visée ----
        total = sum(self._densite(i) * (sec['t1'] - sec['t0']) for i, sec in enumerate(m.s.liste) if any(c['sec'] == i for c in cellules))
        but = int(round(V['part_glisses'] * total)) - sum(1 for c in cellules if c['fig'] == 'glisse')
        libres = [c for c in cellules if c['fig'] is None and not c.get('lache') and c['niveau'] >= 0 and c['n'][0] and c['n'][0][0]['note'] is not None
                  and not self._trop_dur(c['t0'])]
        chant = [c for c in cellules if c['niveau'] >= 0 and c['n'][0] and c['n'][0][0]['note'] is not None]
        rang = {c['j']: k for k, c in enumerate(chant)}
        def saut(c):
            k = rang[c['j']]
            n = c['n'][0][0]['note']
            return max(abs(n - chant[k - 1]['n'][0][0]['note']) if k else 0, abs(chant[k + 1]['n'][0][0]['note'] - n) if k + 1 < len(chant) else 0)
        duree = max(1, cellules[-1]['t1'] - cellules[0]['t0']) if cellules else 1
        espace = max(1.2, .5 * duree / max(1, V['part_glisses'] * total))
        for c in sorted(libres, key=lambda c: -(saut(c) + 2 * c['n'][0][0]['w'] + self.rnd.random())):
            if but <= 0:
                break
            if any(d['fig'] in ('glisse', 'double') and abs(d['t0'] - c['t0']) < espace for d in cellules):
                continue
            prec = cellules[c['j'] - 1] if c['j'] else None
            if prec is not None and (prec['fig'] == 'tenue' or prec.get('lache')):
                continue
            c['fig'] = 'glisse'
            if self.dif == 'normal':
                c['plafond'] = 1
            but -= 1
        # ---- Expert : des doubles en plus sur les accents où deux voix frappent, et quelques doubles glissés ----
        if self.dif == 'expert':
            for c in cellules:
                if c['fig'] is None and not c.get('lache') and c['niveau'] >= 0 and c['n'][0] and self.arcs[c['sec']] >= .3:
                    x = c['n'][0][0]
                    prec = cellules[c['j'] - 1] if c['j'] else None
                    if self._voix(x) >= .45 and x['pos'] == 0 and not (prec is not None and (prec['fig'] in ('tenue', 'double') or prec.get('lache'))):
                        c['fig'] = 'double'
            vus = set()
            for c in cellules:
                if c['fig'] == 'glisse' and self.arcs[c['sec']] >= .6 and c['sec'] not in vus and self._voix(c['n'][0][0]) >= .2:
                    c['fig'] = 'double-glisse'
                    vus.add(c['sec'])
        # sens des glissés : là où va la mélodie
        k, passes, cote = 0, [], 0
        for c in cellules:
            if c['fig'] not in ('glisse', 'double-glisse'):
                continue
            j = rang.get(c['j'])
            n = c['n'][0][0]['note']
            apres = chant[j + 1]['n'][0][0]['note'] if j is not None and j + 1 < len(chant) and chant[j + 1]['t0'] - c['t0'] < 2 * m.duree_mesure else None
            avant = chant[j - 1]['n'][0][0]['note'] if j else None
            d = (apres - n) if apres is not None else (n - avant) if avant is not None else 0
            if R['diagonales']:
                sens = 'u' if d >= 4.5 else 'ur' if d >= .8 else 'r' if d > -.8 else 'dr' if d > -4.5 else 'd'
            else:
                sens = 'u' if d >= .8 else 'd' if d <= -.8 else 'r'
            if 'r' in sens:                                      # le côté alterne (droite, gauche), pour varier
                cote += 1
                if cote % 2 == 0:
                    sens = sens.replace('r', 'l')
            if len(passes) >= 2 and passes[-1] == passes[-2] == sens:
                # jamais trois fois de suite le même geste : le troisième part sur le côté
                sens = ('l' if k % 2 else 'r') if len(sens) == 1 else sens[0]
            passes.append(sens)
            c['sens'] = sens
            k += 1

    def _melodie(self, x):
        return x['melodie'] >= .25 or (x['note'] is not None and x['w'] >= .5)

    # ------------------------------------------------------------------ 4. les notes et leurs pistes
    def _etage(self, x, chant_h, chant_t):
        """Piste du chant : la hauteur de la note parmi celles des 8 secondes autour (aigu en haut)."""
        lo_p, hi_p = self.V['pistes_chant']
        if x['note'] is None:
            return None
        sel = chant_h[(chant_t > x['t'] - 8) & (chant_t < x['t'] + 8)]
        if len(sel) < 4:
            sel = chant_h
        lo, hi = np.percentile(sel, 6), np.percentile(sel, 94)
        if hi - lo < 3:
            c = (hi + lo) / 2
            lo, hi = c - 1.5, c + 1.5
        nb = hi_p - lo_p + 1
        return int(np.clip(lo_p + np.floor((x['note'] - lo) / (hi - lo) * nb), lo_p, hi_p))

    def _notes(self, cellules):
        m, R, V = self.m, self.R, self.V
        accs = [c['n'][0][0] for c in cellules if c['n'][0] and c['n'][0][0]['note'] is not None]
        chant_h = np.array([x['note'] for x in accs] or [60.0])
        for q in range(len(accs)):
            vois = chant_h[max(0, q - 2):q + 3]
            if abs(chant_h[q] - np.median(vois)) > 9:
                chant_h[q] = np.median(vois)
                accs[q]['note'] = float(chant_h[q])
        chant_t = np.array([x['t'] for x in accs] or [0.0])
        notes, paire = [], 0
        piste_prec, tenue_en_cours = 2, None                     # (fin, piste) de la tenue qui court encore
        for c in cellules:
            if c['niveau'] < 0:
                continue
            evs = list(c['n'][c['niveau']])
            acc = c['n'][0][0] if c['n'][0] else None
            if c.get('lache') and acc is not None:
                evs = [x for x in evs if x is not acc]
            if not evs:
                continue
            # piste de l'accent
            la = self._etage(acc, chant_h, chant_t) if acc is not None else None
            if la is None:
                la = piste_prec
            piste_prec = la
            reste = [x for x in evs if x is not acc]
            # les autres notes de la cellule : juste en dessous du chant ; une cascade fait l'escalier
            pistes = {}
            if len(reste) >= 2 and c['niveau'] == 2:
                h = [x['note'] for x in [acc] + reste if x is not None and x['note'] is not None] if acc is not None else [x['note'] for x in reste if x['note'] is not None]
                monte = len(h) >= 2 and h[-1] > h[0] + .5
                n = len(reste) + (1 if acc is not None and not c.get('lache') else 0)
                if monte:
                    depart = min(la, 3 - (n - 1)) if n <= 4 else 0
                    suite = [(max(0, depart) + q) % 4 for q in range(n)]
                else:
                    depart = max(la, n - 1) if n <= 4 else 3
                    suite = [(min(3, depart) - q) % 4 for q in range(n)]
                if acc is not None and not c.get('lache'):
                    la = suite[0]
                    suite = suite[1:]
                for x, l in zip(reste, suite):
                    pistes[id(x)] = l
            else:
                for q, x in enumerate(reste):
                    plus_haut = x['note'] is not None and acc is not None and acc['note'] is not None and x['note'] > acc['note'] + 2
                    l = la + 1 if (plus_haut and la < 3) or la == 0 else la - 1
                    if q and len(reste) > 1:
                        l = l - 1 if l > 0 else l + 2
                    pistes[id(x)] = int(np.clip(l, 0, 3))
            for x in sorted(evs, key=lambda x: x['t']):
                est_acc = x is acc
                l = la if est_acc else pistes.get(id(x), max(0, la - 1))
                n = {'y': 't', 't': round(x['t'], 4), 'l': int(l), '_w': x['w'], '_acc': est_acc}
                fig = c['fig'] if est_acc else None
                if fig == 'tenue':
                    n['y'], n['e'] = 'h', round(c['fin'], 4)
                elif fig in ('glisse', 'double-glisse'):
                    n['y'], n['d'] = 's', c['sens']
                if tenue_en_cours and x['t'] < tenue_en_cours[0] + .3 and n['l'] == tenue_en_cours[1]:
                    n['l'] = n['l'] - 1 if n['l'] > 0 else 1         # on ne passe pas sur la piste d'une tenue
                if fig in ('double', 'double-glisse'):
                    haut = max(n['l'], 2)
                    bas = 0 if haut == 2 or paire % 2 == 0 else 1
                    jumelle = dict(n)
                    n['l'], jumelle['l'] = bas, haut
                    n['p'] = jumelle['p'] = paire
                    paire += 1
                    notes += [n, jumelle]
                else:
                    notes.append(n)
                if n['y'] == 'h':
                    tenue_en_cours = (n['e'], n['l'])
        # pendant une tenue : rien en Facile ; une tape de l'autre pouce vers le milieu en Normal (aux moments forts) ;
        # la pulsation continue en Expert
        tenues = [n for n in notes if n['y'] == 'h']
        out = []
        for n in notes:
            h = next((h for h in tenues if h is not n and h['t'] - PILE < n['t'] < h['e'] + PILE), None)
            if h is None:
                out.append(n)
                continue
            if abs(n['t'] - h['e']) < PILE or abs(n['t'] - h['t']) < PILE or not R['pendant_tenue'] or n['y'] != 't' or n.get('p') is not None:
                continue
            if self.dif == 'normal':
                sec = self.m.s.de(h['t'])
                milieu = abs((n['t'] - h['t']) - (h['e'] - n['t'])) <= .34 * (h['e'] - h['t'])
                if self.arcs[sec] < V['tape'] or h.get('_tape') or not milieu or self._trop_dur(h['t']):
                    continue
                h['_tape'] = True
            elif self._trop_dur(h['t']):
                continue
            out.append(n)
        return out

    # ------------------------------------------------------------------ 5. réparation
    def _reparer(self, notes):
        """Passe la vérification du confort et corrige tant qu'il reste un souci : une figure mal placée redevient une
        note simple ; sinon la note la moins importante des deux est retirée."""
        notes.sort(key=lambda n: (n['t'], n['l']))
        for tour in range(600):
            propres = [{k: v for k, v in n.items() if not k.startswith('_')} for n in notes]
            soucis = [s for s in confort.verifier(propres, self.dif)['soucis'] if s[0] > 0 and 'chargé' not in s[1]]
            if not soucis:
                break
            t, quoi = soucis[0]
            fautives = [n for n in notes if abs(n['t'] - t) < 1e-3] or [n for n in notes if n['y'] == 'h' and abs(n['e'] - t) < 1e-3]
            if not fautives:
                break
            f = fautives[0]
            avant = [n for n in notes if n['t'] < f['t'] - 1e-3]
            prec = avant[-1] if avant else None
            if f.get('p') is not None and ('double' in quoi or 'trois doigts' in quoi):
                for n in [n for n in notes if n.get('p') == f['p'] and n is not f]:
                    notes.remove(n)
                del f['p']
            elif f['y'] == 's' and 'glissé' in quoi:
                f['y'] = 't'
                del f['d']
            elif f['y'] == 'h' and 'tenue de' in quoi:
                f['y'] = 't'
                del f['e']
            elif prec is not None and f.get('p') is not None and 'près d\'une double' in quoi and prec['y'] == 't' and prec.get('p') is None and not prec['_acc']:
                notes.remove(prec)                                # on garde la double, on retire la petite note d'avant
            elif prec is not None and prec['y'] == 's' and 'après un glissé' in quoi and f['_acc']:
                prec['y'] = 't'                                   # on garde la note du chant, le glissé redevient simple
                del prec['d']
            elif prec is not None and not prec['_acc'] and f['_acc'] and prec['y'] == 't' and prec.get('p') is None and 'trop près de la note' in quoi:
                notes.remove(prec)                                # entre deux notes trop proches, on garde celle du chant
            else:
                for n in [n for n in notes if n is f or (f.get('p') is not None and n.get('p') == f['p'])]:
                    notes.remove(n)
            self.journal.append(f'   retouche à {t:.2f} s : {quoi}')
        # densité : si la moyenne ou le pic dépasse la fourchette, on retire les notes les plus faibles, une par une
        while True:
            st = confort.statistiques(notes)
            trop_moy, trop_pic = st['densite'] > self.R['dens_moy'][1], st['pic'] > self.R['dens_pic']
            if not (trop_moy or trop_pic):
                break
            zone = [n for n in notes if n['y'] == 't' and n.get('p') is None and not n['_acc']
                    and (trop_moy or st['t_pic'] - .01 <= n['t'] <= st['t_pic'] + confort.FENETRE_PIC + .01)]
            if not zone:
                break
            notes.remove(min(zone, key=lambda n: n['_w']))
        notes.sort(key=lambda n: (n['t'], n['l']))
        ren = {}
        for n in notes:                                           # numéros de doubles remis dans l'ordre
            if n.get('p') is not None:
                n['p'] = ren.setdefault(n['p'], len(ren))
        return [{k: v for k, v in n.items() if not k.startswith('_')} for n in notes]


def tenue_finale(notes, matiere, dif):
    """La dernière note du morceau devient une longue tenue si la musique résonne encore longtemps après elle
    (comme la dernière note de Great Fairy's Fountain, tenue dans le fondu). Rend le temps de fin de cette tenue."""
    if not notes:
        return None
    s = matiere.s
    der = notes[-1]
    if der['y'] != 't' or der.get('p') is not None:
        return None
    apres = [x for x in matiere.ev if x['t'] > der['t'] + .1 and x['w'] > .5]
    reste = s.fin_son - der['t']
    if apres or reste < 2.2:
        return None
    fin = round(min(der['t'] + 4.0, s.fin_son - .8), 4)
    if len(notes) > 1 and der['t'] - confort.fin_de(notes[-2]) < REGLES[dif]['apres_tenue']:
        return None
    der['y'], der['e'] = 'h', fin
    return fin
