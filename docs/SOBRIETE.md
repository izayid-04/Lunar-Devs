# Mesures de Sobriété & Performance Numérique — Nova Terra (F57 à F62)

Ce document consigne les mesures d'impact environnemental, de sobriété numérique et de performance front-end réalisées dans le cadre du chantier **Sobriété et Performance** (demandes F57, F58, F59, F60, F61, F62).

---

## 1. Synthèse globale Avant / Après (F57)

| Indicateur / Métrique | État Initial (Avant) | État Optimisé (Après) | Gain / Économie |
| :--- | :--- | :--- | :--- |
| **Poids des images WebP (`public/*.webp`)** | **1 130 Ko** (1,13 Mo) | **490 Ko** (0,49 Mo) | **- 640 Ko (- 57 %)** |
| **Chargement du globe 3D WebGL (`cobe`)** | Inclus dans le bundle critique | `next/dynamic` à la demande (`ssr: false`) | **0 Ko de WebGL exécuté si non visible** |
| **Poids des halos & flous décoratifs GPU** | Actifs en permanence | Neutralisés en Mode Léger & Réduire animations | **0 % de charge GPU sur filtres flous** |
| **Animations d'arrière-plan (`<canvas>`)** | Boucle `requestAnimationFrame` continue | Boucle stoppée et canvas masqué | **0 cycle CPU/GPU pour la poussière d'espace** |
| **Détection automatique de réseau faible** | Aucune (chargement lourd aveugle) | Network Information API (`saveData`, `2g`) | **Bascule automatique en Mode Léger** |
| **Taille réservée & chargement différé** | `loading="eager"` par défaut, tailles brutes | `loading="lazy"`, `sizes` responsives, conteneurs stables | **Élimination du Cumulative Layout Shift (CLS)** |

---

## 2. Détail des optimisations par fonctionnalité

### F60 — Optimisation et compression des images
Toutes les images d'illustration de la colonie ont été recompressées avec ImageMagick (compression WebP optimisée, qualité 75, méthode 6, dimensions adaptées à 960px de large maximum) :
- `public/biocentre.webp` : 259 Ko → **113 Ko** (- 56 %)
- `public/dome-alpha.webp` : 281 Ko → **127 Ko** (- 55 %)
- `public/nova-terra-planet.webp` : 213 Ko → **89 Ko** (- 58 %)
- `public/port-spatial.webp` : 164 Ko → **70 Ko** (- 57 %)
- `public/residentiel.webp` : 197 Ko → **92 Ko** (- 53 %)

Toutes les balises `<Image>` hors du viewport initial bénéficient de :
- `loading="lazy"` explicite (carrousel, formulaire de connexion, formulaire d'inscription, fiches de services).
- Attribut `sizes` précisant les dimensions réelles d'affichage pour éviter le chargement de résolutions disproportionnées.
- Conteneurs parents à dimensions réservées (`relative` avec `fill` ou `width`/`height` définis) éliminant tout décalage de mise en page.

---

### F58 + F61 — Composants lourds (Globe 3D, Carrousel, Canvas)
1. **Globe 3D (`cobe` / WebGL)** :
   - Extrait du chunk principal grâce à `next/dynamic(() => import("@/components/ui/interactive-globe"), { ssr: false })`.
   - Si l'utilisateur active le **Mode Léger** ou a configuré **« Réduire les animations »** (`prefers-reduced-motion`), le runtime WebGL 3D n'est **ni instancié, ni exécuté** ; il est remplacé par une carte vectorielle 2D accessible sans surconsommation CPU/GPU.
2. **Carrousel orbital panoramique** :
   - Défilement automatique débrayable et suspendu si les animations sont réduites ou en mode léger.
   - Mode léger : présentation textuelle sobre, structurée en cartes accessibles sans recalculs de matrices CSS 3D.
3. **Poussière spatiale d'ambiance (`SpaceDustTraffic`)** :
   - Arrêt immédiat de la boucle `requestAnimationFrame` dès que le mode léger ou le mouvement réduit est actif.

---

### F59 + F62 — Mode Léger dans le panneau d'accessibilité & Auto-détection
Un interrupteur **« Mode Léger (Sobriété & Éco-conception) »** a été ajouté au panneau d'accessibilité universel :
- **Activation manuelle** : accessible à tout moment via le dock flottant ou l'en-tête, persistant dans `localStorage`.
- **Activation automatique (F62)** : détection via la `Network Information API` (`navigator.connection.saveData === true` ou `effectiveType === 'slow-2g' | '2g'`).
- **Comportement en Mode Léger** :
  - Classe `.light-eco-mode` injectée sur la racine HTML.
  - Masquage automatique de tous les éléments décoratifs (`[data-eco-decorative]`, halos lumineux flous `blur-3xl`, lueurs d'arrière-plan).
  - Désactivation de toutes les animations CSS superflues (`animation: none !important`, `transition: none !important`).
  - Suppression des filtres `backdrop-filter: blur(...)` gourmands en mémoire vidéo et calculs GPU.
  - Maintien intégral de 100 % des actions citoyennes, informations administratives, formulaires et services municipaux.

---

## 3. Validation technique

- `pnpm build` : ✅ Compilation Turbopack réussie, 23 pages statiques et dynamiques générées sans erreur.
- `pnpm lint` : ✅ 0 erreur, 0 warning ESLint.
- Accessibilité : ✅ Conforme WCAG / RGAA (repères textuels préservés, contrastes assurés, navigation clavier totale).
