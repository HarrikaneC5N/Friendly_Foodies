# Friendly Foodies — Comprendre le projet (niveau débutant)

> Ce document explique **le vrai code présent dans le dépôt** au 21 octobre 2026. Il est volontairement pédagogique, en français. Il complète AGENTS.md et n'est pas un cahier des charges.

## 1. Les trois grandes parties

1. **Frontend** (`src/`) : ce que l'utilisateur voit dans le navigateur. Écrit avec React, TypeScript et CSS.
2. **Infrastructure** (`Dockerfile`, `compose*.yaml`, `nginx/`, `vite.config.ts`) : comment lancer et construire l'application.
3. **Backend préparé** (`supabase/`) : structure future de la base, sécurité et stockage des données. **Actuellement, l'accueil utilise des données fictives**, pas les tables SQL.

### Arborescence commentée

```text
Friendly_Foodies/
├── AGENTS.md                          Consignes que Codex doit respecter
├── README.md                          Présentation, installation, état des fonctionnalités
├── index.html                         Page HTML qui accueille l'application React
├── package.json                       Dépendances et commandes npm
├── tsconfig.json                       Réglages du compilateur TypeScript
├── vite.config.ts                      Réglages Vite, React, PWA
├── .env.example                        Exemple de variables de configuration (sans secrets)
├── .gitignore                          Fichiers exclus des commits Git
├── .dockerignore                       Fichiers exclus lors du build Docker
├── Dockerfile                          Construction image Docker dev / prod
├── compose.yaml                        Lance Vite en mode développement + hot reload
├── compose.prod.yaml                   Construit et lance la version de production
├── nginx/
│   └── default.conf                    Sert les fichiers compilés et gère les URLs SPA
├── public/
│   ├── icon.svg                        Icône vectorielle du site
│   ├── icon-192.png                    Icône PWA 192 px
│   └── icon-512.png                    Icône PWA 512 px
├── src/
│   ├── main.tsx                        Point d'entrée React
│   ├── App.tsx                         Page principale : navigation, filtres, affichages
│   ├── vite-env.d.ts                   Types des variables d'environnement de Vite
│   ├── components/
│   │   ├── MapView.tsx                 Affiche la carte MapLibre et les épingles
│   │   └── AuthDialog.tsx              Boîte de connexion Google / Apple / email OTP
│   ├── data/
│   │   └── demo.ts                     Établissements et avis FAUX pour la démonstration
│   ├── lib/
│   │   ├── grades.ts                   Calcul des grades C/B/A/S et moyenne par auteur
│   │   └── supabase.ts                 Prépare le client Supabase, sinon renvoie null
│   └── styles/
│       └── global.css                  Tout l'aspect graphique et le responsive
├── supabase/
│   └── migrations/
│       └── 202610210001_initial.sql   Structure SQL future et premières policies RLS
├── tests/
│   └── grades.test.ts                  Tests unitaires du calcul des grades
└── docs/
    ├── DOCKER.md                       Guide Docker détaillé
    └── COMPRENDRE_LE_PROJET.md         Le document que tu lis
```

**Le dossier `node_modules/`** est créé après `npm install` (ou dans le volume Docker). **`dist/`** est créé après `npm run build`. Ils ne sont pas présents dans Git : c'est normal. **`package-lock.json`** n'est pas encore commité : l'ajouter après une installation npm réussie, pour des builds reproductibles.

## 2. Ce qui se passe quand tu ouvres localhost:5173

```text
Docker Compose démarre le serveur Vite
  ↓
Le navigateur charge index.html
  ↓
index.html charge src/main.tsx
  ↓
main.tsx affiche <App /> et charge global.css
  ↓
App.tsx lit les données fictives de data/demo.ts
  ↓
App.tsx calcule les lieux visibles selon la recherche, la distance et le grade
  ↓
MapView.tsx place les épingles sur MapLibre GL JS
  ↓
Quand tu sélectionnes un lieu, App.tsx affiche sa fiche et ses avis publics
```

Le fond de carte vient d'un fournisseur externe de tuiles via Internet. Les lieux d'exemple sont situés à **Paris** volontairement. Le bouton « Mes amis », les réactions et la publication ne persistent encore aucune donnée métier ; ils affichent une demande de connexion ou un message de démo.

