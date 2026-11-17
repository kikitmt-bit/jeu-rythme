"use strict";
/* ============================================================
   Écrans
   ============================================================ */
function afficher(id) { for (const e of ['accueil', 'mdp', 'pause', 'fin']) $(e).classList.toggle('cache', e !== id); $('bpause').classList.toggle('cache', id !== null); }

function lancer() {
  if (fondDe !== (DECOR_IMG[niveau.id] && DECOR_IMG[niveau.id].img ? niveau.id : null)) peindreFond();
  nouvellePartie(); preparerEquipe();
  if (!AUTO) {
    initAudio(); actx.resume(); arreterSource(); nouveauBus();
    t0 = actx.currentTime + .15; oublierHorloge();
    if (niveau.synth) { events = evenementsAudio(); evi = 0; }
    else {
      events = []; evi = 0;
      source = actx.createBufferSource(); source.buffer = niveau.buffer;
      source.connect(bus); source.start(t0 + niveau.avance);
    }
  } else { autoStart = performance.now(); oublierHorloge(); }
  etat = 'jeu'; afficher(null);
  bloquerRetour();
  if (!AUTO) pleinEcran();
}
async function pleinEcran() {
  const d = document.documentElement;
  try {
    if (!document.fullscreenElement) await (d.requestFullscreen || d.webkitRequestFullscreen).call(d, {navigationUI: 'hide'});
    try { await screen.orientation.lock('landscape'); } catch (e) {}
    $('msgPlein').textContent = '';
  } catch (e) {
    $('msgPlein').textContent = /iPhone|iPad/.test(navigator.userAgent) ? "Sur iPhone, le plein écran passe par Partager, puis « Sur l'écran d'accueil »." : "Le navigateur a refusé le plein écran : ajoute le jeu à l'écran d'accueil.";
  }
}
/* Le geste « retour » d'Android (glisser depuis le bord) ne doit pas quitter le jeu :
   on garde une page d'avance dans l'historique, et un retour pendant la partie est ignoré. */
let retourPiege = false;
function bloquerRetour() {
  if (retourPiege) return;
  try { history.pushState({jeu: 1}, ''); retourPiege = true; } catch (e) {}
}
addEventListener('popstate', () => {
  retourPiege = false;
  if (etat === 'jeu' || etat === 'pause' || etat === 'decompte') bloquerRetour();
});
/* Pause, puis reprise avec un décompte 3-2-1 : le son (actx suspendu) et les notes (dt = 0) restent figés pendant
   le décompte ; à la fin, le son repart et l'horloge est resynchronisée. Les chiffres sont pré-dessinés (CHIF.decompte). */
const PAS_DECOMPTE = .8;   // secondes par chiffre
let decompte = null, debutPause = 0;
function mettrePause() {
  if ((etat !== 'jeu' && etat !== 'decompte') || AUTO) return;
  if (etat === 'jeu') debutPause = performance.now();
  decompte = null; etat = 'pause'; actx.suspend(); oublierHorloge(); afficher('pause');
}
function reprendre() {
  if (etat !== 'pause') return;
  decompte = {debut: performance.now()}; etat = 'decompte'; afficher(null);
}
function finDecompte() {
  const duree = performance.now() - debutPause;
  for (const ge of gestes.values()) if (ge.age) ge.age += duree;   // un glissé commencé avant la pause n'est pas jugé trop lent
  decompte = null; oublierHorloge(); etat = 'jeu'; actx.resume();
}
function dessinerDecompte() {
  const e = (performance.now() - decompte.debut) / 1000 / PAS_DECOMPTE, k = Math.max(0, Math.min(2, Math.floor(e))), u = Math.min(1, e - k);
  const sortie = k === 2 ? Math.min(1, (1 - u) * 4) : 1;   // le dernier chiffre s'efface en laissant place au jeu
  g.globalAlpha = .4 * sortie; g.fillStyle = '#02080a'; g.fillRect(0, 0, W, H);
  const img = CHIF.decompte[3 - k], pop = 1 + .45 * (1 - doux(u / .4)), cx = W / 2, cy = H * .5;
  g.globalAlpha = sortie;
  g.drawImage(img, cx - (img.avance / 2 + img.marge) * pop, cy - (img.base - img.t * .36) * pop, img.l * pop, img.h * pop);
  g.globalAlpha = 1;
}

