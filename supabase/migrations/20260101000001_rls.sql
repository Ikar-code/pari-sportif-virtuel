-- ============================================================================
--  BÂTON ARENA — Row Level Security
--
--  Principe : le joueur ne peut jamais écrire ce qui a de la valeur.
--  Son solde, ses gains, ses cotes, ses résultats de match et son classement
--  passent tous par des fonctions SECURITY DEFINER ou par la clé de service.
--  Il ne garde la main que sur son avatar (nom, couleurs, répartition des points).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Fonctions d'aide
-- ----------------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.possede_avatar(p_avatar uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.avatars a where a.id = p_avatar and a.proprietaire_id = auth.uid()
  );
$$;

create or replace function public.possede_cosmetique(p_cosmetique uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.inventaires i
     where i.cosmetique_id = p_cosmetique and i.profil_id = auth.uid()
  );
$$;

/**
 * Vrai quand on se trouve à l'intérieur d'une fonction du moteur de jeu.
 * Les triggers de protection s'en servent pour laisser passer les écritures
 * légitimes (gains, elo, résultats) tout en bloquant celles du client.
 */
create or replace function public.moteur_actif()
returns boolean language sql stable as $$
  select coalesce(current_setting('app.moteur', true), '') = 'on';
$$;

grant execute on function public.est_admin()               to anon, authenticated;
grant execute on function public.possede_avatar(uuid)      to anon, authenticated;
grant execute on function public.possede_cosmetique(uuid)  to anon, authenticated;
grant execute on function public.moteur_actif()            to anon, authenticated;

-- ----------------------------------------------------------------------------
--  Activation
-- ----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.avatars            enable row level security;
alter table public.sports             enable row level security;
alter table public.cosmetiques        enable row level security;
alter table public.inventaires        enable row level security;
alter table public.equipements        enable row level security;
alter table public.matchs             enable row level security;
alter table public.participants_match enable row level security;
alter table public.evenements_match   enable row level security;
alter table public.paris              enable row level security;
alter table public.transactions       enable row level security;
alter table public.file_attente       enable row level security;

-- ----------------------------------------------------------------------------
--  profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.est_admin())
  with check (id = auth.uid() or public.est_admin());

-- Le solde et le rôle ne se modifient jamais depuis le client.
create or replace function public.proteger_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.moteur_actif() then
    if new.solde is distinct from old.solde then new.solde := old.solde; end if;
    if new.dernier_bonus_at is distinct from old.dernier_bonus_at then
      new.dernier_bonus_at := old.dernier_bonus_at;
    end if;
    if new.role is distinct from old.role and not public.est_admin() then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_proteger on public.profiles;
create trigger profiles_proteger before update on public.profiles
  for each row execute function public.proteger_profil();

-- ----------------------------------------------------------------------------
--  avatars
-- ----------------------------------------------------------------------------
drop policy if exists avatars_select on public.avatars;
create policy avatars_select on public.avatars for select using (true);

drop policy if exists avatars_insert on public.avatars;
create policy avatars_insert on public.avatars
  for insert to authenticated with check (proprietaire_id = auth.uid());

drop policy if exists avatars_update on public.avatars;
create policy avatars_update on public.avatars
  for update to authenticated
  using (proprietaire_id = auth.uid() or public.est_admin())
  with check (proprietaire_id = auth.uid() or public.est_admin());

drop policy if exists avatars_delete on public.avatars;
create policy avatars_delete on public.avatars
  for delete to authenticated using (proprietaire_id = auth.uid() or public.est_admin());

/**
 * Budget de statistiques.
 * À la création : 50 points répartis sur les 5 stats.
 * Ensuite : chaque niveau gagné apporte 3 points, et le total
 * (stats + points en réserve) doit rester exactement égal au budget.
 * On peut donc redistribuer librement, mais jamais gonfler ses stats.
 */
create or replace function public.budget_stats(p_niveau int)
returns int language sql immutable as $$
  select 50 + (greatest(p_niveau, 1) - 1) * 3;
$$;

create or replace function public.proteger_avatar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total int;
begin
  if tg_op = 'UPDATE' and not public.moteur_actif() then
    -- Progression et classement : réservés au moteur.
    new.elo       := old.elo;
    new.niveau    := old.niveau;
    new.xp        := old.xp;
    new.victoires := old.victoires;
    new.defaites  := old.defaites;
    new.est_bot   := old.est_bot;
  end if;

  v_total := new.vitesse + new.puissance + new.technique + new.endurance
           + new.mental + new.points_libres;

  if v_total <> public.budget_stats(new.niveau) then
    raise exception
      'Budget de statistiques invalide : % points répartis pour un budget de % au niveau %.',
      v_total, public.budget_stats(new.niveau), new.niveau;
  end if;

  return new;
