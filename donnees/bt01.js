/* ==========================================================
   Indice BT01 — Bâtiment tous corps d'état (base 100 en 2010)
   Publié chaque mois par l'INSEE au Journal officiel.
   Sert à actualiser un prix daté : prix × (BT01 actuel / BT01 du mois du prix).

   Source des valeurs : INSEE, reprises par l'ANIL
   https://www.anil.org/outils/indices-et-plafonds/indice-bt-01
   Relevé le 29/10/2026 (dernière valeur connue : août 2026).

   Pour ajouter un mois : soit ici (et on publie), soit directement
   dans l'outil, onglet « Données » (reste dans ton navigateur).
   ========================================================== */
window.BT01 = {
  source: "INSEE (via ANIL), base 2010",
  releve_le: "2026-10-29",
  valeurs: {
    "2024-01": 130.8, "2024-02": 131.0, "2024-03": 130.9, "2024-04": 131.0,
    "2024-05": 131.3, "2024-06": 131.2, "2024-07": 131.2, "2024-08": 131.7,
    "2024-09": 131.2, "2024-10": 131.2, "2024-11": 131.5, "2024-12": 131.7,

    "2025-01": 132.0, "2025-02": 132.1, "2025-03": 132.5, "2025-04": 132.9,
    "2025-05": 132.9, "2025-06": 133.1, "2025-07": 133.4, "2025-08": 133.7,
    "2025-09": 133.3, "2025-10": 133.2, "2025-11": 133.3, "2025-12": 133.7,

    "2026-01": 134.7, "2026-02": 135.1, "2026-03": 135.9, "2026-04": 137.5,
    "2026-05": 137.9, "2026-06": 138.3, "2026-07": 138.9, "2026-08": 139.4
  }
};