/* Records : gardés sur le téléphone (localStorage, chaque accès dans un try/catch), par morceau et par difficulté.
   Format : {morceau: {normal: {score, rang, combo, full}}} ; chaque valeur est le meilleur résultat obtenu séparément
   (meilleur score, meilleur rang, meilleur combo, Full combo oui/non). Seules les parties terminées comptent.

   Difficulté (chantier 1.1) : chaque morceau en ligne a 3 vraies partitions, « facile », « normal », « expert »
   (niveaux/<id>.json, « partitions »), et une note de difficulté de 1 à 10 par mode (« modes » de niveaux/index.json).
   Le choix est mémorisé (reglages.difficulte). La Forêt d'émeraude et un niveau à l'ancien format n'ont que « normal ».
   « ancienne » = la partition d'avant l'atelier, gardée pour comparer : visible seulement sur la page de test (?test). */
const MODES = {facile: 'Facile', normal: 'Normal', expert: 'Expert', ancienne: 'Ancienne'};
const COULEUR_MODE = {facile: '#5ad66c', normal: '#4aa8ff', expert: '#ff4a5a', ancienne: '#c9b38a'};
let difficulte = MODES[reglages.difficulte] ? reglages.difficulte : 'normal';
{ const m = location.search.match(/difficulte=(\w+)/); if (m && MODES[m[1]]) difficulte = m[1]; }
function modesDe(nv) { return nv && nv.info && nv.info.modes ? Object.keys(nv.info.modes).filter(m => m !== 'ancienne' || TEST) : ['normal']; }
// la difficulté réellement jouée sur ce niveau (celle choisie si le niveau l'a, sinon « normal »)
function modeJoue(nv = niveau) { return modesDe(nv).includes(difficulte) ? difficulte : 'normal'; }
const CLE_RECORDS = 'rythme-records', RANGS = ['D', 'C', 'B', 'A', 'S'];
let recordsMemoire = {};   // si le téléphone refuse localStorage (navigation privée…), on garde au moins ça jusqu'au rechargement
function lireRecords() {
  try {
    const r = JSON.parse(localStorage.getItem(CLE_RECORDS) || '{}');
    if (r && typeof r === 'object') return recordsMemoire = r;
  } catch (e) {}
  return recordsMemoire;
}
function recordDe(id, dif = modeJoue(NIVEAUX[id])) {
  const r = (lireRecords()[id] || {})[dif];
  if (!r || typeof r !== 'object' || !(r.score >= 0) || !RANGS.includes(r.rang)) return null;
  return {score: Math.round(r.score), rang: r.rang, combo: r.combo > 0 ? Math.round(r.combo) : 0, full: r.full === true};
}
// enregistre un résultat ; rend l'ancien record et ce qui vient d'être battu
function enregistrerRecord(id, res, dif = modeJoue(NIVEAUX[id])) {
  const ancien = recordDe(id, dif), plus = (a, b) => !ancien || a > b;
  const bat = {
    score: plus(res.score, ancien && ancien.score),
    rang: plus(RANGS.indexOf(res.rang), ancien && RANGS.indexOf(ancien.rang)),
    combo: plus(res.combo, ancien && ancien.combo),
    full: res.full && !(ancien && ancien.full),
  };
  if (bat.score || bat.rang || bat.combo || bat.full) {
    const tous = lireRecords();
    tous[id] = Object.assign({}, tous[id], {[dif]: {
      score: bat.score ? res.score : ancien.score,
      rang: bat.rang ? res.rang : ancien.rang,
      combo: bat.combo ? res.combo : ancien.combo,
      full: !!(res.full || (ancien && ancien.full)),
    }});
    recordsMemoire = tous;
    try { localStorage.setItem(CLE_RECORDS, JSON.stringify(tous)); } catch (e) {}
  }
  return {ancien, bat};
}
const espaces = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const texteRecord = r => `${espaces(r.score)} · rang ${r.rang} · combo ${r.combo}${r.full ? ' · Full combo' : ''}`;
// ligne de record sous chaque morceau du menu (celui de la difficulté choisie)
function majRecords() {
  for (const b of $('niveaux').children) {
    const el = b.querySelector('.rec'); if (!el) continue;
    const r = recordDe(b.dataset.n);
    el.textContent = r ? `Record : ${texteRecord(r)}` : '';
  }
}
// boutons de difficulté : ceux du morceau choisi, avec sa note de 1 à 10 ; nombre de notes de chaque morceau
function majDifficulte() {
  const modes = modesDe(niveau), joue = modeJoue(), infos = (niveau.info && niveau.info.modes) || {};
  for (const b of $('difficulte').children) {
    const d = b.dataset.d, dispo = modes.includes(d);
    b.classList.toggle('cache', d === 'ancienne' && !dispo);
    b.disabled = !dispo;
    b.classList.toggle('actif', d === joue);
    b.style.background = d === joue ? COULEUR_MODE[d] : '';
    b.textContent = MODES[d] + (infos[d] && infos[d].niveau ? ' ' + infos[d].niveau : '');
  }
  $('aideDif').textContent = modes.length > 1 ? 'Le chiffre est la note de difficulté du morceau, de 1 à 10.' : 'Ce morceau n\'a qu\'une difficulté.';
  for (const b of $('niveaux').children) {
    const nv = NIVEAUX[b.dataset.n], el = b.querySelector('.nb');
    if (!el || !nv.info) continue;
    const m = nv.info.modes && nv.info.modes[modeJoue(nv)];
    el.textContent = `${nv.info.jeu} · ${m ? m.notes : nv.info.notes} notes`;
  }
  majRecords();
}
function choisirDifficulte(d) {
  if (!MODES[d]) return;
  difficulte = d;
  if (d !== 'ancienne') { reglages.difficulte = d; sauver(); }
  majDifficulte();
}
// bloc « Nouveau record ! » de l'écran de fin
function afficherRecord(res) {
  const {ancien, bat} = res, bloc = $('recordFin'), titre = $('recordTitre'), detail = $('recordDetail');
  const autres = [];
  if (ancien && bat.rang && !bat.score) autres.push('Meilleur rang !');
  if (ancien && bat.combo && !bat.score) autres.push('Meilleur combo !');
  if (ancien && bat.full) autres.push('Premier Full combo !');
  if (bat.score) {
    titre.textContent = 'Nouveau record !';
    detail.textContent = ancien ? `Ancien record : ${texteRecord(ancien)}` : 'Premier score enregistré';
  } else if (autres.some(Boolean)) {
    titre.textContent = autres.filter(Boolean).join(' · ');
    detail.textContent = `Record à battre : ${texteRecord(ancien)}`;
  } else {
    titre.textContent = '';
    detail.textContent = ancien ? `Record à battre : ${texteRecord(ancien)}` : '';
  }
  bloc.classList.toggle('cache', !titre.textContent && !detail.textContent);
}

