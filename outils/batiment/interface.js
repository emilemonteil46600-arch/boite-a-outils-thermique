/* ==========================================================
   DOSSIER BÂTIMENT — INTERFACE
   ----------------------------------------------------------
   Affichage, boutons, sauvegarde. Aucun calcul ici :
   tous les calculs passent par BatimentCalcul (calcul.js).
   ========================================================== */
(function () {
  'use strict';

  const C = window.BatimentCalcul;
  const EXEMPLE = window.BATIMENT_EXEMPLE;
  const esc = BAO.echapper;
  const nb = BAO.nombre;
  const $ = function (s) { return document.querySelector(s); };

  const CLES = {
    batiment: BAO.CLE_BATIMENT,
    batiments: 'bao.batiments.v1',
    energies: BAO.CLE_ENERGIES,
    onglet: 'bao.batiment.onglet'
  };

  // Les hypothèses du tableau « Climat et chauffage ».
  const HYPOTHESES = [
    { groupe: 'climat', cle: 'dju', nom: 'DJU base 18 °C', unite: 'K·jour', positif: true },
    { groupe: 'climat', cle: 'ti', nom: 'Température intérieure', unite: '°C' },
    { groupe: 'climat', cle: 'tbase', nom: 'Température de base', unite: '°C' },
    { groupe: 'chauffage', cle: 'rendement', nom: 'Rendement global du chauffage', unite: '%', positif: true }
  ];

  /* ==========================================================
     ÉTAT
     ========================================================== */
  let batiment = BAO.lireBatiment();
  let energies = BAO.lireEnergies();
  const mesBatiments = BAO.calculsEnregistres({
    cle: CLES.batiments,
    mot: 'bâtiment',
    courant: function () { return batiment; },
    charger: function (b) {
      batiment = BAO.completerBatiment(b);
      sauverBatiment();
      renderTout();
    },
    vide: function () {
      return BAO.completerBatiment({ nom: 'Nouveau bâtiment', surface: '', consommations: { valeurs: {}, statut: 'exemple', source: '' } });
    },
    estVide: function () { return false; }
  });

  function sauverBatiment() { BAO.ecrire(CLES.batiment, batiment); }
  function sauverEnergies() { BAO.ecrire(CLES.energies, energies); }
  function calculer() { return C.calculerBatiment(batiment, energies); }

  function nomEnergie(id) {
    const e = C.trouverEnergie(energies, id);
    return e ? e.nom : id + ' (inconnue)';
  }
  function estPerso(e) { return !EXEMPLE.energies.liste.some(function (x) { return x.id === e.id; }); }

  /* ==========================================================
     ONGLET CALCUL
     ========================================================== */
  function renderBatiment() {
    $('#nom-projet').value = batiment.nom || '';
    $('#surface').value = BAO.versChamp(batiment.surface);

    $('#corps-hypotheses').innerHTML = HYPOTHESES.map(function (h, i) {
      const g = batiment[h.groupe];
      return '<tr data-hyp="' + i + '">' +
        '<td style="min-width:170px">' + esc(h.nom) + '</td>' +
        '<td><input type="text" inputmode="decimal" data-champ="valeur" value="' + esc(BAO.versChamp(g[h.cle])) + '" style="width:80px;text-align:right" aria-label="' + esc(h.nom) + '"></td>' +
        '<td class="muet">' + esc(h.unite) + '</td>' +
        '<td><input type="text" data-champ="source" value="' + esc(g[h.cle + 'Source'] || '') + '" style="min-width:260px" aria-label="Source"></td>' +
        '<td>' + BAO.selectStatut(g[h.cle + 'Statut'], 'data-champ="statut"') + '</td></tr>';
    }).join('');

    $('#energie-chauffage').innerHTML = energies.liste.map(function (e) {
      return '<option value="' + esc(e.id) + '"' + (e.id === batiment.chauffage.energie ? ' selected' : '') + '>' + esc(e.nom) + '</option>';
    }).join('');

    renderConsos();
    $('#source-consos').value = batiment.consommations.source || '';
    $('#statut-consos').value = batiment.consommations.statut === 'valide' ? 'valide' : 'exemple';
  }

  function renderConsos() {
    const res = calculer();
    const valeurs = batiment.consommations.valeurs;
    const ids = Object.keys(valeurs);
    $('#corps-consos').innerHTML = ids.length ? ids.map(function (id) {
      const e = C.trouverEnergie(energies, id);
      const ligne = res.lignes.find(function (l) { return l.id === id; });
      return '<tr data-energie="' + esc(id) + '">' +
        '<td>' + esc(nomEnergie(id)) + '</td>' +
        '<td class="num"><input type="text" inputmode="decimal" data-champ="kwh" value="' + esc(BAO.versChamp(valeurs[id])) + '" style="width:110px;text-align:right" aria-label="kWh par an"></td>' +
        '<td class="num">' + (e ? nb(Number(e.prix), 3) : '–') + '</td>' +
        '<td class="num" data-cellule="euros">' + (ligne && ligne.euros !== null ? nb(ligne.euros) : '–') + '</td>' +
        '<td class="num"><button type="button" class="bouton discret danger" data-action="retirer" title="Retirer" aria-label="Retirer cette énergie">✕</button></td></tr>';
    }).join('') : '<tr><td colspan="5" class="vide">Aucune consommation saisie.</td></tr>';

    const libres = energies.liste.filter(function (e) { return ids.indexOf(e.id) === -1; });
    $('#ajout-energie').innerHTML = libres.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.nom) + '</option>'; }).join('');
    $('#btn-ajouter-energie').disabled = !libres.length;
  }

  function majEuros() {
    const res = calculer();
    res.lignes.forEach(function (l) {
      const td = document.querySelector('tr[data-energie="' + CSS.escape(l.id) + '"] [data-cellule="euros"]');
      if (td) td.textContent = l.euros !== null ? nb(l.euros) : '–';
    });
    renderResultats(res);
  }

  function renderResultats(res) {
    res = res || calculer();
    const v = res.vigilance;
    const u = res.unWK;
    const e = u.energie;
    const c = batiment.climat, ch = batiment.chauffage;
    const base = energies.base;

    const alertes = [];
    if (v.sansDju) alertes.push('DJU manquant : impossible de passer des W/K aux kWh.');
    if (v.sansRendement) alertes.push('Rendement du chauffage manquant.');
    if (v.energieInconnue) alertes.push('Une énergie n\'existe plus dans tes prix (onglet Données).');
    if (v.nonValides.length) alertes.push('Encore en exemple : ' + v.nonValides.join(', ') + '.');
    if (v.energiesExemple.length) alertes.push('Prix encore en exemple : ' + v.energiesExemple.join(', ') + '.');

    let html = '<div class="carte-titre"><h2>Ce que coûte 1 W/K ici</h2></div>' +
      '<div class="aide" style="margin-top:-8px">' + esc(batiment.nom || 'Sans nom') + '</div>';
    if (u.valeur.euros !== null && !v.sansDju) {
      html += '<div class="gros-chiffre" style="margin:6px 0 2px">' + nb(u.valeur.euros, 2) + ' € / an</div>' +
        '<div class="aide">pour chaque W/K de déperdition (' + base + ')</div>';
    } else {
      html += '<p class="muet">Complète le DJU, le rendement et l\'énergie de chauffage.</p>';
    }
    html += '<div style="margin:12px 0">' +
      '<div class="resultat-ligne"><span>Besoin de chauffage</span><span>' + nb(u.valeur.besoin, 1) + ' kWh/an</span></div>' +
      '<div class="resultat-ligne"><span>Énergie achetée (' + esc(e ? e.nom : '?') + ')</span><span>' + nb(u.valeur.finale, 1) + ' kWh/an</span></div>' +
      '<div class="resultat-ligne"><span>Puissance au jour le plus froid</span><span>' + nb(u.puissance) + ' W</span></div></div>' +
      '<div class="formule">1 W/K × ' + nb(Number(c.dju)) + ' DJU × 24 / 1000 = ' + nb(u.valeur.besoin, 1) + ' kWh\n' +
      nb(u.valeur.besoin, 1) + ' / ' + nb(Number(ch.rendement) / 100, 2) + ' = ' + nb(u.valeur.finale, 1) + ' kWh\n' +
      nb(u.valeur.finale, 1) + ' × ' + (e ? nb(Number(e.prix), 3) : '?') + ' €/kWh = ' + nb(u.valeur.euros, 2) + ' €\n' +
      'P = 1 × (' + nb(Number(c.ti)) + ' − (' + nb(Number(c.tbase)) + ')) = ' + nb(u.puissance) + ' W</div>';

    html += '<h3 style="margin:16px 0 4px">Consommations de l\'état initial</h3>' +
      '<div class="resultat-ligne"><span>Total</span><span>' + nb(res.totalKwh) + ' kWh/an</span></div>' +
      '<div class="resultat-ligne"><span>Ratio</span><span>' + (res.ratio !== null ? nb(res.ratio) + ' kWh/m²/an' : '–') + '</span></div>' +
      '<div class="resultat-total"><span>Facture énergie</span><span>' + nb(res.totalEuros) + ' € ' + base + '/an</span></div>';

    html += alertes.length
      ? '<div class="alerte attention" style="margin:12px 0 0"><b>À vérifier :</b><ul style="margin:6px 0 0 18px; padding:0">' +
        alertes.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>'
      : '<div class="alerte ok" style="margin:12px 0 0">Toutes les valeurs du bâtiment sont validées.</div>';

    $('#resultats').innerHTML = html;
  }

  /* ==========================================================
     ONGLET DONNÉES — prix des énergies
     ========================================================== */
  function renderEnergies() {
    $('#base-prix').value = energies.base === 'HT' ? 'HT' : 'TTC';
    const valides = energies.liste.filter(function (e) { return e.statut === 'valide'; }).length;
    $('#stats-energies').innerHTML = energies.liste.length + ' énergies · <b>' + valides + ' validée' + (valides > 1 ? 's' : '') + '</b>';
    $('#corps-energies').innerHTML = energies.liste.map(function (e, i) {
      return '<tr data-index="' + i + '">' +
        '<td><input type="text" data-champ="nom" value="' + esc(e.nom) + '" style="min-width:150px" aria-label="Énergie"></td>' +
        '<td><input type="text" inputmode="decimal" data-champ="prix" value="' + esc(BAO.versChamp(e.prix)) + '" style="width:80px;text-align:right" aria-label="Prix"></td>' +
        '<td><input type="month" data-champ="dateRef" value="' + esc(e.dateRef || '') + '" style="min-width:140px" aria-label="Mois du prix"></td>' +
        '<td><input type="text" data-champ="source" value="' + esc(e.source || '') + '" style="min-width:260px" aria-label="Source"></td>' +
        '<td>' + BAO.selectStatut(e.statut, 'data-champ="statut"') + '</td>' +
        '<td>' + (estPerso(e) ? '<button type="button" class="bouton discret danger" data-action="supprimer" title="Supprimer" aria-label="Supprimer cette énergie">✕</button>' : '') + '</td></tr>';
    }).join('');
  }

  function apresModifEnergies() {
    sauverEnergies();
    renderEnergies();
    renderBatiment();
    renderResultats();
  }

  /* ==========================================================
     RENDU GLOBAL ET ÉVÉNEMENTS
     ========================================================== */
  function renderTout() {
    renderBatiment();
    renderResultats();
    renderEnergies();
    mesBatiments.rendre();
  }

  function brancherEvenements() {
    $('#nom-projet').addEventListener('input', function (e) { batiment.nom = e.target.value; sauverBatiment(); renderResultats(); });
    $('#surface').addEventListener('input', function (e) { batiment.surface = BAO.lirePositif(e.target.value); sauverBatiment(); renderResultats(); });

    $('#corps-hypotheses').addEventListener('change', function (e) {
      const tr = e.target.closest('tr[data-hyp]');
      const champ = e.target.dataset.champ;
      if (!tr || !champ) return;
      const h = HYPOTHESES[Number(tr.dataset.hyp)];
      const g = batiment[h.groupe];
      if (champ === 'valeur') {
        const n = BAO.lireNombre(e.target.value);
        if (!isFinite(n) || (h.positif && n <= 0)) { BAO.notifier(h.nom + ' : valeur invalide.'); renderBatiment(); return; }
        g[h.cle] = n;
      } else if (champ === 'source') {
        g[h.cle + 'Source'] = e.target.value;
      } else if (champ === 'statut') {
        g[h.cle + 'Statut'] = e.target.value;
        if (e.target.value === 'valide' && /exemple|à vérifier|à remplacer/i.test(g[h.cle + 'Source'] || '')) {
          BAO.notifier('Validé — pense à noter la vraie source.');
        }
      }
      sauverBatiment();
      renderResultats();
    });

    $('#energie-chauffage').addEventListener('change', function (e) {
      batiment.chauffage.energie = e.target.value; sauverBatiment(); renderResultats();
    });

    $('#corps-consos').addEventListener('input', function (e) {
      const tr = e.target.closest('tr[data-energie]');
      if (!tr || e.target.dataset.champ !== 'kwh') return;
      batiment.consommations.valeurs[tr.dataset.energie] = BAO.lirePositif(e.target.value);
      sauverBatiment();
      majEuros();
    });
    $('#corps-consos').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="retirer"]');
      if (!b) return;
      delete batiment.consommations.valeurs[b.closest('tr[data-energie]').dataset.energie];
      sauverBatiment();
      renderConsos();
      renderResultats();
    });
    $('#btn-ajouter-energie').addEventListener('click', function () {
      const id = $('#ajout-energie').value;
      if (!id) return;
      batiment.consommations.valeurs[id] = '';
      sauverBatiment();
      renderConsos();
      const champ = document.querySelector('tr[data-energie="' + CSS.escape(id) + '"] input');
      if (champ) champ.focus();
    });
    $('#source-consos').addEventListener('input', function (e) { batiment.consommations.source = e.target.value; sauverBatiment(); });
    $('#statut-consos').addEventListener('change', function (e) { batiment.consommations.statut = e.target.value; sauverBatiment(); renderResultats(); });

    // --- Données : énergies ---
    $('#base-prix').addEventListener('change', function (e) { energies.base = e.target.value; apresModifEnergies(); });
    $('#corps-energies').addEventListener('change', function (e) {
      const tr = e.target.closest('tr[data-index]');
      const champ = e.target.dataset.champ;
      if (!tr || !champ) return;
      const en = energies.liste[Number(tr.dataset.index)];
      if (champ === 'prix') {
        const n = BAO.lireNombre(e.target.value);
        if (!isFinite(n) || n < 0) { BAO.notifier('Prix invalide : tape un nombre (ex. 0,11).'); renderEnergies(); return; }
        en.prix = n;
      } else {
        en[champ] = e.target.value;
      }
      apresModifEnergies();
    });
    $('#corps-energies').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="supprimer"]');
      if (!b) return;
      const i = Number(b.closest('tr[data-index]').dataset.index);
      if (!confirm('Supprimer l\'énergie « ' + energies.liste[i].nom + ' » ?')) return;
      energies.liste.splice(i, 1);
      apresModifEnergies();
    });
    $('#btn-nouvelle-energie').addEventListener('click', function () {
      energies.liste.push({ id: BAO.identifiant('e'), nom: 'Nouvelle énergie', prix: 0, dateRef: '', statut: 'exemple', source: '' });
      apresModifEnergies();
      const champs = document.querySelectorAll('#corps-energies input[data-champ="nom"]');
      const dernier = champs[champs.length - 1];
      if (dernier) { dernier.focus(); dernier.select(); }
    });
  }

  /* ==========================================================
     DÉMARRAGE
     ========================================================== */
  BAO.initOnglets(CLES.onglet);
  BAO.noteStockage($('#note-stockage'), '../../index.html');
  BAO.sectionsRepliables('#onglet-methode .methode');
  brancherEvenements();
  renderTout();
})();
