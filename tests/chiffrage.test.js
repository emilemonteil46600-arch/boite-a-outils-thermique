/* Tests du chiffrage : on rejoue l'exemple de l'onglet Méthode et quelques cas limites.
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

function projet(lignes, autres) {
  return Object.assign({ typeBatiment: 'tertiaire', complexite: 2, siteOccupe: false, frais: {}, lignes: lignes }, autres || {});
}

test('Exemple de la Méthode : ITE 300 m², complexité 3, site occupé → 48 100 – 76 100 € HT', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: 300 }], { complexite: 3, siteOccupe: true }), EXEMPLE, BT01_AOUT_2026);
  assert.equal(C.arrondir(res.travaux.bas, 100), 48100);
  assert.equal(C.arrondir(res.travaux.haut, 100), 76100);
  assert.ok(proche(res.contexte.produit, 1.265, 1e-9), 'coef. bâtiment 1,00 × 1,15 × 1,10');
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
  const res = C.calculerProjet(projet([{ ratioId: 'r', quantite: 1 }], { frais: { moe: 10, aleas: 5, tva: 20 } }), biblio, {});
  assert.ok(proche(res.totalHT.bas, 115));
  assert.ok(proche(res.totalTTC.bas, 138));
});

test('Une quantité négative compte pour 0 et est signalée « sans quantité »', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'ite-enduit', quantite: -50 }]), EXEMPLE, BT01_AOUT_2026);
  assert.equal(res.travaux.bas, 0);
  assert.equal(res.vigilance.lignesSansQuantite, 1);
});

test('Un poste supprimé de la bibliothèque est signalé, sans planter', function () {
  const res = C.calculerProjet(projet([{ ratioId: 'inconnu', quantite: 10 }]), EXEMPLE, BT01_AOUT_2026);
  assert.equal(res.vigilance.lignesErreur, 1);
  assert.equal(res.travaux.haut, 0);
});

test('Arrondi d\'affichage', function () {
  assert.equal(C.arrondir(48093, 100), 48100);
  assert.equal(C.arrondir(48093, 0), 48093);
});
