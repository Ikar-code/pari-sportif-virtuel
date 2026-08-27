'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/** Bascule clair / sombre, mémorisée en localStorage. */
export function BasculeTheme() {
  const [sombre, setSombre] = useState(false)
  const [monte, setMonte] = useState(false)

  useEffect(() => {
    setSombre(document.documentElement.classList.contains('dark'))
    setMonte(true)
  }, [])

  function basculer() {
    const suivant = !sombre
    setSombre(suivant)
    document.documentElement.classList.toggle('dark', suivant)
    try {
      localStorage.setItem('theme', suivant ? 'dark' : 'light')
    } catch {
      // navigation privée : le thème ne sera simplement pas mémorisé
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      aria-label={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
    >
      {monte && sombre ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
