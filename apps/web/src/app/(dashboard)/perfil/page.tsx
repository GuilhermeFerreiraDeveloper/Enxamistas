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
import { resolveMediaUrl } from '@/lib/media';

export default function MeuPerfilPage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    avatar: '',
    banner: '',
    nickname: '',
    age: '',
    zodiac: '',
    bio: '',
    description: '',
    favoriteMusic: '',
    favoriteFilm: '',
    personalQuote: '',
    socialLinks: '',
    formationArea: '',
    honors: '',
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
        banner: res.data.banner || '',
        nickname: res.data.nickname || '',
        age: res.data.age ? String(res.data.age) : '',
        zodiac: res.data.zodiac || '',
        bio: res.data.bio || '',
        description: res.data.description || '',
        favoriteMusic: res.data.favoriteMusic || '',
        favoriteFilm: res.data.favoriteFilm || '',
        personalQuote: res.data.personalQuote || '',
        socialLinks: res.data.socialLinks || '',
        formationArea: res.data.formationArea || '',
        honors: res.data.honors || '',
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
      await api.put('/profiles/me', { ...form, age: form.age ? Number(form.age) : null });
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
              <img src={resolveMediaUrl(profile.avatar)} alt={profile.name} className="w-full h-full object-cover" />
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
          href={`/comunidade/${profile.id}`}
          className="px-5 py-2.5 border border-royal-gold/30 text-royal-gold hover:bg-royal-gold/10 text-[10px] font-bold uppercase tracking-widest rounded-sm"
        >
          Ver Perfil Público
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
                currentUrl={resolveMediaUrl(form.avatar)}
                onUploaded={(url) => setForm((f) => ({ ...f, avatar: url }))}
                onClear={() => setForm((f) => ({ ...f, avatar: '' }))}
              />
              <Input
                label="URL DO AVATAR (OPCIONAL)"
                placeholder="https://... ou envie uma imagem acima"
                value={form.avatar.startsWith('uploads/') ? '' : form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              />
            </div>

            <div className="space-y-3 border-t border-white/5 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-royal-gold">Capa do perfil</h3>
              <FileUploadZone
                scope="profile"
                allowPaste={false}
                label="Enviar capa (JPEG, PNG ou WebP)"
                currentUrl={resolveMediaUrl(form.banner)}
                onUploaded={(url) => setForm((current) => ({ ...current, banner: url }))}
                onClear={() => setForm((current) => ({ ...current, banner: '' }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="APELIDO PÚBLICO (OPCIONAL)"
                placeholder="Como a comunidade pode chamar você"
                maxLength={40}
                value={form.nickname}
                onChange={(e) => setForm((current) => ({ ...current, nickname: e.target.value }))}
              />
              <Input
                label="IDADE (OPCIONAL)"
                type="number"
                min={1}
                max={120}
                placeholder="Sua idade"
                value={form.age}
                onChange={(e) => setForm((current) => ({ ...current, age: e.target.value }))}
              />
              <div className="space-y-2">
                <label htmlFor="profile-zodiac" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Signo (opcional)</label>
                <select id="profile-zodiac" value={form.zodiac} onChange={(e) => setForm((current) => ({ ...current, zodiac: e.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian px-4 py-3 text-sm text-white outline-none focus:border-royal-gold/40">
                  <option value="">Não informar</option>
                  {['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'].map((sign) => <option key={sign} value={sign}>{sign}</option>)}
                </select>
              </div>
              <Input
                label="ÁREA DE FORMAÇÃO (OPCIONAL)"
                placeholder="Curso, especialidade ou área"
                maxLength={150}
                value={form.formationArea}
                onChange={(e) => setForm((current) => ({ ...current, formationArea: e.target.value }))}
              />
            </div>

            <p className="text-[10px] leading-5 text-white/40">Seu nome cadastrado, cargo oficial, curso principal e data de entrada são definidos pelo cadastro e pela liderança. Não inclua dados pessoais que não queira tornar públicos.</p>

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
              <Input
                label="FILME OU SÉRIE FAVORITA"
                placeholder="Seu filme ou série favorito"
                maxLength={150}
                value={form.favoriteFilm}
                onChange={(e) => setForm((f) => ({ ...f, favoriteFilm: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-quote" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Frase pessoal</label>
              <textarea id="profile-quote" rows={2} maxLength={250} value={form.personalQuote} onChange={(e) => setForm((f) => ({ ...f, personalQuote: e.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian p-3 text-sm text-white focus:border-royal-gold/40 focus:outline-none" placeholder="Uma frase que representa você..." />
            </div>

            <Input
              label="INTERESSES"
              placeholder="Ex: Investigação, estratégia, artes..."
              value={form.interests}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
            />

            <div className="space-y-2">
              <label htmlFor="profile-socials" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Redes sociais (opcional; até 5 links, um por linha)</label>
              <textarea id="profile-socials" rows={3} maxLength={800} value={form.socialLinks} onChange={(e) => setForm((f) => ({ ...f, socialLinks: e.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian p-3 text-sm text-white focus:border-royal-gold/40 focus:outline-none" placeholder={'https://instagram.com/seu-perfil\nhttps://...'} />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-honors" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Condutas, títulos e destaques (opcional)</label>
              <textarea id="profile-honors" rows={3} maxLength={500} value={form.honors} onChange={(e) => setForm((f) => ({ ...f, honors: e.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian p-3 text-sm text-white focus:border-royal-gold/40 focus:outline-none" placeholder="Compartilhe títulos ou destaques pessoais..." />
            </div>

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
