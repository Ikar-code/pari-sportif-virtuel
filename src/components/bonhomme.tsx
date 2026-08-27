import { cn } from '@/lib/utils'
import type { Tenue } from '@/lib/types'

/**
 * Le bonhomme bâton.
 *
 * Tout est en SVG inline : aucune image à héberger, ça se colore à l'infini et
 * ça reste net à toutes les tailles. Les cosmétiques sont des calques dessinés
 * par-dessus (ou derrière) le squelette, pilotés par `donnees.forme` en base.
 *
 * Repères du dessin (viewBox 100 × 150) :
 *   tête     centre (50, 30), rayon 17
 *   tronc    (50, 47) -> (50, 95)
 *   épaules  y = 60,  mains  (24, 82) et (76, 82)
 *   bassin   y = 95,  pieds  (30, 132) et (70, 132)
 */

export type ApparenceBonhomme = {
  couleur_corps: string
  couleur_tete: string
  couleur_accent: string
}

export function Bonhomme({
  apparence,
  tenue,
  taille = 160,
  className,
  anime = false,
  regardeAGauche = false,
}: {
  apparence: ApparenceBonhomme
  tenue?: Tenue
  taille?: number
  className?: string
  /** Léger flottement — réservé aux mises en avant. */
  anime?: boolean
  /** Retourne le personnage : pratique pour un face-à-face. */
  regardeAGauche?: boolean
}) {
  const { couleur_corps: corps, couleur_tete: teint, couleur_accent: accent } = apparence

  const chapeau = tenue?.chapeau?.donnees
  const visage = tenue?.visage?.donnees
  const accessoire = tenue?.accessoire?.donnees
  const cape = tenue?.cape?.donnees
  const aura = tenue?.aura?.donnees

  return (
    <svg
      viewBox="0 0 100 150"
      width={taille}
      height={(taille * 150) / 100}
      className={cn(anime && 'animate-flotte', className)}
      style={regardeAGauche ? { transform: 'scaleX(-1)' } : undefined}
      role="img"
      aria-label="Avatar bonhomme bâton"
    >
      {/* ---------------------------------------------------------- Aura */}
      {aura?.forme === 'flammes' && (
        <g opacity={0.75}>
          <path
            d="M50 148 C 22 132, 26 108, 38 96 C 36 112, 46 116, 46 104 C 52 112, 62 106, 58 94 C 74 106, 78 132, 50 148 Z"
            fill={aura.couleur ?? '#F97316'}
            opacity={0.35}
          />
        </g>
      )}
      {aura?.forme === 'etincelles' && (
        <g fill={aura.couleur ?? '#FDE047'}>
          {[
            [14, 40],
            [86, 52],
            [20, 96],
            [82, 100],
            [50, 6],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z`}
              opacity={0.9}
            />
          ))}
        </g>
      )}
      {aura?.forme === 'halo' && (
        <ellipse
          cx="50"
          cy="6"
          rx="20"
          ry="5"
          fill="none"
          stroke={aura.couleur ?? '#38BDF8'}
          strokeWidth="3"
          opacity={0.9}
        />
      )}

      {/* ---------------------------------------------------------- Cape */}
      {cape?.forme === 'cape' && (
        <path
          d="M34 58 C 20 82, 18 108, 26 126 L 50 116 L 74 126 C 82 108, 80 82, 66 58 Z"
          fill={cape.couleur ?? '#DC2626'}
          opacity={0.9}
        />
      )}

      {/* ------------------------------------------------------- Squelette */}
      <g
        stroke={corps}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      >
        <line x1="50" y1="47" x2="50" y2="95" />
        <line x1="50" y1="60" x2="24" y2="82" />
        <line x1="50" y1="60" x2="76" y2="82" />
        <line x1="50" y1="95" x2="30" y2="132" />
        <line x1="50" y1="95" x2="70" y2="132" />
      </g>

      {/* Écharpe aux couleurs d'accent */}
      <path
        d="M40 50 Q 50 56, 60 50"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ------------------------------------------------------------ Tête */}
      <circle cx="50" cy="30" r="17" fill={teint} stroke={corps} strokeWidth="4" />

      {/* Masque : recouvre la tête, on redessine les yeux par-dessus */}
      {visage?.forme === 'masque' && (
        <circle cx="50" cy="30" r="17" fill={visage.couleur ?? '#DC2626'} />
      )}

      {/* Yeux et bouche */}
      <g fill="#111827">
        <circle cx="43" cy="27" r="2.2" />
        <circle cx="57" cy="27" r="2.2" />
      </g>
      <path
        d="M43 37 Q 50 42, 57 37"
        stroke="#111827"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ---------------------------------------------------------- Visage */}
      {visage?.forme === 'lunettes' && (
        <g stroke={visage.couleur ?? '#111827'} strokeWidth="2" fill="none">
          <circle cx="43" cy="27" r="6" />
          <circle cx="57" cy="27" r="6" />
          <line x1="49" y1="27" x2="51" y2="27" />
        </g>
      )}
      {visage?.forme === 'lunettes-soleil' && (
        <g fill={visage.couleur ?? '#111827'}>
          <rect x="35" y="22" width="13" height="9" rx="3" />
          <rect x="52" y="22" width="13" height="9" rx="3" />
          <rect x="47" y="25" width="6" height="2.5" />
        </g>
      )}
      {visage?.forme === 'moustache' && (
        <path
          d="M42 36 Q 50 32, 58 36 Q 50 39, 42 36 Z"
          fill={visage.couleur ?? '#4B2E1E'}
        />
      )}

      {/* --------------------------------------------------------- Chapeau */}
      {chapeau?.forme === 'casquette' && (
        <g fill={chapeau.couleur ?? '#EF4444'}>
          <path d="M33 20 A 17 17 0 0 1 67 20 Z" />
          <rect x="31" y="18" width="38" height="5" rx="2.5" />
          <rect x="63" y="17" width="20" height="5" rx="2.5" />
        </g>
      )}
      {chapeau?.forme === 'bandeau' && (
        <g fill={chapeau.couleur ?? '#F59E0B'}>
          <rect x="33" y="17" width="34" height="6" rx="3" />
          <path d="M65 20 L 82 14 L 80 22 Z" />
        </g>
      )}
      {chapeau?.forme === 'casque' && (
        <g fill={chapeau.couleur ?? '#FACC15'}>
          <path d="M32 21 A 18 18 0 0 1 68 21 Z" />
          <rect x="28" y="19" width="44" height="5" rx="2.5" />
        </g>
      )}
      {chapeau?.forme === 'haut-de-forme' && (
        <g fill={chapeau.couleur ?? '#1F2937'}>
          <rect x="30" y="15" width="40" height="4" rx="2" />
          <rect x="38" y="-4" width="24" height="20" rx="2" />
          <rect x="38" y="9" width="24" height="4" fill="#EF4444" />
        </g>
      )}
      {chapeau?.forme === 'couronne' && (
        <path
          d="M34 18 L 34 4 L 42 11 L 50 1 L 58 11 L 66 4 L 66 18 Z"
          fill={chapeau.couleur ?? '#FFB020'}
          stroke="#B45309"
          strokeWidth="1.5"
        />
      )}

      {/* ------------------------------------------------------ Accessoire */}
      {accessoire?.forme === 'ballon' && (
        <g>
          <circle cx="83" cy="86" r="9" fill={accessoire.couleur ?? '#F97316'} />
          <path d="M76 82 Q 83 90, 90 82" stroke="#fff" strokeWidth="1.5" fill="none" />
        </g>
      )}
      {accessoire?.forme === 'epee' && (
        <g stroke={accessoire.couleur ?? '#94A3B8'} strokeLinecap="round">
          <line x1="78" y1="82" x2="96" y2="46" strokeWidth="4" />
          <line x1="72" y1="80" x2="84" y2="86" strokeWidth="3" />
        </g>
      )}
      {accessoire?.forme === 'raquette' && (
        <g>
          <line
            x1="76"
            y1="82"
            x2="86"
            y2="70"
            stroke={accessoire.couleur ?? '#10B981'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="90"
            cy="62"
            rx="7"
            ry="9"
            fill="none"
            stroke={accessoire.couleur ?? '#10B981'}
            strokeWidth="3"
          />
        </g>
      )}
      {accessoire?.forme === 'drapeau' && (
        <g>
          <line x1="78" y1="86" x2="78" y2="40" stroke="#8D5524" strokeWidth="3" />
          <path d="M78 42 L 98 49 L 78 56 Z" fill={accessoire.couleur ?? '#7C5CFF'} />
        </g>
      )}
    </svg>
  )
}

/** Version compacte pour les listes : le buste uniquement, dans une pastille. */
export function Vignette({
  apparence,
  tenue,
  taille = 44,
  className,
}: {
  apparence: ApparenceBonhomme
  tenue?: Tenue
  taille?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted',
        className,
      )}
      style={{ width: taille, height: taille }}
    >
      <svg viewBox="8 4 84 62" width={taille} height={taille} aria-hidden>
        {tenue?.aura?.donnees.forme === 'halo' && (
          <ellipse
            cx="50"
            cy="8"
            rx="18"
            ry="4"
            fill="none"
            stroke={tenue.aura.donnees.couleur ?? '#38BDF8'}
            strokeWidth="3"
          />
        )}
        <g
          stroke={apparence.couleur_corps}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        >
          <line x1="50" y1="47" x2="50" y2="64" />
          <line x1="50" y1="58" x2="30" y2="66" />
          <line x1="50" y1="58" x2="70" y2="66" />
        </g>
        <circle
          cx="50"
          cy="30"
          r="17"
          fill={apparence.couleur_tete}
          stroke={apparence.couleur_corps}
          strokeWidth="4"
        />
        {tenue?.visage?.donnees.forme === 'masque' && (
          <circle cx="50" cy="30" r="17" fill={tenue.visage.donnees.couleur ?? '#DC2626'} />
        )}
        <g fill="#111827">
          <circle cx="43" cy="27" r="2.2" />
          <circle cx="57" cy="27" r="2.2" />
        </g>
        {tenue?.chapeau?.donnees.forme === 'couronne' && (
          <path
            d="M34 18 L 34 4 L 42 11 L 50 1 L 58 11 L 66 4 L 66 18 Z"
            fill={tenue.chapeau.donnees.couleur ?? '#FFB020'}
          />
        )}
        {tenue?.chapeau?.donnees.forme === 'casquette' && (
          <g fill={tenue.chapeau.donnees.couleur ?? '#EF4444'}>
            <path d="M33 20 A 17 17 0 0 1 67 20 Z" />
            <rect x="31" y="18" width="38" height="5" rx="2.5" />
          </g>
        )}
      </svg>
    </span>
  )
}
