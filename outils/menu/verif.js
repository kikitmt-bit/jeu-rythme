// Contrôle de la maquette : rien hors de l'écran, zones à toucher ≥ 44 px, textes non coupés, coût du dessin.
// node outils/menu/verif.js 892 412   (serveur : python3 -m http.server 8765 à la racine)
const {chromium} = require('playwright');
(async () => {
  const [L, Hh] = process.argv.slice(2).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: L, height: Hh}, deviceScaleFactor: 1, hasTouch: true});
  const err = [];
  p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  p.on('pageerror', e => err.push('PAGEERROR ' + e.message));
  for (const e of ['titre', 'menu', 'morceaux', 'equipe', 'resultats', 'options']) {
    await p.goto(`http://localhost:8765/atelier-menu.html?ecran=${e}&fige`);
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const ecran = document.querySelector('.ecran.actif'), W = innerWidth, H = innerHeight, pb = [];
      const vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null; };
      // zones à toucher
      const touches = [...ecran.querySelectorAll('button, [data-aller], .curseur')].filter(vis);
      let mini = 1e9;
      for (const el of touches) {
        const q = el.getBoundingClientRect();
        if (el.closest('.liste') ) { const l = el.closest('.liste').getBoundingClientRect(); if (q.bottom > l.bottom + 1 || q.top < l.top - 1) continue; }   // ligne cachée par le défilement : normal
        if (el.closest('.carrousel') && el.classList.contains('vide')) continue;
        const h = el.classList.contains('curseur') ? el.closest('.opt').getBoundingClientRect().height : q.height;
        const c = Math.min(q.width, h); mini = Math.min(mini, c);
        if (c < 44) pb.push(`petit ${Math.round(q.width)}x${Math.round(h)} : ${(el.textContent || el.className).trim().slice(0, 30)}`);
        if (!el.closest('.carrousel') && (q.left < -1 || q.top < -1 || q.right > W + 1 || q.bottom > H + 1)) pb.push(`hors écran : ${(el.textContent || el.className).trim().slice(0, 30)} ${JSON.stringify([q.left, q.top, q.right, q.bottom].map(Math.round))}`);
      }
      // textes coupés (le contenu dépasse sa boîte)
      for (const el of ecran.querySelectorAll('.ct, .ct-fin, .pastille span, .valeur, .nom, .nomp, .lib, .etat, .texte, .desc, .infos .v, .jugements div, .bulle, .etq')) {
        if (!vis(el)) continue;
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') pb.push(`texte coupé : ${el.textContent.trim().slice(0, 30)}`);
        const q = el.getBoundingClientRect();
        if (q.width && (q.right > W + 1 || q.left < -1 || q.bottom > H + 1) && !el.closest('.carrousel') && !el.closest('.liste')) pb.push(`texte hors écran : ${el.textContent.trim().slice(0, 30)}`);
      }
      return {mini: Math.round(mini), pb, rem: getComputedStyle(document.documentElement).fontSize};
    });
    // coût d'une image : on relance l'écran sans « fige » et on mesure la boucle
    await p.goto(`http://localhost:8765/atelier-menu.html?ecran=${e}`);
    await p.waitForTimeout(1500);
    const cout = await p.evaluate(() => new Promise(ok => {
      const ts = []; let last = performance.now();
      const f = now => { ts.push(now - last); last = now; if (ts.length < 90) requestAnimationFrame(f); else { ts.shift(); ts.sort((a, b) => a - b); ok({moy: (ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(1), pire: ts[ts.length - 1].toFixed(1)}); } };
      requestAnimationFrame(f);
    }));
    console.log(`${e.padEnd(10)} rem=${r.rem} mini=${r.mini}px image=${cout.moy}ms (pire ${cout.pire}) ${r.pb.length ? '\n   ' + r.pb.join('\n   ') : 'OK'}`);
  }
  console.log('erreurs console :', JSON.stringify(err));
  await b.close();
})();
