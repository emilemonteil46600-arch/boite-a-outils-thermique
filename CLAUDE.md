# CLAUDE.md — Boîte à outils thermique

Ce fichier est lu automatiquement par Claude au début de chaque session sur ce dépôt.
Il remplace le contexte de la conversation d'origine (29/10/2026) : tout ce qu'il faut savoir est ici.

## Le projet

Boîte à outils personnelle d'**Émile**, apprenti ingénieur thermicien en bureau d'études
(audits énergétiques de bâtiments tertiaires et publics, STD Pléiades, déperditions, RE2020).

- Site en ligne : https://emilemonteil46600-arch.github.io/boite-a-outils-thermique/
- Publié par GitHub Pages depuis la branche `main`, dossier racine. Toute modification sur `main`
  met le site à jour en 1 à 2 minutes, au même lien.

**Le but n'est pas d'avoir des outils, c'est qu'Émile comprenne ses calculs.** Chaque outil doit pouvoir
être expliqué ligne par ligne par Émile devant un client ou un jury. Pas de boîte noire.

## Règles de fond (à respecter dans chaque outil)

1. **Trois onglets : Calcul · Méthode · Données.**
   - Calcul : saisie + résultat + détail de chaque étape intermédiaire.
   - Méthode : formules, norme d'origine, exemple refait à la main, limites marquées **(H)**.
   - Données : toutes les valeurs modifiables par Émile.
2. **Aucun chiffre sans source.** Chaque valeur a une source, une date et un statut `exemple` / `valide`.
   Tant qu'une valeur utilisée est en `exemple`, l'outil affiche un avertissement.
3. **Hypothèses marquées (H)**, jamais cachées.
4. **Fourchettes plutôt que fausse précision** ; on arrondit l'affichage, jamais le calcul.

## Règles techniques

- HTML, CSS et JavaScript **purs**. Pas de framework, pas de npm, pas d'étape de compilation.
  Le site doit marcher en ouvrant `index.html` directement (file://) : les données sont des fichiers `.js`
  qui remplissent une variable globale (`window.X = {...}`), pas des `.json` chargés par fetch.
- Structure :
  ```
  index.html                 accueil (cartes des outils)
  commun/style.css           style partagé (variables de couleur, clair/sombre)
  commun/commun.js           fonctions partagées (objet global BAO : sauvegarde, nombres FR, onglets, exports)
  donnees/                   données PUBLIQUES (exemples, indice BT01)
  outils/<outil>/index.html  page de l'outil
  outils/<outil>/calcul.js   TOUTE la logique de calcul, fonctions pures, commentées en français
  outils/<outil>/interface.js affichage et événements, AUCUN calcul
  ```
- `calcul.js` doit rester lisible par un thermicien : fonctions courtes, noms en français,
  la formule écrite en commentaire en haut du fichier. Il s'exporte aussi en `module.exports` pour les tests Node.
- Tout en **français** : interface (tutoiement), commentaires, messages de commit.
- Nombres au format français (virgule décimale, espace des milliers) via `BAO.nombre` / `BAO.lireNombre`.
- Mobile : aucune barre de défilement horizontale de la page à 390 px de large.
- Thème clair et sombre via les variables CSS de `commun/style.css`.

## Confidentialité — IMPORTANT

- Le dépôt est **public**. Ne jamais y mettre de vrais prix, de données clients ou de noms de dossiers
  d'Argetec. Seulement des valeurs d'exemple marquées comme telles.
- Les vraies données d'Émile vivent dans le `localStorage` de son navigateur, avec export/import JSON.
- **Ne jamais renommer les clés localStorage existantes** sans migration automatique, sinon Émile perd
  ses ratios : `bao.chiffrage.biblio.v1`, `bao.chiffrage.projet.v1`, `bao.chiffrage.projets.v1`,
  `bao.bt01.perso.v1`, `bao.chiffrage.onglet`, et pour les ponts thermiques `bao.ponts.biblio.v1`,
  `bao.ponts.projet.v1`, `bao.ponts.projets.v1`, `bao.ponts.onglet`.

## Comment travailler avec Émile

- Il dicte souvent à la voix : messages avec fautes et mots coupés, à interpréter sans le faire remarquer.
- Réponses directes, sans jargon, visuelles (tableaux, listes courtes) plutôt que des pavés.
- Hypothèses marquées (H). Toutes les questions regroupées en un seul message, avec des options.
- Il préfère des livrables complets et des modifications ciblées qui respectent l'existant.
- Lui expliquer le **pourquoi** des formules : il veut progresser, pas seulement recevoir un outil.

## Vérifications avant de publier

1. `node --check` sur chaque fichier `.js`.
2. Recalcul de l'exemple de l'onglet Méthode du chiffrage : ITE sous enduit, 300 m², 120–190 €/m² (janv. 2025),
   tertiaire, complexité 3, site occupé, BT01 août 2026 = 139,4 → **48 100 – 76 100 € HT** (arrondi 100 €).
3. Recalcul de l'exemple de l'onglet Méthode des ponts thermiques (valeurs d'exemple) : ITI, plancher intermédiaire
   0,90 × 60 m + refend 0,70 × 20 m + menuiseries 0,10 × 80 m = **76 W/K** ; avec Σ U × A = 320 W/K → part **19 %**,
   fourchette ± 20 % → **16 – 22 %**.
4. Ouverture dans un navigateur sans erreur console (Playwright est disponible), test à 390 px de large.

## État au 29/10/2026

| Outil | État |
|---|---|
| Chiffrage des préconisations | **V1 en ligne.** 21 ratios d'exemple, coefficients type de bâtiment / complexité 1-4 / site occupé, actualisation BT01, MOE + aléas + TVA, export Word / CSV / impression, chiffrages enregistrés. |
| Ponts thermiques ψ | **V1 (PR en cours).** 5 liaisons × ITI/ITE/ITR + variantes traitées (rupteur, retour d'isolant, soubassement, acrotère isolé), 21 ψ d'exemple « esprit Th-Bât » à vérifier, schéma SVG avec flux (`schemas.js`), explication du pourquoi, Σ ψ × L et part dans Σ U×A + Σ ψ×L (saisi), fourchette ± 20 % (H), variantes perso, calculs enregistrés, export Word / CSV / JSON. |
| Confort d'été et inertie | À faire. Classe d'inertie, déphasage et amortissement des parois (ISO 13786), position de la masse, facteur solaire vitrages + protections, effet du brassage d'air. Émile a fait son travail de fin de BUT sur le confort d'été en STD Pléiades. |

**Prochaine étape côté Émile :** remplacer les ratios d'exemple par ses vraies sources (devis, DPGF),
en commençant par les 5 postes qu'il chiffre le plus souvent.

**Pistes V2 du chiffrage (H)** : coefficients par catégorie de poste ; prix dégressifs selon la quantité ;
indice BT par corps d'état (BT40 chauffage, BT41 ventilation, BT47 électricité, BT50 rénovation — à vérifier) ;
coefficient géographique ; récupération automatique du dernier BT01.

## Mettre à jour l'indice BT01

Ajouter le mois dans `donnees/bt01.js` (source : INSEE, repris par l'ANIL :
https://www.anil.org/outils/indices-et-plafonds/indice-bt-01). Publication au JO environ 2 mois et demi
après le mois concerné.
