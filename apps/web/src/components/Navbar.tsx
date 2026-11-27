'use client'

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: 'Início', href: '/' },
    { name: 'História & Regras', href: '/lore' },
    { name: 'Cinemática', href: '/cinematica' },
    { name: 'Galeria', href: '/galeria' },
    { name: 'Cursos', href: '/catalogo' },
    { name: 'Mansões', href: '/mansoes' },
    { name: 'Projetos', href: '/projetos' },
    { name: 'Livro de Visitas', href: '/livro-de-visitas' },
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-royal-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 hex-badge bg-royal-gold/10 border border-royal-gold/30 flex items-center justify-center p-1.5 group-hover:scale-110 transition-transform duration-500">
              <img
                src="/logos/Logo-2.png"
                alt="Enxamistas"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.3em] text-white group-hover:text-royal-gold transition-colors">
                ENXAMISTAS
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-royal-gold/75">
                Fraternidade • Roxwood
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65 hover:text-royal-gold transition-colors whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
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
            className="lg:hidden text-white/70 hover:text-royal-gold p-2"
            aria-label="Alternar menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={cn('lg:hidden bg-graphite border-b border-royal-gold/15', isOpen ? 'block' : 'hidden')}>
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block px-3 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white/75 hover:text-royal-gold"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
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
