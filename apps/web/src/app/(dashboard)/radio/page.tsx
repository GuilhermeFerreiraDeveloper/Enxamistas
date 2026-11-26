'use client'

import React, { useEffect, useState } from 'react';
import { Radio, Play, Pause, Heart, Plus, Music, Clock, List } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRadio, RadioTrackItem } from '@/contexts/RadioContext';
import { Button } from '@/components/ui/Button';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

function normalizeTrackName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function RadioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    tracks, setTracks, currentTrack, isPlaying, favorites,
    playTrack, togglePlay, toggleFavorite, myRequests, setMyRequests,
    myPlaylist, setMyPlaylist,
  } = useRadio();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'player' | 'pedidos' | 'playlist'>('player');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', referenceUrl: '' });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadRadio = async () => {
    try {
      const res = await api.get('/radio');
      setTracks(res.data?.tracks || []);
    } catch {
      showToast('Erro ao carregar rádio.', 'error');
    } finally { setLoading(false); }
  };

  const loadMyRequests = async () => {
    try {
      const res = await api.get('/radio/my-requests');
      setMyRequests(res.data || []);
    } catch {
      showToast('Erro ao carregar pedidos.', 'error');
    }
  };

  const loadMyPlaylist = async () => {
    try {
      const res = await api.get('/radio/my-playlist');
      setMyPlaylist(res.data || null);
    } catch {
      showToast('Erro ao carregar playlist.', 'error');
    }
  };

  useEffect(() => {
    loadRadio();
    loadMyRequests();
    loadMyPlaylist();

    const refreshInterval = window.setInterval(() => {
      loadRadio();
      loadMyRequests();
      loadMyPlaylist();
    }, 30000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  const handleRequestMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) {
      showToast('Título e artista são obrigatórios.', 'error');
      return;
    }
    try {
      await api.post('/radio/requests', { title: form.title, artist: form.artist, referenceUrl: form.referenceUrl });
      setModalOpen(false);
      setForm({ title: '', artist: '', referenceUrl: '' });
      await loadMyRequests();
      showToast('Pedido enviado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao enviar pedido.', 'error');
    }
  };

  const formatStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SOLICITADA: { label: 'Solicitada', color: 'text-blue-400' },
      EM_ANALISE: { label: 'Em Análise', color: 'text-yellow-400' },
      ADICIONADA_PLAYLIST: { label: 'Adicionada à Playlist', color: 'text-green-400' },
      RECUSADA: { label: 'Recusada', color: 'text-red-400' },
    };
    return map[status] || { label: status, color: 'text-white' };
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
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Rádio Enxamistas
          </h1>
          <p className="text-sm text-white/50">
            Reprodução contínua com todas as músicas MP3 disponíveis na biblioteca da rádio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setTab('player')}
            className={tab === 'player' ? 'bg-royal-gold text-obsidian' : 'bg-graphite border border-white/10'}
          >
            <Clock size={14} /> Player
          </Button>
          <Button
            onClick={() => setTab('pedidos')}
            className={tab === 'pedidos' ? 'bg-royal-gold text-obsidian' : 'bg-graphite border border-white/10'}
          >
            <List size={14} /> Meus Pedidos
          </Button>
          <Button
            onClick={() => setTab('playlist')}
            className={tab === 'playlist' ? 'bg-royal-gold text-obsidian' : 'bg-graphite border border-white/10'}
          >
            <Music size={14} /> Minha Playlist
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-graphite/50 rounded-sm animate-pulse" />
      ) : tab === 'player' ? (
        <div className="space-y-3">
          {tracks.length === 0 ? (
            <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhum arquivo MP3 encontrado na biblioteca da rádio.
            </div>
          ) : (
            <div className="space-y-2">
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
                        <p className="text-sm font-bold text-white truncate">{track.title}</p>
                        <p className="text-xs text-white/50 truncate">{track.artist}</p>
                        <p className="text-[10px] text-white/40 truncate">
                          Por: {track.author?.name || 'Desconhecido'}
                        </p>
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'pedidos' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <List size={18} className="text-royal-gold" /> Meus Pedidos
          </h2>
          {myRequests.length === 0 ? (
            <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhum pedido enviado ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {myRequests.map((req) => {
                const { label, color } = formatStatus(req.status || 'SOLICITADA');
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-sm border bg-graphite/60 border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{req.title}</p>
                      <p className="text-white/50 truncate">{req.artist}</p>
                      {req.referenceUrl && (
                        <a
                          href={String(req.referenceUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-royal-gold/70 truncate block"
                        >
                          {String(req.referenceUrl)}
                        </a>
                      )}
                      {req.status === 'RECUSADA' && req.rejectionReason && (
                        <p className="text-[10px] text-red-400 mt-1">Motivo: {String(req.rejectionReason)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6">
            <Button onClick={() => setModalOpen(true)}>Novo Pedido de Música</Button>
          </div>
        </div>
      ) : tab === 'playlist' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Music size={18} className="text-royal-gold" /> Minha Playlist
          </h2>
          {!myPlaylist ? (
            <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhuma playlist encontrada.
            </div>
          ) : myPlaylist?.tracks?.length === 0 ? (
            <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Sua playlist está vazia. Aguarde a Staff adicionar suas músicas aprovadas.
            </div>
          ) : (
            <div className="space-y-2">
              {myPlaylist.tracks.map((pt: any) => {
                const t = pt.track as RadioTrackItem;
                const normalizedTitle = normalizeTrackName(t.title);
                const normalizedArtist = normalizeTrackName(t.artist);
                const libraryTrack = tracks.find((track) => {
                  if (track.passport !== t.passport) return false;
                  const filename = normalizeTrackName(track.title);
                  return filename === normalizedTitle ||
                    (filename.includes(normalizedTitle) && filename.includes(normalizedArtist));
                });
                const playableTrack = libraryTrack || (t.filePath && t.passport ? t : null);
                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-sm border bg-graphite/60 border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        disabled={!playableTrack}
                        onClick={() => playableTrack && playTrack(playableTrack)}
                        className="w-8 h-8 rounded-full bg-royal-gold text-obsidian flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play size={14} />
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.title}</p>
                        <p className="text-xs text-white/50 truncate">{t.artist}</p>
                        {!playableTrack && (
                          <p className="text-[10px] text-white/35">Aguardando o MP3 correspondente na pasta do passaporte.</p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-white/40">{pt.order}°</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
