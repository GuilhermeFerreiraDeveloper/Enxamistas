'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RadioProvider } from '@/contexts/RadioContext';
import { RadioBar } from '@/components/RadioBar';
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
  Megaphone,
  Radio,
  Crown,
  ShieldAlert,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <RadioProvider>
      <div className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian flex">
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col bg-graphite border-r border-white/5 transition-all duration-500 ease-in-out',
            isCollapsed ? 'w-20' : 'w-72',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <img
                src="/logos/Logo-2.png"
                alt="Enxamistas"
                className="w-10 h-10 object-contain shrink-0 transition-transform duration-500 group-hover:scale-110"
              />
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-[0.2em] text-white group-hover:text-royal-gold transition-colors">
                  ENXAMISTAS
                </span>
              )}
            </Link>
          </div>

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
                          'relative flex items-center gap-3.5 px-6 py-3 transition-all duration-300 group',
                          isActive
                            ? 'text-royal-gold bg-royal-gold/5'
                            : 'text-white/55 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-royal-gold" />
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
                      src={user.profile.avatar}
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
          <header className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 sticky top-0 bg-obsidian/85 backdrop-blur-xl z-30">
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

          <main className="flex-1 p-6 md:p-10 relative">
            <div className="max-w-7xl mx-auto relative">{children}</div>
          </main>

          <footer className="py-6 px-8 border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 flex flex-wrap justify-between items-center gap-4 bg-black/20 mb-14">
            <span>© 2026 ENXAMISTAS ORGANIZAÇÃO</span>
            <div className="flex gap-6">
              <Link href="/lore" className="hover:text-royal-gold">Lore</Link>
              <Link href="/mansoes" className="hover:text-royal-gold">Mansões</Link>
              <Link href="/projetos" className="hover:text-royal-gold">Projetos</Link>
              <Link href="/livro-de-visitas" className="hover:text-royal-gold">Livro de Visitas</Link>
            </div>
          </footer>
        </div>

        <RadioBar />
      </div>
    </RadioProvider>
  );
}
