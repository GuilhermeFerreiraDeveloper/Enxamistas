'use client'

import { useEffect } from 'react'
import { ShieldAlert, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro de renderização:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-obsidian text-ivory flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-graphite border border-white/10 p-8 rounded-sm text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-royal-gold/10 border border-royal-gold/30 mx-auto">
          <ShieldAlert size={32} className="text-royal-gold" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-white">
          Falha ao carregar interface
        </h1>
        <p className="text-sm text-white/60">
          Ocorreu um erro inesperado ao exibir esta página. Tente novamente ou retorne ao portal.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => reset()} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw size={14} />
            Tentar Novamente
          </button>
        </div>
      </div>
    </main>
  )
}
