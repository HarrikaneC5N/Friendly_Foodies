# AGENTS.md — Friendly Foodies

## Mission
Tu es Codex, développeur de Friendly Foodies : **véritable application sociale de découverte culinaire fondée sur une carte 2D immersive**, mobile-first, accessible dans le navigateur et installable en PWA. Ce n'est pas une démo de portfolio. Préserver strictement le cahier des charges V1 approuvé et la direction Figma.

**Références (par priorité) :** décisions explicites du propriétaire > cahier des charges V1 validé > ce fichier > maquettes Figma > code starter. Si une maquette comporte un élément non validé par le cahier des charges, ne l'implémente pas automatiquement. Documenter et faire arbitrer les ambiguïtés métier ; ne rien inventer silencieusement.

Maquettes V1 (desktop/mobile) : https://www.figma.com/design/7CNt12jxJjlfXk7R5i8dHP/Friendly-Foodies?node-id=16-2

## Stack et direction artistique
- React 19, TypeScript strict, Vite, PWA avec `vite-plugin-pwa`, CSS responsive, icônes `lucide-react`.
- Supabase Auth, PostgreSQL/PostGIS, Supabase Storage ; politiques RLS **obligatoires**.
- MapLibre GL JS pour la carte 2D ; choix définitif du fond de carte, coûts, quotas, licences et attribution à vérifier.
- Design Figma : fond crème `#FAF5ED`, vert profond `#193F33`, vert `#317967`, accent corail `#F16E51`, composants arrondis, carte centrale esthétique. Desktop et mobile cohérents.
- Objectif de départ **0 €** dans les limites des offres gratuites ; jamais de dépendance payante sans accord.
- UI en français ; types, fonctions et variables en anglais. Composants accessibles clavier/lecteur d'écran, états chargement, erreur et vide.

## Règles produit V1 non négociables
### Carte et établissements
- Accueil **map-first**, pas de feed Instagram. Deux modes : **Mes amis** (posts accessibles des amis réciproques) et **Découvrir** (posts PUBLICS visibles aussi aux visiteurs sans compte).
- Un marqueur par établissement regroupant toutes les visites ; en mode amis avatar d'un ami + badge « +N » ; en Découvrir marqueur neutre de lieu, pas d'avatar arbitraire.
- Taper le marqueur : aperçu photo/grade puis fiche du lieu. Afficher le grade/résumé global **avant** les posts individuels.
- Recherche d'établissement ; filtres découverte V1 **exactement deux** : distance précise en km et grade global **minimum** (« au moins A »). **Pas de filtre catégorie/cuisine** dans la V1, même s'il apparaît dans un ancien prototype graphique.
- Plusieurs catégories visibles par établissement, avec catégorie « Autre » et libellé personnalisé attaché uniquement au lieu. Établissements de tous genres culinaires.
- Ajouter un lieu par recherche ou en déposant une épingle, avec suggestions anti-doublons. Si le GPS est refusé, proposer un emplacement choisi ou le centre de carte. Ne pas supposer Paris hors données de démo.

### Expériences et grades
- Une expérience = un post lié à un lieu et un auteur ; **5 photos maximum**, optimisées/compressées, texte bref, note C/B/A/S.
- Grades : **C décevant, B correct, A excellent, S exceptionnel/mémorable**. Correspondance numérique et arrondi **à arbitrer** (le starter utilise provisoirement C=1/B=2/A=3/S=4).
- Date de visite **facultative** : absente, jour précis ou mois/année seulement ; horodatage de publication distinct.
- Visibilité « **Amis uniquement** » sélectionnée par défaut ; « Public » facultatif. Le membre peut modifier après publication sa visibilité, son texte, ses photos, sa note et sa date ; plusieurs visites au même lieu sont distinctes.
- Grade de lieu = **moyenne des moyennes personnelles par auteur** : chaque auteur contribue une seule moyenne quel que soit le nombre de visites. Les données publiques doivent exclure tout contenu privé non autorisé. Détails d'affichage et de visibilité de l'agrégat à confirmer.

