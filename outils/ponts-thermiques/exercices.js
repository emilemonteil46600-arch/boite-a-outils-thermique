/* ==========================================================
   PONTS THERMIQUES ψ — EXERCICES « TESTE-TOI »
   ----------------------------------------------------------
   Des valeurs tirées au hasard ; la bonne réponse est toujours
   calculée par PontsCalcul (calcul.js) : on ne refait pas les formules ici.
   ========================================================== */
(function (global) {
  'use strict';

  const C = global.PontsCalcul;
  const E = global.PONTS_EXEMPLE;
  const BAO = global.BAO;
  const nb = BAO.nombre;
  const choisir = function (h, liste) { return liste[Math.floor(h() * liste.length)]; };
  const nomLiaison = function (id) { return (E.liaisons.find(function (l) { return l.id === id; }) || {}).nom || id; };

  const PontsExercices = [
    {
      titre: 'Déperdition d\'une liaison (ψ × L)',
      generer: function (h) {
        const v = choisir(h, E.valeurs);
        const L = BAO.tirer(h, 10, 120, 5);
        const reponse = C.deperditionLiaison(v.psi, L);
        return {
          type: 'nombre', unite: 'W/K', tolerance: 0.5, decimales: 1, reponse: reponse,
          enonce: nomLiaison(v.liaison) + ' en ' + v.isolation + ' (' + v.nomVariante.toLowerCase() + ') : ψ = <b>' + nb(v.psi, 2) +
            ' W/(m·K)</b>, longueur <b>' + nb(L) + ' m</b>. Combien vaut ψ × L ?',
          correction: 'ψ × L = ' + nb(v.psi, 2) + ' × ' + nb(L) + ' = ' + nb(reponse, 1) + ' W/K\n' +
            '→ ' + nb(reponse, 1) + ' W perdus en plus pour chaque degré d\'écart entre dedans et dehors.'
        };
      }
    },
    {
      titre: 'Part des ponts thermiques',
      generer: function (h) {
        const ponts = BAO.tirer(h, 20, 150, 5);
        const parois = BAO.tirer(h, 150, 800, 10);
        const reponse = C.part(ponts, parois) * 100;
        return {
          type: 'nombre', unite: '%', tolerance: 0.5, decimales: 0, reponse: reponse,
          enonce: 'Σ ψ × L = <b>' + nb(ponts) + ' W/K</b> et Σ U × A = <b>' + nb(parois) + ' W/K</b>. Quelle est la part des ponts thermiques dans les déperditions (parois + ponts) ?',
          correction: 'Part = Σ ψ × L / (Σ U × A + Σ ψ × L)\n' +
            '     = ' + nb(ponts) + ' / (' + nb(parois) + ' + ' + nb(ponts) + ') = ' + nb(ponts) + ' / ' + nb(parois + ponts) + ' = ' + nb(reponse, 1) + ' %'
        };
      }
    },
    {
      titre: 'Température de la paroi (fRsi)',
      generer: function (h) {
        const f = BAO.tirer(h, 0.60, 0.95, 0.01);
        const ti = BAO.tirer(h, 18, 21, 1);
        const te = BAO.tirer(h, -10, 5, 1);
        const reponse = C.temperatureSurface(f, ti, te);
        const moisi = C.temperatureMoisissure(ti, 50);
        return {
          type: 'nombre', unite: '°C', tolerance: 0.15, decimales: 1, reponse: reponse,
          enonce: 'fRsi = <b>' + nb(f, 2) + '</b>, air intérieur à <b>' + nb(ti) + ' °C</b>, <b>' + nb(te) + ' °C</b> dehors. Quelle est la température de la paroi côté pièce au droit de la liaison ?',
          correction: 'θ paroi = θe + fRsi × (θi − θe)\n' +
            '        = ' + nb(te) + ' + ' + nb(f, 2) + ' × (' + nb(ti) + ' − (' + nb(te) + ')) = ' + nb(te) + ' + ' + nb(f, 2) + ' × ' + nb(ti - te) +
            ' = ' + nb(reponse, 1) + ' °C\n' +
            'Avec 50 % d\'humidité, les moisissures commencent sous ' + nb(moisi, 1) + ' °C → ' +
            (reponse > moisi ? 'pas de risque.' : 'risque de moisissures.')
        };
      }
    },
    {
      titre: 'Quelle position de l\'isolant ?',
      generer: function (h) {
        // Seulement les liaisons où une seule position est la meilleure (pas d'égalité).
        const standard = function (liaison, iso) {
          return E.valeurs.find(function (v) { return v.liaison === liaison && v.isolation === iso && v.variante === 'standard'; });
        };
        const isolations = ['ITI', 'ITE', 'ITR'];
        const candidates = E.liaisons.filter(function (l) {
          const psis = isolations.map(function (i) { return standard(l.id, i).psi; });
          const min = Math.min.apply(null, psis);
          return psis.filter(function (p) { return p === min; }).length === 1;
        });
        const l = choisir(h, candidates);
        const valeurs = isolations.map(function (i) { return standard(l.id, i); });
        const psis = valeurs.map(function (v) { return v.psi; });
        const bonne = psis.indexOf(Math.min.apply(null, psis));
        return {
          type: 'choix', choix: isolations, bonne: bonne,
          enonce: 'Pour la liaison « <b>' + l.nom + '</b> », quelle position de l\'isolant donne le pont thermique le plus faible (cas standard, non traité) ?',
          correction: valeurs.map(function (v) { return v.isolation + ' : ψ = ' + nb(v.psi, 2); }).join('   ·   ') + '\n\n' +
            'Pourquoi : ' + (E.explications[valeurs[bonne].id] || '')
        };
      }
    }
  ];

  global.PontsExercices = PontsExercices;
  if (typeof module !== 'undefined' && module.exports) module.exports = PontsExercices;
})(typeof window !== 'undefined' ? window : globalThis);
