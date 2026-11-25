'use client'

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  Ban,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function EventosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'INSTITUTIONAL',
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE',
    limit: '',
    attractions: '',
    extraInfo: '',
    coverImage: '',
  });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Erro ao carregar eventos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRsvp = async (eventId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      await api.post(`/events/${eventId}/rsvp`, { status });
      await loadEvents();
      showToast(status === 'CONFIRMED' ? 'Presença confirmada!' : 'Presença cancelada.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar RSVP.', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      date: '',
      location: '',
      category: 'INSTITUTIONAL',
      visibility: 'PRIVATE',
      limit: '',
      attractions: '',
      extraInfo: '',
      coverImage: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: any) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : '',
      location: ev.location,
      category: ev.category,
      visibility: ev.visibility,
      limit: ev.limit ? String(ev.limit) : '',
      attractions: ev.attractions || '',
      extraInfo: ev.extraInfo || '',
      coverImage: ev.coverImage || '',
    });
    setModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      limit: form.limit ? parseInt(form.limit, 10) : undefined,
    };
    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, payload);
        showToast('Evento atualizado e participantes notificados!', 'success');
      } else {
        await api.post('/events', payload);
        showToast('Evento criado!', 'success');
      }
      setModalOpen(false);
      await loadEvents();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar evento.', 'error');
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await api.put(`/events/${eventId}`, { status: 'CANCELLED' });
      await loadEvents();
      showToast('Evento cancelado e participantes notificados.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao cancelar evento.', 'error');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Calendar size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Agenda Oficial
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Eventos</h1>
          <p className="text-sm text-white/50">
            Confirme sua presença, consulte participantes e acompanhe os encontros da colmeia.
          </p>
        </div>

        {isLeader && (
          <Button onClick={openCreateModal}>
            <Plus size={14} /> Novo Evento
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-16 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
          Nenhum evento cadastrado no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((ev) => {
            const confirmedAttendees = (ev.attendees || []).filter((a: any) => a.status === 'CONFIRMED');
            const myRsvp = confirmedAttendees.some((a: any) => a.profileId === user?.profile?.id);
            const isFull = Boolean(ev.limit && confirmedAttendees.length >= ev.limit);
            const isCancelled = ev.status === 'CANCELLED';

            return (
              <div
                key={ev.id}
                className="bg-graphite border border-white/5 p-6 rounded-sm flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-royal-gold/15 border border-royal-gold/30 text-royal-gold text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      {ev.category} • {ev.visibility === 'PUBLIC' ? 'Público' : 'Privado'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        isCancelled ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white">{ev.title}</h2>
                  <p className="text-xs text-white/60 leading-relaxed">{ev.description}</p>
                  {ev.attractions && (
                    <p className="text-xs text-royal-gold/80">Atrações: {ev.attractions}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/50 pt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-royal-gold" />
                      {formatDate(ev.date)} ({new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-royal-gold" /> {ev.location}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(ev)}
                    className="text-xs text-royal-gold hover:underline inline-flex items-center gap-1.5"
                  >
                    <Users size={14} />
                    {confirmedAttendees.length}
                    {ev.limit ? ` / ${ev.limit}` : ''} confirmados
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isCancelled && (
                      myRsvp ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRsvp(ev.id, 'CANCELLED')}
                        >
                          <XCircle size={13} /> Cancelar Presença
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isFull}
                          onClick={() => handleRsvp(ev.id, 'CONFIRMED')}
                        >
                          <CheckCircle2 size={13} /> {isFull ? 'Lotado' : 'Confirmar Presença'}
                        </Button>
                      )
                    )}

                    {isLeader && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="p-2 bg-obsidian border border-white/10 rounded-sm text-white/60 hover:text-royal-gold"
                          title="Editar evento"
                        >
                          <Edit3 size={14} />
                        </button>
                        {!isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelEvent(ev.id)}
                            className="p-2 bg-obsidian border border-white/10 rounded-sm text-white/60 hover:text-red-400"
                            title="Cancelar evento"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attendees Modal */}
      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={`Participantes — ${selectedEvent?.title || ''}`}
      >
        <div className="space-y-3">
          {(selectedEvent?.attendees || []).length === 0 ? (
            <p className="text-xs text-white/50">Nenhum participante confirmado ainda.</p>
          ) : (
            selectedEvent.attendees.map((att: any) => (
              <div
                key={att.id}
                className="p-3 bg-obsidian border border-white/10 rounded-sm flex items-center justify-between text-xs"
              >
                <span className="font-bold text-white">{att.profile?.name}</span>
                <span className="text-white/50">#{att.profile?.user?.passport}</span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Create / Edit Event Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Evento' : 'Criar Novo Evento'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <input
            required
            minLength={3}
            placeholder="Título do evento"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <textarea
            required
            minLength={10}
            rows={3}
            placeholder="Descrição completa do evento"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <input
              required
              placeholder="Local"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <select
              value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as any }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            >
              <option value="PRIVATE">Privado (Membros)</option>
              <option value="PUBLIC">Público (Portal)</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Limite (opcional)"
              value={form.limit}
              onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          </div>
          <input
            placeholder="Atrações / destaques (opcional)"
            value={form.attractions}
            onChange={(e) => setForm((f) => ({ ...f, attractions: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? 'Salvar Alterações' : 'Publicar Evento'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
