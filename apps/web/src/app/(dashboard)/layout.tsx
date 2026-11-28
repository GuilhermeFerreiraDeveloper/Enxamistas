'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';
import api from '@/lib/api';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Users,
  MessageSquare,
  Bell,
  LogOut,
  Award,
  Rss,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Megaphone,
  Radio,
  Crown,
  ShieldAlert,
  UserCircle,
  Film,
  Image,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    api
      .get('/notifications')
      .then((res) => setUnreadNotifications(res.data?.unreadCount || 0))
      .catch(() => {});
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-obsidian text-ivory flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-12 h-12 border-4 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          {loading ? 'Verificando sessão...' : 'Redirecionando para o login...'}
        </p>
      </div>
    );
  }

  const isLeader =
    (RoleHierarchy[(user.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const sidebarItems = [
    {
      group: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Feed Social', href: '/feed', icon: Rss },
        { name: 'Avisos', href: '/avisos', icon: Megaphone },
        { name: 'Notificações', href: '/notificacoes', icon: Bell },
      ],
    },
    {
      group: 'Academia & Agenda',
      items: [
        { name: 'Grade Acadêmica', href: '/cursos', icon: BookOpen },
        { name: 'Eventos', href: '/eventos', icon: Calendar },
        { name: 'Calendário', href: '/calendario', icon: CalendarDays },
        { name: 'Medalhas', href: '/medalhas', icon: Award },
      ],
    },
    {
      group: 'Comunidade',
      items: [
        { name: 'Cinemática', href: '/cinematica', icon: Film },
        { name: 'Galeria da Colmeia', href: '/galeria', icon: Image },
        { name: 'Comunidade Pública', href: '/comunidade', icon: Users },
        { name: 'História & Regras', href: '/lore', icon: ScrollText },
        { name: 'Membros', href: '/membros', icon: Users },
        { name: 'Meu Perfil', href: '/perfil', icon: UserCircle },
        { name: 'Chat Privado', href: '/chat', icon: MessageSquare },
        { name: 'Rádio Interna', href: '/radio', icon: Radio },
        { name: 'Enxamista do Mês', href: '/reconhecimento', icon: Crown },
      ],
    },
    ...(isLeader
      ? [
          {
            group: 'Governança',
            items: [{ name: 'Painel Admin', href: '/admin', icon: ShieldAlert }],
          },
        ]
      : []),
  ];

  const profileName = user.profile?.name || 'Membro';
  const profileInitial = profileName.charAt(0).toUpperCase() || 'E';
  const firstName = profileName.split(' ')[0];

  return (
      <div className="min-h-screen min-w-0 overflow-x-clip bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian flex">
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.08] bg-[#171719]/95 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20' : 'w-72',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="h-20 flex items-center px-6 border-b border-royal-gold/15">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 hex-badge bg-royal-gold/10 border border-royal-gold/30 flex items-center justify-center p-1.5 shrink-0 transition-transform duration-500 group-hover:scale-110">
                <img
                  src="/icon.png"
                  alt="Enxamistas"
                  className="w-full h-full object-contain"
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-[0.2em] text-white group-hover:text-royal-gold transition-colors leading-none">
                    ENXAMISTAS
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-royal-gold/75 mt-1">
                    Colmeia • Roxwood
                  </span>
                </div>
              )}
            </Link>
          </div>

          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            title="Voltar ao site público"
            className={cn(
              'mx-3 mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-royal-gold/20 bg-gradient-to-r from-royal-gold/10 to-orchid/5 px-3 text-royal-gold transition-colors hover:border-royal-gold/40 hover:from-royal-gold/15',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Home size={17} className="shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Voltar ao site</span>}
          </Link>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6">
            {sidebarItems.map((group) => (
              <div key={group.group} className="mb-6">
                {!isCollapsed && (
                  <h3 className="px-6 mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                    {group.group}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'relative mx-2 flex items-center gap-3.5 rounded-xl px-4 py-3 transition-all duration-200 group',
                          isActive
                            ? 'bg-gradient-to-r from-royal-gold/15 to-orchid/[0.06] text-white'
                            : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
                        )}
                      >
                        {isActive && (
                          <div className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-gradient-to-b from-royal-gold to-orchid" />
                        )}
                        <item.icon size={18} className="shrink-0" />
                        {!isCollapsed && (
                          <span className="text-xs font-medium tracking-wide">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-5 border-t border-white/5 bg-black/20">
            {!isCollapsed && (
              <Link href="/perfil" className="flex items-center gap-3 mb-4 group">
                <div className="w-10 h-10 rounded-sm bg-obsidian border border-royal-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                  {user.profile?.avatar ? (
                    <img
                      src={resolveMediaUrl(user.profile.avatar)}
                      alt={profileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-royal-gold font-serif text-lg">{profileInitial}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-royal-gold">
                    {profileName}
                  </p>
                  <p className="text-[9px] text-royal-gold/70 truncate font-bold uppercase tracking-widest">
                    {user.role.replace('ABELHA_', '').replace(/_/g, ' ')}
                  </p>
                </div>
              </Link>
            )}

            <button
              onClick={logout}
              className={cn(
                'w-full flex items-center gap-3 text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all py-2.5 rounded-sm',
                isCollapsed ? 'justify-center' : 'px-3'
              )}
              title="Sair do Portal"
            >
              <LogOut size={18} />
              {!isCollapsed && (
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Sair</span>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Alternar barra lateral"
            className="absolute -right-3 top-28 w-6 h-6 bg-graphite border border-white/10 rounded-full items-center justify-center text-white/50 hover:text-royal-gold hidden lg:flex z-50"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {/* Main Content Area */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-screen transition-all duration-500 w-full',
            isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          )}
        >
          <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-obsidian/75 px-4 backdrop-blur-2xl sm:h-20 sm:px-6 md:px-8">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-white/70 hover:text-royal-gold"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
              <div className="hidden md:flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                <Link href="/dashboard" className="hover:text-royal-gold transition-colors">
                  Portal
                </Link>
                <ChevronRight size={12} />
                <span className="text-white/60">{pathname.split('/').filter(Boolean).join(' / ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <Link
                href="/notificacoes"
                className="relative p-2 text-white/60 hover:text-royal-gold transition-colors"
                aria-label="Notificações"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-royal-gold text-obsidian text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Link>

              <div className="h-7 w-px bg-white/10" />

              <Link href="/perfil" className="text-right hidden sm:block hover:opacity-80">
                <p className="text-xs font-bold text-white tracking-wide uppercase">{firstName}</p>
                <p className="text-[9px] text-royal-gold font-bold tracking-[0.2em] uppercase">
                  Passaporte #{user.passport}
                </p>
              </Link>
            </div>
          </header>

          <main className="relative min-w-0 flex-1 p-4 sm:p-6 md:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-orchid/[0.035] via-royal-gold/[0.025] to-transparent" />
            <div className="relative mx-auto w-full max-w-7xl min-w-0">{children}</div>
          </main>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 bg-black/20 px-4 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 sm:px-8">
            <span>© 2026 ENXAMISTAS ORGANIZAÇÃO</span>
            <div className="flex gap-6">
              <Link href="/lore" className="hover:text-royal-gold">Lore</Link>
              <Link href="/galeria" className="hover:text-royal-gold">Galeria</Link>
              <Link href="/mansoes" className="hover:text-royal-gold">Mansões</Link>
              <Link href="/projetos" className="hover:text-royal-gold">Projetos</Link>
              <Link href="/livro-de-visitas" className="hover:text-royal-gold">Livro de Visitas</Link>
            </div>
          </footer>
        </div>
      </div>
  );
}
