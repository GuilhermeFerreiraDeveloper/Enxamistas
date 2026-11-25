'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  GraduationCap,
  Users,
  Calendar,
  Home as HomeIcon,
  FolderKanban,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface PublicPortalData {
  settings: Record<string, string>;
  courses: Array<{
    id: string;
    name: string;
    description?: string;
    teacher?: { name: string } | null;
    schedules: { dayOfWeek: number; startTime: string }[];
  }>;
  publicEvents: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
  }>;
  mansions: Array<{
    id: string;
    slug?: string;
    name: string;
    description?: string;
    location?: string;
    typeLabel?: string;
    coverImage?: string;
    _count?: { media: number };
  }>;
  featuredProjects: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    author: { name: string };
  }>;
}

export default function Home() {
  const [data, setData] = useState<PublicPortalData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/institutional/public')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, []);

  const socialLinks = [
    { label: 'Instagram', url: data?.settings?.social_instagram },
    { label: 'Discord', url: data?.settings?.social_discord },
    { label: 'Twitter', url: data?.settings?.social_twitter },
  ].filter((s) => s.url && s.url.trim().length > 0);

  return (
    <main className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-royal-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-royal-gold/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 px-6 md:px-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-royal-gold/5 border border-royal-gold/20 mb-10">
          <Shield size={14} className="text-royal-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
            Organização de Elite • GTA RP / FiveM
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-none">
          EXCLUSIVIDADE. <br />
          <span className="text-royal-gold text-glow-gold italic font-serif">CONHECIMENTO.</span>
        </h1>

        <p className="max-w-2xl text-base md:text-xl text-white/60 font-medium tracking-wide leading-relaxed mb-12">
          Bem-vindo ao epicentro da sofisticação, estratégia e formação acadêmica. A Enxamistas une
          hierarquia, cultura institucional e excelência absoluta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Link href="/cadastro" className="btn-primary flex items-center justify-center gap-3 px-10 py-4 text-sm">
            INICIAR CANDIDATURA
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/lore"
            className="px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] border border-white/15 hover:border-royal-gold/40 hover:bg-white/5 transition-all rounded-sm flex items-center justify-center gap-3"
          >
            CONHECER O LEGADO
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative z-10 py-20 px-6 md:px-16 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'ACADEMIA',
              desc: '18 disciplinas oficiais com professores dedicados, registro de presença, medalhas e evolução hierárquica.',
              icon: GraduationCap,
              href: '/catalogo',
            },
            {
              title: 'SOCIEDADE',
              desc: 'Uma rede privada baseada na lealdade absoluta, hierarquia real da colmeia e eventos exclusivos.',
              icon: Shield,
              href: '/lore',
            },
            {
              title: 'PATRIMÔNIO',
              desc: 'Mansões institucionais, projetos de membros, arquivo de memórias e comunidade integrada.',
              icon: Users,
              href: '/mansoes',
            },
          ].map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="group p-8 rounded-sm bg-graphite border border-white/5 hover:border-royal-gold/30 transition-all duration-500 shadow-premium block"
            >
              <pillar.icon
                size={32}
                className="text-royal-gold mb-6 transition-transform duration-500 group-hover:-translate-y-1"
              />
              <h3 className="text-xl font-bold text-white mb-3 tracking-[0.2em] uppercase group-hover:text-royal-gold transition-colors">
                {pillar.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">{pillar.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Public Courses Preview */}
      <section className="relative z-10 py-20 px-6 md:px-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold mb-2">
                Fundação Acadêmica
              </p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Catálogo de Disciplinas</h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold hover:text-white inline-flex items-center gap-2"
            >
              Ver Grade Completa <ArrowRight size={14} />
            </Link>
          </div>

          {!loaded ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : data?.courses?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.courses.slice(0, 6).map((course) => (
                <div
                  key={course.id}
                  className="bg-graphite border border-white/5 p-6 rounded-sm hover:border-royal-gold/30 transition-all"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{course.name}</h3>
                  <p className="text-xs text-royal-gold mb-3">
                    Docente: {course.teacher?.name || 'Alta Cúpula'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {course.schedules.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-obsidian border border-white/10 rounded-sm text-white/60 inline-flex items-center gap-1"
                      >
                        <Clock size={10} className="text-royal-gold" />
                        {DAYS[s.dayOfWeek]} {s.startTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-graphite/40 border border-white/5 p-8 rounded-sm text-center text-sm text-white/50">
              Consulte a grade completa e os horários disponíveis em{' '}
              <Link href="/catalogo" className="text-royal-gold underline">
                Catálogo de Cursos
              </Link>
              .
            </div>
          )}
        </div>
      </section>

      {/* Public Events & Mansions */}
      <section className="relative z-10 py-20 px-6 md:px-16 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Eventos Públicos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Calendar size={22} className="text-royal-gold" />
                Eventos Públicos
              </h2>
              <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-royal-gold">
                Portal de Eventos
              </Link>
            </div>
            {data?.publicEvents?.length ? (
              <div className="space-y-4">
                {data.publicEvents.map((ev) => (
                  <div key={ev.id} className="bg-graphite border border-white/5 p-5 rounded-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                        {ev.category}
                      </span>
                      <span className="text-xs text-white/40">{formatDate(ev.date)}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{ev.title}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{ev.description}</p>
                    <p className="text-[11px] text-white/40 mt-2">Local: {ev.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-graphite/40 border border-white/5 p-8 rounded-sm text-sm text-white/50">
                Nenhum evento público agendado no momento. Membros autenticados visualizam a agenda completa no painel.
              </div>
            )}
          </div>

          {/* Mansões */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <HomeIcon size={22} className="text-royal-gold" />
                Mansões da Colmeia
              </h2>
              <Link href="/mansoes" className="text-xs font-bold uppercase tracking-widest text-royal-gold">
                Explorar Galeria
              </Link>
            </div>
            <div className="space-y-4">
              {(data?.mansions?.length
                ? data.mansions
                : [
                    { id: '1', slug: 'mansao-real', name: 'Mansão Real', location: 'Vinewood Hills', typeLabel: 'SEDE PRINCIPAL', description: 'Sede principal de operações e cerimônias da alta cúpula.' },
                    { id: '2', slug: 'refugio-da-montanha', name: 'Refúgio da Montanha', location: 'Mount Chiliad Base', typeLabel: 'TREINAMENTO', description: 'Centro tático reservado para treinamentos estratégicos.' },
                  ]
              ).map((m) => (
                <Link
                  key={m.id}
                  href={m.slug ? `/mansoes/${m.slug}` : '/mansoes'}
                  className="block bg-graphite border border-white/5 hover:border-royal-gold/30 p-5 rounded-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                      {m.typeLabel || 'PATRIMÔNIO'}
                    </span>
                    {m.location && <span className="text-xs text-white/40">{m.location}</span>}
                  </div>
                  <h3 className="text-base font-bold text-white">{m.name}</h3>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{m.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {data?.featuredProjects?.length ? (
        <section className="relative z-10 py-20 px-6 md:px-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FolderKanban size={22} className="text-royal-gold" />
                Projetos em Destaque
              </h2>
              <Link href="/projetos" className="text-xs font-bold uppercase tracking-widest text-royal-gold">
                Ver Todos
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.featuredProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projetos/${p.id}`}
                  className="bg-graphite border border-white/5 hover:border-royal-gold/30 p-5 rounded-sm transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                    {p.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{p.title}</h3>
                  <p className="text-xs text-white/50 mt-2 line-clamp-2">{p.description}</p>
                  <p className="text-[10px] text-white/40 mt-4">Por {p.author.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="relative z-10 py-14 px-6 md:px-16 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-6">
          <img src="/logos/Logo-2.png" alt="Enxamistas" className="w-14 h-14 object-contain opacity-60" />

          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 hover:text-royal-gold transition-colors inline-flex items-center gap-1.5"
                >
                  {social.label}
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Canais sociais configuráveis no Painel Administrativo
            </p>
          )}

          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">
            © 2026 ENXAMISTAS ORGANIZAÇÃO • TODOS OS DIREITOS RESERVADOS
          </p>
        </div>
      </footer>
    </main>
  );
}
