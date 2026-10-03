# Besoins API — écarts constatés

Routes documentées dans `docs/API.md` (dépôt `api-lunar-devs`) mais dont
le comportement réel en prod diffère de ce qui est décrit, constatés en
branchant le front. Pas des bugs qu'on peut corriger côté front — à
remonter au backend.

## `GET /services` — champs Bloc 4 absents en prod (F28, F32, F45, F46)

Le contrat documente `category`, `address`, `latitude`, `longitude`,
`featured`, `isEmergency` sur chaque service. En prod
(`https://api.lunardevs.lescomores.webcup.hodi.cloud/services`), **aucun**
des 8 services réels ne porte ces champs — seuls `availability`,
`availabilityMessage`, `availableAgainAt`, `alternative` (F38) sont bien
présents et corrects. Probablement une migration/un seed pas encore
déployé en prod. Bloque la mise en avant des services (F28), la carte
avec géolocalisation (F45) et le bouton Urgences (F46) tels que décrits.

## `GET /services?emergency=true` — ne répond pas (timeout)

Testé directement en prod le 2026-10-03 : la requête ne retourne jamais
(`curl` tué après authentiquement >2 min sans réponse, pas de 200/erreur).
`?q=hopital` fonctionne normalement (200). Probablement lié au point
ci-dessus (filtre sur un champ absent des données). À vérifier côté
backend avant de brancher le bouton "Urgences" (F46).
