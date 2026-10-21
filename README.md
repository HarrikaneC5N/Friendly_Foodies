# Friendly Foodies 🍽️

Socle de développement **V1 — sprint 0 / début sprint 1** pour l'application de découverte culinaire cartographique, d'après le cahier des charges V1 et la direction artistique Figma validée.

## Démarrer

Prérequis : Node.js 20.19+ et npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvre ensuite l'adresse affichée par Vite (habituellement `http://localhost:5173`).

Sans variables Supabase, l'interface fonctionne en **démo publique**, avec des **lieux et avis entièrement fictifs**, centrés sur Paris. La carte requiert un accès internet pour les tuiles.

## Stack

- React 19, TypeScript strict, Vite ; PWA avec `vite-plugin-pwa`.
- MapLibre GL JS ; style paramétrable dans `VITE_MAP_STYLE_URL` (OpenFreeMap pour le prototype).
- Supabase Auth, PostgreSQL + PostGIS + Storage ; schéma SQL initial dans `supabase/migrations/`.
- CSS natif mobile-first ; identité crème `#FAF5ED`, vert `#193F33` / `#317967`, corail `#F16E51`.

## Premier incrément effectivement livré

- Écran d'accueil responsive avec carte interactive et marqueurs.
- Recherche et filtres **uniquement** distance (km depuis le centre de Paris en démo) et grade minimum.
- Une seule épingle par établissement ; ouverture d'une fiche détaillée et liste de ses publications **publiques**.
- Calcul des grades en **deux niveaux** (moyenne par personne puis moyenne des personnes), tests unitaires inclus.
- Dialogue de connexion : Google, Apple et e-mail OTP, utilisables après configuration Supabase.
- Une PWA installable et une première base SQL avec politiques RLS.

## Pas encore opérationnel dans cet incrément

Publication d'expériences, photos, flux amis, recherche de pseudos, réactions, notifications, administration et suppression de compte : **prévus dans les maquettes et le cahier des charges, mais non développés à ce stade**. Les actions protégées demandent une connexion ou affichent clairement qu'elles appartiennent au prochain sprint.

**Important :** la clé `service_role` Supabase ne doit jamais être placée dans le front ni dans `.env.local`. Utiliser uniquement l'**anon / publishable key**, en s'appuyant sur RLS. Ne pas lancer en production avant validation des règles de confidentialité, modération et effacement.

## Configurer Supabase

1. Créer un projet Supabase personnel.
2. Copier la migration SQL `supabase/migrations/202610210001_initial.sql` dans l'éditeur SQL, la vérifier puis l'exécuter (idéalement via Supabase CLI en environnement de développement).
3. Configurer l'Auth : fournisseurs Google / Apple si souhaités ; modèle e-mail OTP envoyé avec **code à 6 chiffres** pour que le formulaire corresponde (`{{ .Token }}` dans le template de connexion). Ne pas exiger le login par mot de passe.
4. Copier l'URL et l'anon key dans `.env.local`.
5. Configurer les redirect URLs, la politique de domaines autorisés et les limites e-mail.

Le front utilise encore les **données démo** dans ce sprint, y compris lorsqu'une connexion Supabase est configurée ; les requêtes réelles seront développées au sprint suivant.

## Arbitrages nécessaires avant le backend métier

- Notes : C=1/B=2/A=3/S=4 et arrondi au plus proche sont **provisoires** ; valider le sens de la conversion.
- Les agrégats publics doivent uniquement utiliser les posts publics par défaut pour éviter toute fuite des données privées : **à confirmer comme règle produit**.
- Les signalements anonymes doivent être faits via un endpoint surveillé et limité (éviter les insertions ouvertes côté client).
- Politique d'effacement de compte : supprimer les médias/identités tout en respectant les exigences légales applicables.
- Cartographie : vérifier la licence, les quotas et l'attribution du fournisseur de tuiles avant lancement public.
- Rayon distance : centre de Paris temporaire (prototype), puis position choisie / carte / permission GPS à définir.

## Tests

```bash
npm run typecheck
npm run test
npm run build
```

## Figma

[Friendly Foodies — maquettes V1](https://www.figma.com/design/7CNt12jxJjlfXk7R5i8dHP/Friendly-Foodies?node-id=16-2)

## Prochaine étape

**Sprint 1** : mettre en place les entités Supabase `places`, `posts`, `post_photos`, authentification/profil et leurs contrôles d'accès côté serveur, puis remplacer les lieux démo par de vraies données (tout en gardant les maquettes visuelles comme référence).

## Docker (recommandé pour démarrer le développement)

```bash
cp .env.example .env.local
docker compose up --build -d
# http://localhost:5173
```

- Logs : `docker compose logs -f web`
- Typecheck : `docker compose exec web npm run typecheck`
- Tests : `docker compose exec web npm test`
- Stop : `docker compose down`
- Image de production : `docker compose -f compose.prod.yaml up --build -d` → http://localhost:8080

Configuration détaillée : **[docs/DOCKER.md](docs/DOCKER.md)**. La configuration Docker est fournie mais n'a pas pu être exécutée dans cet environnement : elle doit être validée une fois clonée sur ton PC.
