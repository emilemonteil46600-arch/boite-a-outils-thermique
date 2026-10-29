/* Tests des ponts thermiques : on rejoue l'exemple de l'onglet Méthode et quelques cas limites.
   Lancer : node --test (depuis la racine du dépôt) */
const test = require('node:test');
const assert = require('node:assert/strict');
const { charger, proche } = require('./aide-tests.js');

charger('donnees/ponts-thermiques-exemple.js');
const C = charger('outils/ponts-thermiques/calcul.js');
const E = window.PONTS_EXEMPLE;
const BIBLIO = { valeurs: E.valeurs, reglages: E.reglages };

function calcul(lignes, hParois) {
  return C.calculerProjet({ hParois: hParois === undefined ? 320 : hParois, lignes: lignes }, BIBLIO);
}
const pct = function (v) { return Math.round(v * 100); };

test('Exemple Méthode, ITI : 0,90×60 + 0,70×20 + 0,10×80 = 76 W/K → 19 % (16 – 22 %)', function () {
  const r = calcul([{ valeurId: 'pi-iti', longueur: 60 }, { valeurId: 'rf-iti', longueur: 20 }, { valeurId: 'me-iti', longueur: 80 }]);
  assert.ok(proche(r.hPonts.valeur, 76));
  assert.ok(proche(r.hTotal.valeur, 396));
  assert.equal(pct(r.part.valeur), 19);
  assert.equal(pct(r.part.bas), 16);
  assert.equal(pct(r.part.haut), 22);
  assert.equal(Math.round(r.hPonts.bas), 61);
  assert.equal(Math.round(r.hPonts.haut), 91);
});

test('Exemple Méthode, après ITE : 39 W/K → 11 %', function () {
  const r = calcul([{ valeurId: 'pi-ite', longueur: 60 }, { valeurId: 'rf-ite', longueur: 20 }, { valeurId: 'me-ite', longueur: 80 }]);
  assert.ok(proche(r.hPonts.valeur, 39));
  assert.equal(pct(r.part.valeur), 11);
});

test('Exemple Méthode, ITE + retour d\'isolant en tableau : 19 W/K → 6 %', function () {
  const r = calcul([{ valeurId: 'pi-ite', longueur: 60 }, { valeurId: 'rf-ite', longueur: 20 }, { valeurId: 'me-ite-retour', longueur: 80 }]);
  assert.ok(proche(r.hPonts.valeur, 19));
  assert.equal(pct(r.part.valeur), 6);
});

test('ψ × L d\'une liaison', function () {
  assert.ok(proche(C.deperditionLiaison(0.9, 60), 54));
});

test('Lecture des ψ avec les seuils d\'exemple', function () {
  const s = E.reglages.seuils;
  assert.equal(C.niveauPsi(0.10, s), 'faible');
  assert.equal(C.niveauPsi(0.30, s), 'moyen');
  assert.equal(C.niveauPsi(0.60, s), 'fort');
  assert.equal(C.niveauPsi(0.90, s), 'tres-fort');
});

test('Sans Σ U × A, la part n\'est pas calculée (et c\'est signalé)', function () {
  const r = calcul([{ valeurId: 'pi-iti', longueur: 10 }], 0);
  assert.equal(r.part.valeur, null);
  assert.equal(r.vigilance.sansParois, true);
});

test('Une longueur négative compte pour 0 et est signalée « sans longueur »', function () {
  const r = calcul([{ valeurId: 'pi-iti', longueur: -20 }]);
  assert.equal(r.hPonts.valeur, 0);
  assert.equal(r.vigilance.lignesSansLongueur, 1);
});

test('Une valeur supprimée du catalogue est signalée, sans planter', function () {
  const r = calcul([{ valeurId: 'inconnue', longueur: 10 }]);
  assert.equal(r.vigilance.lignesErreur, 1);
});

test('Les variantes d\'une liaison commencent par le cas standard', function () {
  const v = C.variantes(BIBLIO, 'plancher-inter', 'ITI');
  assert.equal(v[0].variante, 'standard');
  assert.equal(v.length, 2);
});
