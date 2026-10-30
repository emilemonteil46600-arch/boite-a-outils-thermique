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
  donnees/                   données PUBLIQUES (exemples, indice BT01, bâtiment et prix d'énergie d'exemple)
  outils/batiment/           DOSSIER BÂTIMENT partagé : climat (DJU, T base), chauffage, consommations de l'état
                             initial, prix des énergies. Son calcul.js (W/K → kWh → €, puissance) est utilisé par
                             les autres outils ; ils lisent le bâtiment en cours via BAO.lireBatiment / BAO.lireEnergies.
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
  `bao.ponts.projet.v1`, `bao.ponts.projets.v1`, `bao.ponts.onglet`, pour le dossier bâtiment `bao.batiment.v1`,
  `bao.batiments.v1`, `bao.energies.v1`, `bao.batiment.onglet`. Suivi des sauvegardes : `bao.sauvegarde.v1`.
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
   - chiffrage, gains : même ITE, MOE 10 %, aléas 5 %, TVA 20 % ; gaz 150 000 → 120 000 kWh/an à 0,11 €/kWh
     → **3 300 € TTC/an**, coût TTC 66 368 – 105 083 € → temps de retour brut **20 – 32 ans** ;
   - ponts thermiques : ITI, 0,90 × 60 m + 0,70 × 20 m + 0,10 × 80 m = **76 W/K** ; Σ U × A = 320 W/K → part **19 %**,
     fourchette ± 20 % → **16 – 22 %** ; après ITE 11 %, ITE + retour d'isolant 6 % ;
   - dossier bâtiment : 76 W/K × DJU 2 000 × 24 / 1000 = **3 648 kWh/an** → / 0,85 = 4 292 kWh de gaz → × 0,11 ≈ **472 €/an** ;
     P = 76 × (19 − (−7)) = 1 976 W ; 1 W/K ≈ **6,21 €/an** ; après ITE (39 W/K) ≈ 242 €/an.
2. `node tests/navigateur.js` : pages sans erreur console, pas de défilement horizontal à 390 px (clair et sombre),
   exemples affichés à l'écran, sauvegarde complète et restauration.
3. Si un exemple de Méthode change, mettre à jour **en même temps** le texte de la Méthode, le test et ce fichier.

## État au 29/10/2026

