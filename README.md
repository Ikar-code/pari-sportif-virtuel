# Bâton Arena ⚔️

Paris sportifs virtuels en **monnaie 100 % fictive**. Chaque joueur crée un bonhomme bâton
personnalisable, l'envoie affronter des adversaires de son niveau en 1v1, 2v2 ou 4v4 sur des
disciplines virtuelles, et mise des jetons sur l'issue des matchs — simulés par un moteur
déterministe.

> **Ce n'est pas un site d'argent.** Les jetons ne s'achètent pas, ne se vendent pas et ne se
> convertissent en rien. Un bonus quotidien en redonne à tout le monde : personne ne peut perdre
> autre chose que du temps de jeu.

**Stack** — Next.js 15 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) ·
Tailwind CSS · déploiement Vercel.

Le nom du jeu tient dans une constante (`NOM_DU_JEU` dans [src/lib/utils.ts](src/lib/utils.ts)) :
changez-la et il suit partout.

---

## 1. Mettre en place Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor** et exécutez les quatre fichiers **dans cet ordre** :

   | Ordre | Fichier | Contenu |
   |---|---|---|
   | 1 | `supabase/migrations/20260101000000_schema.sql` | tables, vues, triggers |
   | 2 | `supabase/migrations/20260101000001_rls.sql` | Row Level Security |
   | 3 | `supabase/migrations/20260101000002_fonctions.sql` | paris, boutique, matchmaking, règlement |
   | 4 | `supabase/migrations/20260101000003_seed.sql` | 8 disciplines, 20 cosmétiques, 48 adversaires |

   Les scripts sont **rejouables** : les relancer ne crée pas de doublons.

3. **Authentication → Providers → Email** : laissez activé. Pour tester vite sans boîte mail,
   désactivez *Confirm email* (à réactiver en production).

