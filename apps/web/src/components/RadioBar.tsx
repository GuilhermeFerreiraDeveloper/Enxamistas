'use client'

import React from 'react';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio, Heart } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export function RadioBar() {
  const {
    tracks,
    currentTrack,
    isPlaying,
    isLoaded,
    volume,
    isMuted,
    progress,
    duration,
    audioError,
    favorites,
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
    setVolume,
    seekTo,
    toggleFavorite,
  } = useRadio();

  const isFav = currentTrack ? favorites.includes(currentTrack.id) : false;
  const playbackUnavailable = !currentTrack && tracks.length === 0;

  return (
    <div data-radio-controls className="hive-radio-dock fixed inset-x-2 bottom-2 z-40 rounded-2xl border border-white/10 bg-[#1b1b1e]/90 px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:inset-x-5 sm:bottom-4 sm:px-5 lg:inset-x-1/2 lg:w-[min(100%-2.5rem,80rem)] lg:-translate-x-1/2">
      <div className="mx-auto grid max-w-7xl min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[minmax(180px,1fr)_auto_minmax(220px,1fr)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-royal-gold/25 bg-gradient-to-br from-royal-gold/15 to-orchid/10">
            <Radio size={17} className="text-royal-gold" />
          </div>
          <div className="min-w-0">
            <Link href="/radio" className="block truncate text-xs font-bold text-white hover:text-royal-gold">
              {currentTrack?.title || (isLoaded ? 'Rádio Enxamistas' : 'Carregando rádio...')}
            </Link>
            <p className="truncate text-[10px] text-white/50">
              {currentTrack?.artist || (isLoaded ? 'Nenhuma faixa disponível' : 'Conectando à biblioteca')}
            </p>
            {audioError && <p className="max-w-48 truncate text-[10px] text-red-400" title={audioError}>{audioError}</p>}
          </div>
        </div>

        <div data-radio-controls className="flex items-center justify-self-end gap-1 sm:gap-2">
          <button type="button" onClick={prevTrack} disabled={playbackUnavailable} aria-label="Faixa anterior" title="Faixa anterior" className="hidden min-h-9 min-w-9 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-royal-gold disabled:opacity-30 sm:grid">
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={playbackUnavailable}
            aria-label={isPlaying ? 'Pausar rádio' : 'Iniciar rádio'}
            title={isPlaying ? 'Pausar rádio' : 'Iniciar rádio'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-royal-gold text-obsidian hover:bg-royal-gold-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={nextTrack} disabled={playbackUnavailable} aria-label="Próxima faixa aleatória" title="Próxima faixa" className="grid min-h-9 min-w-9 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-royal-gold disabled:opacity-30">
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
            disabled={!currentTrack}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`hidden min-h-9 min-w-9 place-items-center rounded-full sm:grid ${isFav ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
          >
            <Heart size={15} className={isFav ? 'fill-red-400' : ''} />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted || volume === 0 ? 'Ativar som' : 'Silenciar rádio'}
            title={isMuted || volume === 0 ? 'Ativar som' : 'Silenciar rádio'}
            className="grid min-h-9 min-w-9 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-royal-gold"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        <div className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-1 md:gap-3">
          <span className="hidden w-9 shrink-0 text-right text-[9px] tabular-nums text-white/40 sm:block">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={Math.min(progress, duration || 1)}
            aria-label="Posição da faixa"
            onChange={(event) => seekTo(Number(event.target.value))}
            className="min-w-0 flex-1 accent-royal-gold"
          />
          <span className="hidden w-9 shrink-0 text-[9px] tabular-nums text-white/40 sm:block">{formatTime(duration)}</span>
          <div className="flex w-20 shrink-0 items-center gap-1.5 sm:w-28">
            <Volume2 size={13} className="shrink-0 text-royal-gold" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Volume da rádio"
              onChange={(event) => setVolume(Number(event.target.value))}
              className="min-w-0 w-full accent-royal-gold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
