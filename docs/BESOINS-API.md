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

### ✅ RÉSOLU — Changer son mot de passe
`PATCH /me/password` existe maintenant et fonctionne exactement comme
documenté (401 mot de passe actuel incorrect, 400 validation, 200 avec
message de succès) — vérifié en direct contre la prod. Branché dans
`/espace` (`lib/api.ts#changePassword`).

### ✅ RÉSOLU — Soutenir le signalement d'un autre habitant (F52)
`GET /messages/public` est désormais documentée dans `docs/API.md`
(champs `supportCount`, `supportedByMe`, `isMine`). **Pas encore
déployée en prod** au moment de ce test (`404 Cannot GET
/messages/public` constaté en direct le 2026-10-04) — nouvelle page
`/espace/signalements` déjà branchée dessus, affiche une erreur propre
en attendant (pas de crash). Bouton « Soutenir » masqué et remplacé par
« C'est votre signalement » quand `isMine` est vrai.

### Toujours bloqué — Notification de nouvelle connexion depuis un appareil inconnu (F54)
Re-vérifié le 2026-10-04 dans le code source backend
(`notifications.service.ts`) : toujours aucune notification de type
« nouvelle connexion ». Inchangé depuis le dernier passage.

### Nouveau — `PATCH /me` ne permet pas de modifier le prénom/nom
Le scénario « Mon espace et mon profil » (section 3) attend de pouvoir
modifier prénom, nom, quartier, langue et vulnérabilité. Le contrat
actuel de `PATCH /me` n'accepte que `district`, `preferredLanguage` et
`isVulnerable` — aucun champ pour `firstName`/`lastName`. Pas de route
alternative trouvée. Le formulaire de profil ne peut donc proposer que
ces trois champs en attendant une extension du contrat.

### Nouveau — Pas de filtre sur « Mes demandes » (F26)
Le scénario demande une liste de demandes « filtrable » par statut/type
dans `/espace`. Ceci est réalisable **entièrement côté front**
(les données sont déjà dans `GET /messages/mine`) — identifié mais pas
encore construit, faute de temps avant le gel de ce soir.

Deux besoins restent réalisables côté front seul, désormais construits :

- **F55 / F56 — export de mes données et récapitulatif de mes
  demandes** : fait, vérifié (voir `docs/DEMANDES.md`).
- **Liste de démarrage pour un nouveau citoyen** : fait, avec un bug
  corrigé ce soir (voir `docs/DEMANDES.md`).
