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

### ✅ FAIT — Filtre sur « Mes demandes » (F26)
Réalisé entièrement côté front (les données sont déjà dans `GET
/messages/mine`, aucune route supplémentaire) : recherche par référence
ou mot-clé, filtre par statut, filtre par type. Voir `docs/DEMANDES.md`.

Tous les besoins réalisables côté front seul sont désormais construits :

- **F55 / F56 — export de mes données et récapitulatif de mes
  demandes** : fait, vérifié (voir `docs/DEMANDES.md`).
- **Liste de démarrage pour un nouveau citoyen** : fait, avec un bug
  corrigé ce soir (voir `docs/DEMANDES.md`).
- **F26 — filtres sur « Mes demandes »** : fait (voir ci-dessus).

## ⚠️ URGENT — Les 4 nouveaux modules (F65-F68, F74, F76) renvoient `500` en prod

Testé en direct le 2026-10-04 contre
`https://api.lunardevs.lescomores.webcup.hodi.cloud`, toutes les
routes documentées dans `docs/API.md` pour ces modules :
- `GET /projects` → `500 Internal server error`
- `GET /projects/1` → `500`
- `GET /partners` (avec ou sans `?district=`) → `500`
- `GET /ideas/mine` (avec un citoyen authentifié valide) → `500`
- `POST /ideas` (corps conforme au contrat) → `500`
- `POST /services/1/feedback` (corps conforme au contrat) → `500`

Les 4 routes échouent systématiquement, avec le même message générique
NestJS (`Internal server error`, sans détail) — à l'inverse d'un `404`
(route absente) ou d'un `403`/`401` (droits), ce qui suggère une cause
commune côté backend (migration de base de données pas appliquée en
prod, table manquante, ou erreur de configuration), plutôt que 4 bugs
indépendants. Le front est néanmoins construit et déployé en
anticipation : chaque appel affiche le message d'erreur générique
("Impossible de récupérer..."/"Impossible d'enregistrer...") de façon
propre, sans jamais planter une page, conformément à la règle commune
du cahier de scénarios. Front à re-tester dès que ces routes répondront
`200` en prod.

## Écarts — données manquantes sur `GET /projects/:id` et `GET /services`

Deux routes `GET` existantes ne renvoient pas certaines informations
nécessaires pour afficher correctement « ce que le citoyen a déjà
fait », ce qui oblige le front à mémoriser la donnée localement
(`localStorage`, par navigateur, non partagé entre appareils) plutôt
que de la relire depuis l'API :

- **`GET /projects/:id`** : ne renvoie pas le vote déjà déposé par le
  citoyen connecté sur une consultation (pas de `myResponse` ni
  `hasResponded`). Impossible de savoir, à la relecture de la page, si
  le citoyen a déjà répondu ni avec quelle option — nécessaire pour la
  règle « résultats affichés après avoir répondu » et « possibilité de
  modifier son avis » du cahier de scénarios.
- **`GET /services`** et **`GET /services/:slug`** : ne renvoient ni
  `averageRating`, ni `totalFeedbacks`, ni l'avis déjà déposé par le
  citoyen connecté — ces champs n'existent que dans la réponse de
  `POST /services/:id/feedback`. Conséquence : la fiche service ne peut
  afficher une moyenne/un nombre d'avis qu'immédiatement après que le
  citoyen vient lui-même de voter, jamais de façon permanente.

Suggestion : ajouter ces champs calculés sur les `GET` correspondants
(`myResponse` par consultation, `averageRating`/`totalFeedbacks` par
service), et si possible le propre avis déjà déposé par le citoyen.
