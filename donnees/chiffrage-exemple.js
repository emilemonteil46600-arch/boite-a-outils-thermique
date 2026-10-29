/* ==========================================================
   Bibliothèque d'EXEMPLE pour l'outil de chiffrage.

   ⚠ Tous les prix et coefficients ci-dessous sont des ORDRES DE GRANDEUR
   pour faire tourner l'outil. Ils ne sont pas sourcés.
   Remplace-les par tes propres ratios (devis, DPGF, retours chantier…)
   et passe-les en statut « validé ».

   Tes vrais ratios ne vont JAMAIS dans ce fichier (il est public sur GitHub) :
   ils restent dans ton navigateur + ton export JSON personnel.

   Prix : € HT, fourniture + pose, en rénovation.
   dateRef : mois du prix (AAAA-MM) → sert à l'actualiser avec l'indice BT01.
   ========================================================== */
window.CHIFFRAGE_EXEMPLE = {
  version: 1,

  ratios: [
    // --- Enveloppe : murs ---
    { id: "ite-enduit",      categorie: "Murs",       poste: "ITE sous enduit (PSE ou laine de roche)", unite: "m² de mur",   prixBas: 120,  prixHaut: 190,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "ite-bardage",     categorie: "Murs",       poste: "ITE sous bardage ventilé",                unite: "m² de mur",   prixBas: 160,  prixHaut: 260,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "iti-doublage",    categorie: "Murs",       poste: "ITI doublage isolant + plaque",           unite: "m² de mur",   prixBas: 45,   prixHaut: 85,   dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Enveloppe : toiture ---
    { id: "combles-souffles", categorie: "Toiture",   poste: "Isolation combles perdus (soufflage)",    unite: "m² de plancher", prixBas: 25,  prixHaut: 45,   dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "rampants",        categorie: "Toiture",    poste: "Isolation rampants / sous toiture",       unite: "m² de toiture",  prixBas: 60,  prixHaut: 110,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "toiture-terrasse", categorie: "Toiture",   poste: "Isolation toiture-terrasse + réfection étanchéité", unite: "m² de toiture", prixBas: 130, prixHaut: 230, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Enveloppe : plancher bas ---
    { id: "plancher-bas",    categorie: "Plancher bas", poste: "Isolation sous plancher (sous-sol / vide sanitaire)", unite: "m² de plancher", prixBas: 35, prixHaut: 70, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Menuiseries et protections ---
    { id: "menuiseries-pvc", categorie: "Menuiseries & protections", poste: "Menuiseries PVC double vitrage",      unite: "m² de baie", prixBas: 450, prixHaut: 800,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "menuiseries-alu", categorie: "Menuiseries & protections", poste: "Menuiseries alu RPT double vitrage",  unite: "m² de baie", prixBas: 700, prixHaut: 1200, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "protections-sol", categorie: "Menuiseries & protections", poste: "Protections solaires extérieures (BSO / stores)", unite: "m² de baie", prixBas: 300, prixHaut: 600, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Chauffage et ECS ---
    { id: "pac-air-eau",     categorie: "Chauffage & ECS", poste: "PAC air/eau",                 unite: "kW",  prixBas: 700,  prixHaut: 1300, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "chaudiere-cond",  categorie: "Chauffage & ECS", poste: "Chaudière gaz à condensation", unite: "kW",  prixBas: 120,  prixHaut: 300,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "chaudiere-bois",  categorie: "Chauffage & ECS", poste: "Chaudière bois granulés",      unite: "kW",  prixBas: 600,  prixHaut: 1100, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "ecs-thermo",      categorie: "Chauffage & ECS", poste: "Ballon ECS thermodynamique",   unite: "u",   prixBas: 2500, prixHaut: 4500, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Distribution et régulation ---
    { id: "calorifugeage",   categorie: "Distribution & régulation", poste: "Calorifugeage des réseaux",  unite: "ml", prixBas: 25, prixHaut: 60,  dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "robinets-thermo", categorie: "Distribution & régulation", poste: "Robinets thermostatiques",   unite: "u",  prixBas: 80, prixHaut: 150, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "gtb",             categorie: "Distribution & régulation", poste: "GTB / régulation centralisée", unite: "m² de surface", prixBas: 10, prixHaut: 30, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Ventilation ---
    { id: "vmc-sf-hygro",    categorie: "Ventilation", poste: "VMC simple flux hygroréglable",  unite: "m² de surface", prixBas: 10, prixHaut: 25, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },
    { id: "vmc-df",          categorie: "Ventilation", poste: "VMC double flux (CTA + réseaux)", unite: "m² de surface", prixBas: 45, prixHaut: 95, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Éclairage ---
    { id: "led",             categorie: "Éclairage", poste: "Éclairage LED (luminaires + pose)", unite: "m² de surface", prixBas: 20, prixHaut: 45, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" },

    // --- Production d'énergie ---
    { id: "pv-toiture",      categorie: "Production d'énergie", poste: "Photovoltaïque en toiture", unite: "kWc", prixBas: 1100, prixHaut: 1800, dateRef: "2025-01", statut: "exemple", source: "Exemple indicatif — à remplacer" }
  ],

  // Coefficient selon le type de bâtiment. Référence des ratios = tertiaire / ERP (1,00).
  typesBatiment: [
    { id: "maison",     nom: "Maison individuelle",           coef: 1.10, statut: "exemple", note: "Petites quantités, moins d'économies d'échelle" },
    { id: "collectif",  nom: "Logement collectif / HLM",      coef: 0.95, statut: "exemple", note: "Répétitivité des ouvrages" },
    { id: "tertiaire",  nom: "Tertiaire / ERP",               coef: 1.00, statut: "exemple", note: "Référence des ratios" },
    { id: "grand-volume", nom: "Grand volume (gymnase, industriel)", coef: 0.90, statut: "exemple", note: "Grandes surfaces simples et continues" }
  ],

  // Indice de complexité du chantier, de 1 à 4.
  complexite: [
    { niveau: 1, nom: "Simple",          coef: 0.90, statut: "exemple", criteres: "Plain-pied ou R+1, accès direct, géométrie simple, peu de points singuliers." },
    { niveau: 2, nom: "Courant",         coef: 1.00, statut: "exemple", criteres: "R+2 / R+3, échafaudage standard, quelques points singuliers, accès correct." },
    { niveau: 3, nom: "Contraint",       coef: 1.15, statut: "exemple", criteres: "Grande hauteur ou nacelle, géométrie complexe (décrochés, nombreux percements), réseaux à dévoyer, accès limité." },
    { niveau: 4, nom: "Très contraint",  coef: 1.35, statut: "exemple", criteres: "Bâtiment patrimonial / ABF, amiante ou plomb suspecté, accès très difficile, phasage lourd." }
  ],

  // Travaux en site occupé (bâtiment utilisé pendant le chantier).
  siteOccupe: { coef: 1.10, statut: "exemple", note: "Phasage, protections, horaires décalés" },

  // Frais ajoutés au coût des travaux (en %), valeurs par défaut d'un nouveau chiffrage.
  fraisDefaut: { moe: 10, aleas: 5, tva: 20 }
};