## 3. Trois fichiers à lire d'abord

### src/data/demo.ts — Le jeu d'essai
Ce fichier crée des objets TypeScript décrivant cinq établissements de démonstration, avec catégories, coordonnées GPS, auteurs et notes fictives. Les interfaces `DemoPlace` et `DemoPost` disent quelles propriétés doivent exister. Exemple : `place.posts` est la liste des avis de ce lieu.

Quand Supabase sera branché, ces données fictives seront remplacées par des résultats de requêtes. **Ne pas confondre `demo.ts` et une base de données.**

### src/App.tsx — Le chef d'orchestre
Pour l'instant il gère beaucoup de responsabilités : état de la recherche (`query`), distance (`distance`), grade minimal (`minGrade`), lieu sélectionné (`selected`), connexion (`session`), navigation et affichage des différentes parties de l'écran.

- `useState` mémorise une valeur qui peut changer (recherche, lieu choisi).
- `useMemo` calcule les établissements filtrés quand les critères changent.
- `useEffect` synchronise l'interface avec la session Supabase et les messages temporaires.
- `VenuePreview` dessine une carte d'établissement.
- `VenueDetail` dessine la fiche d'un établissement avec ses avis publics.
- `requireAccount` demande une connexion ou prévient que l'action réelle sera développée plus tard.
- `chooseMode` ne permet pas encore de voir une véritable carte des amis.
- `sharePlace` appelle le partage natif si possible, mais **le lien profond vers un établissement n'est pas encore implémenté**.

Ce fichier est **trop dense pour apprendre sereinement** : premier chantier conseillé pour Codex = séparer progressivement la logique et les sous-composants sans changer le comportement.

### src/components/MapView.tsx — La carte
Ce composant reçoit une liste de lieux, le lieu sélectionné et une fonction à appeler lors d'un clic :
- initialise la carte MapLibre dans un `useEffect` ;
- conserve l'instance via `useRef` pour ne pas la recréer à chaque rendu ;
- crée un bouton/une épingle par lieu reçu ;
- retire les anciennes épingles quand la liste change ;
- nettoie la carte lors du démontage du composant.

Les marqueurs sont **neutres** dans l'actuel mode Découvrir. Le mode amis n'est pas implémenté.

## 4. À quoi servent les autres fichiers src/ ?

- `src/main.tsx` : le tout premier code exécuté côté React. Il monte `App` dans la balise `<div id="root">` du HTML et importe le CSS.
- `src/components/AuthDialog.tsx` : formulaire de connexion, boutons OAuth Google/Apple, envoi et validation du code e-mail via Supabase. L'interface existe, mais les fournisseurs, redirections et paramètres doivent être configurés et testés.
- `src/lib/grades.ts` : transforme C/B/A/S en nombres provisoires 1/2/3/4, puis calcule d'abord la moyenne **par auteur**, puis la moyenne des **auteurs**. Ainsi un auteur ayant dix visites ne compte pas dix fois plus.
- `src/lib/supabase.ts` : crée la connexion au backend uniquement si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont fournies ; sinon `supabase = null` et la démo fonctionne sans backend.
- `src/styles/global.css` : couleurs, typographie, tailles, espacements, carte, cartes d'établissements, boîte Auth et affichage mobile. **Il est actuellement compacté en quelques très longues lignes** : le rendre lisible et l'organiser en sections est une bonne première tâche de refactorisation sans changer le rendu.
- `src/vite-env.d.ts` : explique à TypeScript que des variables `VITE_*` existent et sont des chaînes de caractères facultatives.

## 5. Fichiers d'infrastructure

