/* ==========================================================
   PONTS THERMIQUES ψ — SCHÉMAS SVG
   ----------------------------------------------------------
   Dessin uniquement, AUCUN calcul. Chaque schéma est une coupe
   (ou une vue en plan) de principe : extérieur à gauche, intérieur
   à droite. Les flèches rouges montrent le chemin « facile » de la
   chaleur ; leur épaisseur suit la valeur de ψ affichée.

   (H) Ce sont des dessins de principe, pas une simulation : le vrai
   champ de température se calcule en 2D numérique (NF EN ISO 10211).
   ========================================================== */
(function (global) {
  'use strict';

  let compteur = 0;

  /* ---------- Petites briques de dessin ---------- */
  function r(x, y, l, h, classe) {
    return '<rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + h + '" class="' + classe + '"/>';
  }
  function iso(x, y, l, h, id) {
    return '<rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + h + '" class="sch-isolant" fill="url(#' + id + '-iso)"/>';
  }
  function maco(x, y, l, h, id) {
    return '<rect x="' + x + '" y="' + y + '" width="' + l + '" height="' + h + '" class="sch-maconnerie" fill="url(#' + id + '-maco)"/>';
  }
  function poly(points, classe) {
    return '<polygon points="' + points + '" class="' + classe + '"/>';
  }
  function texte(x, y, t, ancre) {
    return '<text x="' + x + '" y="' + y + '" class="sch-texte"' + (ancre ? ' text-anchor="' + ancre + '"' : '') + '>' + t + '</text>';
  }
  function fluxCourant(x1, y1, x2, y2, id) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="sch-flux-courant" marker-end="url(#' + id + '-fleche-c)"/>';
  }

  /* ---------- Une liaison = une fonction de dessin ----------
     Chaque fonction renvoie :
       fond   : formes (zones, matériaux)
       ponts  : [x, y] où la chaleur s'échappe (halo)
       flux   : chemins « d » des flèches du pont thermique
       courant: petites flèches du flux normal à travers la paroi */

  function plancherOuRefend(isolation, variante, id, estRefend) {
    const e = estRefend ? 20 : 24;            // épaisseur du refend / de la dalle
    const y1 = 130 - e / 2, y2 = 130 + e / 2;
    let f = '', pont, flux, courant;
    const nomDalle = estRefend ? 'refend béton' : 'dalle béton';

    if (isolation === 'ITE') {
      f += poly('0,0 100,0 100,260 0,260', 'sch-zone-froide');
      f += r(130, 0, 40, 260, 'sch-beton') + r(130, y1, 210, e, 'sch-beton') + iso(100, 0, 30, 260, id);
      pont = [128, 130];
      flux = ['M 300 ' + (y1 - 22) + ' C 240 ' + (y1 - 14) + ', 190 130, 92 130'];
      courant = [[240, 50, 84, 50], [240, 215, 84, 215]];
    } else if (isolation === 'ITR') {
      f += poly('0,0 120,0 120,260 0,260', 'sch-zone-froide');
      f += maco(120, 0, 70, y1, id) + maco(120, y2, 70, 260 - y2, id);
      if (variante === 'traite') {
        f += r(120, y1, 8, e, 'sch-beton') + iso(128, y1, 12, e, id) + r(140, y1, 200, e, 'sch-beton');
      } else {
        f += r(120, y1, 10, e, 'sch-beton') + r(130, y1, 210, e, 'sch-beton');
      }
      pont = [124, 130];
      flux = ['M 300 ' + (y1 - 26) + ' C 250 ' + (y1 - 14) + ', 200 130, 104 130',
        'M 300 ' + (y2 + 26) + ' C 250 ' + (y2 + 14) + ', 200 130, 104 130'];
      courant = [[250, 50, 104, 50], [250, 215, 104, 215]];
    } else { // ITI
      f += poly('0,0 130,0 130,260 0,260', 'sch-zone-froide');
      f += r(130, 0, 40, 260, 'sch-beton');
      f += iso(170, 0, 30, y1, id) + iso(170, y2, 30, 260 - y2, id);
      f += r(200, 0, 4, y1, 'sch-plaque') + r(200, y2, 4, 260 - y2, 'sch-plaque');
      if (variante === 'traite' && !estRefend) {
        // Rupteur : isolant dans le plan du doublage, traversé par des aciers.
        f += r(200, y1, 140, e, 'sch-beton') + iso(170, y1, 30, e, id);
        f += '<line x1="160" y1="' + (y1 + 7) + '" x2="215" y2="' + (y1 + 7) + '" class="sch-acier"/>' +
             '<line x1="160" y1="' + (y2 - 7) + '" x2="215" y2="' + (y2 - 7) + '" class="sch-acier"/>';
      } else {
        f += r(170, y1, 170, e, 'sch-beton');
      }
      if (variante === 'traite' && estRefend) {
        // Retour d'isolant le long du refend, sur ~1 m.
        f += iso(204, y1 - 14, 80, 14, id) + iso(204, y2, 80, 14, id);
      }
      pont = [150, 130];
      flux = ['M 310 ' + (y1 - 24) + ' C 250 ' + (y1 - 10) + ', 210 130, 112 130',
        'M 310 ' + (y2 + 24) + ' C 250 ' + (y2 + 10) + ', 210 130, 112 130'];
      courant = [[260, 50, 112, 50], [260, 215, 112, 215]];
    }
    const lib = estRefend
      ? texte(330, y1 - 30, 'pièce 1', 'end') + texte(330, y2 + 42, 'pièce 2', 'end')
      : texte(330, y1 - 30, 'étage', 'end') + texte(330, y2 + 42, 'étage dessous', 'end');
    return { fond: f, ponts: [pont], flux: flux, courant: courant, textes: lib + texte(330, y2 - 6, nomDalle, 'end') };
  }

  function plancherBas(isolation, variante, id) {
    let f = '', pont, flux, courant;
    // Sol extérieur, vide sanitaire sous la dalle.
    f += poly('0,0 130,0 130,185 0,185', 'sch-zone-froide');
    f += r(0, 185, 130, 75, 'sch-sol');
    f += r(130, 195, 210, 65, 'sch-zone-froide');

    if (isolation === 'ITR') {
      f += r(0, 0, 120, 185, 'sch-zone-froide');
      f += maco(120, 0, 70, 150, id) + r(120, 150, 220, 25, 'sch-beton') + r(125, 175, 60, 85, 'sch-beton');
      f += iso(185, 175, 155, 20, id);
      pont = [140, 172];
      courant = [[260, 60, 104, 60]];
    } else if (isolation === 'ITE') {
      f += r(130, 0, 40, 150, 'sch-beton') + r(130, 150, 210, 25, 'sch-beton') + r(130, 175, 40, 85, 'sch-beton');
      f += iso(170, 175, 170, 20, id);
      f += iso(100, 0, 30, variante === 'traite' ? 232 : 150, id);
      pont = variante === 'traite' ? [128, 236] : [128, 168];
      courant = [[260, 60, 84, 60]];
    } else { // ITI
      f += r(130, 0, 40, 150, 'sch-beton') + r(130, 150, 210, 25, 'sch-beton') + r(130, 175, 40, 85, 'sch-beton');
      f += iso(170, 0, 30, 150, id) + r(200, 0, 4, 150, 'sch-plaque');
      f += iso(170, 175, 170, 20, id);
      pont = [150, 168];
      courant = [[270, 60, 112, 60]];
    }
    const sortie = pont[1];
    flux = ['M 290 120 C 250 140, 210 160, ' + (pont[0] + 4) + ' ' + sortie + ' L 104 ' + (sortie + 4)];
    const t = texte(330, 140, 'pièce', 'end') + texte(330, 168, 'dalle béton', 'end') +
      texte(330, 238, 'vide sanitaire', 'end') + texte(8, 250, 'terre');
    return { fond: f, ponts: [pont], flux: flux, courant: courant, textes: t };
  }

  function acrotere(isolation, variante, id) {
    let f = '', pont, flux, courant;
    // L'extérieur entoure l'acrotère : à gauche et au-dessus de la toiture.
    f += poly('0,0 340,0 340,62 160,62 160,90 130,90 130,260 0,260', 'sch-zone-froide');

    const isoleAcrotere = isolation === 'ITE' && variante === 'traite';
    const xMur = isolation === 'ITR' ? 120 : 130;
    const debutToiture = isoleAcrotere ? 172 : 160;

    if (isolation === 'ITR') {
      f += maco(120, 115, 70, 145, id) + r(120, 90, 220, 25, 'sch-beton') + r(120, 20, 30, 70, 'sch-beton');
    } else {
      f += r(130, 115, 40, 145, 'sch-beton') + r(130, 90, 210, 25, 'sch-beton') + r(130, 20, 30, 70, 'sch-beton');
    }
    // Isolant de toiture + étanchéité (sur la dalle).
    f += iso(debutToiture, 64, 340 - debutToiture, 26, id);
    f += r(debutToiture, 60, 340 - debutToiture, 4, 'sch-etanche') + r(debutToiture - 3, 26, 3, 38, 'sch-etanche');

    if (isolation === 'ITI') {
      f += iso(170, 115, 30, 145, id) + r(200, 115, 4, 145, 'sch-plaque');
      pont = [150, 104];
      flux = ['M 290 190 C 250 150, 210 112, 152 104 L 104 100', 'M 290 190 C 250 150, 200 120, 150 70 L 104 55'];
      courant = [[270, 220, 112, 220]];
    } else if (isolation === 'ITE') {
      if (isoleAcrotere) {
        f += iso(100, 8, 30, 252, id) + iso(100, 8, 72, 12, id) + iso(160, 20, 12, 42, id);
        f += r(96, 2, 80, 6, 'sch-etanche');
        pont = [140, 70];
      } else {
        f += iso(100, 90, 30, 170, id);
        pont = [145, 60];
      }
      flux = ['M 290 190 C 240 140, 160 120, 146 80 L 146 30 L 104 26'];
      courant = [[270, 220, 84, 220]];
    } else { // ITR
      pont = [138, 100];
      flux = ['M 290 190 C 250 150, 200 112, 140 104 L 100 100', 'M 290 190 C 250 150, 190 120, 136 70 L 100 50'];
      courant = [[270, 220, 104, 220]];
    }
    const t = texte(330, 200, 'pièce', 'end') + texte(330, 108, 'dalle béton', 'end') +
      texte(330, 48, 'isolant de toiture', 'end') + texte(xMur + 2, 16, 'acrotère');
    return { fond: f, ponts: [pont], flux: flux, courant: courant, textes: t };
  }

  function menuiserie(isolation, variante, id) {
    let f = '', pont, flux, courant;
    // Vue en plan : le mur s'arrête en y = 140, la baie est en dessous.
    let xMenuiserie;
    if (isolation === 'ITI') xMenuiserie = 172;
    else if (isolation === 'ITE') xMenuiserie = 152;
    else xMenuiserie = 146;
    const xVitre = xMenuiserie + 6;

    f += poly('0,0 ' + (isolation === 'ITR' ? 120 : 130) + ',0 ' + (isolation === 'ITR' ? 120 : 130) + ',140 ' +
      xVitre + ',140 ' + xVitre + ',260 0,260', 'sch-zone-froide');

    if (isolation === 'ITR') {
      f += maco(120, 0, 70, 140, id);
    } else {
      f += r(130, 0, 40, 140, 'sch-beton');
    }
    if (isolation === 'ITI') {
      f += iso(170, 0, 30, 140, id) + r(200, 0, 4, 140, 'sch-plaque');
      pont = [168, 142];
      courant = [[270, 60, 112, 60]];
    } else if (isolation === 'ITE') {
      f += iso(100, 0, 30, 140, id);
      if (variante === 'traite') f += iso(100, 140, 52, 9, id);
      pont = [138, 144];
      courant = [[270, 60, 84, 60]];
    } else {
      pont = [140, 144];
      courant = [[270, 60, 104, 60]];
    }
    // Dormant et vitrage.
    f += r(xMenuiserie, 140, 18, 16, 'sch-menuiserie') + r(xVitre, 156, 6, 104, 'sch-vitrage');
    flux = ['M 300 110 C 240 120, ' + (xMenuiserie + 10) + ' 150, ' + (pont[0]) + ' ' + (pont[1] + 2) + ' L 110 196'];
    const t = texte(330, 110, 'pièce', 'end') + texte(330, 210, 'pièce (devant la vitre)', 'end') +
      texte(xVitre - 4, 250, 'vitrage', 'end') + texte(8, 160, 'tableau ↓');
    return { fond: f, ponts: [pont], flux: flux, courant: courant, textes: t };
  }

  /* ---------- Assemblage ---------- */
  // psi sert uniquement à régler l'épaisseur des flèches et la taille du halo.
  function dessiner(liaison, isolation, variante, psi) {
    const id = 'sch' + (++compteur);
    let d;
    if (liaison === 'plancher-inter') d = plancherOuRefend(isolation, variante, id, false);
    else if (liaison === 'refend') d = plancherOuRefend(isolation, variante, id, true);
    else if (liaison === 'plancher-bas') d = plancherBas(isolation, variante, id);
    else if (liaison === 'acrotere') d = acrotere(isolation, variante, id);
    else if (liaison === 'menuiserie') d = menuiserie(isolation, variante, id);
    else return '';

    const p = Math.max(0, Math.min(1, Number(psi) || 0));
    const largeur = (1.2 + 6 * p).toFixed(1);
    const halo = (8 + 26 * p).toFixed(0);

    const defs = '<defs>' +
      '<pattern id="' + id + '-iso" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="8" height="8" class="sch-isolant-fond"/><line x1="0" y1="0" x2="0" y2="8" class="sch-isolant-trait"/></pattern>' +
      '<pattern id="' + id + '-maco" width="10" height="10" patternUnits="userSpaceOnUse">' +
      '<rect width="10" height="10" class="sch-maconnerie-fond"/><circle cx="3" cy="3" r="1.4" class="sch-maconnerie-point"/>' +
      '<circle cx="8" cy="8" r="1.4" class="sch-maconnerie-point"/></pattern>' +
      '<radialGradient id="' + id + '-halo"><stop offset="0" class="sch-halo-centre"/><stop offset="1" class="sch-halo-bord"/></radialGradient>' +
      '<marker id="' + id + '-fleche" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" class="sch-fleche"/></marker>' +
      '<marker id="' + id + '-fleche-c" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" class="sch-fleche-courant"/></marker>' +
      '</defs>';

    const halos = d.ponts.map(function (pt) {
      return '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="' + halo + '" fill="url(#' + id + '-halo)"/>';
    }).join('');
    const fluxCourants = d.courant.map(function (c) { return fluxCourant(c[0], c[1], c[2], c[3], id); }).join('');
    const fluxPont = d.flux.map(function (chemin) {
      return '<path d="' + chemin + '" class="sch-flux" style="stroke-width:' + largeur + 'px" marker-end="url(#' + id + '-fleche)"/>';
    }).join('');

    const etiquettes = texte(8, 16, 'EXTÉRIEUR') + texte(332, 16, 'INTÉRIEUR', 'end');

    return '<svg viewBox="0 0 340 260" role="img" aria-label="Schéma de principe : ' + liaison + ', ' + isolation + '" class="schema-svg">' +
      defs + '<rect width="340" height="260" class="sch-zone-chaude"/>' + d.fond + halos + fluxCourants + fluxPont +
      d.textes + etiquettes + '</svg>';
  }

  const PontsSchemas = { dessiner: dessiner };
  global.PontsSchemas = PontsSchemas;
})(window);
