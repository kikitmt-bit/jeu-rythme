#!/usr/bin/env python3
"""Colle le modèle de Kiki et une capture de l'atelier côte à côte (même hauteur), pour comparer d'un coup d'œil.

  python3 outils/persos/comparer.py <modele.png> <capture.png> <sortie.png> [x0,y0,x1,y1 : zone du modèle à garder]

Astuce : pour juger un détail (main, col, oreille…), recadrer la sortie sur ce détail et l'agrandir avant de regarder.
"""
import sys
from PIL import Image

modele, capture, sortie = sys.argv[1:4]
a = Image.open(capture).convert('RGB')
m = Image.open(modele).convert('RGB')
if len(sys.argv) > 4:
    m = m.crop(tuple(int(v) for v in sys.argv[4].split(',')))
m = m.resize((round(m.width * a.height / m.height), a.height), Image.LANCZOS)
s = Image.new('RGB', (m.width + a.width, a.height))
s.paste(m, (0, 0)); s.paste(a, (m.width, 0)); s.save(sortie)
print(sortie, s.size)
