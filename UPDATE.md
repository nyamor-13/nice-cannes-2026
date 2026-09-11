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

2. **Recalculer `window.ACTIVITES`** (liste des activités individuelles réelles, pas seulement
   l'agrégat hebdo) — c'est ce qui permet d'afficher "Ce que tu as réellement fait" sur les pages
   Semaine en cours/prochaine et Plan complet, séance par séance, à côté du plan prévu.
   - Une entrée par activité Strava des 21 derniers jours : `{date, type, nom, duree_min}`
     + `km`/`allure` pour les courses, `m` pour la natation (jamais d'allure en min/km pour la nage,
     ça n'a pas de sens), `fc` si disponible.
   - `type` ∈ `"run"`, `"strength"`, `"swim"` (mêmes clés que `ICO` dans `app.js`).
   - Garder une fenêtre glissante de 21 jours (comme la requête Strava) pour ne pas faire grossir
     le fichier indéfiniment — pas besoin d'historique complet ici, seulement le récent.
   - **Pour chaque course (`type:"run"`), ajouter `"qual": true` si c'est une séance de qualité**
     (VO2max, côtes, seuil, fractionné, ou un bloc à allure marathon — identifiable par l'archétype
     `data-plan.js` correspondant à la séance du plan) — omettre le champ (ou `false`) pour un
     footing normal. **Indispensable** : c'est ce qui permet à l'app de calculer une allure de
     footing propre (`footingStats()` dans `app.js`) et de classer les sorties par zone
     (`zoneRecentRuns()`) sans mélanger séances structurées et sorties faciles. Sans ce marquage,
     une séance de côtes ou de VO2max fausse le diagnostic "allure de récup" et peut être
     classée à tort dans une zone d'endurance alors que son allure moyenne ne représente rien de
     réel (elle mélange échauffement, fractions et récupération).
   - **Pour les séances `type:"strength"`** : appeler `get_strength_workout_details` sur l'activité
     et ajouter un champ `exercices` : `[{nom, sets:["25 kg × 10", "× 15", ...]}]` (un objet par
     exercice, regroupant tous ses sets dans l'ordre — voir le format déjà utilisé dans le fichier).
     Formatte chaque set en `"<poids> × <reps>"` si un poids existe, sinon juste `"× <reps>"`.
     C'est ce qui alimente le "Détail des exercices" dépliable sous chaque séance de renfo dans l'app.
     ⚠️ Romain a deux machines de leg press différentes (une inclinée/quadriceps à poids élevé
     190-210 kg, une horizontale/ischios-fessiers à poids affiché faible 25-50 kg) — ne jamais
     s'étonner d'un poids très différent d'une séance à l'autre sur ce même nom d'exercice.

3. **Mettre à jour `window.MATERIEL`** (usure du matériel) :
   - Appeler `get_gear` (filtré sur `gear_types:["Shoe"]`), repérer la paire nommée
     « Marathon Nice - Cannes » (c'est celle que Romain utilise pour ce bloc), et mettre à jour :
     `window.MATERIEL = {"chaussure": {"nom": "...", "marque": "...", "modele": "...", "km": <total_distance/1000>}}`.
   - Pas d'alerte à générer nous-mêmes dans le compte-rendu pour ce chiffre (l'app calcule déjà un
     verdict dynamique selon le kilométrage) — sauf si le total dépasse 500 km, où ça vaut le coup
     de le signaler à Romain une fois, pour qu'il pense à surveiller l'amorti avant le marathon.

4. **Recalculer les agrégats hebdomadaires** (semaines du lundi au dimanche) :
   - `km`, `h`, `dplus`, `sorties`, `natations`, `renfo`
   - `longest` : plus longue sortie de la semaine
   - `allure` / `allure_min` : temps total ÷ distance totale
   - `fc` : moyenne pondérée par le temps, sur les sorties qui ont une FC
   - `eff` : **indice d'efficience** = `(km × 1000) / (fc × minutes)` — mètres par battement.
     C'est le KPI de progression le plus important : il doit monter.
   - `charge` : somme du champ `relative_effort` de Strava (déjà renvoyé par `list_activities`,
     aucun appel supplémentaire) sur toutes les activités de la semaine, tous types confondus.
   - `ctl` / `atl` / `tsb` : **charge chronique / aiguë / forme**, façon TrainingPeaks — calculées
     nous-mêmes (pas de "Condition physique" Strava/Garmin, ces formules sont propriétaires et
     non exposées par les connecteurs). Méthode : moyenne mobile exponentielle jour par jour sur
     `relative_effort` (0 les jours de repos) depuis le dernier point connu :
     `ctl = ctl_prec + (charge_du_jour − ctl_prec) / 42` (fenêtre ~42 j)
     `atl = atl_prec + (charge_du_jour − atl_prec) / 7` (fenêtre ~7 j)
     `tsb = ctl − atl`.
     Repartir des dernières valeurs `ctl`/`atl` connues (dernière semaine de `HEBDO`) et faire
     avancer le calcul jour par jour jusqu'à aujourd'hui (pas seulement semaine par semaine) avant
     d'enregistrer le point hebdomadaire — sinon la moyenne mobile perd sa précision sur les jours
     de repos. Stocker le résultat du dernier jour de chaque semaine dans `HEBDO`.
   - `aero_min` / `anaero_min` (uniquement si des tours avec FC sont disponibles pour au moins une
     course de la semaine, via `get_activity_performance`) : pour chaque tour, additionner sa durée
     dans `aero_min` si `avg_hr < 163` (zones Z1-Z3, cf `data-plan.js` → `ZONES.Z3.fc`), sinon dans
     `anaero_min` (Z4-Z5). Ne pas chercher à reconstituer ces champs pour les semaines passées où on
     n'a pas les tours — les laisser absents plutôt que d'inventer une valeur.
   - `sl_allure_min` / `sl_allure` : allure de la sortie longue de la semaine **uniquement**
     (repérer dans `window.ACTIVITES` la course la plus longue de la semaine parmi celles qui ne
     sont pas `qual:true`) — jamais la moyenne toutes-sorties, qui n'a pas de sens pour juger la
     progression sur ce format précis (Romain l'a demandé le 10 sept, l'allure moyenne "toutes
     sorties" étant jugée peu informative). Absent si aucune sortie longue cette semaine.
   - `fc_footing` / `eff_footing` : FC moyenne et indice d'efficience calculés **uniquement sur les
     footings** de la semaine (mêmes activités que `footingStats()` dans `app.js` — `type:"run"`,
     `qual` absent ou `false`). Objectif : isoler l'adaptation cardiaque réelle de l'effet mécanique
     "les séances de qualité se durcissent donc la FC moyenne monte", qui rendait l'ancien indicateur
     "FC moyenne toutes sorties" trompeur. Absent si aucun footing cette semaine (semaine 100 %
     qualité, ça arrive — voir semaine du 7 sept).
   - `incline_min` : minutes cumulées passées à ≥1 % d'inclinaison sur la semaine, **dénivelé GPS et
     tapis confondus** — remplace/complète `dplus` (dénivelé GPS seul), qui reste à 0 sur toutes les
     séances de côtes faites sur tapis puisque Strava ne capte aucune élévation en intérieur. Pour une
     course en extérieur avec du D+, `incline_min` peut rester à 0 même si `dplus` est non nul (une
     côte courte et raide compte peu en minutes) — les deux indicateurs se complètent, pas l'un ne
     remplace l'autre. Pour une séance de côtes sur tapis, calculer `incline_min` à partir du
     protocole exact que Romain communique (ex. "2×1'30 + 6×2' à 6 %..." → additionner la durée de
     chaque répétition à ≥1 %, **sans compter les récupérations à 0 %**). Sans ce détail communiqué
     par Romain, laisser le champ absent plutôt que de deviner un temps.

5. **Garmin** (optionnel, best-effort) — si Chrome est ouvert et connecté, via l'extension :
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

6. **Réécrire `data-strava.js`** en respectant exactement ce format :

```js
window.MAJ       = {"date":"<ISO local>","source":"Strava","garmin":true|false};
window.ACTIVITES = [{"date":"AAAA-MM-JJ","type":"run","nom":"Course à pied le matin",
                     "duree_min":49.1,"km":9.56,"allure":"5:08"},
                    {"date":"AAAA-MM-JJ","type":"strength","nom":"Renfo","duree_min":60.0,
                     "exercices":[{"nom":"Leg Press","sets":["25 kg × 10","50 kg × 10"]}]}];
window.GARMIN    = {"vo2max":52,"fc_repos":49,"fc_repos_serie":[{"d":"AAAA-MM-JJ","v":49}],
                    "predictions":{"5k":"","10k":"","semi":"","marathon":""},
                    "sommeil":null,"vfc":null};
window.HEBDO     = [{"lundi":"AAAA-MM-JJ","km":0,"h":0,"dplus":0,"sorties":0,"natations":0,
                     "renfo":0,"longest":0,"allure":"5:30","allure_min":5.5,"fc":140,"eff":1.3,"nat_m":0,
                     "charge":0,"ctl":0,"atl":0,"tsb":0,"aero_min":null,"anaero_min":null,
                     "sl_allure_min":null,"sl_allure":null,"fc_footing":null,"eff_footing":null,
                     "incline_min":null}];
window.TOTAUX    = {"km":0,"h":0,"sorties":0,"natations":0};
window.MATERIEL  = {"chaussure":{"nom":"Marathon Nice - Cannes","marque":"HOKA","modele":"Clifton 11","km":56.6}};
window.ANALYSES  = {"w4s0":{"date":"AAAA-MM-JJ","conclusion":"conforme","texte":"..."}};
```

`window.ANALYSES` est l'objet qui publie l'analyse d'adaptation (étape suivante) **directement dans
l'app**, sous un second bloc dépliable "Analyse de la séance" à côté du bloc "Objectif" existant sur
la séance concernée — plus seulement dit dans le chat après la sync. Clé = `w<numéro semaine><index
séance>` (même format que `sid()` dans `app.js`, ex. `w4s0` = semaine 4, séance d'index 0 dans
`data-plan.js`). Il faut donc identifier à la main quelle séance du plan correspond à l'activité
Strava analysée (par le type et la place dans la semaine, comme pour l'étape 8 ci-dessous).
`conclusion` ∈ `"conforme"` (aucun ajustement), `"ajuste"` (une modif a été proposée et acceptée),
`"surveiller"` (écart à surveiller sans agir tout de suite). Ne jamais écraser une entrée existante
avec du texte inventé — si aucune activité ne correspond clairement à une séance de qualité cette
semaine, ne rien ajouter plutôt que de deviner.

7. **Vérifier** que le fichier est du JavaScript valide avant de le laisser en place :
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

**Publier aussi cette analyse dans `window.ANALYSES`** (voir format à l'étape 6) — ce n'est plus
seulement un texte dans le chat, Romain veut le retrouver directement sous la séance concernée dans
l'app, via un second bloc dépliable "Analyse de la séance" à côté du bloc "Objectif" existant. Rédige
`texte` dans le même style que ce que tu dirais dans le chat (allure/FC réelles vs cible, conclusion
en gras), 3-6 phrases. Une séance de qualité analysée = une entrée dans `window.ANALYSES`, sans
exception, même quand la conclusion est "rien à changer".

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
