# Demandes — suivi par bloc

Suivi des demandes traitées côté front, et des pages/fichiers qui y
répondent. Mis à jour à chaque étape du branchement sur l'API réelle
(contrat : `docs/API.md` du dépôt `api-lunar-devs`).

## Bloc 1 — Socle (D01, D03, D08, D09)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D01** | Inscription d'un compte habitant. | `/inscription`, `registerRequest` (`lib/api.ts`) | ✅ Fait, vérifié contre l'API réelle |
| **D03** | Connexion + espace personnel identifié. | `/connexion`, `/espace`, `AuthProvider` (`lib/auth-context.tsx`) | ✅ Fait, vérifié contre l'API réelle |
| **D08** | Distinguer les profils (citizen / agent / admin). | `Me.role` (`lib/api.ts`), `components/dock-nav.tsx`, `components/app-sidebar.tsx` | ✅ Fait |
| **D09** | Limiter les outils sensibles aux profils autorisés. | `components/protected.tsx` (via `DashboardLayout`) | ✅ Fait (expérience front — la vraie protection est côté API) |

Jeton stocké dans `localStorage` (clé `novaterra.token`), relu et validé
via `GET /me` au chargement de l'app. Déconnexion : `AuthProvider.logout()`
vide le jeton et l'état utilisateur.

Re-vérifié de bout en bout le 2026-10-03 contre
`https://api.lunardevs.lescomores.webcup.hodi.cloud` : inscription,
connexion, et navigation par rôle (dock + sidebar) — tout utilise déjà le
vrai contrat, aucune donnée factice sur ce périmètre.

## Bloc 2 — Messages des habitants (D04, F22)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F22** (côté agent) | Voir les demandes entrantes, identifier leur état, filtrer par statut, le faire progresser. | `/agent` (`fetchAgentMessages`, `patchMessageStatus` dans `lib/api.ts`) | ✅ Fait |
| **D04 / D16 / F26** (côté citoyen) | Transmettre un message aux services, écran de confirmation avec la référence, historique « Mes demandes ». | `/espace` (`postMessage`, `fetchMyMessages` dans `lib/api.ts`) | ✅ Fait |

Côté agent : `GET /agent/messages?status=` avec onglets Tous/Nouveaux/En
cours/Traités (badge de compte sur chaque onglet, toujours global comme
documenté dans `docs/API.md`), `PATCH /agent/messages/:id/status` pour
faire progresser un dossier (cycle nouveau → en_cours → traité).

