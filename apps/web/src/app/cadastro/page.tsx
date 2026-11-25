'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Loader2, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@enxamistas/shared'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function RegisterPage() {
  const { registerUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses')
        setCourses(response.data)
        setCoursesError(null)
      } catch (err) {
        console.error('Falha ao carregar cursos', err)
        setCoursesError('Não foi possível carregar os cursos disponíveis no momento.')
      }
    }
    fetchCourses()
  }, [])

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      await registerUser(data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ocorreu um erro ao processar sua candidatura.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-obsidian relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-royal-gold/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Left Side - Content/Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative z-10 border-r border-white/5 bg-black/20">
        <Link href="/" className="flex items-center gap-4 group">
          <img src="/logos/Logo-2.png" alt="Enxamistas" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-500" />
          <span className="text-2xl font-bold tracking-[0.3em] text-white">ENXAMISTAS</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-5xl font-bold text-white mb-8 tracking-tighter leading-tight">
            SOLICITE SEU <br />
            <span className="text-royal-gold text-glow-gold italic font-serif">LUGAR NA ELITE.</span>
          </h2>
          <p className="text-white/40 text-lg font-medium leading-relaxed tracking-wide">
            A admissão na Enxamistas é baseada na excelência. Preencha seus dados para iniciar o processo de avaliação oficial.
          </p>
        </div>

        <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
          <span>Academia</span>
          <span>Prestígio</span>
          <span>Influência</span>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-12 py-12">
          <div className="space-y-4">
            <Link href="/" className="lg:hidden flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-royal-gold transition-colors mb-8">
              <ArrowLeft size={14} />
              Início
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
              <ShieldCheck size={12} className="text-royal-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">Candidatura Oficial</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Formulário de Ingresso</h1>
            <p className="text-white/40 font-medium tracking-wide">Inicie seu processo de recrutamento na organização.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-sm text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <Input
                label="NOME COMPLETO"
                placeholder="EX: MAVERICK"
                {...register('name')}
                error={errors.name?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/10 uppercase tracking-widest text-xs"
              />

              <Input
                label="PASSAPORTE"
                placeholder="SEU ID DE CIDADÃO"
                {...register('passport')}
                error={errors.passport?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/10 uppercase tracking-widest text-xs"
              />

              <Input
                label="CHAVE DE SEGURANÇA"
                type="password"
                placeholder="CRIE UMA SENHA FORTE"
                {...register('password')}
                error={errors.password?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-xs"
              />

              <Select
                label="CURSO PRINCIPAL"
                defaultValue=""
                {...register('mainCourseId')}
                error={errors.mainCourseId?.message || coursesError || undefined}
                options={courses.map(c => ({ label: c.name.toUpperCase(), value: c.id }))}
                className="bg-white/5 border-white/10 text-white text-xs tracking-widest"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-xs tracking-[0.3em] flex items-center gap-3" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  ENVIAR CANDIDATURA
                  <Send size={14} />
                </>
              )}
            </Button>
          </form>

          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
              Já possui acesso ao portal? {' '}
              <Link href="/login" className="text-royal-gold hover:text-white transition-colors underline underline-offset-4">
                Fazer Autenticação
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
