// Partie simulée complète (?auto) : doit finir à 100 % Critical, 9 999 999 points, sans erreur.  node outils/tests/partie-auto.js 8765 gff
const {chromium} = require('playwright');
(async () => {
  const [port, niv] = [process.argv[2] || 8765, process.argv[3] || 'gff'];
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 892, height: 412}, deviceScaleFactor: 1});
  const erreurs = [];
  p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  p.on('pageerror', e => erreurs.push('PAGEERROR ' + e.message));
  await p.goto(`http://localhost:${port}/index.html?auto&niveau=${niv}`);
  await p.waitForFunction(() => etat === 'fin', null, {timeout: 150000, polling: 500});
  await p.waitForTimeout(1000);
  console.log(niv, JSON.stringify(await p.evaluate(() => ({score, scoreBrut, poidsMax, total, comptes, comboMax, rScore: $('rScore').textContent, finTitre: $('finTitre').textContent, rang: $('rang').textContent, record: $('recordFin').className, ls: localStorage.getItem('rythme-records')}))), 'ERREURS', JSON.stringify(erreurs));
  await p.screenshot({path: require('os').tmpdir() + `/auto-${niv}.png`});
  await b.close();
})();
