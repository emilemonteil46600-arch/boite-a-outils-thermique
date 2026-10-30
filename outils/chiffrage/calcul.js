/* ==========================================================
   CHIFFRAGE — LOGIQUE DE CALCUL
   ----------------------------------------------------------
   Tout le calcul de l'outil est dans ce fichier, et rien d'autre.
   Pas d'affichage ici : seulement des fonctions courtes qu'on
   peut lire, vérifier à la main et tester.

   La formule pour une ligne :

     Coût = Quantité
          × Prix unitaire de référence (bas / haut, € HT)
          × Coef. actualisation   (BT01 actuel / BT01 au mois du prix)
          × Coef. type de bâtiment
          × Coef. complexité (1 à 4)
          × Coef. site occupé     (1 si non)

   Puis pour chaque scénario (ex. « Scénario 1 — enveloppe ») :

     Travaux HT     = somme des lignes du scénario
     Total HT       = Travaux × (1 + %MOE + %aléas)
     Total TTC      = Total HT × (1 + %TVA)

   Gains d'un scénario, énergie par énergie (kWh d'énergie finale par an) :

     Gain (kWh/an)    = consommation avant − consommation après
     Économie (€/an)  = somme des (gain × prix de l'énergie)
     Temps de retour  = coût des travaux / économie annuelle      (années, « brut »)

   Le coût et l'économie sont pris sur la même base (TTC avec TTC, HT avec HT).
   ========================================================== */
