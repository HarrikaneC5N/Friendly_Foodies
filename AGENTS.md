# AGENTS.md — Friendly Foodies (Codex)

> Instructions applicables à tout le dépôt. Lire ce document **avant chaque tâche** et appliquer les exigences ci-dessous. Le projet est un véritable produit grand public, pas une démo de portfolio.

## 1. Références et ordre de priorité

1. **Cahier des charges V1 validé** : `docs/Friendly_Foodies_Cahier_des_charges_V1.docx` (si présent dans le dépôt). Il fait foi pour le métier, la vie privée, les parcours et les critères de recette R01–R16.
2. **Décisions ultérieures explicites du propriétaire du projet**, si elles précisent ou modifient le cahier des charges.
3. **Ce fichier `AGENTS.md`** : garde-fous d'implémentation.
4. **Maquettes Figma V1** : référence de design et d'ergonomie (non source de nouvelles fonctionnalités métier). Voir https://www.figma.com/design/7CNt12jxJjlfXk7R5i8dHP/Friendly-Foodies?node-id=16-2
5. `README.md`, code et migrations : état de l'implémentation, pas une preuve qu'une fonctionnalité est terminée.

Quand les maquettes comportent un contrôle supplémentaire non prévu au cahier des charges (ex. filtre « Cuisine »), **respecter le cahier des charges** : ne pas introduire la fonctionnalité sans validation. Si une règle métier manque ou est « à arbitrer », proposer les options et demander une décision plutôt que l'inventer.

## 2. Mission produit

Friendly Foodies est une **application web/PWA mobile-first de découverte d'expériences culinaires autour d'une carte interactive**, utilisable aussi sur ordinateur. Style inspiré des carnets de voyages cartographiques, expérience immersive, simple et chaleureuse. Pas de feed social prioritaire.

**Direction artistique validée :** crème `#FAF5ED`, vert profond `#193F33`, vert `#317967`, corail `#F16E51`, cartes claires, arrondis, photos gourmandes et fond de carte 2D illustré soigné. Préserver les proportions et comportements responsive des maquettes. La carte doit rester la vedette de l'accueil.

**Contraintes :** viser un budget initial de **0 €**, sous réserve des quotas/conditions d'hébergement, de stockage et de tuiles. Aucune dépendance payante ni service à carte bancaire imposée sans accord. Respecter licences et attributions de la cartographie.

## 3. Stack et conventions

- Front : **React 19 + TypeScript strict + Vite**, PWA `vite-plugin-pwa`, CSS actuel ; réutiliser les composants et styles existants. `lucide-react` pour les icônes.
- Carte : **MapLibre GL JS** et style configurable ; fournisseur de tuiles de production **à arbitrer** (OpenFreeMap = prototype uniquement, vérifier usage/quotas/attribution).
- Backend : **Supabase Auth + PostgreSQL/PostGIS + Storage**, RLS et contrôles d'accès **côté serveur**.
- Séparer les modules : composants UI (`src/components`), logique métier testable (`src/lib`), appels backend (`src/lib` ou `src/services`), données de démo clairement isolées (`src/data/demo.ts`), migrations versionnées (`supabase/migrations`).
- Pas de `any` implicite, pas d'API fictive présentée comme opérationnelle. UI en **français** ; fonctions, types et variables en anglais, noms explicites.
- Privilégier des évolutions limitées, lisibles et testables. Préserver les tests existants ; en ajouter pour tout changement de logique métier, de visibilité ou de calcul de grades.
- Ne jamais insérer de clés de production dans le code, les tests ou le dépôt. Les variables publiques `VITE_*` ne doivent contenir **aucun secret** : seules URL et clé Supabase *anon/publishable* sont admises côté client. Jamais de `service_role` dans React.

## 4. Contrat fonctionnel V1 — ne pas déformer

### Carte et découverte

