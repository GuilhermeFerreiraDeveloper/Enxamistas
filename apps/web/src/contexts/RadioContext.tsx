'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface RadioTrackItem {
  id: string;
  title: string;
  artist: string;
  passport?: string | null;
  filePath?: string | null;
  status?: string | null;
  referenceUrl?: string | null;
  rejectionReason?: string | null;
  url?: string | null;
  author?: { id: string; name: string; avatar?: string | null } | null;
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
  shuffle: boolean;
  toggleShuffle: () => void;
  loop: boolean;
  toggleLoop: () => void;
  isLoaded: boolean;
  myRequests: RadioTrackItem[];
  setMyRequests: (requests: RadioTrackItem[]) => void;
  myPlaylist: any;
  setMyPlaylist: (playlist: any) => void;
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
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [myRequests, setMyRequests] = useState<RadioTrackItem[]>([]);
  const [myPlaylist, setMyPlaylist] = useState<any>(null);

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
    const onEnded = () => {
      setIsPlaying(false);
      handleAutoNext();
    };
    const onError = () => {
      setIsPlaying(false);
      setAudioError('Não foi possível reproduzir esta faixa de áudio.');
      handleAutoNext();
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
  }, [volume]);

  const handleAutoNext = () => {
    if (!tracks.length) return;
    if (loop) {
      // Toca a próxima (ou aleatória se shuffle)
      const idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
      let next: RadioTrackItem | undefined;
      if (shuffle) {
        const candidates = tracks.filter((t) => t.id !== currentTrack?.id);
        if (candidates.length > 0) {
          next = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          next = currentTrack ?? undefined;
        }
      } else {
        next = tracks[(idx + 1) % tracks.length];
      }
      if (next) playTrack(next);
    } else {
      nextTrack();
    }
  };

  // Autoplay inicial/automático: sempre que houver faixas e nada estiver tocando, começa a reproduzir
  useEffect(() => {
    if (!isLoaded && tracks.length > 0 && !currentTrack && !isPlaying) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
      setIsLoaded(true);
    }
    // Quando novas faixas são carregadas e nada está tocando, toca automaticamente
    if (tracks.length > 0 && !currentTrack && !isPlaying && isLoaded) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
    }
  }, [tracks, isLoaded, currentTrack, isPlaying]);

  const playTrack = (track: RadioTrackItem) => {
    setAudioError(null);
    setCurrentTrack(track);

    if (track.filePath && track.passport) {
      const audio = audioRef.current;
      if (!audio) return;
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api(\/v1)?\/?$/, '');
      const streamUrl = `${apiBase}/radio/stream/${track.passport}/${encodeURIComponent(track.filePath)}`;
      audio.crossOrigin = 'use-credentials';
      audio.src = streamUrl;
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setAudioError('Fonte de áudio indisponível.');
      });
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api(\/v1)?\/?$/, '');
    const resolvedUrl = track.url?.startsWith('/api/') ? `${apiBase}${track.url}` : track.url;
    audio.crossOrigin = 'use-credentials';
    audio.src = resolvedUrl || '';
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      setAudioError('Fonte de áudio indisponível.');
    });
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    setAudioError(null);
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setAudioError('Falha ao retomar reprodução.');
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
      try { localStorage.setItem('enxamistas_radio_favorites', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleShuffle = () => setShuffle((prev) => !prev);
  const toggleLoop = () => setLoop((prev) => !prev);

  return (
    <RadioContext.Provider value={{
      tracks, setTracks, currentTrack, isPlaying, volume, progress, duration,
      audioError, favorites, playTrack, togglePlay, nextTrack, prevTrack, setVolume,
      seekTo, toggleFavorite, shuffle, toggleShuffle, loop, toggleLoop, isLoaded,
      myRequests, setMyRequests, myPlaylist, setMyPlaylist,
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export const useRadio = () => useContext(RadioContext);
