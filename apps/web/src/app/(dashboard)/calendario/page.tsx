'use client'

import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Trash2, MapPin, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function CalendarioInstitucionalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState<'MONTH' | 'WEEK' | 'LIST'>('MONTH');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'MEETING',
    startAt: '',
    location: '',
    visibility: 'PRIVATE',
  });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadCommitments = async () => {
    try {
      const res = await api.get('/events/calendar');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Erro ao carregar calendário institucional.', 'error');
    }
  };

  useEffect(() => {
    loadCommitments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events/calendar', form);
      setModalOpen(false);
      setForm({ title: '', description: '', type: 'MEETING', startAt: '', location: '', visibility: 'PRIVATE' });
      await loadCommitments();
      showToast('Compromisso institucional adicionado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao adicionar compromisso.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/events/calendar/${id}`);
      await loadCommitments();
      showToast('Compromisso removido.', 'info');
    } catch {
      showToast('Erro ao remover compromisso.', 'error');
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeek = new Date(year, month, 1).getDay();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <CalendarDays size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Calendário Institucional
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Reuniões & Compromissos
          </h1>
          <p className="text-sm text-white/50">
            Calendário separado da grade acadêmica para reuniões, datas importantes e atividades.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['MONTH', 'WEEK', 'LIST'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
                view === v
                  ? 'bg-royal-gold text-obsidian border-royal-gold'
                  : 'bg-graphite text-white/60 border-white/10'
              }`}
            >
              {v === 'MONTH' ? 'Mensal' : v === 'WEEK' ? 'Semanal' : 'Lista'}
            </button>
          ))}
          {isLeader && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Compromisso
            </Button>
          )}
        </div>
      </div>

      {view === 'MONTH' && (
        <section className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            >
              ← Mês Anterior
            </Button>
            <h2 className="text-base font-bold uppercase tracking-widest text-royal-gold">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            >
              Próximo Mês →
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase text-white/40">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[90px] bg-obsidian/30 rounded-sm" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayItems = items.filter((item) => {
                const d = new Date(item.startAt);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
              });
              return (
                <div
                  key={day}
                  className="min-h-[90px] bg-obsidian border border-white/5 p-2 rounded-sm space-y-1"
                >
                  <span className="text-xs font-bold text-white/60">{day}</span>
                  {dayItems.map((it) => (
                    <div
                      key={it.id}
                      className="text-[10px] bg-royal-gold/15 border border-royal-gold/30 text-honey px-1.5 py-1 rounded-sm truncate"
                      title={it.title}
                    >
                      {it.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {view === 'WEEK' && (
        <section className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + idx);
            const dayItems = items.filter((it) => {
              const dt = new Date(it.startAt);
              return (
                dt.getFullYear() === d.getFullYear() &&
                dt.getMonth() === d.getMonth() &&
                dt.getDate() === d.getDate()
              );
            });
            return (
              <div key={idx} className="bg-graphite border border-white/5 p-4 rounded-sm space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-royal-gold border-b border-white/10 pb-2">
                  {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </p>
                {dayItems.length === 0 ? (
                  <p className="text-xs text-white/30">Livre</p>
                ) : (
                  dayItems.map((it) => (
                    <div key={it.id} className="p-2.5 bg-obsidian border border-white/10 rounded-sm text-xs">
                      <p className="font-bold text-white">{it.title}</p>
                      <p className="text-[10px] text-royal-gold mt-0.5">
                        {new Date(it.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </section>
      )}

      {view === 'LIST' && (
        <section className="space-y-3">
          {items.length === 0 ? (
            <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhum compromisso registrado.
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="bg-graphite border border-white/5 p-5 rounded-sm flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                    {it.type}
                  </span>
                  <h3 className="text-base font-bold text-white">{it.title}</h3>
                  {it.description && <p className="text-xs text-white/60">{it.description}</p>}
                  <div className="flex flex-wrap gap-4 text-[11px] text-white/40 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-royal-gold" />
                      {new Date(it.startAt).toLocaleString('pt-BR')}
                    </span>
                    {it.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-royal-gold" /> {it.location}
                      </span>
                    )}
                  </div>
                </div>
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => handleDelete(it.id)}
                    className="p-2 text-white/40 hover:text-red-400"
                    title="Excluir compromisso"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Compromisso Institucional">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            required
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          >
            <option value="MEETING">Reunião</option>
            <option value="IMPORTANT_DATE">Data Importante</option>
            <option value="COMMITMENT">Compromisso</option>
            <option value="ACTIVITY">Atividade</option>
          </select>
          <input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <input
            placeholder="Local (opcional)"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <textarea
            rows={3}
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
