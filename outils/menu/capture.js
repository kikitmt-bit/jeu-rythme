// Captures de la maquette du menu (atelier-menu.html, animations figées) : node outils/menu/capture.js <dossier> [largeur] [hauteur] [finesse] [écrans...]
// Serveur d'abord : python3 -m http.server 8765 à la racine. Pixel 7 Pro en paysage = 892 412 ; iPhone sans l'encoche ≈ 750 390. Finesse 2 pour les images à envoyer à Kiki.
const {chromium} = require('playwright');
(async () => {
  const [dir, L = 892, Hh = 412, dsf = 1, ...ecrans] = process.argv.slice(2);
  const liste = ecrans.length ? ecrans : ['titre', 'menu', 'morceaux', 'equipe', 'resultats', 'options'];
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: +L, height: +Hh}, deviceScaleFactor: +dsf, hasTouch: true});
  const err = [];
  p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  p.on('pageerror', e => err.push('PAGEERROR ' + e.message));
  for (const e of liste) {
    await p.goto(`http://localhost:8765/atelier-menu.html?ecran=${e}&fige`);
    await p.waitForTimeout(900);
    await p.screenshot({path: `${dir}/${e}-${L}x${Hh}${+dsf > 1 ? '@' + dsf : ''}.png`});
  }
  console.log('erreurs:', JSON.stringify(err));
  await b.close();
})();
