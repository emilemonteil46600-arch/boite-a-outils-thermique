/* ==========================================================
   CHIFFRAGE — EXERCICES « TESTE-TOI »
   ----------------------------------------------------------
   Des valeurs tirées au hasard ; la bonne réponse est toujours
   calculée par ChiffrageCalcul (calcul.js).
   ========================================================== */
(function (global) {
  'use strict';

  const C = global.ChiffrageCalcul;
  const EX = global.CHIFFRAGE_EXEMPLE;
  const BAO = global.BAO;
  const nb = BAO.nombre;
  const choisir = function (h, liste) { return liste[Math.floor(h() * liste.length)]; };

  // Mélange une liste (pour que la bonne réponse ne soit pas toujours en premier).
  function melanger(h, liste) {
    const t = liste.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(h() * (i + 1));
      const x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  }

  const ChiffrageExercices = [
    {
      titre: 'Actualiser un prix avec le BT01',
      generer: function (h) {
        const prix = BAO.tirer(h, 50, 500, 5);
        const ref = BAO.tirer(h, 125, 135, 0.1);
        const actuel = BAO.tirer(h, 136, 142, 0.1);
        const a = C.coefActualisation('2025-01', { '2025-01': ref, '2026-08': actuel });
        const reponse = prix * a.coef;
        return {
          type: 'nombre', unite: '€ HT', tolerance: Math.max(0.5, reponse * 0.005), decimales: 2, reponse: reponse,
          enonce: 'Un prix de <b>' + nb(prix) + ' € HT</b> date de janv. 2025 (BT01 = <b>' + nb(ref, 1) + '</b>). Le dernier BT01 connu vaut <b>' + nb(actuel, 1) + '</b>. Quel est le prix actualisé ?',
          correction: 'Coef. = BT01 actuel / BT01 du prix = ' + nb(actuel, 1) + ' / ' + nb(ref, 1) + ' = ' + nb(a.coef, 4) + '\n' +
            'Prix actualisé = ' + nb(prix) + ' × ' + nb(a.coef, 4) + ' = ' + nb(reponse, 2) + ' € HT'
        };
      }
    },
    {
      titre: 'Coût d\'un poste avec les coefficients',
      generer: function (h) {
        const q = BAO.tirer(h, 50, 500, 10);
        const pu = BAO.tirer(h, 30, 300, 5);
        const cplx = choisir(h, EX.complexite);
        const occupe = h() < 0.5;
        const coefSite = occupe ? Number(EX.siteOccupe.coef) : 1;
        const biblio = { ratios: [{ id: 'r', prixBas: pu, prixHaut: pu, dateRef: '' }] };
        const ligne = C.calculerLigne({ ratioId: 'r', quantite: q }, biblio, { produit: Number(cplx.coef) * coefSite }, {});
        const reponse = ligne.totalBas;
        return {
          type: 'nombre', unite: '€ HT', tolerance: Math.max(5, reponse * 0.005), reponse: reponse,
          enonce: '<b>' + nb(q) + ' m²</b> à <b>' + nb(pu) + ' € HT/m²</b> (prix déjà actualisé), complexité <b>' + cplx.niveau + '</b> (×' + nb(Number(cplx.coef), 2) + '), ' +
            (occupe ? '<b>site occupé</b> (×' + nb(coefSite, 2) + ')' : 'site <b>libre</b>') + ', bâtiment tertiaire (×1,00). Combien coûte le poste ?',
          correction: 'Coût = quantité × prix × coef. complexité × coef. site\n' +
            '     = ' + nb(q) + ' × ' + nb(pu) + ' × ' + nb(Number(cplx.coef), 2) + ' × ' + nb(coefSite, 2) + ' = ' + nb(reponse) + ' € HT'
        };
      }
    },
    {
      titre: 'Temps de retour brut',
      generer: function (h) {
        const cout = BAO.tirer(h, 10000, 200000, 1000);
        const avant = BAO.tirer(h, 50000, 200000, 5000);
        const pct = BAO.tirer(h, 10, 50, 5);
        const apres = avant * (1 - pct / 100);
        const prix = BAO.tirer(h, 0.08, 0.25, 0.01);
        const g = C.gainsScenario({ gaz: avant }, { gaz: apres }, { gaz: prix });
        const reponse = C.tempsDeRetour(cout, g.gainEuros);
        return {
          type: 'nombre', unite: 'ans', tolerance: 0.3, decimales: 1, reponse: reponse,
          enonce: 'Travaux à <b>' + nb(cout) + ' € TTC</b>. Le gaz passe de <b>' + nb(avant) + '</b> à <b>' + nb(apres) + ' kWh/an</b>, à <b>' + nb(prix, 2) + ' € TTC/kWh</b>. Quel est le temps de retour brut ?',
          correction: 'Gain            = ' + nb(avant) + ' − ' + nb(apres) + ' = ' + nb(g.gainKwh) + ' kWh/an\n' +
            'Économie        = ' + nb(g.gainKwh) + ' × ' + nb(prix, 2) + ' = ' + nb(g.gainEuros) + ' €/an\n' +
            'Temps de retour = ' + nb(cout) + ' / ' + nb(g.gainEuros) + ' = ' + nb(reponse, 1) + ' ans'
        };
      }
    },
    {
      titre: 'Les scénarios s\'additionnent-ils ?',
      generer: function (h) {
        const a = BAO.tirer(h, 30, 90, 5);
        const b = a + BAO.tirer(h, 20, 80, 5);
        const choix = melanger(h, [nb(b) + ' k€', nb(a + b) + ' k€', nb(b - a) + ' k€']);
        return {
          type: 'choix', choix: choix, bonne: choix.indexOf(nb(b) + ' k€'),
          enonce: 'Scénario 1 (enveloppe) : <b>' + nb(a) + ' k€</b>. Scénario 2 (enveloppe + PAC) : <b>' + nb(b) + ' k€</b>. Le client choisit le scénario 2. Combien coûtent ses travaux ?',
          correction: 'Les scénarios sont des ALTERNATIVES : le scénario 2 contient déjà l\'enveloppe du scénario 1.\n' +
            'On ne les additionne pas : le client paie ' + nb(b) + ' k€.'
        };
      }
    }
  ];

  global.ChiffrageExercices = ChiffrageExercices;
  if (typeof module !== 'undefined' && module.exports) module.exports = ChiffrageExercices;
})(typeof window !== 'undefined' ? window : globalThis);
