/* ============================================================
   Réglages et petites choses communes à tout le jeu (chargé en premier).
   Le jeu est fait de scripts classiques chargés dans l'ordre par index.html (pas de modules, pas d'outil de
   construction) : reglages → son → foret → moteur → dessin → hud → equipe → menu → boucle.
   Tout ce qui est déclaré au premier niveau d'un fichier est visible des fichiers suivants.
   ============================================================ */
"use strict";
const W_CRIT = 0.045, W_GREAT = 0.09, W_GOOD = 0.14;  // fenêtres de jugement (secondes, de chaque côté)
const MULT = {CRITICAL: 1, GREAT: 0.7, GOOD: 0.4, MISS: 0};
const AUTO = /[?&]auto/.test(location.search);        // ?auto : le jeu joue tout seul (pour tester)
// sens des glissés (en degrés, 0 = vers la droite)
const DIR_ANGLE = {r: 0, dr: 45, d: 90, dl: 135, l: 180, ul: -135, u: -90, ur: -45};

let reglages = {vitesse: 1.6, decalage: 0, performances: true};
try { Object.assign(reglages, JSON.parse(localStorage.getItem('rythme-reglages') || '{}')); } catch (e) {}
function sauver() { try { localStorage.setItem('rythme-reglages', JSON.stringify(reglages)); } catch (e) {} }

const $ = id => document.getElementById(id);
const cv = document.getElementById('c');   // la toile du jeu (dessin et entrées)
