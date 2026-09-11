/* ============================================================
   CHARGEMENT DES DONNÉES DEPUIS FIRESTORE — remplace les anciens
   <script src="data-plan.js/data-strava.js/data-withings.js">

   Ces trois fichiers ne sont plus chargés en public : leur contenu vit
   dans Firestore (collection `appdata`, documents `plan`/`strava`/
   `withings`), protégé par firestore.rules. Ce script attend que
   window.Auth ait confirmé un accès (owner ou viewer), lit les trois
   documents, et republie exactement les mêmes globals `window.X` que
   les anciens fichiers statiques — le reste de app.js n'a donc rien à
   changer dans sa façon de lire les données.

   Migration initiale : voir migrate-to-firestore.html (outil local à
   usage unique, jamais publié) — tant qu'elle n'a pas été faite, les
   documents Firestore n'existent pas et window.DataCloud.ready se
   résout à `false` (voir app.js pour l'écran d'erreur correspondant).
   ============================================================ */
(function () {
  // Correspondance document Firestore → globals qu'il republie. Un seul
  // endroit à modifier si un champ change de fichier d'origine un jour.
  const DOC_FIELDS = {
    plan: ["META", "ZONES", "ARCHETYPES", "SEMAINES"],
    strava: ["MAJ", "ACTIVITES", "ANALYSES", "MATERIEL", "GARMIN", "SOMMEIL", "HEBDO", "TOTAUX"],
    withings: ["WITHINGS"],
  };

  async function loadAll() {
    const db = firebase.firestore();
    const docs = await Promise.all(
      Object.keys(DOC_FIELDS).map((id) => db.collection("appdata").doc(id).get())
    );
    let allExist = true;
    Object.keys(DOC_FIELDS).forEach((id, i) => {
      const snap = docs[i];
      if (!snap.exists) { allExist = false; return; }
      const data = snap.data() || {};
      DOC_FIELDS[id].forEach((field) => { window[field] = data[field]; });
    });
    return allExist;
  }

  window.DataCloud = {
    // Résout `true` si les trois documents existent et ont été chargés dans
    // les globals habituels, `false` si la migration initiale n'a pas encore
    // eu lieu (voir migrate-to-firestore.html), `null` si pas d'accès du tout.
    ready: window.Auth.ready.then((access) => {
      if (!access) return null;
      return loadAll();
    }),
  };
})();
