'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

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
  isMuted: boolean;
  toggleMute: () => void;
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

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<RadioTrackItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<RadioTrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shuffle, setShuffle] = useState(true);
  const [loop, setLoop] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [myRequests, setMyRequests] = useState<RadioTrackItem[]>([]);
  const [myPlaylist, setMyPlaylist] = useState<any>(null);
  const tracksRef = useRef(tracks);
  const currentTrackRef = useRef(currentTrack);
  const failedTrackIdsRef = useRef(new Set<string>());
  const shuffleQueueRef = useRef<string[]>([]);
  const userPausedRef = useRef(false);
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const resumeOnInteraction = (event: Event) => {
      if (event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return;
      if (event.target instanceof Element && event.target.closest('[data-radio-controls]')) return;

      const audio = audioRef.current;
      if (!audio || audio.paused === false || userPausedRef.current || !currentTrackRef.current) return;
      audio.play().then(() => {
        setIsPlaying(true);
        setAudioError(null);
      }).catch(() => {
        setAudioError('A reprodução continua bloqueada pelo navegador. Use o botão play da rádio.');
      });
    };

    document.addEventListener('pointerdown', resumeOnInteraction, true);
    document.addEventListener('keydown', resumeOnInteraction, true);
    return () => {
      document.removeEventListener('pointerdown', resumeOnInteraction, true);
      document.removeEventListener('keydown', resumeOnInteraction, true);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadLibrary = async () => {
      try {
        const response = await api.get('/radio/public');
        if (active) {
          setTracks(Array.isArray(response.data?.tracks) ? response.data.tracks : []);
          setIsLoaded(true);
        }
      } catch {
        if (active) {
          setAudioError('Não foi possível carregar a biblioteca da rádio.');
          setIsLoaded(true);
        }
      }
    };

    void loadLibrary();
    const intervalId = window.setInterval(() => void loadLibrary(), 60000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const playTrack = (track: RadioTrackItem) => {
    userPausedRef.current = false;
    setAudioError(null);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setProgress(0);
    setDuration(0);
    shuffleQueueRef.current = shuffleQueueRef.current.filter((trackId) => trackId !== track.id);

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

    audio.crossOrigin = 'anonymous';
    audio.src = streamUrl;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      setIsPlaying(false);
      setAudioError('O navegador bloqueou a reprodução automática. Use o botão play para iniciar.');
    });
  };

  const takeNextTrack = () => {
    const playlist = tracksRef.current;
    if (!playlist.length) return null;

    const currentId = currentTrackRef.current?.id;
    const failedIds = failedTrackIdsRef.current;
    const availableIds = new Set(playlist.map((track) => track.id));
    shuffleQueueRef.current = shuffleQueueRef.current.filter(
      (id) => availableIds.has(id) && id !== currentId && !failedIds.has(id)
    );

    while (shuffleQueueRef.current.length) {
      const nextId = shuffleQueueRef.current.shift();
      const next = playlist.find((track) => track.id === nextId);
      if (next) return next;
    }

    const remaining = shuffled(playlist.filter((track) => track.id !== currentId && !failedIds.has(track.id)));
    if (remaining.length) {
      shuffleQueueRef.current = remaining.slice(1).map((track) => track.id);
      return remaining[0];
    }

    return playlist.find((track) => !failedIds.has(track.id)) || null;
  };

  const handleAutoNext = (failed = false) => {
    const current = currentTrackRef.current;
    if (failed && current) failedTrackIdsRef.current.add(current.id);

    const next = takeNextTrack();
    if (next) {
      playTrackRef.current(next);
      return;
    }

    setIsPlaying(false);
    setAudioError('Nenhuma faixa da biblioteca pôde ser reproduzida.');
  };

  playTrackRef.current = playTrack;
  autoNextRef.current = handleAutoNext;

  useEffect(() => {
    if (!tracks.length) return;

    const currentId = currentTrackRef.current?.id;
    const validIds = new Set(tracks.map((track) => track.id));
    shuffleQueueRef.current = shuffleQueueRef.current.filter(
      (id) => validIds.has(id) && id !== currentId && !failedTrackIdsRef.current.has(id)
    );
    const queuedIds = new Set(shuffleQueueRef.current);
    const newTracks = tracks.filter(
      (track) => track.id !== currentId && !queuedIds.has(track.id) && !failedTrackIdsRef.current.has(track.id)
    );
    shuffleQueueRef.current.push(...shuffled(newTracks).map((track) => track.id));
    setIsLoaded(true);

    if (!currentId && shuffleQueueRef.current.length) {
      const firstTrackId = shuffleQueueRef.current.shift();
      const firstTrack = tracks.find((track) => track.id === firstTrackId);
      if (firstTrack) playTrackRef.current(firstTrack);
    }
  }, [tracks]);

  const togglePlay = () => {
    if (!currentTrack) {
      const firstTrack = takeNextTrack();
      if (firstTrack) playTrack(firstTrack);
      else setAudioError(isLoaded ? 'A biblioteca ainda não possui músicas.' : 'Aguarde o carregamento da biblioteca da rádio.');
      return;
    }
    setAudioError(null);
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setAudioError('Falha ao retomar reprodução.');
      });
    }
  };

  const nextTrack = () => {
    const next = takeNextTrack();
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
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = false;
    }
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

  const toggleMute = () => setIsMuted((muted) => !muted);
  const toggleShuffle = () => setShuffle((prev) => !prev);
  const toggleLoop = () => setLoop((prev) => !prev);

  return (
    <RadioContext.Provider value={{
      tracks, setTracks, currentTrack, isPlaying, volume, isMuted, toggleMute, progress, duration,
      audioError, favorites, playTrack, togglePlay, nextTrack, prevTrack, setVolume,
      seekTo, toggleFavorite, shuffle, toggleShuffle, loop, toggleLoop, isLoaded,
      myRequests, setMyRequests, myPlaylist, setMyPlaylist,
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export const useRadio = () => useContext(RadioContext);
