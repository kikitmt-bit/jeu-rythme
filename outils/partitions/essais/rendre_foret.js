// Fabrique un fichier son d'essai sans aucune musique protégée : « Forêt d'émeraude », la composition originale du jeu,
// jouée par le synthé du jeu dans un navigateur sans écran, et enregistrée en WAV.
// Sert à essayer l'atelier de partitions (tempo, grille, sections) quand on n'a pas de MP3 sous la main.
//   (à la racine du dépôt)  python3 -m http.server 8765 &
//   node outils/partitions/essais/rendre_foret.js 8765 /tmp/rythme/foret.wav
const {chromium} = require('playwright');
const fs = require('fs');
(async () => {
  const [port, sortie] = [process.argv[2] || 8765, process.argv[3] || '/tmp/rythme/foret.wav'];
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`http://localhost:${port}/index.html?auto`);
  await p.waitForFunction(() => typeof evenementsAudio === 'function');
  const b64 = await p.evaluate(async () => {
    const SR = 44100, duree = END_T + 1.5;
    actx = new OfflineAudioContext(1, Math.ceil(SR * duree), SR);
    // mêmes tampons de bruit et de réverbération que initAudio(), avec un hasard fixe (résultat identique à chaque fois)
    let s = 12345; const alea = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    Math.random = alea;
    noise = actx.createBuffer(1, SR, SR);
    const d = noise.getChannelData(0); for (let i = 0; i < SR; i++) d[i] = alea() * 2 - 1;
    const len = Math.floor(SR * 2.2);
    impulse = actx.createBuffer(2, len, SR);
    for (let c = 0; c < 2; c++) { const x = impulse.getChannelData(c); for (let i = 0; i < len; i++) x[i] = (alea() * 2 - 1) * Math.pow(1 - i / len, 3); }
    bus = null; nouveauBus();
    for (const e of evenementsAudio()) SON[e.k](e, e.t);
    const buf = await actx.startRendering(), x = buf.getChannelData(0);
    const pcm = new Int16Array(x.length);
    for (let i = 0; i < x.length; i++) pcm[i] = Math.max(-1, Math.min(1, x[i])) * 32767;
    let bin = ''; const o = new Uint8Array(pcm.buffer);
    for (let i = 0; i < o.length; i += 32768) bin += String.fromCharCode.apply(null, o.subarray(i, i + 32768));
    return btoa(bin);
  });
  const pcm = Buffer.from(b64, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(44100, 24); h.writeUInt32LE(88200, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(require('path').dirname(sortie), {recursive: true});
  fs.writeFileSync(sortie, Buffer.concat([h, pcm]));
  console.log(sortie, (pcm.length / 88200).toFixed(1) + ' s');
  await b.close();
})();
