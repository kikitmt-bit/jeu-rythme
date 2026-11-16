// Coût de la maquette du menu par image (rendu logiciel, sans carte graphique : plus lent qu'un téléphone, sert à comparer avant/après) : node outils/menu/perf.js
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 892, height: 412}, deviceScaleFactor: 2});
  const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  for (const e of ['titre', 'menu', 'morceaux', 'equipe', 'resultats', 'options']) {
    await p.goto(`http://localhost:8765/atelier-menu.html?ecran=${e}`); await p.waitForTimeout(4500);
    const a = await m(), f0 = await p.evaluate(() => new Promise(ok => { let n = 0; const t = performance.now(); const f = () => { if (++n < 120) requestAnimationFrame(f); else ok([n, performance.now() - t]); }; requestAnimationFrame(f); }));
    const z = await m();
    console.log(e.padEnd(10), 'par image :', ((z.TaskDuration - a.TaskDuration) * 1000 / f0[0]).toFixed(2), 'ms (script', ((z.ScriptDuration - a.ScriptDuration) * 1000 / f0[0]).toFixed(2), 'ms) ;', (f0[0] / f0[1] * 1000).toFixed(0), 'i/s');
  }
  await b.close();
})();
