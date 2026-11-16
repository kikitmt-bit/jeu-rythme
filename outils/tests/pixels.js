// Captures déterministes pour comparer deux versions du jeu au pixel près (ex. après un rangement du code).
// Horloge et hasard sont figés : chaque image avance d'exactement 1/120 s, Math.random est une suite fixe.
//   (à la racine)  python3 -m http.server 8765 &      ancienne version : git worktree add <dossier> <commit>, servie sur 8766
//   node outils/tests/pixels.js 8765 <dossier-sortie>   puis   node outils/tests/pixels.js 8766 <autre-dossier>
//   python3 outils/tests/comparer-pixels.py <dossier-sortie> <autre-dossier>
// Captures : menu.png (écran d'accueil), puis auto-5s.png, auto-25s.png, auto-50s.png (partie ?auto&niveau=gff).
const {chromium} = require('playwright');
const fs = require('fs');
const FIGER = () => {
  let graine = 12345;
  Math.random = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };
  let faux = 1000, rappels = [];
  performance.now = () => faux;
  window.requestAnimationFrame = f => { rappels.push(f); return rappels.length; };
  window.__pas = n => { for (let i = 0; i < n; i++) { faux += 1000 / 120; const r = rappels; rappels = []; for (const f of r) f(faux); } };
};
(async () => {
  const [port, sortie] = [process.argv[2] || 8765, process.argv[3] || 'captures'];
  fs.mkdirSync(sortie, {recursive: true});
  const b = await chromium.launch();
  const erreurs = [];
  const page = async adresse => {
    const p = await b.newPage({viewport: {width: 892, height: 412}, deviceScaleFactor: 2});
    p.on('pageerror', e => erreurs.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    await p.addInitScript(FIGER);
    await p.goto(`http://localhost:${port}/${adresse}`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1500);   // polices, catalogue, décor
    return p;
  };
  // menu
  let p = await page('index.html');
  if (await p.isVisible('#sansMdp')) await p.click('#sansMdp');
  await p.evaluate(() => __pas(60));
  await p.screenshot({path: `${sortie}/menu.png`});
  await p.close();
  // partie automatique
  p = await page('index.html?auto&niveau=gff');
  await p.waitForFunction(() => etat === 'jeu');
  let fait = 0;
  for (const s of [5, 25, 50]) {
    await p.evaluate(n => __pas(n), s * 120 - fait); fait = s * 120;
    await p.screenshot({path: `${sortie}/auto-${s}s.png`});
  }
  console.log(port, 'captures dans', sortie, 'erreurs', JSON.stringify(erreurs));
  await b.close();
})();
