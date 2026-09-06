# Procédure de mise à jour quotidienne

Ce dossier contient le suivi du marathon Nice→Cannes de Romain (8 novembre 2026).

## Fichiers

| Fichier | Rôle | Régénéré ? |
|---|---|---|
| `index.html` | L'application (2 onglets) | ❌ jamais automatiquement |
| `data-plan.js` | Plan des 12 semaines, zones, archétypes de séances | ❌ seulement si le plan change |
| `data-strava.js` | Activités réelles + agrégats hebdomadaires + métriques Garmin | ✅ **chaque midi** |

Les saisies de Romain (cases cochées, forme du jour, ressentis) vivent dans le `localStorage`
du navigateur sous la clé `mnc2026-v3`. **Elles ne sont jamais touchées** par la mise à jour :
c'est pour ça que seul `data-strava.js` est réécrit.

## Ce qu'il faut faire

1. **Strava** — `list_activities` sur les 21 derniers jours (couvre les retards de synchro).
   Pour les nouvelles sorties de course, récupérer aussi `get_activity_performance`
   afin d'avoir la FC moyenne (utilisée pour l'indice d'efficience).

2. **Recalculer les agrégats hebdomadaires** (semaines du lundi au dimanche) :
   - `km`, `h`, `dplus`, `sorties`, `natations`, `renfo`
   - `longest` : plus longue sortie de la semaine
   - `allure` / `allure_min` : temps total ÷ distance totale
   - `fc` : moyenne pondérée par le temps, sur les sorties qui ont une FC
   - `eff` : **indice d'efficience** = `(km × 1000) / (fc × minutes)` — mètres par battement.
     C'est le KPI de progression le plus important : il doit monter.

3. **Garmin** (optionnel, best-effort) — si Chrome est ouvert et connecté, via l'extension :
   - VO2max : `connect.garmin.com/app/report/21/all/current`
   - Prédictions : `connect.garmin.com/app/report/-29/running/current`
   - FC repos : `connect.garmin.com/app/heart-rate/<AAAA-MM-JJ>/2` (vue 4 semaines)
   - À partir d'octobre 2026, Romain porte sa montre en continu : récupérer aussi
     le **sommeil** (`/app/sleep/<date>`) et la **VFC** (`/app/hrv-status`), et les ajouter
     dans `window.GARMIN` (`sommeil`, `vfc`). Ces deux champs sont à `null` tant qu'ils n'existent pas.
   - Si Chrome n'est pas disponible : **ne pas bloquer**, conserver les valeurs Garmin
     précédentes et passer `MAJ.garmin` à `false`.

4. **Réécrire `data-strava.js`** en respectant exactement ce format :

```js
window.MAJ     = {"date":"<ISO local>","source":"Strava","garmin":true|false};
window.GARMIN  = {"vo2max":52,"fc_repos":49,"fc_repos_serie":[{"d":"AAAA-MM-JJ","v":49}],
                  "predictions":{"5k":"","10k":"","semi":"","marathon":""},
                  "sommeil":null,"vfc":null};
window.HEBDO   = [{"lundi":"AAAA-MM-JJ","km":0,"h":0,"dplus":0,"sorties":0,"natations":0,
                   "renfo":0,"longest":0,"allure":"5:30","allure_min":5.5,"fc":140,"eff":1.3,"nat_m":0}];
window.TOTAUX  = {"km":0,"h":0,"sorties":0,"natations":0};
```

5. **Vérifier** que le fichier est du JavaScript valide avant de le laisser en place :
   ```
   /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc \
     <(printf 'var window={};\n'; cat data-strava.js; printf '\n"ok"\n')
   ```
   En cas d'erreur, restaurer la version précédente plutôt que de laisser un fichier cassé.

## Marquer les séances réalisées

Ne **jamais** cocher les séances à la place de Romain dans `data-plan.js` — c'est lui qui coche
dans l'app. Les seules séances marquées `past:1` sont les semaines 1 à 3, figées historiquement.