function terminer(gagne) {
  etat = 'fin';
  if (bus) bus.gain.setTargetAtTime(0, actx.currentTime, gagne ? .6 : .05);
  setTimeout(arreterSource, 3000);
  const acc = points / total;
  const rang = !gagne ? 'D' : acc >= .95 ? 'S' : acc >= .85 ? 'A' : acc >= .7 ? 'B' : acc >= .5 ? 'C' : 'D';
  $('finTitre').textContent = gagne ? (comptes.MISS === 0 ? 'Full combo !' : 'Bravo !') : 'Raté…';
  $('rang').textContent = rang; $('rScore').textContent = espaces(score);
  $('rCrit').textContent = comptes.CRITICAL; $('rGreat').textContent = comptes.GREAT; $('rGood').textContent = comptes.GOOD; $('rMiss').textContent = comptes.MISS; $('rCombo').textContent = comboMax; $('rCoffres').textContent = `${coffres} / ${coffresMax}`; $('ligneCoffres').classList.toggle('cache', !coffresMax);
  // record : seulement une partie terminée et jouée pour de vrai (pas ?auto, qui sert aux tests)
  if (gagne && !robot && modeJoue() !== 'ancienne') { afficherRecord(enregistrerRecord(niveau.id, {score, rang, combo: comboMax, full: comptes.MISS === 0})); majRecords(); }
  else $('recordFin').classList.add('cache');
  setTimeout(() => afficher('fin'), gagne ? 600 : 300);
}
$('menu').onclick = () => { etat = 'menu'; afficher('accueil'); };
$('bpause').onclick = mettrePause; $('reprendre').onclick = reprendre;
$('quitter').onclick = () => { if (bus) bus.gain.setTargetAtTime(0, actx.currentTime, .05); actx.resume(); setTimeout(arreterSource, 200); etat = 'menu'; afficher('accueil'); };
$('bplein').onclick = pleinEcran;
ecouter('fin', terminer);

/* ---------- Niveaux en ligne, mot de passe familial, musiques chiffrées ---------- */
const b64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
const vers64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const echap = t => String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

