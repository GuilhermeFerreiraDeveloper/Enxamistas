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
  const tracksRef = useRef(tracks);
  const currentTrackRef = useRef(currentTrack);
  const failedTrackIdsRef = useRef(new Set<string>());
  const playTrackRef = useRef<(track: RadioTrackItem) => void>(() => {});
  const autoNextRef = useRef<(failed?: boolean) => void>(() => {});
  tracksRef.current = tracks;
  currentTrackRef.current = currentTrack;

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
    audioRef.current = audio;

    const onTimeUpdate = () => setProgress(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onLoadedData = () => {
      const current = currentTrackRef.current;
      if (current) failedTrackIdsRef.current.delete(current.id);
      setAudioError(null);
    };
    const onEnded = () => {
      setIsPlaying(false);
      autoNextRef.current();
    };
    const onError = () => {
      setIsPlaying(false);
      setAudioError('Não foi possível reproduzir esta faixa; avançando para a próxima.');
      autoNextRef.current(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('loadeddata', onLoadedData);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('loadeddata', onLoadedData);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = (track: RadioTrackItem) => {
    setAudioError(null);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setProgress(0);
    setDuration(0);

    const audio = audioRef.current;
    if (!audio) return;

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
    const streamUrl = track.url
      ? track.url.startsWith('/') ? `${apiBase}${track.url}` : track.url
      : track.filePath && track.passport
        ? `${apiBase}/radio/stream/${encodeURIComponent(track.passport)}/${encodeURIComponent(track.filePath)}`
        : '';

    if (!streamUrl) {
      setIsPlaying(false);
      setAudioError('Esta faixa não possui um arquivo de áudio disponível.');
      autoNextRef.current(true);
      return;
    }

    audio.crossOrigin = 'use-credentials';
    audio.src = streamUrl;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      setAudioError('O navegador bloqueou a reprodução automática. Use o botão play para iniciar.');
    });
  };

  const handleAutoNext = (failed = false) => {
    const playlist = tracksRef.current;
    if (playlist.length === 0) return;

    const current = currentTrackRef.current;
    if (failed && current) failedTrackIdsRef.current.add(current.id);
    const currentIndex = current ? playlist.findIndex((track) => track.id === current.id) : -1;

    for (let offset = 1; offset <= playlist.length; offset += 1) {
      const index = (currentIndex + offset + playlist.length) % playlist.length;
      const candidate = playlist[index];
      if (!failedTrackIdsRef.current.has(candidate.id)) {
        playTrackRef.current(candidate);
        return;
      }
    }

    setIsPlaying(false);
    setAudioError('Nenhuma faixa da biblioteca pôde ser reproduzida.');
  };

  playTrackRef.current = playTrack;
  autoNextRef.current = handleAutoNext;

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      playTrack(tracks[0]);
      setIsLoaded(true);
    }
  }, [tracks, currentTrack]);

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
