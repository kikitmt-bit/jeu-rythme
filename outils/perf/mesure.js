// Mesure le coût de dessin d'une image pendant une partie ?auto (rendu logiciel : plus lent qu'un téléphone,
// mais parfait pour comparer deux versions). Résolution bloquée, aucun ralentissement artificiel.
//   (à la racine du dépôt)  python3 -m http.server 8765 &
//   ancienne version :      git worktree add /tmp/ancien <commit> && (cd /tmp/ancien && python3 -m http.server 8766 &)
//   node outils/perf/mesure.js 8765 20   puis   node outils/perf/mesure.js 8766 20   (faire 2 passes chacun)
// Résultat : moy / médiane / 95e centile / pire, en ms par image. Objectif : pas plus que l'ancienne version.
const {chromium} = require('playwright');
(async () => {
  const [port, duree] = [process.argv[2] || 8765, +(process.argv[3] || 20)];
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 892, height: 412}, deviceScaleFactor: 2});   // Pixel 7 Pro en paysage
  await p.goto(`http://localhost:${port}/index.html?auto&niveau=gff`);
  await p.evaluate(() => {
    window.__t = []; const orig = dessiner; surveiller = () => {};
    dessiner = function (...a) { const t = performance.now(); orig.apply(this, a); g.getImageData(0, 0, 1, 1); window.__t.push(performance.now() - t); };
  });
  await p.waitForTimeout(duree * 1000);
  const r = await p.evaluate(() => { const d = window.__t.slice(30).sort((a, b) => a - b), n = d.length;
    return {images: n, moy: +(d.reduce((a, b) => a + b, 0) / n).toFixed(2), med: +d[n >> 1].toFixed(2), p95: +d[Math.floor(n * .95)].toFixed(2), pire: +d[n - 1].toFixed(1), dpr: DPR}; });
  console.log(port, JSON.stringify(r));
  await b.close();
})();
