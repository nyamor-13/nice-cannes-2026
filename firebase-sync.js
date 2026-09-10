/* ============================================================
   SYNCHRO CLOUD — Firestore (multi-appareils)
   Un seul document partagé ("app/state") contient exactement les
   mêmes données que le localStorage (cases cochées, forme, ressentis,
   notes). Objectif : ce que Romain coche sur son téléphone apparaît
   aussi sur son Mac, et inversement.

   Ne bloque jamais l'affichage : si Firebase est indisponible (offline,
   ouverture en file://, projet mal configuré...), l'app continue de
   fonctionner uniquement avec le localStorage local, comme avant.
   ============================================================ */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCGs15P4Q8Rh7iqjK2Mwvl7rtK6paoSSuo",
    authDomain: "nice-cannes-2026.firebaseapp.com",
    projectId: "nice-cannes-2026",
    storageBucket: "nice-cannes-2026.firebasestorage.app",
    messagingSenderId: "98517277479",
    appId: "1:98517277479:web:d4ac0e1f1bc56fc0796702",
  };

  const TIMEOUT_MS = 3000;
  let db = null;
  let readyPromise = null;

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(undefined), ms)),
    ]);
  }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      try {
        if (!window.firebase) return false;
        firebase.initializeApp(firebaseConfig);
        const cred = await withTimeout(
          firebase.auth().signInAnonymously(),
          TIMEOUT_MS
        );
        if (!cred) return false;
        db = firebase.firestore();
        return true;
      } catch (e) {
        return false;
      }
    })();
    return readyPromise;
  }

  const doc = () => db.collection("app").doc("state");

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
      if (!ok || !db) return null;
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
        if (!ok || !db) return;
        doc()
          .set({ st: state, ts: ts || Date.now() })
          .catch(() => {});
      });
    },
  };
})();
