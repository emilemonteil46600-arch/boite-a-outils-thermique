/* ==========================================================
   Boîte à outils thermique — fonctions partagées par tous les outils
   (sauvegarde, fichiers, mise en forme des nombres, onglets)
   ========================================================== */
(function (global) {
  'use strict';

  const BAO = {};

  /* ---------- Sauvegarde dans le navigateur ----------
     Les données restent sur l'appareil (localStorage).
     Elles ne partent jamais sur GitHub ni ailleurs.
     Pour passer d'un appareil à l'autre : export / import JSON. */
  BAO.lire = function (cle, defaut) {
    try {
      const brut = global.localStorage.getItem(cle);
      return brut === null ? defaut : JSON.parse(brut);
    } catch (e) {
      return defaut;
    }
  };

  BAO.ecrire = function (cle, valeur) {
    try {
      global.localStorage.setItem(cle, JSON.stringify(valeur));
      return true;
    } catch (e) {
      return false;
    }
  };

  BAO.effacer = function (cle) {
    try { global.localStorage.removeItem(cle); } catch (e) { /* rien */ }
  };

  BAO.cloner = function (objet) {
    return JSON.parse(JSON.stringify(objet));
  };

  /* ---------- Nombres (format français) ---------- */
  const fmt0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

  BAO.nombre = function (valeur, decimales) {
    if (valeur === null || valeur === undefined || !isFinite(valeur)) return '–';
    const d = decimales === undefined ? 0 : decimales;
    if (d === 0) return fmt0.format(valeur);
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(valeur);
  };

  BAO.euros = function (valeur, decimales) {
    return BAO.nombre(valeur, decimales) + ' €';
  };

  // Lit un nombre tapé à la française ("1 250,5") ou à l'anglaise ("1250.5")
  BAO.lireNombre = function (texte) {
    if (typeof texte === 'number') return texte;
    if (texte === null || texte === undefined) return NaN;
    const propre = String(texte).replace(/\s| | /g, '').replace(',', '.');
    return propre === '' ? NaN : Number(propre);
  };

  // "2025-01" -> "janv. 2025"
  BAO.mois = function (aaaamm) {
    if (!aaaamm || !/^\d{4}-\d{2}$/.test(aaaamm)) return aaaamm || '–';
    const [a, m] = aaaamm.split('-').map(Number);
    return new Date(a, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  BAO.echapper = function (texte) {
    return String(texte === undefined || texte === null ? '' : texte)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  BAO.identifiant = function (prefixe) {
    return (prefixe || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };

  /* ---------- Fichiers ---------- */
  BAO.telecharger = function (nomFichier, contenu, type) {
    const blob = new Blob([contenu], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  BAO.lireFichierJSON = function (fichier) {
    return new Promise(function (resoudre, rejeter) {
      const lecteur = new FileReader();
      lecteur.onload = function () {
        try { resoudre(JSON.parse(lecteur.result)); } catch (e) { rejeter(new Error('Fichier JSON illisible.')); }
      };
      lecteur.onerror = function () { rejeter(new Error('Lecture du fichier impossible.')); };
      lecteur.readAsText(fichier);
    });
  };

  BAO.dateFichier = function () {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  /* ---------- Presse-papiers (copie mise en forme pour Word) ---------- */
  BAO.copierTableau = async function (html, texte) {
    try {
      if (global.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([texte], { type: 'text/plain' })
        })]);
        return true;
      }
    } catch (e) { /* on tente la méthode de secours */ }
    try {
      const zone = document.createElement('div');
      zone.innerHTML = html;
      zone.style.position = 'fixed';
      zone.style.left = '-9999px';
      document.body.appendChild(zone);
      const plage = document.createRange();
      plage.selectNodeContents(zone);
      const sel = global.getSelection();
      sel.removeAllRanges();
      sel.addRange(plage);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      zone.remove();
      return ok;
    } catch (e) {
      return false;
    }
  };

  /* ---------- Petite notification ---------- */
  let minuterieToast = null;
  BAO.notifier = function (message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(minuterieToast);
    minuterieToast = setTimeout(function () { el.classList.remove('visible'); }, 2400);
  };

  /* ---------- Onglets ----------
     <div class="onglets"><button data-onglet="calcul">…</button></div>
     <section class="panneau" id="onglet-calcul">…</section> */
  BAO.initOnglets = function (cleMemoire) {
    const boutons = Array.from(document.querySelectorAll('.onglets [data-onglet]'));
    function activer(nom) {
      if (!boutons.some(function (b) { return b.dataset.onglet === nom; })) nom = boutons[0].dataset.onglet;
      boutons.forEach(function (b) {
        const actif = b.dataset.onglet === nom;
        b.setAttribute('aria-selected', actif ? 'true' : 'false');
        const panneau = document.getElementById('onglet-' + b.dataset.onglet);
        if (panneau) panneau.hidden = !actif;
      });
      if (cleMemoire) BAO.ecrire(cleMemoire, nom);
    }
    boutons.forEach(function (b) {
      b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { activer(b.dataset.onglet); });
    });
    activer(BAO.lire(cleMemoire, boutons[0].dataset.onglet));
    return activer;
  };

  global.BAO = BAO;
})(window);
