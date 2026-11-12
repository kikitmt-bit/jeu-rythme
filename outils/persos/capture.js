// Prend des captures de l'atelier pour vérifier un personnage à l'œil.
//   (à la racine du dépôt)  python3 -m http.server 8765 &
//   node outils/persos/capture.js <dossier de sortie> '[["nom","perso=heros-vert&anim=repos&fond=sombre&t=0"], …]' [netteté 1 ou 2]
// Pour voir aussi les images chiffrées (épée, bouclier…), donner le mot de passe familial dans la variable MDP,
// seulement sur la ligne de commande :  MDP=… node outils/persos/capture.js …   (il n'est jamais écrit sur le disque)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
(async () => {
  const [sortie, liste, dsf] = [process.argv[2], JSON.parse(process.argv[3]), +(process.argv[4] || 2)];
  let cle = null;
  if (process.env.MDP) {
    const c = JSON.parse(fs.readFileSync(path.join(__dirname, '../../niveaux/index.json'), 'utf8')).chiffrement;
    cle = crypto.pbkdf2Sync(process.env.MDP, Buffer.from(c.sel, 'base64'), c.iterations, 32, 'sha256').toString('base64');
  }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 640, height: 880 }, deviceScaleFactor: dsf });
  if (cle) await ctx.addInitScript(k => { try { localStorage.setItem('jeu-rythme-cle', k); } catch (e) {} }, cle);
  const p = await ctx.newPage();
  p.on('console', m => console.log('console :', m.text()));
  p.on('pageerror', e => console.log('ERREUR', e.message));
  fs.mkdirSync(sortie, { recursive: true });
  for (const [nom, q] of liste) {
    await p.goto('http://localhost:8765/atelier.html?' + q);
    await p.waitForTimeout(600);
    await (await p.$('#scene')).screenshot({ path: path.join(sortie, nom + '.png') });
  }
  await b.close();
})();
