/* ==========================================================
   PONTS THERMIQUES ψ — INTERFACE
   ----------------------------------------------------------
   Affichage, boutons, sauvegarde. Aucun calcul ici :
   tous les calculs passent par PontsCalcul (calcul.js),
   tous les dessins par PontsSchemas (schemas.js).
   ========================================================== */
(function () {
  'use strict';

  const C = window.PontsCalcul;
  const S = window.PontsSchemas;
  const EXEMPLE = window.PONTS_EXEMPLE;
  const esc = BAO.echapper;
  const nb = BAO.nombre;
  const $ = function (s) { return document.querySelector(s); };

  const CLES = {
    biblio: 'bao.ponts.biblio.v1',
    projet: 'bao.ponts.projet.v1',
    projets: 'bao.ponts.projets.v1',
    onglet: 'bao.ponts.onglet'
  };

  const NIVEAUX = { faible: 'ψ faible', moyen: 'ψ moyen', fort: 'ψ fort', 'tres-fort': 'ψ très fort', inconnu: 'ψ inconnu' };

  /* ==========================================================
     ÉTAT
     ========================================================== */
  let biblio = chargerBiblio();
  let projet = normaliserProjet(BAO.lire(CLES.projet, null));
  const detailsOuverts = new Set();
  const mesCalculs = BAO.calculsEnregistres({
    cle: CLES.projets,
    mot: 'calcul',
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

  // Ta bibliothèque gagne ; les nouvelles valeurs d'exemple (ajoutées dans une
  // version future du fichier public) sont ajoutées sans écraser les tiennes.
  function completerBiblio(b) {
    const base = BAO.cloner(EXEMPLE);
    if (!b || !Array.isArray(b.valeurs)) return { version: 1, valeurs: base.valeurs, reglages: base.reglages };
    base.valeurs.forEach(function (v) {
      if (!b.valeurs.some(function (x) { return x.id === v.id; })) b.valeurs.push(v);
    });
    b.reglages = b.reglages || {};
    if (!b.reglages.seuils) b.reglages.seuils = base.reglages.seuils;
    if (!b.reglages.incertitude) b.reglages.incertitude = base.reglages.incertitude;
    return b;
  }

  function chargerBiblio() { return completerBiblio(BAO.lire(CLES.biblio, null)); }

  function projetVide() {
    return {
      nom: 'Nouveau calcul',
      hParois: '',
      lignes: [],
      selection: { liaison: 'plancher-inter', isolation: 'ITI', valeurId: 'pi-iti' }
    };
  }

  function normaliserProjet(p) {
    const vide = projetVide();
    if (!p || !Array.isArray(p.lignes)) return vide;
    const n = Object.assign(vide, p);
    n.selection = Object.assign(projetVide().selection, p.selection || {});
    n.lignes = p.lignes.map(function (l) { return Object.assign({ id: BAO.identifiant('l') }, l); });
    return n;
  }

  function calculer() { return C.calculerProjet(projet, biblio); }
  function sauverProjet() { BAO.ecrire(CLES.projet, projet); }
  function sauverBiblio() { BAO.ecrire(CLES.biblio, biblio); }

  /* ==========================================================
     PETITS OUTILS D'AFFICHAGE
     ========================================================== */
  function liaison(id) { return EXEMPLE.liaisons.find(function (l) { return l.id === id; }) || { id: id, nom: id, mesure: '', description: '' }; }
  function isolation(id) { return EXEMPLE.isolations.find(function (i) { return i.id === id; }) || { id: id, nom: id, court: id }; }
  function seuils() { return biblio.reglages.seuils; }
  function niveau(psi) { return C.niveauPsi(psi, seuils()); }

  const badgeStatut = BAO.badgeStatut;
  function badgeNiveau(psi) {
    const n = niveau(psi);
    return '<span class="badge niv-' + n + '">' + NIVEAUX[n] + '</span>';
  }
  function psiTexte(psi) { return nb(Number(psi), 2); }
  function pct(v) { return v === null || v === undefined ? '–' : nb(v * 100) + ' %'; }

  // Les dessins existent pour « standard » et « traite » ; une variante perso
  // est dessinée comme le cas standard (et l'outil le dit sous le schéma).
  function estPerso(v) { return v.variante !== 'standard' && v.variante !== 'traite'; }
  function varianteDessin(v) { return v.variante === 'traite' ? 'traite' : 'standard'; }

  function libelleValeur(v) {
    return isolation(v.isolation).court + ' — ' + (v.nomVariante || 'variante');
  }

  function optionsValeurs(selection) {
    return EXEMPLE.liaisons.map(function (l) {
      const options = biblio.valeurs
        .filter(function (v) { return v.liaison === l.id; })
        .map(function (v) {
          return '<option value="' + esc(v.id) + '"' + (v.id === selection ? ' selected' : '') + '>' + esc(libelleValeur(v)) + '</option>';
        }).join('');
      return '<optgroup label="' + esc(l.nom) + '">' + options + '</optgroup>';
    }).join('');
  }

  /* ==========================================================
     ONGLET CALCUL — choix de la liaison
     ========================================================== */
  function valeurChoisie() {
    const sel = projet.selection;
    const liste = C.variantes(biblio, sel.liaison, sel.isolation);
    let v = liste.find(function (x) { return x.id === sel.valeurId; });
    if (!v) { v = liste[0] || null; sel.valeurId = v ? v.id : null; }
    return v;
  }

  function renderChoix() {
    const sel = projet.selection;
    $('#choix-liaison').innerHTML = EXEMPLE.liaisons.map(function (l) {
      return '<button type="button" class="niveau" data-liaison="' + esc(l.id) + '" aria-pressed="' + (l.id === sel.liaison) + '">' +
        '<div class="nom">' + esc(l.nom) + '</div><div class="coef">' + esc(l.vue) + '</div></button>';
    }).join('');
    $('#choix-isolation').innerHTML = EXEMPLE.isolations.map(function (i) {
      return '<button type="button" class="niveau" data-isolation="' + esc(i.id) + '" aria-pressed="' + (i.id === sel.isolation) + '" title="' + esc(i.note) + '">' +
        '<div class="n">' + esc(i.court) + '</div><div class="coef">' + esc(i.nom.split('— ')[1] || '') + '</div></button>';
    }).join('');

    const v = valeurChoisie();
    const liste = C.variantes(biblio, sel.liaison, sel.isolation);
    $('#choix-variante').innerHTML = liste.length
      ? liste.map(function (x) {
        return '<option value="' + esc(x.id) + '"' + (v && x.id === v.id ? ' selected' : '') + '>' + esc(x.nomVariante) + ' — ψ ' + psiTexte(x.psi) + '</option>';
      }).join('')
      : '<option value="">Aucune valeur dans ton catalogue</option>';
    renderFiche();
  }

  function renderFiche() {
    const sel = projet.selection;
    const v = valeurChoisie();
    const l = liaison(sel.liaison);

    $('#note-schema').hidden = !(v && estPerso(v));
    if (!v) {
      $('#schema').innerHTML = '';
      $('#fiche-valeur').innerHTML = '<p class="muet">Aucune valeur de ψ pour ce cas. Ajoute une variante dans l\'onglet Données.</p>';
      return;
    }

    $('#schema').innerHTML = S.dessiner(sel.liaison, sel.isolation, varianteDessin(v), v.psi);

    const explication = EXEMPLE.explications[v.id] || 'Variante ajoutée par toi : note dans la source d\'où vient la valeur et pourquoi elle est différente du cas standard.';

    // Comparaison : toutes les valeurs de cette liaison, échelle commune.
    const toutes = biblio.valeurs.filter(function (x) { return x.liaison === sel.liaison; })
      .sort(function (a, b) { return a.isolation.localeCompare(b.isolation) || (a.variante === 'standard' ? -1 : 1); });
    const max = Math.max(1, Math.max.apply(null, toutes.map(function (x) { return Number(x.psi) || 0; })));
    const barres = toutes.map(function (x) {
      const largeur = Math.max(1, (Number(x.psi) || 0) / max * 100);
      return '<div class="barre' + (x.id === v.id ? ' actif' : '') + '" title="' + esc(libelleValeur(x)) + '">' +
        '<span class="nom">' + esc(libelleValeur(x)) + '</span>' +
        '<span class="jauge"><i style="width:' + largeur.toFixed(0) + '%"></i></span>' +
        '<span class="v">' + psiTexte(x.psi) + '</span></div>';
    }).join('');

    $('#fiche-valeur').innerHTML =
      '<div class="aide">' + esc(l.nom) + ' · ' + esc(isolation(sel.isolation).court) + '</div>' +
      '<div class="psi-gros">ψ = ' + psiTexte(v.psi) + ' <small>W/(m·K)</small></div>' +
      '<div class="barre-boutons" style="margin:6px 0 10px">' + badgeNiveau(v.psi) + badgeStatut(v.statut) + '</div>' +
      '<p style="margin-bottom:8px"><b>Pourquoi ?</b> ' + esc(explication) + '</p>' +
      '<p class="aide" style="margin-bottom:10px">Source : ' + esc(v.source || 'non renseignée') + (v.dateRef ? ' (' + esc(BAO.mois(v.dateRef)) + ')' : '') + '</p>' +
      '<h3 style="margin:0">Comparer pour cette liaison</h3>' +
      '<div class="barres">' + barres + '</div>' +
      '<p class="aide" style="margin:10px 0 0"><b>Longueur L :</b> ' + esc(l.mesure) + '</p>';
  }

  /* ==========================================================
     ONGLET CALCUL — mes liaisons
     ========================================================== */
  function hTexte(l) {
    if (!(l.longueur > 0)) return '<span class="muet">–</span>';
    return '<b>' + nb(l.h, 1) + '</b>';
  }

  // Le détail d'une ligne, écrit comme on le ferait à la main.
  function detailTexte(l, res) {
    const pad = function (t) { return (t + '                        ').slice(0, 22); };
    const v = l.valeur;
    const lignes = [];
    lignes.push(pad('Liaison') + liaison(v.liaison).nom);
    lignes.push(pad('Isolant') + isolation(v.isolation).nom);
    lignes.push(pad('Détail') + (v.nomVariante || ''));
    lignes.push(pad('ψ') + psiTexte(v.psi) + ' W/(m·K)   (' + (v.statut === 'valide' ? 'validé' : 'exemple à valider') + ')');
    lignes.push(pad('× L') + nb(l.longueur, 2).replace(/,00$/, '') + ' m');
    lignes.push(pad('= ψ × L') + nb(l.h, 2) + ' W/K');
    lignes.push(pad('fourchette ± ' + nb(res.incertitude * 100) + ' %') + nb(l.hBas, 2) + ' – ' + nb(l.hHaut, 2) + ' W/K');
    lignes.push('');
    lignes.push('Source : ' + (v.source || 'non renseignée'));
    return lignes.join('\n');
  }

  function ligneHTML(l, res) {
    const id = l.ligne.id;
    const boutonSuppr = '<button type="button" class="bouton discret danger" data-action="supprimer" title="Retirer cette liaison" aria-label="Retirer cette liaison">✕</button>';
    if (l.erreur) {
      return '<tr data-ligne="' + esc(id) + '"><td colspan="5"><span class="badge exemple">' + esc(l.erreur) + '</span></td>' +
        '<td class="num">' + boutonSuppr + '</td></tr>';
    }
    const ouvert = detailsOuverts.has(id);
    const L = l.ligne.longueur === undefined || l.ligne.longueur === null ? '' : String(l.ligne.longueur).replace('.', ',');
    return '<tr data-ligne="' + esc(id) + '">' +
      '<td class="cel-liaison"><select data-champ="valeurId" aria-label="Liaison">' + optionsValeurs(l.valeur.id) + '</select>' +
      '<div style="margin-top:4px">' + badgeStatut(l.valeur.statut) + ' ' + badgeNiveau(l.psi) + '</div></td>' +
      '<td data-label="Repère"><input type="text" data-champ="repere" value="' + esc(l.ligne.repere || '') + '" placeholder="–" style="min-width:110px" aria-label="Repère"></td>' +
      '<td data-label="L (m)"><input type="text" inputmode="decimal" class="petit-champ" data-champ="longueur" value="' + esc(L) + '" placeholder="0" aria-label="Longueur en mètres"></td>' +
      '<td class="num" data-label="ψ (W/m.K)">' + psiTexte(l.psi) + '</td>' +
      '<td class="num" data-label="ψ × L (W/K)" data-cellule="h">' + hTexte(l) + '</td>' +
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
      corps.innerHTML = '<tr><td colspan="6" class="vide">Aucune liaison pour l\'instant. Choisis une liaison ci-dessus, tape sa longueur et clique sur « Ajouter cette liaison ».</td></tr>';
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
      tr.querySelector('[data-cellule="h"]').innerHTML = hTexte(l);
      const d = document.querySelector('tr[data-detail="' + CSS.escape(l.ligne.id) + '"] [data-cellule="detail"]');
      if (d) d.textContent = detailTexte(l, res);
    });
    renderResultats(res);
  }

  /* ==========================================================
     ONGLET CALCUL — résultats
     ========================================================== */
  function fourchetteH(p) { return nb(p.bas) + ' – ' + nb(p.haut) + ' W/K'; }

  function renderResultats(res) {
    const v = res.vigilance;
    const alertes = [];
    if (v.lignesErreur) alertes.push(v.lignesErreur + ' liaison(s) introuvable(s) dans le catalogue.');
    if (v.valeursExemple) alertes.push(v.valeursExemple + ' liaison(s) avec un ψ d\'exemple, pas encore validé.');
    if (v.reglagesExemple) alertes.push(v.reglagesExemple + ' réglage(s) de lecture encore en exemple (onglet Données).');
    if (v.lignesSansLongueur) alertes.push(v.lignesSansLongueur + ' liaison(s) sans longueur.');
    if (v.sansParois) alertes.push('Σ U × A des parois non saisi : la part des ponts thermiques ne peut pas être calculée.');

    let html = '<div class="carte-titre"><h2>Déperditions</h2></div>' +
      '<div class="aide" style="margin-top:-8px">' + esc(projet.nom || 'Sans nom') + '</div>';

    if (!projet.lignes.length) {
      html += '<p class="muet" style="margin:14px 0 0">Ajoute une première liaison pour voir son poids dans les déperditions.</p>';
      $('#resultats').innerHTML = html;
      return;
    }

    const p = res.part;
    html += '<div class="gros-chiffre" style="margin:6px 0 2px">' +
      (p.valeur === null ? '–' : nb(p.bas * 100) + ' – ' + nb(p.haut * 100) + ' %') + '</div>' +
      '<div class="aide">Part des ponts thermiques dans H parois + ponts</div>';

    if (p.valeur !== null) {
      const partParois = 100 - p.valeur * 100;
      html += '<div class="repartition" role="img" aria-label="Parois ' + nb(partParois) + ' %, ponts thermiques ' + nb(p.valeur * 100) + ' %">' +
        '<i class="parois" style="width:' + partParois.toFixed(1) + '%"></i><i class="ponts" style="width:' + (p.valeur * 100).toFixed(1) + '%"></i></div>' +
        '<div class="legende"><span><i style="background:var(--froid)"></i>parois</span><span><i style="background:var(--accent)"></i>ponts thermiques</span></div>';
    }

    html += '<div style="margin:12px 0">' +
      '<div class="resultat-ligne"><span>Ponts thermiques Σ ψ × L</span><span>' + fourchetteH(res.hPonts) + '</span></div>' +
      '<div class="resultat-ligne"><span>Parois Σ U × A (saisi)</span><span>' + (res.hParois > 0 ? nb(res.hParois) + ' W/K' : '–') + '</span></div>' +
      '<div class="resultat-total"><span>H total</span><span>' + (res.hParois > 0 ? fourchetteH(res.hTotal) : '–') + '</span></div>' +
      '</div>' +
      '<div class="formule">Valeur centrale :\n' +
      'Σ ψ × L = ' + nb(res.hPonts.valeur, 1) + ' W/K\n' +
      'Part    = ' + nb(res.hPonts.valeur, 1) + ' / ' + (res.hParois > 0 ? nb(res.hTotal.valeur, 1) + ' = ' + pct(p.valeur) : '?') + '\n' +
      'Fourchette : ψ ± ' + nb(res.incertitude * 100) + ' % (H)</div>';

    if (alertes.length) {
      html += '<div class="alerte attention" style="margin:12px 0 0"><b>À vérifier avant un rapport :</b>' +
        '<ul style="margin:6px 0 0 18px; padding:0">' + alertes.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>';
    } else {
      html += '<div class="alerte ok" style="margin:12px 0 0">Toutes les valeurs de ψ et les réglages utilisés sont validés.</div>';
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
    const lignes = res.lignes.filter(function (l) { return !l.erreur; }).map(function (l) {
      return [liaison(l.valeur.liaison).nom + ' — ' + libelleValeur(l.valeur), l.ligne.repere || '',
        psiTexte(l.psi), nb(l.longueur, 1), nb(l.h, 1)];
    });
    const totaux = [['Total ponts thermiques Σ ψ × L', nb(res.hPonts.valeur) + ' W/K (' + fourchetteH(res.hPonts) + ')', true]];
    if (res.hParois > 0) {
      totaux.push(['Parois Σ U × A', nb(res.hParois) + ' W/K', true]);
      totaux.push(['Part des ponts thermiques', nb(res.part.bas * 100) + ' – ' + nb(res.part.haut * 100) + ' %', true]);
    }
    BAO.copierPourWord(BAO.tableauWord(
      [{ titre: 'Liaison' }, { titre: 'Repère' }, { titre: 'ψ (W/m.K)', droite: true }, { titre: 'L (m)', droite: true }, { titre: 'ψ × L (W/K)', droite: true }],
      lignes, totaux));
  }

  function exporterCSV() {
    const res = calculer();
    const n2 = function (v) { return BAO.nombreCSV(v, 2); };
    const cel = BAO.celluleCSV;
    const lignes = [[
      'Liaison', 'Isolant', 'Détail constructif', 'Repère', 'ψ (W/m.K)', 'L (m)', 'ψ × L (W/K)', 'ψ × L bas', 'ψ × L haut', 'Statut', 'Source'
    ].map(cel).join(';')];

    res.lignes.forEach(function (l) {
      if (l.erreur) return;
      lignes.push([
        cel(liaison(l.valeur.liaison).nom), cel(l.valeur.isolation), cel(l.valeur.nomVariante), cel(l.ligne.repere),
        n2(l.psi), n2(l.longueur), n2(l.h), n2(l.hBas), n2(l.hHaut),
        cel(l.valeur.statut === 'valide' ? 'validé' : 'exemple'), cel(l.valeur.source)
      ].join(';'));
    });
    lignes.push('');
    lignes.push([cel('Total ponts thermiques'), '', '', '', '', '', n2(res.hPonts.valeur), n2(res.hPonts.bas), n2(res.hPonts.haut), '', ''].join(';'));
    if (res.hParois > 0) {
      lignes.push([cel('Parois Σ U × A'), '', '', '', '', '', n2(res.hParois), '', '', '', ''].join(';'));
      lignes.push([cel('Part des ponts thermiques (%)'), '', '', '', '', '', n2(res.part.valeur * 100), n2(res.part.bas * 100), n2(res.part.haut * 100), '', ''].join(';'));
    }

    BAO.telechargerCSV(BAO.nomFichier(projet.nom, 'ponts-thermiques') + '_' + BAO.dateFichier() + '.csv', lignes);
  }

  /* ==========================================================
     ONGLET MÉTHODE — parties qui suivent ton catalogue
     ========================================================== */
  function renderMethode() {
    document.querySelectorAll('[data-schema]').forEach(function (el) {
      const p = el.dataset.schema.split('|');
      el.innerHTML = S.dessiner(p[0], p[1], p[2], Number(p[3]));
    });

    $('#tableau-comparatif').innerHTML = EXEMPLE.liaisons.map(function (l) {
      const cellules = EXEMPLE.isolations.map(function (i) {
        const v = C.variantes(biblio, l.id, i.id)[0];
        return v ? '<td>' + psiTexte(v.psi) + ' ' + badgeNiveau(v.psi) + '</td>' : '<td class="muet">–</td>';
      }).join('');
      return '<tr><td>' + esc(l.nom) + '</td>' + cellules + '</tr>';
    }).join('');

    $('#liste-mesures').innerHTML = EXEMPLE.liaisons.map(function (l) {
      return '<li><b>' + esc(l.nom) + '</b> : ' + esc(l.mesure) + '</li>';
    }).join('');
  }

  /* ==========================================================
     ONGLET DONNÉES — valeurs de ψ
     ========================================================== */
  const selectStatut = BAO.selectStatut;

  function renderStats() {
    const total = biblio.valeurs.length;
    const valides = biblio.valeurs.filter(function (v) { return v.statut === 'valide'; }).length;
    $('#stats-biblio').innerHTML = total + ' valeurs · <b>' + valides + ' validée' + (valides > 1 ? 's' : '') + '</b> · ' + (total - valides) + ' en exemple';
  }

  function renderValeurs() {
    renderStats();
    const actuel = $('#filtre-liaison').value;
    $('#filtre-liaison').innerHTML = '<option value="">Toutes</option>' + EXEMPLE.liaisons.map(function (l) {
      return '<option value="' + esc(l.id) + '"' + (l.id === actuel ? ' selected' : '') + '>' + esc(l.nom) + '</option>';
    }).join('');
    const filtre = $('#filtre-liaison').value;

    $('#corps-valeurs').innerHTML = biblio.valeurs
      .map(function (v, i) { return { v: v, i: i }; })
      .filter(function (o) { return !filtre || o.v.liaison === filtre; })
      .map(function (o) {
        const v = o.v;
        return '<tr data-index="' + o.i + '">' +
          '<td style="min-width:170px">' + esc(liaison(v.liaison).nom) + '</td>' +
          '<td><b>' + esc(v.isolation) + '</b></td>' +
          '<td><input type="text" data-champ="nomVariante" value="' + esc(v.nomVariante || '') + '" style="min-width:230px" aria-label="Détail constructif"></td>' +
          '<td><input type="text" inputmode="decimal" data-champ="psi" value="' + esc(String(v.psi).replace('.', ',')) + '" style="width:70px;text-align:right" aria-label="ψ"></td>' +
          '<td><input type="month" data-champ="dateRef" value="' + esc(v.dateRef || '') + '" style="min-width:140px" aria-label="Mois de la valeur"></td>' +
          '<td><input type="text" data-champ="source" value="' + esc(v.source || '') + '" style="min-width:260px" aria-label="Source"></td>' +
          '<td>' + selectStatut(v.statut, 'data-champ="statut"') + '</td>' +
          '<td>' + (estPerso(v)
            ? '<button type="button" class="bouton discret danger" data-action="supprimer-valeur" title="Supprimer cette variante" aria-label="Supprimer cette variante">✕</button>'
            : '') + '</td></tr>';
      }).join('');

    $('#ajout-liaison').innerHTML = EXEMPLE.liaisons.map(function (l) {
      return '<option value="' + esc(l.id) + '"' + (l.id === (filtre || projet.selection.liaison) ? ' selected' : '') + '>' + esc(l.nom) + '</option>';
    }).join('');
    $('#ajout-isolation').innerHTML = EXEMPLE.isolations.map(function (i) {
      return '<option value="' + esc(i.id) + '"' + (i.id === projet.selection.isolation ? ' selected' : '') + '>' + esc(i.court) + '</option>';
    }).join('');
  }

  function modifierValeur(index, champ, valeur) {
    const v = biblio.valeurs[index];
    if (!v) return;
    if (champ === 'psi') {
      const n = BAO.lireNombre(valeur);
      if (!isFinite(n) || n < 0 || n > 5) { BAO.notifier('ψ invalide : tape un nombre entre 0 et 5 (ex. 0,45).'); renderValeurs(); return; }
      v.psi = n;
    } else {
      v[champ] = valeur;
    }
    if (champ === 'statut' && valeur === 'valide' && (!v.source || /ordre de grandeur|à vérifier/i.test(v.source))) {
      BAO.notifier('Validé — pense à noter la vraie source (fascicule, tableau, page).');
    }
    sauverBiblio();
    renderStats();
    renderChoix();
    renderLignes();
    renderMethode();
  }

  function ajouterValeur() {
    const l = $('#ajout-liaison').value;
    const i = $('#ajout-isolation').value;
    const base = C.variantes(biblio, l, i)[0];
    biblio.valeurs.push({
      id: BAO.identifiant('v'),
      liaison: l,
      isolation: i,
      variante: 'perso',
      nomVariante: 'Ma variante',
      psi: base ? base.psi : 0,
      dateRef: '',
      statut: 'exemple',
      source: ''
    });
    sauverBiblio();
    $('#filtre-liaison').value = l;
    renderValeurs();
    renderChoix();
    const champs = document.querySelectorAll('#corps-valeurs input[data-champ="nomVariante"]');
    const dernier = champs[champs.length - 1];
    if (dernier) { dernier.focus(); dernier.select(); dernier.scrollIntoView({ block: 'center' }); }
  }

  function supprimerValeur(index) {
    const v = biblio.valeurs[index];
    if (!v || !estPerso(v)) return;
    const utilise = projet.lignes.some(function (l) { return l.valeurId === v.id; });
    if (!confirm('Supprimer la variante « ' + v.nomVariante + ' » ?' + (utilise ? '\nElle est utilisée dans le calcul en cours.' : ''))) return;
    biblio.valeurs.splice(index, 1);
    sauverBiblio();
    renderTout();
  }

  /* ==========================================================
     ONGLET DONNÉES — réglages
     ========================================================== */
  function renderReglages() {
    const s = biblio.reglages.seuils, inc = biblio.reglages.incertitude;
    $('#seuil-faible').value = String(s.faible).replace('.', ',');
    $('#seuil-moyen').value = String(s.moyen).replace('.', ',');
    $('#seuil-fort').value = String(s.fort).replace('.', ',');
    $('#statut-seuils').value = s.statut === 'valide' ? 'valide' : 'exemple';
    $('#source-seuils').textContent = 'Source : ' + (s.source || 'non renseignée');
    $('#incertitude').value = String(inc.pct).replace('.', ',');
    $('#statut-incertitude').value = inc.statut === 'valide' ? 'valide' : 'exemple';
    $('#source-incertitude').textContent = 'Source : ' + (inc.source || 'non renseignée');
  }

  function apresReglage() {
    sauverBiblio();
    renderReglages();
    renderChoix();
    renderLignes();
    renderMethode();
  }

  /* ==========================================================
     ONGLET DONNÉES — export / import / réinitialisation
     ========================================================== */
  function exporterBibliotheque() {
    const contenu = {
      format: 'bao-ponts-thermiques',
      version: 1,
      exporte_le: new Date().toISOString(),
      biblio: biblio,
      projets: mesCalculs.tous(),
      projetCourant: projet
    };
    BAO.telechargerJSON('catalogue-ponts-thermiques_' + BAO.dateFichier() + '.json', contenu,
      [CLES.biblio, CLES.projets, CLES.projet], contenu.exporte_le);
    BAO.notifier('Catalogue exporté. Range le fichier dans un endroit sûr (OneDrive…).');
  }

  function importerBibliotheque(fichier) {
    BAO.lireFichierJSON(fichier).then(function (donnees) {
      // Une sauvegarde complète de la boîte à outils est acceptée aussi.
      if (donnees && donnees.format === BAO.FORMAT_SAUVEGARDE) {
        if (BAO.restaurerSauvegarde(donnees)) location.reload();
        return;
      }
      if (!donnees || donnees.format !== 'bao-ponts-thermiques' || !donnees.biblio || !Array.isArray(donnees.biblio.valeurs)) {
        throw new Error('Ce fichier n\'est pas un export de l\'outil Ponts thermiques.');
      }
      const n = donnees.biblio.valeurs.length;
      if (!confirm('Importer ' + n + ' valeurs de ψ et remplacer ton catalogue actuel sur cet appareil ?')) return;
      biblio = completerBiblio(donnees.biblio);
      mesCalculs.remplacerTous(donnees.projets || {});
      if (donnees.projetCourant) projet = normaliserProjet(donnees.projetCourant);
      sauverBiblio(); sauverProjet();
      renderTout();
      BAO.notifier('Import réussi : ' + n + ' valeurs.');
    }).catch(function (e) {
      alert(e.message);
    });
  }

  function reinitialiser() {
    if (!confirm('Remplacer ton catalogue par les valeurs d\'exemple ?\nTes valeurs actuelles seront perdues (exporte-les avant si besoin).\nTes calculs enregistrés sont conservés.')) return;
    biblio = completerBiblio(null);
    sauverBiblio();
    renderTout();
    BAO.notifier('Catalogue d\'exemple restauré.');
  }

  /* ==========================================================
     RENDU GLOBAL
     ========================================================== */
  function renderTout() {
    $('#nom-projet').value = projet.nom || '';
    $('#h-parois').value = projet.hParois === '' || projet.hParois === undefined ? '' : String(projet.hParois).replace('.', ',');
    renderChoix();
    renderLignes();
    mesCalculs.rendre();
    renderValeurs();
    renderReglages();
    renderMethode();
  }

  /* ==========================================================
     ÉVÉNEMENTS
     ========================================================== */
  function brancherEvenements() {
    // --- Choix de la liaison ---
    $('#choix-liaison').addEventListener('click', function (e) {
      const b = e.target.closest('[data-liaison]');
      if (!b) return;
      projet.selection.liaison = b.dataset.liaison;
      projet.selection.valeurId = null;
      sauverProjet();
      renderChoix();
    });
    $('#choix-isolation').addEventListener('click', function (e) {
      const b = e.target.closest('[data-isolation]');
      if (!b) return;
      projet.selection.isolation = b.dataset.isolation;
      projet.selection.valeurId = null;
      sauverProjet();
      renderChoix();
    });
    $('#choix-variante').addEventListener('change', function (e) {
      projet.selection.valeurId = e.target.value;
      sauverProjet();
      renderFiche();
    });

    // --- Ajout d'une ligne ---
    $('#btn-ajouter').addEventListener('click', function () {
      const v = valeurChoisie();
      if (!v) { BAO.notifier('Aucune valeur de ψ pour ce cas.'); return; }
      if (BAO.lireNombre($('#longueur-ajout').value) < 0) { BAO.notifier('Une longueur ne peut pas être négative.'); return; }
      const ligne = { id: BAO.identifiant('l'), valeurId: v.id, longueur: BAO.lirePositif($('#longueur-ajout').value), repere: $('#repere-ajout').value.trim() };
      projet.lignes.push(ligne);
      sauverProjet();
      $('#longueur-ajout').value = '';
      $('#repere-ajout').value = '';
      renderLignes();
      BAO.notifier('Liaison ajoutée : ' + liaison(v.liaison).nom + ' (' + v.isolation + ').');
    });
    $('#longueur-ajout').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('#btn-ajouter').click();
    });

    // --- Lignes ---
    const corps = $('#corps-lignes');
    function ligneDe(el) {
      const tr = el.closest('tr[data-ligne]');
      return tr ? projet.lignes.find(function (l) { return l.id === tr.dataset.ligne; }) : null;
    }
    corps.addEventListener('input', function (e) {
      const ligne = ligneDe(e.target);
      if (!ligne) return;
      if (e.target.dataset.champ === 'longueur') {
        if (BAO.lireNombre(e.target.value) < 0) BAO.notifier('Une longueur ne peut pas être négative.');
        ligne.longueur = BAO.lirePositif(e.target.value);
        sauverProjet();
        majCalculs();
      } else if (e.target.dataset.champ === 'repere') {
        ligne.repere = e.target.value;
        sauverProjet();
      }
    });
    corps.addEventListener('change', function (e) {
      if (e.target.dataset.champ !== 'valeurId') return;
      const ligne = ligneDe(e.target);
      if (!ligne) return;
      ligne.valeurId = e.target.value;
      sauverProjet();
      renderLignes();
    });
    corps.addEventListener('click', function (e) {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      const id = b.closest('tr[data-ligne]').dataset.ligne;
      if (b.dataset.action === 'supprimer') {
        projet.lignes = projet.lignes.filter(function (l) { return l.id !== id; });
        detailsOuverts.delete(id);
        sauverProjet();
        renderLignes();
      } else if (b.dataset.action === 'detail') {
        BAO.basculerDetail(b, id, detailsOuverts);
      }
    });

    // --- Parois et nom ---
    $('#h-parois').addEventListener('input', function (e) {
      projet.hParois = BAO.lirePositif(e.target.value);
      sauverProjet();
      renderResultats(calculer());
    });
    $('#nom-projet').addEventListener('input', function (e) {
      projet.nom = e.target.value;
      sauverProjet();
      renderResultats(calculer());
    });

    // --- Résultats ---
    $('#resultats').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      if (b.dataset.action === 'copier-word') copierPourWord();
      if (b.dataset.action === 'export-csv') exporterCSV();
      if (b.dataset.action === 'imprimer') window.print();
    });

    // --- Données : valeurs ---
    $('#filtre-liaison').addEventListener('change', renderValeurs);
    $('#btn-ajouter-valeur').addEventListener('click', ajouterValeur);
    $('#corps-valeurs').addEventListener('change', function (e) {
      const champ = e.target.dataset.champ;
      const tr = e.target.closest('tr[data-index]');
      if (!champ || !tr) return;
      modifierValeur(Number(tr.dataset.index), champ, e.target.value);
    });
    $('#corps-valeurs').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="supprimer-valeur"]');
      if (!b) return;
      supprimerValeur(Number(b.closest('tr[data-index]').dataset.index));
    });

    // --- Données : réglages ---
    [['#seuil-faible', 'faible'], ['#seuil-moyen', 'moyen'], ['#seuil-fort', 'fort']].forEach(function (f) {
      $(f[0]).addEventListener('change', function (e) {
        const n = BAO.lireNombre(e.target.value);
        if (!isFinite(n) || n < 0) { BAO.notifier('Seuil invalide : tape un nombre (ex. 0,40).'); renderReglages(); return; }
        biblio.reglages.seuils[f[1]] = n;
        const s = biblio.reglages.seuils;
        if (!(s.faible <= s.moyen && s.moyen <= s.fort)) BAO.notifier('Attention : les seuils doivent aller croissant (faible ≤ moyen ≤ fort).');
        apresReglage();
      });
    });
    $('#statut-seuils').addEventListener('change', function (e) { biblio.reglages.seuils.statut = e.target.value; apresReglage(); });
    $('#incertitude').addEventListener('change', function (e) {
      const n = BAO.lireNombre(e.target.value);
      if (!isFinite(n) || n < 0 || n >= 100) { BAO.notifier('Incertitude invalide : tape un pourcentage entre 0 et 99.'); renderReglages(); return; }
      biblio.reglages.incertitude.pct = n;
      apresReglage();
    });
    $('#statut-incertitude').addEventListener('change', function (e) { biblio.reglages.incertitude.statut = e.target.value; apresReglage(); });

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
