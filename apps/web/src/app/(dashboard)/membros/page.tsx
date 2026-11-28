'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  User,
  Shield,
  GraduationCap,
  MapPin,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { RoleLabels, UserRole } from '@enxamistas/shared';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { resolveMediaUrl } from '@/lib/media';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  user: {
    passport: string;
    role: string;
  };
  mainCourse?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    medals: number;
    courseCompletions: number;
    achievements: number;
  };
}

export default function MembrosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [medals, setMedals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [medalFilter, setMedalFilter] = useState('');
  const [completedCourseFilter, setCompletedCourseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/medals/catalog')])
      .then(([coursesRes, catalogRes]) => {
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setMedals(Array.isArray(catalogRes.data?.medals) ? catalogRes.data.medals : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/profiles/members', {
          params: {
            q: debouncedSearch || undefined,
            role: roleFilter || undefined,
            courseId: courseFilter || undefined,
            medalId: medalFilter || undefined,
            completedCourseId: completedCourseFilter || undefined,
            page,
            limit: 12,
          },
        });
        setMembers(res.data?.items || []);
        setTotalPages(res.data?.totalPages || 1);
        setTotal(res.data?.total || 0);
      } catch {
        setError('Não foi possível carregar o diretório de membros.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [debouncedSearch, roleFilter, courseFilter, medalFilter, completedCourseFilter, page]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Shield size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Diretório Privado • {total} membros
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase">
            Membros da Colmeia
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Pesquise por nome ou passaporte e filtre por cargo, curso, medalha ou formação concluída.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input
            type="text"
            placeholder="Nome ou passaporte..."
            className="w-full bg-graphite border border-white/10 rounded-sm pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-royal-gold/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-graphite border border-white/5 p-4 rounded-sm">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="bg-obsidian border border-white/10 rounded-sm px-3 py-2.5 text-xs text-white"
        >
          <option value="">Todos os Cargos</option>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {RoleLabels[r]}
            </option>
          ))}
        </select>

        <select
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value);
            setPage(1);
          }}
          className="bg-obsidian border border-white/10 rounded-sm px-3 py-2.5 text-xs text-white"
        >
          <option value="">Todos os Cursos (Matrícula)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={medalFilter}
          onChange={(e) => {
            setMedalFilter(e.target.value);
            setPage(1);
          }}
          className="bg-obsidian border border-white/10 rounded-sm px-3 py-2.5 text-xs text-white"
        >
          <option value="">Filtrar por Medalha</option>
          {medals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={completedCourseFilter}
          onChange={(e) => {
            setCompletedCourseFilter(e.target.value);
            setPage(1);
          }}
          className="bg-obsidian border border-white/10 rounded-sm px-3 py-2.5 text-xs text-white"
        >
          <option value="">Curso Concluído</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-graphite/50 border border-white/5 p-8 rounded-sm animate-pulse h-48" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-24 bg-graphite/30 border border-white/5 rounded-sm">
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
            Nenhum membro encontrado com os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/membros/${encodeURIComponent(member.user.passport)}`}
              className="block bg-graphite border border-white/5 p-6 rounded-sm group hover:border-royal-gold/40 transition-all duration-300 shadow-premium"
            >
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-sm bg-obsidian border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-royal-gold/40">
                  {member.avatar ? (
                    <img src={resolveMediaUrl(member.avatar)} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-white/20 group-hover:text-royal-gold/60" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="text-base font-bold text-white truncate group-hover:text-royal-gold transition-colors">
                    {member.name}
                  </h3>
                  <RoleBadge role={member.user.role} />
                  <div className="space-y-1 pt-1 text-[11px] text-white/50">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-royal-gold" />
                      <span>Passaporte #{member.user.passport}</span>
                    </div>
                    {member.mainCourse && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={11} className="text-royal-gold" />
                        <span className="truncate">{member.mainCourse.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span className="inline-flex items-center gap-1 text-royal-gold/80">
                  <Award size={12} /> {member._count?.medals || 0} medalhas •{' '}
                  {member._count?.courseCompletions || 0} conclusões
                </span>
                <span className="group-hover:text-royal-gold transition-colors">Ver Perfil →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-graphite border border-white/10 rounded-sm text-xs disabled:opacity-30 inline-flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-xs text-white/60">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-graphite border border-white/10 rounded-sm text-xs disabled:opacity-30 inline-flex items-center gap-1"
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
