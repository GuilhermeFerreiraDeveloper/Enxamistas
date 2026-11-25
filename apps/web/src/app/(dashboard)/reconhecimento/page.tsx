'use client'

import React, { useEffect, useState } from 'react';
import { Crown, Plus, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function ReconhecimentoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    profileId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    reason: '',
    description: '',
    contributions: '',
  });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const load = async () => {
    try {
      const res = await api.get('/highlights');
      setHighlights(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Erro ao carregar Enxamista do Mês.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (isLeader) {
      api
        .get('/profiles/members', { params: { limit: 50 } })
        .then((res) => setMembers(res.data?.items || []))
        .catch(() => {});
    }
  }, [isLeader]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/highlights', {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
      });
      setModalOpen(false);
      await load();
      showToast('Enxamista do Mês registrado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar destaque.', 'error');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <Crown size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Mérito & Reconhecimento
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Enxamista do Mês
          </h1>
        </div>
        {isLeader && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Selecionar Destaque
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-52 bg-graphite/50 rounded-sm animate-pulse" />
      ) : highlights.length === 0 ? (
        <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
          Nenhum Enxamista do Mês selecionado ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {highlights.map((h, idx) => (
            <div
              key={h.id}
              className={`bg-graphite border p-8 rounded-sm flex flex-col md:flex-row gap-6 items-start ${
                idx === 0 ? 'border-royal-gold/50 shadow-gold-glow' : 'border-white/5'
              }`}
            >
              <div className="w-20 h-20 rounded-sm bg-obsidian border border-royal-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                {h.imageUrl || h.profile?.avatar ? (
                  <img
                    src={h.imageUrl || h.profile.avatar}
                    alt={h.profile?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={30} className="text-royal-gold/40" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 bg-royal-gold text-obsidian text-[10px] font-bold uppercase tracking-widest rounded-sm">
                    {String(h.month).padStart(2, '0')}/{h.year}
                  </span>
                  {h.profile?.user?.role && <RoleBadge role={h.profile.user.role} />}
                </div>
                <h2 className="text-2xl font-bold text-white">{h.profile?.name}</h2>
                <p className="text-sm text-royal-gold font-medium">{h.reason}</p>
                {h.description && <p className="text-xs text-white/70">{h.description}</p>}
                {h.contributions && (
                  <p className="text-xs text-white/50 pt-1">Contribuições: {h.contributions}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Definir Enxamista do Mês">
        <form onSubmit={handleCreate} className="space-y-4">
          <select
            required
            value={form.profileId}
            onChange={(e) => setForm((f) => ({ ...f, profileId: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          >
            <option value="">Selecione o membro...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (#{m.user.passport})
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={1}
              max={12}
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              min={2024}
              max={2100}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          </div>
          <input
            required
            minLength={5}
            placeholder="Motivo principal"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <textarea
            rows={3}
            placeholder="Descrição do reconhecimento"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <textarea
            rows={2}
            placeholder="Contribuições realizadas"
            value={form.contributions}
            onChange={(e) => setForm((f) => ({ ...f, contributions: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Destaque</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