- `package.json` : liste les bibliothèques utilisées (`dependencies`) et les outils de développement (`devDependencies`). Définit les commandes `npm run dev`, `npm run build`, `npm run typecheck` et `npm test`.
- `tsconfig.json` : oblige TypeScript à être strict et à détecter les erreurs communes.
- `vite.config.ts` : configure React et l'installation PWA (manifest, icônes et service worker).
- `index.html` : configure la langue, le titre, les métadonnées et charge `main.tsx`. Ce n'est pas ici que tu construis les pages.
- `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png` : icônes du site et de la PWA.
- `.env.example` : modèle de configuration, à copier en `.env.local`. Les valeurs `VITE_*` sont visibles dans le navigateur : ne jamais y mettre une clé serveur ou un mot de passe.
- `.gitignore` : empêche Git d'ajouter des fichiers locaux comme `.env.local` ou `node_modules`.
- `.dockerignore` : empêche Docker de copier des dossiers inutiles ou sensibles dans l'image.
- `Dockerfile` : décrit plusieurs étapes : installation des dépendances, serveur Vite pour développer, compilation React, puis Nginx pour servir la compilation.
- `compose.yaml` : permet `docker compose up --build -d` ; monte le code local dans le conteneur, garde les modules npm dans un volume et expose **localhost:5173**.
- `compose.prod.yaml` : lance l'image de production avec Nginx sur **localhost:8080**. Ce n'est pas une autorisation de déployer publiquement la V1.
- `nginx/default.conf` : pour la production, gère les URL React profondes, les fichiers statiques et le cache.
- `docs/DOCKER.md` : mode d'emploi de Docker, ports, logs, tests, Supabase CLI optionnel.

**À retenir : Docker ne remplace pas React, Vite ou Supabase**. C'est une enveloppe qui te donne un environnement de travail reproductible. Le `compose.yaml` actuel ne contient **pas** de base PostgreSQL locale.

## 6. Backend : supabase/migrations/202610210001_initial.sql

C'est **du SQL de préparation**, pas un backend fonctionnel déjà branché. Il décrit notamment :

| Table ou objet | Rôle |
|---|---|
| `profiles` | Profil public, pseudonyme unique et règle des 21 jours |
| `places` | Établissements et coordonnées géographiques PostGIS |
| `categories` / `place_categories` | Catégories alimentaires d'un établissement |
| `posts` / `post_photos` | Expériences, grades, confidentialité et photos |
| `friend_requests` | Demandes d'amis et acceptations |
| `blocks` | Blocages entre utilisateurs |
| `reactions` | « Je valide » et « Pas pour moi » |
| `notifications` | Demandes d'amis et réactions seulement |
| `reports` / `app_admins` | Signalements et modération humaine |
| `place_public_grades` | Vue calculant le grade agrégé à partir des posts publics |

**RLS (Row Level Security)** signifie que PostgreSQL contrôle ligne par ligne ce qu'un utilisateur a le droit de lire ou de modifier. C'est plus sûr que masquer des données uniquement dans React. La migration doit être **auditée et testée avec plusieurs comptes** avant toute utilisation publique. Les photos privées ne doivent pas être rendues accessibles via des URL permanentes.

## 7. Les tests

`tests/grades.test.ts` utilise Vitest. Il vérifie notamment qu'une personne qui a publié cinq expériences ne pèse pas cinq fois plus qu'une autre dans la note du lieu, et qu'un lieu sans avis n'a pas de grade.

Commandes Docker :

```bash
docker compose up --build -d
docker compose exec web npm run typecheck
docker compose exec web npm test
docker compose exec web npm run build
```

Ces commandes sont destinées à ton PC. Ne jamais déclarer qu'elles ont réussi sans les exécuter.

## 8. Comment apprendre et intervenir

Pour changer une couleur : `src/styles/global.css`.
Pour changer un texte d'accueil ou une navigation : `src/App.tsx`.
Pour changer les adresses **fictives** : `src/data/demo.ts`.
Pour changer les épingles : `src/components/MapView.tsx`.
Pour comprendre les notes : `src/lib/grades.ts` et `tests/grades.test.ts`.
Pour configurer les connexions : `src/lib/supabase.ts`, `src/components/AuthDialog.tsx` et `.env.local`.
Pour faire évoluer la structure des tables : nouvelle migration dans `supabase/migrations/` (jamais modifier destructivement une migration déjà appliquée).

**La prochaine tâche de Codex est un refactoring pédagogique, sans ajout fonctionnel** : rendre `global.css` lisible, découper `App.tsx` en quelques composants simples, garder les responsabilités séparées, documenter les mouvements et vérifier que le rendu et les fonctionnalités de démo restent identiques. Le propriétaire souhaite écrire et comprendre l'application lui-même.
