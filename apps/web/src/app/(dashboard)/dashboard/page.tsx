'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  BookOpen,
  Calendar,
  Award,
  Users,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Megaphone,
  Crown,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { RoleBadge } from '@/components/ui/RoleBadge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [medalsCount, setMedalsCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [highlight, setHighlight] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDataError(null);
        const [enrollRes, medalsRes, eventsRes, membersRes, annRes, highRes] = await Promise.all([
          api.get('/academic/my-enrollments'),
          api.get('/medals/my'),
          api.get('/events'),
          api.get('/profiles/members', { params: { limit: 1 } }),
          api.get('/announcements'),
          api.get('/highlights'),
        ]);
        setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
        setMedalsCount(Array.isArray(medalsRes.data) ? medalsRes.data.length : 0);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setMembersCount(membersRes.data?.total || 0);
        setAnnouncements(Array.isArray(annRes.data) ? annRes.data.slice(0, 3) : []);
        setHighlight(Array.isArray(highRes.data) && highRes.data.length > 0 ? highRes.data[0] : null);
      } catch {
        setDataError('Não foi possível sincronizar todos os dados reais com a API.');
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    {
      label: 'Matrículas Ativas',
      value: loadingData ? '...' : String(enrollments.length),
      sub: 'Cursos',
      icon: BookOpen,
      href: '/cursos',
    },
    {
      label: 'Eventos Registrados',
      value: loadingData ? '...' : String(events.length),
      sub: 'Eventos',
      icon: Calendar,
      href: '/eventos',
    },
    {
      label: 'Conquistas Reais',
      value: loadingData ? '...' : String(medalsCount),
      sub: 'Medalhas',
      icon: Award,
      href: '/medalhas',
    },
    {
      label: 'Efetivo da Colmeia',
      value: loadingData ? '...' : String(membersCount),
      sub: 'Membros',
      icon: Users,
      href: '/membros',
    },
  ];

  const profileName = user?.profile?.name || 'Membro';

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-sm bg-graphite border border-white/5 p-8 md:p-10 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20 text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                <ShieldCheck size={12} /> Acesso Autorizado
              </span>
              {user?.role && <RoleBadge role={user.role} />}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              Bem-vindo à Elite, <br />
              <span className="text-royal-gold text-glow-gold italic font-serif">{profileName}</span>
            </h1>
            <p className="text-white/50 text-sm">
              Passaporte #{user?.passport} • Acompanhe suas disciplinas, avisos e eventos oficiais.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <Link href="/cursos" className="btn-primary inline-flex items-center gap-2">
              Grade Acadêmica <ArrowRight size={14} />
            </Link>
            <Link
              href="/perfil"
              className="px-6 py-3 border border-white/10 hover:border-royal-gold/30 text-xs font-bold uppercase tracking-[0.2em] rounded-sm"
            >
              Meu Perfil
            </Link>
          </div>
        </div>
      </section>

      {dataError && (
        <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-3">
          <AlertCircle size={16} />
          <span>{dataError}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-graphite border border-white/5 p-6 rounded-sm shadow-premium hover:border-royal-gold/30 transition-all group"
          >
            <div className="p-2.5 rounded-sm bg-obsidian border border-white/10 w-fit mb-4 text-royal-gold">
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-royal-gold/70">
                {stat.sub}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Announcements + Enrollments */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Megaphone className="text-royal-gold" size={18} />
              Avisos Institucionais
            </h2>
            <Link href="/avisos" className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
              Ver Todos →
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 bg-graphite/40 border border-white/5 rounded-sm text-xs text-white/40">
              Nenhum aviso ativo no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((av) => (
                <div key={av.id} className="bg-graphite border border-white/5 p-5 rounded-sm">
                  <div className="flex justify-between text-[10px] text-royal-gold font-bold uppercase mb-1">
                    <span>{av.category}</span>
                    <span className="text-white/40">{formatDate(av.createdAt)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{av.title}</h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{av.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen className="text-royal-gold" size={18} />
              Minhas Matrículas
            </h2>
            <Link href="/cursos" className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
              Abrir Grade →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-6 bg-graphite/40 border border-white/5 rounded-sm text-xs text-white/40">
              Nenhuma matrícula registrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enrollments.map((en) => (
                <Link
                  key={en.id}
                  href={`/cursos/${en.courseId}`}
                  className="bg-graphite border border-white/5 hover:border-royal-gold/30 p-5 rounded-sm block"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                    {en.type === 'MAIN' ? 'Curso Principal' : 'Curso Secundário'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{en.course.name}</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Docente: {en.course.teacher?.name || 'Alta Cúpula'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Highlight + Upcoming Events */}
        <section className="space-y-6">
          <div className="bg-graphite border border-royal-gold/25 p-6 rounded-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <Crown size={15} /> Enxamista do Mês
            </h2>
            {highlight ? (
              <div>
                <p className="text-lg font-bold text-white">{highlight.profile?.name}</p>
                <p className="text-xs text-royal-gold">
                  {String(highlight.month).padStart(2, '0')}/{highlight.year}
                </p>
                <p className="text-xs text-white/60 mt-2">{highlight.reason}</p>
                <Link href="/reconhecimento" className="text-xs text-royal-gold underline mt-3 inline-block">
                  Ver histórico →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-white/40">Nenhum destaque selecionado ainda.</p>
            )}
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
                <Calendar size={15} /> Próximos Eventos
              </h2>
              <Link href="/eventos" className="text-[10px] text-white/50 hover:text-royal-gold">
                Ver todos
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-white/40">Nenhum evento agendado.</p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 3).map((ev) => (
                  <div key={ev.id} className="p-3 bg-obsidian border border-white/5 rounded-sm text-xs">
                    <p className="font-bold text-white">{ev.title}</p>
                    <p className="text-white/40 mt-0.5">{formatDate(ev.date)} • {ev.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
