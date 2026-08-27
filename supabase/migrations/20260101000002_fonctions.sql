-- ============================================================================
--  BÂTON ARENA — Les fonctions du moteur
--  Tout ce qui touche à l'argent fictif, au classement ou à la création de
--  match vit ici, en SECURITY DEFINER : le client appelle, il n'écrit jamais.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Mouvement de portefeuille (usage interne)
-- ----------------------------------------------------------------------------
create or replace function public.crediter(
  p_profil    uuid,
  p_montant   numeric,
  p_type      public.type_transaction,
  p_libelle   text default '',
  p_reference uuid default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solde numeric;
begin
  perform set_config('app.moteur', 'on', true);

  update public.profiles
     set solde = solde + p_montant
   where id = p_profil
  returning solde into v_solde;

  if v_solde is null then
    raise exception 'Profil introuvable.';
  end if;

  insert into public.transactions (profil_id, type, montant, solde_apres, libelle, reference_id)
  values (p_profil, p_type, p_montant, v_solde, p_libelle, p_reference);

  return v_solde;
end;
$$;

revoke execute on function public.crediter(uuid, numeric, public.type_transaction, text, uuid)
  from anon, authenticated;

-- ----------------------------------------------------------------------------
--  Bonus quotidien
-- ----------------------------------------------------------------------------
create or replace function public.reclamer_bonus_quotidien()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profil uuid := auth.uid();
  v_dernier timestamptz;
  v_montant numeric := 250;
  v_solde numeric;
begin
  if v_profil is null then
    return jsonb_build_object('ok', false, 'message', 'Connectez-vous pour réclamer votre bonus.');
  end if;

  select dernier_bonus_at into v_dernier
    from public.profiles where id = v_profil for update;

  if v_dernier is not null and v_dernier > now() - interval '20 hours' then
    return jsonb_build_object(
      'ok', false,
      'message', 'Bonus déjà réclamé. Revenez dans ' ||
        greatest(1, ceil(extract(epoch from (v_dernier + interval '20 hours' - now())) / 3600))::text ||
        ' h.'
    );
  end if;

  v_solde := public.crediter(v_profil, v_montant, 'bonus_quotidien', 'Bonus quotidien');

  perform set_config('app.moteur', 'on', true);
  update public.profiles set dernier_bonus_at = now() where id = v_profil;

  return jsonb_build_object(
    'ok', true,
    'message', '+' || v_montant::int || ' jetons crédités !',
    'solde', v_solde
  );
end;
$$;

-- ----------------------------------------------------------------------------
--  Boutique
-- ----------------------------------------------------------------------------
create or replace function public.acheter_cosmetique(p_cosmetique uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profil uuid := auth.uid();
  v_solde numeric;
  v_prix numeric;
  v_nom text;
begin
  if v_profil is null then
    return jsonb_build_object('ok', false, 'message', 'Connectez-vous pour acheter.');
  end if;

  select prix, nom into v_prix, v_nom
    from public.cosmetiques where id = p_cosmetique and actif;

  if v_prix is null then
    return jsonb_build_object('ok', false, 'message', 'Cet article n''existe plus.');
  end if;

  if exists (select 1 from public.inventaires
              where profil_id = v_profil and cosmetique_id = p_cosmetique) then
    return jsonb_build_object('ok', false, 'message', 'Vous possédez déjà cet article.');
  end if;

  select solde into v_solde from public.profiles where id = v_profil for update;

  if v_solde < v_prix then
    return jsonb_build_object(
      'ok', false,
      'message', 'Solde insuffisant : il vous manque ' || (v_prix - v_solde)::int || ' jetons.'
    );
  end if;

  insert into public.inventaires (profil_id, cosmetique_id, prix_paye)
  values (v_profil, p_cosmetique, v_prix);

  v_solde := public.crediter(v_profil, -v_prix, 'achat_boutique', 'Achat : ' || v_nom, p_cosmetique);

  return jsonb_build_object('ok', true, 'message', v_nom || ' ajouté à votre inventaire.', 'solde', v_solde);
end;
$$;

-- ----------------------------------------------------------------------------
--  Placer un pari
-- ----------------------------------------------------------------------------
create or replace function public.placer_pari(p_match uuid, p_camp text, p_mise numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profil uuid := auth.uid();
  v_solde numeric;
  v_match record;
  v_cote numeric;
begin
  if v_profil is null then
    return jsonb_build_object('ok', false, 'message', 'Connectez-vous pour parier.');
  end if;

  if p_camp not in ('A', 'B') then
    return jsonb_build_object('ok', false, 'message', 'Camp invalide.');
  end if;

  p_mise := round(p_mise, 2);
  if p_mise is null or p_mise < 10 then
    return jsonb_build_object('ok', false, 'message', 'La mise minimale est de 10 jetons.');
  end if;

  select * into v_match from public.matchs where id = p_match for update;

  if v_match is null then
    return jsonb_build_object('ok', false, 'message', 'Match introuvable.');
  end if;
  if v_match.statut <> 'a_venir' or now() >= v_match.date_coup_envoi then
    return jsonb_build_object('ok', false, 'message', 'Les paris sont clos sur ce match.');
  end if;
  if exists (select 1 from public.paris where match_id = p_match and parieur_id = v_profil) then
    return jsonb_build_object('ok', false, 'message', 'Vous avez déjà un pari sur ce match.');
  end if;

  v_cote := case when p_camp = 'A' then v_match.cote_a else v_match.cote_b end;

  select solde into v_solde from public.profiles where id = v_profil for update;
  if v_solde < p_mise then
    return jsonb_build_object('ok', false, 'message', 'Solde insuffisant.');
  end if;

  insert into public.paris (match_id, parieur_id, camp, mise, cote, gain_potentiel)
  values (p_match, v_profil, p_camp, p_mise, v_cote, round(p_mise * v_cote, 2));

  v_solde := public.crediter(v_profil, -p_mise, 'mise', 'Mise sur le camp ' || p_camp, p_match);

  return jsonb_build_object(
    'ok', true,
    'message', 'Pari enregistré : ' || p_mise::int || ' jetons sur le camp ' || p_camp ||
               ' (cote ' || v_cote || ').',
    'solde', v_solde
  );
end;
$$;

-- ----------------------------------------------------------------------------
--  Recherche de match (matchmaking)
--
--  On cherche d'abord des adversaires humains dont l'elo est proche, dans une
--  fenêtre que l'appelant élargit au fil de l'attente. Faute de monde, on
--  complète avec des adversaires gérés par la machine, eux aussi choisis par
--  proximité d'elo : une arène vide reste jouable.
-- ----------------------------------------------------------------------------
create or replace function public.rechercher_match(
  p_sport uuid,
  p_format int,
  p_tolerance int default 150,
  p_autoriser_bots boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profil uuid := auth.uid();
  v_avatar record;
  v_besoin int;
  v_ids uuid[];
  v_profils_files uuid[];
  v_match uuid;
  v_id uuid;
  v_index int := 0;
  v_camp text;
begin
  if v_profil is null then
    raise exception 'Connectez-vous pour lancer une recherche.';
  end if;
  if p_format not in (1, 2, 4) then
    raise exception 'Format invalide.';
  end if;

  select * into v_avatar from public.avatars where proprietaire_id = v_profil;
  if v_avatar is null then
    raise exception 'Créez d''abord votre avatar.';
  end if;

  -- Ménage : une file d'attente abandonnée ne doit pas bloquer les suivants.
  delete from public.file_attente where created_at < now() - interval '10 minutes';

  insert into public.file_attente (profil_id, avatar_id, sport_id, format, elo)
  values (v_profil, v_avatar.id, p_sport, p_format, v_avatar.elo)
  on conflict (profil_id) do update
    set avatar_id = excluded.avatar_id,
        sport_id  = excluded.sport_id,
        format    = excluded.format,
        elo       = excluded.elo;

  v_besoin := p_format * 2 - 1;

  -- 1) Les humains qui attendent, du plus proche au plus lointain en elo
  select array_agg(f.avatar_id order by abs(f.elo - v_avatar.elo)),
         array_agg(f.profil_id order by abs(f.elo - v_avatar.elo))
    into v_ids, v_profils_files
  from (
    select avatar_id, profil_id, elo
      from public.file_attente
     where sport_id = p_sport
       and format = p_format
       and profil_id <> v_profil
       and abs(elo - v_avatar.elo) <= p_tolerance
     order by abs(elo - v_avatar.elo)
     limit v_besoin
     for update skip locked
  ) f;

  v_ids := coalesce(v_ids, '{}'::uuid[]);
  v_profils_files := coalesce(v_profils_files, '{}'::uuid[]);

  -- 2) Complément par des adversaires de la machine
  if array_length(v_ids, 1) is null or array_length(v_ids, 1) < v_besoin then
    if not p_autoriser_bots then
      return null;                              -- on continue d'attendre du monde
    end if;

    v_ids := v_ids || array(
      select a.id from public.avatars a
       where a.est_bot
         and a.id <> all(v_ids)
       order by abs(a.elo - v_avatar.elo), random()
       limit v_besoin - coalesce(array_length(v_ids, 1), 0)
    );
  end if;

  if coalesce(array_length(v_ids, 1), 0) < v_besoin then
    raise exception 'Pas assez d''adversaires disponibles pour ce format.';
  end if;

  -- 3) Création du match. Les cotes définitives sont calculées juste après par
  --    le moteur Node (simulation de Monte-Carlo) ; on part sur du 50/50.
  insert into public.matchs (sport_id, format)
  values (p_sport, p_format)
  returning id into v_match;

  -- 4) Répartition en serpentin : A, B, B, A, A, B… pour équilibrer les camps
  --    puisque la liste est déjà triée par proximité d'elo.
  insert into public.participants_match (match_id, avatar_id, camp)
  values (v_match, v_avatar.id, 'A');

  foreach v_id in array v_ids loop
    v_index := v_index + 1;
    if v_index <= p_format - 1 then
      v_camp := 'A';                             -- on complète d'abord l'équipe du joueur
    else
      v_camp := 'B';
    end if;
    insert into public.participants_match (match_id, avatar_id, camp)
    values (v_match, v_id, v_camp);
  end loop;

  -- 5) Tout le monde quitte la file
  delete from public.file_attente
   where profil_id = v_profil or profil_id = any(v_profils_files);

  return v_match;
