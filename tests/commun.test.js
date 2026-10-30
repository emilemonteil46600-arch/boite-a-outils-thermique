/* Tests des fonctions partagées (commun/commun.js).
   Lancer : node --test (depuis la racine du dépôt) */
const test = require('node:test');
const assert = require('node:assert/strict');
const { charger } = require('./aide-tests.js');

const BAO = charger('commun/commun.js');
const JOUR = 24 * 3600 * 1000;
const espaces = function (t) { return t.replace(/\s/g, ' '); };

test('Les clés de sauvegarde n\'ont pas été renommées (sinon Émile perd ses données)', function () {
  assert.deepEqual(Object.keys(BAO.CLES_DONNEES).sort(), [
    'bao.batiment.v1', 'bao.batiments.v1',
    'bao.bt01.perso.v1',
    'bao.chiffrage.biblio.v1', 'bao.chiffrage.projet.v1', 'bao.chiffrage.projets.v1',
    'bao.energies.v1',
    'bao.ponts.biblio.v1', 'bao.ponts.projet.v1', 'bao.ponts.projets.v1'
  ]);
});

test('Lecture des nombres tapés à la française', function () {
  assert.equal(BAO.lireNombre('1 250,5'), 1250.5);
  assert.equal(BAO.lireNombre('1 250,5'), 1250.5);
  assert.equal(BAO.lireNombre('1250.5'), 1250.5);
  assert.ok(isNaN(BAO.lireNombre('')));
  assert.equal(BAO.lirePositif('2,5'), 2.5);
  assert.equal(BAO.lirePositif('-3'), '');
  assert.equal(BAO.lirePositif('abc'), '');
  assert.equal(BAO.versChamp(12.5), '12,5');
  assert.equal(BAO.versChamp(''), '');
});

test('Affichage des nombres au format français', function () {
  assert.equal(espaces(BAO.nombre(1234.5, 1)), '1 234,5');
  assert.equal(espaces(BAO.nombre(48093)), '48 093');
  assert.equal(BAO.nombre(NaN), '–');
});

test('Noms de fichiers sans accents ni signes', function () {
  assert.equal(BAO.nomFichier('École — état 1', 'x'), 'Ecole-etat-1');
  assert.equal(BAO.nomFichier('Maîtrise d\'œuvre', 'x'), 'Maitrise-d-oeuvre');
  assert.equal(BAO.nomFichier('   ', 'chiffrage'), 'chiffrage');
});

test('Rappel de sauvegarde : jamais sauvegardé → rappel', function () {
  const e = BAO.etatSauvegarde({ exports: {}, modifs: {} }, ['bao.chiffrage.biblio.v1'], Date.now());
  assert.equal(e.rappel, true);
  assert.deepEqual(e.nonSauvegardees, ['bao.chiffrage.biblio.v1']);
  assert.equal(e.derniere, null);
});

test('Rappel de sauvegarde : modifié après une sauvegarde récente → signalé, mais pas encore de rappel', function () {
  const maintenant = Date.now();
  const suivi = {
    exports: { 'bao.chiffrage.biblio.v1': new Date(maintenant - 3 * JOUR).toISOString() },
    modifs: { 'bao.chiffrage.biblio.v1': new Date(maintenant - JOUR).toISOString() }
  };
  const e = BAO.etatSauvegarde(suivi, ['bao.chiffrage.biblio.v1'], maintenant);
  assert.equal(e.nonSauvegardees.length, 1);
  assert.equal(e.rappel, false);
});

test('Rappel de sauvegarde : modifié après une sauvegarde de plus de 14 jours → rappel', function () {
  const maintenant = Date.now();
  const suivi = {
    exports: { 'bao.chiffrage.biblio.v1': new Date(maintenant - 20 * JOUR).toISOString() },
    modifs: { 'bao.chiffrage.biblio.v1': new Date(maintenant - JOUR).toISOString() }
  };
  assert.equal(BAO.etatSauvegarde(suivi, ['bao.chiffrage.biblio.v1'], maintenant).rappel, true);
});

test('Rappel de sauvegarde : rien de modifié depuis la sauvegarde → pas de rappel, même ancienne', function () {
  const maintenant = Date.now();
  const date = new Date(maintenant - 60 * JOUR).toISOString();
  const suivi = { exports: { 'bao.ponts.biblio.v1': date }, modifs: { 'bao.ponts.biblio.v1': date } };
  const e = BAO.etatSauvegarde(suivi, ['bao.ponts.biblio.v1'], maintenant);
  assert.equal(e.rappel, false);
  assert.equal(e.nonSauvegardees.length, 0);
});

test('Écrire une donnée note sa date de modification ; une sauvegarde complète la contient', function () {
  localStorage.clear();
  BAO.ecrire('bao.chiffrage.biblio.v1', { ratios: [] });
  BAO.ecrire('bao.chiffrage.onglet', 'calcul');
  assert.deepEqual(BAO.clesPresentes(), ['bao.chiffrage.biblio.v1']);
  assert.equal(BAO.etatSauvegardeActuel().rappel, true);

  const contenu = BAO.contenuSauvegarde();
  assert.equal(contenu.format, BAO.FORMAT_SAUVEGARDE);
  assert.deepEqual(Object.keys(contenu.donnees), ['bao.chiffrage.biblio.v1']);

  BAO.noterExport(['bao.chiffrage.biblio.v1']);
  assert.equal(BAO.etatSauvegardeActuel().rappel, false);
});

test('Restaurer : seules les clés connues sont écrites', function () {
  localStorage.clear();
  globalThis.confirm = function () { return true; };
  const ok = BAO.restaurerSauvegarde({
    format: BAO.FORMAT_SAUVEGARDE,
    exporte_le: '2026-10-29T10:00:00.000Z',
    donnees: { 'bao.ponts.biblio.v1': { valeurs: [] }, 'cle.pirate': 'x' }
  });
  assert.equal(ok, true);
  assert.deepEqual(BAO.lire('bao.ponts.biblio.v1'), { valeurs: [] });
  assert.equal(localStorage.getItem('cle.pirate'), null);
  assert.equal(BAO.etatSauvegardeActuel().nonSauvegardees.length, 0);
  assert.throws(function () { BAO.restaurerSauvegarde({ format: 'autre' }); });
});

test('Tableau pour Word : texte à tabulations aligné sur les colonnes', function () {
  const t = BAO.tableauWord([{ titre: 'Poste' }, { titre: 'Coût', droite: true }], [['ITE', '1 000']], [['Total', '1 000', true]]);
  assert.equal(t.texte, 'Poste\tCoût\nITE\t1 000\nTotal\t1 000');
  assert.match(t.html, /colspan="1"/);
});

test('« il y a N jours »', function () {
  const m = Date.now();
  assert.equal(BAO.ilYA(m, m), 'aujourd\'hui');
  assert.equal(BAO.ilYA(m - JOUR, m), 'hier');
  assert.equal(BAO.ilYA(m - 12 * JOUR, m), 'il y a 12 jours');
});
