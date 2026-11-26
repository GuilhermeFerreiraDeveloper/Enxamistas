'use client'

import React, { useEffect, useRef, useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Heart,
  Plus,
  Trash2,
  Music,
  Upload,
  File,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRadio, RadioTrackItem } from '@/contexts/RadioContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  RoleHierarchy,
  UserRole,
  extractYoutubeId,
  audioMimeToExt,
} from '@enxamistas/shared';

const MAX_AUDIO_MB = 15;
const ALLOWED_AUDIO_EXTS = ['.mp3', '.ogg', '.wav', '.m4a', '.aac'];

export default function RadioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    tracks,
    setTracks,
    currentTrack,
    isPlaying,
    favorites,
    playTrack,
    togglePlay,
    toggleFavorite,
  } = useRadio();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    artist: string;
    sourceType: 'AUDIO' | 'YOUTUBE';
    audioInputMode: 'URL' | 'FILE';
    url: string;
    youtubeUrl: string;
    youtubeId: string;
    coverUrl: string;
  }>({
    title: '',
    artist: '',
    sourceType: 'AUDIO',
    audioInputMode: 'URL',
    url: '',
    youtubeUrl: '',
    youtubeId: '',
    coverUrl: '',
  });

  // Upload de arquivo do dispositivo (celular ou PC)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSubmitting, setAudioSubmitting] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadRadio = async () => {
    try {
      const res = await api.get('/radio');
      const loadedTracks: RadioTrackItem[] = res.data?.tracks || [];
      setTracks(loadedTracks);
      setPlaylists(res.data?.playlists || []);
    } catch {
      showToast('Erro ao carregar biblioteca da rádio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadio();
  }, []);

  const resetComposer = () => {
    setForm({
      title: '',
      artist: '',
      sourceType: 'AUDIO',
      audioInputMode: 'URL',
      url: '',
      youtubeUrl: '',
      youtubeId: '',
      coverUrl: '',
    });
    setAudioFile(null);
    setAudioUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) return;

    try {
      if (form.sourceType === 'YOUTUBE') {
        if (!form.youtubeUrl) {
          showToast('Informe a URL do YouTube.', 'error');
          return;
        }
        const ytId = extractYoutubeId(form.youtubeUrl);
        if (!ytId) {
          showToast('URL do YouTube inválida.', 'error');
          return;
        }
        await api.post('/radio/tracks', {
          title: form.title,
          artist: form.artist,
          youtubeUrl: form.youtubeUrl,
          coverUrl: form.coverUrl || undefined,
        });
      } else if (form.audioInputMode === 'URL') {
        if (!form.url) {
          showToast('Informe a URL direta do áudio.', 'error');
          return;
        }
        await api.post('/radio/tracks', {
          title: form.title,
          artist: form.artist,
          sourceType: 'AUDIO',
          url: form.url,
          coverUrl: form.coverUrl || undefined,
        });
      } else {
        // Modo arquivo: a importação é feita por handleImportAudioFile
        if (!audioFile) {
          showToast('Selecione um arquivo de áudio para importar.', 'error');
          return;
        }
        await handleImportAudioFile(e as React.FormEvent);
        return;
      }

      setModalOpen(false);
      resetComposer();
      await loadRadio();
      showToast('Faixa adicionada à rádio!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao cadastrar faixa.', 'error');
    }
  };

  const handleImportAudioFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) return;
    if (!audioFile) {
      showToast('Selecione um arquivo de áudio do dispositivo.', 'error');
      return;
    }

    const ext = ('.' + audioFile.name.split('.').pop()?.toLowerCase()) || '';
    if (!ALLOWED_AUDIO_EXTS.includes(ext)) {
      showToast(
        `Formato não suportado. Envie: ${ALLOWED_AUDIO_EXTS.join(', ')}`,
        'error'
      );
      return;
    }
    if (audioFile.size > MAX_AUDIO_MB * 1024 * 1024) {
      showToast(
        `O arquivo excede ${MAX_AUDIO_MB}MB. Use o YouTube para arquivos maiores.`,
        'error'
      );
      return;
    }

    setAudioSubmitting(true);
    setAudioUploadProgress(0);

    try {
      const buffer = await audioFile.arrayBuffer();

      await api.post('/radio/uploads/audio', buffer, {
        timeout: 180_000,
        headers: {
          'Content-Type': audioFile.type || 'audio/mpeg',
          'x-radio-title': encodeURIComponent(
            form.title || audioFile.name.replace(ext, '')
          ),
          'x-radio-artist': encodeURIComponent(form.artist || ''),
          ...(form.coverUrl ? { 'x-radio-cover-url': encodeURIComponent(form.coverUrl) } : {}),
        },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setAudioUploadProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      });

      setModalOpen(false);
      resetComposer();
      await loadRadio();
      showToast('Áudio importado para a rádio com sucesso!', 'success');
    } catch (err: any) {
      showToast(
        err.response?.data?.error || 'Erro ao importar áudio do dispositivo.',
        'error'
      );
    } finally {
      setAudioSubmitting(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    try {
      await api.delete(`/radio/tracks/${id}`);
      await loadRadio();
      showToast('Faixa removida.', 'info');
    } catch {
      showToast('Erro ao remover faixa.', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-10 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Radio size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Frequência Interna
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Rádio Enxamistas</h1>
          <p className="text-sm text-white/50">
            O player permanece ativo durante sua navegação pelo portal. Reprodução individual sob demanda.
          </p>
        </div>
        {isLeader && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Adicionar Faixa
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-48 bg-graphite/50 rounded-sm animate-pulse" />
      ) : tracks.length === 0 ? (
        <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
          Nenhuma faixa autorizada cadastrada na rádio ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isFav = favorites.includes(track.id);
            return (
              <div
                key={track.id}
                className={`p-4 rounded-sm border flex items-center justify-between gap-4 ${
                  isCurrent ? 'bg-graphite border-royal-gold/40' : 'bg-graphite/60 border-white/5'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => (isCurrent ? togglePlay() : playTrack(track))}
                    className="w-10 h-10 rounded-full bg-royal-gold text-obsidian flex items-center justify-center shrink-0"
                  >
                    {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-bold text-white truncate">{track.title}</p>
                      {track.sourceType === 'YOUTUBE' && (
                        <span className="text-[9px] bg-royal-gold/10 text-royal-gold border border-royal-gold/20 px-1.5 py-0.5 rounded">YT</span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(track.id)}
                    className={isFav ? 'text-red-400' : 'text-white/40 hover:text-red-400'}
                  >
                    <Heart size={16} className={isFav ? 'fill-red-400' : ''} />
                  </button>
                  {isLeader && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTrack(track.id)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playlists.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Music size={18} className="text-royal-gold" /> Playlists
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((pl) => (
              <div key={pl.id} className="bg-graphite border border-white/5 p-5 rounded-sm">
                <h3 className="font-bold text-white">{pl.name}</h3>
                <p className="text-xs text-white/50 mt-1">{pl.tracks?.length || 0} faixas</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Faixa Autorizada">
        <form onSubmit={handleAddTrack} className="space-y-4">
          <input
            required
            placeholder="Título da música"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <input
            required
            placeholder="Artista"
            value={form.artist}
            onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <div className="bg-obsidian border border-white/10 rounded-sm p-3">
            <label className="block text-xs font-bold text-white/70 mb-2">
              Fonte da faixa
            </label>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 hover:text-white">
                <input
                  type="radio"
                  name="sourceType"
                  value="AUDIO"
                  checked={form.sourceType === 'AUDIO'}
                  onChange={() =>
                    setForm((f) => ({ ...f, sourceType: 'AUDIO', audioInputMode: 'URL' }))
                  }
                  className="text-royal-gold"
                />
                Áudio direto
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 hover:text-white">
                <input
                  type="radio"
                  name="sourceType"
                  value="YOUTUBE"
                  checked={form.sourceType === 'YOUTUBE'}
                  onChange={() => setForm((f) => ({ ...f, sourceType: 'YOUTUBE' }))}
                  className="text-royal-gold"
                />
                YouTube
              </label>
            </div>
          </div>
          {form.sourceType === 'AUDIO' ? (
            <>
              <div className="bg-obsidian border border-white/10 rounded-sm p-3">
                <label className="block text-xs font-bold text-white/70 mb-2">
                  Como deseja adicionar o áudio?
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 hover:text-white flex-1">
                    <input
                      type="radio"
                      name="audioInputMode"
                      value="URL"
                      checked={form.audioInputMode === 'URL'}
                      onChange={() =>
                        setForm((f) => ({ ...f, audioInputMode: 'URL' }))
                      }
                      className="text-royal-gold"
                    />
                    URL direta
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 hover:text-white flex-1">
                    <input
                      type="radio"
                      name="audioInputMode"
                      value="FILE"
                      checked={form.audioInputMode === 'FILE'}
                      onChange={() =>
                        setForm((f) => ({ ...f, audioInputMode: 'FILE' }))
                      }
                      className="text-royal-gold"
                    />
                    Importar do dispositivo
                  </label>
                </div>
              </div>

              {form.audioInputMode === 'URL' ? (
                <input
                  required
                  type="url"
                  placeholder="URL direta do áudio (.mp3 / .ogg / stream autorizado)"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                />
              ) : (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) setAudioFile(f);
                    }}
                    className="border border-dashed border-royal-gold/40 hover:border-royal-gold bg-obsidian/70 rounded-sm p-6 text-center cursor-pointer transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/aac,.mp3,.ogg,.wav,.m4a,.aac"
                      className="hidden"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                    <Upload size={26} className="mx-auto text-royal-gold mb-2" />
                    {audioFile ? (
                      <div>
                        <p className="text-sm font-bold text-honey">{audioFile.name}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {formatFileSize(audioFile.size)} • Clique para trocar
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">
                          {audioMimeToExt(audioFile.type || 'audio/mpeg')} • Máx. {MAX_AUDIO_MB}MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-white/80">
                          Clique ou arraste uma música do celular ou computador
                        </p>
                        <p className="text-[11px] text-white/45 mt-1">
                          Suportado: MP3, OGG, WAV, M4A, AAC (máx. {MAX_AUDIO_MB}MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {audioSubmitting && audioUploadProgress > 0 && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-obsidian rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-royal-gold transition-all duration-300"
                          style={{ width: `${audioUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-royal-gold text-right font-bold">
                        Importando áudio: {audioUploadProgress}%
                      </p>
                    </div>
                  )}

                  {form.audioInputMode === 'FILE' && audioFile && !audioSubmitting && (
                    <div className="flex items-center gap-3 p-3 bg-royal-gold/10 border border-royal-gold/20 rounded-sm">
                      <File size={16} className="text-royal-gold" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {audioFile.name}
                        </p>
                        <p className="text-[10px] text-white/50 truncate">
                          {formatFileSize(audioFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAudioFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 text-white/40 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <input
              required
              type="url"
              placeholder="URL do YouTube (youtube.com/watch?v=..., youtu.be/...)"
              value={form.youtubeUrl}
              onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          )}
          <input
            type="url"
            placeholder="URL da capa (opcional)"
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={audioSubmitting}>
              {audioSubmitting ? 'Importando...' : 'Salvar Faixa'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
