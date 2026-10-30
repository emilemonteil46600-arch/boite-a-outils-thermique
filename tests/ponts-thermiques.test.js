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

test('Exemple Méthode « Combien ça coûte » : 76 W/K ≈ 472 €/an, après ITE 39 W/K ≈ 242 €/an', function () {
  charger('donnees/batiment-exemple.js');
  const B = charger('outils/batiment/calcul.js');
  const r = calcul([{ valeurId: 'pi-iti', longueur: 60 }, { valeurId: 'rf-iti', longueur: 20 }, { valeurId: 'me-iti', longueur: 80 }]);
  const en = B.enEnergie(r.hPonts, window.BATIMENT_EXEMPLE.batiment, window.BATIMENT_EXEMPLE.energies);
  assert.equal(en.valeur.besoin, 3648);
  assert.equal(Math.round(en.valeur.euros), 472);
});

test('Point de rosée (Magnus) : 20 °C et 50 % → 9,3 °C', function () {
  assert.equal(Math.round(C.pointDeRosee(20, 50) * 10) / 10, 9.3);
});

test('Exemple Méthode condensation : 19 °C, 50 %, −7 °C dehors', function () {
  const cond = { ti: 19, te: -7, hr: 50 };
  const plancher = C.risqueCondensation(0.75, cond);
  assert.equal(Math.round(plancher.surface * 10) / 10, 12.5);
  assert.equal(Math.round(plancher.rosee * 10) / 10, 8.3);
  assert.equal(Math.round(plancher.moisissure * 10) / 10, 11.7);
  assert.equal(Math.round(plancher.fRsiMin * 100) / 100, 0.72);
  assert.equal(plancher.niveau, 'ok');
  assert.equal(Math.round(C.risqueCondensation(0.68, cond).surface * 10) / 10, 10.7);
  assert.equal(C.risqueCondensation(0.68, cond).niveau, 'moisissures');
  assert.equal(C.risqueCondensation(0.95, cond).niveau, 'ok');
  const humide = C.risqueCondensation(0.68, { ti: 19, te: -7, hr: 60 });
  assert.equal(Math.round(humide.rosee * 10) / 10, 11.1);
  assert.equal(humide.niveau, 'condensation');
});

test('fRsi inconnu ou hors de 0 à 1 : pas de verdict plutôt qu\'un faux résultat', function () {
  assert.equal(C.risqueCondensation(undefined, { ti: 19, te: -7, hr: 50 }), null);
  assert.equal(C.risqueCondensation(1.4, { ti: 19, te: -7, hr: 50 }), null);
});

test('Le projet compte les liaisons à risque (acrotère ITI et fenêtre ITE à −7 °C)', function () {
  const BIBLIO_H = { valeurs: E.valeurs, reglages: E.reglages };
  const r = C.calculerProjet({ hParois: 320, lignes: [
    { valeurId: 'pi-iti', longueur: 60 }, { valeurId: 'ac-iti', longueur: 40 }, { valeurId: 'me-ite', longueur: 80 }
  ] }, BIBLIO_H, { ti: 19, te: -7 });
  assert.equal(r.conditions.hr, 50, 'humidité prise dans les réglages');
  assert.equal(r.vigilance.lignesMoisissures, 2);
  assert.equal(r.vigilance.lignesCondensation, 0);
});

