/* Tests du dossier bâtiment : on rejoue l'exemple de l'onglet Méthode (W/K → kWh → €).
   Lancer : node --test (depuis la racine du dépôt) */
const test = require('node:test');
const assert = require('node:assert/strict');
const { charger, proche } = require('./aide-tests.js');

charger('donnees/batiment-exemple.js');
const B = charger('outils/batiment/calcul.js');
const EX = window.BATIMENT_EXEMPLE;
const BATIMENT = EX.batiment;
const ENERGIES = EX.energies;

test('Exemple de la Méthode : 76 W/K, DJU 2 000, gaz 85 %, 0,11 €/kWh → 3 648 kWh, 4 292 kWh, ≈ 472 €/an, 1 976 W', function () {
  assert.equal(B.besoinAnnuel(76, 2000), 3648);
  const finale = B.energieFinale(3648, 85);
  assert.equal(Math.round(finale), 4292);
  assert.equal(Math.round(B.cout(finale, 0.11)), 472);
  assert.equal(B.puissance(76, 19, -7), 1976);
});

test('Ce que coûte 1 W/K avec le bâtiment d\'exemple : 48 kWh → 56,5 kWh de gaz → 6,21 €/an', function () {
  const u = B.enEnergie(1, BATIMENT, ENERGIES);
  assert.equal(u.valeur.besoin, 48);
  assert.equal(Math.round(u.valeur.finale * 10) / 10, 56.5);
  assert.equal(Math.round(u.valeur.euros * 100) / 100, 6.21);
  assert.equal(u.energie.id, 'gaz');
});

test('Une fourchette de W/K donne une fourchette de kWh et de €', function () {
  const en = B.enEnergie({ valeur: 76, bas: 60.8, haut: 91.2 }, BATIMENT, ENERGIES);
  assert.ok(en.bas.euros < en.valeur.euros && en.valeur.euros < en.haut.euros);
  assert.ok(proche(en.bas.besoin, 60.8 * 48, 1e-6));
});

test('Après ITE (39 W/K) : ≈ 242 €/an, soit ≈ 230 €/an d\'économie sur les ponts thermiques', function () {
  const avant = B.enEnergie(76, BATIMENT, ENERGIES).valeur.euros;
  const apres = B.enEnergie(39, BATIMENT, ENERGIES).valeur.euros;
  assert.equal(Math.round(apres), 242);
  assert.equal(Math.round((avant - apres) / 10) * 10, 230);
});

test('Rendement nul ou vide : pas de résultat plutôt qu\'une division par zéro', function () {
  assert.equal(B.energieFinale(1000, 0), null);
  assert.equal(B.energieFinale(1000, ''), null);
  assert.equal(B.cout(null, 0.11), null);
});

test('Bilan de l\'état initial d\'exemple : 190 000 kWh, 127 kWh/m²/an, 25 300 €/an', function () {
  const r = B.calculerBatiment(BATIMENT, ENERGIES);
  assert.equal(r.totalKwh, 190000);
  assert.equal(Math.round(r.ratio), 127);
  assert.ok(proche(r.totalEuros, 150000 * 0.11 + 40000 * 0.22, 1e-6));
  assert.ok(r.vigilance.nonValides.length > 0, 'les valeurs d\'exemple sont signalées');
  assert.equal(r.vigilance.sansDju, false);
});

test('Prix par énergie', function () {
  const p = B.prixParEnergie(ENERGIES);
  assert.equal(p.gaz, 0.11);
  assert.equal(p.electricite, 0.22);
});