- Deux modes : **« Mes amis »** (visites de ses amis réciproques, uniquement si autorisées) et **« Découvrir »** (toutes les expériences **publiques** de la communauté, visibles même sans connexion).
- Une **seule épingle par établissement**, quel que soit le nombre de posts. En mode amis : avatar d'un ami et `+N` pour les autres amis ; en mode Découvrir : repère neutre représentant **le lieu**, pas un utilisateur arbitraire.
- Au clic : aperçu photo/grade, puis fiche d'établissement. Le **résumé et grade global du lieu apparaissent en premier**, ensuite les publications. Plusieurs visites par un même auteur sont possibles et restent distinctes.
- Les **seuls filtres V1** sont **la distance exacte en kilomètres** et **le grade global minimum** (« au moins A », jamais égalité stricte). Recherche textuelle de lieux autorisée. **Aucun filtre catégorie/cuisine en V1**.
- Les catégories se voient sur les fiches : restaurants, cafés, boulangeries, pâtisseries, bars, street food, food trucks, marchés, etc. Plusieurs catégories par lieu ; « Autre » est un libellé personnalisé **local au lieu**, sans modifier la liste officielle.
- Localisation refusée ou indisponible : prévoir une expérience de repli utile (zone choisie / centre de carte). Ne pas supposer l'utilisateur à Paris hors **mode démo**.
- Création d'un lieu par recherche ou par point sur la carte, avec suggestions anti-doublons proches.

### Publications / expériences

- Un post = visite d'une personne dans un lieu, avec texte bref, grade et **0 à 5 photos** (compression/optimisation et stockage sécurisé).
- Grades métier **C = décevant, B = correct, A = excellent, S = exceptionnel/mémorable**. La conversion C=1/B=2/A=3/S=4 et la règle d'arrondi actuelles sont **provisoires** tant que non validées ; conserver cette incertitude visible dans les choix techniques.
- Date de visite **facultative** : aucune date, date exacte (jour) ou mois/année approximatif. `created_at` distinct, fiable, non confondu avec la date de visite.
- Visibilité par défaut **« Amis uniquement »** ; option **« Public »**. L'utilisateur peut modifier a posteriori photos, texte, grade, date et visibilité ; plusieurs posts d'un même auteur sur un même lieu.
- Calcul du grade d'un lieu en **deux étages** : moyenne des visites d'un **utilisateur** pour le lieu, puis moyenne des moyennes de chaque utilisateur. Chaque contributeur a le même poids, qu'il ait un ou dix posts. Définition des populations/visibilités incluses dans les agrégats **à arbitrer**, surtout pour ne jamais exposer de données privées.

### Social et accès

- Inscription/connexion : **Google, Apple, e-mail sans mot de passe avec vérification réelle** (code/lien). Un visiteur sans compte peut consulter la carte Découvrir, les établissements, posts et profils publics.
- Pseudonyme **unique obligatoire**, avatar facultatif, recherche/autocomplétion en temps réel ; changement de pseudonyme au plus **une fois par 21 jours**, contrôlé par le serveur.
- Amitié **réciproque sur invitation** : envoi, acceptation, refus, retrait **sans notification de retrait**, blocage. Une demande en attente **ne donne jamais** accès aux publications privées.
- Réactions limitées à **« Je valide »** et **« Pas pour moi »**. **Aucun commentaire filaire, message privé ou feed façon Instagram** en V1.
- Partage externe par lien ou fonction native ; **un lien vers un contenu privé n'accorde aucun droit d'accès**.
- Notifications **uniquement** pour une demande d'ami reçue et une réaction sur sa publication. Pas de notification pour les nouveaux posts d'amis ni les suppressions d'amitié.
- Signalements de contenus accessibles, y compris par un visiteur anonyme lorsqu'il voit un post public, via un mécanisme **avec protection anti-abus**. **Modération humaine uniquement**, avec interface admin minimale et journal d'actions.
- Suppression de compte avec confirmation et effacement sécurisé des données et médias, selon politique documentée. Respecter les droits RGPD.

## 5. Confidentialité et sécurité — bloquants