| Outil | État |
|---|---|
| Chiffrage des préconisations | **V1 en ligne + lot 2.** 21 ratios d'exemple, coefficients type de bâtiment / complexité 1-4 / site occupé, actualisation BT01, MOE + aléas + TVA, chiffrages enregistrés. **Scénarios** (alternatives, chacun ses postes, dupliquer), **gains énergie par énergie** (avant = dossier bâtiment, après = STD ; gaz → PAC géré), économie €/an, **temps de retour brut** en fourchette (base TTC ou HT selon les prix), comparaison des scénarios, **fiche Word du scénario**, export CSV. Un ancien chiffrage sans scénario est repris dans « Scénario 1 ». |
| Dossier bâtiment | **Lot 2.** Bâtiment en cours partagé : surface, DJU, T intérieure, T de base, énergie + rendement du chauffage, consommations de l'état initial (chaque valeur avec source et statut), prix des énergies (Données), bâtiments enregistrés, « ce que coûte 1 W/K ici ». |
| Ponts thermiques ψ | **V1 en ligne + lot 2 (kWh/an, €/an, puissance via le dossier bâtiment).** 5 liaisons × ITI/ITE/ITR + variantes traitées (rupteur, retour d'isolant, soubassement, acrotère isolé), 21 ψ d'exemple « esprit Th-Bât » à vérifier, schéma SVG avec flux (`schemas.js`), explication du pourquoi, Σ ψ × L et part dans Σ U×A + Σ ψ×L (saisi), fourchette ± 20 % (H), variantes perso, calculs enregistrés, export Word / CSV / JSON. |
| Commun (lot 1 « solide ») | Sauvegarde complète + restauration + rappel, avertissement « un stockage par adresse / appareil », tests Node + vérification GitHub, code d'interface mis en commun dans `BAO`, quantités et longueurs négatives refusées, noms de fichiers sans accents, Méthodes en sections repliables. |
| Confort d'été et inertie | À faire. Classe d'inertie, déphasage et amortissement des parois (ISO 13786), position de la masse, facteur solaire vitrages + protections, effet du brassage d'air. Émile a fait son travail de fin de BUT sur le confort d'été en STD Pléiades. |

**Prochaine étape côté Émile :** remplacer les ratios d'exemple par ses vraies sources (devis, DPGF),
en commençant par les 5 postes qu'il chiffre le plus souvent.

**Feuille de route proposée (29/10/2026)** — lots 1 « solide » et 2 « utile pour les rapports » faits ; ensuite au choix d'Émile :
- Lot 3 « comprendre » : schémas interactifs, exercices « Teste-toi », lexique, risque de condensation (fRsi).
- Lot 4 : calcul 2D aux différences finies dans le navigateur, validé sur les cas de NF EN ISO 10211.

## Projet « Audit flash » (idée validée par Émile le 30/10/2026, pas commencé)

**But** : un pré-diagnostic en 5 minutes. On clique sur un bâtiment sur une carte, on répond à 6 à 10 questions,
et en quelques secondes on sait à peu près combien il consomme, ce qui vaut le coup et ce qui ne vaut pas le coup
(« la toiture oui, le vitrage non, déjà du double vitrage »).

**Pour qui, pour quoi** (réponses d'Émile) :
- Bâtiments : **tertiaire, public et logement**.
- Usages : **répondre vite à un client ou à un devis**, et **préparer une visite**.
- Utilisateurs : Émile, quelqu'un qui l'aide, peut-être un client → prévoir à terme un mode « client » simplifié.
- Sans réseau : pas tranché → en ligne d'abord, avec un mode « saisie sans carte » pour le calcul.
- **IA d'analyse des photos : pas pour l'instant** (choix d'Émile). Google Maps / Street View : écarté
  (clé payante, conditions qui interdisent d'extraire les images).

**Ce que l'outil doit faire** :
- Carte : adresse ou clic → contour du bâtiment, **surface approximative** (surface au sol × niveaux, hauteur / ~3 m (H)),
  bâtiment **en 3D** si possible. Pistes (H, à vérifier) : MapLibre GL JS (sans npm), fond IGN Géoplateforme ou
  OpenStreetMap, hauteurs IGN BD TOPO ou BDNB, photo aérienne IGN, photos de rue Panoramax.
- Pré-remplissage (H, à tester) : Base Adresse Nationale, BDNB du CSTB (année, usage, matériaux, énergie), DPE ADEME.
- Questions rapides : type de mur, de vitrage, de chauffage, de rafraîchissement, d'ECS, nombre d'occupants…
- **Calcul même s'il manque des paramètres** : chaque valeur manquante est déduite de l'année et de l'usage
  (logement : valeurs par défaut de la méthode DPE 3CL ; tertiaire : ratios par usage à sourcer). Chaque valeur
  affiche son origine (saisie / carte-BDNB / déduite de l'année). Plus il manque d'infos, plus la fourchette s'élargit,
  avec un indicateur de fiabilité.
- **Avec ou sans factures** : sans factures, une estimation en fourchette ; avec factures, le modèle est **calé** dessus
  (coefficient facture / calcul) et les gains sont calculés sur le modèle calé.
- Préconisations : gain de chaque action et de chaque bouquet (gains non additifs : calcul dans l'ordre), coût
  (ratios du chiffrage), **temps de retour brut et actualisé** (inflation de l'énergie + taux d'actualisation (H),
  dans Données), comparaison à la durée de vie → ✅ à faire / 🟠 à discuter / ❌ pas rentable.
- Sortie : fiche d'une page pour Word, et un bouton « approfondir » qui envoie tout vers le dossier bâtiment et le chiffrage.
- Toujours afficher « pré-diagnostic, ordre de grandeur, pas un audit réglementaire ».

**Ordre décidé** : 1) **carte d'abord** (test de faisabilité des données publiques depuis une page web, puis carte 2D
+ clic + surface + pré-remplissage) ; 2) le moteur de calcul (questions, valeurs par défaut, calage factures,
préconisations, temps de retour) ; 3) la 3D et les photos ; 4) le mode client. L'IA photo est mise de côté.

**Points d'attention** : la carte et les données publiques demandent Internet (exception à la règle « marche en
file:// sans réseau », à garder pour la partie calcul) ; l'adresse part vers des services publics (jamais le nom du
client) ; conditions d'utilisation de chaque service à vérifier ; garder la règle « pas de boîte noire » : chaque
chiffre doit pouvoir s'expliquer.

**Pistes après le lot 2 (H)** : CO₂ évité (facteurs d'émission par énergie) ; aides (CEE) ; énergie primaire / étiquette DPE ;
durée de vie et coût global (VAN) en plus du temps de retour brut.

**Pistes V2 du chiffrage (H)** : coefficients par catégorie de poste ; prix dégressifs selon la quantité ;
indice BT par corps d'état (BT40 chauffage, BT41 ventilation, BT47 électricité, BT50 rénovation — à vérifier) ;
coefficient géographique ; récupération automatique du dernier BT01.

## Mettre à jour l'indice BT01

Ajouter le mois dans `donnees/bt01.js` (source : INSEE, repris par l'ANIL :
https://www.anil.org/outils/indices-et-plafonds/indice-bt-01). Publication au JO environ 2 mois et demi
après le mois concerné.
