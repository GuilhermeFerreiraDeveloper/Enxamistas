'use client'

import React, { useEffect, useState } from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { formatDate } from '@/lib/utils';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function AvisosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 1,
    isPinned: false,
    expiresAt: '',
  });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements', { params: category ? { category } : {} });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Erro ao carregar avisos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        ...form,
        expiresAt: form.expiresAt || null,
      });
      setModalOpen(false);
      setForm({ title: '', content: '', category: 'GENERAL', priority: 1, isPinned: false, expiresAt: '' });
      await load();
      showToast('Aviso publicado e notificado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao publicar aviso.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      await load();
      showToast('Aviso removido.', 'info');
    } catch {
      showToast('Erro ao remover aviso.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Megaphone size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Comunicados Oficiais
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Avisos Institucionais
          </h1>
        </div>
        {isLeader && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Novo Aviso
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { k: '', l: 'Todos' },
          { k: 'GENERAL', l: 'Gerais' },
          { k: 'ACADEMIC', l: 'Acadêmicos' },
          { k: 'EVENT', l: 'Eventos' },
          { k: 'INSTITUTIONAL', l: 'Institucionais' },
          { k: 'ADMIN', l: 'Administrativos' },
        ].map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => setCategory(c.k)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
              category === c.k
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10'
            }`}
          >
            {c.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-graphite/50 rounded-sm animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
          Nenhum aviso ativo nesta categoria.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((av) => (
            <div
              key={av.id}
              className={`bg-graphite border p-6 rounded-sm space-y-3 ${
                av.isPinned ? 'border-royal-gold/40' : 'border-white/5'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {av.isPinned && <Pin size={14} className="text-royal-gold" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                    {av.category}
                  </span>
                  <span className="text-[10px] text-white/40">{formatDate(av.createdAt)}</span>
                </div>
                {isLeader && (
                  <button
                    type="button"
                    onClick={() => handleDelete(av.id)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{av.title}</h2>
              <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{av.content}</p>
              <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-white/50">
                <span>Publicado por {av.author?.name}</span>
                {av.author?.user?.role && <RoleBadge role={av.author.user.role} />}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publicar Aviso Institucional">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            required
            placeholder="Título do aviso"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          >
            <option value="GENERAL">Geral</option>
            <option value="ACADEMIC">Acadêmico</option>
            <option value="EVENT">Evento</option>
            <option value="INSTITUTIONAL">Institucional</option>
            <option value="ADMIN">Administrativo</option>
          </select>
          <textarea
            required
            rows={4}
            placeholder="Conteúdo do comunicado"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
            />
            Fixar no topo (Pin)
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Publicar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
