'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@enxamistas/shared'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Credenciais inválidas para o acesso de elite.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-obsidian relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-royal-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Left Side - Content/Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative z-10 border-r border-white/5 bg-black/20">
        <Link href="/" className="flex items-center gap-4 group">
          <img src="/icon.png" alt="Enxamistas" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-[0.3em] text-white">ENXAMISTAS</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-5xl font-bold text-white mb-8 tracking-tighter leading-tight">
            O ACESSO À <br />
            <span className="text-royal-gold text-glow-gold italic font-serif">SOFISTICAÇÃO.</span>
          </h2>
          <p className="text-white/40 text-lg font-medium leading-relaxed tracking-wide">
            Entre no portal oficial da organização e gerencie sua jornada acadêmica e social com a elite do servidor.
          </p>
        </div>

        <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
          <span>Legado</span>
          <span>Excelência</span>
          <span>Lealdade</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <Link href="/" className="lg:hidden flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-royal-gold transition-colors mb-8">
              <ArrowLeft size={14} />
              Início
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
              <ShieldCheck size={12} className="text-royal-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">Área Segura</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Portal de Acesso</h1>
            <p className="text-white/40 font-medium tracking-wide">Identifique-se para prosseguir à colmeia.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-sm text-xs font-bold uppercase tracking-wider animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <Input
                label="PASSAPORTE DE ELITE"
                placeholder="SEU ID ÚNICO"
                {...register('passport')}
                error={errors.passport?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/10 uppercase tracking-widest text-xs"
              />

              <Input
                label="CHAVE DE SEGURANÇA"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-xs"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-xs tracking-[0.3em]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "AUTENTICAR ACESSO"
              )}
            </Button>
          </form>

          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
              Não possui credenciais? {' '}
              <Link href="/cadastro" className="text-royal-gold hover:text-white transition-colors underline underline-offset-4">
                Solicite sua Candidatura
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
