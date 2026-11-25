'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  User,
  Clock,
  ChevronRight,
  GraduationCap,
  Shield,
  Calendar,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  name: string;
  description?: string;
  teacher?: { name: string } | null;
  schedules: { id: string; dayOfWeek: number; startTime: string }[];
  medal?: { name: string } | null;
  _count?: { enrollments: number; sessions: number; materials: number };
}

interface Enrollment {
  id: string;
  courseId: string;
  type: 'MAIN' | 'SECONDARY';
  status: string;
  course: Course;
}

const DAYS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

export default function CursosPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'CATALOG' | 'CALENDAR'>('CATALOG');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        api.get('/courses'),
        api.get('/academic/my-enrollments'),
      ]);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
    } catch {
      showToast('Erro ao carregar dados acadêmicos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleEnrollSecondary = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await api.post('/academic/enroll', { courseId, type: 'SECONDARY' });
      await loadAll();
      showToast('Matrícula em curso secundário realizada!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao realizar matrícula.', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleDropSecondary = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await api.delete(`/academic/enroll/${courseId}`);
      await loadAll();
      showToast('Matrícula secundária removida.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Não foi possível cancelar matrícula.', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <GraduationCap size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Fundação Acadêmica
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase">
            Grade Curricular & Agenda
          </h1>
          <p className="text-white/50 text-sm max-w-xl">
            Acesse seus cursos, matricule-se em disciplinas secundárias e acompanhe seu calendário semanal.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('CATALOG')}
            className={cn(
              'px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all',
              tab === 'CATALOG'
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10'
            )}
          >
            Disciplinas ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('CALENDAR')}
            className={cn(
              'px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all inline-flex items-center gap-2',
              tab === 'CALENDAR'
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10'
            )}
          >
            <Calendar size={14} /> Meu Calendário
          </button>
        </div>
      </div>

      {tab === 'CALENDAR' ? (
        <section className="space-y-6">
          <div className="bg-graphite border border-white/5 p-6 rounded-sm">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-royal-gold mb-4">
              Agenda Semanal — Curso Principal e Secundários
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DAYS.map((dayName, dayIdx) => {
                const dayEntries = enrollments.flatMap((en) =>
                  (en.course.schedules || [])
                    .filter((s) => s.dayOfWeek === dayIdx)
                    .map((s) => ({
                      enrollment: en,
                      startTime: s.startTime,
                    }))
                );
                dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div
                    key={dayName}
                    className="bg-obsidian border border-white/10 rounded-sm p-4 space-y-3"
                  >
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-royal-gold border-b border-white/10 pb-2">
                      {dayName}
                    </h3>
                    {dayEntries.length === 0 ? (
                      <p className="text-xs text-white/30">Sem aulas matriculadas</p>
                    ) : (
                      <div className="space-y-2">
                        {dayEntries.map((item, idx) => (
                          <Link
                            key={idx}
                            href={`/cursos/${item.enrollment.courseId}`}
                            className="block p-3 bg-graphite border border-white/5 hover:border-royal-gold/40 rounded-sm"
                          >
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-bold text-royal-gold">{item.startTime}</span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded-sm uppercase font-bold',
                                  item.enrollment.type === 'MAIN'
                                    ? 'bg-royal-gold/20 text-honey'
                                    : 'bg-white/10 text-white/60'
                                )}
                              >
                                {item.enrollment.type === 'MAIN' ? 'Principal' : 'Secundário'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white">{item.enrollment.course.name}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {item.enrollment.course.teacher?.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-graphite/50 border border-white/5 p-8 rounded-sm animate-pulse h-60" />
            ))
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-graphite/30 border border-white/5 rounded-sm">
              <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
                Nenhum curso disponível no catálogo acadêmico.
              </p>
            </div>
          ) : (
            courses.map((course) => {
              const enrollment = enrolledMap.get(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-graphite border border-white/5 p-6 rounded-sm group flex flex-col justify-between hover:border-royal-gold/30 transition-all shadow-premium"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-sm bg-obsidian border border-white/10 text-royal-gold">
                          <BookOpen size={22} />
                        </div>
                        {enrollment && (
                          <span className="px-2.5 py-1 rounded-sm bg-royal-gold/15 border border-royal-gold/30 text-[10px] font-bold uppercase tracking-widest text-royal-gold inline-flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            {enrollment.type === 'MAIN' ? 'Curso Principal' : 'Matriculado'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {course.schedules.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold uppercase tracking-wider bg-obsidian text-white/60 px-2.5 py-1 rounded-sm border border-white/10 inline-flex items-center gap-1.5"
                          >
                            <Clock size={10} className="text-royal-gold" />
                            {DAYS[s.dayOfWeek]} • {s.startTime}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-royal-gold transition-colors">
                      {course.name}
                    </h2>
                    <p className="text-white/50 text-xs leading-relaxed mb-5">
                      {course.description ||
                        'Disciplina oficial da fundação acadêmica dos Enxamistas.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <User size={14} className="text-royal-gold" />
                      <span>{course.teacher?.name || 'Alta Cúpula'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!enrollment ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={enrollingId === course.id}
                          onClick={() => handleEnrollSecondary(course.id)}
                        >
                          <Plus size={12} /> Matricular
                        </Button>
                      ) : enrollment.type === 'SECONDARY' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={enrollingId === course.id}
                          onClick={() => handleDropSecondary(course.id)}
                        >
                          Sair
                        </Button>
                      ) : (
                        <span className="text-[10px] text-white/30 inline-flex items-center gap-1 px-2">
                          <Shield size={11} /> Protegido
                        </span>
                      )}

                      <Link
                        href={`/cursos/${course.id}`}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        DETALHES
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
