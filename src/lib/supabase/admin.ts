import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client à privilèges élevés : il ignore le RLS.
 *
 * Réservé au moteur de jeu — écriture des scores, des événements de match et
 * déclenchement du règlement des paris. Un joueur ne doit jamais pouvoir écrire
 * ces lignes lui-même, sinon il choisirait ses propres résultats.
 *
 * La clé n'est PAS préfixée NEXT_PUBLIC_ : elle ne quitte jamais le serveur.
 */
export function creerClientService() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!cle) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante : le moteur ne peut pas enregistrer les matchs.',
    )
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