end;
$$;

drop trigger if exists avatars_proteger on public.avatars;
create trigger avatars_proteger before insert or update on public.avatars
  for each row execute function public.proteger_avatar();

-- ----------------------------------------------------------------------------
--  sports & cosmetiques — catalogue public, écriture admin
-- ----------------------------------------------------------------------------
drop policy if exists sports_select on public.sports;
create policy sports_select on public.sports for select using (true);

drop policy if exists sports_admin on public.sports;
create policy sports_admin on public.sports for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists cosmetiques_select on public.cosmetiques;
create policy cosmetiques_select on public.cosmetiques for select using (true);

drop policy if exists cosmetiques_admin on public.cosmetiques;
create policy cosmetiques_admin on public.cosmetiques for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- ----------------------------------------------------------------------------
--  inventaires — lecture perso ; l'achat passe par acheter_cosmetique()
-- ----------------------------------------------------------------------------
drop policy if exists inventaires_select on public.inventaires;
create policy inventaires_select on public.inventaires
  for select to authenticated using (profil_id = auth.uid() or public.est_admin());

-- Volontairement aucune policy d'INSERT : sans passer à la caisse, pas d'objet.

-- ----------------------------------------------------------------------------
--  equipements — visibles de tous (on affiche les avatars partout),
--  modifiables par le propriétaire s'il possède bien le cosmétique
-- ----------------------------------------------------------------------------
drop policy if exists equipements_select on public.equipements;
create policy equipements_select on public.equipements for select using (true);

drop policy if exists equipements_ecriture on public.equipements;
create policy equipements_ecriture on public.equipements
  for all to authenticated
  using (public.possede_avatar(avatar_id))
  with check (public.possede_avatar(avatar_id) and public.possede_cosmetique(cosmetique_id));

-- ----------------------------------------------------------------------------
--  matchs, participants, événements
--  Lecture publique, écriture réservée au serveur (clé de service).
-- ----------------------------------------------------------------------------
drop policy if exists matchs_select on public.matchs;
create policy matchs_select on public.matchs for select using (true);

drop policy if exists participants_select on public.participants_match;
create policy participants_select on public.participants_match for select using (true);

drop policy if exists evenements_select on public.evenements_match;
create policy evenements_select on public.evenements_match for select using (true);

-- ----------------------------------------------------------------------------
--  paris — chacun voit les siens ; la mise passe par placer_pari()
-- ----------------------------------------------------------------------------
drop policy if exists paris_select on public.paris;
create policy paris_select on public.paris
  for select to authenticated using (parieur_id = auth.uid() or public.est_admin());

-- ----------------------------------------------------------------------------
--  transactions — lecture seule, et seulement les siennes
-- ----------------------------------------------------------------------------
drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated using (profil_id = auth.uid() or public.est_admin());

-- ----------------------------------------------------------------------------
--  file_attente — on gère sa propre entrée
-- ----------------------------------------------------------------------------
drop policy if exists file_select on public.file_attente;
create policy file_select on public.file_attente
  for select to authenticated using (profil_id = auth.uid() or public.est_admin());

drop policy if exists file_insert on public.file_attente;
create policy file_insert on public.file_attente
  for insert to authenticated with check (profil_id = auth.uid() and public.possede_avatar(avatar_id));

drop policy if exists file_delete on public.file_attente;
create policy file_delete on public.file_attente
  for delete to authenticated using (profil_id = auth.uid());

-- ----------------------------------------------------------------------------
--  Droits SQL (le RLS filtre les lignes, encore faut-il le droit sur la table)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.profiles, public.avatars, public.sports, public.cosmetiques,
  public.inventaires, public.equipements, public.matchs, public.participants_match,
  public.evenements_match, public.paris, public.transactions, public.file_attente
  to anon, authenticated;

grant insert, update, delete on public.profiles, public.avatars, public.equipements
  to authenticated;
grant insert, delete on public.file_attente to authenticated;
grant insert, update, delete on public.sports, public.cosmetiques to authenticated;

grant select on public.v_matchs      to anon, authenticated;
grant select on public.v_participants to anon, authenticated;
grant select on public.v_classement  to anon, authenticated;
