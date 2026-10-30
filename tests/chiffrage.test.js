/* Tests du chiffrage : on rejoue les exemples de l'onglet Méthode et quelques cas limites.
   Lancer : node --test (depuis la racine du dépôt) */
const test = require('node:test');
const assert = require('node:assert/strict');
const { charger, proche } = require('./aide-tests.js');

charger('donnees/bt01.js');
charger('donnees/chiffrage-exemple.js');
const C = charger('outils/chiffrage/calcul.js');
const EXEMPLE = window.CHIFFRAGE_EXEMPLE;

// Table BT01 arrêtée à août 2026, comme dans l'exemple de la Méthode
// (le test reste juste quand tu ajoutes de nouveaux mois).
const BT01_AOUT_2026 = {};
Object.keys(window.BT01.valeurs).filter(function (m) { return m <= '2026-08'; })
  .forEach(function (m) { BT01_AOUT_2026[m] = window.BT01.valeurs[m]; });

// Bâtiment d'exemple : gaz 150 000 kWh + électricité 40 000 kWh, prix TTC d'exemple.
const ENERGIE = { avant: { gaz: 150000, electricite: 40000 }, prix: { gaz: 0.11, electricite: 0.22 }, base: 'TTC' };

function projet(lignes, autres) {
  return Object.assign({ typeBatiment: 'tertiaire', complexite: 2, siteOccupe: false, frais: {}, lignes: lignes }, autres || {});
}
function premier(res) { return res.scenarios[0]; }

test('Exemple de la Méthode : ITE 300 m², complexité 3, site occupé → 48 100 – 76 100 € HT', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: 300 }], { complexite: 3, siteOccupe: true }), EXEMPLE, BT01_AOUT_2026);
  assert.equal(C.arrondir(premier(res).travaux.bas, 100), 48100);
  assert.equal(C.arrondir(premier(res).travaux.haut, 100), 76100);
  assert.ok(proche(res.contexte.produit, 1.265, 1e-9), 'coef. bâtiment 1,00 × 1,15 × 1,10');
});

test('Exemple de la Méthode : gaz 150 000 → 120 000 kWh → 3 300 €/an, retour 20 – 32 ans (coût TTC)', function () {
  const p = projet([{ ratioId: 'ite-enduit', quantite: 300, scenarioId: 's1' }], {
    complexite: 3, siteOccupe: true, frais: { moe: 10, aleas: 5, tva: 20 },
    scenarios: [{ id: 's1', nom: 'ITE', consosApres: { gaz: 120000 } }]
  });
  const s = premier(C.calculerProjet(p, EXEMPLE, BT01_AOUT_2026, ENERGIE));
  assert.equal(Math.round(s.totalTTC.bas), 66368);
  assert.equal(Math.round(s.totalTTC.haut), 105083);
  assert.equal(s.gains.gainKwh, 30000);
  assert.ok(proche(s.gains.gainEuros, 3300));
  assert.equal(Math.round(s.gains.gainPct * 100), 16);
  assert.equal(Math.round(s.retour.bas), 20);
  assert.equal(Math.round(s.retour.haut), 32);
});

test('Changement d\'énergie (gaz → PAC) : le gaz baisse, l\'électricité monte, chacun à son prix', function () {
  const g = C.gainsScenario({ gaz: 150000, electricite: 40000 }, { gaz: 0, electricite: 70000 }, { gaz: 0.11, electricite: 0.22 });
  assert.equal(g.gainKwh, 120000);
  assert.ok(proche(g.gainEuros, 150000 * 0.11 - 30000 * 0.22));
  const elec = g.lignes.find(function (l) { return l.id === 'electricite'; });
  assert.equal(elec.gainKwh, -30000);
});

test('Une consommation « après » vide = consommation inchangée', function () {
  const g = C.gainsScenario({ gaz: 150000, electricite: 40000 }, { gaz: 120000 }, { gaz: 0.11, electricite: 0.22 });
  const elec = g.lignes.find(function (l) { return l.id === 'electricite'; });
  assert.equal(elec.inchange, true);
  assert.equal(elec.gainKwh, 0);
  assert.equal(g.totalApres, 160000);
});

