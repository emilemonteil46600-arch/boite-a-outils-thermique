/* ==========================================================
   Vérification dans un vrai navigateur (Chromium, via Playwright).
   Ce n'est PAS lancé par « node --test » ni sur GitHub : il faut
   Playwright installé sur la machine. Lancer : node tests/navigateur.js

   Vérifie : aucune erreur dans la console, pas de défilement horizontal
   à 390 px (clair et sombre), les exemples des onglets Méthode affichés
   à l'écran, la sauvegarde complète et sa restauration.
   ========================================================== */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');

const RACINE = path.join(__dirname, '..');
const url = function (page) { return 'file://' + path.join(RACINE, page); };
const PAGES = ['index.html', 'outils/batiment/index.html', 'outils/chiffrage/index.html', 'outils/ponts-thermiques/index.html'];
const problemes = [];
const ok = function (condition, message) {
  if (condition) console.log('  ✓ ' + message);
  else { console.log('  ✗ ' + message); problemes.push(message); }
};

async function nouvellePage(navigateur, options) {
  const contexte = await navigateur.newContext(Object.assign({ acceptDownloads: true }, options));
  const page = await contexte.newPage();
  page.on('pageerror', function (e) { problemes.push('Erreur JavaScript : ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') problemes.push('Console : ' + m.text()); });
  page.on('dialog', function (d) { d.accept(); });
  return page;
}

async function largeurs(page) {
  return page.evaluate(function () { return [document.documentElement.scrollWidth, window.innerWidth]; });
}

