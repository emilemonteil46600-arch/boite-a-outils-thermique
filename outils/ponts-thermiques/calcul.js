/* ==========================================================
   PONTS THERMIQUES ψ — LOGIQUE DE CALCUL
   ----------------------------------------------------------
   Tout le calcul de l'outil est dans ce fichier, et rien d'autre.
   Pas d'affichage ici : seulement des fonctions courtes qu'on
   peut lire, vérifier à la main et tester.

   Pour une liaison :

     H liaison (W/K) = ψ (W/(m·K)) × L (m)

   Pour le bâtiment :

     H ponts thermiques = somme des ψ × L
     H total            = H parois (somme des U × A, saisi) + H ponts thermiques
     Part des ponts     = H ponts thermiques / H total

   Fourchette (H) : chaque ψ tabulé est pris à ± incertitude %
     ψ bas = ψ × (1 − i)        ψ haut = ψ × (1 + i)

   Normes de référence : NF EN ISO 14683 (méthode simplifiée, valeurs
   tabulées), NF EN ISO 10211 (calcul numérique 2D/3D), règles Th-U et
   Th-Bât, fascicule « Ponts thermiques » (France).
   ========================================================== */
(function (global) {
  'use strict';

  /* ---------- 1. Trouver une valeur de ψ dans le catalogue ---------- */

  function trouverValeur(biblio, id) {
    return (biblio.valeurs || []).find(function (v) { return v.id === id; }) || null;
  }

  // Toutes les variantes possibles pour une liaison et une position d'isolant,
  // la variante « standard » en premier.
  function variantes(biblio, liaison, isolation) {
    return (biblio.valeurs || [])
      .filter(function (v) { return v.liaison === liaison && v.isolation === isolation; })
      .sort(function (a, b) { return (a.variante === 'standard' ? 0 : 1) - (b.variante === 'standard' ? 0 : 1); });
  }

  /* ---------- 2. Lire un ψ : faible, moyen, fort ou très fort ----------
     Les seuils sont une convention de l'outil (H), modifiable dans Données. */
  function niveauPsi(psi, seuils) {
    const p = Number(psi);
    if (!isFinite(p)) return 'inconnu';
    if (p < seuils.faible) return 'faible';
    if (p < seuils.moyen) return 'moyen';
    if (p < seuils.fort) return 'fort';
    return 'tres-fort';
  }

  /* ---------- 3. Une liaison ----------
     Exemple : nez de dalle en ITI, ψ = 0,90 W/(m·K), L = 60 m
               → H = 0,90 × 60 = 54 W/K
     « 54 W/K » veut dire : 54 W perdus pour chaque degré d'écart
     entre l'intérieur et l'extérieur. */
  function deperditionLiaison(psi, longueur) {
    return Number(psi) * Number(longueur);
  }

  function calculerLigne(ligne, biblio, incertitude) {
    const valeur = trouverValeur(biblio, ligne.valeurId);
    // Une longueur vide ou négative n'a pas de sens : elle compte pour 0 (signalé « sans longueur »).
    const L = Number(ligne.longueur);
    const longueur = L > 0 ? L : 0;
    if (!valeur) {
      return { ligne: ligne, erreur: "Valeur de ψ introuvable dans le catalogue (supprimée ?)", longueur: longueur, h: 0, hBas: 0, hHaut: 0 };
    }
    const h = deperditionLiaison(valeur.psi, longueur);
    return {
      ligne: ligne,
      valeur: valeur,
      psi: Number(valeur.psi),
      longueur: longueur,
      h: h,
      hBas: h * (1 - incertitude),
      hHaut: h * (1 + incertitude)
    };
  }

  /* ---------- 4. Le bâtiment complet ---------- */

  // Part des ponts thermiques dans le total (entre 0 et 1), ou null si impossible.
  function part(hPonts, hParois) {
    const total = hParois + hPonts;
    if (!(hParois > 0) || !(total > 0)) return null;
    return hPonts / total;
  }

  function calculerProjet(projet, biblio) {
    const reglages = biblio.reglages || {};
    const i = (Number((reglages.incertitude || {}).pct) || 0) / 100;

    const lignes = (projet.lignes || []).map(function (l) { return calculerLigne(l, biblio, i); });
    const somme = function (cle) { return lignes.reduce(function (s, l) { return s + l[cle]; }, 0); };

    const hPonts = { valeur: somme('h'), bas: somme('hBas'), haut: somme('hHaut') };
    const hParois = Number(projet.hParois) || 0;

    // La part la plus basse va avec les ψ bas, la plus haute avec les ψ hauts.
    const partPonts = {
      valeur: part(hPonts.valeur, hParois),
      bas: part(hPonts.bas, hParois),
      haut: part(hPonts.haut, hParois)
    };

    // Points de vigilance : tout ce qui n'est pas encore validé par toi.
    const valeursExemple = lignes.filter(function (l) { return l.valeur && l.valeur.statut !== 'valide'; }).length;
    const lignesErreur = lignes.filter(function (l) { return l.erreur; }).length;
    const lignesSansLongueur = lignes.filter(function (l) { return !l.erreur && !(l.longueur > 0); }).length;
    const reglagesExemple = [reglages.seuils, reglages.incertitude]
      .filter(function (r) { return r && r.statut !== 'valide'; }).length;

    return {
      lignes: lignes,
      hPonts: hPonts,
      hParois: hParois,
      hTotal: { valeur: hParois + hPonts.valeur, bas: hParois + hPonts.bas, haut: hParois + hPonts.haut },
      part: partPonts,
      incertitude: i,
      vigilance: {
        valeursExemple: valeursExemple,
        lignesErreur: lignesErreur,
        lignesSansLongueur: lignesSansLongueur,
        sansParois: !(hParois > 0),
        reglagesExemple: reglagesExemple
      }
    };
  }

  /* ---------- 5. Arrondi d'affichage ----------
     Le calcul garde tous les chiffres ; on arrondit seulement ce qu'on montre. */
  function arrondir(valeur, pas) {
    const p = Number(pas);
    if (!p || p <= 0) return valeur;
    return Math.round(valeur / p) * p;
  }

  const PontsCalcul = {
    trouverValeur: trouverValeur,
    variantes: variantes,
    niveauPsi: niveauPsi,
    deperditionLiaison: deperditionLiaison,
    calculerLigne: calculerLigne,
    part: part,
    calculerProjet: calculerProjet,
    arrondir: arrondir
  };

  global.PontsCalcul = PontsCalcul;
  if (typeof module !== "undefined" && module.exports) module.exports = PontsCalcul;
})(typeof window !== "undefined" ? window : globalThis);
