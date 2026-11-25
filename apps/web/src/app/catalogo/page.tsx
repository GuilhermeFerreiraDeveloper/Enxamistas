'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, GraduationCap, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface PublicCourse {
  id: string;
  name: string;
  description?: string;
  teacher?: { name: string } | null;
  schedules: { id: string; dayOfWeek: number; startTime: string }[];
}

export default function CatalogoPublicoPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Não foi possível carregar o catálogo acadêmico no momento.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    selectedDay === 'ALL'
      ? courses
      : courses.filter((c) => c.schedules.some((s) => s.dayOfWeek === selectedDay));

  return (
    <main className="min-h-screen bg-obsidian text-ivory relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
              <GraduationCap size={14} className="text-royal-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
                Catálogo Público
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Disciplinas & Horários
            </h1>
            <p className="text-sm text-white/50 max-w-xl">
              Conheça as 18 disciplinas oficiais da Academia Enxamistas, seus docentes e horários semanais.
            </p>
          </div>
          <Link href={user ? '/cursos' : '/cadastro'} className="btn-primary inline-flex items-center gap-2">
            {user ? 'Ir para Minha Grade' : 'Escolher Curso no Cadastro'}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
              selectedDay === 'ALL'
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10 hover:border-royal-gold/40'
            }`}
          >
            Todos os Dias
          </button>
          {[0, 1, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                selectedDay === d
                  ? 'bg-royal-gold text-obsidian border-royal-gold'
                  : 'bg-graphite text-white/60 border-white/10 hover:border-royal-gold/40'
              }`}
            >
              {DAYS[d]}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 text-red-300 p-4 rounded-sm flex items-center gap-3 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
            Nenhuma disciplina encontrada para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="bg-graphite border border-white/5 hover:border-royal-gold/30 p-6 rounded-sm flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-obsidian border border-white/10 rounded-sm text-royal-gold">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {course.schedules.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-obsidian border border-white/10 rounded-sm text-white/60 inline-flex items-center gap-1"
                        >
                          <Clock size={10} className="text-royal-gold" />
                          {DAYS[s.dayOfWeek]} • {s.startTime}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{course.name}</h2>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    {course.description || 'Disciplina oficial da grade acadêmica Enxamistas.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/60 inline-flex items-center gap-2">
                    <User size={14} className="text-royal-gold" />
                    {course.teacher?.name || 'Alta Cúpula'}
                  </span>
                  {user && (
                    <Link
                      href={`/cursos/${course.id}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-royal-gold hover:text-white"
                    >
                      Ver Curso →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
