#!/usr/bin/env python3
"""Configuration unique de l'API Withings (remplace la lecture manuelle du poids/
composition corporelle via computer-use sur l'app Mac).

Ce script se lance UNE SEULE FOIS (le refresh_token obtenu à la fin dure ~1 an et
se renouvelle tout seul à chaque sync — voir sync-withings.py). Il fait deux choses :

  1. Si ~/.secrets/withings-app.json n'existe pas encore : guide la création d'une
     application sur le portail développeur Withings (aucune connaissance technique
     requise, juste suivre les instructions affichées à l'écran).
  2. Autorisation OAuth2 : ouvre le navigateur sur la page de connexion Withings,
     récupère automatiquement le code de retour via un petit serveur local
     temporaire, l'échange contre un access_token + refresh_token, et sauvegarde
     ce dernier dans ~/.secrets/withings-tokens.json.

Aucun secret n'est jamais écrit dans le dépôt git (tout vit sous ~/.secrets/,
chmod 600, même emplacement/logique que la clé de service Firebase).

Référence API utilisée (vérifiée sur la doc officielle developer.withings.com et
le repo GitHub officiel withings-sas/api-oauth2-python) :
  - Autorisation : GET  https://account.withings.com/oauth2_user/authorize2
  - Échange/refresh de token : POST https://account.withings.com/oauth2/token
  - Scope nécessaire : user.metrics (poids + composition corporelle)
"""
import http.server
import json
import os
import secrets
import socketserver
import stat
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

APP_FILE = os.path.expanduser("~/.secrets/withings-app.json")
TOKENS_FILE = os.path.expanduser("~/.secrets/withings-tokens.json")
REDIRECT_PORT = 8734
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}/callback"
AUTHORIZE_URL = "https://account.withings.com/oauth2_user/authorize2"
TOKEN_URL = "https://account.withings.com/oauth2/token"


def _save_json_secret(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)  # chmod 600


def _input(prompt):
    try:
        return input(prompt).strip()
    except EOFError:
        print("\nInterrompu — relance le script quand tu es prêt.")
        sys.exit(1)


def ensure_app_credentials():
    if os.path.isfile(APP_FILE):
        with open(APP_FILE, encoding="utf-8") as f:
            return json.load(f)

    print("=" * 70)
    print("ÉTAPE 1/2 — Créer l'application sur le portail développeur Withings")
    print("=" * 70)
    print(f"""
On n'a pas encore de client_id/client_secret Withings pour ce projet. C'est un
enregistrement à faire une seule fois, comme créer un compte sur un site.

1. Ouvre https://developer.withings.com/dashboard/ (je vais tenter de l'ouvrir
   automatiquement dans ton navigateur).
2. Si demandé, crée un compte développeur (email + mot de passe, comme n'importe
   quel compte — c'est toi qui le fais, je ne peux pas le faire à ta place).
3. Une fois connecté, clique sur "Create an app" (ou équivalent "Créer une
   application").
4. Remplis le formulaire :
     - Nom de l'application  : Suivi Marathon Nice-Cannes
     - Description           : Suivi personnel poids/composition corporelle
     - Redirect URI          : {REDIRECT_URI}
       (copie-colle exactement cette adresse, y compris "http://" et le port)
   Le reste des champs (catégorie, etc.) n'a pas d'importance, choisis ce qui
   te semble le plus proche.
5. Valide. Le dashboard affiche alors un "Client ID" et un "Client Secret"
   (parfois caché derrière un bouton "Show" ou une icône œil).
""")
    try:
        webbrowser.open("https://developer.withings.com/dashboard/")
    except Exception:
        pass
    _input("Appuie sur Entrée une fois l'application créée et les identifiants sous les yeux...")

    client_id = _input("\nColle ici le Client ID : ")
    client_secret = _input("Colle ici le Client Secret : ")
    if not client_id or not client_secret:
        print("Client ID ou Client Secret manquant — relance le script pour réessayer.")
        sys.exit(1)

    app = {"client_id": client_id, "client_secret": client_secret, "redirect_uri": REDIRECT_URI}
    _save_json_secret(APP_FILE, app)
    print(f"\n✅ Identifiants sauvegardés dans {APP_FILE} (accès restreint à toi seul).")
    return app


def run_oauth_flow(app):
    print("\n" + "=" * 70)
    print("ÉTAPE 2/2 — Autoriser l'accès à tes données Withings")
    print("=" * 70)

    state = secrets.token_urlsafe(16)
    result = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            if params.get("state", [None])[0] != state:
                self.wfile.write(b"<h2>Code de securite invalide, recommence.</h2>")
                result["error"] = "state mismatch"
            elif "code" in params:
                result["code"] = params["code"][0]
                self.wfile.write(
                    "<h2>Autorisation recue, tu peux fermer cet onglet.</h2>"
                    "<p>Retourne au terminal.</p>".encode("utf-8")
                )
            else:
                result["error"] = params.get("error", ["inconnue"])[0]
                self.wfile.write(b"<h2>Autorisation refusee ou annulee.</h2>")

        def log_message(self, fmt, *args):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", REDIRECT_PORT), Handler)
    thread = threading.Thread(target=httpd.handle_request, daemon=True)
    thread.start()

    payload = {
        "response_type": "code",
        "client_id": app["client_id"],
        "scope": "user.metrics",
        "redirect_uri": app["redirect_uri"],
        "state": state,
    }
    url = f"{AUTHORIZE_URL}?{urllib.parse.urlencode(payload)}"
    print(f"""
Un onglet va s'ouvrir sur la page de connexion Withings. Connecte-toi avec ton
compte Withings habituel (celui de ta balance) et clique sur "Autoriser" (ou
"Allow"). Tu seras ensuite redirigé vers une page locale qui confirme que c'est
bon — c'est normal et attendu, rien à en faire d'autre.

Si l'onglet ne s'ouvre pas tout seul, copie-colle cette adresse dans ton
navigateur :
{url}
""")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print("En attente de ton autorisation dans le navigateur (2 minutes max)...")
    thread.join(timeout=120)
    httpd.server_close()

    if "code" not in result:
        print(f"\n❌ Autorisation non reçue ({result.get('error', 'délai dépassé')}). Relance le script.")
        sys.exit(1)

    data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "client_id": app["client_id"],
        "client_secret": app["client_secret"],
        "code": result["code"],
        "redirect_uri": app["redirect_uri"],
    }).encode("utf-8")
    req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
    with urllib.request.urlopen(req) as resp:
        tokens = json.loads(resp.read().decode("utf-8"))

    if "access_token" not in tokens or "refresh_token" not in tokens:
        print(f"\n❌ Réponse Withings inattendue : {tokens}")
        sys.exit(1)

    _save_json_secret(TOKENS_FILE, tokens)
    print(f"\n✅ Connexion réussie. Token sauvegardé dans {TOKENS_FILE}.")
    print("Tu n'as plus jamais besoin de refaire cette étape — sync-withings.py")
    print("se chargera de renouveler l'accès automatiquement à chaque synchro.")


if __name__ == "__main__":
    app = ensure_app_credentials()
    run_oauth_flow(app)
