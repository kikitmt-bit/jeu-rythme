"""Compare deux dossiers de captures (outils/tests/pixels.js) pixel par pixel.
   python3 outils/tests/comparer-pixels.py <dossier-a> <dossier-b>"""
import sys, os
from PIL import Image, ImageChops

a, b = sys.argv[1], sys.argv[2]
ok = True
for nom in sorted(os.listdir(a)):
    if not nom.endswith('.png'):
        continue
    ia, ib = Image.open(os.path.join(a, nom)).convert('RGBA'), Image.open(os.path.join(b, nom)).convert('RGBA')
    if ia.size != ib.size:
        print(nom, 'TAILLES DIFFÉRENTES', ia.size, ib.size); ok = False; continue
    diff = ImageChops.difference(ia, ib)
    boite = diff.getbbox()
    n = sum(1 for px in diff.getdata() if px != (0, 0, 0, 0)) if boite else 0
    print(nom, 'identique' if not boite else f'{n} pixels différents, zone {boite}')
    ok = ok and not boite
print('TOUT IDENTIQUE' if ok else 'DIFFÉRENCES')
sys.exit(0 if ok else 1)
