-- ============================================================================
--  BÂTON ARENA — Schéma initial
--  Paris sportifs 100 % fictifs : la monnaie n'a aucune valeur réelle.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ----------------------------------------------------------------------------
--  Types énumérés
-- ----------------------------------------------------------------------------
do $$ begin create type public.role_utilisateur as enum ('joueur', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.statut_match as enum ('a_venir', 'en_cours', 'termine', 'annule');
exception when duplicate_object then null; end $$;

do $$ begin create type public.statut_pari as enum ('en_attente', 'gagne', 'perdu', 'rembourse');
exception when duplicate_object then null; end $$;

do $$ begin create type public.categorie_cosmetique as enum ('chapeau', 'visage', 'accessoire', 'cape', 'aura');
exception when duplicate_object then null; end $$;

do $$ begin create type public.rarete as enum ('commun', 'rare', 'epique', 'legendaire');
exception when duplicate_object then null; end $$;

do $$ begin create type public.type_transaction as enum (
  'bonus_inscription', 'bonus_quotidien', 'mise', 'gain', 'remboursement',
  'achat_boutique', 'prime_victoire'
);
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
--  Utilitaires
-- ----------------------------------------------------------------------------
create or replace function public.slugify(v text)
returns text language sql stable as $$
  select nullif(trim(both '-' from regexp_replace(
    lower(public.unaccent(coalesce(v, ''))), '[^a-z0-9]+', '-', 'g')), '');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
--  profiles — le compte joueur et son portefeuille
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  pseudo            text not null default '',
  email             text,
  avatar_url        text,
  solde             numeric(14, 2) not null default 1000 check (solde >= 0),
  role              public.role_utilisateur not null default 'joueur',
  dernier_bonus_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists profiles_pseudo_uidx on public.profiles(lower(pseudo)) where pseudo <> '';

-- ----------------------------------------------------------------------------
--  avatars — le bonhomme bâton, avec ses stats et son classement
--  proprietaire_id vaut NULL pour les adversaires gérés par la machine.
-- ----------------------------------------------------------------------------
create table if not exists public.avatars (
  id             uuid primary key default gen_random_uuid(),
  proprietaire_id uuid references public.profiles(id) on delete cascade,
  nom            text not null,
  couleur_corps  text not null default '#7C5CFF',
  couleur_tete   text not null default '#FFD9A0',
  couleur_accent text not null default '#22D3EE',

  -- Les 5 statistiques, de 1 à 20
  vitesse    int not null default 10 check (vitesse    between 1 and 20),
  puissance  int not null default 10 check (puissance  between 1 and 20),
  technique  int not null default 10 check (technique  between 1 and 20),
  endurance  int not null default 10 check (endurance  between 1 and 20),
  mental     int not null default 10 check (mental     between 1 and 20),
  points_libres int not null default 0 check (points_libres >= 0),

  niveau     int not null default 1 check (niveau >= 1),
  xp         int not null default 0 check (xp >= 0),
  elo        int not null default 1000,
  victoires  int not null default 0,
  defaites   int not null default 0,
  est_bot    boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avatars_proprietaire_idx on public.avatars(proprietaire_id);
create index if not exists avatars_elo_idx on public.avatars(elo);
create index if not exists avatars_bot_elo_idx on public.avatars(est_bot, elo);

-- Un joueur humain n'a qu'un seul avatar.
create unique index if not exists avatars_un_par_joueur
  on public.avatars(proprietaire_id) where proprietaire_id is not null;

-- ----------------------------------------------------------------------------
--  sports — les disciplines virtuelles et leur pondération de stats
--  poids : { "vitesse": 0.45, "puissance": 0.05, ... } — la somme doit faire 1
-- ----------------------------------------------------------------------------
create table if not exists public.sports (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null unique,
  slug        text unique,
  icone       text not null default '🏅',
  description text,
  poids       jsonb not null,
  nb_actions  int not null default 12 check (nb_actions between 3 and 60),
  formats     int[] not null default '{1,2,4}',
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  cosmetiques — la boutique
--  donnees : paramètres de rendu SVG ({"couleur":"#f00","forme":"haut-de-forme"})
-- ----------------------------------------------------------------------------
create table if not exists public.cosmetiques (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null unique,
  slug       text unique,
  categorie  public.categorie_cosmetique not null,
  rarete     public.rarete not null default 'commun',
  prix       numeric(12, 2) not null default 100 check (prix >= 0),
  donnees    jsonb not null default '{}'::jsonb,
  description text,
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists cosmetiques_categorie_idx on public.cosmetiques(categorie);

-- ----------------------------------------------------------------------------
--  inventaires — ce que le joueur possède
-- ----------------------------------------------------------------------------
create table if not exists public.inventaires (
  id            uuid primary key default gen_random_uuid(),
  profil_id     uuid not null references public.profiles(id) on delete cascade,
  cosmetique_id uuid not null references public.cosmetiques(id) on delete cascade,
  prix_paye     numeric(12, 2) not null default 0,
  obtenu_at     timestamptz not null default now(),
  unique (profil_id, cosmetique_id)
);

-- ----------------------------------------------------------------------------
--  equipements — un cosmétique équipé par emplacement
-- ----------------------------------------------------------------------------
create table if not exists public.equipements (
  avatar_id     uuid not null references public.avatars(id) on delete cascade,
  categorie     public.categorie_cosmetique not null,
  cosmetique_id uuid not null references public.cosmetiques(id) on delete cascade,
  primary key (avatar_id, categorie)
);

-- ----------------------------------------------------------------------------
--  matchs — une rencontre simulée
--  seed : graine du générateur pseudo-aléatoire. Même graine = même match,
--  ce qui permet de rejouer une simulation à l'identique.
-- ----------------------------------------------------------------------------
create table if not exists public.matchs (
  id              uuid primary key default gen_random_uuid(),
  sport_id        uuid not null references public.sports(id) on delete restrict,
  format          int not null check (format in (1, 2, 4)),
  statut          public.statut_match not null default 'a_venir',
  seed            bigint not null default (floor(random() * 2147483647))::bigint,

  date_coup_envoi timestamptz not null default (now() + interval '90 seconds'),
  date_fin        timestamptz,

  score_a         int,
  score_b         int,
  mvp_avatar_id   uuid references public.avatars(id) on delete set null,

  -- Cotes figées à la création (calculées par le moteur, marge incluse)
  proba_a         numeric(6, 4) not null default 0.5 check (proba_a > 0 and proba_a < 1),
  cote_a          numeric(6, 2) not null default 1.9 check (cote_a >= 1.01),
  cote_b          numeric(6, 2) not null default 1.9 check (cote_b >= 1.01),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists matchs_statut_idx on public.matchs(statut, date_coup_envoi);
create index if not exists matchs_sport_idx  on public.matchs(sport_id);

-- ----------------------------------------------------------------------------
--  participants_match — quel avatar dans quel camp
-- ----------------------------------------------------------------------------
create table if not exists public.participants_match (
  id        uuid primary key default gen_random_uuid(),
  match_id  uuid not null references public.matchs(id) on delete cascade,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  camp      text not null check (camp in ('A', 'B')),
  unique (match_id, avatar_id)
);

create index if not exists participants_match_idx  on public.participants_match(match_id);
create index if not exists participants_avatar_idx on public.participants_match(avatar_id);

-- ----------------------------------------------------------------------------
--  evenements_match — le déroulé produit par le moteur de simulation
-- ----------------------------------------------------------------------------
create table if not exists public.evenements_match (
  id        uuid primary key default gen_random_uuid(),
  match_id  uuid not null references public.matchs(id) on delete cascade,
  ordre     int not null,
  minute    int not null default 0,
  type      text not null default 'action',
  camp      text check (camp in ('A', 'B')),
  avatar_id uuid references public.avatars(id) on delete set null,
  texte     text not null,
  unique (match_id, ordre)
);

create index if not exists evenements_match_idx on public.evenements_match(match_id, ordre);

-- ----------------------------------------------------------------------------
--  paris — la mise d'un joueur sur un camp
-- ----------------------------------------------------------------------------
create table if not exists public.paris (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references public.matchs(id) on delete cascade,
  parieur_id     uuid not null references public.profiles(id) on delete cascade,
  camp           text not null check (camp in ('A', 'B')),
  mise           numeric(12, 2) not null check (mise > 0),
  cote           numeric(6, 2) not null check (cote >= 1.01),
  gain_potentiel numeric(14, 2) not null,
  statut         public.statut_pari not null default 'en_attente',
  gain_reel      numeric(14, 2) not null default 0,
  created_at     timestamptz not null default now(),
  regle_at       timestamptz,
  -- Un pari par match et par joueur : on ne mise pas sur les deux camps.
  unique (match_id, parieur_id)
);

create index if not exists paris_parieur_idx on public.paris(parieur_id, created_at desc);
create index if not exists paris_match_idx   on public.paris(match_id);

-- ----------------------------------------------------------------------------
--  transactions — le grand livre du portefeuille
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  profil_id    uuid not null references public.profiles(id) on delete cascade,
  type         public.type_transaction not null,
  montant      numeric(14, 2) not null,          -- négatif = sortie
  solde_apres  numeric(14, 2) not null,
  libelle      text not null default '',
  reference_id uuid,                              -- match, pari ou cosmétique
  created_at   timestamptz not null default now()
);

create index if not exists transactions_profil_idx on public.transactions(profil_id, created_at desc);

-- ----------------------------------------------------------------------------
--  file_attente — la recherche de match
-- ----------------------------------------------------------------------------
create table if not exists public.file_attente (
  profil_id  uuid primary key references public.profiles(id) on delete cascade,
  avatar_id  uuid not null references public.avatars(id) on delete cascade,
  sport_id   uuid not null references public.sports(id) on delete cascade,
  format     int not null check (format in (1, 2, 4)),
  elo        int not null,
  created_at timestamptz not null default now()
);

create index if not exists file_attente_recherche_idx
  on public.file_attente(sport_id, format, elo);

-- ----------------------------------------------------------------------------
--  Triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then new.slug := public.slugify(new.nom); end if;
  return new;
end;
$$;

drop trigger if exists sports_slug on public.sports;
create trigger sports_slug before insert or update on public.sports
  for each row execute function public.set_slug();

drop trigger if exists cosmetiques_slug on public.cosmetiques;
create trigger cosmetiques_slug before insert or update on public.cosmetiques
  for each row execute function public.set_slug();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists avatars_touch on public.avatars;
create trigger avatars_touch before update on public.avatars
  for each row execute function public.touch_updated_at();

drop trigger if exists matchs_touch on public.matchs;
create trigger matchs_touch before update on public.matchs
  for each row execute function public.touch_updated_at();

-- Création du profil + capital de départ à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pseudo text;
begin
  v_pseudo := coalesce(
    nullif(new.raw_user_meta_data ->> 'pseudo', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),   -- Google
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1)
  );

  -- Un pseudo pris ? on suffixe, personne n'aime une inscription qui échoue.
  if exists (select 1 from public.profiles p where lower(p.pseudo) = lower(v_pseudo)) then
    v_pseudo := v_pseudo || '-' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, pseudo, email, avatar_url, solde)
  values (
    new.id,
    v_pseudo,
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    1000
  )
  on conflict (id) do nothing;

  insert into public.transactions (profil_id, type, montant, solde_apres, libelle)
  values (new.id, 'bonus_inscription', 1000, 1000, 'Capital de départ')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
--  Vues
-- ----------------------------------------------------------------------------

-- Match enrichi : sport, effectifs des deux camps, statut recalculé
create or replace view public.v_matchs
with (security_invoker = on) as
select
  m.*,
  s.nom   as sport_nom,
  s.slug  as sport_slug,
  s.icone as sport_icone,
  (select count(*) from public.paris p where p.match_id = m.id)::int as nb_paris,
  (select coalesce(sum(p.mise), 0) from public.paris p where p.match_id = m.id) as total_mise,
  case
    when m.statut in ('termine', 'annule') then m.statut
    when now() >= m.date_coup_envoi then 'en_cours'::public.statut_match
    else 'a_venir'::public.statut_match
  end as statut_effectif
from public.matchs m
join public.sports s on s.id = m.sport_id;

-- Participants enrichis (avatar + propriétaire) — sert partout où on affiche une équipe
create or replace view public.v_participants
with (security_invoker = on) as
select
  pm.id,
  pm.match_id,
  pm.camp,
  a.id as avatar_id,
  a.nom as avatar_nom,
  a.couleur_corps,
  a.couleur_tete,
  a.couleur_accent,
  a.vitesse, a.puissance, a.technique, a.endurance, a.mental,
  a.niveau, a.elo, a.est_bot,
  a.proprietaire_id,
  pr.pseudo as proprietaire_pseudo
from public.participants_match pm
join public.avatars a on a.id = pm.avatar_id
left join public.profiles pr on pr.id = a.proprietaire_id;

-- Classement des avatars
create or replace view public.v_classement
with (security_invoker = on) as
select
  a.id as avatar_id,
  a.nom,
  a.elo,
  a.niveau,
  a.victoires,
  a.defaites,
  a.couleur_corps,
  a.couleur_tete,
  a.couleur_accent,
  a.est_bot,
  a.proprietaire_id,
  p.pseudo as proprietaire_pseudo,
  case when (a.victoires + a.defaites) = 0 then 0
       else round(a.victoires::numeric * 100 / (a.victoires + a.defaites), 1)
  end as taux_victoire
from public.avatars a
left join public.profiles p on p.id = a.proprietaire_id;
