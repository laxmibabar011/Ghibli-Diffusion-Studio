"use client"

import * as React from "react"

interface ThemeProviderProps {
    children: React.ReactNode
    theme: "light" | "dark"
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
    React.useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
    }, [theme])

    return <>{children}</>
}
