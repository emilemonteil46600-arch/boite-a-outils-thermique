/* Tests des données publiques : chaque valeur a une source, une date, un statut,
   et rien de confidentiel n'est publié.
   Lancer : node --test (depuis la racine du dépôt) */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { RACINE, charger } = require('./aide-tests.js');

charger('donnees/bt01.js');
charger('donnees/chiffrage-exemple.js');
charger('donnees/ponts-thermiques-exemple.js');
charger('donnees/batiment-exemple.js');
const BT01 = window.BT01.valeurs;
const CH = window.CHIFFRAGE_EXEMPLE;
const PT = window.PONTS_EXEMPLE;
const STATUTS = ['exemple', 'valide'];

function sansDoublon(liste) { return new Set(liste).size === liste.length; }

test('BT01 : mois au format AAAA-MM et valeurs plausibles', function () {
  Object.keys(BT01).forEach(function (m) {
    assert.match(m, /^\d{4}-\d{2}$/, m);
    assert.ok(BT01[m] > 50 && BT01[m] < 400, m + ' = ' + BT01[m]);
  });
});

test('Chiffrage : chaque ratio a un identifiant unique, une source, une date connue du BT01, un statut', function () {
  assert.ok(sansDoublon(CH.ratios.map(function (r) { return r.id; })), 'identifiants en double');
  CH.ratios.forEach(function (r) {
    assert.ok(r.source && r.source.trim(), r.id + ' : source manquante');
    assert.ok(STATUTS.indexOf(r.statut) !== -1, r.id + ' : statut inconnu');
    assert.ok(BT01[r.dateRef] > 0, r.id + ' : mois ' + r.dateRef + ' absent de la table BT01');
    assert.ok(r.prixBas >= 0 && r.prixBas <= r.prixHaut, r.id + ' : prix bas > prix haut');
  });
});

test('Chiffrage : complexité de 1 à 4 et coefficients positifs', function () {
  assert.deepEqual(CH.complexite.map(function (c) { return c.niveau; }), [1, 2, 3, 4]);
  CH.complexite.concat(CH.typesBatiment).forEach(function (c) { assert.ok(c.coef > 0); });
});

test('Ponts thermiques : chaque ψ a une liaison et un isolant connus, une source, un mois, un statut, une explication', function () {
  const liaisons = PT.liaisons.map(function (l) { return l.id; });
  const isolations = PT.isolations.map(function (i) { return i.id; });
  assert.ok(sansDoublon(PT.valeurs.map(function (v) { return v.id; })), 'identifiants en double');
  PT.valeurs.forEach(function (v) {
    assert.ok(liaisons.indexOf(v.liaison) !== -1, v.id + ' : liaison inconnue');
    assert.ok(isolations.indexOf(v.isolation) !== -1, v.id + ' : isolant inconnu');
    assert.ok(v.psi >= 0 && v.psi < 2, v.id + ' : ψ hors de la plage plausible');
    assert.ok(v.source && v.source.trim(), v.id + ' : source manquante');
    assert.match(v.dateRef, /^\d{4}-\d{2}$/, v.id + ' : mois manquant');
    assert.ok(STATUTS.indexOf(v.statut) !== -1, v.id + ' : statut inconnu');
    assert.ok(PT.explications[v.id], v.id + ' : pas d\'explication « pourquoi »');
  });
});

test('Ponts thermiques : chaque liaison a un cas standard pour ITI, ITE et ITR', function () {
  PT.liaisons.forEach(function (l) {
    PT.isolations.forEach(function (i) {
      const ok = PT.valeurs.some(function (v) { return v.liaison === l.id && v.isolation === i.id && v.variante === 'standard'; });
      assert.ok(ok, l.id + ' / ' + i.id + ' : pas de cas standard');
    });
  });
});

test('Dossier bâtiment : chaque prix d\'énergie a une source, un mois et un statut ; le bâtiment d\'exemple est complet', function () {
  const E = window.BATIMENT_EXEMPLE;
  assert.ok(['TTC', 'HT'].indexOf(E.energies.base) !== -1);
  assert.ok(sansDoublon(E.energies.liste.map(function (e) { return e.id; })), 'énergies en double');
  E.energies.liste.forEach(function (e) {
    assert.ok(e.prix > 0 && e.prix < 2, e.id + ' : prix hors de la plage plausible');
    assert.ok(e.source && e.source.trim(), e.id + ' : source manquante');
    assert.match(e.dateRef, /^\d{4}-\d{2}$/, e.id + ' : mois manquant');
    assert.ok(STATUTS.indexOf(e.statut) !== -1, e.id + ' : statut inconnu');
  });
  const b = E.batiment;
  [['climat', 'dju'], ['climat', 'ti'], ['climat', 'tbase'], ['chauffage', 'rendement']].forEach(function (x) {
    assert.ok(isFinite(b[x[0]][x[1]]), x[1] + ' manquant');
    assert.ok(b[x[0]][x[1] + 'Source'], x[1] + ' : source manquante');
    assert.ok(STATUTS.indexOf(b[x[0]][x[1] + 'Statut']) !== -1, x[1] + ' : statut inconnu');
  });
  assert.ok(E.energies.liste.some(function (e) { return e.id === b.chauffage.energie; }), 'énergie de chauffage inconnue');
  Object.keys(b.consommations.valeurs).forEach(function (id) {
    assert.ok(E.energies.liste.some(function (e) { return e.id === id; }), 'consommation d\'une énergie inconnue : ' + id);
  });
});

