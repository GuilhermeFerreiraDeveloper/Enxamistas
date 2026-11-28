'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CalendarDays, Film, Music2, Quote, Sparkles, User, } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import { formatDate } from '@/lib/utils';

interface PublicMember {
  id: string;
  name: string;
  avatar: string | null;
  banner: string | null;
  nickname: string | null;
  age: number | null;
  zodiac: string | null;
  role: string;
  bio: string | null;
  description: string | null;
  favoriteMusic: string | null;
  favoriteFilm: string | null;
  personalQuote: string | null;
  socialLinks: string | null;
  formationArea: string | null;
  honors: string | null;
  musicGenre: string | null;
  interests: string | null;
  joinDate: string;
  mainCourse: { id: string; name: string } | null;
  medals: Array<{ id: string; name: string; course: string | null }>;
}

function safeSocialLinks(rawLinks: string | null) {
  return (rawLinks || '').split(/\r?\n/).map((link) => link.trim()).filter((link) => {
    try {
      return ['http:', 'https:'].includes(new URL(link).protocol);
    } catch {
      return false;
    }
  }).slice(0, 5);
}

export default function PublicMemberProfilePage() {
  const params = useParams();
  const profileId = String(params?.profileId || '');
  const { user } = useAuth();
  const [member, setMember] = useState<PublicMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    api.get(`/profiles/public/members/${encodeURIComponent(profileId)}`)
      .then((response) => { if (active) setMember(response.data); })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.status === 404 ? 'Membro não encontrado ou indisponível.' : 'Não foi possível carregar este perfil.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profileId]);

  if (loading) return <main className="min-h-screen bg-obsidian"><Navbar /><div className="mx-auto mt-16 h-80 max-w-5xl animate-pulse bg-graphite/60" /></main>;

  if (error || !member) return <main className="min-h-screen bg-obsidian text-ivory"><Navbar /><div className="mx-auto max-w-4xl px-5 py-20 text-center"><p className="mb-6 text-white/60">{error || 'Membro não encontrado.'}</p><Link href="/comunidade" className="btn-primary">Voltar à comunidade</Link></div></main>;

  const isMe = user?.profile?.id === member.id;
  const socialLinks = safeSocialLinks(member.socialLinks);

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-0 honeycomb-overlay opacity-20" />
        <div className="relative">
          <Link href="/comunidade" className="mb-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-royal-gold"><ArrowLeft size={14} /> Todos os membros</Link>
          <section className="overflow-hidden border border-white/10 bg-graphite shadow-premium">
            <div className="relative h-48 bg-gradient-to-r from-[#161310] via-[#3b2b11] to-[#111112] sm:h-64">
              {member.banner && <img src={resolveMediaUrl(member.banner)} alt="Capa do perfil" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-graphite via-black/10 to-black/20" />
            </div>
            <div className="relative px-6 pb-7 sm:px-10">
              <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4 sm:gap-6">
                  <div className="h-28 w-28 shrink-0 bg-[linear-gradient(135deg,#e6a82e_0%,#111112_32%,#f0eee8_52%,#111112_70%,#c49a48_100%)] p-1 hex-badge shadow-gold-glow sm:h-36 sm:w-36">
                    <div className="h-full w-full overflow-hidden bg-obsidian hex-badge">
                      {member.avatar ? <img src={resolveMediaUrl(member.avatar)} alt={member.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><User size={42} className="text-royal-gold/60" /></div>}
                    </div>
                  </div>
                  <div className="min-w-0 pb-2">
                    <h1 className="truncate text-2xl font-bold text-white sm:text-4xl">{member.nickname || member.name}</h1>
                    {member.nickname && <p className="mt-1 text-sm text-white/55">{member.name}</p>}
                  </div>
                </div>
                <div className="sm:pb-3">{isMe ? <Link href="/perfil" className="btn-primary inline-block">Editar meu perfil</Link> : <RoleBadge role={member.role} className="text-xs" />}</div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/60">
                {isMe && <RoleBadge role={member.role} />}
                {member.age && <span className="rounded-full border border-white/10 px-3 py-1.5">{member.age} anos</span>}
                {member.zodiac && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><Sparkles size={13} className="text-royal-gold" />{member.zodiac}</span>}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><CalendarDays size={13} className="text-royal-gold" />Na Colmeia desde {formatDate(member.joinDate)}</span>
              </div>
            </div>
          </section>

          {member.personalQuote && <blockquote className="my-6 flex gap-4 border border-royal-gold/20 bg-royal-gold/5 p-5 sm:p-7"><Quote className="shrink-0 text-royal-gold" size={22} /><p className="font-serif text-lg italic leading-7 text-white/85">“{member.personalQuote}”</p></blockquote>}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <section className="border border-white/5 bg-graphite p-6 sm:p-8">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-royal-gold">Sobre o membro</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-white/75">{member.bio || member.description || 'Este membro ainda não adicionou uma biografia.'}</p>
                {member.bio && member.description && <p className="mt-4 whitespace-pre-line border-t border-white/5 pt-4 text-sm leading-7 text-white/55">{member.description}</p>}
                {member.interests && <p className="mt-5 border-t border-white/5 pt-4 text-sm text-white/65"><span className="font-semibold text-white">Interesses: </span>{member.interests}</p>}
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="border border-white/5 bg-graphite p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-royal-gold"><Music2 size={15} /> Música favorita</h3>
                  <p className="text-sm text-white">{member.favoriteMusic || 'Não informado'}</p>
                  {member.musicGenre && <p className="mt-2 text-xs text-white/45">Estilo: {member.musicGenre}</p>}
                </div>
                <div className="border border-white/5 bg-graphite p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-royal-gold"><Film size={15} /> Filme ou série</h3>
                  <p className="text-sm text-white">{member.favoriteFilm || 'Não informado'}</p>
                </div>
              </section>

              {(member.honors || member.medals.length > 0) && <section className="border border-white/5 bg-graphite p-6 sm:p-8">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-royal-gold"><Sparkles size={15} /> Títulos e conquistas</h2>
                {member.honors && <p className="mb-4 whitespace-pre-line text-sm leading-6 text-white/70">{member.honors}</p>}
                {member.medals.length > 0 && <div className="flex flex-wrap gap-2">{member.medals.map((medal) => <span key={medal.id} title={medal.course || undefined} className="rounded-sm border border-royal-gold/20 bg-royal-gold/5 px-3 py-2 text-xs text-honey">{medal.name}</span>)}</div>}
              </section>}
            </div>

            <aside className="space-y-6">
              <section className="border border-royal-gold/15 bg-graphite p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-royal-gold"><BookOpen size={15} /> Formação e cargo</h2>
                <RoleBadge role={member.role} />
                {member.mainCourse && <p className="mt-4 text-sm text-white"><span className="text-white/45">Curso principal</span><br />{member.mainCourse.name}</p>}
                {member.formationArea && <p className="mt-4 text-sm text-white"><span className="text-white/45">Área de formação</span><br />{member.formationArea}</p>}
              </section>
              {socialLinks.length > 0 && <section className="border border-white/5 bg-graphite p-6">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-royal-gold">Redes sociais</h2>
                <ul className="space-y-2">{socialLinks.map((link) => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-white/65 underline decoration-white/20 underline-offset-4 hover:text-royal-gold">{link.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</a></li>)}</ul>
              </section>}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
