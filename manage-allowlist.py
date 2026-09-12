#!/usr/bin/env python3
"""Gère la liste des accès "viewer" (lecture seule) sans passer par la console
Firebase. Utilise le compte de service (Admin SDK) — mêmes prérequis que
sync-to-firestore.py (voir son en-tête pour le détail de la clé).

Un email dans cette liste = accès en lecture seule à l'app (voir
firestore.rules → isAllowedViewer() : l'existence du document suffit, son
contenu n'a aucune importance). Romain (OWNER_EMAIL dans auth.js) a toujours
tous les droits, indépendamment de cette liste.

Usage :
  python3 manage-allowlist.py list
  python3 manage-allowlist.py add <email>
  python3 manage-allowlist.py remove <email>
"""
import os
import sys

DEFAULT_KEY_PATH = os.path.expanduser("~/.secrets/nice-cannes-2026-firebase-adminsdk.json")


def get_db():
    key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY") or DEFAULT_KEY_PATH
    if not os.path.isfile(key_path):
        print(f"Clé de compte de service introuvable ({key_path}).", file=sys.stderr)
        sys.exit(1)
    import firebase_admin
    from firebase_admin import credentials, firestore
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("list", "add", "remove"):
        print("Usage: manage-allowlist.py <list|add|remove> [email]", file=sys.stderr)
        sys.exit(1)

    action = sys.argv[1]
    db = get_db()
    col = db.collection("allowlist")

    if action == "list":
        docs = list(col.stream())
        if not docs:
            print("Aucun email autorisé pour l'instant.")
        else:
            print(f"{len(docs)} email(s) autorisé(s) en lecture seule :")
            for d in docs:
                print(" -", d.id)
        return

    if len(sys.argv) != 3:
        print(f"Usage: manage-allowlist.py {action} <email>", file=sys.stderr)
        sys.exit(1)
    email = sys.argv[2].strip().lower()

    if action == "add":
        col.document(email).set({"ajoute_le": __import__("datetime").date.today().isoformat()})
        print(f"✅ {email} peut maintenant se connecter (lecture seule).")
    elif action == "remove":
        if not col.document(email).get().exists:
            print(f"⚠️  {email} n'était pas dans la liste, rien à faire.")
        else:
            col.document(email).delete()
            print(f"✅ {email} n'a plus accès.")


if __name__ == "__main__":
    main()
