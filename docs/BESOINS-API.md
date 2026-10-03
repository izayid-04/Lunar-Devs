# Besoins API — écarts constatés

Routes documentées dans `docs/API.md` (dépôt `api-lunar-devs`) mais dont
le comportement réel en prod diffère de ce qui est décrit, constatés en
branchant le front. Pas des bugs qu'on peut corriger côté front — à
remonter au backend.

## ⚠️ Sécurité — `GET /appointments/slots` expose le hash du mot de passe de l'agent

Testé en prod le 2026-10-03 (`curl
".../appointments/slots?service=mairie-de-nova-terra"`, endpoint public,
sans authentification) : chaque créneau renvoie l'objet `agent` complet
tel que stocké en base, **`passwordHash` inclus** (`"passwordHash":
"$2b$10$..."`). N'importe qui peut récupérer le hash bcrypt du compte
agent sans être connecté. À corriger en urgence côté backend (ne
renvoyer que `id`/`firstName`/`lastName` dans la sérialisation de ce
endpoint). Le front (`lib/api.ts`, type `AppointmentSlot`) ne déclare et
n'affiche volontairement que `firstName`/`lastName`, mais le champ
sensible reste présent dans la réponse HTTP brute tant que le backend
n'est pas corrigé.

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

## Gestion des comptes agents — route manquante (F33/F34, page `/admin`)

`docs/API.md` expose `GET /agent/citizens` et `PATCH
/agent/citizens/:id/status`, mais cette dernière route interdit
explicitement de cibler un compte agent ou admin : *"Un agent ou
administrateur ne peut jamais modifier un compte agent ou admin via
cette route (403 Forbidden)"*. Il n'existe donc aujourd'hui aucune route
pour que l'admin liste, active/désactive ou supprime un compte **agent**
(seuls les comptes citoyens sont gérables). La page `/admin` ne peut pas
proposer cette fonction en attendant une route dédiée côté backend
(ex. `GET /admin/agents`, `PATCH /admin/agents/:id/status`).
