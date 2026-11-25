'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-obsidian text-ivory flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-sm bg-royal-gold/5 border border-royal-gold/20 mb-4 shadow-gold-glow animate-pulse">
          <ShieldAlert size={48} className="text-royal-gold" />
        </div>
        
        <h1 className="text-8xl font-bold text-white tracking-tighter">404</h1>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-[0.3em] text-royal-gold">Acesso Negado</h2>
          <p className="text-white/40 font-medium tracking-wide max-w-md mx-auto">
            A inteligência solicitada não foi encontrada ou o seu nível de acesso não permite a visualização deste setor da colmeia.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/" className="btn-primary inline-flex items-center gap-3">
            <ArrowLeft size={16} />
            RETORNAR À BASE
          </Link>
        </div>
      </div>
    </main>
  )
}