let catalogue = null, cle = null;   // catalogue des niveaux en ligne, clé tirée du mot de passe familial

function base() {
  return new Promise((ok, ko) => {
    try {
      const r = indexedDB.open('jeu-rythme', 2);
      r.onupgradeneeded = () => { const db = r.result; for (const n of ['mp3', 'musiques']) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n); };
      r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
    } catch (e) { ko(e); }
  });
}
async function cacheLire(k) { const db = await base(); return new Promise((ok, ko) => { const q = db.transaction('musiques').objectStore('musiques').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); }); }
async function cacheEcrire(id, k, v) {
  const db = await base();
  return new Promise((ok, ko) => {
    const tx = db.transaction('musiques', 'readwrite'), st = tx.objectStore('musiques');
    const q = st.getAllKeys();
    q.onsuccess = () => { for (const old of q.result) if (String(old).startsWith(id + '@') && old !== k) st.delete(old); st.put(v, k); };
    tx.oncomplete = ok; tx.onerror = () => ko(tx.error);
  });
}

async function cleDepuisMdp(mdp) {
  const k = catalogue.chiffrement;
  const brut = await crypto.subtle.importKey('raw', new TextEncoder().encode(mdp), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt: b64(k.sel), iterations: k.iterations, hash: 'SHA-256'}, brut, {name: 'AES-GCM', length: 256}, true, ['decrypt']);
}
async function dechiffrer(octets, k = cle) {
  const o = new Uint8Array(octets);
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: o.slice(0, 12)}, k, o.slice(12));
}
async function verifierCle(k) { try { await dechiffrer(b64(catalogue.chiffrement.verif), k); return true; } catch (e) { return false; } }

function choisirNiveau(id) {
  if (!NIVEAUX[id]) id = 'foret';
  niveau = NIVEAUX[id];
  chargerDecor(id);
  for (const b of $('niveaux').children) b.classList.toggle('actif', b.dataset.n === id);
  try { localStorage.setItem('jeu-rythme-niveau', id); } catch (e) {}
  majDifficulte();
}
function construireMenu() {
  const box = $('niveaux');
  for (const n of catalogue.niveaux) {
    NIVEAUX[n.id] = {id: n.id, nom: n.titre, mp3: true, info: n};
    const b = document.createElement('button');
    b.className = 'niv'; b.dataset.n = n.id;
    b.innerHTML = `${echap(n.titre)}<small class="nb">${echap(n.jeu)} · ${n.notes} notes</small><small class="rec"></small>`;
    box.insertBefore(b, box.lastElementChild);
  }
  for (const b of box.children) b.onclick = () => choisirNiveau(b.dataset.n);
  let dernier = null; try { dernier = localStorage.getItem('jeu-rythme-niveau'); } catch (e) {}
  choisirNiveau(dernier || (catalogue.niveaux[0] && catalogue.niveaux[0].id) || 'foret');
  majRecords();
}

// prépare un niveau en ligne : partition, puis musique (cache du téléphone, sinon téléchargement), déchiffrée
async function preparer(nv) {
  if (!nv.mp3 || nv.pret) return true;
  const msg = $('msgCharge');
  if (!nv.data) {
    msg.textContent = 'Chargement de la partition…';
    nv.data = await (await fetch(`niveaux/${nv.id}.json?v=${nv.info.version}`)).json();
    const d = nv.data;
    Object.assign(nv, {avance: d.avance, debut: d.avance + d.grille, temps: 60 / d.bpm, fin: d.avance + d.fin,
      // la partition de la difficulté choisie (ancien format : « notes » seul = normal)
      notes: () => ((d.partitions && (d.partitions[modeJoue(nv)] || d.partitions.normal)) || d.notes).map(n => {
        const o = {type: {t: 'tap', h: 'hold', s: 'swipe'}[n.y], t: n.t + d.avance, lane: n.l};
        if (n.e !== undefined) o.end = n.e + d.avance;
        if (n.d) o.dir = n.d;
        if (n.p !== undefined) o.paire = n.p;
        return o;
      })});
  }
  await chargerDecor(nv.id);
  if (AUTO) { nv.pret = true; return true; }
  if (!cle) { demanderMdp(); msg.textContent = ''; return false; }
  const k = `${nv.id}@${nv.info.version}`;
  let octets = null;
  try { octets = await cacheLire(k); } catch (e) {}
  if (!octets) {
    msg.textContent = 'Téléchargement de la musique…';
    const r = await fetch(`${nv.data.musique}?v=${nv.info.version}`);
    if (!r.ok) throw new Error('musique introuvable');
    octets = await r.arrayBuffer();
    try { await cacheEcrire(nv.id, k, octets); } catch (e) {}
  }
  msg.textContent = 'Préparation…';
  initAudio();
  nv.buffer = await actx.decodeAudioData(await dechiffrer(octets));
  nv.pret = true; msg.textContent = '';
  return true;
}

