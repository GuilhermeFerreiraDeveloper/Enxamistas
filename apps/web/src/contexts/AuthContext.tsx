'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  passport: string;
  role: string;
  profile: {
    id: string;
    name: string;
    avatar?: string | null;
    mainCourseId?: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/perfil',
  '/cursos',
  '/feed',
  '/membros',
  '/eventos',
  '/calendario',
  '/medalhas',
  '/chat',
  '/avisos',
  '/notificacoes',
  '/radio',
  '/reconhecimento',
  '/admin',
];

function isProtectedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      const loadedUser = response.data.user ?? null;
      setUser(loadedUser);
      return loadedUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !user && isProtectedRoute(pathname)) {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  const login = async (data: any) => {
    await api.post('/auth/login', data);
    const loaded = await refreshUser();
    if (!loaded) {
      throw new Error('Sessão não pôde ser confirmada após o login.');
    }
    router.push('/dashboard');
  };

  const registerUser = async (data: any) => {
    await api.post('/auth/register', data);
    const loaded = await refreshUser();
    if (!loaded) {
      throw new Error('Sessão não pôde ser confirmada após o cadastro.');
    }
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
