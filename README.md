# Friendly Foodies 🍽️

Friendly Foodies est une application web / PWA mobile-first pour partager et découvrir des expériences culinaires sur une carte interactive, avec des modes « Mes amis » et « Découvrir ».

## Documents de référence

- [Instructions Codex — AGENTS.md](AGENTS.md)
- [Maquettes V1 — Figma](https://www.figma.com/design/7CNt12jxJjlfXk7R5i8dHP/Friendly-Foodies?node-id=16-2)
- Cahier des charges V1 : conservé dans les livrables du projet, à importer sous `docs/` si la visibilité du dépôt le permet.

## Architecture V1

React 19 + TypeScript + Vite, Supabase (Auth / PostgreSQL / PostGIS / Storage), MapLibre GL JS, PWA. Couleurs : crème, vert profond et corail.

## État du dépôt

Le fichier AGENTS.md donne la feuille de route, les règles produit, la sécurité et la méthode de travail de Codex. **Le code du starter React est fourni séparément en ZIP et n'a pas encore été importé dans ce dépôt.** Le dépôt n'est donc pas encore exécutable.

Une fois le starter importé :

```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm run test
npm run build
```

Les expériences et établissements de la démonstration sont fictifs. Ne jamais commiter de clés privées ou fichiers `.env.local`.

**Important :** respecter le cahier des charges et ne jamais exposer les publications privées dans les réponses API, le stockage, les agrégats ou les liens de partage.
