'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Award,
  BookOpen,
  Music,
  Sparkles,
  MessageSquare,
  Calendar,
  FolderKanban,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { formatDate } from '@/lib/utils';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const passport = decodeURIComponent(String(params?.passport || ''));

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!passport) return;
    api
      .get(`/profiles/${encodeURIComponent(passport)}`)
      .then((res) => setMember(res.data))
      .catch(() => setMember(null))
      .finally(() => setLoading(false));
  }, [passport]);

  const handleStartChat = async () => {
    if (!member) return;
    setStartingChat(true);
    try {
      const res = await api.post('/chat/conversations', {
        profileIds: [member.id],
        isGroup: false,
      });
      router.push(`/chat?c=${res.data.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Não foi possível iniciar conversa.', 'error');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return <div className="h-80 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />;
  }

  if (!member) {
    return (
      <div className="p-12 bg-graphite border border-white/5 rounded-sm text-center space-y-4">
        <p className="text-white/60">Membro não encontrado ou indisponível.</p>
        <Link href="/membros" className="btn-primary inline-block">
          Voltar ao Diretório
        </Link>
      </div>
    );
  }

  const isMe = user?.passport === member.user.passport;

  return (
    <div className="space-y-10 pb-20">
      <Link
        href="/membros"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-royal-gold"
      >
        <ArrowLeft size={14} /> Voltar ao Diretório
      </Link>

      <section className="bg-graphite border border-white/5 p-8 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-sm bg-obsidian border border-royal-gold/30 flex items-center justify-center overflow-hidden shrink-0">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-royal-gold/40" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{member.name}</h1>
              <RoleBadge role={member.user.role} />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span>Passaporte #{member.user.passport}</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-royal-gold" /> Ingresso: {formatDate(member.joinDate)}
              </span>
              {member.mainCourse && (
                <span className="text-royal-gold inline-flex items-center gap-1">
                  <BookOpen size={12} /> {member.mainCourse.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {isMe ? (
          <Link href="/perfil" className="btn-primary">
            Editar Meu Perfil
          </Link>
        ) : (
          <Button onClick={handleStartChat} isLoading={startingChat}>
            <MessageSquare size={14} /> Enviar Mensagem
          </Button>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold">Biografia & Perfil</h2>
            <p className="text-sm text-white/80">{member.bio || 'Sem biografia cadastrada.'}</p>
            {member.description && (
              <p className="text-sm text-white/60 leading-relaxed pt-2 border-t border-white/5">
                {member.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
                <Music size={14} /> Preferências Musicais
              </h3>
              <p className="text-sm text-white">{member.favoriteMusic || 'Não informado'}</p>
              <p className="text-xs text-white/50">Gênero: {member.musicGenre || 'Não informado'}</p>
            </div>
            <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold">Interesses</h3>
              <p className="text-sm text-white/70">{member.interests || 'Não informado'}</p>
            </div>
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <FolderKanban size={14} /> Projetos
            </h3>
            {member.projectsList?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {member.projectsList.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projetos/${p.id}`}
                    className="p-4 bg-obsidian border border-white/10 hover:border-royal-gold/40 rounded-sm"
                  >
                    <p className="font-bold text-white text-sm">{p.title}</p>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{p.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">{member.projects || 'Nenhum projeto registrado.'}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <Award size={14} /> Medalhas ({member.medals?.length || 0})
            </h3>
            {member.medals?.length ? (
              member.medals.map((um: any) => (
                <div key={um.id} className="p-3 bg-obsidian border border-royal-gold/20 rounded-sm text-xs">
                  <p className="font-bold text-white">{um.medal.name}</p>
                  <p className="text-white/50">{um.medal.course?.name}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40">Nenhuma medalha ainda.</p>
            )}
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <Sparkles size={14} /> Conquistas ({member.achievements?.length || 0})
            </h3>
            {member.achievements?.length ? (
              member.achievements.map((ua: any) => (
                <div key={ua.id} className="p-3 bg-obsidian border border-white/5 rounded-sm text-xs">
                  <p className="font-bold text-white">{ua.achievement.name}</p>
                  <p className="text-white/50">{ua.achievement.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40">Nenhuma conquista ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