test('Ponts thermiques : chaque fRsi d\'exemple est entre 0 et 1, et plus faible quand ψ est fort (même liaison)', function () {
  PT.valeurs.forEach(function (v) {
    assert.ok(v.fRsi > 0 && v.fRsi <= 1, v.id + ' : fRsi hors de 0 à 1');
  });
  assert.ok(PT.reglages.humidite.hr > 0 && PT.reglages.humidite.source, 'humidité intérieure sans valeur ou sans source');
  PT.liaisons.forEach(function (l) {
    const v = PT.valeurs.filter(function (x) { return x.liaison === l.id; });
    v.forEach(function (a) {
      v.forEach(function (b) {
        if (a.psi > b.psi + 0.05) assert.ok(a.fRsi <= b.fRsi, l.id + ' : ' + a.id + ' a un ψ plus fort mais un fRsi meilleur que ' + b.id);
      });
    });
  });
});

test('Confort d\'été : chaque matériau a des λ, ρ, c plausibles, une source, un mois, un statut ; chaque paroi d\'exemple est complète', function () {
  charger('donnees/confort-materiaux.js');
  const CM = window.CONFORT_MATERIAUX;
  const familles = CM.familles.map(function (f) { return f.id; });
  assert.ok(sansDoublon(CM.materiaux.map(function (m) { return m.id; })), 'matériaux en double');
  CM.materiaux.forEach(function (m) {
    assert.ok(familles.indexOf(m.famille) !== -1, m.id + ' : famille inconnue');
    assert.ok(m.lambda > 0.015 && m.lambda < 5, m.id + ' : λ hors plage');
    assert.ok(m.rho >= 10 && m.rho <= 3000, m.id + ' : ρ hors plage');
    assert.ok(m.c >= 500 && m.c <= 2500, m.id + ' : c hors plage');
    assert.ok(m.source && m.source.trim(), m.id + ' : source manquante');
    assert.match(m.dateRef, /^\d{4}-\d{2}$/, m.id + ' : mois manquant');
    assert.ok(STATUTS.indexOf(m.statut) !== -1, m.id + ' : statut inconnu');
  });
  assert.ok(sansDoublon(CM.parois.map(function (p) { return p.id; })), 'parois en double');
  CM.parois.forEach(function (p) {
    assert.ok(['exterieure', 'interieure'].indexOf(p.type) !== -1, p.id + ' : type inconnu');
    assert.ok(p.couches.length > 0, p.id + ' : aucune couche');
    p.couches.forEach(function (c) {
      assert.ok(CM.materiaux.some(function (m) { return m.id === c.materiau; }), p.id + ' : matériau ' + c.materiau + ' inconnu');
      assert.ok(c.e > 0 && c.e < 1, p.id + ' : épaisseur en mètres attendue');
    });
  });
  CM.local.elements.forEach(function (e) {
    assert.ok(CM.parois.some(function (p) { return p.id === e.paroi; }), 'local : paroi ' + e.paroi + ' inconnue');
  });
  assert.ok(CM.onde.source && STATUTS.indexOf(CM.onde.statut) !== -1, 'onde d\'exemple sans source');
});

test('Lexique : chaque terme a un identifiant unique, une définition, et ses motifs ne sont pas partagés', function () {
  charger('donnees/lexique.js');
  const T = window.LEXIQUE.termes;
  assert.ok(T.length >= 20);
  assert.ok(sansDoublon(T.map(function (t) { return t.id; })), 'identifiants en double');
  const motifs = [];
  T.forEach(function (t) {
    assert.ok(t.terme && t.definition && t.definition.length > 20, t.id + ' : définition manquante');
    (t.motifs || []).forEach(function (m) { motifs.push(m.toLowerCase()); });
  });
  assert.ok(sansDoublon(motifs), 'un même motif renvoie vers deux termes');
});

test('Confidentialité : aucun nom de l\'entreprise dans les données publiques', function () {
  fs.readdirSync(path.join(RACINE, 'donnees')).forEach(function (f) {
    const texte = fs.readFileSync(path.join(RACINE, 'donnees', f), 'utf8');
    assert.ok(!/argetec/i.test(texte), f + ' contient « Argetec »');
  });
});