function demanderMdp() { $('msgMdp').textContent = ''; afficher('mdp'); setTimeout(() => $('champMdp').focus(), 50); }
$('formMdp').onsubmit = async e => {
  e.preventDefault();
  const mdp = $('champMdp').value;
  if (!mdp) return;
  $('msgMdp').textContent = 'Vérification…';
  const k = await cleDepuisMdp(mdp);
  if (!(await verifierCle(k))) { $('msgMdp').textContent = 'Mot de passe incorrect.'; return; }
  cle = k; $('champMdp').value = ''; chargerImagesPersos();
  try { localStorage.setItem('jeu-rythme-cle', vers64(await crypto.subtle.exportKey('raw', k))); } catch (e) {}
  $('bsecours').classList.remove('cache');
  afficher('accueil');
};
// « Clé de secours » : copie la clé gardée par ce téléphone (elle remplace le mot de passe pour Claude)
$('bsecours').onclick = async () => {
  let brut = null; try { brut = localStorage.getItem('jeu-rythme-cle'); } catch (e) {}
  if (!brut) return;
  const msg = $('msgCharge');
  try { await navigator.clipboard.writeText(brut); msg.textContent = 'Clé copiée ! Colle-la dans la conversation avec Claude.'; }
  catch (e) { msg.textContent = 'Clé : ' + brut; msg.style.userSelect = 'text'; }
};
$('sansMdp').onclick = () => { choisirNiveau('foret'); afficher('accueil'); };

async function jouer() {
  robot = AUTO || (TEST && $('regarder').checked);   // page de test : « Regarder » = le jeu joue tout seul, avec la musique
  if (!AUTO) initAudio();   // le son doit être réveillé pendant le toucher
  if (!AUTO && actx.state !== 'running') actx.resume();
  $('jouer').disabled = true;
  try { if (await preparer(niveau)) lancer(); }
  catch (e) { $('msgCharge').textContent = "Impossible de charger ce morceau. Vérifie ta connexion et réessaie."; }
  finally { $('jouer').disabled = false; }
}
$('jouer').onclick = jouer; $('rejouer').onclick = jouer;

async function demarrer() {
  if (navigator.audioSession) try { navigator.audioSession.type = 'playback'; } catch (e) {}   // iPhone : son même en mode silencieux
  try { catalogue = await (await fetch('niveaux/index.json', {cache: 'no-cache'})).json(); }
  catch (e) { catalogue = null; }
  if (catalogue) {
    construireMenu();
    let brut = null; try { brut = localStorage.getItem('jeu-rythme-cle'); } catch (e) {}
    if (brut) try {
      const k = await crypto.subtle.importKey('raw', b64(brut), {name: 'AES-GCM'}, true, ['decrypt']);
      if (await verifierCle(k)) cle = k;
    } catch (e) {}
    $('bsecours').classList.toggle('cache', !cle);
    chargerImagesPersos();
  }
  const m = location.search.match(/niveau=([\w-]+)/);
  if (m) choisirNiveau(m[1]);
  if (AUTO) return jouer();
  if (catalogue && catalogue.niveaux.length && !cle) demanderMdp(); else afficher('accueil');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) mettrePause(); });

// réglages
for (const b of $('difficulte').children) b.onclick = () => choisirDifficulte(b.dataset.d);
for (const b of $('vitesse').children) {
  b.classList.toggle('actif', +b.dataset.v === reglages.vitesse);
  b.onclick = () => { reglages.vitesse = +b.dataset.v; sauver(); for (const c of $('vitesse').children) c.classList.toggle('actif', c === b); };
}
$('perfs').checked = FPS;
$('perfs').onchange = e => { FPS = reglages.performances = e.target.checked; if (!FPS) fpsTxt = ''; sauver(); };
$('decalage').value = reglages.decalage; $('decalageVal').textContent = reglages.decalage;
$('decalage').oninput = e => { reglages.decalage = +e.target.value; $('decalageVal').textContent = reglages.decalage; sauver(); };
