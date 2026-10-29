# Boîte à outils thermique

Petits outils de calcul pour l'audit énergétique des bâtiments.
Chaque outil montre ses formules, ses hypothèses et ses sources : pas de boîte noire.

## Outils

| Outil | État | Ce qu'il fait |
|---|---|---|
| [Chiffrage des préconisations](outils/chiffrage/) | V1 | Coût des travaux à partir de ratios personnels, ajustés au bâtiment et actualisés avec l'indice BT01 |
| [Ponts thermiques ψ](outils/ponts-thermiques/) | V1 | Catalogue de liaisons selon la position de l'isolant (ITI, ITE, ITR), schémas, part des ponts thermiques dans les déperditions |
| Confort d'été et inertie | à venir | Inertie, déphasage, protections solaires, brassage d'air |

## Principes

- **Calcul · Méthode · Données** : trois onglets dans chaque outil.
- **Aucun chiffre sans source** : chaque ratio a une source, une date et un statut (exemple / validé).
- **Hypothèses marquées (H)** dans l'onglet Méthode.
- **Données personnelles en local** : les ratios réels restent dans le navigateur (export / import JSON). Ce dépôt ne contient que des valeurs d'exemple.

## Organisation du code

```
index.html                  accueil
commun/                     style et fonctions partagés (sauvegarde, exports, onglets…)
donnees/                    données publiques (exemples, indice BT01)
tests/                      tests des calculs et du site
outils/<outil>/
    index.html              page de l'outil
    calcul.js               toute la logique de calcul, commentée
    interface.js            affichage et boutons (aucun calcul)
```

HTML, CSS et JavaScript simples, sans framework ni étape de compilation.
Pour l'utiliser en local : ouvrir `index.html` dans un navigateur.

## Sauvegarder ses données

Page d'accueil › **Mes données** › « Télécharger une sauvegarde complète » : un seul fichier JSON avec
tous les ratios, valeurs de ψ et calculs enregistrés. « Restaurer une sauvegarde » les remet sur un autre
appareil ou un autre navigateur (chacun a son propre stockage).

## Tests

```
node --test                 # syntaxe, exemples des onglets Méthode, données publiques
node tests/navigateur.js    # vérification dans Chromium (nécessite Playwright)
```

Les tests `node --test` tournent aussi sur GitHub à chaque PR (onglet *Actions*).

## Mettre à jour l'indice BT01

Ajouter le nouveau mois dans `donnees/bt01.js` (valeur publiée chaque mois par l'INSEE au Journal officiel),
ou directement dans l'outil, onglet **Données**.
