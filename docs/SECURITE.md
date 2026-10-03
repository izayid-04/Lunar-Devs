# 🛡️ Mesures de Sécurité de l'API Nova Terra (F69)

Ce document décrit l'ensemble des mesures de renforcement de sécurité mises en œuvre sur l'API Nova Terra, la protection qu'elles confèrent, et les procédures de vérification.

---

## 1. En-têtes HTTP de sécurité (`helmet`)
- **Ce qu'elle protège** :
  - Empêche les attaques par injection de scripts (**XSS**), détournement de clics (**Clickjacking** via `X-Frame-Options: SAMEORIGIN` / CSP), reniflage MIME (`X-Content-Type-Options: nosniff`), et fuite d'informations sur l'infrastructure (`X-Powered-By` supprimé).
- **Comment la vérifier** :
  ```bash
  curl -I http://localhost:3000/health
  ```
  Vérifier la présence des en-têtes :
  - `x-content-type-options: nosniff`
  - `x-frame-options: SAMEORIGIN`
  - Absence de l'en-tête `x-powered-by: Express`.

---

## 2. CORS Strict (Origines `FRONT_URL`)
- **Ce qu'elle protège** :
  - Restreint strictement l'exécution de requêtes cross-origin depuis un navigateur uniquement aux domaines officiels configurés dans la variable `FRONT_URL` (plus `localhost` pour le développement local). Empêche les sites tiers malveillants d'effectuer des appels API au nom d'un citoyen ou agent connecté.
- **Comment la vérifier** :
  - Requête avec une origine valide (`FRONT_URL` ou `http://localhost:3000`) :
    ```bash
    curl -H "Origin: http://localhost:3000" -I http://localhost:3000/health
    # Réponse : access-control-allow-origin: http://localhost:3000
    ```
  - Requête depuis un domaine pirate :
    ```bash
    curl -H "Origin: https://evil-site.com" -I http://localhost:3000/health
    # Réponse : Origin https://evil-site.com not allowed by CORS (ou blocage préventif)
    ```

---

## 3. Validation des requêtes et rejet des données superflues (`ValidationPipe`)
- **Ce qu'elle protège** :
  - Protection contre les injections de champs non prévus (**mass assignment**) : `whitelist: true` et `forbidNonWhitelisted: true`.
  - Empêche un utilisateur malveillant de s'attribuer un rôle lors de l'inscription (`POST /auth/register` rejettera toute tentative d'envoyer `{ role: "admin" }` avec un code `400 Bad Request`).
- **Comment la vérifier** :
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@nova.local","password":"Password123!","firstName":"Test","lastName":"User","hackedField":true}'
  # Doit répondre : 400 Bad Request (property hackedField should not exist)
  ```

---

## 4. Limite de taille des requêtes HTTP (Payload limits)
- **Ce qu'elle protège** :
  - Protection contre les dénis de service (**DoS**) par saturation de mémoire : les requêtes JSON et formulaires URL-encoded sont limitées à **2 Mo** (`express.json({ limit: '2mb' })`).
- **Comment la vérifier** :
  - L'envoi d'un corps de requête dépassant 2 Mo est automatiquement rejeté avec le statut HTTP `413 Payload Too Large`.

---

## 5. Aucune trace d'erreur technique ni stack trace exposée (`GlobalExceptionFilter`)
- **Ce qu'elle protège** :
  - Évite la divulgation d'informations sensibles sur l'architecture, la version des dépendances, les chemins locaux du serveur ou les requêtes SQL internes (`information disclosure`).
  - Toute exception 500 inattendue renvoie un message générique :
    ```json
    {
      "statusCode": 500,
      "error": "Internal Server Error",
      "message": "Une erreur interne est survenue. Veuillez réessayer ultérieurement."
    }
    ```
- **Comment la vérifier** :
  - Vérifier les réponses d'erreur pour s'assurer qu'aucun objet de stack trace (`stack`) ni trace de pilote MySQL/Node.js n'apparaît dans le corps HTTP renvoyé au client.

---

## 6. Limitation de débit globale et par route (`ThrottlerModule`)
- **Ce qu'elle protège** :
  - Prévention des attaques par force brute (**brute-force**) sur l'authentification et protection contre le scraping intensif.
  - Baseline globale : 100 requêtes / minute par IP.
  - `POST /auth/login` : restreint à 15 tentatives / minute par IP.
  - `POST /auth/register` : restreint à 10 créations / minute par IP.
  - Verrouillage automatique de compte citoyen : après 5 échecs consécutifs, le compte est verrouillé 15 minutes (`429 Too Many Requests`).
- **Comment la vérifier** :
  - Enchaîner 16 tentatives de login consécutives pour observer le retour HTTP `429 Too Many Requests`.

---

## 7. Durée de validité des jetons JWT sécurisée (8 heures)
- **Ce qu'elle protège** :
  - Durée de session de 8 heures (`expiresIn: '8h'`) permettant le confort d'évaluation pour le jury et les agents tout en limitant la fenêtre d'exposition en cas de compromission de jeton.
- **Comment la vérifier** :
  - Se connecter via `POST /auth/login` et décoder le JWT retourné (ex. via `jwt.decode` ou inspecteur de token) : le champ `exp - iat` vaut exactement 28 800 secondes (8 heures).
