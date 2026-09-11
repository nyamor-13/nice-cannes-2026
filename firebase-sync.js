/* ============================================================
   SYNCHRO CLOUD — Firestore (multi-appareils)
   Un seul document partagé ("state/app") contient exactement les
   mêmes données que le localStorage (cases cochées, forme, ressentis,
   notes). Objectif : ce que Romain coche sur son téléphone apparaît
   aussi sur son Mac, et inversement. Lecture autorisée pour owner et
   viewers, écriture réservée à owner (voir firestore.rules) — un viewer
   qui appellerait push() par erreur se ferait simplement rejeter côté
   serveur, jamais un risque réel.

   Ne s'authentifie plus soi-même : réutilise la session Google ouverte
   par auth.js (window.Auth). Ne bloque jamais l'affichage : si l'accès
   n'est pas encore confirmé ou a échoué, pull()/push() renvoient
   silencieusement sans rien faire — l'app continue avec le localStorage
   local, comme avant.
   ============================================================ */
(function () {
  const TIMEOUT_MS = 3000;

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(undefined), ms)),
    ]);
  }

  // Attend que auth.js ait confirmé un accès (owner ou viewer). Ne
  // s'authentifie jamais lui-même — si Auth.ready résout `null` (pas
  // connecté / pas autorisé), la sync reste silencieusement inactive.
  async function init() {
    if (!window.Auth) return false;
    const access = await window.Auth.ready;
    return !!access;
  }

  const db = () => firebase.firestore();
  const doc = () => db().collection("state").doc("app");

  window.CloudSync = {
    // Récupère l'état distant sous la forme {st, ts}. Ne dépasse jamais
    // TIMEOUT_MS au total. Renvoie null si le cloud est vide, indisponible,
    // ou en erreur — dans tous ces cas l'appelant garde le localStorage local
    // tel quel. Le `ts` sert à l'appelant à décider si le distant est plus
    // récent que le local avant de l'adopter (voir app.js) — sans cette
    // comparaison, un rechargement de page peut arriver avant la fin de
    // l'écriture cloud précédente et faire régresser l'état local avec une
    // version plus vieille.
    async pull() {
      const ok = await init();
      if (!ok) return null;
      try {
        const snap = await withTimeout(doc().get(), TIMEOUT_MS);
        if (snap && snap.exists) {
          const data = snap.data();
          return data && data.st ? { st: data.st, ts: data.ts || 0 } : null;
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    // Pousse l'état local vers le cloud, en tâche de fond, jamais bloquant.
    // `ts` doit être le même horodatage que celui écrit en local (app.js),
    // pour que la comparaison au prochain `pull()` soit cohérente.
    push(state, ts) {
      init().then((ok) => {
        if (!ok) return;
        doc()
          .set({ st: state, ts: ts || Date.now() })
          .catch(() => {});
      });
    },
  };
})();