(function (global) {
  'use strict';

  /* ---------- 1. Indice BT01 ---------- */

  // Assemble la table officielle et les mois que tu as ajoutés toi-même.
  // En cas de doublon, ta valeur gagne.
  function fusionnerBT01(tableOfficielle, tablePerso) {
    return Object.assign({}, tableOfficielle || {}, tablePerso || {});
  }

  // Dernier mois disponible dans la table → c'est l'indice "actuel".
  function dernierBT01(table) {
    const mois = Object.keys(table || {})
      .filter(function (m) { return /^\d{4}-\d{2}$/.test(m) && isFinite(table[m]) && table[m] > 0; })
      .sort();
    if (!mois.length) return null;
    const dernier = mois[mois.length - 1];
    return { mois: dernier, valeur: Number(table[dernier]) };
  }

  // Coefficient d'actualisation d'un prix daté.
  // Exemple : prix de janv. 2025 (BT01 = 132,0), BT01 actuel août 2026 = 139,4
  //           → coef = 139,4 / 132,0 = 1,056 (+5,6 %)
  function coefActualisation(dateRef, table) {
    const actuel = dernierBT01(table);
    if (!dateRef) {
      return { coef: 1, actualise: false, raison: "pas de date sur le prix : non actualisé" };
    }
    if (!actuel) {
      return { coef: 1, actualise: false, raison: "table BT01 vide : non actualisé" };
    }
    const indiceRef = Number(table[dateRef]);
    if (!isFinite(indiceRef) || indiceRef <= 0) {
      return { coef: 1, actualise: false, raison: "pas d'indice BT01 pour " + dateRef + " : non actualisé" };
    }
    return {
      coef: actuel.valeur / indiceRef,
      actualise: true,
      moisRef: dateRef,
      indiceRef: indiceRef,
      moisActuel: actuel.mois,
      indiceActuel: actuel.valeur
    };
  }

  /* ---------- 2. Coefficients liés au bâtiment ---------- */

  // Ces trois coefficients sont les mêmes pour toutes les lignes d'un projet.
  function coefsContexte(projet, biblio) {
    const type = (biblio.typesBatiment || []).find(function (t) { return t.id === projet.typeBatiment; });
    const cplx = (biblio.complexite || []).find(function (c) { return Number(c.niveau) === Number(projet.complexite); });
    const site = biblio.siteOccupe || { coef: 1 };

    const coefType = type ? Number(type.coef) : 1;
    const coefCplx = cplx ? Number(cplx.coef) : 1;
    const coefSite = projet.siteOccupe ? Number(site.coef) : 1;

    return {
      type: { coef: coefType, nom: type ? type.nom : "type inconnu", statut: type ? type.statut : "exemple" },
      complexite: { coef: coefCplx, niveau: cplx ? cplx.niveau : "?", nom: cplx ? cplx.nom : "inconnue", statut: cplx ? cplx.statut : "exemple" },
      site: { coef: coefSite, actif: !!projet.siteOccupe, statut: projet.siteOccupe ? site.statut : "valide" },
      produit: coefType * coefCplx * coefSite
    };
  }

  /* ---------- 3. Une ligne de chiffrage ---------- */

  function calculerLigne(ligne, biblio, contexte, tableBT01) {
    const ratio = (biblio.ratios || []).find(function (r) { return r.id === ligne.ratioId; });
    // Une quantité vide ou négative n'a pas de sens : elle compte pour 0 (signalé « sans quantité »).
    const q = Number(ligne.quantite);
    const quantite = q > 0 ? q : 0;

    if (!ratio) {
      return { ligne: ligne, erreur: "Poste introuvable dans la bibliothèque (supprimé ?)", quantite: quantite, totalBas: 0, totalHaut: 0 };
    }

    const actualisation = coefActualisation(ratio.dateRef, tableBT01);
    const coefTotal = actualisation.coef * contexte.produit;

    const puBas = Number(ratio.prixBas) * coefTotal;
    const puHaut = Number(ratio.prixHaut) * coefTotal;

    return {
      ligne: ligne,
      ratio: ratio,
      quantite: quantite,
      actualisation: actualisation,
      coefTotal: coefTotal,
      puBas: puBas,
      puHaut: puHaut,
      totalBas: quantite * puBas,
      totalHaut: quantite * puHaut
    };
  }

  /* ---------- 4. Les totaux d'un scénario ---------- */

  function totauxScenario(lignes, frais) {
    const travauxBas = lignes.reduce(function (s, l) { return s + l.totalBas; }, 0);
    const travauxHaut = lignes.reduce(function (s, l) { return s + l.totalHaut; }, 0);

    const f = frais || {};
    const pMoe = (Number(f.moe) || 0) / 100;
    const pAleas = (Number(f.aleas) || 0) / 100;
    const pTva = (Number(f.tva) || 0) / 100;

    // MOE et aléas sont calculés sur le montant des travaux (pas l'un sur l'autre).
    const moeBas = travauxBas * pMoe, moeHaut = travauxHaut * pMoe;
    const aleasBas = travauxBas * pAleas, aleasHaut = travauxHaut * pAleas;
    const htBas = travauxBas + moeBas + aleasBas;
    const htHaut = travauxHaut + moeHaut + aleasHaut;
    const tvaBas = htBas * pTva, tvaHaut = htHaut * pTva;

    return {
      travaux: { bas: travauxBas, haut: travauxHaut },
      moe: { bas: moeBas, haut: moeHaut, taux: pMoe },
      aleas: { bas: aleasBas, haut: aleasHaut, taux: pAleas },
      totalHT: { bas: htBas, haut: htHaut },
      tva: { bas: tvaBas, haut: tvaHaut, taux: pTva },
      totalTTC: { bas: htBas + tvaBas, haut: htHaut + tvaHaut }
    };
  }

  /* ---------- 5. Les gains d'un scénario ----------
     avant : { gaz: 150000, electricite: 40000 }  kWh/an à l'état initial
     apres : { gaz: 120000 }                       kWh/an après travaux (vide = inchangé)
     prix  : { gaz: 0.11, electricite: 0.22 }      €/kWh
     Une énergie peut augmenter : gaz → PAC = moins de gaz, plus d'électricité (gain négatif).

     Exemple : gaz 150 000 → 120 000 kWh à 0,11 €/kWh
               gain = 30 000 kWh/an, économie = 30 000 × 0,11 = 3 300 €/an */
  function gainsScenario(avant, apres, prix) {
    const av = avant || {}, ap = apres || {}, px = prix || {};
    const ids = Object.keys(av).concat(Object.keys(ap))
      .filter(function (id, i, t) { return t.indexOf(id) === i; })
      .filter(function (id) { return Number(av[id]) > 0 || ap[id] !== undefined && ap[id] !== ''; });

    const lignes = ids.map(function (id) {
      const kwhAvant = Number(av[id]) || 0;
      const saisi = ap[id] !== undefined && ap[id] !== '' && isFinite(Number(ap[id]));
      const kwhApres = saisi ? Number(ap[id]) : kwhAvant;   // pas de valeur après = consommation inchangée
      const gainKwh = kwhAvant - kwhApres;
      const p = px[id];
      return {
        id: id, avant: kwhAvant, apres: kwhApres, inchange: !saisi,
        gainKwh: gainKwh, prix: p === undefined ? null : p,
        gainEuros: p === undefined ? null : gainKwh * p
      };
    });

    const somme = function (cle) { return lignes.reduce(function (s, l) { return s + (l[cle] || 0); }, 0); };
    const totalAvant = somme('avant');
    const gainKwh = somme('gainKwh');
    return {
      lignes: lignes,
      totalAvant: totalAvant,
      totalApres: somme('apres'),
      gainKwh: gainKwh,
      gainPct: totalAvant > 0 ? gainKwh / totalAvant : null,
      gainEuros: somme('gainEuros'),
      apresSaisi: lignes.some(function (l) { return !l.inchange; }),
      prixManquant: lignes.filter(function (l) { return l.prix === null; }).length
    };
  }

  // Temps de retour brut (années) = coût / économie annuelle. Pas d'économie = pas de retour.
  function tempsDeRetour(cout, economieAn) {
    return economieAn > 0 ? cout / economieAn : null;
  }

  /* ---------- 6. Le projet complet ----------
     energie (facultatif) : { avant: {…kWh}, prix: {…€/kWh}, base: 'TTC' | 'HT' }
     Un ancien chiffrage sans scénario = un seul scénario qui contient toutes les lignes.
     Une ligne rattachée à un scénario inconnu va dans le premier scénario. */
  function calculerProjet(projet, biblio, tableBT01, energie) {
    const contexte = coefsContexte(projet, biblio);
    const lignes = (projet.lignes || []).map(function (l) {
      return calculerLigne(l, biblio, contexte, tableBT01);
    });
    const listeScenarios = (projet.scenarios && projet.scenarios.length) ? projet.scenarios : [{ id: 's1', nom: 'Scénario 1' }];
    const ids = listeScenarios.map(function (sc) { return sc.id; });
    const e = energie || {};

    const scenarios = listeScenarios.map(function (sc, i) {
      const siennes = lignes.filter(function (l) {
        const id = l.ligne.scenarioId;
        return id === sc.id || (i === 0 && ids.indexOf(id) === -1);
      });
      const totaux = totauxScenario(siennes, projet.frais);
      const gains = gainsScenario(e.avant, sc.consosApres, e.prix);
      const cout = e.base === 'HT' ? totaux.totalHT : totaux.totalTTC;
      const retour = gains.apresSaisi && gains.gainEuros > 0
        ? { bas: tempsDeRetour(cout.bas, gains.gainEuros), haut: tempsDeRetour(cout.haut, gains.gainEuros) }
        : null;
      return Object.assign({ scenario: sc, lignes: siennes, gains: gains, retour: retour, base: e.base === 'HT' ? 'HT' : 'TTC' }, totaux);
    });

    // Points de vigilance : tout ce qui n'est pas encore validé par toi.
    const lignesExemple = lignes.filter(function (l) { return l.ratio && l.ratio.statut !== "valide"; }).length;
    const lignesNonActualisees = lignes.filter(function (l) { return l.actualisation && !l.actualisation.actualise; }).length;
    const lignesErreur = lignes.filter(function (l) { return l.erreur; }).length;
    const lignesSansQuantite = lignes.filter(function (l) { return !l.erreur && !(l.quantite > 0); }).length;
    const coefsExemple = [contexte.type, contexte.complexite, contexte.site]
      .filter(function (c) { return c.statut !== "valide"; }).length;

    return {
      contexte: contexte,
      lignes: lignes,
      scenarios: scenarios,
      vigilance: {
        lignesExemple: lignesExemple,
        lignesNonActualisees: lignesNonActualisees,
        lignesErreur: lignesErreur,
        lignesSansQuantite: lignesSansQuantite,
        coefsExemple: coefsExemple
      }
    };
  }

  /* ---------- 7. Arrondi d'affichage ----------
     Le calcul garde tous les chiffres ; on arrondit seulement ce qu'on montre.
     Annoncer 48 093 € quand l'incertitude est de ±30 % donne une fausse précision. */
  function arrondir(valeur, pas) {
    const p = Number(pas);
    if (!p || p <= 0) return valeur;
    return Math.round(valeur / p) * p;
  }

  const ChiffrageCalcul = {
    fusionnerBT01: fusionnerBT01,
    dernierBT01: dernierBT01,
    coefActualisation: coefActualisation,
    coefsContexte: coefsContexte,
    calculerLigne: calculerLigne,
    totauxScenario: totauxScenario,
    gainsScenario: gainsScenario,
    tempsDeRetour: tempsDeRetour,
    calculerProjet: calculerProjet,
    arrondir: arrondir
  };

  global.ChiffrageCalcul = ChiffrageCalcul;
  if (typeof module !== "undefined" && module.exports) module.exports = ChiffrageCalcul;
})(typeof window !== "undefined" ? window : globalThis);
