'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface RadioTrackItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string | null;
  duration?: number | null;
}

interface RadioContextType {
  tracks: RadioTrackItem[];
  setTracks: (tracks: RadioTrackItem[]) => void;
  currentTrack: RadioTrackItem | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  audioError: string | null;
  favorites: string[];
  playTrack: (track: RadioTrackItem) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (v: number) => void;
  seekTo: (sec: number) => void;
  toggleFavorite: (trackId: string) => void;
}

const RadioContext = createContext<RadioContextType>({} as RadioContextType);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<RadioTrackItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<RadioTrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('enxamistas_radio_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // Ignore storage error
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setProgress(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
      setAudioError('Não foi possível reproduzir esta faixa de áudio.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const playTrack = (track: RadioTrackItem) => {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioError(null);
    setCurrentTrack(track);
    audio.src = track.url;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setAudioError('Reprodução bloqueada ou fonte de áudio indisponível.');
      });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    setAudioError(null);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setAudioError('Falha ao retomar reprodução de áudio.');
        });
    }
  };

  const nextTrack = () => {
    if (!tracks.length) return;
    const idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
    const next = tracks[(idx + 1) % tracks.length];
    if (next) playTrack(next);
  };

  const prevTrack = () => {
    if (!tracks.length) return;
    const idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : 0;
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    if (prev) playTrack(prev);
  };

  const setVolume = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  };

  const seekTo = (sec: number) => {
    if (audioRef.current && Number.isFinite(sec)) {
      audioRef.current.currentTime = sec;
      setProgress(sec);
    }
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      try {
        localStorage.setItem('enxamistas_radio_favorites', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <RadioContext.Provider
      value={{
        tracks,
        setTracks,
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        audioError,
        favorites,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        toggleFavorite,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export const useRadio = () => useContext(RadioContext);
