# Déploiement — Lunar Devs (Webcup Comores)

Ce document réunit tout ce qu'il faut savoir pour déployer ce projet sur
l'hébergement de l'événement, et pour vérifier que le déploiement fonctionne.

## Contexte

- **Hébergement** : cPanel HODI. SSH est bloqué, le CPU/RAM sont partagés
  entre les équipes du hackathon — donc rester léger (voir la section
  éco-conception plus bas).
- **Déploiement** : Hodifly (push GitHub → build → lancement automatique).
  - Framework détecté : Next.js.
  - Type d'application : **Node (Passenger)**, Node **24**.
  - Commande de build : `npm run build`.
  - Fichier de démarrage : **`server.js`** à la racine du projet.
- **Variables d'environnement** : définies dans l'interface Hodifly, lues via
  `process.env` (jamais de fichier `.env` committé — voir plus bas).
- **Domaine du front** : https://lunardevs.lescomores.webcup.hodi.cloud
- **API** : NestJS, déployée séparément sur un sous-domaine, exposée au
  front via `NEXT_PUBLIC_API_URL`.
- **Jury** : note aussi l'éco-conception (Ecoindex) — pages légères, peu de
  requêtes, pas de bibliothèques lourdes inutiles.

## Pourquoi un `server.js` personnalisé (et pas `output: 'standalone'`)

Passenger a besoin d'un fichier d'entrée unique (`server.js`) qu'il exécute
lui-même en lui injectant `PORT`. Next.js propose deux façons d'obtenir un
`server.js` :

1. **`output: 'standalone'`** dans `next.config.ts` : Next génère lui-même un
   `server.js` minimal dans `.next/standalone/`, pensé pour être copié seul
   (sans `node_modules`) vers un conteneur.
2. **Serveur personnalisé** : on écrit notre propre `server.js` à la racine,
   qui appelle l'API programmatique de Next (`next()` + `app.prepare()`).

**Ces deux approches sont incompatibles entre elles** (la documentation
Next.js le précise explicitement : en mode standalone, les fichiers d'un
serveur personnalisé ne sont pas tracés). Comme Hodifly exige un
`server.js` précis à la racine et fait tourner `npm install` /
`npm run build` sur place (donc `node_modules` est présent), on utilise
l'option 2 : `server.js` est un serveur personnalisé classique, et
`next.config.ts` **ne** doit **pas** définir `output: 'standalone'`.

`server.js` est volontairement écrit en CommonJS (`require`, pas `import`) :
`package.json` ne déclare pas `"type": "module"`, donc ce fichier est
interprété comme CommonJS par défaut. Passenger l'exécute directement, sans
passer par le compilateur Next — le faire dépendre d'ESM serait fragile.

Il lit :
- `process.env.PORT` (injecté par Passenger, défaut `3000` en local),
- `process.env.HOSTNAME` (défaut `0.0.0.0`),
- `process.env.NODE_ENV` (mode dev seulement si explicitement
  `"development"` ; sinon toujours production, y compris si la variable est
  absente).

## Configuration à saisir dans Hodifly

| Champ Hodifly              | Valeur                                                        |
| --------------------------- | -------------------------------------------------------------- |
| Type d'application          | Node (Passenger)                                               |
| Version Node                | 24                                                              |
| Dépôt / branche              | ce dépôt GitHub, branche `main`                                 |
| Commande de build            | `npm run build`                                                 |
| Fichier de démarrage         | `server.js`                                                     |
| Répertoire racine            | racine du dépôt (là où se trouve `server.js`)                   |

Variables d'environnement à définir dans Hodifly (pas dans Git) :

| Variable               | Exemple                                              | Notes                                             |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `https://api.lunardevs.lescomores.webcup.hodi.cloud`  | Sans `/` final. Exposée au navigateur (préfixe `NEXT_PUBLIC_`), donc **jamais de secret** dedans. |
| `NODE_ENV`             | `production`                                          | Normalement déjà géré par Passenger, à vérifier au premier déploiement. |

