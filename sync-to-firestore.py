#!/usr/bin/env python3
"""Écrit les données de sync (Strava/Garmin/Withings) dans Firestore.

Remplace l'ancien `git add data-strava.js && git commit && git push` — depuis
la mise en place de l'authentification (11 sept 2026), les données
personnelles ne sont plus des fichiers publics, elles vivent dans Firestore,
protégées par firestore.rules. Ce script écrit en tant que compte de service
(Admin SDK), qui n'est jamais soumis à ces règles (accès admin complet par
construction) — c'est la tâche planifiée qui agit ici, pas un utilisateur.

Prérequis (à faire une seule fois, par Romain) :
  1. pip3 install firebase-admin
  2. Générer une clé de compte de service : console Firebase → Paramètres du
     projet → Comptes de service → Générer une nouvelle clé privée (JSON)
  3. Enregistrer ce fichier quelque part sur ce Mac, JAMAIS dans le dépôt git
     (déjà ajouté à .gitignore : voir la ligne `firebase-service-account*.json`)
  4. Définir la variable d'environnement FIREBASE_SERVICE_ACCOUNT_KEY avec le
     chemin vers ce fichier (ex. dans ~/.zshrc :
     export FIREBASE_SERVICE_ACCOUNT_KEY="$HOME/.secrets/nice-cannes-2026-admin.json")

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


def main():
    if len(sys.argv) != 3:
        print("Usage: sync-to-firestore.py <plan|strava|withings> <fichier.json>", file=sys.stderr)
        sys.exit(1)

    doc_id, json_path = sys.argv[1], sys.argv[2]
    if doc_id not in ("plan", "strava", "withings"):
        print(f"Document inconnu : {doc_id} (attendu : plan, strava ou withings)", file=sys.stderr)
        sys.exit(1)

    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not key_path or not os.path.isfile(key_path):
        print(
            "FIREBASE_SERVICE_ACCOUNT_KEY absent ou introuvable — voir le prérequis en tête de "
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
