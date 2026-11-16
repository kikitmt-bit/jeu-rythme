// Test du chantier 0.2 : pause + décompte 3-2-1 (son suspendu, notes figées), records conservés après rechargement.
//   (à la racine)  python3 -m http.server 8765 &   puis   node outils/tests/records-pause.js 8765
// Les captures vont dans le dossier de ce script. Joue le niveau « Forêt » (musique intégrée, pas de mot de passe).
const {chromium} = require('playwright');
const OUT = require('os').tmpdir();
(async () => {
  const port = process.argv[2] || 8765;
  const b = await chromium.launch({args: ['--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({viewport: {width: 892, height: 412}, deviceScaleFactor: 2, hasTouch: true});
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  p.on('pageerror', e => erreurs.push('PAGEERROR ' + e.message));
  await p.goto(`http://localhost:${port}/index.html`);
  await p.waitForTimeout(800);
  await p.click('#sansMdp');
  await p.screenshot({path: OUT + '/menu-0.png'});
  await p.click('#jouer');
  await p.waitForTimeout(4000);
  console.log('etat', await p.evaluate(() => etat));
  // --- pause
  const t1 = await p.evaluate(() => tempsCourant);
  await p.click('#bpause');
  await p.waitForTimeout(300);
  console.log('pause', await p.evaluate(() => [etat, actx.state, +tempsCourant.toFixed(3)]), 't avant', t1.toFixed(3));
  await p.waitForTimeout(700);
  await p.click('#reprendre');
  const lignes = [];
  for (let i = 0; i < 30; i++) {
    lignes.push(await p.evaluate(() => [etat, actx.state, +actx.currentTime.toFixed(3), +tempsCourant.toFixed(3), decompte ? Math.round(performance.now() - decompte.debut) : -1]));
    if (i === 3 || i === 11 || i === 19) await p.screenshot({path: OUT + `/decompte-${i}.png`});
    if (i === 6) { await p.mouse.click(300, 300); }   // tape pendant le décompte : doit être ignorée
    await p.waitForTimeout(100);
  }
  for (const l of lignes) console.log(JSON.stringify(l));
  await p.waitForTimeout(500);
  console.log('apres', await p.evaluate(() => [etat, actx.state, +tempsCourant.toFixed(3), comptes.MISS, combo]));
  // --- pause pendant le décompte : doit revenir à la pause, puis reprise complète
  await p.click('#bpause'); await p.waitForTimeout(200);
  await p.click('#reprendre'); await p.waitForTimeout(500);
  console.log('re-decompte', await p.evaluate(() => etat));
  await p.click('#bpause'); await p.waitForTimeout(200);
  console.log('pause pendant decompte', await p.evaluate(() => [etat, actx.state]));
  await p.click('#reprendre'); await p.waitForTimeout(3000);
  console.log('fini', await p.evaluate(() => [etat, actx.state]));
  // --- records
  const fin = async (sc, rang, combo, miss) => {
    await p.evaluate(([sc, combo, miss]) => { score = sc; points = total * .9; comboMax = combo; comptes = {CRITICAL: 100, GREAT: 50, GOOD: 20, MISS: miss}; terminer(true); }, [sc, combo, miss]);
    await p.waitForTimeout(900);
    return p.evaluate(() => ({rang: $('rang').textContent, rScore: $('rScore').textContent, titre: $('recordTitre').textContent, detail: $('recordDetail').textContent, cache: $('recordFin').classList.contains('cache'), ls: localStorage.getItem('rythme-records')}));
  };
  console.log('1re partie', JSON.stringify(await fin(3000000, 'A', 120, 4)));
  await p.screenshot({path: OUT + '/fin-1.png'});
  console.log('meilleur', JSON.stringify(await fin(4500000, 'A', 150, 2)));
  await p.screenshot({path: OUT + '/fin-2.png'});
  console.log('moins bien', JSON.stringify(await fin(1000000, 'A', 90, 9)));
  await p.screenshot({path: OUT + '/fin-3.png'});
  console.log('full combo plus bas', JSON.stringify(await fin(2000000, 'A', 185, 0)));
  await p.screenshot({path: OUT + '/fin-4.png'});
  // recharge
  await p.reload(); await p.waitForTimeout(800);
  await p.click('#sansMdp');
  console.log('menu apres rechargement:', await p.evaluate(() => $('niveaux').textContent));
  await p.screenshot({path: OUT + '/menu-1.png'});
  // localStorage bloqué
  console.log('ERREURS', JSON.stringify(erreurs));
  await b.close();
})();