`PORT` et `HOSTNAME` sont injectés par Passenger : ne pas les définir
manuellement dans Hodifly.

⚠️ **Point d'attention (à trancher avant le hackathon)** : ce projet utilise
`pnpm` (`pnpm-lock.yaml`, `packageManager: pnpm@12.4.2`), mais Hodifly lance
`npm run build`. Si Hodifly fait aussi l'installation des dépendances avec
`npm install` (au lieu de `pnpm install`), `npm` ignorera `pnpm-lock.yaml`
et résoudra les versions différemment (pas de `package-lock.json` commité
actuellement). À vérifier avec un premier déploiement de test ; si besoin,
soit générer et committer un `package-lock.json`, soit voir si Hodifly permet
de choisir `pnpm` comme gestionnaire de paquets.

## Variables d'environnement en local

1. Copier `.env.example` vers `.env.local` (déjà ignoré par Git).
2. Renseigner `NEXT_PUBLIC_API_URL` avec l'URL de l'API (locale ou de test).
3. `NEXT_PUBLIC_*` est figé **au build** : après `next build`, changer la
   variable n'a plus d'effet tant qu'on ne rebuild pas.

Aucun secret ne doit être commité : `.gitignore` ignore tous les `.env*`
sauf `.env.example` (qui ne contient que des exemples/placeholders).

## Page `/status`

`/status` sert à vérifier en une page le front, l'API et le CORS en même
temps :

- **Build** : date/heure du `next build` qui a produit le bundle actuellement
  servi (injectée via `next.config.ts` → `env.NEXT_PUBLIC_BUILD_DATE`, donc
  figée à la compilation, pas à la requête).
- **API** : un composant client (`app/status/health-check.tsx`) appelle
  `NEXT_PUBLIC_API_URL + "/health"` **depuis le navigateur** (pas depuis le
  serveur Next) — c'est important : le CORS est une règle appliquée par le
  navigateur, un appel serveur→serveur ne le testerait pas. Affiche OK
  (avec latence et corps de réponse) ou une erreur explicite (timeout 8s,
  erreur HTTP, ou blocage CORS).

Ça suppose que l'API NestJS expose bien une route `GET /health` (200 avec un
corps quelconque) et un en-tête `Access-Control-Allow-Origin` couvrant le
domaine du front.

## Procédure de test

### En local

```bash
npm run build
NEXT_PUBLIC_API_URL=<url-api> node server.js
# ou simplement:
npm run start   # utilise NEXT_PUBLIC_API_URL déjà injectée au build
```

Puis ouvrir `http://localhost:3000/status` et vérifier :
- la date de build affichée correspond bien au moment du `npm run build`,
- le bloc API passe à `OK` (si une API avec `/health` tourne et autorise le
  CORS pour `localhost:3000`) ou affiche une erreur claire sinon.

### Après déploiement sur Hodifly

1. Vérifier que le build Hodifly se termine sans erreur (logs Hodifly).
2. Ouvrir `https://lunardevs.lescomores.webcup.hodi.cloud/status`.
3. Vérifier que la date de build correspond au dernier push.
4. Vérifier que le bloc API passe à `OK` — si erreur CORS, vérifier les
   en-têtes `Access-Control-Allow-Origin` côté API NestJS pour ce domaine
   exact.

## Éco-conception (Ecoindex)

- Page d'accueil et `/status` : pas d'images, pas de police externe chargée
  au runtime (polices Google auto-hébergées via `next/font`, aucune requête
  réseau au chargement), pas de bibliothèque UI/JS additionnelle.
- Les images de démonstration de `create-next-app` (`public/*.svg`) ont été
  retirées : elles n'étaient plus référencées après simplification de la
  page d'accueil.
- Le check santé (`/status`) n'effectue qu'un seul appel réseau, avec un
  timeout côté client pour éviter de laisser une requête pendre.
