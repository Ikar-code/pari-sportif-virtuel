-- ============================================================================
--  BÂTON ARENA — Données de départ
--  Rejouable : tout est en "on conflict do nothing".
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Les disciplines
--  poids : comment chaque statistique compte dans cette discipline (somme = 1)
--  nb_actions : nombre d'occasions de marquer sur un match
-- ----------------------------------------------------------------------------
insert into public.sports (nom, icone, description, poids, nb_actions, formats) values
  ('Sprint Bâton', '🏃',
   'Ligne droite, 100 mètres, pas de pitié. La vitesse pure décide.',
   '{"vitesse":0.50,"endurance":0.25,"mental":0.15,"technique":0.05,"puissance":0.05}', 6, '{1,2,4}'),

  ('Foot Bâton', '⚽',
   'Le grand classique de l''arène : technique, course et sang-froid.',
   '{"technique":0.30,"vitesse":0.25,"endurance":0.20,"mental":0.15,"puissance":0.10}', 16, '{1,2,4}'),

  ('Sumo Bâton', '🤼',
   'Deux bâtons, un cercle. On pousse jusqu''à ce qu''il en reste un.',
   '{"puissance":0.45,"mental":0.25,"technique":0.15,"endurance":0.10,"vitesse":0.05}', 7, '{1,2}'),

  ('Basket Bâton', '🏀',
   'Adresse et détente. Les paniers s''enchaînent vite.',
   '{"technique":0.30,"vitesse":0.20,"mental":0.20,"puissance":0.20,"endurance":0.10}', 24, '{1,2,4}'),

  ('Tir de précision', '🏹',
   'Respiration, visée, lâcher. Le mental fait tout basculer.',
   '{"mental":0.45,"technique":0.40,"endurance":0.10,"vitesse":0.03,"puissance":0.02}', 10, '{1,2}'),

  ('Course d''obstacles', '🧗',
   'Murs, cordes et pneus. Il faut du souffle et des bras.',
   '{"endurance":0.35,"vitesse":0.25,"puissance":0.20,"technique":0.15,"mental":0.05}', 9, '{1,2,4}'),

  ('Balle au prisonnier', '🎯',
   'Esquiver, viser, éliminer. Chaos organisé.',
   '{"vitesse":0.30,"technique":0.25,"puissance":0.25,"mental":0.20,"endurance":0.00}', 14, '{2,4}'),

  ('Relais 4 × 100', '🏁',
   'Quatre bâtons, un témoin, zéro droit à l''erreur au passage.',
   '{"vitesse":0.40,"endurance":0.25,"technique":0.20,"mental":0.15,"puissance":0.00}', 8, '{4}')
on conflict (nom) do nothing;

-- ----------------------------------------------------------------------------
--  La boutique
--  donnees.forme pilote le rendu SVG côté client (composant <Bonhomme />)
-- ----------------------------------------------------------------------------
insert into public.cosmetiques (nom, categorie, rarete, prix, donnees, description) values
  -- Chapeaux
  ('Casquette rouge',      'chapeau', 'commun',     150,  '{"forme":"casquette","couleur":"#EF4444"}',    'La base du vestiaire.'),
  ('Casquette néon',       'chapeau', 'rare',       400,  '{"forme":"casquette","couleur":"#22D3EE"}',    'On vous voit de loin.'),
  ('Bandeau du guerrier',  'chapeau', 'commun',     150,  '{"forme":"bandeau","couleur":"#F59E0B"}',      'Pour retenir la sueur et le style.'),
  ('Casque de chantier',   'chapeau', 'rare',       400,  '{"forme":"casque","couleur":"#FACC15"}',       'Sécurité avant tout, même en sumo.'),
  ('Haut-de-forme',        'chapeau', 'epique',     900,  '{"forme":"haut-de-forme","couleur":"#1F2937"}','Élégance discutable, efficacité prouvée.'),
  ('Couronne dorée',       'chapeau', 'legendaire', 2000, '{"forme":"couronne","couleur":"#FFB020"}',     'Réservée à ceux qui gagnent souvent.'),

  -- Visages
  ('Lunettes rondes',      'visage', 'commun',     150,  '{"forme":"lunettes","couleur":"#111827"}',      'L''air intelligent, gratuitement.'),
  ('Lunettes de soleil',   'visage', 'rare',       400,  '{"forme":"lunettes-soleil","couleur":"#111827"}','Le match est déjà gagné.'),
  ('Masque de catcheur',   'visage', 'epique',     900,  '{"forme":"masque","couleur":"#DC2626"}',        'Personne ne saura qui vous êtes.'),
  ('Moustache',            'visage', 'commun',     150,  '{"forme":"moustache","couleur":"#4B2E1E"}',     'Un classique intemporel.'),

  -- Accessoires
  ('Ballon fétiche',       'accessoire', 'commun',     150,  '{"forme":"ballon","couleur":"#F97316"}',   'Il ne quitte jamais sa main.'),
  ('Raquette',             'accessoire', 'commun',     150,  '{"forme":"raquette","couleur":"#10B981"}', 'Utile ou pas, c''est joli.'),
  ('Épée en mousse',       'accessoire', 'rare',       400,  '{"forme":"epee","couleur":"#94A3B8"}',     'Interdite en compétition officielle.'),
  ('Drapeau de la victoire','accessoire','epique',     900,  '{"forme":"drapeau","couleur":"#7C5CFF"}',  'À planter après le dernier point.'),

  -- Capes
  ('Cape écarlate',        'cape', 'rare',       400,  '{"forme":"cape","couleur":"#DC2626"}',  'Flotte au vent, même en salle.'),
  ('Cape royale',          'cape', 'epique',     900,  '{"forme":"cape","couleur":"#6D28D9"}',  'Doublure en velours virtuel.'),
  ('Cape d''or',           'cape', 'legendaire', 2000, '{"forme":"cape","couleur":"#FFB020"}',  'Le luxe absolu du bonhomme bâton.'),

  -- Auras
  ('Halo bleu',            'aura', 'rare',       400,  '{"forme":"halo","couleur":"#38BDF8"}',      'Une présence apaisante.'),
  ('Étincelles',           'aura', 'epique',     900,  '{"forme":"etincelles","couleur":"#FDE047"}','Ça crépite à chaque pas.'),
  ('Aura de flammes',      'aura', 'legendaire', 2000, '{"forme":"flammes","couleur":"#F97316"}',   'Chaud devant.')
