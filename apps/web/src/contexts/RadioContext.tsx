'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface RadioTrackItem {
  id: string;
  title: string;
  artist: string;
  sourceType: 'AUDIO' | 'YOUTUBE';
  url?: string | null;
  youtubeId?: string | null;
  youtubeUrl?: string | null;
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
  isYoutube: boolean;
  shuffle: boolean;
  toggleShuffle: () => void;
  loop: boolean;
  toggleLoop: () => void;
  isLoaded: boolean;
}

const RadioContext = createContext<RadioContextType>({} as RadioContextType);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
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
  }, []);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag) {
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      setYoutubeApiReady(true);
    };

    return () => {
      delete (window as any).onYouTubeIframeAPIReady;
    };
  }, []);

  useEffect(() => {
    if (!youtubeApiReady || typeof window === 'undefined' || !(window as any).YT) return;

    const player = new (window as any).YT.Player('youtube-radio-player', {
      height: '0',
      width: '0',
      videoId: currentTrack?.youtubeId || '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          youtubePlayerRef.current = event.target;
          if (currentTrack?.sourceType === 'YOUTUBE' && isPlaying) {
            event.target.playVideo();
            event.target.setVolume(volume * 100);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          if (state === (window as any).YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setAudioError(null);
          } else if (state === (window as any).YT.PlayerState.ENDED) {
            setIsPlaying(false);
            handleAutoNext();
          } else if (state === (window as any).YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
        onError: () => {
          setIsPlaying(false);
          setAudioError('Não foi possível reproduzir este vídeo do YouTube.');
        },
      },
    });

    return () => {
      try {
        player.destroy();
      } catch {
        // Ignore
      }
      youtubePlayerRef.current = null;
    };
  }, [youtubeApiReady, currentTrack, isPlaying, volume]);

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

  // Autoplay inicial aleatório quando as tracks carregam e não há nada tocando
  useEffect(() => {
    if (!isLoaded && tracks.length > 0 && !currentTrack && !isPlaying) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
      setIsLoaded(true);
    }
  }, [tracks, isLoaded, currentTrack, isPlaying]);

  const playTrack = (track: RadioTrackItem) => {
    setAudioError(null);
    setCurrentTrack(track);

    if (track.sourceType === 'YOUTUBE' && track.youtubeId) {
      const player = youtubePlayerRef.current;
      if (player) {
        player.cueVideoById(track.youtubeId);
        player.playVideo();
        player.setVolume(volume * 100);
      }
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    // Resolve relative /api/... URLs to the API origin (e.g. Render) so
    // cross-origin audio streaming works when frontend (Vercel) != API (Render).
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(
      /\/api(\/v1)?\/?$/,
      ''
    );
    const resolvedUrl = track.url?.startsWith('/api/') ? `${apiBase}${track.url}` : track.url;
    audio.crossOrigin = 'use-credentials';
    audio.src = resolvedUrl || '';
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setAudioError('Reprodução bloqueada ou fonte de áudio indisponível.');
      });
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    setAudioError(null);

    if (currentTrack.sourceType === 'YOUTUBE') {
      const player = youtubePlayerRef.current;
      if (!player) return;
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
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
    const player = youtubePlayerRef.current;
    if (player) player.setVolume(clamped * 100);
  };

  const seekTo = (sec: number) => {
    if (audioRef.current && Number.isFinite(sec) && currentTrack?.sourceType === 'AUDIO') {
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

  const toggleShuffle = () => setShuffle((prev) => !prev);
  const toggleLoop = () => setLoop((prev) => !prev);

  const isYoutube = currentTrack?.sourceType === 'YOUTUBE';

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
        isYoutube,
        shuffle,
        toggleShuffle,
        loop,
        toggleLoop,
        isLoaded,
      }}
    >
      {children}
      {isYoutube || currentTrack?.youtubeId ? (
        <iframe
          id="youtube-radio-player"
          title="YouTube Radio Player"
          src="https://www.youtube.com/embed/"
          style={{ display: 'none', width: 0, height: 0 }}
          sandbox="allow-same-origin allow-scripts"
        />
      ) : null}
    </RadioContext.Provider>
  );
}

export const useRadio = () => useContext(RadioContext);
