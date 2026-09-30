# Lunar Devs

Squelette technique pour le **Webcup Comores** (hackathon 24h, 3-4 octobre
2026) — équipe **Lunar Devs**.

Le règlement de l'événement interdit de coder l'application du sujet avant
le lancement du hackathon. Ce dépôt ne contient donc **volontairement pas**
d'application : juste un socle Next.js prêt à déployer, avec une page de
test qui valide la chaîne front ↔ API ↔ hébergement avant le top départ.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com)
- Serveur de production personnalisé (`server.cjs`, CommonJS pur — requis
  par Passenger, voir `docs/DEPLOIEMENT.md`), compatible
  [Phusion Passenger](https://www.phusionpassenger.com/) pour l'hébergement
  cPanel/Hodifly de l'événement
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
NEXT_PUBLIC_API_URL=<url-api> node server.cjs
```

## Page `/status`

Une seule page suffit à vérifier tout le pipeline de déploiement :

- la date du build actuellement servi,
- un appel en direct (depuis le navigateur, pour tester le CORS) à
  `NEXT_PUBLIC_API_URL + "/health"`, avec un statut OK / erreur explicite.

## Déploiement

Toute la configuration Hodifly (type d'application, variables d'environnement,
pourquoi un serveur personnalisé plutôt que `output: 'standalone'`) et la
procédure de test post-déploiement sont documentées dans
[`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md).

## Éco-conception

Le projet vise un score Ecoindex correct : pas de dépendance front lourde,
pas d'image ni de police chargée à distance au runtime, un seul appel réseau
sur la page de test.
