'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Users,
  Calendar,
  Home as HomeIcon,
  FolderKanban,
  ExternalLink,
  Clock,
  Film,
  Image,
  ScrollText,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BeeIcon, HoneycombCrest } from '@/components/ui/BeeEmblem';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { FRATERNITY_RULES } from '@enxamistas/shared';

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
      <div className="pointer-events-none absolute inset-0 honeycomb-overlay opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] honeycomb-glow" />
      <div className="pointer-events-none absolute right-[-14rem] top-24 h-[30rem] w-[30rem] rounded-full bg-orchid/10 blur-[130px]" />
      <div className="pointer-events-none absolute left-[-10rem] top-[34rem] h-[24rem] w-[24rem] rounded-full bg-coral/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-[15%] h-[24rem] w-[24rem] rounded-full bg-mint/5 blur-[130px]" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:pb-28">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-royal-gold/25 bg-royal-gold/[0.08] px-4 py-2.5 shadow-gold-glow">
            <BeeIcon className="h-4 w-4 text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-honey sm:tracking-[0.24em]">
              Fraternidade Abelha <span className="px-1 text-orchid">✳</span> Roxwood
            </span>
          </div>

          <h1 className="mb-7 text-[clamp(3.2rem,8vw,7.5rem)] font-black leading-[0.88] tracking-[-0.075em] text-white">
            UM ENXAME.
            <br />
            <span className="bg-gradient-to-r from-royal-gold via-coral to-orchid bg-clip-text font-serif italic tracking-[-0.055em] text-transparent">
              MIL JEITOS
            </span>
            <br />
            DE BRILHAR.
          </h1>

          <p className="mb-9 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            Um lugar para criar, aprender e pertencer. Inspirados pelas abelhas, fazemos da diversidade nossa força e da cooperação o nosso jeito de voar.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/cadastro" className="btn-primary min-h-12 px-7 text-sm">
              ENTRAR NA COLMEIA
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/lore"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-7 text-xs font-bold uppercase tracking-[0.14em] text-white/85 transition hover:border-royal-gold/40 hover:bg-white/[0.08]"
            >
              CONHEÇA NOSSA HISTÓRIA
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-coral" /> Diversidade</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orchid" /> Respeito</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-mint" /> Comunidade</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-royal-gold/20 via-orchid/10 to-mint/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#242326] via-[#19191c] to-[#171817] p-6 shadow-2xl sm:p-8">
            <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-royal-gold/15" />
            <div className="absolute -right-5 -top-7 h-28 w-28 rounded-full border border-orchid/20" />
            <div className="relative flex items-center justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-royal-gold/25 bg-royal-gold/10 p-2.5">
                <img src="/icon.png" alt="Símbolo Enxamistas" className="h-full w-full object-contain" />
              </div>
              <span className="rounded-full border border-mint/20 bg-mint/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-mint">Feitos para pertencer</span>
            </div>
            <p className="relative mt-10 text-xs font-bold uppercase tracking-[0.22em] text-royal-gold">A força está no coletivo</p>
            <h2 className="relative mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">Cada pessoa é única.<br /><span className="text-white/55">Juntos, somos colmeia.</span></h2>
            <div className="relative mt-8 flex items-center gap-2" aria-hidden="true">
              <span className="h-1.5 w-12 rounded-full bg-royal-gold" />
              <span className="h-1.5 w-8 rounded-full bg-coral" />
              <span className="h-1.5 w-8 rounded-full bg-orchid" />
              <span className="h-1.5 w-8 rounded-full bg-mint" />
              <span className="h-1.5 w-5 rounded-full bg-white/20" />
            </div>
            <div className="relative mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/45">
              <span>Roxwood · Universidade de RUA2</span>
              <Film size={16} className="text-royal-gold" />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative z-10 py-20 px-6 md:px-16 border-t border-royal-gold/10 bg-black/25">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: 'FRATERNIDADE',
              desc: 'Nascida em Roxwood com foco em diversidade, comunicação eficaz, respeito mútuo e trabalho em equipe.',
              icon: BeeIcon,
              href: '/lore',
            },
            {
              title: 'ACADEMIA',
              desc: '18 disciplinas oficiais com professores dedicados, registro de presença, medalhas e evolução na colmeia.',
              icon: GraduationCap,
              href: '/catalogo',
            },
            {
              title: 'CINEMÁTICA',
              desc: 'Acervo audiovisual da fraternidade com produções, memórias e registros publicados pela liderança.',
              icon: Film,
              href: '/cinematica',
            },
            {
              title: 'PATRIMÔNIO',
              desc: 'Mansões da colmeia, projetos comunitários, livro de visitas e espaços compartilhados com harmonia.',
              icon: Users,
              href: '/mansoes',
            },
            {
              title: 'GALERIA',
              desc: 'Memórias compartilhadas pelos membros em um favo de fotos que cresce com a comunidade.',
              icon: Image,
              href: '/galeria',
            },
          ].map((pillar) => (
            <Link key={pillar.title} href={pillar.href} className="group card-honeycomb block">
              <HoneycombCrest className="w-12 h-12 mb-5 transition-transform duration-500 group-hover:-translate-y-1">
                <pillar.icon className="w-6 h-6" />
              </HoneycombCrest>
              <h3 className="text-lg font-bold text-white mb-2.5 tracking-[0.2em] uppercase group-hover:text-royal-gold transition-colors">
                {pillar.title}
              </h3>
              <p className="text-white/55 text-sm leading-relaxed">{pillar.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Fraternity Rules Teaser */}
      <section className="relative z-10 py-16 px-6 md:px-16 border-t border-royal-gold/10">
        <div className="max-w-7xl mx-auto bg-graphite/90 border border-royal-gold/25 rounded-sm p-8 md:p-10 shadow-premium">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold mb-2 flex items-center gap-2">
                <ScrollText size={13} /> Código de Convivência • Universidade de RUA2
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Regras da Fraternidade Enxamistas
              </h2>
            </div>
            <Link
              href="/lore#regras"
              className="btn-primary inline-flex items-center gap-2 self-start md:self-auto"
            >
              Ver Todas as {FRATERNITY_RULES.length} Regras <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FRATERNITY_RULES.slice(0, 3).map((rule) => (
              <div key={rule.number} className="p-5 bg-obsidian/70 border border-white/5 rounded-sm">
                <div className="flex items-center gap-3 mb-2.5">
                  <HoneycombCrest className="w-8 h-8 text-xs font-bold">
                    {String(rule.number).padStart(2, '0')}
                  </HoneycombCrest>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-honey">{rule.title}</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Courses Preview */}
      <section className="relative z-10 py-20 px-6 md:px-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold mb-2">
                Colmeia Acadêmica
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
                  className="bg-graphite border border-royal-gold/15 p-6 rounded-sm hover:border-royal-gold/40 transition-all"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{course.name}</h3>
                  <p className="text-xs text-royal-gold mb-3">
                    Docente: {course.teacher?.name || 'Liderança da Colmeia'}
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
                  <div key={ev.id} className="bg-graphite border border-royal-gold/15 p-5 rounded-sm">
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
                    {
                      id: '1',
                      slug: 'mansao-real',
                      name: 'Mansão Real',
                      location: 'Roxwood',
                      typeLabel: 'SEDE PRINCIPAL',
                      description: 'Casa-mãe da fraternidade para reuniões, estudos e convivência da colmeia.',
                    },
                    {
                      id: '2',
                      slug: 'refugio-da-montanha',
                      name: 'Refúgio da Montanha',
                      location: 'Arredores de Roxwood',
                      typeLabel: 'RETIRO & PROJETOS',
                      description: 'Espaço dedicado a oficinas, integração e atividades comunitárias.',
                    },
                  ]
              ).map((m) => (
                <Link
                  key={m.id}
                  href={m.slug ? `/mansoes/${m.slug}` : '/mansoes'}
                  className="block bg-graphite border border-royal-gold/15 hover:border-royal-gold/40 p-5 rounded-sm transition-all"
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
                  className="bg-graphite border border-royal-gold/15 hover:border-royal-gold/40 p-5 rounded-sm transition-all"
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
      <footer className="relative z-10 py-14 px-6 md:px-16 border-t border-royal-gold/15 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 hex-badge bg-royal-gold/10 border border-royal-gold/30 flex items-center justify-center p-2">
            <img src="/icon.png" alt="Enxamistas" className="w-full h-full object-contain" />
          </div>

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

          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            © 2026 FRATERNIDADE ENXAMISTAS • ROXWOOD • COLMEIA DE IDEIAS
          </p>
        </div>
      </footer>
    </main>
  );
}