- Appliquer **RLS à toutes les tables métier** avec politiques revues pour les rôles `anon` et `authenticated`. L'UI ou les filtres JS **ne constituent jamais une protection**.
- Tester explicitement : visiteur non connecté, auteur, membre non ami, demande en attente, ami accepté, ami retiré, utilisateur bloqué, administrateur.
- Protéger les posts privés, **leurs photos dans Storage**, URLs de partage, previews, résultats de recherche, RPC, comptes/agrégats et notifications. Ne pas construire de lien public permanent vers un objet privé.
- Agrégats publics et markers Découvrir : **aucune déduction de posts/relations privés** via grades, compteurs, photos ou noms. En cas de doute, ne calculer qu'à partir des posts publics visibles et demander validation métier.
- Valider côté serveur les limites (max. cinq photos, type/taille, grade, propriétaire, format de date, changement de pseudo, contrôle de réactions) et limiter les abus (rate-limit sur OTP, demandes, signalements, créations).
- Éviter les données personnelles de démonstration réelles, les traceurs inutiles et les logs exposant des données privées. Jamais de contournement RLS avec une clé admin dans le navigateur.
- Demander validation/revue avant toute migration destructive, permission élargie, suppression de données, mise en production ou modification de politique d'accès.

## 6. État réel du starter (ne pas surpromettre)

Le starter contient une **carte démo Paris avec établissements/avis fictifs**, une interface responsive, les filtres V1, la fiche lieu, un module Auth à connecter et une première migration SQL. Le README détaille l'existant.

**Non livré pour l'instant :** chargement métier réel Supabase, création et édition persistantes de posts, upload de photos, gestion réelle des amis/blocages, notifications, réactions, signalements, admin, suppression du compte et parcours d'onboarding complet. Ne jamais marquer ces fonctions « terminées » parce que les maquettes les représentent ou qu'une table SQL existe.

## 7. Méthode de travail attendue de Codex

Avant de modifier : lire `AGENTS.md`, `README.md`, les fichiers concernés, la migration SQL et la partie du cahier des charges correspondant à la tâche. Expliquer en **français** ce qui sera développé, les hypothèses et tout arbitrage bloquant. Ne pas dériver vers des fonctionnalités hors V1.

