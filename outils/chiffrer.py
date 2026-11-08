#!/usr/bin/env python3
"""Verrouille les musiques du jeu avec le mot de passe familial.

Le mot de passe n'est JAMAIS écrit dans le dépôt : on le donne par la variable
d'environnement MDP_FAMILLE (ou il est demandé au clavier).

  python3 outils/chiffrer.py init
      Une seule fois : crée le sel et le témoin de vérification dans niveaux/index.json.

  python3 outils/chiffrer.py morceau <id> <fichier.mp3>
      Recompresse le MP3 en 128 kbit/s, le chiffre dans musiques/<id>.bin
      et met à jour niveaux/index.json (le niveau niveaux/<id>.json doit exister).

  python3 outils/chiffrer.py images <sortie.bin> <dossier> <image.png>...
      Regroupe des images (chemins relatifs au dossier) dans un seul fichier chiffré :
      un JSON {chemin: PNG en base64} — c'est ce que lit index.html (images/<nom>.bin).

  python3 outils/chiffrer.py fichier <entrée> <sortie.bin>
      Chiffre un fichier tel quel (ex. la réserve de ressources, dans reserve/).

  python3 outils/chiffrer.py index
      Recalcule niveaux/index.json à partir des fichiers niveaux/*.json et musiques/*.bin.

Format d'un fichier .bin : 12 octets d'IV puis le texte chiffré AES-256-GCM (avec son tag).
Clé : PBKDF2-SHA256(mot de passe, sel, itérations) — exactement ce que fait index.html.
"""
import base64, getpass, glob, hashlib, json, os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(RACINE, 'niveaux', 'index.json')
ITERATIONS = 250_000
TEMOIN = b'jeu-rythme : mot de passe correct'


def lire_index():
    if os.path.exists(INDEX):
        return json.load(open(INDEX, encoding='utf-8'))
    return {'chiffrement': None, 'niveaux': []}


def ecrire_index(idx):
    with open(INDEX, 'w', encoding='utf-8') as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)
        f.write('\n')


def mot_de_passe():
    mdp = os.environ.get('MDP_FAMILLE') or getpass.getpass('Mot de passe familial : ')
    if not mdp:
        sys.exit('Mot de passe vide.')
    return mdp.encode()


def cle(mdp, sel):
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sel, iterations=ITERATIONS)
    return kdf.derive(mdp)


def chiffrer(k, donnees):
    iv = os.urandom(12)
    return iv + AESGCM(k).encrypt(iv, donnees, None)


def dechiffrer(k, blob):
    return AESGCM(k).decrypt(blob[:12], blob[12:], None)


def cle_verifiee(idx):
    ch = idx.get('chiffrement')
    if not ch:
        sys.exit("Pas encore initialisé : lance d'abord « python3 outils/chiffrer.py init ».")
    k = cle(mot_de_passe(), base64.b64decode(ch['sel']))
    try:
        dechiffrer(k, base64.b64decode(ch['verif']))
    except Exception:
        sys.exit('Mot de passe incorrect : ce n\'est pas celui qui a servi à verrouiller les autres musiques.')
    return k


def recalculer(idx):
    niveaux = []
    for chemin in sorted(glob.glob(os.path.join(RACINE, 'niveaux', '*.json'))):
        if chemin == INDEX:
            continue
        d = json.load(open(chemin, encoding='utf-8'))
        musique = os.path.join(RACINE, d['musique'])
        if not os.path.exists(musique):
            print(f"  {d['id']} : musique absente, niveau non publié")
            continue
        h = hashlib.sha256(open(chemin, 'rb').read() + open(musique, 'rb').read()).hexdigest()[:10]
        niveaux.append({'id': d['id'], 'titre': d['titre'], 'jeu': d['jeu'], 'notes': len(d['notes']), 'version': h})
    idx['niveaux'] = niveaux
    ecrire_index(idx)
    print(f'index.json : {len(niveaux)} niveau(x)')


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    idx = lire_index()
    if cmd == 'init':
        if idx.get('chiffrement'):
            sys.exit('Déjà initialisé (changer de mot de passe obligerait à rechiffrer toutes les musiques).')
        sel = os.urandom(16)
        k = cle(mot_de_passe(), sel)
        idx['chiffrement'] = {'sel': base64.b64encode(sel).decode(), 'iterations': ITERATIONS,
                              'verif': base64.b64encode(chiffrer(k, TEMOIN)).decode()}
        recalculer(idx)
    elif cmd == 'morceau':
        ident, mp3 = sys.argv[2], sys.argv[3]
        k = cle_verifiee(idx)
        with tempfile.TemporaryDirectory() as tmp:
            sortie = os.path.join(tmp, 'm.mp3')
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp3, '-map', '0:a', '-map_metadata', '-1',
                            '-codec:a', 'libmp3lame', '-b:a', '128k', sortie], check=True)
            donnees = open(sortie, 'rb').read()
        os.makedirs(os.path.join(RACINE, 'musiques'), exist_ok=True)
        open(os.path.join(RACINE, 'musiques', f'{ident}.bin'), 'wb').write(chiffrer(k, donnees))
        print(f'musiques/{ident}.bin : {len(donnees) / 1e6:.1f} Mo (128 kbit/s)')
        recalculer(idx)
    elif cmd == 'images':
        sortie, dossier, images = sys.argv[2], sys.argv[3], sys.argv[4:]
        k = cle_verifiee(idx)
        paquet = {im: base64.b64encode(open(os.path.join(dossier, im), 'rb').read()).decode() for im in images}
        donnees = json.dumps(paquet).encode()
        os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
        open(sortie, 'wb').write(chiffrer(k, donnees))
        print(f'{sortie} : {len(images)} image(s), {len(donnees) / 1e3:.0f} ko')
    elif cmd == 'fichier':
        entree, sortie = sys.argv[2], sys.argv[3]
        k = cle_verifiee(idx)
        os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
        donnees = open(entree, 'rb').read()
        open(sortie, 'wb').write(chiffrer(k, donnees))
        print(f'{sortie} : {len(donnees) / 1e6:.1f} Mo')
    elif cmd == 'index':
        recalculer(idx)
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
