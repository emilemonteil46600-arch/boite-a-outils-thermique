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

   Puis pour le projet :

     Travaux HT     = somme des lignes
     Total HT       = Travaux × (1 + %MOE + %aléas)
     Total TTC      = Total HT × (1 + %TVA)
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

  /* ---------- 4. Le projet complet ---------- */

  function calculerProjet(projet, biblio, tableBT01) {
    const contexte = coefsContexte(projet, biblio);
    const lignes = (projet.lignes || []).map(function (l) {
      return calculerLigne(l, biblio, contexte, tableBT01);
    });

    const travauxBas = lignes.reduce(function (s, l) { return s + l.totalBas; }, 0);
    const travauxHaut = lignes.reduce(function (s, l) { return s + l.totalHaut; }, 0);

    const frais = projet.frais || {};
    const pMoe = (Number(frais.moe) || 0) / 100;
    const pAleas = (Number(frais.aleas) || 0) / 100;
    const pTva = (Number(frais.tva) || 0) / 100;

    // MOE et aléas sont calculés sur le montant des travaux (pas l'un sur l'autre).
    const moeBas = travauxBas * pMoe, moeHaut = travauxHaut * pMoe;
    const aleasBas = travauxBas * pAleas, aleasHaut = travauxHaut * pAleas;
    const htBas = travauxBas + moeBas + aleasBas;
    const htHaut = travauxHaut + moeHaut + aleasHaut;
    const tvaBas = htBas * pTva, tvaHaut = htHaut * pTva;

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
      travaux: { bas: travauxBas, haut: travauxHaut },
      moe: { bas: moeBas, haut: moeHaut, taux: pMoe },
      aleas: { bas: aleasBas, haut: aleasHaut, taux: pAleas },
      totalHT: { bas: htBas, haut: htHaut },
      tva: { bas: tvaBas, haut: tvaHaut, taux: pTva },
      totalTTC: { bas: htBas + tvaBas, haut: htHaut + tvaHaut },
      vigilance: {
        lignesExemple: lignesExemple,
        lignesNonActualisees: lignesNonActualisees,
        lignesErreur: lignesErreur,
        lignesSansQuantite: lignesSansQuantite,
        coefsExemple: coefsExemple
      }
    };
  }

  /* ---------- 5. Arrondi d'affichage ----------
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
    calculerProjet: calculerProjet,
    arrondir: arrondir
  };

  global.ChiffrageCalcul = ChiffrageCalcul;
  if (typeof module !== "undefined" && module.exports) module.exports = ChiffrageCalcul;
})(typeof window !== "undefined" ? window : globalThis);
