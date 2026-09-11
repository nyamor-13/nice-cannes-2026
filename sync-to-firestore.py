#!/usr/bin/env python3
"""Écrit les données de sync (Strava/Garmin/Withings) dans Firestore.

Remplace l'ancien `git add data-strava.js && git commit && git push` — depuis
la mise en place de l'authentification (11 sept 2026), les données
personnelles ne sont plus des fichiers publics, elles vivent dans Firestore,
protégées par firestore.rules. Ce script écrit en tant que compte de service
(Admin SDK), qui n'est jamais soumis à ces règles (accès admin complet par
construction) — c'est la tâche planifiée qui agit ici, pas un utilisateur.

Prérequis :
  1. pip3 install firebase-admin
  2. Une clé de compte de service (JSON, console Firebase → Paramètres du
     projet → Comptes de service → Générer une nouvelle clé privée), JAMAIS
     dans le dépôt git (voir .gitignore : `firebase-service-account*.json`,
     `*-firebase-adminsdk-*.json`).

Emplacement de la clé — deux façons, la première suffit dans l'usage normal :
  a. Par défaut (recommandé, pas de configuration à refaire à chaque session) :
     ~/.secrets/nice-cannes-2026-firebase-adminsdk.json — chmod 600, hors de
     tout dépôt git. C'est là qu'elle a été déposée le 11 sept 2026.
  b. Ou surcharger avec la variable d'environnement FIREBASE_SERVICE_ACCOUNT_KEY
     si la clé vit ailleurs (utile pour tester avec une autre clé ponctuellement) :
     export FIREBASE_SERVICE_ACCOUNT_KEY="/chemin/vers/la-cle.json"
     ⚠️ Une variable exportée dans un terminal ne survit pas d'une session à
     l'autre (et encore moins d'un jour sur l'autre pour la tâche planifiée) —
     ne jamais compter dessus comme mécanisme principal, seulement (a).

Usage :
  python3 sync-to-firestore.py strava data-strava.json
  python3 sync-to-firestore.py withings data-withings.json
  python3 sync-to-firestore.py plan data-plan.json   # seulement si data-plan.js change

Le fichier JSON passé en argument doit contenir un objet plat {"CHAMP": valeur,
...} avec exactement les champs `window.X` correspondants (voir DOC_FIELDS
dans data-cloud.js pour la liste exacte par document) — c'est au générateur du
JSON (la procédure de sync, voir UPDATE.md) de s'assurer que rien ne manque.
"""
import json
import os
import sys

DEFAULT_KEY_PATH = os.path.expanduser("~/.secrets/nice-cannes-2026-firebase-adminsdk.json")


def main():
    if len(sys.argv) != 3:
        print("Usage: sync-to-firestore.py <plan|strava|withings> <fichier.json>", file=sys.stderr)
        sys.exit(1)

    doc_id, json_path = sys.argv[1], sys.argv[2]
    if doc_id not in ("plan", "strava", "withings"):
        print(f"Document inconnu : {doc_id} (attendu : plan, strava ou withings)", file=sys.stderr)
        sys.exit(1)

    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY") or DEFAULT_KEY_PATH
    if not os.path.isfile(key_path):
        print(
            f"Clé de compte de service introuvable ({key_path}) — voir le prérequis en tête de "
            "ce fichier. Rien n'a été écrit.",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("Module firebase_admin absent — installe-le avec : pip3 install firebase-admin", file=sys.stderr)
        sys.exit(1)

    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    db.collection("appdata").document(doc_id).set(payload)
    print(f"✅ appdata/{doc_id} écrit ({len(payload)} champs) depuis {json_path}")


if __name__ == "__main__":
    main()