end;
$$;

-- ----------------------------------------------------------------------------
--  Règlement d'un match
--  Appelé par le serveur une fois la simulation écrite : paie les paris,
--  met à jour l'elo, l'expérience et les compteurs.
-- ----------------------------------------------------------------------------
create or replace function public.regler_match(p_match uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_gagnant text;
  v_elo_a numeric;
  v_elo_b numeric;
  v_attendu_a numeric;
  v_k int := 32;
  v_pari record;
  v_part record;
  v_gain numeric;
  v_nb_paris int := 0;
  v_score_reel numeric;
  v_delta int;
begin
  perform set_config('app.moteur', 'on', true);

  select * into v_match from public.matchs where id = p_match for update;
  if v_match is null then
    return jsonb_build_object('ok', false, 'message', 'Match introuvable.');
  end if;
  if v_match.statut = 'termine' then
    return jsonb_build_object('ok', true, 'message', 'Match déjà réglé.');
  end if;
  if v_match.score_a is null or v_match.score_b is null then
    return jsonb_build_object('ok', false, 'message', 'Le match n''a pas encore de score.');
  end if;

  v_gagnant := case
    when v_match.score_a > v_match.score_b then 'A'
    when v_match.score_b > v_match.score_a then 'B'
    else null
  end;

  -- ---- Paris ---------------------------------------------------------------
  for v_pari in select * from public.paris where match_id = p_match and statut = 'en_attente' loop
    v_nb_paris := v_nb_paris + 1;

    if v_gagnant is null then
      update public.paris
         set statut = 'rembourse', gain_reel = v_pari.mise, regle_at = now()
       where id = v_pari.id;
      perform public.crediter(v_pari.parieur_id, v_pari.mise, 'remboursement',
                              'Match nul — mise remboursée', p_match);

    elsif v_pari.camp = v_gagnant then
      v_gain := round(v_pari.mise * v_pari.cote, 2);
      update public.paris
         set statut = 'gagne', gain_reel = v_gain, regle_at = now()
       where id = v_pari.id;
      perform public.crediter(v_pari.parieur_id, v_gain, 'gain',
                              'Pari gagné (cote ' || v_pari.cote || ')', p_match);

    else
      update public.paris
         set statut = 'perdu', gain_reel = 0, regle_at = now()
       where id = v_pari.id;
    end if;
  end loop;

  -- ---- Classement Elo ------------------------------------------------------
  select avg(a.elo) into v_elo_a
    from public.participants_match pm join public.avatars a on a.id = pm.avatar_id
   where pm.match_id = p_match and pm.camp = 'A';

  select avg(a.elo) into v_elo_b
    from public.participants_match pm join public.avatars a on a.id = pm.avatar_id
   where pm.match_id = p_match and pm.camp = 'B';

  v_attendu_a := 1.0 / (1.0 + power(10.0, (v_elo_b - v_elo_a) / 400.0));

  for v_part in
    select pm.camp, a.*
      from public.participants_match pm
      join public.avatars a on a.id = pm.avatar_id
     where pm.match_id = p_match
  loop
    v_score_reel := case
      when v_gagnant is null then 0.5
      when v_part.camp = v_gagnant then 1.0
      else 0.0
    end;

    v_delta := round(
      v_k * (v_score_reel - case when v_part.camp = 'A' then v_attendu_a else 1 - v_attendu_a end)
    );

    update public.avatars
       set elo = greatest(100, elo + v_delta),
           victoires = victoires + case when v_score_reel = 1.0 then 1 else 0 end,
           defaites  = defaites  + case when v_score_reel = 0.0 then 1 else 0 end,
           xp = xp + case when v_score_reel = 1.0 then 60 else 25 end
     where id = v_part.id;

    -- Montée de niveau : +3 points de statistiques à répartir par niveau
    loop
      exit when (select xp from public.avatars where id = v_part.id)
                < (select niveau * 100 from public.avatars where id = v_part.id);
      update public.avatars
         set xp = xp - niveau * 100,
             niveau = niveau + 1,
             points_libres = points_libres + 3
       where id = v_part.id;
    end loop;

    -- Prime de victoire pour les joueurs humains
    if v_score_reel = 1.0 and v_part.proprietaire_id is not null then
      perform public.crediter(v_part.proprietaire_id, 50, 'prime_victoire',
                              'Victoire en arène', p_match);
    end if;
  end loop;

  update public.matchs
     set statut = 'termine', date_fin = coalesce(date_fin, now())
   where id = p_match;

  return jsonb_build_object('ok', true, 'paris_regles', v_nb_paris, 'gagnant', v_gagnant);
end;
$$;

-- ----------------------------------------------------------------------------
--  Droits d'exécution
--  regler_match n'est PAS exposée au client : seul le serveur l'appelle,
--  avec la clé de service, après avoir écrit le résultat de la simulation.
-- ----------------------------------------------------------------------------
grant execute on function public.reclamer_bonus_quotidien()                  to authenticated;
grant execute on function public.acheter_cosmetique(uuid)                    to authenticated;
grant execute on function public.placer_pari(uuid, text, numeric)            to authenticated;
grant execute on function public.rechercher_match(uuid, int, int, boolean)   to authenticated;

revoke execute on function public.regler_match(uuid) from anon, authenticated;
