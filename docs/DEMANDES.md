# Demandes — Bloc 1 (Socle)

Suivi des demandes du Bloc 1 traitées côté front, et des pages/fichiers qui
y répondent. Les intitulés sont ceux reçus du Haut Conseil / des services
municipaux de Nova Terra pour ce bloc.

| Code | Demandeur | Besoin | Pages / fichiers concernés | Statut |
| ---- | --------- | ------ | --------------------------- | ------ |
| **D01** | Haut Conseil de la Ville | Permettre à un nouvel habitant de créer simplement un compte pour utiliser les services numériques et retrouver son espace personnel. | `/inscription` (`app/inscription/page.tsx`), `registerRequest` (`lib/api.ts`) | ✅ Fait |
| **D03** | Direction des Services Municipaux | Permettre aux citoyens inscrits de se reconnecter et d'accéder à un espace personnel clairement identifié. | `/connexion` (`app/connexion/`), `/espace` (`app/espace/page.tsx`), `AuthProvider` (`lib/auth-context.tsx`) | ✅ Fait |
| **D08** | Direction des Services Municipaux | Distinguer clairement les profils (citizen / agent / admin) pour adapter les outils et responsabilités disponibles. | `Me.role` (`lib/api.ts`), navigation adaptée au rôle (`components/nav.tsx`) | ✅ Fait |
| **D09** | Direction des Services Municipaux | Empêcher un citoyen d'atteindre les outils réservés aux agents ; limiter les fonctions sensibles aux profils autorisés. | `/agent`, `/admin` protégées côté front (`components/protected.tsx`) ; **la vraie protection reste côté API** (401/403 sur `/auth/*`, `/me` et les futures routes agent/admin) | ✅ Fait (expérience front) |

## Détail de ce qui a été construit

- **Inscription (D01)** : formulaire prénom/nom/email/mot de passe +
  confirmation, validation côté client (champs requis, format email, mot
  de passe ≥ 8 caractères, confirmation identique), appel à
  `POST /auth/register`. En cas de succès, notification (toast) puis
  redirection vers `/connexion` (le contrat de l'API ne renvoie pas de
  jeton à l'inscription, donc pas de connexion automatique).
- **Connexion + espace personnel (D03)** : formulaire email/mot de passe,
  appel à `POST /auth/login` puis `GET /me` pour récupérer le profil.
  Jeton stocké dans `localStorage` (clé `novaterra.token`). `/espace`
  affiche un accueil personnalisé (prénom, nom, email, profil).
- **Distinction des profils (D08)** : le rôle (`citizen` / `agent` /
  `admin`) renvoyé par `/me` pilote la navigation (`components/nav.tsx`) —
  les liens « Agent » et « Admin » n'apparaissent que pour les rôles
  concernés.
- **Accès restreint (D09)** : `components/protected.tsx` redirige vers
  `/connexion` si l'utilisateur n'est pas authentifié, ou vers `/espace` si
  son rôle ne correspond pas à la page (`/agent` → `agent`/`admin`,
  `/admin` → `admin` uniquement). **Ceci est uniquement une expérience
  utilisateur** : un citoyen qui appellerait directement l'API sur une
  route agent/admin doit être bloqué par l'API elle-même (401/403), pas par
  ce garde-fou front qui peut être contourné (DevTools, appel direct).
- **Jeton et déconnexion** : `AuthProvider` (`lib/auth-context.tsx`) relit
  le jeton au chargement de l'app, le valide via `GET /me`, et expose
  `logout()` qui vide `localStorage` et l'état utilisateur (bouton
  « Déconnexion » dans la nav).
- **Identité visuelle « ville spatiale »** : palette sombre/claire sur les
  tokens shadcn (cyan néon en sombre), champ d'étoiles et halos en CSS pur,
  logo SVG inline — détaillé dans `docs/DESIGN.md`.

## Non couvert par ce bloc (hors périmètre)

Vu dans le flux de demandes mais **pas traité ici**, pour un bloc suivant :
D04 (contact des services), D05/D06/D07 (page d'accueil enrichie,
services, annonces), D19 (espace de travail agent complet), F22 (file des
demandes côté agent). Les pages `/agent` et `/admin` existent déjà comme
coquilles protégées, prêtes à accueillir ces fonctionnalités.

## Vérification de bout en bout

`/auth/register`, `/auth/login` et `/me` sont en ligne et ont été testés
directement contre l'API réelle
(`https://api.lunardevs.lescomores.webcup.hodi.cloud`) : inscription,
connexion, récupération du profil, et les deux cas d'erreur (mot de passe
incorrect → 401, email déjà utilisé → 409) — avec le code exact de
`lib/api.ts` (compilé et exécuté contre l'API, pas une réimplémentation).
CORS confirmé pour `localhost` et le domaine du front en production.

Côté API, la matrice de rôles est confirmée en prod par l'équipe backend :
`citizen` → 403 sur les routes agent/admin, `agent` → 200/403, `admin` →
200/200. Côté front, `components/protected.tsx` et `components/nav.tsx`
n'ont qu'un seul chemin de code pour ça (comparaison de `user.role` en
chaîne) — déjà exercé de bout en bout avec un compte `citizen` réel ; pas
re-testé avec les comptes de démo `agent`/`admin` (identifiants non
partagés, et pas nécessaire : même chemin de code, juste une valeur de
rôle différente).

Non testé pour l'instant : le rendu réel en navigateur (extension Chrome
indisponible dans cet environnement — vérifié par ailleurs via le CSS
compilé et une relecture de code).
