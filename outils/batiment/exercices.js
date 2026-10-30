/* ==========================================================
   DOSSIER BÂTIMENT — EXERCICES « TESTE-TOI »
   ----------------------------------------------------------
   Des valeurs tirées au hasard ; la bonne réponse est toujours
   calculée par BatimentCalcul (calcul.js).
   ========================================================== */
(function (global) {
  'use strict';

  const C = global.BatimentCalcul;
  const BAO = global.BAO;
  const nb = BAO.nombre;
  const choisir = function (h, liste) { return liste[Math.floor(h() * liste.length)]; };
  // Tolérance : 1 % de la réponse (au moins 1 unité).
  const unPourCent = function (v) { return Math.max(1, Math.abs(v) * 0.01); };

  const QUESTIONS = [
    {
      enonce: 'Le même bâtiment, dans un lieu deux fois plus froid (DJU doublé). Son besoin de chauffage…',
      choix: ['double', 'ne change pas', 'est multiplié par 4'], bonne: 0,
      correction: 'Besoin = H × DJU × 24 / 1000 : le besoin est proportionnel au DJU.\nDJU × 2 → besoin × 2.'
    },
    {
      enonce: 'Le rendement global passe de 80 % à 100 % (même besoin). L\'énergie achetée…',
      choix: ['baisse de 20 %', 'baisse de 25 %', 'ne change pas'], bonne: 0,
      correction: 'Énergie finale = besoin / rendement.\nAvant : besoin / 0,80 = 1,25 × besoin ; après : besoin / 1,00 = 1,00 × besoin.\n1,00 / 1,25 = 0,80 → baisse de 20 %.'
    },
    {
      enonce: 'Pour dimensionner la puissance du chauffage, on utilise…',
      choix: ['la température de base', 'les DJU', 'le prix de l\'énergie'], bonne: 0,
      correction: 'P = H × (T intérieure − T de base) : la puissance se calcule au jour le plus froid.\nLes DJU servent à la consommation sur l\'année, pas au dimensionnement.'
    }
  ];

  const BatimentExercices = [
    {
      titre: 'Besoin de chauffage (méthode des DJU)',
      generer: function (h) {
        const H = BAO.tirer(h, 20, 400, 5);
        const dju = BAO.tirer(h, 1400, 3000, 50);
        const reponse = C.besoinAnnuel(H, dju);
        return {
          type: 'nombre', unite: 'kWh/an', tolerance: unPourCent(reponse), reponse: reponse,
          enonce: 'H = <b>' + nb(H) + ' W/K</b>, DJU = <b>' + nb(dju) + '</b>. Quel est le besoin de chauffage sur une année ?',
          correction: 'Besoin = H × DJU × 24 / 1000\n       = ' + nb(H) + ' × ' + nb(dju) + ' × 24 / 1000 = ' + nb(reponse) + ' kWh/an'
        };
      }
    },
    {
      titre: 'Du besoin à la facture',
      generer: function (h) {
        const besoin = BAO.tirer(h, 2000, 60000, 500);
        const rendement = BAO.tirer(h, 70, 95, 5);
        const prix = BAO.tirer(h, 0.08, 0.25, 0.01);
        const finale = C.energieFinale(besoin, rendement);
        const reponse = C.cout(finale, prix);
        return {
          type: 'nombre', unite: '€/an', tolerance: unPourCent(reponse), reponse: reponse,
          enonce: 'Besoin = <b>' + nb(besoin) + ' kWh/an</b>, rendement global <b>' + nb(rendement) + ' %</b>, énergie à <b>' + nb(prix, 2) + ' €/kWh</b>. Combien coûte le chauffage par an ?',
          correction: 'Énergie finale = besoin / rendement = ' + nb(besoin) + ' / ' + nb(rendement / 100, 2) + ' = ' + nb(finale) + ' kWh\n' +
            'Coût           = ' + nb(finale) + ' × ' + nb(prix, 2) + ' = ' + nb(reponse) + ' €/an'
        };
      }
    },
    {
      titre: 'Puissance au jour le plus froid',
      generer: function (h) {
        const H = BAO.tirer(h, 20, 400, 5);
        const ti = BAO.tirer(h, 19, 21, 1);
        const tbase = BAO.tirer(h, -15, -2, 1);
        const reponse = C.puissance(H, ti, tbase);
        return {
          type: 'nombre', unite: 'W', tolerance: unPourCent(reponse), reponse: reponse,
          enonce: 'H = <b>' + nb(H) + ' W/K</b>, <b>' + nb(ti) + ' °C</b> à l\'intérieur, température de base <b>' + nb(tbase) + ' °C</b>. Quelle puissance faut-il pour compenser ces déperditions ?',
          correction: 'P = H × (Ti − T base) = ' + nb(H) + ' × (' + nb(ti) + ' − (' + nb(tbase) + ')) = ' + nb(H) + ' × ' + nb(ti - tbase) +
            ' = ' + nb(reponse) + ' W ≈ ' + nb(reponse / 1000, 1) + ' kW'
        };
      }
    },
    {
      titre: 'Question de cours',
      generer: function (h) {
        return Object.assign({ type: 'choix' }, choisir(h, QUESTIONS));
      }
    }
  ];

  global.BatimentExercices = BatimentExercices;
  if (typeof module !== 'undefined' && module.exports) module.exports = BatimentExercices;
})(typeof window !== 'undefined' ? window : globalThis);
