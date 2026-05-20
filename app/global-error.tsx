"use client"

import React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-[#111118]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Spotlight background */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white font-serif" style={{ fontFamily: "var(--font-serif)" }}>
              System Error
            </h2>
            
            <p className="text-sm text-gray-400">
              An unexpected system error occurred. We have logged this event and are investigating.
            </p>
            
            {error.message && (
              <div className="w-full p-3 rounded-lg bg-black/40 border border-white/5 text-left">
                <p className="text-xs font-mono text-red-400 break-all select-all">
                  {error.message}
                </p>
              </div>
            )}
            
            <button
              onClick={() => reset()}
              className="mt-4 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 transition-all font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 w-full"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