4. **Authentication → Providers → Google** : activez-le et collez le *Client ID* / *Client Secret*
   obtenus dans la [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (type « Application Web »). L'URI de redirection autorisée à déclarer côté Google est celle
   que Supabase vous affiche, de la forme `https://<projet>.supabase.co/auth/v1/callback`.

5. **Authentication → URL Configuration** : ajoutez `http://localhost:3000/auth/callback` et
   `https://<votre-domaine>/auth/callback`.

---

## 2. Lancer en local

```bash
npm install
cp .env.local.example .env.local   # puis remplissez les 3 clés
npm run dev
```

| Variable | Où la trouver | Exposée au navigateur ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → *Project URL* | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → *anon public* | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → *service_role* | **non, jamais** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local | oui |

La clé `service_role` ignore le RLS. Elle sert uniquement au moteur, côté serveur, pour écrire
les scores et déclencher le paiement des paris. Ne la préfixez jamais `NEXT_PUBLIC_`, et ne
l'utilisez nulle part ailleurs que dans [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts).

### Se donner les droits admin

```sql
update public.profiles set role = 'admin' where email = 'votre@email.fr';
```

---

## 3. Déployer sur Vercel

```bash
git init
git add .
git commit -m "Bâton Arena : première version"
git branch -M main
git remote add origin https://github.com/<vous>/baton-arena.git
git push -u origin main
```

Puis sur [vercel.com](https://vercel.com) → **Add New Project** → importez le dépôt → ajoutez les
4 variables d'environnement (avec `NEXT_PUBLIC_SITE_URL` = l'URL Vercel) → Deploy.

---

## Les pages

| Route | Rôle |
|---|---|
| `/` | Lobby : votre bonhomme, paris ouverts, derniers résultats, top 5 |
| `/login` | Connexion / inscription, e-mail-mot de passe ou Google |
| `/avatar` | Création et personnalisation du bonhomme + vestiaire |
| `/jouer` | Recherche de match : discipline, format, matchmaking par elo |
| `/matchs` · `/matchs/[id]` | Liste des rencontres, fiche match, paris, déroulé |
| `/boutique` | Cosmétiques, avec aperçu sur votre propre bonhomme |
| `/portefeuille` | Solde, bonus quotidien, historique des paris et mouvements |
| `/classement` | Les bonshommes triés par elo |
| `/profil` | Compte, statistiques, bilan des paris |

---

## Comment ça marche

### Le moteur de simulation

Tout est dans [src/lib/simulation/](src/lib/simulation/) et ne dépend **ni de la base, ni du
réseau, ni de l'horloge**.

- **[aleatoire.ts](src/lib/simulation/aleatoire.ts)** — un générateur pseudo-aléatoire à graine
  (mulberry32). Aucun `Math.random()` nulle part : à partir de la même graine, un match rejoué
  donne exactement le même déroulé.
- **[moteur.ts](src/lib/simulation/moteur.ts)** — le match se joue en `nb_actions` occasions. À
  chaque occasion, chaque camp tire une force = sa note pondérée par la discipline, corrigée par
  la fatigue (amortie par l'endurance), le sang-froid (le mental, seulement dans le dernier quart)
  et une part de hasard. Écart trop faible → occasion sans but. Sinon le camp marque, et le buteur
  est tiré au sort pondéré par sa note.
- **[cotes.ts](src/lib/simulation/cotes.ts)** — les cotes ne viennent pas d'une formule inventée :
  le moteur rejoue le match **2 000 fois** avec des graines dérivées, différentes de celle du match
  réel. On obtient la vraie probabilité de victoire telle que le jeu la produit, à laquelle on
  applique une marge de 6 %.
- **[commentaires.ts](src/lib/simulation/commentaires.ts)** — le vocabulaire de chaque discipline.

Une commande vérifie tout ça sans toucher à la base :

```bash
npm run verifier:moteur
```

Elle contrôle le déterminisme, la cohérence score/événements, le fait que les statistiques pèsent
réellement, et que les cotes restent équilibrées entre deux joueurs identiques.

### Le matchmaking

`rechercher_match()` (SQL) cherche d'abord des **joueurs humains** en file d'attente dont l'elo est
proche, dans une fenêtre que le client élargit au fil de l'attente (`120 + 12 × secondes`, plafonné
à 600). Faute de monde, il complète avec des **adversaires gérés par la machine**, eux aussi choisis
par proximité d'elo.

Ce point n'est pas un détail : sans eux, une arène vide serait injouable. Les 48 bots du seed
couvrent 700 à 1700 d'elo et respectent le même budget de 50 points de statistiques que les
joueurs — aucun adversaire gonflé.

### Le cycle d'un match

1. Le matchmaking crée le match, coup d'envoi à +90 secondes.
2. Le serveur calcule les cotes (2 000 simulations) et les fige. **Les paris ouvrent.**
3. À l'heure du coup d'envoi, le premier chargement de page qui touche ce match déclenche la
   simulation — pas de tâche planifiée à maintenir. Un verrou optimiste garantit qu'elle ne tourne
   qu'une fois, et un match resté bloqué plus de 30 secondes est repris automatiquement.
4. `regler_match()` (SQL, en une transaction) paie les paris gagnants, rembourse en cas de nul,
   met à jour l'elo (K = 32), l'expérience et les compteurs.

### Ce qu'un joueur peut écrire, et ce qu'il ne peut pas

C'est le cœur de la sécurité du jeu : dans un site de paris, tout ce qui a de la valeur doit
échapper au client.

| | Écriture directe | Comment ça passe |
|---|---|---|
| Son avatar (nom, couleurs, répartition des points) | ✅ | RLS + trigger de budget |
| Son pseudo | ✅ | RLS |
| Équiper un cosmétique | ✅ | RLS, à condition de le posséder |
| Son solde | ❌ | fonctions SQL `SECURITY DEFINER` |
| Placer un pari | ❌ | `placer_pari()` — solde et fenêtre vérifiés en transaction |
| Acheter un cosmétique | ❌ | `acheter_cosmetique()` |
| Elo, niveau, victoires | ❌ | `regler_match()` uniquement |
| Score d'un match, événements | ❌ | clé de service, côté serveur |

Trois triggers verrouillent le reste : `proteger_profil` (solde et rôle intouchables depuis le
client), `proteger_avatar` (progression réservée au moteur, budget de statistiques toujours
respecté) et le drapeau de session `app.moteur` qui distingue une écriture légitime du moteur
d'une tentative venue du navigateur.

### Le bonhomme bâton

[src/components/bonhomme.tsx](src/components/bonhomme.tsx) est du SVG inline : aucune image à
héberger, ça se colore à l'infini et ça reste net à toutes les tailles. Les cosmétiques sont des
calques dessinés par-dessus (ou derrière) le squelette, pilotés par le champ `donnees.forme` en
base — ajouter un chapeau, c'est une ligne de SQL et un `case` dans le composant.

---

## Pistes pour la suite

- Rejouer un match action par action, en temps réel, plutôt que d'afficher le déroulé d'un bloc
- Paris combinés et paris sur le meilleur joueur du match
- Saisons avec remise à zéro de l'elo et récompenses cosmétiques
- Tournois à élimination directe
- Upload de logos et d'avatars via Supabase Storage
