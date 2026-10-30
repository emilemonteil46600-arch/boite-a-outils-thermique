/* ==========================================================
   Dossier bâtiment : valeurs d'EXEMPLE (publiques).

   ⚠ Prix des énergies, DJU, température de base, rendement et
   consommations ci-dessous sont des ORDRES DE GRANDEUR pour faire
   tourner les outils. Remplace-les par les valeurs de ton projet
   (factures, station météo, STD Pléiades) et passe-les en « validé ».

   Tes vraies valeurs ne vont JAMAIS dans ce fichier (il est public) :
   elles restent dans ton navigateur + ta sauvegarde complète.
   ========================================================== */
window.BATIMENT_EXEMPLE = {
  version: 1,

  // Prix des énergies, par kWh d'énergie finale (ce qu'on lit sur les factures).
  // base : 'TTC' ou 'HT'. Le temps de retour compare le coût des travaux sur la même base.
  energies: {
    base: 'TTC',
    liste: [
      { id: "gaz",            nom: "Gaz naturel",        prix: 0.11, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par tes factures ou la base Pégase (SDES)" },
      { id: "electricite",    nom: "Électricité",        prix: 0.22, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par tes factures ou la base Pégase (SDES)" },
      { id: "fioul",          nom: "Fioul domestique",   prix: 0.12, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par tes factures ou la base Pégase (SDES)" },
      { id: "bois-granules",  nom: "Bois (granulés)",    prix: 0.08, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par tes factures ou la base Pégase (SDES)" },
      { id: "reseau-chaleur", nom: "Réseau de chaleur",  prix: 0.10, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par la facture du réseau" },
      { id: "propane",        nom: "Propane",            prix: 0.18, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif — à remplacer par tes factures ou la base Pégase (SDES)" }
    ]
  },

  // Bâtiment proposé tant que tu n'as pas saisi le tien.
  batiment: {
    nom: "Bâtiment d'exemple",
    surface: 1500,
    climat: {
      dju: 2000, djuStatut: "exemple", djuSource: "Valeur ronde d'exemple — à remplacer par les DJU base 18 °C de la station du projet (Météo-France, méthode COSTIC)",
      ti: 19, tiStatut: "exemple", tiSource: "Code de l'énergie, art. R241-26 : 19 °C en moyenne au maximum pour le chauffage",
      tbase: -7, tbaseStatut: "exemple", tbaseSource: "Valeur d'exemple — à vérifier selon le département et l'altitude (annexe nationale de NF EN 12831)"
    },
    chauffage: {
      energie: "gaz",
      rendement: 85, rendementStatut: "exemple", rendementSource: "Hypothèse d'exemple (H) : chaudière gaz + distribution + régulation + émission"
    },
    consommations: {
      // kWh d'énergie finale par an, à l'état initial.
      valeurs: { gaz: 150000, electricite: 40000 },
      statut: "exemple",
      source: "Valeurs d'exemple — à remplacer par les factures (3 dernières années) ou la STD de l'état initial"
    }
  }
};