### Utilisateurs et social
- Google, Apple, e-mail **sans mot de passe** vérifié par OTP/lien. L'exploration des publications et profils PUBLICS reste accessible aux invités.
- Pseudonyme unique obligatoire, avatar facultatif, autocomplétion des @pseudos, changement **une fois tous les 21 jours** contrôlé côté serveur.
- Amis **réciproques** : demande, acceptation/refus, retrait silencieux, blocage. Une demande en attente ne donne aucun droit de lecture du privé.
- Deux réactions seulement : « Je valide » et « Pas pour moi ». **Pas de commentaires, messages privés, feed social traditionnel** dans la V1.
- Partage externe par lien/natif ; un lien partagé ne contourne **jamais** la confidentialité.
- Notifications **uniquement** demande d'ami reçue et réaction sur une publication ; aucune notification de nouvelle publication ni retrait d'ami.
- Signalement pour toute personne pouvant consulter le contenu (y compris visiteur anonyme pour contenu public) avec protections anti-abus ; **modération humaine uniquement** et journal admin. Suppression de compte avec confirmation et effacement données/médias conforme aux obligations applicables.

## Sécurité, vie privée et qualité
- RLS sur chaque table Supabase ; jamais de confiance dans un simple filtrage JS. Tester anonyme, auteur, non-ami, demande en attente, ami accepté, ami retiré, utilisateur bloqué et admin.
- Assurer l'inaccessibilité des posts privés via API, RPC, previews, agrégats, URL directes ou photos Storage. Les calculs publics n'utilisent que les contenus publics. Attention aux inférences par marqueurs et compteurs.
- Validation côté serveur : photos (nombre/type/taille), note, date, propriétaire, pseudo/cooldown, réactions, édition, rate limiting et abus sur demandes/signalements.
- Ne jamais mettre `service_role`, tokens, secrets ou données privées dans le front, les logs, la documentation ou les commits. Seuls URL Supabase et `anon/publishable key` peuvent être exposés dans `VITE_*` avec RLS. Ne jamais commiter `.env.local`, `node_modules`, `dist`, photos privées ou dumps.
- Pas de migration destructive, élargissement de politiques d'accès, déploiement public ou suppression de données sans revue et accord.
- Respecter RGPD, licences des tuiles, SEO de base pour les pages publiques, performances de carte (zone visible, clustering si nécessaire), photos chargées à la demande et accessibilité.

## État actuel et ordre de livraison
Le starter initial (s'il a été importé) est une **démo** cartographique à Paris avec lieux/avis fictifs ; les intégrations réelles de publications, amis, réactions, notifications, signalement, admin et suppression de compte ne sont **pas terminées**. Ne jamais marquer une fonctionnalité livrée sur la seule présence d'une maquette ou table SQL.

Étapes conseillées : (1) installer et valider le starter, auditer sécurité SQL et RLS ; (2) authentification et profils/handles ; (3) lieux et carte alimentés par Supabase ; (4) publications/Photos Storage et édition ; (5) amis, blocage et mode « Mes amis » ; (6) réactions, notifications, liens, signalements/admin ; (7) suppression de compte, tests R01–R16, performances et mise en ligne.

## Workflow Codex à suivre pour chaque tâche
1. Lire `AGENTS.md`, `README.md`, les migrations et la partie pertinente du cahier des charges ; identifier les décisions non prises.
2. Annoncer en français le périmètre exact, les critères d'acceptation et risques de confidentialité ; privilégier un incrément vertical petit et testable.
3. Implémenter sans régression métier ni divergence graphique, avec états responsive et tests adaptés. Documenter toute migration et politique RLS.
4. Lancer si possible `npm run typecheck`, `npm run test`, `npm run build`. Distinguer tests effectivement passés de vérifications non réalisées.
5. En fin de tâche fournir : fichiers modifiés, comportements **réellement opérationnels**, résultats des tests, risques/limites, arbitrages nécessaires et prochaine étape. N'invente jamais une réussite.
6. Commits ciblés, branches `feat/...` ou `fix/...`, PR claires. Garder les données de démonstration explicitement fictives.

**V1 prête = scénarios de recette R01–R16 passés, confidentialité vérifiée, suppression du compte fonctionnelle et licences/coûts validés.**
