# Besoins API — écarts constatés

Routes documentées dans `docs/API.md` (dépôt `api-lunar-devs`) mais dont
le comportement réel en prod diffère de ce qui est décrit, constatés en
branchant le front. Pas des bugs qu'on peut corriger côté front — à
remonter au backend.

## ✅ RÉSOLU — Sécurité : `GET /appointments/slots` exposait le hash du mot de passe de l'agent

Constaté en prod le 2026-10-03 : chaque créneau renvoyait l'objet `agent`
complet, `passwordHash` bcrypt inclus, sur un endpoint public sans
authentification. **Re-testé le même jour, plus tard** : le backend ne
renvoie désormais que `id`/`firstName`/`lastName`/`role` dans `agent` —
corrigé côté API. Gardé ici pour mémoire.

## ✅ RÉSOLU — `GET /services` : champs Bloc 4 absents en prod (F28, F32, F45, F46)

Le contrat documente `category`, `address`, `latitude`, `longitude`,
`featured`, `isEmergency` sur chaque service. Constaté absent en prod le
2026-10-03 (premier passage). **Re-testé le même jour, plus tard** : tous
ces champs sont désormais présents et corrects sur les 8 services réels
(ex. Hôpital Étoile du Sud : `featured: true`, `isEmergency: true`,
`address`, `latitude`/`longitude`). Le tri prioritaire, le filtre
catégorie et le bouton « Urgences » déjà codés dans
`app/districts/districts-content.tsx` s'activent donc maintenant
automatiquement, sans changement front nécessaire.

Note : `latitude`/`longitude` sont renvoyés en chaînes de caractères
(ex. `"-11.7185000"`), pas en nombres JSON — `lib/api.ts` (`Service`) a
été corrigé en conséquence (`string` plutôt que `number`). Ces deux
champs ne sont pour l'instant pas affichés (la fiche service renvoie
seulement vers le quartier dans `/districts`, pas vers une carte
géographique précise) — à exploiter dans un futur chantier carte.

## ✅ RÉSOLU — `GET /services?emergency=true` ne répondait pas (timeout)

Constaté en prod le 2026-10-03 (premier passage) : timeout après plus de
2 minutes. **Re-testé le même jour, plus tard** : répond normalement
(`200`, liste filtrée correcte). Le front n'appelle de toute façon
jamais ce paramètre (filtre `isEmergency` appliqué côté client sur la
liste déjà chargée, par prudence) — aucun changement nécessaire.

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

## Écarts trouvés en vérifiant `docs/SCENARIOS.md` (2026-10-03)

Confrontation du front au cahier de scénarios (section « Mon espace et
mon profil », « Inscription et connexion », « Demandes et signalements »).
Trois besoins n'ont **aucune route correspondante** dans `docs/API.md`,
donc impossibles à construire côté front en attendant :

- **Changer son mot de passe** (scénario « Sécurité », section 3) : pas
  de route `PATCH /me/password` (ou équivalent) dans le contrat. Seul
  `DELETE /me` accepte un mot de passe (pour confirmer la suppression),
  rien pour le modifier.
- **Notification de nouvelle connexion depuis un appareil inconnu**
  (F54, section 2) : absent du code source backend (recherché dans
  `notifications.service.ts` — seuls `alert`, `announcement`,
  `appointment_reminder`, `demande_statut` génèrent des notifications).
- **Soutenir le signalement d'un autre habitant** (F52, section 6) :
  `GET /messages/mine` et `GET /messages/mine/:id` ne renvoient **que**
  les messages du citoyen connecté (confirmé par le contrat : 404 si le
  message "n'appartient pas au citoyen connecté"). Il n'existe aucune
  route publique ou citoyenne listant les signalements des autres
  habitants. `POST /messages/:id/support` ne peut donc s'exercer
  aujourd'hui que sur ses **propres** demandes — ce qui contredit le
  scénario ("impossible de soutenir sa propre demande"). Front corrigé
  pour ne plus afficher de bouton de soutien actionnable sur
  `/espace/demandes/[id]` (affiche seulement le compteur), en attendant
  une route de découverte côté backend (ex. `GET /messages/public` ou
  `GET /messages?status=&supported=`).

Deux besoins sont réalisables **côté front seul**, sans route
supplémentaire, en combinant des endpoints déjà disponibles — pas
encore construits,à prioriser si le temps le permet :

- **F55 / F56 — export de mes données et récapitulatif de mes
  demandes** : toute la donnée existe déjà (`GET /me`, `GET
  /messages/mine`, `GET /appointments/mine`, `GET
  /privacy/inquiries/mine`) ; il suffit de l'agréger et de proposer un
  téléchargement (texte/HTML lisible) côté client.
- **Liste de démarrage pour un nouveau citoyen** (compléter profil /
  trouver un service / envoyer une première demande, chaque étape
  cochée automatiquement) : calculable à partir de
  `user.profileCompleted`, `GET /messages/mine` et de l'historique de
  navigation — pas de route backend nécessaire.
