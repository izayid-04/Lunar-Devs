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


