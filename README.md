# Nova Terra

Front Next.js de la plateforme numérique de la ville de **Nova Terra**,
construit pendant le **Webcup Comores** (hackathon 24h, 3-4 octobre 2026)
par l'équipe **Lunar Devs**.

## Fonctionnalités (Bloc 1 — Socle)

- Inscription (`/inscription`) et connexion (`/connexion`) d'un compte
  habitant, avec validation de formulaire et messages d'erreur clairs.
- Espace personnel (`/espace`) : accueil personnalisé avec le nom de
  l'habitant connecté.
- Rôles `citizen` / `agent` / `admin` : navigation adaptée au rôle, pages
  `/agent` et `/admin` protégées côté front (redirection si le rôle ne
  convient pas — la vraie protection reste côté API).
- Gestion du jeton (stocké côté client) et déconnexion.

Détail code de demande → page concernée dans
[`docs/DEMANDES.md`](docs/DEMANDES.md).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
  pour les composants de base (bouton, champ, carte, badge…), thémés en
  "ville spatiale" — voir [`docs/DESIGN.md`](docs/DESIGN.md)
- Mode clair/sombre avec bouton de bascule ([next-themes](https://github.com/pacocoursey/next-themes))
- Déployé sur cPanel/Hodifly en mode `next start` standard (mode
  `standalone` généré automatiquement par Hodifly — pas de serveur
  personnalisé côté front, voir `docs/DEPLOIEMENT.md`)
- API séparée : [NestJS](https://nestjs.com) (dépôt distinct), consommée via
  `NEXT_PUBLIC_API_URL`

## Démarrage

```bash
pnpm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_API_URL
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Vérifier un build de production en local

```bash
pnpm build
NEXT_PUBLIC_API_URL=<url-api> pnpm start
```

## Page `/status`

Une seule page suffit à vérifier tout le pipeline de déploiement :

- la date du build actuellement servi,
- un appel en direct (depuis le navigateur, pour tester le CORS) à
  `NEXT_PUBLIC_API_URL + "/health"`, avec un statut OK / erreur explicite.

## Déploiement

Toute la configuration Hodifly (type d'application, mode `standalone`
imposé par la plateforme, variables d'environnement) et la procédure de
test post-déploiement sont documentées dans
[`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md).

## Éco-conception

Le projet vise un score Ecoindex correct : pas d'image ni de vidéo (logo et
fond étoilé en CSS/SVG), polices auto-hébergées (aucune requête runtime),
formulaires en React simple (pas de `react-hook-form`/`zod`). Seule entorse
volontaire à "pas de bibliothèque" : shadcn/ui (Radix + quelques
utilitaires CSS) pour éviter de réinventer des composants accessibles —
demande explicite de l'équipe, et ça reste nettement plus léger qu'une
librairie de composants complète (MUI, Ant Design…).