## Déclenchement

- **Automatique** : tâche planifiée `marathon-nice-cannes-maj`, tous les jours à 12h01.
  Si Chrome n'est pas ouvert, elle se contente de Strava — c'est le cas normal, pas une erreur.
- **Manuel** : Romain a un bouton « Synchroniser maintenant » dans l'app, qui lui rappelle
  d'ouvrir Chrome + Garmin Connect et lui copie la commande à coller. C'est la voie à privilégier
  pour une synchro complète avec les métriques Garmin.

## Ouvrir l'app

`marathon/index.html` s'ouvre **par double-clic** (`file://`) : les données sont chargées par
balises `<script src>`, pas par `fetch`, donc aucun serveur n'est nécessaire.
Le serveur `serve.py` ne sert qu'à la vérification visuelle pendant le développement.

L'app est aussi en ligne (GitHub Pages, accès mobile) : **https://nyamor-13.github.io/nice-cannes-2026/**
Dépôt public mais non indexé (`noindex` + `robots.txt`) — ne jamais retirer ces protections,
les données affichées sont personnelles (poids, FC, allures).

## Publier une mise à jour sur GitHub Pages

Après avoir régénéré `data-strava.js`, pousser le changement pour que le site en ligne se mette à jour :
```
cd "/Users/romainsammut/Documents/Claude Code/marathon"
git add data-strava.js
git commit -m "Sync données du <date>"
git push
```
Le déploiement GitHub Pages se fait automatiquement après le push (30 s à 1-2 min).
Ne jamais commiter autre chose que `data-strava.js` sans que ce soit explicitement demandé.

## Points de vigilance

- **Semaine 5 (14-20 septembre) : Romain est à un mariage du vendredi 18 au dimanche 20.**
  C'est une coupure planifiée, pas un abandon — ne pas la signaler comme un retard.
  La semaine est volontairement à ~27 km avec la sortie longue avancée au jeudi 17.
- **Semaine 4 durcie à sa demande** : elle contient désormais du VO2max (4 × 4′) et des côtes.
  Surveiller de près l'allure de ses footings : s'il monte l'intensité sans ralentir ses sorties
  faciles, le risque de blessure devient réel. C'est le point à signaler en priorité.
- **Semi en solo, semaine du 5-11 octobre 2026** : le 20 km de Paris affiche complet, Romain fait
  donc un semi-marathon (21,1 km) organisé lui-même, sans date officielle. Repérer dans Strava
  une sortie d'environ 21 km à allure soutenue sur cette période et en faire le point de contrôle.
  Un chrono sous 1h42 valide l'objectif 3h45 ; au-delà de 1h48, proposer 3h50-3h55.
- **Test FCmax en semaine 6** (jeudi 24 septembre, séance de côtes) : si un pic dépasse
  185 bpm, les zones de `data-plan.js` doivent être recalculées par réserve cardiaque
  (Karvonen) avec la nouvelle FCmax.
- **Fractionnés sur tapis** : Romain fait ses séances de qualité sur tapis. Les allures cibles
  sont dans les archétypes (`tapis`) — 14,5 km/h pour le VO2max, 13,1 pour les 1000 m,
  12,6 pour les 2000 m, 6-8 % d'inclinaison pour les côtes. Les tapis étant souvent mal calibrés,
  croiser avec la FC plutôt que de se fier aveuglément à la vitesse affichée.
- **FC de repos** : une hausse de plus de 7 bpm au-dessus de la moyenne (49) sur deux jours
  consécutifs signale une fatigue ou une infection — le signaler explicitement.
- **Allure des footings** : le problème n°1 de Romain est de courir ses sorties faciles trop vite
  (5:26/km au lieu de 6:00-6:30). Si l'allure moyenne hebdomadaire ne descend pas, le dire.
