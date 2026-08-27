import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Palette Bâton Arena
        neon: { DEFAULT: 'hsl(var(--neon))', foreground: 'hsl(var(--neon-foreground))' },
        cyan: { DEFAULT: 'hsl(var(--cyan))', foreground: 'hsl(var(--cyan-foreground))' },
        jeton: { DEFAULT: 'hsl(var(--jeton))', foreground: 'hsl(var(--jeton-foreground))' },
        succes: 'hsl(var(--succes))',
        alerte: 'hsl(var(--alerte))',
        danger: 'hsl(var(--danger))',
        campA: 'hsl(var(--camp-a))',
        campB: 'hsl(var(--camp-b))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(8, 10, 24, .06), 0 10px 30px -16px rgba(8, 10, 24, .35)',
        'carte-hover': '0 2px 6px rgba(8, 10, 24, .08), 0 20px 50px -20px rgba(8, 10, 24, .5)',
        neon: '0 0 0 1px hsl(var(--neon) / .4), 0 8px 30px -8px hsl(var(--neon) / .5)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.4', transform: 'scale(.8)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        flotte: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        balayage: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'fade-up': 'fadeUp .35s ease-out both',
        flotte: 'flotte 3s ease-in-out infinite',
        balayage: 'balayage 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