test('Sans consommation après travaux, pas de temps de retour', function () {
  const s = premier(C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: 300 }]), EXEMPLE, BT01_AOUT_2026, ENERGIE));
  assert.equal(s.gains.apresSaisi, false);
  assert.equal(s.retour, null);
  assert.equal(C.tempsDeRetour(10000, 0), null);
});

test('Coût HT avec des prix HT : le temps de retour se calcule sur le HT', function () {
  const p = projet([{ ratioId: 'ite-enduit', quantite: 100, scenarioId: 's1' }], {
    frais: { tva: 20 }, scenarios: [{ id: 's1', consosApres: { gaz: 140000 } }]
  });
  const s = premier(C.calculerProjet(p, EXEMPLE, BT01_AOUT_2026, Object.assign({}, ENERGIE, { base: 'HT' })));
  assert.equal(s.base, 'HT');
  assert.ok(proche(s.retour.bas, s.totalHT.bas / s.gains.gainEuros));
});

test('Scénarios : chacun ses lignes et ses totaux ; un ancien chiffrage sans scénario = un seul scénario', function () {
  const p = projet([
    { ratioId: 'ite-enduit', quantite: 100, scenarioId: 'a' },
    { ratioId: 'pac-air-eau', quantite: 50, scenarioId: 'b' },
    { ratioId: 'ite-enduit', quantite: 100, scenarioId: 'b' },
    { ratioId: 'led', quantite: 10, scenarioId: 'inconnu' }
  ], { scenarios: [{ id: 'a', nom: 'Enveloppe' }, { id: 'b', nom: 'Enveloppe + PAC' }] });
  const res = C.calculerProjet(p, EXEMPLE, BT01_AOUT_2026);
  assert.equal(res.scenarios.length, 2);
  assert.equal(res.scenarios[0].lignes.length, 2, 'la ligne au scénario inconnu va dans le premier');
  assert.equal(res.scenarios[1].lignes.length, 2);
  assert.ok(res.scenarios[1].travaux.bas > res.scenarios[0].travaux.bas);

  const ancien = C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: 300 }]), EXEMPLE, BT01_AOUT_2026);
  assert.equal(ancien.scenarios.length, 1);
  assert.equal(ancien.scenarios[0].lignes.length, 1);
});

test('Actualisation BT01 : 139,4 (août 2026) / 132,0 (janv. 2025) = 1,056', function () {
  const a = C.coefActualisation('2025-01', BT01_AOUT_2026);
  assert.equal(a.actualise, true);
  assert.equal(a.moisActuel, '2026-08');
  assert.ok(proche(a.coef, 139.4 / 132.0));
  assert.equal(Math.round(a.coef * 1000) / 1000, 1.056);
});

test('Un prix sans date n\'est pas actualisé (coef 1) et c\'est signalé', function () {
  const a = C.coefActualisation('', BT01_AOUT_2026);
  assert.equal(a.coef, 1);
  assert.equal(a.actualise, false);
});

test('MOE et aléas sur les travaux, TVA sur le total HT', function () {
  const biblio = { ratios: [{ id: 'r', prixBas: 100, prixHaut: 100 }], typesBatiment: [], complexite: [] };
  const s = premier(C.calculerProjet(projet([{ ratioId: 'r', quantite: 1 }], { frais: { moe: 10, aleas: 5, tva: 20 } }), biblio, {}));
  assert.ok(proche(s.totalHT.bas, 115));
  assert.ok(proche(s.totalTTC.bas, 138));
});

test('Une quantité négative compte pour 0 et est signalée « sans quantité »', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: -50 }]), EXEMPLE, BT01_AOUT_2026);
  assert.equal(premier(res).travaux.bas, 0);
  assert.equal(res.vigilance.lignesSansQuantite, 1);
});

test('Un poste supprimé de la bibliothèque est signalé, sans planter', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'inconnu', quantite: 10 }]), EXEMPLE, BT01_AOUT_2026);
  assert.equal(res.vigilance.lignesErreur, 1);
  assert.equal(premier(res).travaux.haut, 0);
});

test('Arrondi d\'affichage', function () {
  assert.equal(C.arrondir(48093, 100), 48100);
  assert.equal(C.arrondir(48093, 0), 48093);
});
