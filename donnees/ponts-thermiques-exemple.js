/* ==========================================================
   Catalogue d'EXEMPLE pour l'outil Ponts thermiques ψ.

   ⚠ Les valeurs de ψ ci-dessous sont des ORDRES DE GRANDEUR,
   dans l'esprit des tableaux des règles Th-Bât, fascicule
   « Ponts thermiques » (CSTB, RT 2012). Elles ne sont PAS recopiées
   du fascicule : vérifie chaque valeur dans le document officiel
   (ou dans l'avis technique du rupteur) avant de la passer en « validé ».

   Unité de ψ : W/(m·K), en dimensions INTÉRIEURES (convention
   française des règles Th-U / Th-Bât).

   Tes valeurs vérifiées ne vont JAMAIS dans ce fichier (il est public) :
   elles restent dans ton navigateur + ton export JSON personnel.
   ========================================================== */
window.PONTS_EXEMPLE = {
  version: 1,

  // Les 3 positions de l'isolant dans le mur.
  isolations: [
    { id: "ITI", nom: "ITI — isolation par l'intérieur", court: "ITI", note: "Doublage isolant côté pièce (mur porteur côté froid)." },
    { id: "ITE", nom: "ITE — isolation par l'extérieur", court: "ITE", note: "Isolant collé ou fixé sur la face extérieure (mur porteur côté chaud)." },
    { id: "ITR", nom: "ITR — isolation répartie", court: "ITR", note: "Le mur est lui-même isolant (brique alvéolaire, béton cellulaire, monomur)." }
  ],

  // Les liaisons du catalogue. « mesure » = comment relever la longueur L.
  liaisons: [
    {
      id: "plancher-inter", nom: "Plancher intermédiaire / façade", vue: "Coupe verticale",
      description: "Le bord de la dalle d'étage (le « nez de dalle ») qui rejoint le mur de façade.",
      mesure: "Périmètre des façades × nombre de planchers intermédiaires (hors plancher bas et toiture)."
    },
    {
      id: "refend", nom: "Refend / façade", vue: "Vue en plan",
      description: "Un mur intérieur porteur (le refend, souvent en béton) qui vient se raccrocher au mur de façade.",
      mesure: "Hauteur sous plafond × nombre de refends qui touchent la façade (une fois par jonction)."
    },
    {
      id: "plancher-bas", nom: "Plancher bas / façade", vue: "Coupe verticale",
      description: "La dalle du rez-de-chaussée (au-dessus d'un vide sanitaire ou d'un sous-sol) qui rejoint le mur. (H) dalle isolée en sous-face.",
      mesure: "Périmètre du plancher bas le long des façades."
    },
    {
      id: "acrotere", nom: "Toiture-terrasse / acrotère", vue: "Coupe verticale",
      description: "Le bord de la toiture-terrasse, avec le petit muret qui dépasse au-dessus (l'acrotère). (H) toiture isolée sur la dalle, sous l'étanchéité.",
      mesure: "Périmètre de la toiture-terrasse le long des façades."
    },
    {
      id: "menuiserie", nom: "Menuiserie (appui, tableaux, linteau)", vue: "Vue en plan (tableau)",
      description: "Le tour de la fenêtre : appui en bas, tableaux sur les côtés, linteau en haut. (H) une seule valeur moyenne pour tout le tour.",
      mesure: "Périmètre de chaque baie (2 × largeur + 2 × hauteur), additionné pour toutes les baies."
    }
  ],

  // Valeurs de ψ. variante « standard » = cas courant non traité ;
  // « traite » = avec rupteur / retour d'isolant / isolant en about.
  valeurs: [
    // --- Plancher intermédiaire / façade ---
    { id: "pi-iti",       liaison: "plancher-inter", isolation: "ITI", variante: "standard", nomVariante: "Sans rupteur (nez de dalle traversant)", psi: 0.90, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pi-iti-rupt",  liaison: "plancher-inter", isolation: "ITI", variante: "traite",   nomVariante: "Avec rupteur de pont thermique",          psi: 0.25, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (avis techniques de rupteurs) — à vérifier" },
    { id: "pi-ite",       liaison: "plancher-inter", isolation: "ITE", variante: "standard", nomVariante: "Isolant continu devant la dalle",        psi: 0.10, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pi-itr",       liaison: "plancher-inter", isolation: "ITR", variante: "standard", nomVariante: "About de dalle non isolé",               psi: 0.60, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pi-itr-about", liaison: "plancher-inter", isolation: "ITR", variante: "traite",   nomVariante: "Planelle + isolant en about de dalle",   psi: 0.30, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },

    // --- Refend / façade ---
    { id: "rf-iti",        liaison: "refend", isolation: "ITI", variante: "standard", nomVariante: "Refend qui coupe le doublage",          psi: 0.70, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "rf-iti-retour", liaison: "refend", isolation: "ITI", variante: "traite",   nomVariante: "Retour d'isolant sur le refend",        psi: 0.45, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "rf-ite",        liaison: "refend", isolation: "ITE", variante: "standard", nomVariante: "Isolant continu devant le refend",      psi: 0.05, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "rf-itr",        liaison: "refend", isolation: "ITR", variante: "standard", nomVariante: "Refend béton encastré dans le mur",     psi: 0.30, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },

    // --- Plancher bas / façade ---
    { id: "pb-iti",       liaison: "plancher-bas", isolation: "ITI", variante: "standard", nomVariante: "Doublage arrêté sur la dalle",            psi: 0.60, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pb-ite",       liaison: "plancher-bas", isolation: "ITE", variante: "standard", nomVariante: "ITE arrêtée au niveau du plancher",       psi: 0.45, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pb-ite-soub",  liaison: "plancher-bas", isolation: "ITE", variante: "traite",   nomVariante: "ITE descendue en soubassement",           psi: 0.20, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "pb-itr",       liaison: "plancher-bas", isolation: "ITR", variante: "standard", nomVariante: "Mur isolant posé sur la dalle",           psi: 0.45, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },

    // --- Toiture-terrasse / acrotère ---
    { id: "ac-iti",       liaison: "acrotere", isolation: "ITI", variante: "standard", nomVariante: "Acrotère béton, doublage sous la dalle",  psi: 0.75, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "ac-ite",       liaison: "acrotere", isolation: "ITE", variante: "standard", nomVariante: "Acrotère non isolé",                      psi: 0.45, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "ac-ite-isole", liaison: "acrotere", isolation: "ITE", variante: "traite",   nomVariante: "Acrotère enveloppé d'isolant",            psi: 0.10, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "ac-itr",       liaison: "acrotere", isolation: "ITR", variante: "standard", nomVariante: "Acrotère béton sur mur isolant",          psi: 0.55, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },

    // --- Menuiserie ---
    { id: "me-iti",        liaison: "menuiserie", isolation: "ITI", variante: "standard", nomVariante: "Menuiserie au nu intérieur, contre le doublage", psi: 0.10, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "me-ite",        liaison: "menuiserie", isolation: "ITE", variante: "standard", nomVariante: "Menuiserie au nu intérieur, tableaux non isolés", psi: 0.40, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "me-ite-retour", liaison: "menuiserie", isolation: "ITE", variante: "traite",   nomVariante: "Retour d'isolant en tableau",                    psi: 0.15, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" },
    { id: "me-itr",        liaison: "menuiserie", isolation: "ITR", variante: "standard", nomVariante: "Menuiserie en feuillure, au milieu du mur",      psi: 0.15, dateRef: "2026-10", statut: "exemple", source: "Ordre de grandeur indicatif (esprit Th-Bât, fascicule Ponts thermiques) — à vérifier" }
  ],

  // Pourquoi la valeur est forte ou faible (texte affiché sous le schéma).
  explications: {
    "pi-iti":        "La dalle béton traverse tout le mur et coupe le doublage isolant. Le béton armé conduit 50 à 70 fois mieux la chaleur qu'un isolant (λ 2,3 contre 0,032 à 0,040 W/(m·K), voir Méthode) : la chaleur de l'étage file dans la dalle et sort par le nez de dalle, côté froid. C'est le pont thermique le plus fort d'un bâtiment isolé par l'intérieur.",
    "pi-iti-rupt":   "Un rupteur est un bloc d'isolant (avec des aciers pour tenir la dalle) placé entre la dalle et le mur, dans le plan de l'isolant. Il « referme » en grande partie la coupure : il ne reste que les aciers et les zones de béton entre rupteurs. ψ est divisé par 3 à 4 environ.",
    "pi-ite":        "L'isolant passe devant le nez de dalle sans interruption : la dalle reste entièrement côté chaud. Il n'y a presque plus de chemin facile pour la chaleur. C'est le grand avantage de l'ITE.",
    "pi-itr":        "Le mur isolant (brique alvéolaire, béton cellulaire) est interrompu par la dalle béton qui vient s'appuyer dessus. Le nez de dalle n'est protégé que par une fine planelle : la dalle fait « court-circuit » à travers le mur isolant.",
    "pi-itr-about":  "On ajoute une bande d'isolant entre la planelle et le nez de dalle. Le chemin à travers la dalle est rallongé et freiné : ψ baisse d'environ moitié, sans atteindre l'ITE.",
    "rf-iti":        "Le refend béton relie directement l'intérieur au mur de façade froid, en coupant le doublage. La chaleur des pièces entre dans le refend par ses deux faces et ressort par la façade.",
    "rf-iti-retour": "On isole le refend sur environ 1 m depuis la façade (retour d'isolant). Le chemin de la chaleur est plus long, donc plus freiné. Le gain reste partiel, et la pose est moins pratique (perte de surface, finitions).",
    "rf-ite":        "Avec l'ITE, le refend s'arrête contre un mur qui est déjà côté chaud : l'isolant continue devant. La liaison ne crée presque pas de perte supplémentaire.",
    "rf-itr":        "Le refend béton entre dans le mur isolant et réduit son épaisseur utile à cet endroit. Pont thermique moyen : moins grave qu'en ITI car le mur isole sur toute son épaisseur ailleurs.",
    "pb-iti":        "Le doublage du mur s'arrête sur la dalle, et l'isolant du plancher est en dessous de la dalle. Entre les deux, le bord de la dalle et le haut du mur de soubassement relient l'intérieur à l'extérieur : l'isolation n'est pas continue.",
    "pb-ite":        "L'ITE s'arrête souvent au niveau du plancher (ou un peu au-dessus). Le mur de soubassement, non isolé, conduit la chaleur de la dalle vers l'extérieur et le vide sanitaire.",
    "pb-ite-soub":   "En descendant l'isolant (souvent du polystyrène extrudé, qui supporte l'humidité) sous le niveau du plancher, on recouvre le chemin par le soubassement. ψ baisse fortement.",
    "pb-itr":        "Le mur isolant est posé sur la dalle et sur un soubassement béton. La chaleur passe par la dalle puis par le soubassement, qui n'isole pas.",
    "ac-iti":        "La dalle de toiture et l'acrotère sont en béton, d'un seul bloc. Le doublage est sous la dalle, l'isolant de toiture est dessus : la dalle sort à l'air libre par l'acrotère, qui agit comme une ailette de radiateur.",
    "ac-ite":        "L'ITE protège le mur et l'isolant de toiture protège la dalle, mais l'acrotère reste nu. La chaleur monte de la dalle dans l'acrotère et se dissipe par ses deux faces exposées au froid.",
    "ac-ite-isole":  "On habille l'acrotère d'isolant (sur ses faces et parfois sur le dessus, sous la couvertine) : l'isolant du mur rejoint celui de la toiture. Le chemin est presque refermé.",
    "ac-itr":        "Le mur isolant porte une dalle et un acrotère en béton. Comme en ITI, la dalle « sort » à l'extérieur par l'acrotère et court-circuite le mur isolant.",
    "me-iti":        "La fenêtre est posée contre le doublage, dans le plan de l'isolant : l'isolant du mur rejoint presque directement le dormant. Peu de chemin facile, ψ faible.",
    "me-ite":        "La fenêtre est restée au nu intérieur, loin de l'isolant extérieur. Les tableaux (les côtés de la baie) sont en maçonnerie nue, exposés au froid : la chaleur fait le tour par le tableau. Erreur fréquente en rénovation.",
    "me-ite-retour": "On colle quelques centimètres d'isolant sur les tableaux et le linteau, jusqu'au dormant. Le contour de la fenêtre redevient isolé. Encore mieux : avancer la fenêtre dans l'épaisseur de l'isolant.",
    "me-itr":        "La fenêtre est en feuillure, à peu près au milieu du mur isolant : la jonction reste dans une zone isolée. ψ faible à moyen selon la qualité du calfeutrement."
  },

  // Réglages de l'outil (H) : conventions modifiables dans l'onglet Données.
  reglages: {
    // Seuils pour qualifier un ψ (W/(m·K)) : en dessous de « faible » → faible, etc.
    seuils: { faible: 0.15, moyen: 0.40, fort: 0.70, statut: "exemple", source: "Convention de l'outil (H), pour lire les résultats — pas une valeur normative" },
    // Incertitude appliquée aux ψ tabulés pour afficher une fourchette (± %).
    incertitude: { pct: 20, statut: "exemple", source: "Hypothèse de l'outil (H) : valeur tabulée contre calcul 2D du vrai détail" }
  }
};
