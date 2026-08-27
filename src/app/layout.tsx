import type { Metadata, Viewport } from 'next'
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { PiedPage } from '@/components/pied-page'
import { NOM_DU_JEU } from '@/lib/utils'

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: `${NOM_DU_JEU} — paris sportifs virtuels en monnaie fictive`,
    template: `%s · ${NOM_DU_JEU}`,
  },
  description:
    'Créez votre bonhomme bâton, affrontez des adversaires de votre niveau en 1v1, 2v2 ou 4v4, et pariez des jetons 100 % fictifs sur les matchs simulés.',
  openGraph: {
    title: NOM_DU_JEU,
    description: 'Arène de matchs simulés et paris en monnaie fictive.',
    locale: 'fr_FR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFE' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0E1A' },
  ],
}

/** Applique le thème avant le premier paint pour éviter le flash. */
const SCRIPT_THEME = `
try {
  var t = localStorage.getItem('theme');
  var sombre = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
  if (sombre) document.documentElement.classList.add('dark');
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <PiedPage />
      </body>
    </html>
  )
}