(async function () {
  const navigateur = await chromium.launch();

  console.log('1. Affichage sur téléphone (390 px), clair et sombre');
  for (const theme of ['light', 'dark']) {
    const page = await nouvellePage(navigateur, { viewport: { width: 390, height: 844 }, colorScheme: theme });
    for (const p of PAGES) {
      await page.goto(url(p));
      const onglets = await page.$$('[data-onglet]');
      for (const o of (onglets.length ? onglets : [null])) {
        if (o) await o.click();
        const [doc, ecran] = await largeurs(page);
        ok(doc <= ecran, theme + ' · ' + p + (o ? ' · ' + await o.textContent() : '') + ' : pas de défilement horizontal');
      }
    }
    await page.context().close();
  }

  console.log('2. Exemple de la Méthode du chiffrage');
  let page = await nouvellePage(navigateur, { viewport: { width: 1280, height: 900 } });
  await page.goto(url('outils/chiffrage/index.html'));
  const dernierMois = await page.evaluate(function () { return Object.keys(window.BT01.valeurs).sort().pop(); });
  await page.selectOption('#ajout-poste', 'ite-enduit');
  await page.click('#btn-ajouter');
  await page.fill('#corps-lignes input[data-champ="quantite"]', '300');
  await page.click('[data-niveau="3"]');
  await page.check('#site-occupe');
  const travaux = (await page.textContent('#resultats .resultat-ligne')).replace(/\s/g, ' ');
  if (dernierMois === '2026-08') ok(travaux.includes('48 100 – 76 100'), 'Travaux = 48 100 – 76 100 € (' + travaux.trim() + ')');
  else console.log('  · BT01 mis à jour (' + dernierMois + ') : montant de l\'exemple non comparé');
  await page.fill('#corps-lignes input[data-champ="quantite"]', '-50');
  ok((await page.textContent('#resultats')).includes('sans quantité'), 'Quantité négative refusée et signalée');
  await page.fill('#corps-lignes input[data-champ="quantite"]', '300');
  await page.fill('#nom-projet', 'École — état initial');
  const [csv] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="export-csv"]')]);
  ok(/^Ecole-etat-initial_\d{4}-\d{2}-\d{2}\.csv$/.test(csv.suggestedFilename()), 'Nom du fichier exporté sans accents : ' + csv.suggestedFilename());
  const nbPostes = function () { return page.$$eval('#corps-lignes tr[data-ligne]', function (t) { return t.length; }); };
  await page.click('#btn-enregistrer');
  await page.click('#btn-nouveau');
  ok(await nbPostes() === 0, 'Mes chiffrages : « Nouveau » repart de zéro');
  await page.selectOption('#liste-projets', 'École — état initial');
  await page.click('#btn-ouvrir');
  ok(await nbPostes() === 1 && await page.inputValue('#nom-projet') === 'École — état initial', 'Mes chiffrages : « Ouvrir » retrouve le chiffrage enregistré');
  await page.click('#btn-supprimer-projet');
  ok((await page.textContent('#liste-projets')).includes('Aucun chiffrage enregistré'), 'Mes chiffrages : « Supprimer » le retire de la liste');
  await page.fill('#corps-gains tr[data-energie="gaz"] input', '120000');
  const retour = (await page.textContent('#resultats')).replace(/\s/g, ' ');
  if (dernierMois === '2026-08') ok(retour.includes('20 – 32 ans') && retour.includes('3 300 € TTC/an'), 'Gains : 3 300 € TTC/an, temps de retour 20 – 32 ans');
  await page.click('#btn-dupliquer-scenario');
  ok(await page.$$eval('#choix-scenarios [data-scenario]', function (b) { return b.length; }) === 2, 'Dupliquer : 2 scénarios');
  ok(await page.$$eval('#comparaison .comparaison-scenario', function (t) { return t.length; }) === 2, 'Comparaison des 2 scénarios affichée');

  console.log('3. Exemple de la Méthode des ponts thermiques');
  await page.goto(url('outils/ponts-thermiques/index.html'));
  const ajouter = async function (liaison, isolation, variante, longueur) {
    await page.click('[data-liaison="' + liaison + '"]');
    await page.click('[data-isolation="' + isolation + '"]');
    await page.selectOption('#choix-variante', variante);
    await page.fill('#longueur-ajout', longueur);
    await page.click('#btn-ajouter');
  };
  await ajouter('plancher-inter', 'ITI', 'pi-iti', '60');
  await ajouter('refend', 'ITI', 'rf-iti', '20');
  await ajouter('menuiserie', 'ITI', 'me-iti', '80');
  await page.fill('#h-parois', '320');
  const part = (await page.textContent('#resultats .gros-chiffre')).replace(/\s/g, ' ');
  ok(part.includes('16 – 22 %'), 'Part des ponts thermiques = 16 – 22 % (' + part.trim() + ')');
  ok((await page.textContent('#resultats')).replace(/\s/g, ' ').includes('= 472 €'), 'Ponts thermiques en euros : ≈ 472 €/an (bâtiment d\'exemple)');
  const schemas = await page.$$eval('#onglet-methode svg', function (s) { return s.length; });
  ok(schemas === 2, 'Les 2 schémas de la Méthode sont dessinés');

  console.log('4. Dossier bâtiment partagé et ancien chiffrage');
  await page.goto(url('outils/batiment/index.html'));
  ok((await page.textContent('#resultats .gros-chiffre')).replace(/\s/g, ' ').includes('6,21'), '1 W/K coûte 6,21 €/an (bâtiment d\'exemple)');
  await page.fill('#corps-hypotheses tr[data-hyp="0"] input[data-champ="valeur"]', '2500');
  await page.press('#corps-hypotheses tr[data-hyp="0"] input[data-champ="valeur"]', 'Tab');
  ok((await page.textContent('#resultats .gros-chiffre')).replace(/\s/g, ' ').includes('7,76'), 'DJU 2 500 → 7,76 €/an par W/K');
  await page.goto(url('outils/ponts-thermiques/index.html'));
  ok((await page.textContent('#resume-batiment')).replace(/\s/g, ' ').includes('DJU 2 500'), 'Les ponts thermiques lisent le dossier bâtiment modifié');
  await page.evaluate(function () {
    localStorage.setItem('bao.chiffrage.projet.v1', JSON.stringify({ nom: 'Ancien', typeBatiment: 'tertiaire', complexite: 2, siteOccupe: false,
      frais: { moe: 10, aleas: 5, tva: 20 }, arrondi: 100, lignes: [{ id: 'l1', ratioId: 'ite-enduit', quantite: 100 }] }));
  });
  await page.goto(url('outils/chiffrage/index.html'));
  ok(await page.$$eval('#choix-scenarios [data-scenario]', function (b) { return b.length; }) === 1 &&
    await page.$$eval('#corps-lignes tr[data-ligne]', function (t) { return t.length; }) === 1, 'Ancien chiffrage (sans scénario) : repris dans « Scénario 1 »');

  console.log('5. Rappel de sauvegarde, sauvegarde complète et restauration');
  await page.reload();
  ok(await page.$('.rappel-sauvegarde') !== null, 'Rappel affiché : données jamais sauvegardées');
  const [sauvegarde] = await Promise.all([page.waitForEvent('download'), page.click('.rappel-sauvegarde [data-action="sauver"]')]);
  const fichier = path.join(os.tmpdir(), sauvegarde.suggestedFilename());
  await sauvegarde.saveAs(fichier);
  const contenu = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  ok(contenu.format === 'bao-sauvegarde-complete' && contenu.donnees['bao.ponts.projet.v1'] && contenu.donnees['bao.chiffrage.projet.v1'],
    'Sauvegarde complète : chiffrage + ponts thermiques (' + Object.keys(contenu.donnees).length + ' éléments)');
  await page.reload();
  ok(await page.$('.rappel-sauvegarde') === null, 'Plus de rappel après la sauvegarde');
  await page.context().close();

  page = await nouvellePage(navigateur, { viewport: { width: 1280, height: 900 } });
  await page.goto(url('index.html'));
  ok((await page.textContent('#mes-donnees')).includes('Aucune donnée'), 'Nouvel appareil : aucune donnée');
  await Promise.all([page.waitForNavigation(), page.setInputFiles('#mes-donnees input[type="file"]', fichier)]);
  const lignes = await page.evaluate(function () { return JSON.parse(localStorage.getItem('bao.ponts.projet.v1')).lignes.length; });
  ok(lignes === 3, 'Restauration : le calcul des ponts thermiques est revenu (3 liaisons)');
  ok((await page.textContent('#mes-donnees')).includes('tout est sauvegardé'), 'Après restauration : tout est marqué sauvegardé');
  await page.context().close();
  fs.unlinkSync(fichier);

  await navigateur.close();
  console.log(problemes.length ? '\n' + problemes.length + ' problème(s) :\n- ' + problemes.join('\n- ') : '\nTout est bon.');
  process.exit(problemes.length ? 1 : 0);
})();
