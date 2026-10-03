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
  - Fichier de démarrage : **`server.js`**, généré automatiquement par
    Next.js (mode `standalone`, imposé par Hodifly) — pas de serveur
    personnalisé côté front, voir section suivante.
- **Variables d'environnement** : définies dans l'interface Hodifly, lues via
  `process.env` (jamais de fichier `.env` committé — voir plus bas).
- **Domaine du front** : https://lunardevs.lescomores.webcup.hodi.cloud
- **API** : NestJS, déployée séparément sur un sous-domaine, exposée au
  front via `NEXT_PUBLIC_API_URL`.
- **Jury** : note aussi l'éco-conception (Ecoindex) — pages légères, peu de
  requêtes, pas de bibliothèques lourdes inutiles.

## Mode standalone imposé par Hodifly (pas de serveur personnalisé côté front)

Next.js propose deux façons d'obtenir un serveur de production :

1. **`output: 'standalone'`** : Next génère lui-même un `server.js` minimal
   (dans `.next/standalone/` en local), pensé pour être déployé seul, avec
   un `node_modules` réduit et le `package.json`.
2. **Serveur personnalisé** : on écrit son propre fichier d'entrée qui
   appelle l'API programmatique de Next (`next()` + `app.prepare()`).

**Ces deux approches sont incompatibles entre elles** (en mode standalone,
les fichiers d'un serveur personnalisé ne sont pas tracés par Next).

On a d'abord essayé l'option 2 avec un `server.cjs` personnalisé à la
racine (voir historique du projet). **Ça ne fonctionne pas sur Hodifly** :
Hodifly force le mode standalone pour tout front Next.js qu'il détecte —
le dossier réellement déployé ne contient que le `server.js` généré par
Next, `.next/`, un `node_modules` réduit et `package.json`. Notre
`server.cjs` n'est jamais copié dans ce dossier, d'où l'erreur observée en
déploiement :

```
Cannot find module '.../current/server.cjs'
```

**La bonne approche, côté front, est donc l'option 1 : ne rien faire de
spécial.** Pas de fichier `server.*` à la racine du dépôt, pas de script
`start` custom : Hodifly gère lui-même la génération et le lancement du
serveur standalone. `package.json` garde le script `start` standard
(`next start`), utilisé uniquement pour tester un build de production en
local — Hodifly, lui, démarre directement le `server.js` qu'il a généré,
qui lit déjà `process.env.PORT` par convention Next.js.

⚠️ Ne pas ajouter `output: 'standalone'` dans `next.config.ts` "pour
anticiper" : Hodifly l'impose déjà de son côté à la construction, et le
dupliquer ici n'apporte rien à ce qu'on vérifie en local avec
`next build` / `next start` (qui utilisent le build classique, pas
`.next/standalone/`).

## Configuration à saisir dans Hodifly

| Champ Hodifly              | Valeur                                                        |
| --------------------------- | -------------------------------------------------------------- |
| Type d'application          | Node (Passenger)                                               |
| Version Node                | 24                                                              |
| Dépôt / branche              | ce dépôt GitHub, branche `main`                                 |
| Commande de build            | `npm run build`                                                 |
| Fichier de démarrage         | `server.js` (généré par Next en mode standalone — géré par Hodifly, rien à créer dans le dépôt) |
| Répertoire racine            | racine du dépôt (là où se trouve `package.json`)                 |

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

ℹ️ `shadcn` et `tw-animate-css` sont volontairement en `dependencies` (pas
`devDependencies`) dans `package.json` — `app/globals.css` importe
`shadcn/tailwind.css` au moment du `next build`. Si l'installation en
production tourne avec `npm ci --omit=dev` ou `NODE_ENV=production npm
install` (courant sur ce genre d'hébergement), des `devDependencies`
seraient ignorées et le build échouerait. Ne pas les déplacer vers
`devDependencies` même si un linter le suggère.

## Piège Passenger + ESM (concerne l'API NestJS, pas ce dépôt front)

Ce piège a été rencontré en déployant l'**API NestJS** (dépôt séparé) sur
Hodifly — il ne s'applique pas à ce front, noté ici pour mémoire d'équipe.

Passenger démarre le fichier de démarrage d'une application Node avec
`require()`, jamais avec `import`. Si ce fichier est (ou charge, même
indirectement) un module ESM contenant un **top-level await**, Node 24
plante immédiatement au démarrage avec :

```
Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph
with top-level await
```

`NODE_ENV=production` ou une config correcte **ne protègent pas** de ce
piège — c'est une histoire de format de module (CJS vs ESM) et de présence
d'un `await` au niveau racine d'un fichier, indépendante de l'environnement
d'exécution. Sur l'API, la solution a été un `server.cjs` racine en
CommonJS pur (`require`, aucun top-level await), qui charge l'application
NestJS proprement.

**Pourquoi le front n'est pas concerné** : ce dépôt n'a plus de fichier de
démarrage personnalisé. Le `server.js` que Hodifly exécute est celui généré
automatiquement par Next.js en mode standalone — un fichier simple, sans
top-level await, que Next maintient lui-même. On ne le commite pas et on ne
le modifie pas.

Si un jour ce front redevient concerné (par ex. si on doit réintroduire un
serveur personnalisé), la même règle que côté API s'appliquerait : fichier
`.cjs`, uniquement `require(...)`, et `app.prepare()` enchaîné avec
`.then(...)/.catch(...)` plutôt qu'un `await` au niveau racine.

## Dépendance réseau au build (polices)

`next/font/google` télécharge normalement les fichiers de police depuis
Google au moment du `next build` (le résultat est ensuite auto-hébergé,
mais ce téléchargement initial a besoin du réseau). Une coupure ponctuelle
vers `fonts.googleapis.com` a fait échouer un build dans cet environnement
de développement avec :

```
Error: next/font: error: Failed to fetch Orbitron from Google Fonts.
```

Correction : la police de titres (Orbitron) est maintenant vendorée dans
`app/fonts/` et chargée via `next/font/local` — plus aucune requête réseau
au build pour elle. Geist (texte courant) reste sur `next/font/google` sans
risque équivalent : Next.js la vendore directement dans son propre paquet,
elle n'est jamais récupérée depuis Google. Si une police supplémentaire
est ajoutée plus tard via `next/font/google`, préférer le même traitement
(télécharger une fois, vendorer, charger en local) plutôt que de dépendre
du réseau à chaque build sur Hodifly.

## Piège Hodifly + pnpm : `ERR_PNPM_BUILD_THREAD_POOL`

Le déploiement a échoué une fois avec :

```
ERR_PNPM_BUILD_THREAD_POOL — Resource temporarily unavailable (os error 11)
help: Lower childConcurrency in pnpm-workspace.yaml, or raise RLIMIT_NPROC.
```

Cause : l'hébergement cPanel de Hodifly tourne sous CloudLinux, qui limite
le nombre de processus autorisés par compte. Par défaut, pnpm lance
plusieurs threads/processus en parallèle pour construire les dépendances
natives, ce qui dépasse cette limite sur un compte partagé — on n'a pas la
main sur `RLIMIT_NPROC` (c'est une limite serveur), donc la seule option
côté projet est de réduire la concurrence de pnpm.

Correction : `childConcurrency: 1` dans `pnpm-workspace.yaml`, pour que
pnpm construise les dépendances une par une plutôt qu'en parallèle. Un peu
plus lent, mais fiable sur ce type d'hébergement contraint. Vérifié après
coup : `pnpm install` (réinstallation complète) et `npm run build` passent
toujours en local avec ce réglage.

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
npm run start   # next start — utilise NEXT_PUBLIC_API_URL déjà injectée au build
```

Ce n'est pas exactement le serveur standalone que Hodifly génère et
exécute en production (`next start` utilise le build classique, pas
`.next/standalone/`), mais ça suffit pour vérifier que le build passe et
que la page `/status` se comporte correctement — la façon dont le serveur
est démarré en production est entièrement gérée par Hodifly.

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
