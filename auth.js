/* ============================================================
   AUTHENTIFICATION — Google Sign-In + rôles (owner / viewer)

   Deux rôles, jamais plus :
   - owner  : Romain (OWNER_EMAIL ci-dessous). Tous droits.
   - viewer : tout email présent dans la collection Firestore `allowlist`.
              Lecture seule, imposée côté serveur par firestore.rules —
              ce fichier ne fait que RESPECTER ce que les règles décident,
              jamais les dupliquer. Le rôle "viewer" ci-dessous ne sert
              qu'à l'affichage (masquer les actions d'écriture), pas à la
              sécurité elle-même : la vraie barrière est côté serveur.

   Remplace l'auth anonyme utilisée jusqu'ici par firebase-sync.js — cette
   dernière ne doit plus initialiser Firebase ni se connecter elle-même,
   elle réutilise la session ouverte ici (voir firebase-sync.js).

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

  const OWNER_EMAIL = "romain.sammut@gmail.com";

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  function showScreen(id) {
    ["authLoading", "authLogin", "authDenied"].forEach((s) => {
      const el = document.getElementById(s);
      if (el) el.style.display = s === id ? "flex" : "none";
    });
    const shell = document.getElementById("appShell");
    if (shell) shell.style.display = id === "app" ? "" : "none";
  }

  async function trySignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const btn = document.getElementById("authSignInBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Connexion…"; }
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      console.error("Connexion Google échouée", e);
      const err = document.getElementById("authError");
      if (err) err.textContent = "La connexion a échoué (" + (e.code || "erreur inconnue") + "). Réessaie.";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Se connecter avec Google"; }
    }
  }

  function doSignOut() {
    auth.signOut();
  }

  // Un utilisateur "autorisé" est un utilisateur pour qui une vraie lecture
  // Firestore réussit — jamais une logique dupliquée côté client. Les règles
  // de sécurité (firestore.rules) sont la seule source de vérité sur qui a
  // le droit de lire quoi ; ce test ne fait que constater leur verdict.
  async function resolveAccess(user) {
    if (!user) return null;
    try {
      await firebase.firestore().collection("appdata").doc("plan").get();
      return { email: user.email, role: user.email === OWNER_EMAIL ? "owner" : "viewer" };
    } catch (e) {
      return null;
    }
  }

  window.Auth = {
    OWNER_EMAIL,
    ownerEmailConfigured: OWNER_EMAIL !== "OWNER_EMAIL_PLACEHOLDER",
    // Résout {email, role} une fois l'état Firebase connu ET la lecture test
    // effectuée — ou résout `null` si pas connecté / pas autorisé. Ne résout
    // jamais avant d'être sûr, pour ne jamais flasher du contenu protégé.
    ready: new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) { showScreen("authLogin"); resolve(null); return; }
        const access = await resolveAccess(user);
        if (!access) { showScreen("authDenied"); resolve(null); return; }
        showScreen("app");
        resolve(access);
      });
    }),
    signIn: trySignIn,
    signOut: doSignOut,
  };

  document.addEventListener("DOMContentLoaded", () => {
    // ⚠️ Ne PAS appeler showScreen("authLoading") ici : onAuthStateChanged (ci-dessus) peut
    // déjà avoir tranché avant que DOMContentLoaded ne se déclenche (l'état persisté de Firebase
    // Auth se lit vite). Le HTML part déjà correctement sur l'écran de chargement par défaut
    // (login/denied cachés en inline, loading visible via le CSS) — un appel ici écraserait un
    // vrai résultat déjà affiché et bloquerait l'app sur "Vérification de l'accès…" pour de bon.
    document.getElementById("authSignInBtn")?.addEventListener("click", trySignIn);
    document.getElementById("authSignOutBtn")?.addEventListener("click", doSignOut);
    document.getElementById("authSignOutBtn2")?.addEventListener("click", doSignOut);
    document.getElementById("authRetryBtn")?.addEventListener("click", () => location.reload());
  });
})();
