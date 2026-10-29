/* ==========================================================
   CHIFFRAGE — INTERFACE
   ----------------------------------------------------------
   Affichage, boutons, sauvegarde. Aucun calcul ici :
   tous les calculs passent par ChiffrageCalcul (calcul.js).
   ========================================================== */
(function () {
  'use strict';

  const C = window.ChiffrageCalcul;
  const EXEMPLE = window.CHIFFRAGE_EXEMPLE;
  const esc = BAO.echapper;
  const nb = BAO.nombre;
  const $ = function (s) { return document.querySelector(s); };

  const CLES = {
    biblio: 'bao.chiffrage.biblio.v1',
    projet: 'bao.chiffrage.projet.v1',
    projets: 'bao.chiffrage.projets.v1',
    bt01: 'bao.bt01.perso.v1',
    onglet: 'bao.chiffrage.onglet'
  };

  /* ==========================================================
     ÉTAT
     ========================================================== */
  let biblio = chargerBiblio();
  let bt01Perso = BAO.lire(CLES.bt01, {}) || {};
  let projet = normaliserProjet(BAO.lire(CLES.projet, null));
  const detailsOuverts = new Set();
  const mesChiffrages = BAO.calculsEnregistres({
    cle: CLES.projets,
    mot: 'chiffrage',
    courant: function () { return projet; },
    charger: function (p) {
      projet = normaliserProjet(p);
      detailsOuverts.clear();
      sauverProjet();
      renderTout();
    },
    vide: projetVide,
    estVide: function () { return !projet.lignes.length; }
  });

  function chargerBiblio() {
    const b = BAO.lire(CLES.biblio, null);
    const base = BAO.cloner(EXEMPLE);
    if (!b || !Array.isArray(b.ratios)) return base;
    ['typesBatiment', 'complexite', 'siteOccupe', 'fraisDefaut'].forEach(function (k) {
      if (!b[k]) b[k] = base[k];
    });
    return b;
  }

  function projetVide() {
    const typeDefaut = biblio.typesBatiment.find(function (t) { return t.id === 'tertiaire'; }) || biblio.typesBatiment[0] || {};
    return {
      nom: 'Nouveau chiffrage',
      typeBatiment: typeDefaut.id,
      complexite: 2,
      siteOccupe: false,
      frais: BAO.cloner(biblio.fraisDefaut || { moe: 0, aleas: 0, tva: 20 }),
      arrondi: 100,
      lignes: []
    };
  }

  function normaliserProjet(p) {
    const vide = projetVide();
    if (!p || !Array.isArray(p.lignes)) return vide;
    const n = Object.assign(vide, p);
    n.frais = Object.assign(projetVide().frais, p.frais || {});
    n.lignes = p.lignes.map(function (l) {
      return Object.assign({ id: BAO.identifiant('l') }, l);
    });
    if (!biblio.typesBatiment.some(function (t) { return t.id === n.typeBatiment; })) {
      n.typeBatiment = (biblio.typesBatiment[0] || {}).id;
    }
    return n;
  }

  function tableBT01() { return C.fusionnerBT01(window.BT01.valeurs, bt01Perso); }
  function calculer() { return C.calculerProjet(projet, biblio, tableBT01()); }

  function sauverProjet() { BAO.ecrire(CLES.projet, projet); }
  function sauverBiblio() { BAO.ecrire(CLES.biblio, biblio); }
  function sauverBT01() { BAO.ecrire(CLES.bt01, bt01Perso); }

  /* ==========================================================
     PETITS OUTILS D'AFFICHAGE
     ========================================================== */
  function arr(v) { return C.arrondir(v, projet.arrondi); }

  function fourchette(bas, haut) {
    return nb(arr(bas)) + ' – ' + nb(arr(haut)) + ' €';
  }

  const badgeStatut = BAO.badgeStatut;

  function categories() {
    const liste = [];
    biblio.ratios.forEach(function (r) {
      const c = r.categorie || 'Sans catégorie';
      if (liste.indexOf(c) === -1) liste.push(c);
    });
    return liste;
  }

  function optionsPostes(selection) {
    return categories().map(function (cat) {
      const options = biblio.ratios
        .filter(function (r) { return (r.categorie || 'Sans catégorie') === cat; })
        .map(function (r) {
          return '<option value="' + esc(r.id) + '"' + (r.id === selection ? ' selected' : '') + '>' + esc(r.poste) + '</option>';
        }).join('');
      return '<optgroup label="' + esc(cat) + '">' + options + '</optgroup>';
    }).join('');
  }

  /* ==========================================================
     ONGLET CALCUL — le bâtiment
     ========================================================== */
  function renderContexte() {
    $('#nom-projet').value = projet.nom || '';

    $('#type-batiment').innerHTML = biblio.typesBatiment.map(function (t) {
      return '<option value="' + esc(t.id) + '"' + (t.id === projet.typeBatiment ? ' selected' : '') + '>' +
        esc(t.nom) + ' (×' + nb(Number(t.coef), 2) + ')</option>';
    }).join('');

    renderNiveaux();

    $('#site-occupe').checked = !!projet.siteOccupe;
    $('#aide-site').textContent = '×' + nb(Number(biblio.siteOccupe.coef), 2) + ' si coché';

    $('#frais-moe').value = nb(projet.frais.moe, 1).replace(/,0$/, '');
    $('#frais-aleas').value = nb(projet.frais.aleas, 1).replace(/,0$/, '');
    $('#frais-tva').value = nb(projet.frais.tva, 1).replace(/,0$/, '');
    $('#arrondi').value = String(projet.arrondi);

    const choix = $('#ajout-poste').value;
    $('#ajout-poste').innerHTML = optionsPostes(choix || null);
  }

  // Les 4 boutons de complexité + la ligne de critères du niveau choisi.
  function renderNiveaux() {
    $('#niveaux').innerHTML = biblio.complexite.map(function (c) {
      const actif = Number(c.niveau) === Number(projet.complexite);
      return '<button type="button" class="niveau" data-niveau="' + esc(c.niveau) + '" aria-pressed="' + actif + '">' +
        '<div class="n">' + esc(c.niveau) + '</div>' +
        '<div class="nom">' + esc(c.nom) + '</div>' +
        '<div class="coef">×' + nb(Number(c.coef), 2) + '</div></button>';
    }).join('');

    const c = biblio.complexite.find(function (x) { return Number(x.niveau) === Number(projet.complexite); });
    $('#criteres').textContent = c ? 'Niveau ' + c.niveau + ' — ' + c.criteres : '';
  }

  /* ==========================================================
     ONGLET CALCUL — les postes
     ========================================================== */
  function puHTML(l) {
    return nb(l.puBas) + ' – ' + nb(l.puHaut);
  }

  function totalHTML(l) {
    if (!(l.quantite > 0)) return '<span class="muet">–</span>';
    return '<b>' + nb(arr(l.totalBas)) + ' – ' + nb(arr(l.totalHaut)) + '</b>';
  }

  // Le détail d'une ligne, écrit comme on le ferait à la main.
  function detailTexte(l, res) {
    const ctx = res.contexte;
    const a = l.actualisation;
    const unite = l.ratio.unite || '';
    const pad = function (t) { return (t + '                        ').slice(0, 24); };
    const lignes = [];
    lignes.push(pad('Quantité') + nb(l.quantite, 2).replace(/,00$/, '') + ' ' + unite);
    lignes.push(pad('Prix de référence') + nb(l.ratio.prixBas) + ' – ' + nb(l.ratio.prixHaut) + ' € HT / ' + unite +
      '   (' + BAO.mois(l.ratio.dateRef) + ', ' + (l.ratio.statut === 'valide' ? 'validé' : 'exemple à valider') + ')');
    if (a.actualise) {
      lignes.push(pad('× Actualisation BT01') + nb(a.coef, 3) + '   (' + nb(a.indiceActuel, 1) + ' ' + BAO.mois(a.moisActuel) +
        ' / ' + nb(a.indiceRef, 1) + ' ' + BAO.mois(a.moisRef) + ')');
    } else {
      lignes.push(pad('× Actualisation BT01') + '1,000   (' + a.raison + ')');
    }
    lignes.push(pad('× Type de bâtiment') + nb(ctx.type.coef, 2) + '   (' + ctx.type.nom + ')');
    lignes.push(pad('× Complexité') + nb(ctx.complexite.coef, 2) + '   (niveau ' + ctx.complexite.niveau + ' — ' + ctx.complexite.nom + ')');
    lignes.push(pad('× Site occupé') + nb(ctx.site.coef, 2) + '   (' + (ctx.site.actif ? 'oui' : 'non') + ')');
    lignes.push(pad('= Coef. total') + nb(l.coefTotal, 3));
    lignes.push(pad('= Prix unitaire') + nb(l.puBas, 2) + ' – ' + nb(l.puHaut, 2) + ' € HT / ' + unite);
    lignes.push(pad('= Coût') + nb(l.totalBas, 2) + ' – ' + nb(l.totalHaut, 2) + ' € HT');
    if (Number(projet.arrondi) > 0) {
      lignes.push(pad('  affiché (arrondi)') + nb(arr(l.totalBas)) + ' – ' + nb(arr(l.totalHaut)) + ' € HT');
    }
    lignes.push('');
    lignes.push('Source : ' + (l.ratio.source || 'non renseignée'));
    return lignes.join('\n');
  }

  function ligneHTML(l, res) {
    const id = l.ligne.id;
    const boutonSuppr = '<button type="button" class="bouton discret danger" data-action="supprimer" title="Retirer ce poste" aria-label="Retirer ce poste">✕</button>';
    if (l.erreur) {
      return '<tr data-ligne="' + esc(id) + '"><td colspan="5"><span class="badge exemple">' + esc(l.erreur) + '</span></td>' +
        '<td class="num">' + boutonSuppr + '</td></tr>';
    }
    const ouvert = detailsOuverts.has(id);
    const q = l.ligne.quantite === undefined || l.ligne.quantite === null ? '' : String(l.ligne.quantite).replace('.', ',');
    return '<tr data-ligne="' + esc(id) + '">' +
      '<td style="min-width:230px"><select data-champ="ratioId" aria-label="Poste">' + optionsPostes(l.ratio.id) + '</select>' +
      '<div style="margin-top:4px">' + badgeStatut(l.ratio.statut) +
      (l.actualisation.actualise ? '' : ' <span class="badge exemple">non actualisé</span>') + '</div></td>' +
      '<td class="cel-quantite"><input type="text" inputmode="decimal" class="petit-champ" data-champ="quantite" value="' + esc(q) + '" placeholder="0" aria-label="Quantité"></td>' +
      '<td class="muet cel-unite">' + esc(l.ratio.unite) + '</td>' +
      '<td class="num" data-label="Prix unitaire actualisé (€ HT)" data-cellule="pu">' + puHTML(l) + '</td>' +
      '<td class="num" data-label="Coût (€ HT)" data-cellule="total">' + totalHTML(l) + '</td>' +
      '<td class="num cel-actions" style="white-space:nowrap">' +
      '<button type="button" class="bouton discret" data-action="detail" aria-expanded="' + ouvert + '" title="Voir le détail du calcul">' + (ouvert ? '▾' : '▸') + ' calcul</button>' +
      boutonSuppr + '</td></tr>' +
      '<tr class="detail" data-detail="' + esc(id) + '"' + (ouvert ? '' : ' hidden') + '><td colspan="6">' +
      '<div class="formule" data-cellule="detail">' + esc(detailTexte(l, res)) + '</div></td></tr>';
  }

  function renderLignes() {
    const res = calculer();
    const corps = $('#corps-lignes');
    if (!projet.lignes.length) {
      corps.innerHTML = '<tr><td colspan="6" class="vide">Aucun poste pour l\'instant. Choisis un poste ci-dessous et clique sur « Ajouter le poste ».</td></tr>';
    } else {
      corps.innerHTML = res.lignes.map(function (l) { return ligneHTML(l, res); }).join('');
    }
    renderResultats(res);
  }

  // Mise à jour des chiffres sans reconstruire le tableau (on garde le curseur dans le champ).
  function majCalculs() {
    const res = calculer();
    res.lignes.forEach(function (l) {
      if (l.erreur) return;
      const tr = document.querySelector('tr[data-ligne="' + CSS.escape(l.ligne.id) + '"]');
      if (!tr) return;
      tr.querySelector('[data-cellule="pu"]').innerHTML = puHTML(l);
      tr.querySelector('[data-cellule="total"]').innerHTML = totalHTML(l);
      const d = document.querySelector('tr[data-detail="' + CSS.escape(l.ligne.id) + '"] [data-cellule="detail"]');
      if (d) d.textContent = detailTexte(l, res);
    });
    renderResultats(res);
  }

  /* ==========================================================
     ONGLET CALCUL — résultats
     ========================================================== */
  function ligneResultat(libelle, paire) {
    return '<div class="resultat-ligne"><span>' + libelle + '</span><span>' + fourchette(paire.bas, paire.haut) + '</span></div>';
  }

  function renderResultats(res) {
    const v = res.vigilance;
    const alertes = [];
    if (v.lignesErreur) alertes.push(v.lignesErreur + ' poste(s) introuvable(s) dans la bibliothèque.');
    if (v.lignesExemple) alertes.push(v.lignesExemple + ' poste(s) avec un ratio d\'exemple, pas encore validé.');
    if (v.coefsExemple) alertes.push(v.coefsExemple + ' coefficient(s) bâtiment encore en exemple (onglet Données).');
    if (v.lignesNonActualisees) alertes.push(v.lignesNonActualisees + ' prix non actualisé(s) : date manquante ou hors de la table BT01.');
    if (v.lignesSansQuantite) alertes.push(v.lignesSansQuantite + ' poste(s) sans quantité.');

    const ctx = res.contexte;
    const bt = C.dernierBT01(tableBT01());
    const fr = projet.frais;

    let html = '<div class="carte-titre"><h2>Estimation</h2></div>' +
      '<div class="aide" style="margin-top:-8px">' + esc(projet.nom || 'Sans nom') + '</div>';

    if (!projet.lignes.length) {
      html += '<p class="muet" style="margin:14px 0 0">Ajoute un premier poste pour voir l\'estimation.</p>';
      $('#resultats').innerHTML = html;
      return;
    }

    html += '<div class="gros-chiffre" style="margin:6px 0 2px">' + fourchette(res.totalHT.bas, res.totalHT.haut) + '</div>' +
      '<div class="aide">Total HT, maîtrise d\'œuvre et aléas compris</div>' +
      '<div style="margin:12px 0">' +
      ligneResultat('Travaux', res.travaux) +
      ligneResultat('Maîtrise d\'œuvre (' + nb(fr.moe, 1).replace(/,0$/, '') + ' %)', res.moe) +
      ligneResultat('Aléas (' + nb(fr.aleas, 1).replace(/,0$/, '') + ' %)', res.aleas) +
      '<div class="resultat-total"><span>Total HT</span><span>' + fourchette(res.totalHT.bas, res.totalHT.haut) + '</span></div>' +
      ligneResultat('TVA (' + nb(fr.tva, 1).replace(/,0$/, '') + ' %)', res.tva) +
      ligneResultat('Total TTC', res.totalTTC) +
      '</div>' +
      '<div class="formule">Coef. bâtiment = ' + nb(ctx.type.coef, 2) + ' × ' + nb(ctx.complexite.coef, 2) + ' × ' + nb(ctx.site.coef, 2) +
      ' = ' + nb(ctx.produit, 3) + '\n' +
      'BT01 actuel   = ' + (bt ? nb(bt.valeur, 1) + ' (' + BAO.mois(bt.mois) + ')' : '–') + '</div>';

    if (alertes.length) {
      html += '<div class="alerte attention" style="margin:12px 0 0"><b>À vérifier avant un rapport :</b>' +
        '<ul style="margin:6px 0 0 18px; padding:0">' + alertes.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>';
    } else {
      html += '<div class="alerte ok" style="margin:12px 0 0">Tous les ratios et coefficients utilisés sont validés.</div>';
    }

    html += '<div class="barre-boutons pas-impression" style="margin-top:14px">' +
      '<button type="button" class="bouton principal" data-action="copier-word">Copier pour Word</button>' +
      '<button type="button" class="bouton" data-action="export-csv">Export Excel</button>' +
      '<button type="button" class="bouton" data-action="imprimer">Imprimer</button></div>';

    $('#resultats').innerHTML = html;
  }

  /* ==========================================================
     EXPORTS (Word, Excel)
     ========================================================== */
  function copierPourWord() {
    const res = calculer();
    const fmt = function (p) { return nb(arr(p.bas)) + ' – ' + nb(arr(p.haut)); };
    const lignes = res.lignes.filter(function (l) { return !l.erreur; }).map(function (l) {
      return [l.ratio.poste, nb(l.quantite, 2).replace(/,00$/, '') + ' ' + l.ratio.unite, fmt({ bas: l.totalBas, haut: l.totalHaut })];
    });
    const totaux = [
      ['Total travaux', fmt(res.travaux), false],
      ['Maîtrise d\'œuvre (' + nb(projet.frais.moe, 1).replace(/,0$/, '') + ' %)', fmt(res.moe), false],
      ['Aléas (' + nb(projet.frais.aleas, 1).replace(/,0$/, '') + ' %)', fmt(res.aleas), false],
      ['Total HT', fmt(res.totalHT), true]
    ];
    BAO.copierPourWord(BAO.tableauWord(
      [{ titre: 'Poste' }, { titre: 'Quantité', droite: true }, { titre: 'Estimation (€ HT)', droite: true }],
      lignes, totaux));
  }

  function exporterCSV() {
    const res = calculer();
    const n2 = function (v) { return BAO.nombreCSV(v, 2); };
    const n4 = function (v) { return BAO.nombreCSV(v, 4); };
    const cel = BAO.celluleCSV;
    const lignes = [[
      'Catégorie', 'Poste', 'Quantité', 'Unité', 'Prix réf. bas', 'Prix réf. haut', 'Mois du prix',
      'Coef. BT01', 'Coef. bâtiment', 'PU bas actualisé', 'PU haut actualisé', 'Coût bas HT', 'Coût haut HT', 'Statut', 'Source'
    ].map(cel).join(';')];

    res.lignes.forEach(function (l) {
      if (l.erreur) return;
      lignes.push([
        cel(l.ratio.categorie), cel(l.ratio.poste), n2(l.quantite), cel(l.ratio.unite),
        n2(l.ratio.prixBas), n2(l.ratio.prixHaut), cel(l.ratio.dateRef),
        n4(l.actualisation.coef), n4(res.contexte.produit), n2(l.puBas), n2(l.puHaut),
        n2(l.totalBas), n2(l.totalHaut), cel(l.ratio.statut === 'valide' ? 'validé' : 'exemple'), cel(l.ratio.source)
      ].join(';'));
    });
    lignes.push('');
    [['Total travaux', res.travaux], ['Maîtrise d\'œuvre', res.moe], ['Aléas', res.aleas],
      ['Total HT', res.totalHT], ['TVA', res.tva], ['Total TTC', res.totalTTC]].forEach(function (t) {
      lignes.push([cel(t[0]), '', '', '', '', '', '', '', '', '', '', n2(t[1].bas), n2(t[1].haut), '', ''].join(';'));
    });

    BAO.telechargerCSV(BAO.nomFichier(projet.nom, 'chiffrage') + '_' + BAO.dateFichier() + '.csv', lignes);
  }

  /* ==========================================================
     ONGLET DONNÉES — ratios
     ========================================================== */
  function renderStats() {
    const total = biblio.ratios.length;
    const valides = biblio.ratios.filter(function (r) { return r.statut === 'valide'; }).length;
    $('#stats-biblio').innerHTML = total + ' ratios · <b>' + valides + ' validé' + (valides > 1 ? 's' : '') + '</b> · ' + (total - valides) + ' en exemple';
  }

  function renderFiltres() {
    const actuel = $('#filtre-categorie').value;
    const cats = categories();
    $('#filtre-categorie').innerHTML = '<option value="">Toutes</option>' +
      cats.map(function (c) { return '<option' + (c === actuel ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    $('#liste-categories').innerHTML = cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
  }

  function renderRatios() {
    renderFiltres();
    renderStats();
    const cat = $('#filtre-categorie').value;
    const texte = $('#filtre-texte').value.trim().toLowerCase();
    const visibles = biblio.ratios
      .map(function (r, i) { return { r: r, i: i }; })
      .filter(function (o) {
        if (cat && (o.r.categorie || 'Sans catégorie') !== cat) return false;
        if (texte && (o.r.poste + ' ' + o.r.categorie + ' ' + o.r.source).toLowerCase().indexOf(texte) === -1) return false;
        return true;
      });

    if (!visibles.length) {
      $('#corps-ratios').innerHTML = '<tr><td colspan="9" class="vide">Aucun ratio ne correspond au filtre.</td></tr>';
      return;
    }

    $('#corps-ratios').innerHTML = visibles.map(function (o) {
      const r = o.r;
      const num = function (v) { return v === undefined || v === null || v === '' ? '' : String(v).replace('.', ','); };
      return '<tr data-index="' + o.i + '">' +
        '<td><input type="text" data-champ="categorie" value="' + esc(r.categorie) + '" list="liste-categories" style="min-width:130px" aria-label="Catégorie"></td>' +
        '<td><input type="text" data-champ="poste" value="' + esc(r.poste) + '" style="min-width:230px" aria-label="Poste"></td>' +
        '<td><input type="text" data-champ="unite" value="' + esc(r.unite) + '" style="min-width:100px" aria-label="Unité"></td>' +
        '<td><input type="text" inputmode="decimal" data-champ="prixBas" value="' + esc(num(r.prixBas)) + '" style="width:80px;text-align:right" aria-label="Prix bas"></td>' +
        '<td><input type="text" inputmode="decimal" data-champ="prixHaut" value="' + esc(num(r.prixHaut)) + '" style="width:80px;text-align:right" aria-label="Prix haut"></td>' +
        '<td><input type="month" data-champ="dateRef" value="' + esc(r.dateRef || '') + '" style="min-width:140px" aria-label="Mois du prix"></td>' +
        '<td><input type="text" data-champ="source" value="' + esc(r.source || '') + '" style="min-width:220px" aria-label="Source"></td>' +
        '<td><select data-champ="statut" aria-label="Statut"><option value="exemple"' + (r.statut !== 'valide' ? ' selected' : '') + '>exemple</option>' +
        '<option value="valide"' + (r.statut === 'valide' ? ' selected' : '') + '>validé</option></select></td>' +
        '<td><button type="button" class="bouton discret danger" data-action="supprimer-ratio" title="Supprimer ce ratio" aria-label="Supprimer ce ratio">✕</button></td>' +
        '</tr>';
    }).join('');
  }

  function modifierRatio(index, champ, valeur) {
    const r = biblio.ratios[index];
    if (!r) return;
    if (champ === 'prixBas' || champ === 'prixHaut') {
      const n = BAO.lireNombre(valeur);
      if (!isFinite(n) || n < 0) { BAO.notifier('Prix invalide : tape un nombre (ex. 120 ou 120,5).'); renderRatios(); return; }
      r[champ] = n;
      if (Number(r.prixBas) > Number(r.prixHaut)) BAO.notifier('Attention : le prix bas est supérieur au prix haut.');
    } else {
      r[champ] = valeur;
    }
    if (champ === 'statut' && valeur === 'valide' && (!r.source || /^exemple/i.test(r.source))) {
      BAO.notifier('Validé — pense à renseigner la vraie source de ce prix.');
    }
    sauverBiblio();
    renderStats();
    if (champ === 'categorie') renderFiltres();
    renderContexte();
    renderLignes();
  }

  function ajouterRatio() {
    const bt = C.dernierBT01(tableBT01());
    const cat = $('#filtre-categorie').value || 'Divers';
    biblio.ratios.push({
      id: BAO.identifiant('r'),
      categorie: cat,
      poste: 'Nouveau poste',
      unite: 'm²',
      prixBas: 0,
      prixHaut: 0,
      dateRef: bt ? bt.mois : '',
      statut: 'exemple',
      source: ''
    });
    sauverBiblio();
    $('#filtre-texte').value = '';
    renderRatios();
    renderContexte();
    const champs = document.querySelectorAll('#corps-ratios input[data-champ="poste"]');
    const dernier = champs[champs.length - 1];
    if (dernier) { dernier.focus(); dernier.select(); dernier.scrollIntoView({ block: 'center' }); }
  }

  function supprimerRatio(index) {
    const r = biblio.ratios[index];
    if (!r) return;
    const utilise = projet.lignes.some(function (l) { return l.ratioId === r.id; });
    const message = 'Supprimer le ratio « ' + r.poste + ' » ?' + (utilise ? '\nIl est utilisé dans le chiffrage en cours.' : '');
    if (!confirm(message)) return;
    biblio.ratios.splice(index, 1);
    sauverBiblio();
    renderRatios();
    renderContexte();
    renderLignes();
  }

  /* ==========================================================
     ONGLET DONNÉES — coefficients
     ========================================================== */
  const selectStatut = BAO.selectStatut;

  function renderCoefficients() {
    $('#corps-types').innerHTML = biblio.typesBatiment.map(function (t, i) {
      return '<tr data-type="' + i + '">' +
        '<td><input type="text" data-champ="nom" value="' + esc(t.nom) + '" style="min-width:200px" aria-label="Type"></td>' +
        '<td><input type="text" inputmode="decimal" data-champ="coef" value="' + esc(String(t.coef).replace('.', ',')) + '" style="width:70px;text-align:right" aria-label="Coefficient"></td>' +
        '<td><input type="text" data-champ="note" value="' + esc(t.note || '') + '" style="min-width:240px" aria-label="Justification"></td>' +
        '<td>' + selectStatut(t.statut, 'data-champ="statut"') + '</td>' +
        '<td><button type="button" class="bouton discret danger" data-action="supprimer-type" title="Supprimer ce type" aria-label="Supprimer ce type">✕</button></td></tr>';
    }).join('');

    $('#corps-complexite').innerHTML = biblio.complexite.map(function (c, i) {
      return '<tr data-cplx="' + i + '">' +
        '<td><b>' + esc(c.niveau) + '</b></td>' +
        '<td><input type="text" data-champ="nom" value="' + esc(c.nom) + '" style="min-width:120px" aria-label="Nom"></td>' +
        '<td><input type="text" inputmode="decimal" data-champ="coef" value="' + esc(String(c.coef).replace('.', ',')) + '" style="width:70px;text-align:right" aria-label="Coefficient"></td>' +
        '<td><input type="text" data-champ="criteres" value="' + esc(c.criteres || '') + '" style="min-width:320px" aria-label="Critères"></td>' +
        '<td>' + selectStatut(c.statut, 'data-champ="statut"') + '</td></tr>';
    }).join('');

    $('#coef-site').value = String(biblio.siteOccupe.coef).replace('.', ',');
    $('#statut-site').value = biblio.siteOccupe.statut === 'valide' ? 'valide' : 'exemple';
    $('#defaut-moe').value = String(biblio.fraisDefaut.moe).replace('.', ',');
    $('#defaut-aleas').value = String(biblio.fraisDefaut.aleas).replace('.', ',');
    $('#defaut-tva').value = String(biblio.fraisDefaut.tva).replace('.', ',');
  }

  function lireCoef(valeur, cible, champ) {
    const n = BAO.lireNombre(valeur);
    if (!isFinite(n) || n <= 0) { BAO.notifier('Coefficient invalide : tape un nombre positif (ex. 1,15).'); return false; }
    cible[champ] = n;
    return true;
  }

  function apresModifCoef() {
    sauverBiblio();
    renderCoefficients();
    renderContexte();
    renderLignes();
  }

  /* ==========================================================
     ONGLET DONNÉES — BT01
     ========================================================== */
  function renderBT01() {
    const table = tableBT01();
    const bt = C.dernierBT01(table);
    $('#bt01-actuel').textContent = bt ? 'Actuel : ' + nb(bt.valeur, 1) + ' (' + BAO.mois(bt.mois) + ')' : 'Aucune valeur';
    const mois = Object.keys(table).sort().reverse();
    $('#corps-bt01').innerHTML = mois.map(function (m) {
      const perso = Object.prototype.hasOwnProperty.call(bt01Perso, m);
      return '<tr><td>' + esc(BAO.mois(m)) + '</td><td class="num">' + nb(table[m], 1) + '</td>' +
        '<td>' + (perso ? '<span class="badge info">ajouté par toi</span>' : '<span class="muet">table officielle</span>') + '</td>' +
        '<td class="num">' + (perso ? '<button type="button" class="bouton discret danger" data-mois="' + esc(m) + '" title="Retirer ta valeur" aria-label="Retirer ta valeur">✕</button>' : '') + '</td></tr>';
    }).join('');

    if (!$('#bt01-mois').value && bt) {
      const a = Number(bt.mois.slice(0, 4)), m = Number(bt.mois.slice(5, 7));
      const suivant = m === 12 ? (a + 1) + '-01' : a + '-' + String(m + 1).padStart(2, '0');
      $('#bt01-mois').value = suivant;
    }
  }

  function ajouterBT01() {
    const mois = $('#bt01-mois').value;
    const valeur = BAO.lireNombre($('#bt01-valeur').value);
    if (!/^\d{4}-\d{2}$/.test(mois)) { BAO.notifier('Choisis un mois.'); return; }
    if (!isFinite(valeur) || valeur < 50 || valeur > 400) { BAO.notifier('Valeur BT01 invalide (ex. 139,8).'); return; }
    bt01Perso[mois] = valeur;
    sauverBT01();
    $('#bt01-valeur').value = '';
    $('#bt01-mois').value = '';
    renderBT01();
    renderLignes();
    BAO.notifier('BT01 ' + BAO.mois(mois) + ' = ' + nb(valeur, 1) + ' ajouté.');
  }

  /* ==========================================================
     ONGLET DONNÉES — export / import / réinitialisation
     ========================================================== */
  function exporterBibliotheque() {
    const contenu = {
      format: 'bao-chiffrage',
      version: 1,
      exporte_le: new Date().toISOString(),
      biblio: biblio,
      bt01Perso: bt01Perso,
      projets: mesChiffrages.tous(),
      projetCourant: projet
    };
    BAO.telechargerJSON('bibliotheque-chiffrage_' + BAO.dateFichier() + '.json', contenu,
      [CLES.biblio, CLES.bt01, CLES.projets, CLES.projet], contenu.exporte_le);
    BAO.notifier('Bibliothèque exportée. Range le fichier dans un endroit sûr (OneDrive…).');
  }

  function importerBibliotheque(fichier) {
    BAO.lireFichierJSON(fichier).then(function (donnees) {
      // Une sauvegarde complète de la boîte à outils est acceptée aussi.
      if (donnees && donnees.format === BAO.FORMAT_SAUVEGARDE) {
        if (BAO.restaurerSauvegarde(donnees)) location.reload();
        return;
      }
      if (!donnees || donnees.format !== 'bao-chiffrage' || !donnees.biblio || !Array.isArray(donnees.biblio.ratios)) {
        throw new Error('Ce fichier n\'est pas un export de l\'outil de chiffrage.');
      }
      const n = donnees.biblio.ratios.length;
      if (!confirm('Importer ' + n + ' ratios et remplacer ta bibliothèque actuelle sur cet appareil ?')) return;
      biblio = donnees.biblio;
      bt01Perso = donnees.bt01Perso || {};
      mesChiffrages.remplacerTous(donnees.projets || {});
      if (donnees.projetCourant) projet = normaliserProjet(donnees.projetCourant);
      sauverBiblio(); sauverBT01(); sauverProjet();
      renderTout();
      BAO.notifier('Import réussi : ' + n + ' ratios.');
    }).catch(function (e) {
      alert(e.message);
    });
  }

  function reinitialiser() {
    if (!confirm('Remplacer ta bibliothèque par les ratios d\'exemple ?\nTes ratios actuels seront perdus (exporte-les avant si besoin).\nTes chiffrages enregistrés sont conservés.')) return;
    biblio = BAO.cloner(EXEMPLE);
    sauverBiblio();
    projet = normaliserProjet(projet);
    renderTout();
    BAO.notifier('Bibliothèque d\'exemple restaurée.');
  }

  /* ==========================================================
     RENDU GLOBAL
     ========================================================== */
  function renderTout() {
    renderContexte();
    renderLignes();
    mesChiffrages.rendre();
    renderRatios();
    renderCoefficients();
    renderBT01();
  }

  /* ==========================================================
     ÉVÉNEMENTS
     ========================================================== */
  function brancherEvenements() {
    // --- Bâtiment ---
    $('#nom-projet').addEventListener('input', function (e) {
      projet.nom = e.target.value;
      sauverProjet();
      renderResultats(calculer());
    });
    $('#type-batiment').addEventListener('change', function (e) {
      projet.typeBatiment = e.target.value; sauverProjet(); majCalculs();
    });
    $('#niveaux').addEventListener('click', function (e) {
      const b = e.target.closest('[data-niveau]');
      if (!b) return;
      projet.complexite = Number(b.dataset.niveau);
      sauverProjet();
      renderNiveaux();
      majCalculs();
    });
    $('#site-occupe').addEventListener('change', function (e) {
      projet.siteOccupe = e.target.checked; sauverProjet(); majCalculs();
    });

    // --- Frais ---
    [['#frais-moe', 'moe'], ['#frais-aleas', 'aleas'], ['#frais-tva', 'tva']].forEach(function (f) {
      $(f[0]).addEventListener('input', function (e) {
        const n = BAO.lireNombre(e.target.value);
        projet.frais[f[1]] = isFinite(n) && n >= 0 ? n : 0;
        sauverProjet();
        renderResultats(calculer());
      });
    });
    $('#arrondi').addEventListener('change', function (e) {
      projet.arrondi = Number(e.target.value); sauverProjet(); majCalculs();
    });

    // --- Postes ---
    $('#btn-ajouter').addEventListener('click', function () {
      const ratioId = $('#ajout-poste').value;
      if (!ratioId) return;
      const ligne = { id: BAO.identifiant('l'), ratioId: ratioId, quantite: '' };
      projet.lignes.push(ligne);
      sauverProjet();
      renderLignes();
      const champ = document.querySelector('tr[data-ligne="' + CSS.escape(ligne.id) + '"] input[data-champ="quantite"]');
      if (champ) champ.focus();
    });

    const corps = $('#corps-lignes');
    corps.addEventListener('input', function (e) {
      if (e.target.dataset.champ !== 'quantite') return;
      const tr = e.target.closest('tr[data-ligne]');
      const ligne = projet.lignes.find(function (l) { return l.id === tr.dataset.ligne; });
      if (!ligne) return;
      if (BAO.lireNombre(e.target.value) < 0) BAO.notifier('Une quantité ne peut pas être négative.');
      ligne.quantite = BAO.lirePositif(e.target.value);
      sauverProjet();
      majCalculs();
    });
    corps.addEventListener('change', function (e) {
      if (e.target.dataset.champ !== 'ratioId') return;
      const tr = e.target.closest('tr[data-ligne]');
      const ligne = projet.lignes.find(function (l) { return l.id === tr.dataset.ligne; });
      if (!ligne) return;
      ligne.ratioId = e.target.value;
      sauverProjet();
      renderLignes();
    });
    corps.addEventListener('click', function (e) {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      const tr = b.closest('tr[data-ligne]');
      const id = tr.dataset.ligne;
      if (b.dataset.action === 'supprimer') {
        projet.lignes = projet.lignes.filter(function (l) { return l.id !== id; });
        detailsOuverts.delete(id);
        sauverProjet();
        renderLignes();
      } else if (b.dataset.action === 'detail') {
        BAO.basculerDetail(b, id, detailsOuverts);
      }
    });

    // --- Résultats ---
    $('#resultats').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      if (b.dataset.action === 'copier-word') copierPourWord();
      if (b.dataset.action === 'export-csv') exporterCSV();
      if (b.dataset.action === 'imprimer') window.print();
    });

    // --- Données : ratios ---
    $('#filtre-categorie').addEventListener('change', renderRatios);
    $('#filtre-texte').addEventListener('input', renderRatios);
    $('#btn-ajouter-ratio').addEventListener('click', ajouterRatio);
    const corpsRatios = $('#corps-ratios');
    corpsRatios.addEventListener('change', function (e) {
      const champ = e.target.dataset.champ;
      const tr = e.target.closest('tr[data-index]');
      if (!champ || !tr) return;
      modifierRatio(Number(tr.dataset.index), champ, e.target.value);
    });
    corpsRatios.addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="supprimer-ratio"]');
      if (!b) return;
      supprimerRatio(Number(b.closest('tr[data-index]').dataset.index));
    });

    // --- Données : coefficients ---
    $('#corps-types').addEventListener('change', function (e) {
      const champ = e.target.dataset.champ;
      const tr = e.target.closest('tr[data-type]');
      if (!champ || !tr) return;
      const t = biblio.typesBatiment[Number(tr.dataset.type)];
      if (champ === 'coef') { if (!lireCoef(e.target.value, t, 'coef')) { renderCoefficients(); return; } }
      else t[champ] = e.target.value;
      apresModifCoef();
    });
    $('#corps-types').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="supprimer-type"]');
      if (!b) return;
      if (biblio.typesBatiment.length <= 1) { BAO.notifier('Il faut garder au moins un type de bâtiment.'); return; }
      const i = Number(b.closest('tr[data-type]').dataset.type);
      if (!confirm('Supprimer le type « ' + biblio.typesBatiment[i].nom + ' » ?')) return;
      const supprime = biblio.typesBatiment.splice(i, 1)[0];
      if (projet.typeBatiment === supprime.id) { projet.typeBatiment = biblio.typesBatiment[0].id; sauverProjet(); }
      apresModifCoef();
    });
    $('#btn-ajouter-type').addEventListener('click', function () {
      biblio.typesBatiment.push({ id: BAO.identifiant('t'), nom: 'Nouveau type', coef: 1, statut: 'exemple', note: '' });
      apresModifCoef();
      const champs = document.querySelectorAll('#corps-types input[data-champ="nom"]');
      const dernier = champs[champs.length - 1];
      if (dernier) { dernier.focus(); dernier.select(); }
    });
    $('#corps-complexite').addEventListener('change', function (e) {
      const champ = e.target.dataset.champ;
      const tr = e.target.closest('tr[data-cplx]');
      if (!champ || !tr) return;
      const c = biblio.complexite[Number(tr.dataset.cplx)];
      if (champ === 'coef') { if (!lireCoef(e.target.value, c, 'coef')) { renderCoefficients(); return; } }
      else c[champ] = e.target.value;
      apresModifCoef();
    });
    $('#coef-site').addEventListener('change', function (e) {
      if (!lireCoef(e.target.value, biblio.siteOccupe, 'coef')) { renderCoefficients(); return; }
      apresModifCoef();
    });
    $('#statut-site').addEventListener('change', function (e) {
      biblio.siteOccupe.statut = e.target.value; apresModifCoef();
    });
    [['#defaut-moe', 'moe'], ['#defaut-aleas', 'aleas'], ['#defaut-tva', 'tva']].forEach(function (f) {
      $(f[0]).addEventListener('change', function (e) {
        const n = BAO.lireNombre(e.target.value);
        if (!isFinite(n) || n < 0) { BAO.notifier('Pourcentage invalide.'); renderCoefficients(); return; }
        biblio.fraisDefaut[f[1]] = n;
        sauverBiblio();
      });
    });

    // --- Données : BT01 ---
    $('#btn-ajouter-bt01').addEventListener('click', ajouterBT01);
    $('#corps-bt01').addEventListener('click', function (e) {
      const b = e.target.closest('[data-mois]');
      if (!b) return;
      delete bt01Perso[b.dataset.mois];
      sauverBT01();
      renderBT01();
      renderLignes();
    });

    // --- Données : export / import ---
    $('#btn-exporter').addEventListener('click', exporterBibliotheque);
    $('#fichier-import').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importerBibliotheque(f);
      e.target.value = '';
    });
    $('#btn-reinitialiser').addEventListener('click', reinitialiser);
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
