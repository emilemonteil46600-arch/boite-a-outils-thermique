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
  commun/commun.js           fonctions partagées (objet global BAO) : stockage + suivi des sauvegardes,
                             sauvegarde complète / restauration, nombres FR, onglets, sections repliables,
                             exports Word / CSV / JSON, badges exemple/validé, calculs enregistrés
  donnees/                   données PUBLIQUES (exemples, indice BT01)
  outils/<outil>/index.html  page de l'outil
  outils/<outil>/calcul.js   TOUTE la logique de calcul, fonctions pures, commentées en français
  outils/<outil>/interface.js affichage et événements, AUCUN calcul
  outils/<outil>/schemas.js  (si besoin) dessins SVG, AUCUN calcul
  tests/*.test.js            tests Node (node --test) : syntaxe, exemples des Méthodes, données publiques
  tests/navigateur.js        vérification dans Chromium (Playwright), lancée à la main
  .github/workflows/         lance node --test à chaque PR et à chaque mise à jour de main
  ```
- Avant d'écrire une fonction d'interface, regarder si `BAO` l'a déjà (badges, exports, calculs enregistrés…) :
  le code commun évite que les outils divergent.
- `calcul.js` doit rester lisible par un thermicien : fonctions courtes, noms en français,
  la formule écrite en commentaire en haut du fichier. Il s'exporte aussi en `module.exports` pour les tests Node.
- Tout en **français** : interface (tutoiement), commentaires, messages de commit.
- Nombres au format français (virgule décimale, espace des milliers) via `BAO.nombre` / `BAO.lireNombre`.
- Mobile : aucune barre de défilement horizontale de la page à 390 px de large.
- Thème clair et sombre via les variables CSS de `commun/style.css`.

## Confidentialité — IMPORTANT

- Le dépôt est **public**. Ne jamais y mettre de vrais prix, de données clients ou de noms de dossiers
  d'Argetec. Seulement des valeurs d'exemple marquées comme telles.
- Les vraies données d'Émile vivent dans le `localStorage` de son navigateur. Elles sont protégées par la
  **sauvegarde complète** (accueil › Mes données, fichier JSON de toute la boîte à outils) et par un rappel
  en haut des pages si des données modifiées ne sont pas sauvegardées depuis 14 jours (H).
  Attention : le site en ligne, un fichier ouvert en file://, un autre navigateur ou le téléphone ont chacun
  leur propre stockage. On passe de l'un à l'autre par sauvegarde complète puis restauration.
- **Ne jamais renommer les clés localStorage existantes** sans migration automatique, sinon Émile perd
  ses ratios : `bao.chiffrage.biblio.v1`, `bao.chiffrage.projet.v1`, `bao.chiffrage.projets.v1`,
  `bao.bt01.perso.v1`, `bao.chiffrage.onglet`, et pour les ponts thermiques `bao.ponts.biblio.v1`,
  `bao.ponts.projet.v1`, `bao.ponts.projets.v1`, `bao.ponts.onglet`. Suivi des sauvegardes : `bao.sauvegarde.v1`.
- Toute **nouvelle** clé de données d'un outil doit être ajoutée à `BAO.CLES_DONNEES` (`commun/commun.js`),
  sinon elle n'entre pas dans la sauvegarde complète. Le test `tests/commun.test.js` vérifie la liste.

## Comment travailler avec Émile

- Il dicte souvent à la voix : messages avec fautes et mots coupés, à interpréter sans le faire remarquer.
- Réponses directes, sans jargon, visuelles (tableaux, listes courtes) plutôt que des pavés.
- Hypothèses marquées (H). Toutes les questions regroupées en un seul message, avec des options.
- Il préfère des livrables complets et des modifications ciblées qui respectent l'existant.
- Lui expliquer le **pourquoi** des formules : il veut progresser, pas seulement recevoir un outil.

## Vérifications avant de publier

1. `node --test` à la racine : syntaxe de chaque `.js`, scripts des pages existants, 3 onglets par outil,
   exemples des Méthodes, cohérence des données publiques, clés de sauvegarde. Les mêmes tests tournent sur GitHub
   à chaque PR (workflow « Vérifications »). Les exemples vérifiés :
   - chiffrage : ITE sous enduit, 300 m², 120–190 €/m² (janv. 2025), tertiaire, complexité 3, site occupé,
     BT01 août 2026 = 139,4 → **48 100 – 76 100 € HT** (arrondi 100 €) ;
   - ponts thermiques : ITI, 0,90 × 60 m + 0,70 × 20 m + 0,10 × 80 m = **76 W/K** ; Σ U × A = 320 W/K → part **19 %**,
     fourchette ± 20 % → **16 – 22 %** ; après ITE 11 %, ITE + retour d'isolant 6 %.
2. `node tests/navigateur.js` : pages sans erreur console, pas de défilement horizontal à 390 px (clair et sombre),
   exemples affichés à l'écran, sauvegarde complète et restauration.
3. Si un exemple de Méthode change, mettre à jour **en même temps** le texte de la Méthode, le test et ce fichier.

## État au 29/10/2026

| Outil | État |
|---|---|
| Chiffrage des préconisations | **V1 en ligne.** 21 ratios d'exemple, coefficients type de bâtiment / complexité 1-4 / site occupé, actualisation BT01, MOE + aléas + TVA, export Word / CSV / impression, chiffrages enregistrés. |
| Ponts thermiques ψ | **V1 en ligne.** 5 liaisons × ITI/ITE/ITR + variantes traitées (rupteur, retour d'isolant, soubassement, acrotère isolé), 21 ψ d'exemple « esprit Th-Bât » à vérifier, schéma SVG avec flux (`schemas.js`), explication du pourquoi, Σ ψ × L et part dans Σ U×A + Σ ψ×L (saisi), fourchette ± 20 % (H), variantes perso, calculs enregistrés, export Word / CSV / JSON. |
| Commun (lot 1 « solide ») | Sauvegarde complète + restauration + rappel, avertissement « un stockage par adresse / appareil », tests Node + vérification GitHub, code d'interface mis en commun dans `BAO`, quantités et longueurs négatives refusées, noms de fichiers sans accents, Méthodes en sections repliables. |
| Confort d'été et inertie | À faire. Classe d'inertie, déphasage et amortissement des parois (ISO 13786), position de la masse, facteur solaire vitrages + protections, effet du brassage d'air. Émile a fait son travail de fin de BUT sur le confort d'été en STD Pléiades. |

**Prochaine étape côté Émile :** remplacer les ratios d'exemple par ses vraies sources (devis, DPGF),
en commençant par les 5 postes qu'il chiffre le plus souvent.

**Feuille de route proposée (29/10/2026)** — lot 1 « solide » fait ; ensuite au choix d'Émile :
- Lot 2 « utile pour les rapports » : scénarios + gains (kWh, €, temps de retour) dans le chiffrage ;
  W/K → kWh/an → €/an (DJU) pour les ponts thermiques ; dossier bâtiment commun aux outils ; fiche Word.
- Lot 3 « comprendre » : schémas interactifs, exercices « Teste-toi », lexique, risque de condensation (fRsi).
- Lot 4 : calcul 2D aux différences finies dans le navigateur, validé sur les cas de NF EN ISO 10211.

**Pistes V2 du chiffrage (H)** : coefficients par catégorie de poste ; prix dégressifs selon la quantité ;
indice BT par corps d'état (BT40 chauffage, BT41 ventilation, BT47 électricité, BT50 rénovation — à vérifier) ;
coefficient géographique ; récupération automatique du dernier BT01.

## Mettre à jour l'indice BT01

Ajouter le mois dans `donnees/bt01.js` (source : INSEE, repris par l'ANIL :
https://www.anil.org/outils/indices-et-plafonds/indice-bt-01). Publication au JO environ 2 mois et demi
après le mois concerné.