on conflict (nom) do nothing;

-- ----------------------------------------------------------------------------
--  Adversaires gérés par la machine
--
--  Sans eux, un joueur seul ne trouverait jamais de match. On en crée 48,
--  répartis de 700 à 1700 d'elo, avec des profils de statistiques variés
--  mais toujours un budget de 50 points (la contrainte du jeu s'applique
--  aussi à la machine — pas d'adversaire gonflé aux hormones).
-- ----------------------------------------------------------------------------
do $$
declare
  v_prenoms text[] := array[
    'Zébulon', 'Kro', 'Pixel', 'Momo', 'Turbo', 'Gaston', 'Nino', 'Wanda',
    'Bulle', 'Rocco', 'Sido', 'Kiwi', 'Vega', 'Nash', 'Lulu', 'Orso'];
  v_titres text[] := array[
    'le Rapide', 'la Tornade', 'le Massif', 'de l''Est', 'le Malin',
    'le Patient', 'la Flèche', 'le Bulldozer', 'le Sournois', 'la Comète',
    'le Tranquille', 'le Bavard'];
  v_couleurs text[] := array[
    '#7C5CFF', '#22D3EE', '#F97316', '#10B981', '#EF4444', '#EC4899',
    '#FACC15', '#38BDF8', '#A855F7', '#14B8A6'];
  v_teints text[] := array['#FFD9A0', '#F1C27D', '#C68642', '#8D5524', '#FFE0BD'];

  v_stats int[];
  v_source int;
  v_cible int;
  v_nom text;
  v_elo int;
  i int;
  j int;
begin
  -- On ne rejoue pas la génération si les bots sont déjà là.
  if exists (select 1 from public.avatars where est_bot) then
    return;
  end if;

  for i in 0..47 loop
    -- Point de départ équilibré : 10 partout, soit les 50 points du budget.
    v_stats := array[10, 10, 10, 10, 10];

    -- 18 transferts d'un point : ça crée des profils typés sans jamais
    -- changer le total ni sortir des bornes 1–20.
    for j in 1..18 loop
      v_source := 1 + floor(random() * 5)::int;
      v_cible  := 1 + floor(random() * 5)::int;
      if v_source <> v_cible
         and v_stats[v_source] > 1
         and v_stats[v_cible] < 20 then
        v_stats[v_source] := v_stats[v_source] - 1;
        v_stats[v_cible]  := v_stats[v_cible] + 1;
      end if;
    end loop;

    v_nom := v_prenoms[1 + (i % array_length(v_prenoms, 1))] || ' ' ||
             v_titres[1 + ((i * 7) % array_length(v_titres, 1))];

    -- Elo étalé de 700 à 1700 pour couvrir tous les niveaux de joueur
    v_elo := 700 + (i * 21) + floor(random() * 40)::int;

    insert into public.avatars (
      proprietaire_id, nom, couleur_corps, couleur_tete, couleur_accent,
      vitesse, puissance, technique, endurance, mental,
      elo, est_bot, victoires, defaites
    ) values (
      null,
      v_nom,
      v_couleurs[1 + (i % array_length(v_couleurs, 1))],
      v_teints[1 + (i % array_length(v_teints, 1))],
      v_couleurs[1 + ((i + 3) % array_length(v_couleurs, 1))],
      v_stats[1], v_stats[2], v_stats[3], v_stats[4], v_stats[5],
      v_elo,
      true,
      floor(random() * 40)::int,
      floor(random() * 40)::int
    );
  end loop;
end $$;
