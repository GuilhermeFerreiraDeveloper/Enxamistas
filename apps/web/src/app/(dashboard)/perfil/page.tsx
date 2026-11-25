'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Award,
  BookOpen,
  Music,
  Sparkles,
  Save,
  Shield,
  Calendar,
  FolderKanban,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import { formatDate } from '@/lib/utils';

export default function MeuPerfilPage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    avatar: '',
    bio: '',
    description: '',
    favoriteMusic: '',
    musicGenre: '',
    interests: '',
    projects: '',
  });

  const loadProfile = async () => {
    try {
      setError(null);
      const res = await api.get('/profiles/me');
      setProfile(res.data);
      setForm({
        avatar: res.data.avatar || '',
        bio: res.data.bio || '',
        description: res.data.description || '',
        favoriteMusic: res.data.favoriteMusic || '',
        musicGenre: res.data.musicGenre || '',
        interests: res.data.interests || '',
        projects: res.data.projects || '',
      });
    } catch {
      setError('Não foi possível carregar seu perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profiles/me', form);
      await loadProfile();
      await refreshUser();
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />;
  }

  if (error || !profile) {
    return (
      <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-sm text-red-300 flex items-center gap-3">
        <AlertCircle size={18} />
        <span>{error || 'Perfil não encontrado.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Identity Header (Protected Fields) */}
      <section className="bg-graphite border border-white/5 p-8 rounded-sm flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-sm bg-obsidian border border-royal-gold/30 flex items-center justify-center overflow-hidden shrink-0 shadow-gold-glow">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-royal-gold/40" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
              <RoleBadge role={profile.user.role} />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span>Passaporte: #{profile.user.passport}</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-royal-gold" />
                Ingresso: {formatDate(profile.joinDate)}
              </span>
              {profile.mainCourse && (
                <span className="inline-flex items-center gap-1 text-royal-gold">
                  <BookOpen size={12} />
                  Curso Principal: {profile.mainCourse.name}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={12} className="text-royal-gold" />
              Nome, passaporte, cargo, curso principal e medalhas são protegidos contra edição direta.
            </p>
          </div>
        </div>
        <Link
          href={`/membros/${profile.user.passport}`}
          className="px-5 py-2.5 border border-royal-gold/30 text-royal-gold hover:bg-royal-gold/10 text-[10px] font-bold uppercase tracking-widest rounded-sm"
        >
          Ver Visão Pública Interna
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Authorized Edit Form */}
        <section className="lg:col-span-2 bg-graphite border border-white/5 p-8 rounded-sm space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
            Editar Campos Autorizados
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Avatar (Upload S3 ou URL)
              </label>
              <FileUploadZone
                scope="avatars"
                allowPaste={false}
                currentUrl={form.avatar}
                onUploaded={(url) => setForm((f) => ({ ...f, avatar: url }))}
                onClear={() => setForm((f) => ({ ...f, avatar: '' }))}
              />
              <Input
                label="URL DO AVATAR (OPCIONAL)"
                placeholder="https://..."
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              />
            </div>

            <Input
              label="BIOGRAFIA RESUMIDA"
              placeholder="Uma frase sobre sua trajetória na colmeia..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                Descrição Completa
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-royal-gold/40"
                placeholder="História do personagem, especialidades e objetivos..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="MÚSICA FAVORITA"
                placeholder="Ex: Nocturne in E-flat"
                value={form.favoriteMusic}
                onChange={(e) => setForm((f) => ({ ...f, favoriteMusic: e.target.value }))}
              />
              <Input
                label="GÊNERO MUSICAL"
                placeholder="Ex: Synthwave / Jazz / Trap"
                value={form.musicGenre}
                onChange={(e) => setForm((f) => ({ ...f, musicGenre: e.target.value }))}
              />
            </div>

            <Input
              label="INTERESSES"
              placeholder="Ex: Investigação, estratégia, artes..."
              value={form.interests}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            />

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                Notas sobre Projetos Pessoais
              </label>
              <textarea
                rows={3}
                value={form.projects}
                onChange={(e) => setForm((f) => ({ ...f, projects: e.target.value }))}
                className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-royal-gold/40"
              />
            </div>

            <Button type="submit" isLoading={saving} className="inline-flex items-center gap-2">
              <Save size={14} /> Salvar Alterações
            </Button>
          </form>
        </section>

        {/* Academic, Medals, Achievements Summary */}
        <section className="space-y-6">
          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <BookOpen size={14} /> Cursos & Matrículas
            </h3>
            {profile.enrollments?.length ? (
              <ul className="space-y-2 text-xs">
                {profile.enrollments.map((en: any) => (
                  <li
                    key={en.id}
                    className="p-3 bg-obsidian border border-white/5 rounded-sm flex items-center justify-between"
                  >
                    <Link href={`/cursos/${en.course.id}`} className="text-white hover:text-royal-gold">
                      {en.course.name}
                    </Link>
                    <span className="text-[10px] text-white/40 uppercase">
                      {en.type === 'MAIN' ? 'Principal' : 'Secundário'} • {en.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/40">Nenhuma matrícula registrada.</p>
            )}
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <Award size={14} /> Medalhas ({profile.medals?.length || 0})
            </h3>
            {profile.medals?.length ? (
              <ul className="space-y-2 text-xs">
                {profile.medals.map((um: any) => (
                  <li key={um.id} className="p-3 bg-obsidian border border-royal-gold/20 rounded-sm">
                    <p className="font-bold text-white">{um.medal.name}</p>
                    <p className="text-[11px] text-white/50">{um.medal.course?.name}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/40">Nenhuma medalha obtida ainda.</p>
            )}
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <Sparkles size={14} /> Conquistas ({profile.achievements?.length || 0})
            </h3>
            {profile.achievements?.length ? (
              <ul className="space-y-2 text-xs">
                {profile.achievements.map((ua: any) => (
                  <li key={ua.id} className="p-3 bg-obsidian border border-white/5 rounded-sm">
                    <p className="font-bold text-white">{ua.achievement.name}</p>
                    <p className="text-[11px] text-white/50">{ua.achievement.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/40">Nenhuma conquista desbloqueada ainda.</p>
            )}
          </div>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
              <FolderKanban size={14} /> Projetos ({profile.projectsList?.length || 0})
            </h3>
            <Link href="/projetos" className="text-xs text-royal-gold hover:underline block">
              Gerenciar meus projetos →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