Pour chaque tâche :
1. Définir **un incrément utilisable** et les critères d'acceptation, particulièrement les cas d'accès/erreur.
2. Réaliser le changement avec composants réutilisables, UI responsive/accessible (clavier, lecteurs d'écran, alt, états vides/chargement/erreur).
3. Prévoir les migrations/requêtes RLS associées et les tests de visibilité si la fonctionnalité touche la base.
4. Exécuter si possible `npm run typecheck`, `npm run test`, `npm run build`. Distinguer tests exécutés et tests non exécutables ; ne jamais inventer un succès.
5. En fin de tâche, résumer : fichiers modifiés, comportements réellement opérationnels, tests et résultats, limitations, décisions à valider, prochaine petite étape.

Scripts : `npm install`, `npm run dev`, `npm run typecheck`, `npm run test`, `npm run build`.

Préférer des commits ciblés, noms de branches explicites (`feat/...`, `fix/...`), PR avec description/test. Ne pas pousser de `.env.local`, `node_modules`, `dist`, dumps, médias privés ou clés. Garder la démo distincte du monde réel ; ne pas afficher comme authentiques des expériences fictives.

## 8. Ordre de développement conseillé

1. Stabiliser l'environnement local et les tests, auditer migration, RLS et gestion Auth/profils, fixer les arbitrages de sécurité.
2. Brancher les véritables établissements et catégories, géolocalisation/recherche, carte à épingle unique et fiches publiques.
3. Authentification réelle et pseudonymes, puis création/édition de publications et Storage privé/public sécurisé.
4. Système d'amitié et blocage, carte amis et lecture strictement autorisée.
5. Réactions, notifications limitées, partage profond, signalements et back-office humain.
6. Suppression de compte/RGPD, performances, accessibilité, PWA, tests de recette R01–R16 et déploiement contrôlé.

Le produit V1 n'est **pas terminé** avant réussite des scénarios de recette R01–R16 et validation de la confidentialité, du retrait de compte, des coûts et des licences cartographiques.

## Docker (développement et production)
- Développement : `docker compose up --build -d` ; serveur Vite à `http://localhost:5173`, source montée dans le conteneur, dépendances dans un volume nommé.
- Tests : `docker compose exec web npm run typecheck`, `docker compose exec web npm test`, `docker compose exec web npm run build`.
- Compilation/aperçu production : `docker compose -f compose.prod.yaml up --build -d`, Nginx sur `http://localhost:8080`.
- Voir `docs/DOCKER.md` ; ne pas ajouter Postgres local redondant à Supabase CLI sans décision explicite. Ne jamais exposer de secrets `VITE_*` ou par `ARG` Docker.
- Commiter `package-lock.json` après un `npm install` valide, et privilégier `npm ci`. Tant que l'environnement npm n'est pas accessible, ne prétendre ni que les images ont été construites ni que les tests ont réussi.

## 9. Collaboration pédagogique — priorité absolue pour ce projet

**Le propriétaire est débutant avec React, TypeScript, Supabase et Docker, et souhaite CODER lui-même.** Codex est un pair-programmer/mentor, pas une usine à changements opaques. Optimiser pour la lisibilité humaine et l'apprentissage plutôt que pour la brièveté du code ou la vitesse d'implémentation.

### Avant de coder
1. Lire aussi `docs/COMPRENDRE_LE_PROJET.md`. Expliquer en français, sans jargon non expliqué, **quels fichiers seront touchés, pourquoi et ce que l'utilisateur va apprendre**.
2. Proposer de **petites étapes** et attendre validation lorsque la tâche est importante ou modifie l'architecture. Ne pas réécrire toute l'application d'un coup ni ajouter des fonctionnalités hors demande.
3. Établir une distinction nette entre **vrai backend**, **simulation de démo**, **configuration non testée** et **élément de design Figma**.

### Pendant le code
- Choisir des **noms explicites en anglais** : `selectedPlace`, `filteredPlaces`, `getPublicPosts`; éviter `p`, `q`, `v`, abréviations obscures, imbrications inutiles et variables à une lettre (sauf indices de boucle simples).
- Une fonction = une responsabilité claire ; préférer le code direct et lisible à une architecture surabstraite.
- React : composants courts aux rôles clairs ; déplacer progressivement la logique indépendante de `App.tsx` vers des fichiers ciblés. Garder `App.tsx` comme orchestrateur, pas comme fourre-tout.
- TypeScript : interfaces/types simples et explicites ; ne pas utiliser `any` pour éviter un problème ; montrer pourquoi un type est nécessaire.
- CSS : **une déclaration par ligne, blocs indentés, sections commentées** (`base`, `layout`, `navigation`, `map`, `cards`, `dialogs`, `responsive`). Le `global.css` actuel est presque minifié : le rendre lisible en première tâche **sans aucune modification visuelle**.
- Ajouter des commentaires **en français** uniquement pour expliquer un *pourquoi métier*, une règle de confidentialité ou un passage réellement difficile. Éviter les commentaires évidents du type `// Set state`.
- Pas de fichiers « magiques » de 500 lignes ni de chaînes de ternaires/JSX imbriquées. Pas de hooks ou design patterns complexes sans justification simple.
- Favoriser les tests compréhensibles : titre en français, cas métier clair, arrangement/act/assert lisibles. Ajouter une dépendance seulement si elle est utile et expliquée.
- Conserver toutes les fonctionnalités, la DA, le responsive et le comportement de démo pendant un refactoring. Ne jamais modifier des migrations RLS sous couvert d'un nettoyage.

### Après chaque changement
Fournir systématiquement, en **français simple** :
1. **Ce qu'on a fait**, à quoi cela sert, en 3–6 phrases.
2. **Fichiers modifiés**, chacun avec son rôle.
3. **Mini-explication d'un extrait de code** (quelques lignes, ligne par ligne) pour que le propriétaire apprenne.
4. **Comment vérifier lui-même** dans le navigateur ou avec Docker, commandes exactes.
5. **Tests exécutés**, résultats réels et limites.
6. **Ce qu'il peut coder lui-même ensuite** : une petite tâche progressive pour s'exercer.

La première mission dans Codex doit être : **auditer et nettoyer la lisibilité du starter V1 sans modifier la logique métier, les comportements observables ou le design**. Commencer par un plan de refactorisation pédagogique, puis exécuter par incréments approuvés. Les fonctionnalités Supabase réelles viendront seulement ensuite.
