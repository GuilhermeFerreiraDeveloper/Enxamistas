'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Search, Users, User } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { RoleLabels, UserRole } from '@enxamistas/shared';
import api from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';

interface CommunityMember {
  id: string;
  name: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  mainCourse: { id: string; name: string } | null;
}

export default function CommunityDirectoryPage() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/profiles/public/members', {
          params: { q: search.trim() || undefined, role: role || undefined, page, limit: 24 },
          signal: controller.signal,
        });
        setMembers(response.data.items);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      } catch (requestError: any) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(requestError.response?.data?.error || 'Não foi possível carregar os membros.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, role, page]);

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute inset-0 honeycomb-overlay opacity-25" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 honeycomb-glow" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-royal-gold">
            <ArrowLeft size={14} /> Início
          </Link>
          <div className="mb-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-royal-gold/25 bg-royal-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
                <Users size={14} /> Diretório público
              </div>
              <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl">Membros <span className="text-royal-gold">da Colmeia</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">Conheça a comunidade, seus cargos na hierarquia, áreas de formação e as histórias de cada membro.</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_220px] lg:max-w-2xl">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar nome, apelido ou curso..." className="w-full rounded-sm border border-white/10 bg-graphite py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-royal-gold/50" />
              </label>
              <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="rounded-sm border border-white/10 bg-graphite px-4 py-3 text-sm text-white outline-none focus:border-royal-gold/50">
                <option value="">Todos os cargos</option>
                {Object.values(UserRole).map((item) => <option key={item} value={item}>{RoleLabels[item]}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between border-b border-royal-gold/15 pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/55">{total} {total === 1 ? 'membro registrado' : 'membros registrados'}</p>
            <p className="hidden text-[10px] uppercase tracking-widest text-white/35 sm:block">Cargo atribuído pela liderança</p>
          </div>

          {error && <div role="alert" className="mb-6 border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-56 animate-pulse border border-white/5 bg-graphite/70" />)}</div>
          ) : members.length === 0 ? (
            <div className="border border-dashed border-royal-gold/25 bg-graphite/40 px-6 py-16 text-center text-sm text-white/50">Nenhum membro encontrado para essa busca.</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map((member) => (
                <Link key={member.id} href={`/comunidade/${member.id}`} className="group relative overflow-hidden border border-white/10 bg-graphite/90 p-6 transition hover:-translate-y-1 hover:border-royal-gold/35 hover:shadow-gold-glow">
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-royal-gold/[0.08] to-transparent" />
                  <div className="relative flex items-center gap-4">
                    <div className="h-20 w-20 shrink-0 bg-[linear-gradient(135deg,#e6a82e_0%,#111112_32%,#f0eee8_52%,#111112_70%,#c49a48_100%)] p-[3px] hex-badge shadow-gold-glow">
                      <div className="h-full w-full overflow-hidden bg-obsidian hex-badge">
                        {member.avatar ? <img src={resolveMediaUrl(member.avatar)} alt={member.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><User size={28} className="text-royal-gold/65" /></div>}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-white group-hover:text-royal-gold">{member.nickname || member.name}</h2>
                      {member.nickname && <p className="truncate text-xs text-white/45">{member.name}</p>}
                      <div className="mt-2"><RoleBadge role={member.role} /></div>
                    </div>
                  </div>
                  <div className="relative mt-5 border-t border-white/5 pt-4">
                    <p className="min-h-10 text-xs leading-5 text-white/55 line-clamp-2">{member.bio || 'Uma nova história na Colmeia.'}</p>
                    <p className="mt-4 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-royal-gold/80">
                      <span className="truncate">{member.mainCourse?.name || 'Área de formação não informada'}</span><ArrowRight size={13} className="shrink-0 transition group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && <div className="mt-10 flex items-center justify-center gap-5">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-sm border border-white/10 p-3 text-white/60 hover:border-royal-gold/40 hover:text-royal-gold disabled:opacity-30" aria-label="Página anterior"><ArrowLeft size={16} /></button>
            <span className="text-xs text-white/50">Página {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-sm border border-white/10 p-3 text-white/60 hover:border-royal-gold/40 hover:text-royal-gold disabled:opacity-30" aria-label="Próxima página"><ArrowRight size={16} /></button>
          </div>}
        </div>
      </section>
    </main>
  );
}
