'use client'

import Link from 'next/link';
import { Menu, X, Play, Pause, SkipForward, Volume2, VolumeX, Radio } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRadio } from '@/contexts/RadioContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    tracks,
    currentTrack,
    isPlaying,
    isLoaded,
    isMuted,
    volume,
    togglePlay,
    nextTrack,
    toggleMute,
    setVolume,
  } = useRadio();
  const playbackUnavailable = !currentTrack && tracks.length === 0;

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'História & Regras', href: '/lore' },
    { name: 'Cinemática', href: '/cinematica' },
    { name: 'Galeria', href: '/galeria' },
    { name: 'Comunidade', href: '/comunidade' },
    { name: 'Cursos', href: '/catalogo' },
    { name: 'Mansões', href: '/mansoes' },
    { name: 'Projetos', href: '/projetos' },
    { name: 'Livro de Visitas', href: '/livro-de-visitas' },
  ];
  const primaryNavLinks = navLinks.filter((link) =>
    ['Início', 'História & Regras', 'Comunidade', 'Cursos'].includes(link.name)
  );
  const secondaryNavLinks = navLinks.filter((link) => !primaryNavLinks.includes(link));

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-obsidian/80 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-5 sm:h-[5rem]">
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-royal-gold/30 bg-gradient-to-br from-royal-gold/20 to-orchid/10 p-1.5 shadow-gold-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-11 sm:w-11">
              <img
                src="/icon.png"
                alt="Enxamistas"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-[0.18em] text-white transition-colors group-hover:text-royal-gold sm:text-lg">
                ENXAMISTAS
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Uma colmeia, muitas vozes
              </span>
            </div>
          </Link>

          <div className="hidden xl:flex min-w-0 items-center gap-3 2xl:gap-4">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold transition-colors',
                  pathname === link.href ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {link.name}
              </Link>
            ))}
            <details className="group relative">
              <summary className="cursor-pointer list-none whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                Explorar
              </summary>
              <div className="absolute right-0 top-full z-50 mt-3 min-w-52 rounded-2xl border border-white/10 bg-graphite/95 p-2 shadow-2xl backdrop-blur-xl">
                {secondaryNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </details>
            {user ? (
              <Link href="/dashboard" className="btn-primary whitespace-nowrap">
                Colmeia
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/cadastro"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold hover:text-white transition-colors px-3 py-2 whitespace-nowrap"
                >
                  Candidatura
                </Link>
                <Link href="/login" className="btn-primary whitespace-nowrap">
                  Acessar
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-royal-gold/40 hover:text-royal-gold xl:hidden"
            aria-label="Alternar menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={cn('xl:hidden border-b border-white/10 bg-graphite/95 backdrop-blur-2xl', isOpen ? 'block' : 'hidden')}>
        <div className="mx-auto max-w-2xl space-y-1 px-4 py-4 sm:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                pathname === link.href ? 'bg-white/[0.08] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'
              )}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <section data-radio-controls className="my-3 rounded-sm border border-royal-gold/20 bg-obsidian/80 p-4" aria-label="Player de música">
            <div className="mb-3 flex min-w-0 items-center gap-3">
              <Radio size={17} className="shrink-0 text-royal-gold" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">
                  {currentTrack?.title || (isLoaded ? 'Rádio Enxamistas' : 'Carregando rádio...')}
                </p>
                <p className="truncate text-[10px] text-white/50">
                  {currentTrack?.artist || (isLoaded ? 'Nenhuma faixa disponível' : 'Conectando à biblioteca')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                disabled={playbackUnavailable}
                aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-royal-gold text-obsidian disabled:opacity-40"
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <button
                type="button"
                onClick={nextTrack}
                disabled={playbackUnavailable}
                aria-label="Próxima música aleatória"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/5 hover:text-royal-gold disabled:opacity-40"
              >
                <SkipForward size={17} />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted || volume === 0 ? 'Ativar som' : 'Silenciar música'}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/5 hover:text-royal-gold"
              >
                {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Volume da música"
                className="min-w-0 flex-1 accent-royal-gold"
              />
            </div>
          </section>
          <div className="pt-3 border-t border-white/10 flex gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="btn-primary w-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Ir à Colmeia
              </Link>
            ) : (
              <>
                <Link
                  href="/cadastro"
                  className="flex-1 text-center py-2.5 border border-royal-gold/40 text-royal-gold text-xs font-bold uppercase tracking-widest rounded-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cadastro
                </Link>
                <Link
                  href="/login"
                  className="flex-1 btn-primary text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Acessar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
