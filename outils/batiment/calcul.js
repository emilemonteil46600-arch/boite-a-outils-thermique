/* ==========================================================
   DOSSIER BÂTIMENT — LOGIQUE DE CALCUL
   ----------------------------------------------------------
   Passer d'un coefficient de déperdition H (W/K) à des kWh et des €.
   Ces fonctions servent à tous les outils (ponts thermiques, chiffrage…).

   Méthode des degrés-jours :

     Besoin (kWh/an)          = H (W/K) × DJU (K·jour) × 24 (h/jour) / 1000
     Énergie finale (kWh/an)  = Besoin / rendement global du chauffage
     Coût (€/an)              = Énergie finale × prix de l'énergie (€/kWh)

   Puissance au jour le plus froid :

     P (W) = H (W/K) × (T intérieure − T de base)

   Exemple : H = 76 W/K, DJU = 2 000, rendement 85 %, gaz à 0,11 €/kWh
     Besoin  = 76 × 2 000 × 24 / 1000 = 3 648 kWh/an
     Finale  = 3 648 / 0,85          = 4 292 kWh/an
     Coût    = 4 292 × 0,11          ≈ 472 €/an
     P       = 76 × (19 − (−7))      = 1 976 W ≈ 2,0 kW
   ========================================================== */
(function (global) {
  'use strict';

  /* ---------- 1. Les formules de base ---------- */

  // Un DJU = 1 degré d'écart pendant 1 jour = 24 h. On divise par 1000 pour passer de Wh à kWh.
  function besoinAnnuel(h, dju) {
    return Number(h) * Number(dju) * 24 / 1000;
  }

  // Le chauffage perd une partie de l'énergie (production, distribution, régulation, émission).
  // rendement en % (ex. 85). Un rendement de 0 ou vide n'a pas de sens : pas de résultat.
  function energieFinale(besoin, rendementPct) {
    const r = Number(rendementPct) / 100;
    return r > 0 ? besoin / r : null;
  }

  function cout(energie, prix) {
    return energie === null ? null : energie * Number(prix);
  }

  function puissance(h, ti, tbase) {
    return Number(h) * (Number(ti) - Number(tbase));
  }

  /* ---------- 2. Les énergies ---------- */

  function trouverEnergie(energies, id) {
    return ((energies && energies.liste) || []).find(function (e) { return e.id === id; }) || null;
  }

  // { gaz: 0.11, electricite: 0.22, … } : pratique pour les autres outils.
  function prixParEnergie(energies) {
    const prix = {};
    ((energies && energies.liste) || []).forEach(function (e) { prix[e.id] = Number(e.prix); });
    return prix;
  }

  /* ---------- 3. Un H (W/K) traduit en énergie et en euros ----------
     h : { valeur, bas, haut } (fourchette) ou un simple nombre. */
  function enEnergie(h, batiment, energies) {
    const fourchette = typeof h === 'number' ? { valeur: h, bas: h, haut: h } : h;
    const climat = batiment.climat || {};
    const chauffage = batiment.chauffage || {};
    const energie = trouverEnergie(energies, chauffage.energie);
    const prix = energie ? Number(energie.prix) : null;

    function traduire(valeurH) {
      const besoin = besoinAnnuel(valeurH, climat.dju);
      const finale = energieFinale(besoin, chauffage.rendement);
      return { besoin: besoin, finale: finale, euros: prix === null ? null : cout(finale, prix) };
    }

    return {
      valeur: traduire(fourchette.valeur),
      bas: traduire(fourchette.bas),
      haut: traduire(fourchette.haut),
      puissance: puissance(fourchette.valeur, climat.ti, climat.tbase),
      energie: energie
    };
  }

  /* ---------- 4. Le bilan du bâtiment ---------- */

  function calculerBatiment(batiment, energies) {
    const conso = (batiment.consommations && batiment.consommations.valeurs) || {};
    const lignes = Object.keys(conso)
      .filter(function (id) { return Number(conso[id]) > 0; })
      .map(function (id) {
        const e = trouverEnergie(energies, id);
        const kwh = Number(conso[id]);
        return { id: id, energie: e, kwh: kwh, euros: e ? kwh * Number(e.prix) : null };
      });
    const totalKwh = lignes.reduce(function (s, l) { return s + l.kwh; }, 0);
    const totalEuros = lignes.reduce(function (s, l) { return s + (l.euros || 0); }, 0);
    const surface = Number(batiment.surface);

    // Ce que coûte 1 W/K de déperdition sur une année : utile pour juger un pont thermique.
    const unWK = enEnergie(1, batiment, energies);

    // Points de vigilance : tout ce qui n'est pas encore validé par toi.
    const climat = batiment.climat || {}, chauffage = batiment.chauffage || {};
    const nonValides = [
      ['DJU', climat.djuStatut], ['température intérieure', climat.tiStatut], ['température de base', climat.tbaseStatut],
      ['rendement du chauffage', chauffage.rendementStatut], ['consommations', (batiment.consommations || {}).statut]
    ].filter(function (x) { return x[1] !== 'valide'; }).map(function (x) { return x[0]; });
    const energiesExemple = lignes.concat(unWK.energie ? [{ energie: unWK.energie }] : [])
      .filter(function (l) { return l.energie && l.energie.statut !== 'valide'; })
      .map(function (l) { return l.energie.nom; })
      .filter(function (nom, i, t) { return t.indexOf(nom) === i; });

    return {
      lignes: lignes,
      totalKwh: totalKwh,
      totalEuros: totalEuros,
      ratio: surface > 0 ? totalKwh / surface : null,
      unWK: unWK,
      vigilance: {
        nonValides: nonValides,
        energiesExemple: energiesExemple,
        energieInconnue: lignes.filter(function (l) { return !l.energie; }).length + (unWK.energie ? 0 : 1),
        sansDju: !(Number(climat.dju) > 0),
        sansRendement: !(Number(chauffage.rendement) > 0)
      }
    };
  }

  const BatimentCalcul = {
    besoinAnnuel: besoinAnnuel,
    energieFinale: energieFinale,
    cout: cout,
    puissance: puissance,
    trouverEnergie: trouverEnergie,
    prixParEnergie: prixParEnergie,
    enEnergie: enEnergie,
    calculerBatiment: calculerBatiment
  };

  global.BatimentCalcul = BatimentCalcul;
  if (typeof module !== "undefined" && module.exports) module.exports = BatimentCalcul;
})(typeof window !== "undefined" ? window : globalThis);
