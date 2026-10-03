# Système de design — Nova Terra

Direction artistique : ville spatiale, moderne, sobre, lisible. Ce document
décrit les bases pour que les pages suivantes restent cohérentes entre
elles et avec ce qui a déjà été construit.

## Composants : shadcn/ui, pas de composants maison

Les briques de base (`components/ui/`) viennent de
[shadcn/ui](https://ui.shadcn.com) (CLI `shadcn`, base Radix, variables
CSS), **pas écrites à la main**. Composants déjà ajoutés :
`button`, `input`, `label`, `card`, `badge`, `dialog`, `dropdown-menu`,
`table`, `switch`, `sonner` (notifications toast).

```bash
npx shadcn@latest add <nom-du-composant>
```

Pour ajouter un nouveau composant shadcn, utiliser cette commande plutôt que
d'écrire le composant à la main — il arrive déjà câblé sur les tokens de
couleur ci-dessous, donc déjà dans le thème "Nova Terra" sans rien faire.

⚠️ **Il n'existe pas de composant `form` dans la version actuelle du
registre shadcn** (`npx shadcn add form` ne crée aucun fichier, sans
erreur). Les formulaires (`/inscription`, `/connexion`) utilisent donc
`Input`/`Label`/`Button`/`Card` de shadcn, avec de la validation et un
`useState` React classiques — pas `react-hook-form`/`zod`, qui ne sont pas
des dépendances du projet.

## Couleurs : tout passe par les tokens de `app/globals.css`

Ne jamais écrire une couleur en dur dans une page. Utiliser les classes
Tailwind générées par les tokens :

| Usage | Classe |
| --- | --- |
| Fond / texte de page | `bg-background` / `text-foreground` |
| Panneau ("carte vaisseau") | `Card` de shadcn (déjà stylé verre + bordure, voir plus bas) |
| Action principale | `Button` (variant par défaut = `bg-primary`, cyan néon en sombre) |
| Texte secondaire | `text-muted-foreground` |
| Erreur | `text-destructive` |
| Accent de marque (hors composants shadcn, ex. le logo) | `text-nova` / `var(--nova)`, `var(--nova-2)` |

Les valeurs exactes (clair ET sombre) sont définies une seule fois dans
`app/globals.css`, blocs `:root` (clair) et `.dark` (sombre). Pour changer
une teinte de la marque, c'est le seul endroit à modifier.

## Clair / sombre

Le thème est piloté par [next-themes](https://github.com/pacocoursey/next-themes)
(`ThemeProvider` dans `app/layout.tsx`, classe `.dark` sur `<html>`),
**pas seulement par les préférences système** : `components/mode-toggle.tsx`
expose un `Switch` (shadcn) pour basculer explicitement. Sombre est le
thème par défaut (`defaultTheme="dark"`), cohérent avec l'identité "ville
spatiale" — le clair reste une variante complète et utilisable, pas un
mode dégradé.

## Ambiance spatiale (sans image, sans vidéo, sans 3D)

- **Champ d'étoiles** : `body::before` dans `globals.css`, un
  `background-image` de `radial-gradient` tuilé (5 points sur une tuile de
  220px répétée) — coût quasi nul, pur CSS. Désactivé en clair via la
  variable `--starfield-opacity`.
- **Halos de nébuleuse** : `body::after`, deux grands `radial-gradient`
  flous très discrets (`--halo-1`/`--halo-2`), eux aussi désactivés en
  clair.
- **Panneaux "vaisseau"** : toute `Card` shadcn reçoit automatiquement un
  effet verre (`backdrop-filter: blur`) et une fine bordure via le
  sélecteur `[data-slot="card"]` dans `globals.css` — pas besoin de classes
  supplémentaires sur chaque `<Card>`.
- **Halo lumineux discret** : les boutons en variant par défaut
  (`[data-slot="button"][data-variant="default"]`) ont un léger
  `box-shadow` coloré par `--primary`, pour les actions importantes.

## Typographie

- **Titres (`h1`/`h2`/`h3`, et `CardTitle` de shadcn)** : Orbitron
  (futuriste), via `--font-heading`. Fichiers vendorés dans `app/fonts/`
  et chargés avec `next/font/local` (pas `next/font/google`) : le rendu
  est identique — auto-hébergé, zéro requête réseau au runtime — mais le
  `next build` lui-même ne dépend plus d'un accès réseau à
  `fonts.googleapis.com` (une coupure ponctuelle y a fait échouer un build
  dans cet environnement : voir `docs/DEPLOIEMENT.md`).
- **Texte courant** : Geist Sans (déjà en place), très lisible — ne pas
  utiliser Orbitron pour des paragraphes. Geist reste chargée via
  `next/font/google` : Next.js la vendore directement dans le paquet
  `next`, donc aucun risque réseau équivalent pour elle.

## Animations

Transitions courtes et rares (changement de thème, hover). Un garde-fou
global dans `globals.css` neutralise toute animation/transition si
`prefers-reduced-motion: reduce` est actif — pas besoin de le refaire page
par page.

## Curseur des boutons

`cursor: pointer` est appliqué une fois pour tous les `button`/`[role=button]`
dans `globals.css` (option `--pointer` de `shadcn init`). Ne pas ajouter
`cursor-pointer` manuellement sur chaque bouton.
