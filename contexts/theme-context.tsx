"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")

  // Load persisted preference
  useEffect(() => {
    const saved = localStorage.getItem("verbatim-theme") as Theme | null
    if (saved === "light" || saved === "dark") {
      setThemeState(saved)
      applyTheme(saved)
    }
  }, [])

  function applyTheme(t: Theme) {
    const root = document.documentElement
    if (t === "light") {
      root.classList.add("light")
      root.classList.remove("dark")
    } else {
      root.classList.remove("light")
      root.classList.add("dark")
    }
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    applyTheme(t)
    localStorage.setItem("verbatim-theme", t)
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
