'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Check, Sliders } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function NotificacoesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [nRes, pRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/preferences'),
      ]);
      setItems(nRes.data?.items || []);
      setUnreadCount(nRes.data?.unreadCount || 0);
      setPrefs(pRes.data);
    } catch {
      showToast('Erro ao carregar notificações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    await load();
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    await load();
    showToast('Todas as notificações marcadas como lidas.', 'success');
  };

  const togglePref = async (key: string) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await api.put('/notifications/preferences', { [key]: updated[key] });
    showToast('Preferência atualizada.', 'success');
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Bell size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              {unreadCount} não lidas
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Central de Notificações
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck size={14} /> Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {prefs && (
        <section className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-royal-gold flex items-center gap-2">
            <Sliders size={14} /> Preferências de Notificação
          </h2>
          <div className="flex flex-wrap gap-6 text-xs">
            {[
              { k: 'events', l: 'Eventos' },
              { k: 'academic', l: 'Acadêmico & Medalhas' },
              { k: 'feed', l: 'Feed & Comentários' },
              { k: 'chat', l: 'Chat Privado' },
              { k: 'admin', l: 'Avisos & Administração' },
            ].map((p) => (
              <label key={p.k} className="flex items-center gap-2 cursor-pointer text-white/80">
                <input
                  type="checkbox"
                  checked={Boolean(prefs[p.k])}
                  onChange={() => togglePref(p.k)}
                />
                {p.l}
              </label>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="h-48 bg-graphite/50 rounded-sm animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
          Nenhuma notificação registrada.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-sm border flex flex-wrap items-center justify-between gap-4 ${
                n.isRead ? 'bg-graphite/50 border-white/5' : 'bg-graphite border-royal-gold/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                  {n.type} • {formatDate(n.createdAt)}
                </span>
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <p className="text-xs text-white/60">{n.content}</p>
                {n.link && (
                  <Link href={n.link} className="text-xs text-royal-gold hover:underline inline-block pt-1">
                    Abrir destino →
                  </Link>
                )}
              </div>
              {!n.isRead && (
                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                  <Check size={14} /> Marcar Lida
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
