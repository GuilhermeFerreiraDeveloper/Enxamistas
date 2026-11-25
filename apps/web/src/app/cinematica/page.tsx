'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Film,
  Youtube,
  Upload,
  Plus,
  Trash2,
  Play,
  X,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BeeIcon, HoneycombCrest } from '@/components/ui/BeeEmblem';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { isLeadershipOrStaff } from '@enxamistas/shared';

interface CinematicItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  sourceType: 'YOUTUBE' | 'UPLOAD' | string;
  videoUrl: string;
  youtubeId?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
    user?: { role: string };
  };
}

const CATEGORIES = ['Todas', 'Fraternidade', 'Roxwood', 'Eventos', 'Academia', 'Bastidores'];

function resolveMediaUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(
    /\/api(\/v1)?\/?$/,
    ''
  );
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
}

function parseYoutubeIdClient(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let candidate: string | null = null;
    if (host === 'youtu.be') {
      candidate = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        candidate = parsed.searchParams.get('v');
      } else {
        const seg = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(seg[0])) {
          candidate = seg[1] || null;
        }
      }
    }
    return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export default function CinematicaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<CinematicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeVideo, setActiveVideo] = useState<CinematicItem | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  // Composer state (Staff & Leaders only)
  const [mode, setMode] = useState<'YOUTUBE' | 'UPLOAD'>('YOUTUBE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fraternidade');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const canManage = isLeadershipOrStaff(user?.role);

  const fetchCinematics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cinematics');
      const list: CinematicItem[] = res.data || [];
      setItems(list);
      if (!activeVideo && list.length > 0) {
        setActiveVideo(list[0]);
      }
    } catch {
      showToast('Erro ao carregar a cinemática da colmeia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinematics();
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todas') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const previewYoutubeId = useMemo(() => parseYoutubeIdClient(youtubeUrl), [youtubeUrl]);

  const resetComposer = () => {
    setTitle('');
    setDescription('');
    setCategory('Fraternidade');
    setYoutubeUrl('');
    setVideoFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setSubmitting(true);
    setUploadProgress(0);
    try {
      let created: CinematicItem;

      if (mode === 'YOUTUBE') {
        const res = await api.post('/cinematics', {
          title,
          description,
          category,
          youtubeUrl,
        });
        created = res.data;
      } else {
        if (!videoFile) {
          showToast('Selecione um arquivo de vídeo (.mp4, .webm ou .mov) do computador.', 'error');
          setSubmitting(false);
          return;
        }
        const buffer = await videoFile.arrayBuffer();
        const res = await api.post('/cinematics/upload', buffer, {
          timeout: 120_000,
          headers: {
            'Content-Type': videoFile.type || 'video/mp4',
            'x-cinematic-title': encodeURIComponent(title),
            'x-cinematic-description': encodeURIComponent(description),
            'x-cinematic-category': encodeURIComponent(category),
          },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          },
        });
        created = res.data;
      }

      showToast('Cinemática publicada na colmeia com sucesso!', 'success');
      setItems((prev) => [created, ...prev]);
      setActiveVideo(created);
      resetComposer();
      setShowComposer(false);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao publicar vídeo na Cinemática.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: CinematicItem) => {
    if (!canManage) return;
    try {
      await api.delete(`/cinematics/${item.id}`);
      const nextList = items.filter((v) => v.id !== item.id);
      setItems(nextList);
      if (activeVideo?.id === item.id) {
        setActiveVideo(nextList[0] || null);
      }
      showToast('Cinemática removida.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao remover vídeo.', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[420px] honeycomb-glow pointer-events-none" />

      <Navbar />

      <div className="max-w-7xl mx-auto pt-14 pb-28 px-6 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-royal-gold/20 pb-8">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-royal-gold/10 border border-royal-gold/30 mb-4">
              <BeeIcon className="w-4 h-4 text-royal-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-royal-gold">
                Cinema da Colmeia • Roxwood
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Cinemática <span className="text-royal-gold italic font-serif">Enxamistas</span>
            </h1>
            <p className="text-sm text-white/60 mt-2 max-w-2xl">
              Acervo audiovisual oficial da fraternidade: momentos marcantes em Roxwood, cerimônias,
              produções da colmeia e registros históricos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManage ? (
              <Button
                onClick={() => setShowComposer((prev) => !prev)}
                className="flex items-center gap-2"
              >
                {showComposer ? <X size={16} /> : <Plus size={16} />}
                {showComposer ? 'Fechar Publicação' : 'Publicar Vídeo'}
              </Button>
            ) : (
              <div className="px-4 py-2.5 bg-graphite/80 border border-white/10 rounded-sm text-[11px] text-white/55 flex items-center gap-2">
                <Lock size={13} className="text-royal-gold" />
                Publicação exclusiva para Staff e Liderança
              </div>
            )}
          </div>
        </div>

        {/* Upload / Publish Panel (Staff & Leaders Only) */}
        {canManage && showComposer && (
          <form
            onSubmit={handlePublish}
            className="bg-graphite border border-royal-gold/30 rounded-sm p-6 md:p-8 shadow-gold-glow space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-royal-gold" />
                  Nova Cinemática da Fraternidade
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  Publique via link do YouTube ou importe um vídeo direto do seu computador.
                </p>
              </div>

              <div className="inline-flex bg-obsidian p-1 rounded-sm border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('YOUTUBE')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all ${
                    mode === 'YOUTUBE'
                      ? 'bg-royal-gold text-obsidian'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Youtube size={14} /> URL do YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setMode('UPLOAD')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-all ${
                    mode === 'UPLOAD'
                      ? 'bg-royal-gold text-obsidian'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Upload size={14} /> Importar do PC
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Título da Cinemática *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Abertura Oficial da Fraternidade em Roxwood"
                  className="w-full bg-obsidian border border-white/15 rounded-sm px-3.5 py-2.5 text-sm text-white focus:border-royal-gold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-obsidian border border-white/15 rounded-sm px-3.5 py-2.5 text-sm text-white focus:border-royal-gold focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Descrição (opcional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto do vídeo, participantes ou momento registrado..."
                className="w-full bg-obsidian border border-white/15 rounded-sm px-3.5 py-2.5 text-sm text-white focus:border-royal-gold focus:outline-none"
              />
            </div>

            {mode === 'YOUTUBE' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Link do YouTube *
                  </label>
                  <input
                    required
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    className="w-full bg-obsidian border border-white/15 rounded-sm px-3.5 py-2.5 text-sm text-white focus:border-royal-gold focus:outline-none"
                  />
                </div>
                {previewYoutubeId && (
                  <div className="flex items-center gap-4 p-3 bg-obsidian/80 border border-royal-gold/25 rounded-sm">
                    <img
                      src={`https://img.youtube.com/vi/${previewYoutubeId}/hqdefault.jpg`}
                      alt="Prévia YouTube"
                      className="w-32 h-20 object-cover rounded-sm"
                    />
                    <div className="text-xs text-honey">
                      Vídeo do YouTube reconhecido (<code className="text-white">{previewYoutubeId}</code>)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) setVideoFile(f);
                  }}
                  className="border border-dashed border-royal-gold/40 hover:border-royal-gold bg-obsidian/70 rounded-sm p-6 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  <Upload size={26} className="mx-auto text-royal-gold mb-2" />
                  {videoFile ? (
                    <div>
                      <p className="text-sm font-bold text-honey">{videoFile.name}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Clique ou arraste um vídeo do computador (.MP4, .WebM ou .MOV)
                      </p>
                      <p className="text-[11px] text-white/45 mt-1">
                        Limite de 25 MB no armazenamento interno da colmeia (ou até 80 MB com S3)
                      </p>
                    </div>
                  )}
                </div>

                {submitting && uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-obsidian rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-royal-gold transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-royal-gold text-right font-bold">
                      Enviando vídeo: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetComposer();
                  setShowComposer(false);
                }}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white border border-white/10 rounded-sm"
              >
                Cancelar
              </button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Publicando...' : 'Publicar na Cinemática'}
              </Button>
            </div>
          </form>
        )}

        {/* Active Video Cinema Player */}
        {activeVideo && (
          <section className="bg-graphite border border-royal-gold/25 rounded-sm overflow-hidden shadow-premium">
            <div className="aspect-video w-full bg-black">
              {activeVideo.sourceType === 'YOUTUBE' && activeVideo.youtubeId ? (
                <iframe
                  key={activeVideo.id}
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0`}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={activeVideo.id}
                  src={resolveMediaUrl(activeVideo.videoUrl)}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full bg-black"
                />
              )}
            </div>

            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 bg-royal-gold/15 border border-royal-gold/30 text-royal-gold text-[10px] font-bold uppercase tracking-widest rounded-sm">
                    {activeVideo.category}
                  </span>
                  <span className="text-xs text-white/45 flex items-center gap-1.5">
                    <Calendar size={12} className="text-royal-gold" />
                    {formatDate(activeVideo.createdAt)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">
                    {activeVideo.sourceType === 'YOUTUBE' ? 'YouTube' : 'Arquivo da Colmeia'}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white">{activeVideo.title}</h2>
                {activeVideo.description && (
                  <p className="text-sm text-white/65 leading-relaxed max-w-3xl">
                    {activeVideo.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xs text-white/50">
                    Publicado por <strong className="text-ivory">{activeVideo.author?.name}</strong>
                  </span>
                  {activeVideo.author?.user?.role && (
                    <RoleBadge role={activeVideo.author.user.role} />
                  )}
                </div>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => handleDelete(activeVideo)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300 hover:text-red-200 bg-red-500/10 border border-red-500/30 rounded-sm inline-flex items-center gap-2 shrink-0"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </div>
          </section>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                selectedCategory === cat
                  ? 'bg-royal-gold text-obsidian border-royal-gold shadow-gold-glow'
                  : 'bg-graphite/80 text-white/60 border-white/10 hover:border-royal-gold/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-graphite/60 border border-white/5 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-graphite/70 border border-royal-gold/20 rounded-sm p-12 text-center space-y-4">
            <HoneycombCrest className="w-16 h-16 mx-auto">
              <Film size={26} />
            </HoneycombCrest>
            <h3 className="text-lg font-bold text-white">Nenhuma cinemática publicada ainda</h3>
            <p className="text-sm text-white/55 max-w-md mx-auto">
              {canManage
                ? 'Clique em "Publicar Vídeo" acima para adicionar uma URL do YouTube ou enviar um vídeo direto do computador.'
                : 'Em breve os líderes e a Staff publicarão aqui os vídeos e produções oficiais da Fraternidade Enxamistas.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isSelected = activeVideo?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveVideo(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`group cursor-pointer rounded-sm overflow-hidden border transition-all bg-graphite ${
                    isSelected
                      ? 'border-royal-gold shadow-gold-glow'
                      : 'border-white/10 hover:border-royal-gold/45'
                  }`}
                >
                  <div className="relative aspect-video bg-obsidian flex items-center justify-center overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-royal-gold/70">
                        <Film size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Vídeo Enviado
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 hex-badge bg-royal-gold text-obsidian flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                        <Play size={18} className="ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-obsidian/85 border border-royal-gold/30 text-royal-gold text-[9px] font-bold uppercase tracking-widest rounded-sm">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-royal-gold transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                          title="Excluir cinemática"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-white/55 line-clamp-2">{item.description}</p>
                    )}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-white/45 border-t border-white/5">
                      <span>Por {item.author?.name}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
