# Docker — Friendly Foodies

## Prérequis
- Docker Desktop (Windows : backend WSL2 recommandé) ou Docker Engine + plugin Compose v2.
- Docker doit être lancé.
- Port 5173 libre pour le développement, 8080 libre pour l'aperçu production.

## Développement : hot reload
À la racine du dépôt :

```bash
cp .env.example .env.local
# Renseigner éventuellement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
# Laisser ces variables vides pour la démo publique (données fictives).
docker compose up --build -d
```

Ouvrir **http://localhost:5173**. Le code est monté depuis le PC vers `/app`, et les dépendances sont isolées dans le volume Docker `node_modules`.

```bash
docker compose logs -f web
docker compose exec web npm run typecheck
docker compose exec web npm test -- --run
docker compose exec web npm run build
docker compose down
```

Après changement de `package.json` ou `package-lock.json` :

```bash
docker compose down
docker compose up --build -d
```

Éviter `docker compose down -v`, qui supprimerait le volume de dépendances (il pourrait simplement être reconstruit). L'application n'utilise pas de base de données Docker directement dans ce fichier Compose.

## Aperçu de l'image de production

```bash
# Sans variables Supabase : fonctionne en mode démo.
docker compose -f compose.prod.yaml up --build -d
```

Ouvrir **http://localhost:8080**. Nginx sert la compilation statique et redirige les routes SPA vers `index.html`.

**Important :** les variables `VITE_*` sont intégrées dans les assets JS au moment de la construction, même si elles sont renseignées par `--build-arg`. Seules les clés publiques Supabase (`anon`/`publishable`) sont autorisées. Ne jamais transmettre de clé `service_role`, clé secrète, mot de passe ou jeton privé en `VITE_*` ou en arguments de build.

Pour tester la construction avec l'URL Supabase souhaitée, renseigner des variables `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` dans **un fichier `.env` local non commité**, puis reconstruire. La présence d'un `.env.local` seul n'injecte pas automatiquement ses variables dans le build Docker de production.

## Supabase local (optionnel, séparé)
Supabase CLI peut démarrer son environnement de développement avec Docker, notamment Postgres, PostGIS, Auth, Storage et Studio :

```bash
npx supabase init  # une fois, seulement si supabase/config.toml est absent
npx supabase start
npx supabase status
```

Ces commandes téléchargent plusieurs images et réclament davantage de RAM. Supabase reste un service **séparé** de `docker compose`. Avant la première migration, vérifier et tester les policies RLS : le SQL fourni est un **socle**, non une preuve que les accès privés sont sécurisés.

Sous Windows + Docker Desktop/WSL2, `http://localhost:54321` peut être accessible depuis le navigateur (host), mais **dans un conteneur** `localhost` désigne ce conteneur : si du code serveur doit contacter Supabase local, utiliser un hostname de réseau approprié (`host.docker.internal` sous Docker Desktop) ; la PWA utilise les requêtes du navigateur et peut souvent garder l'URL localhost publique. Vérifier les URLs de redirection Auth.

## Tests à effectuer sur ton PC
1. `docker compose config` valide la syntaxe Compose.
2. `docker compose up --build -d` construit et démarre le conteneur ; puis `docker compose logs -f web`.
3. Visiter l'interface, modifier une couleur dans `src/styles/global.css` et confirmer le rechargement automatique.
4. Vérifier recherche, carte, filtres, fiche et responsive.
5. `docker compose exec web npm run typecheck`, `docker compose exec web npm test`, `docker compose exec web npm run build`.
6. `docker compose -f compose.prod.yaml up --build -d`, puis vérifier `http://localhost:8080`.

La construction Docker n'a **pas été testée dans cet environnement** (Docker absent / registre npm inaccessible). Ne pas confondre configuration fournie et tests exécutés.
