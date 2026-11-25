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
    { name: 'História', href: '/lore' },
    { name: 'Cursos', href: '/catalogo' },
    { name: 'Mansões', href: '/mansoes' },
    { name: 'Projetos', href: '/projetos' },
    { name: 'Livro de Visitas', href: '/livro-de-visitas' },
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-obsidian/85 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logos/Logo-2.png"
              alt="Enxamistas"
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500"
            />
            <span className="text-xl font-bold tracking-[0.3em] text-white">ENXAMISTAS</span>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 hover:text-royal-gold transition-colors"
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Painel
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/cadastro"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold hover:text-white transition-colors px-3 py-2"
                >
                  Candidatura
                </Link>
                <Link href="/login" className="btn-primary">
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

      <div className={cn('lg:hidden bg-graphite border-b border-white/10', isOpen ? 'block' : 'hidden')}>
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block px-3 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white/70 hover:text-royal-gold"
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
                Ir ao Painel
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
