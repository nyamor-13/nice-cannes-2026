#!/usr/bin/env python3
"""Synchro Withings automatique — remplace la lecture manuelle via computer-use.

Prérequis : avoir lancé `python3 withings-setup.py` une fois (voir ce fichier
pour le détail de la procédure d'autorisation). Ce script-ci se relance à
chaque synchro (idéalement intégré à la procédure UPDATE.md / la tâche
planifiée quotidienne) sans aucune interaction : il rafraîchit le token
automatiquement et republie le token le plus récent (Withings peut le faire
tourner à chaque refresh).

Usage :
  python3 sync-withings.py                 # affiche le JSON sur stdout
  python3 sync-withings.py --write FICHIER  # écrit aussi dans FICHIER (JSON)

Le JSON produit est prêt à être passé tel quel à :
  python3 sync-to-firestore.py withings FICHIER

⚠️ Deux champs qualitatifs (masse_maigre_statut, masse_osseuse_statut) sont
calculés avec un seuil approximatif faute d'avoir pu confirmer les bornes
exactes utilisées par l'app Withings elle-même — à comparer avec l'app au
premier vrai relevé automatique, et ajuster le seuil ci-dessous si besoin.
Les autres champs (poids, IMC, % muscle, % graisse et leurs tendances) sont
calculés directement depuis les mesures brutes de l'API, sans approximation.
"""
import argparse
import json
import os
import stat
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

APP_FILE = os.path.expanduser("~/.secrets/withings-app.json")
TOKENS_FILE = os.path.expanduser("~/.secrets/withings-tokens.json")
TOKEN_URL = "https://account.withings.com/oauth2/token"
MEASURE_URL = "https://wbsapi.withings.net/measure"
TAILLE_M = 1.85  # cf. META.athlete.taille dans data-plan.js — change si Romain grandit encore

# Types de mesure Withings (voir developer.withings.com/developer-guide/v3/models/measures)
T_POIDS, T_FAT_RATIO, T_FAT_FREE_MASS, T_MUSCLE_MASS, T_BONE_MASS = 1, 6, 5, 76, 88


def _load_json(path, what):
    if not os.path.isfile(path):
        print(f"❌ {path} introuvable — lance d'abord : python3 withings-setup.py", file=sys.stderr)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_json_secret(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)


def refresh_access_token(app, tokens):
    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": app["client_id"],
        "client_secret": app["client_secret"],
        "refresh_token": tokens["refresh_token"],
    }).encode("utf-8")
    req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
    with urllib.request.urlopen(req) as resp:
        new_tokens = json.loads(resp.read().decode("utf-8"))
    if "access_token" not in new_tokens:
        print(f"❌ Échec du renouvellement du token : {new_tokens}", file=sys.stderr)
        print("   Il faudra probablement relancer withings-setup.py.", file=sys.stderr)
        sys.exit(1)
    # Withings fait tourner le refresh_token à chaque appel : toujours resauver.
    _save_json_secret(TOKENS_FILE, new_tokens)
    return new_tokens["access_token"]


