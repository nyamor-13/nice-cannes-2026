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
   - **FC repos : EN PAUSE jusqu'à fin septembre 2026** (demande explicite de Romain le 9 sept).
     Ne pas aller consulter `/app/heart-rate/...` pendant cette période, ni chercher à enrichir
     `fc_repos_serie`. Laisser `GARMIN.fc_repos_serie` tel quel dans le fichier (ne pas y toucher,
     ne pas le vider) — l'app continue d'afficher les dernières valeurs connues, c'est voulu.
     **Reprendre la collecte dès que Romain confirme qu'il porte sa montre en continu**
     (attendu fin septembre / courant octobre) : à ce moment, recalculer `fc_repos` sur ses
     2-3 premières semaines de port continu (vie normale, hors vacances) et reprendre l'alimentation
     de `fc_repos_serie` jour par jour.
   - À partir de la reprise du port continu : récupérer aussi le **sommeil** (`/app/sleep/<date>`)
     et la **VFC** (`/app/hrv-status`), et les ajouter dans `window.GARMIN` (`sommeil`, `vfc`).
     Ces deux champs restent à `null` tant qu'ils n'existent pas.
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

## Analyse d'adaptation — obligatoire à chaque sync, jamais silencieuse

Après avoir régénéré `data-strava.js`, analyser chaque nouvelle séance de qualité (VMA, seuil, côtes,
allure marathon) par rapport à sa cible du plan (`data-plan.js` → archétype → champ `tapis` ou zone
FC/allure). Comparer : allure/vitesse réellement tenue vs cible, et FC atteinte vs zone attendue.

**Toujours conclure explicitement dans le compte-rendu**, même si rien ne change :
- Si la séance est cohérente avec la cible (ou l'écart s'explique par la FC — ex. vitesse sous la cible
  mais FC proche du max, donc effort réel conforme) → **le dire clairement et expliquer pourquoi aucun
  ajustement n'est proposé.**
- Si un écart semble réel et mérite d'ajuster une cible du plan (vitesse tapis, zone, charge de renfo...)
  → **proposer l'ajustement précis dans le chat et attendre l'accord explicite de Romain avant de
  modifier `data-plan.js`.** Ne jamais modifier `data-plan.js` de sa propre initiative pendant une sync.
- Une seule séance sous la cible ne justifie généralement pas un ajustement immédiat (peut être la
  première fois sur ce format, une fatigue ponctuelle, un tapis mal calibré...) — le signaler comme
  "à surveiller sur les 2-3 prochaines séances du même type" plutôt que de changer la cible tout de suite.

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
- **FC de repos — suivi mis en pause le 9 septembre 2026, à la demande de Romain.** Ne plus consulter
  Garmin pour cette donnée, ne plus la signaler dans le compte-rendu, positif ou négatif. La référence de
  49 bpm (fin août, vacances) n'était de toute façon pas fiable comme ligne de base — inutile de continuer
  à commenter des écarts par rapport à un chiffre qu'on sait déjà faux. **Reprendre uniquement quand Romain
  confirme qu'il porte sa montre en continu** (attendu fin septembre / courant octobre) : à ce moment,
  redéfinir `fc_repos` sur la moyenne des 2-3 premières semaines de port continu (vie normale, hors
  vacances), reprendre l'alimentation de `fc_repos_serie`, et réactiver un vrai seuil d'alerte (+7 bpm
  au-dessus de cette nouvelle référence).
- **Allure des footings** : le problème n°1 de Romain est de courir ses sorties faciles trop vite
  (5:26/km au lieu de 6:00-6:30). Si l'allure moyenne hebdomadaire ne descend pas, le dire.
