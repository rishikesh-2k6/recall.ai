"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "dark" | "light" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: "dark" | "light"   // the actual applied theme
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "dark",
})

function getOSTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(t: Theme): "dark" | "light" {
  const root = document.documentElement
  const resolved: "dark" | "light" = t === "system" ? getOSTheme() : t
  if (resolved === "light") {
    root.classList.add("light")
    root.classList.remove("dark")
  } else {
    root.classList.remove("light")
    root.classList.add("dark")
  }
  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark")

  // On mount: read persisted preference, apply it, set up OS listener
  useEffect(() => {
    const saved = localStorage.getItem("recall-theme") as Theme | null
    const initial: Theme =
      saved === "dark" || saved === "light" || saved === "system" ? saved : "system"
    setThemeState(initial)
    setResolvedTheme(applyTheme(initial))

    // When OS changes, re-apply if current choice is "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handleOSChange = () => {
      const current = (localStorage.getItem("recall-theme") as Theme | null) ?? "system"
      if (current === "system") {
        setResolvedTheme(applyTheme("system"))
      }
    }
    mq.addEventListener("change", handleOSChange)
    return () => mq.removeEventListener("change", handleOSChange)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    setResolvedTheme(applyTheme(t))
    localStorage.setItem("recall-theme", t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