def fetch_measures(access_token, since_days):
    startdate = int((datetime.now(timezone.utc) - timedelta(days=since_days)).timestamp())
    payload = {
        "action": "getmeas",
        "meastypes": f"{T_POIDS},{T_FAT_RATIO},{T_FAT_FREE_MASS},{T_MUSCLE_MASS},{T_BONE_MASS}",
        "category": 1,  # 1 = vraies mesures (2 = objectifs manuels)
        "startdate": startdate,
    }
    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(
        MEASURE_URL, data=data, method="POST",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    if body.get("status") != 0:
        print(f"❌ Erreur API Withings (status {body.get('status')}) : {body}", file=sys.stderr)
        sys.exit(1)
    return body["body"]["measuregrps"]


def _real_value(measures, mtype):
    """value * 10^unit, cf. doc Withings — None si ce type n'est pas dans le groupe."""
    for m in measures:
        if m["type"] == mtype:
            return m["value"] * (10 ** m["unit"])
    return None


def flatten_groups(groups):
    """Une ligne par date (grpid), avec les types qu'on a demandés, triée par date croissante."""
    rows = []
    for g in groups:
        rows.append({
            "date": g["date"],
            "poids": _real_value(g["measures"], T_POIDS),
            "fat_ratio": _real_value(g["measures"], T_FAT_RATIO),
            "fat_free_mass": _real_value(g["measures"], T_FAT_FREE_MASS),
            "muscle_mass": _real_value(g["measures"], T_MUSCLE_MASS),
            "bone_mass": _real_value(g["measures"], T_BONE_MASS),
        })
    rows = [r for r in rows if r["poids"] is not None]
    rows.sort(key=lambda r: r["date"])
    return rows


def pct_per_month(first, last, day_gap):
    if first is None or last is None or day_gap <= 0:
        return None
    return round((last - first) * (30 / day_gap), 1)


def build_withings_payload(rows):
    if not rows:
        print("❌ Aucune mesure de poids trouvée sur la période — rien à publier.", file=sys.stderr)
        sys.exit(1)

    last, first = rows[-1], rows[0]
    day_gap = max(1, round((last["date"] - first["date"]) / 86400))

    poids = round(last["poids"], 1)
    imc = round(poids / (TAILLE_M ** 2), 1)
    graisse_pct = round(last["fat_ratio"], 1) if last["fat_ratio"] is not None else None
    muscle_pct = (
        round(last["muscle_mass"] / last["poids"] * 100, 1)
        if last["muscle_mass"] is not None else None
    )

    poids_tendance = pct_per_month(first["poids"], last["poids"], day_gap)
    imc_first = first["poids"] / (TAILLE_M ** 2) if first["poids"] else None
    imc_tendance = pct_per_month(imc_first, imc, day_gap) if imc_first else None
    graisse_tendance = pct_per_month(first["fat_ratio"], last["fat_ratio"], day_gap)
    muscle_first_pct = (
        first["muscle_mass"] / first["poids"] * 100
        if first["muscle_mass"] is not None and first["poids"] else None
    )
    muscle_tendance = pct_per_month(muscle_first_pct, muscle_pct, day_gap) if muscle_first_pct else None

    poids_statut = "Stable" if poids_tendance is None or abs(poids_tendance) < 1 else (
        "En hausse" if poids_tendance > 0 else "En baisse")
    imc_statut = (
        "Insuffisant" if imc < 18.5 else
        "Bon" if imc < 25 else
        "Surpoids" if imc < 30 else "Élevé"
    )
    # Seuils approximatifs, non confirmés contre l'app Withings elle-même — voir
    # l'avertissement en tête de fichier.
    masse_maigre_pct = (
        last["fat_free_mass"] / last["poids"] * 100 if last["fat_free_mass"] is not None else None
    )
    masse_maigre_statut = "Normal" if masse_maigre_pct is None or masse_maigre_pct >= 75 else "Bas"
    masse_osseuse_statut = "Normal"  # pas de seuil fiable identifié, reporté tel quel

    return {
        "date": datetime.fromtimestamp(last["date"], tz=timezone.utc).strftime("%Y-%m-%d"),
        "poids": poids,
        "poids_unite": "kg",
        "poids_statut": poids_statut,
        "poids_tendance_kg": poids_tendance,
        "imc": imc,
        "imc_statut": imc_statut,
        "imc_tendance": imc_tendance,
        "muscle_pct": muscle_pct,
        "muscle_tendance_pct": muscle_tendance,
        "graisse_pct": graisse_pct,
        "graisse_tendance_pct": graisse_tendance,
        "masse_maigre_statut": masse_maigre_statut,
        "masse_maigre_tendance_pct": None,
        "masse_osseuse_statut": masse_osseuse_statut,
        "taille_cm": round(TAILLE_M * 100),
        "periode": f"{day_gap} derniers jours",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", help="Écrit aussi le JSON dans ce fichier")
    parser.add_argument("--since-days", type=int, default=35, help="Fenêtre pour calculer la tendance (défaut 35 j)")
    args = parser.parse_args()

    app = _load_json(APP_FILE, "app")
    tokens = _load_json(TOKENS_FILE, "tokens")
    access_token = refresh_access_token(app, tokens)
    groups = fetch_measures(access_token, args.since_days)
    rows = flatten_groups(groups)
    payload = build_withings_payload(rows)

    out = json.dumps({"WITHINGS": payload}, indent=2, ensure_ascii=False)
    print(out)
    if args.write:
        with open(args.write, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"\n✅ Écrit dans {args.write}", file=sys.stderr)


if __name__ == "__main__":
    main()
