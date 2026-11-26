'use client'

import React, { useEffect, useState } from 'react';
import { Radio, Play, Pause, Heart, Plus, Trash2, Music } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRadio, RadioTrackItem } from '@/contexts/RadioContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleHierarchy, UserRole, extractYoutubeId } from '@enxamistas/shared';

export default function RadioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { tracks, setTracks, currentTrack, isPlaying, favorites, playTrack, togglePlay, toggleFavorite } =
    useRadio();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', sourceType: 'AUDIO', url: '', youtubeUrl: '', youtubeId: '', coverUrl: '' });

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

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (form.sourceType === 'YOUTUBE' && form.youtubeUrl) {
        const ytId = extractYoutubeId(form.youtubeUrl);
        if (!ytId) {
          showToast('URL do YouTube inválida.', 'error');
          return;
        }
        payload.youtubeId = ytId;
      }
      await api.post('/radio/tracks', payload);
      setModalOpen(false);
      setForm({ title: '', artist: '', sourceType: 'AUDIO', url: '', youtubeUrl: '', youtubeId: '', coverUrl: '' });
      await loadRadio();
      showToast('Faixa adicionada à rádio!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao cadastrar faixa.', 'error');
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
            <label className="block text-xs font-bold text-white/70 mb-2">Fonte da faixa</label>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/60 hover:text-white">
                <input
                  type="radio"
                  name="sourceType"
                  value="AUDIO"
                  checked={form.sourceType === 'AUDIO'}
                  onChange={() => setForm((f) => ({ ...f, sourceType: 'AUDIO' }))}
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
            <input
              required
              type="url"
              placeholder="URL direta do áudio (.mp3 / .ogg / stream autorizado)"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
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
            <Button type="submit">Salvar Faixa</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