Côté citoyen : dans `/espace`, dialogue « Nouveau message » (catégorie,
objet 3-150 caractères, message 10-5000 caractères, validés côté client
avant l'appel) → `POST /messages`. En cas de succès, le dialogue bascule
sur un écran de confirmation affichant la référence (ex. `NT-0002`), puis
l'historique « Mes demandes » (`GET /messages/mine`) se rafraîchit. Les
anciennes « démarches » fictives (quotas d'énergie, Maglev, etc.) ont été
retirées.

Vérifié de bout en bout contre l'API réelle avec le code exact de
`lib/api.ts` : inscription d'un compte de test, envoi d'un message
(`POST /messages` → 201 avec référence), relecture via
`GET /messages/mine`.

## Bloc 3 — Espace agent + API Webcup (D19, F22, D17)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D19** | Interface distincte pour les agents, informations de l'API Webcup. | `/agent` (`fetchWebcupRequests`) | ✅ Fait |
| **D17 / F22** | Tableau de bord agent avec compteur de demandes en attente bien visible. | `/agent` (`fetchAgentDashboard`) | ✅ Fait — « en attente » = `nouveau + en_cours` |

Le flux Webcup (`GET /agent/webcup/requests`) est maintenant affiché
proprement (session en cours, compte à rebours de la prochaine vague,
tableau des demandes avec code/demandeur/message/difficulté/XP), d'après
un exemple réel capturé en prod par l'agent backend. Si la forme du
payload venait à changer (API tierce, aucune garantie contractuelle),
`parseWebcupPayload` retombe sur un affichage JSON brut plutôt que de
planter.

## Bloc 4 — Contenu de la ville (D05, D06, F28, F32)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D05 / F28 / F32** | Services municipaux par quartier, page détail, recherche et filtres. | `/districts`, `/services/[slug]` (`fetchServices`, `fetchService`) | ✅ Fait |
| **D06** | Annonces municipales, publiques + gestion agent. | `/annonces`, `/annonces/[id]`, `/agent/annonces` | ✅ Fait |

`/districts` liste les 8 services réels (`GET /services`), groupés par
leurs 5 quartiers réels (Centre-Ville, Faubourg Est, Hauts de Nova, Port
Stellaire, Quartier des Dunes — champ `district`, prêt pour une future
carte). Recherche (nom/description) et filtre par quartier, tous deux
côté client sur les données déjà chargées (8 services, pas besoin d'appel
serveur par filtre). Chaque service ouvre `/services/[slug]`
(`GET /services/:slug`, rendu côté serveur, `notFound()` si le slug
n'existe pas — testé contre un slug réel et un slug inexistant).

`/annonces` (liste publique) et `/annonces/[id]` (détail) utilisent
`GET /announcements`. `/annonces` est forcée en rendu dynamique
(`export const dynamic = "force-dynamic"`) : sans ça, Next l'aurait figée
au moment du `next build` (constaté en pratique — la liste se serait
désynchronisée dès la première annonce créée/modifiée après coup). Gestion
complète (créer/modifier/supprimer) dans `/agent/annonces`, réservée
agent/admin, reliée à `POST`/`PATCH`/`DELETE /announcements/:id`. Lien
ajouté dans le dock public (« Annonces ») et dans la barre latérale agent
(remplace un sous-lien factice qui pointait déjà vers `/agent`).

Vérifié contre l'API réelle : lecture publique, et confirmation qu'un
compte `citizen` reçoit bien `403` sur `POST /announcements` (la vraie
protection est côté API). Le succès de création/modification/suppression
par un compte `agent`/`admin` n'a pas pu être re-testé en direct (pas
d'identifiants de démo disponibles au moment de cette étape) — le code
suit exactement le même schéma (headers, gestion d'erreur) que
`postMessage`/`patchMessageStatus`, déjà vérifiés de bout en bout.

Les 6 « dômes » fictifs précédents (population, pression, énergie
imaginaires) ont été entièrement retirés.

## Fil d'Ariane (D15)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D15** | Fil d'Ariane sur les pages internes. | `components/dashboard-layout.tsx`, `/services/[slug]`, `/annonces/[id]` | ✅ Fait |

`DashboardLayout` (utilisé par `/dashboard`, `/espace`, `/agent`,
`/agent/annonces`, `/admin`) affichait un fil d'Ariane **figé en dur**
(« Nova Terra > Cockpit Urbain ») identique sur toutes les pages, qu'il
s'agisse de l'espace citoyen, agent ou admin. Il reflète maintenant le
chemin réel (`usePathname()`), ex. « Nova Terra > Agent > Annonces » sur
`/agent/annonces`. Les pages de détail publiques (`/services/[slug]`,
`/annonces/[id]`) ont aussi leur propre fil d'Ariane (ex. « Nova Terra >
Services > Bibliothèque Municipale »), remplaçant le simple bouton
« retour » qu'elles avaient avant.

Au passage, le badge « Dôme Alpha Stable (1013 hPa) » (donnée factice,
sans lien avec une route API) a été retiré de l'en-tête du dashboard.

## Pages existantes non reliées au contrat API

- `/dashboard` : page d'accueil post-connexion générique (accessible à
  tous les rôles), entièrement illustrative (qualité de l'air, réseau
  électrique, bouclier...) — aucune route API ne couvre ce contenu. Pas
  dans le périmètre des blocs ci-dessus ; non touché pour l'instant.
- `components/home/district-map.tsx` (utilisé sur l'accueil `/`) : carte
  décorative des 6 « dômes » avec services fictifs par quartier au clic —
  pas dans le périmètre des étapes ci-dessus (page d'accueil, pas
  `/districts`), donc pas touchée. À remplacer par les vraies données de
  `GET /services` si l'accueil doit lui aussi perdre ses données factices.
- `/admin` : contenu illustratif (registre des comptes, sécurité, audit)
  — aucune route API admin au-delà de `/admin/ping` n'existe à ce jour.
  Rôle correctement protégé (`admin` uniquement), contenu non branché.

## Bloc Accessibilité — F21, F23, F24 (1 300 XP)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F21** | Options d'accessibilité avec au moins 3 niveaux de taille de texte sans chevauchement. | `lib/accessibility-context.tsx`, `components/accessibility-panel.tsx`, `app/globals.css` (`text-size-normal`, `large`, `xlarge`) | ✅ Fait |
| **F23** | Mode contraste élevé (WCAG AAA ratio > 7:1) résolvant la lisibilité de la couleur d'action sur fond clair/sombre. | `app/globals.css` (`.high-contrast`), `components/accessibility-panel.tsx` | ✅ Fait |
| **F24** | Accessibilité clavier & lecteurs d'écran : lien « Aller au contenu », landmarks HTML5, aria-labels, aria-describedby reliés aux erreurs formulaires, focus visible. | `app/layout.tsx`, `app/inscription/page.tsx`, `app/connexion/connexion-form.tsx`, `components/dock-nav.tsx`, `components/dashboard-layout.tsx` | ✅ Fait |

Panneau d'accessibilité accessible partout via l'icône oeil dans le dock flottant et l'en-tête du dashboard. Rétention des préférences dans `localStorage`. Mode mouvement réduit forcé également disponible. Focus clavier épais et visible partout.

### Passe de vérification F21 / F24 sur l'ensemble du site (achevée) :
- **Boutons & liens sans texte visible** : tous dotés d'un `aria-label` descriptif en français (ex. `DockNav`, `ModeToggle`, `SidebarTrigger`, boutons d'action sur `/agent/annonces` et `/agent`).
- **Descriptions textuelles alternatives** : toutes les balises `Image` disposent d'un `alt` approprié ; le globe 3D interactif (`components/home/planet-showcase.tsx`) et le carrousel orbital (`components/home/curved-planet-carousel.tsx`) disposent de zones `<div className="sr-only" aria-live="polite">` pour restituer l'état et le contenu aux lecteurs d'écran.
- **Landmarks HTML5** : unique `<main id="main-content" tabIndex={-1}>` dans `app/layout.tsx` englobant toutes les pages ; suppression des balises `<main>` imbriquées redondantes ; balises `<header>`, `<nav>`, `<footer>` clairement isolées.
- **Hiérarchie des titres** : exactement un seul `h1` par page (accueil, inscription, connexion, espace citoyen, espace agent, espace admin, services, annonces, à propos, districts, status), suivi de niveaux d'en-têtes logiques (`h2`, `h3`).
- **Annonces dynamiques (`aria-live`)** : confirmations de soumission formulaires (référence `NT-XXXX` dans `/espace`), erreurs d'authentification (`connexion-form.tsx`), et erreurs de validation de champ (`inscription/page.tsx`) connectées via `aria-live` / `role="status"` / `role="alert"`.
- **Modales & dialogues** : les dialogues Radix (`Dialog`, `AlertDialog`) capturent et restaurent automatiquement le focus à la fermeture.

## Vague 6 — Inclusion & Accessibilité avancée (D13, F41, F42, F43, F44, D20 — 3 720 XP)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D13** | Remplacement du jargon dans les libellés de navigation et d'action par des mots simples (« Cockpit » → « Mon espace », « Transmissions » → « Annonces et alertes », « Découvrir le Cockpit » → « Accéder à mon espace »). Infobulles explicatives pour les termes de la colonie (Dôme, Maglev). | `components/dock-nav.tsx`, `components/home/how-it-works.tsx`, `components/home/closing-cta.tsx`, `app/dashboard/page.tsx`, `app/connexion/connexion-form.tsx`, `components/ui/accessible-term.tsx`, `components/home/curved-planet-carousel.tsx` | ✅ Fait |
| **F41** | Tout le site utilisable au clavier seul : ordre de tabulation séquentiel, focus visible partout (`*:focus-visible`), aucun piège clavier, dock navigable et infobulles révélées au focus, alternative au globe sous forme de liste de boutons sélecteurs, carrousel contrôlable avec Précédent/Pause/Suivant et défilement mis en pause au focus. | `components/dock-nav.tsx`, `components/home/curved-planet-carousel.tsx`, `components/home/planet-showcase.tsx`, `app/globals.css` | ✅ Fait |
| **F42** | Formulaires accessibles : libellés visibles avec indication textuelle explicite `(obligatoire)` (pas uniquement un astérisque ou une couleur), résumé d'erreurs en haut (`role="alert"` + `aria-live="assertive"`), champs reliés via `aria-invalid` et `aria-describedby`, attributs `autocomplete` standards (`given-name`, `family-name`, `email`, `new-password`, `current-password`). | `app/inscription/page.tsx`, `app/connexion/connexion-form.tsx`, `app/espace/page.tsx` | ✅ Fait |
| **F43** | Aucune information transmise uniquement par la couleur : statuts et gravités accompagnés d'icônes et de textes explicites, liens textuels soulignés dans le contenu (`text-decoration: underline`), messages d'erreur enrichis d'icônes `AlertCircle`. | `app/globals.css`, `app/inscription/page.tsx`, `app/connexion/connexion-form.tsx`, `app/agent/page.tsx`, `app/espace/page.tsx` | ✅ Fait |
| **F44** | Zoom navigateur à 200 % et 400 % (et largeur 320 px) sans défilement horizontal ni chevauchement ni contenu tronqué : `overflow-x: hidden`, césure automatique des textes longs (`overflow-wrap: break-word`), images/canvas `max-width: 100%`, flex/grid responsives. | `app/globals.css`, `app/connexion/connexion-form.tsx`, `components/dock-nav.tsx`, `components/home/curved-planet-carousel.tsx` | ✅ Fait |
| **D20** | Vérification de parcours complets réels (accueil → inscription → connexion → démarche/envoi de message → suivi dans « Mes demandes » → déconnexion) dans l'interface unifiée et accessible sans version séparée. | Parcours utilisateur complet testé et validé | ✅ Fait |

### Comment tester la Vague 6 :
1. **D13 (Langage clair & infobulles)** :
   - Observer le dock de navigation en bas : il affiche « Mon espace » et « Services » au lieu de termes jargonneux.
   - Sur l'accueil `/` et le carrousel : survoler ou tabuler sur les termes « Dôme » et « Maglev » pour voir l'infobulle explicative accessible.
   - Dans le cockpit/dashboard : le bloc d'informations s'intitule « Annonces et alertes municipales ».
2. **F41 (Navigation clavier)** :
   - Naviguer uniquement avec la touche `Tab` / `Shift+Tab` et `Entrée` / `Espace`.
   - Constater le halo de focus bien visible (`outline: 2px solid var(--ring)`).
   - Dans le carrousel panoramique : tabuler sur les boutons « Précédent », « Pause » et « Suivant » pour changer de zone ou figer l'animation.
   - Sur la section Globe 3D : tabuler sur les boutons des différents dômes pour inspecter chaque quartier sans souris.
3. **F42 (Accessibilité des formulaires)** :
   - Aller sur `/inscription`, soumettre le formulaire vide : le résumé global des erreurs apparaît en haut en rouge avec icône, et chaque champ invalide a son message d'erreur avec `aria-invalid="true"`.
   - Constater la mention textuelle explicite `(obligatoire)` sur chaque étiquette.
4. **F43 (Indicateurs non basés sur la seule couleur)** :
   - Vérifier les liens dans les paragraphes : ils sont clairement soulignés.
   - Les badges d'état (Nouveau, En cours, Traité) et alertes comportent du texte et une icône dédiée en plus du code couleur.
5. **F44 (Zoom 200% et 400%)** :
   - Tester avec le zoom navigateur (Ctrl + +) à 200% et 400%, ou régler la vue responsive sur 320px de large : aucun défilement horizontal parasite n'apparaît, tous les textes s'adaptent sans rupture ni chevauchement.
6. **D20 (Parcours complet)** :
   - Inscription d'un citoyen sur `/inscription` → Connexion sur `/connexion` → Envoi d'un message municipal dans `/espace` → Suivi de la référence dans « Mes demandes » → Déconnexion via le dock. Tout fonctionne sur l'interface principale standard sans mode séparé.

## Alertes et Notifications municipales (D18, F29, F30, F31 — 3 080 XP)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D18** | Bandeau d'alerte global visible sur toutes les pages, différencié selon la gravité (`info`, `important`, `urgent`), avec consignes « quoi faire ». | `components/alert-banner.tsx`, `lib/alerts.ts`, `app/layout.tsx`, `components/dashboard-layout.tsx` | ✅ Fait |
| **F29** | Page publique d'historique des alertes avec distinction actives / passées et détail complet d'une alerte avec consignes. | `app/alertes/page.tsx`, `app/alertes/[id]/page.tsx` | ✅ Fait |
| **F30** | Cloche de notifications avec compteur non lues en temps réel, menu déroulant, lien direct vers la ressource et marquage individuel comme lu. | `components/notification-bell.tsx`, `components/dashboard-layout.tsx`, `lib/api.ts` (`fetchNotifications`, `markNotificationAsRead`) | ✅ Fait |
| **F31** | Espace agents : déclenchement, ciblage (tous, quartier, vulnérables), modification et clôture d'alertes. Assistant IA pour générer des recommandations/instructions modifiables avant publication avec états d'erreur clairs. | `app/agent/alertes/page.tsx`, `lib/api.ts` (`generateAiAlertRecommendations`, `createAlert`, `patchAlert`, `terminateAlert`) | ✅ Fait |
| **F26/D06** | Option « Annonce importante » (`isImportant`) dans le formulaire d'annonce pour déclencher automatiquement des notifications citoyennes. | `app/agent/annonces/page.tsx`, `app/annonces/page.tsx`, `lib/api.ts` | ✅ Fait |

### Comment tester les Alertes & Notifications :
1. **Bandeau d'alerte global (D18)** :
   - Visible en haut de toutes les pages publiques et dans le tableau de bord (`DashboardLayout`).
   - Sévérité visuelle adaptée (bleu/accent pour `info`, orange/ambre pour `important`, rouge destructif pour `urgent`).
   - Les alertes urgentes utilisent `role="alert"` pour les lecteurs d'écran et ne peuvent pas être masquées.
   - Les alertes d'info ou importantes disposent d'un bouton de fermeture temporaire par session.
2. **Cloche de notifications (F30)** :
   - Située dans l'en-tête du tableau de bord connecté.
   - Affiche le nombre de notifications non lues en badge rouge contrasté avec `aria-label` descriptif.
   - Clic sur la coche pour marquer comme lu (`PATCH /notifications/:id/read`).
3. **Page publique des alertes (F29)** :
   - Accessible via le dock public (`/alertes`) et le menu latéral.
   - Sépare clairement les alertes en cours et l'historique des alertes clôturées.
   - Page dédiée par alerte `/alertes/[id]` avec fil d'Ariane et encadré dédié pour les instructions.
4. **Espace agent & Recommandations IA (F31)** :
   - Rendez-vous sur `/agent/alertes` (avec un compte agent ou admin).
   - Cliquer sur « Déclencher une alerte », renseigner une situation, puis cliquer sur « Générer des recommandations (IA) ».
   - L'appel `POST /agent/alerts/ai-recommendations` pré-remplit les consignes. L'agent peut relire, éditer et ajuster avant de publier.
   - En cas d'indisponibilité ou timeout de l'IA (codes 502, 503, 504), un message clair s'affiche sans bloquer la saisie manuelle.
   - Bouton « Clôturer » pour clore prématurément une alerte active via `PATCH /alerts/:id/terminate`.
5. **Annonce importante (isImportant)** :
   - Dans `/agent/annonces`, cocher la case « Annonce importante » lors de la création ou modification d'une annonce.




## Rattrapage fonctionnalités backend sans écran — par rentabilité

### 1. F38 — Disponibilité des services

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F38** | Badge de disponibilité (icône + texte), message, date de retour, alternative ; agents : modifier la dispo. | `components/services/availability-badge.tsx`, `components/services/availability-manager.tsx`, `/districts`, `/services/[slug]` | ✅ Fait |

Badge (disponible / en maintenance / indisponible, icône + texte, jamais
la couleur seule) sur les cartes `/districts` et en tête de
`/services/[slug]`. Si indisponible : message, date de retour formatée,
et alternative affichés dans un encart dédié. Les agents/admin voient un
bouton « Modifier la disponibilité » (`PATCH /services/:idOrSlug/availability`)
directement sur la fiche du service.

Vérifié contre l'API réelle : les 8 services en prod portent bien
`availability`/`availabilityMessage`/`availableAgainAt`/`alternative`
(tous actuellement `disponible`/`null`). Voir `docs/BESOINS-API.md` pour
un écart constaté sur ce même endpoint (champs d'un bloc plus tardif
absents en prod) — sans impact sur ce point.

Pas encore de bouton « démarrer une démarche/RDV » à bloquer : les
rendez-vous (point 6 de cette liste) n'existent pas encore côté front. La
vérification de disponibilité sera ajoutée au flux de réservation quand
il sera construit.

### 2. F37 — Sécurité (429, compte verrouillé, audit)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F37** | Message clair sur 429/compte verrouillé ; dernière connexion + échecs dans l'espace citoyen ; tableau « Sécurité » agents. | `lib/api.ts` (`loginRequest`, `fetchMySecurity`, `fetchTargetedAccounts`), `/espace`, `/agent`, `/admin` | ✅ Fait |

`loginRequest` traite spécifiquement `429` (trop de tentatives) et `403`
(compte verrouillé — lit `lockedUntil` dans le corps pour afficher l'heure
exacte de déverrouillage), sans changer le comportement générique des
`403` ailleurs dans l'app. `/espace` affiche désormais une carte «
Sécurité du compte » (`GET /me/security` : dernière connexion, tentatives
échouées récentes). Le tableau « comptes ciblés » (`GET
/agent/security/targeted-accounts`) était déjà câblé sur `/admin` par un
travail précédent mais **absent de `/agent`** alors que l'API l'autorise
pour ce rôle — extrait dans un composant partagé
(`components/security/targeted-accounts-card.tsx`) et ajouté aux deux
pages.

Vérifié contre l'API réelle avec le code exact de `lib/api.ts` :
`GET /me/security` renvoie bien la dernière connexion et l'historique ;
un mot de passe incorrect renvoie le message générique attendu (pas de
fuite d'information).

### Correction prioritaire — D09 : `/dashboard` citoyen, métriques factices retirées

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D09** | Retirer les métriques inventées (énergie, oxygène, dôme…) et les remplacer par de vraies données API. | `app/dashboard/page.tsx`, `lib/api.ts` (ajout du bloc rendez-vous) | ✅ Fait |

Supprimé entièrement : les cartes KPI « Qualité Atmosphérique », « Réseau
Électrique Fusion », « Dôme et Bouclier Défensif », « Citoyens
Enregistrés » (chiffres inventés), le bouton factice « Purifier »/état
`purifying`, le bloc télémétrie « Secteurs Urbains & Surveillance des
Dômes », et les cartes « transmissions municipales en direct ». Remplacé
par 4 cartes alimentées par l'API réelle : alertes actives concernant
l'utilisateur (`GET /alerts/active`), nombre de ses demandes en cours
(`GET /messages/mine`, filtrées sur `status !== "traite"`), son prochain
rendez-vous confirmé à venir (`GET /appointments/mine`, trié par date),
et la dernière annonce publiée (`GET /announcements`). Deux listes
détaillées sous les cartes : alertes actives (lien vers `/alertes/[id]`,
pastille de gravité réutilisant `SEVERITY_BADGE` de `lib/alerts.ts`) et
dernières annonces (lien vers `/annonces/[id]`). Les raccourcis
par rôle (admin/agent/citoyen) sont conservés mais leurs intitulés
décoratifs (« Console de Haute Administration », « Poste Opérationnel
Municipal »…) ont été simplifiés en texte fonctionnel sobre.

Pour ajouter la section « rendez-vous » au tableau de bord, le client
API a été complété (`AppointmentSlot`, `Appointment`,
`fetchAppointmentSlots`, `bookAppointment`, `fetchMyAppointments`,
`cancelAppointment`, `downloadAppointmentIcs`, `fetchAgentAppointments`)
— nécessaire également pour le chantier Services (point 6 de la liste
précédente / RDV sur la fiche service).

Vérifié : `npm run build` et `npm run lint` passent sans erreur après
coup (suppression d'un état `error`/`setError` devenu mort suite à la
réécriture).

### Correction prioritaire — D13 : `/admin` renommée, texte décoratif retiré

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D13** | Retirer tout texte décoratif sans fonction, renommer la page, ne garder que des fonctions réelles réservées à l'admin. | `app/admin/page.tsx`, `docs/BESOINS-API.md` | ✅ Fait (gestion des comptes agents : bloquée côté API, documentée) |

Supprimé : le badge « Privilèges Administrateur Suprême (Niveau 3) », le
titre « Console d'Administration Municipale », le badge technique
« HODI-NODE-SOL04 • ACTIF », la carte « Registre des Comptes » avec le
chiffre inventé « 1 248 », et la carte « Privilèges Exclusifs » qui
n'affichait qu'un texte statique sans action. La page s'appelle
maintenant simplement « Administration » et ne contient que deux
fonctions réelles : le tableau des comptes ciblés par des tentatives de
connexion suspectes (`components/security/targeted-accounts-card.tsx`,
F37, déjà présent) et un accès à la suppression définitive d'alerte
(`DELETE /alerts/:id`, déjà implémentée et correctement restreinte à
`user.role === "admin"` dans `app/agent/alertes/page.tsx` — pas dupliquée,
seulement reliée depuis `/admin` pour éviter deux implémentations de la
même action).

La gestion des comptes **agents** demandée dans la même instruction
n'est pas réalisable pour l'instant : l'API documente `PATCH
/agent/citizens/:id/status` mais interdit explicitement de cibler un
compte agent/admin via cette route (403). Écart documenté dans
`docs/BESOINS-API.md` ("Gestion des comptes agents — route manquante").

Vérifié : `npm run build` et `npm run lint` passent sans erreur.

### Audit — aucune autre page n'affiche de données inventées

Passage en revue de toutes les pages authentifiées (`/agent`,
`/agent/annonces`, `/agent/alertes`, `/espace`, `/districts`,
`/services/[slug]`, `/alertes`, `/alertes/[id]`, `/annonces`,
`/annonces/[id]`, `/status`) par recherche de chiffres/statistiques
inventés (motifs type « 1 248 », « 98% », badges « Niveau X », mentions
mock/placeholder/simulé). Aucune autre occurrence trouvée : `/status`
fait un vrai health-check API, les autres pages n'affichent que des
données issues des endpoints réels ou des champs de formulaire standards.

Seules des pages **publiques non authentifiées** (page d'accueil `/`,
page de connexion `/connexion`) conservent du texte d'ambiance
science-fiction (« Télémétrie Orbitale », « Dôme Alpha », carrousel de
planètes…) qui fait partie de la direction artistique validée pour le
thème « ville spatiale » — ce n'est pas une donnée fonctionnelle
présentée comme réelle (pas de chiffre d'affaires, de compteur
d'utilisateurs ou de métrique métier), donc non modifié ici pour
respecter le gel du design. À signaler si ce n'est pas ce qui était
visé par la vérification.

## Vague F47, F48, F36, F51 — Nouvelles pages & Services Municipaux

### 1. F47 + F48 — Journal d'audit (Espace agents)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F47 / F48** | Historique complet et immuable des actions administratives (« qui a fait quoi, quand, sur quel objet »), filtres par action et entité, pagination et navigation au clavier. | `app/agent/audit-logs/page.tsx`, `lib/api.ts` (`fetchAuditLogs`), `components/app-sidebar.tsx` | ✅ Fait |

- Page dédiée accessible aux agents et administrateurs via le sous-menu de la barre latérale « Historique des actions » (`/agent/audit-logs`).
- Branchement direct sur `GET /agent/audit-logs` avec filtrage par action (`message_status_updated`, `citizen_account_activated`, etc.) et par entité (`CitizenMessage`, `User`, `MunicipalService`, `Alert`).
- Traduction en langage clair et badges colorés contrastés avec icônes.
- Affichage détaillé des notes et métadonnées JSON parsées de manière sécurisée.
- Pagination complète accessible au clavier (`Précédent` / `Suivant` avec focus visible).

#### Comment tester F47 + F48 :
1. Se connecter avec un compte `agent` ou `admin`.
2. Ouvrir le menu latéral > Espace agent > « Historique des actions » (`/agent/audit-logs`).
3. Vérifier les filtres par type d'action et type d'objet, ainsi que l'actualisation et la pagination.

---

### 2. F36 — Transports Municipaux (Public + Gestion Agent)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F36** | Page publique des transports (lignes, état du trafic en clair avec icône + texte, fréquence, horaires, arrêts, prochains départs, recherche et filtres par mode). Côté agent : mise à jour de l'état d'une ligne (`PATCH /transports/:codeOrId/status`). | `app/transports/page.tsx`, `app/transports/transports-content.tsx`, `lib/api.ts` (`fetchTransports`, `patchTransportStatus`), `components/app-sidebar.tsx`, `components/ui/stacked-circular-footer.tsx` | ✅ Fait |

- Accessible publiquement sur `/transports`, via le pied de page et la barre latérale (navette, bus, tram/maglev, liaison maritime).
- Recherche instantanée par mot-clé et filtre par mode de transport.
- Pour chaque ligne : nom, code, état du trafic avec pastille explicite (`Trafic normal`, `Perturbé`, `Interrompu`), message d'information, itinéraire, fréquence, horaires, liste des arrêts et badges des prochains départs.
- Pour les agents et admins : bouton « Gérer l'état » ouvrant une modale accessible pour mettre à jour le statut et le message d'information via `PATCH /transports/:codeOrId/status`.

#### Comment tester F36 :
1. Aller sur `/transports` : rechercher une ligne ou filtrer par « Navettes orbitales ».
2. Se connecter en agent : cliquer sur « Gérer l'état » sur une ligne, basculer en « Perturbé » avec un message explicatif, valider et constater la mise à jour immédiate.

---

### 3. F51 — Données Personnelles & Demandes RGPD (Public + Citoyen + Agent)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **F51** | Page publique d'information (« Vos données »), formulaire citoyen d'exercice de droits avec référence RGPD-..., suivi dans l'espace personnel, et traitement côté agents. | `app/donnees-personnelles/page.tsx`, `app/donnees-personnelles/donnees-personnelles-content.tsx`, `app/espace/page.tsx` (`fetchMyPrivacyInquiries`), `app/agent/privacy/page.tsx`, `lib/api.ts` | ✅ Fait |

- Page publique `/donnees-personnelles` exposant simplement les 4 principes de protection des données de Nova Terra (finalité, sécurité, durées de conservation, droits garantis).
- Formulaire pour citoyen connecté permettant d'émettre une demande (explication, accès, rectification, effacement, opposition) via `POST /privacy/inquiries`.
- Écran de confirmation avec référence unique (ex. `RGPD-2026-0001`).
- Suivi de la réponse et du statut dans l'espace personnel `/espace` (section dédiée « Mes demandes de données & RGPD » via `GET /privacy/inquiries/mine`).
- Espace agent de gestion sur `/agent/privacy` (`GET /agent/privacy/inquiries`) : filtrage par statut, examen de la demande citoyenne et réponse officielle avec note d'explication via `PATCH /agent/privacy/inquiries/:id/status`.

#### Comment tester F51 :
1. Aller sur `/donnees-personnelles` : consulter les engagements et formuler une demande avec un compte citoyen. Noter la référence `RGPD-...`.
2. Se rendre sur `/espace` : constater que la demande apparaît avec son statut « En attente ».
3. Se connecter avec un compte agent et ouvrir `/agent/privacy` : instruire le dossier, rédiger la réponse officielle et passer le statut à « Traité ».
4. Revenir sur `/espace` avec le citoyen : constater la réponse officielle affichée en direct.

## Chantier regroupé — Page Services (D05, F28, F32, F38, F45, F46, F39)

| Code | Besoin | Pages / fichiers concernés | Statut |
| ---- | ------ | --------------------------- | ------ |
| **D05 / F28 / F32 / F38 / F45 / F46 / F39** | Services prioritaires en tête, recherche, filtres catégorie/quartier, bouton « Urgences », badge de disponibilité, fiche détail avec horaires/contact/adresse/carte, alternative si indisponible, « Prendre rendez-vous » et « Contacter ce service ». | `app/districts/districts-content.tsx`, `app/services/[slug]/page.tsx`, `components/services/appointment-booking.tsx`, `app/espace/page.tsx`, `lib/api.ts` | ✅ Fait (partiellement bloqué par des données backend manquantes, voir détail) |

Les demandes précédentes (point 1 « F38 », point 5 « F28+F32 », point 6
« F39 », point 8 « F45+F46 ») sont regroupées ici en un seul chantier
cohérent sur la page `/districts` (annuaire des services) et
`/services/[slug]` (fiche détail), comme demandé.

**Liste `/districts`** :
- Tri « services prioritaires en tête » dans chaque quartier (`featured`
  en premier, puis ordre alphabétique) — actif dès que l'API renseignera
  ce champ (voir `docs/BESOINS-API.md`, actuellement toujours `false`/absent
  en prod donc sans effet visible pour l'instant).
- Recherche texte (nom/description) et filtre par quartier : déjà en
  place, conservés.
- Filtre par catégorie : **n'apparaît que si au moins un service
  renvoyé par l'API porte un champ `category`**, pour ne pas proposer un
  sélecteur qui ne donnerait jamais aucun résultat. Actuellement invisible
  en prod pour cette même raison (champ absent, voir `docs/BESOINS-API.md`).
- Bouton « Urgences » : même logique, affiché seulement si au moins un
  service a `isEmergency: true`. Filtre appliqué **côté client** sur la
  liste déjà chargée plutôt qu'en rappelant `GET /services?emergency=true`,
  qui ne répond jamais en prod (timeout déjà documenté) — ça contourne le
  bug plutôt que d'en dépendre.
- Badge de disponibilité sur chaque carte (déjà fait au point 1), plus
  un badge « Service prioritaire » / « Urgence » quand ces champs sont
  renseignés.
- Lien `?quartier=...` géré en entrée (utilisé par la fiche détail, voir
  plus bas).

**Fiche détail `/services/[slug]`** :
- Horaires, contact : déjà présents.
- Adresse : affichée seulement si `service.address` est renseigné par
  l'API (absent en prod actuellement).
- « Emplacement sur la carte des quartiers » : le badge quartier renvoie
  vers `/districts?quartier=<quartier>`, qui pré-sélectionne ce quartier
  dans le filtre de la liste — pas de nouvelle carte géographique
  construite (les coordonnées `latitude`/`longitude` sont elles aussi
  absentes en prod, voir `docs/BESOINS-API.md` ; une vraie carte
  interactive sera ajoutée quand ces données existeront).
- Badge « Service d'urgence » si `isEmergency`.
- Alternative si indisponible : déjà fait au point 1 (`AvailabilityDetails`).
- **« Prendre rendez-vous »** (nouveau, F39/F40) : `components/services/appointment-booking.tsx`.
  Réservé aux citoyens connectés (l'API renvoie 403 pour les autres
  rôles). Liste les créneaux disponibles (`GET /appointments/slots`),
  sélection d'un créneau, motif (obligatoire) + documents à prévoir
  (facultatif), réservation (`POST /appointments/book/:slotId`), gestion
  du conflit `409` (créneau pris entre-temps → re-charge la liste),
  confirmation avec téléchargement `.ics` (`GET /appointments/:id/ics`,
  déjà implémenté au point 1).
- **« Contacter ce service »** (nouveau) : renvoie vers `/espace?sujet=...`
  qui pré-remplit et ouvre directement le formulaire « Nouveau message »
  avec le nom du service en objet. Pas de champ `serviceId` dans le
  contrat `POST /messages`, donc pas de lien structurel possible côté
  API — le pré-remplissage du sujet est la solution la plus honnête.

Vérifié contre l'API réelle (`GET /services`, `GET
/appointments/slots?service=mairie-de-nova-terra`) le 2026-10-03 :
confirme à nouveau l'absence des champs `category`/`address`/`latitude`/
`longitude`/`featured`/`isEmergency` en prod (voir `docs/BESOINS-API.md`).
Les créneaux de rendez-vous, eux, existent déjà et fonctionnent
(`isAvailable`, `location`, `agent`). **Trouvé au passage un problème de
sécurité réel** : `GET /appointments/slots` (endpoint public, sans
authentification) renvoie l'objet `agent` complet, **hash bcrypt du mot
de passe inclus**. Documenté en tête de `docs/BESOINS-API.md` — à
corriger en urgence côté backend ; le front n'affiche que `firstName`/
`lastName` mais ne peut pas empêcher la fuite dans la réponse HTTP brute.

Vérifié : `npm run build` et `npm run lint` passent sans erreur
(y compris un lint `react-hooks/set-state-in-effect` sur le nouveau
composant de réservation, corrigé avec le même motif `Promise.resolve().then(...)`
déjà utilisé ailleurs dans le projet).
