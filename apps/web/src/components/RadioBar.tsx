'use client'

import React from 'react';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward, Volume2, Radio, Heart, Youtube } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';

export function RadioBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    audioError,
    favorites,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    seekTo,
    toggleFavorite,
  } = useRadio();

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-graphite/95 backdrop-blur-xl border-t border-royal-gold/20 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-obsidian border border-royal-gold/30 rounded-sm flex items-center justify-center overflow-hidden shrink-0">
            <Radio size={18} className="text-royal-gold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Link href="/radio" className="text-xs font-bold text-white hover:text-royal-gold truncate block">
                {currentTrack.title}
              </Link>
              {currentTrack.sourceType === 'YOUTUBE' && (
                <Youtube size={10} className="text-royal-gold" />
              )}
            </div>
            <p className="text-[10px] text-white/50 truncate">{currentTrack.artist}</p>
            {audioError && <p className="text-[10px] text-red-400">{audioError}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={prevTrack} className="text-white/60 hover:text-royal-gold p-1">
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-royal-gold text-obsidian flex items-center justify-center hover:bg-royal-gold-light"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={nextTrack} className="text-white/60 hover:text-royal-gold p-1">
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`p-1 ${isFav ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
          >
            <Heart size={15} className={isFav ? 'fill-red-400' : ''} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="flex-1 accent-royal-gold"
          />
          <div className="flex items-center gap-2 w-28">
            <Volume2 size={14} className="text-royal-gold" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-royal-gold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
