'use client'

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  BarChart3,
  KeyRound,
  AlertTriangle,
  Settings,
  ScrollText,
  CheckCircle2,
  XCircle,
  Radio,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { RoleHierarchy, RoleLabels, UserRole } from '@enxamistas/shared';

type AdminTab = 'METRICS' | 'MEMBERS' | 'RBAC' | 'MODERATION' | 'PROOFS_KEYS' | 'SETTINGS_LOGS' | 'RADIO';

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>('METRICS');
  const [metrics, setMetrics] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [rbac, setRbac] = useState<{ roles: any[]; permissions: any[] }>({ roles: [], permissions: [] });
  const [reports, setReports] = useState<any[]>([]);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [keyRequests, setKeyRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [newRoleForm, setNewRoleForm] = useState({ code: '', name: '', level: 30, description: '' });
  const [radioRequests, setRadioRequests] = useState<any[]>([]);
  const [radioFilePaths, setRadioFilePaths] = useState<Record<string, string>>({});
  const [radioRejectionReasons, setRadioRejectionReasons] = useState<Record<string, string>>({});

  const hasAccess =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadTab = async (activeTab: AdminTab) => {
    try {
      if (activeTab === 'METRICS') {
        const res = await api.get('/admin/metrics');
        setMetrics(res.data);
      } else if (activeTab === 'MEMBERS') {
        const res = await api.get('/admin/members', { params: memberQuery ? { q: memberQuery } : {} });
        setMembers(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'RBAC') {
        const res = await api.get('/admin/roles');
        setRbac(res.data || { roles: [], permissions: [] });
      } else if (activeTab === 'MODERATION') {
        const res = await api.get('/admin/reports');
        setReports(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'PROOFS_KEYS') {
        const [pRes, kRes] = await Promise.all([
          api.get('/admin/proofs/pending'),
          api.get('/admin/key-requests'),
        ]);
        setPendingProofs(Array.isArray(pRes.data) ? pRes.data : []);
        setKeyRequests(Array.isArray(kRes.data) ? kRes.data : []);
      } else if (activeTab === 'SETTINGS_LOGS') {
        const [sRes, aRes] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/admin/audit-logs'),
        ]);
        const map: Record<string, string> = {};
        for (const item of sRes.data || []) map[item.key] = item.value;
        setSettings(map);
        setAuditLogs(aRes.data?.items || []);
      } else if (activeTab === 'RADIO') {
        const res = await api.get('/radio/requests');
        setRadioRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao carregar dados administrativos.', 'error');
    }
  };

  useEffect(() => {
    if (hasAccess) loadTab(tab);
  }, [tab, hasAccess]);

  if (!hasAccess) {
    return (
      <div className="p-12 bg-graphite border border-red-500/30 rounded-sm text-center space-y-3">
        <ShieldAlert size={32} className="text-red-400 mx-auto" />
        <h1 className="text-xl font-bold text-white uppercase">Acesso Restrito</h1>
        <p className="text-xs text-white/60">
          O Painel Administrativo é exclusivo para Staff Zangão, Abelha Rainha e Abelha Princesa.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (targetUserId: string, role: string) => {
    try {
      await api.put(`/admin/members/${targetUserId}/role`, { role });
      await loadTab('MEMBERS');
      showToast('Cargo atualizado e auditado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao alterar cargo.', 'error');
    }
  };

  const handleSuspendToggle = async (targetUserId: string, current: boolean) => {
    try {
      await api.put(`/admin/members/${targetUserId}/suspend`, {
        isSuspended: !current,
        reason: !current ? 'Suspenso via Painel Administrativo' : undefined,
      });
      await loadTab('MEMBERS');
      showToast(!current ? 'Usuário suspenso.' : 'Usuário reativado.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao alterar suspensão.', 'error');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/roles', newRoleForm);
      setNewRoleForm({ code: '', name: '', level: 30, description: '' });
      await loadTab('RBAC');
      showToast('Cargo criado no RBAC!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar cargo.', 'error');
    }
  };

  const handleModerateReport = async (id: string, status: string) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      await loadTab('MODERATION');
      showToast('Denúncia atualizada.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar denúncia.', 'error');
    }
  };

  const handleReviewKey = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/gallery/key-requests/${requestId}`, { status });
      await loadTab('PROOFS_KEYS');
      showToast('Solicitação atualizada!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao revisar solicitação.', 'error');
    }
  };

  const handleUpdateRadioStatus = async (
    trackId: string,
    status: 'SOLICITADA' | 'EM_ANALISE' | 'ADICIONADA_PLAYLIST' | 'RECUSADA'
  ) => {
    try {
      await api.put(`/radio/requests/${trackId}/status`, {
        status,
        filePath: radioFilePaths[trackId],
        rejectionReason: radioRejectionReasons[trackId],
      });
      await loadTab('RADIO');
      showToast(status === 'RECUSADA' ? 'Pedido recusado.' : 'Status da música atualizado.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar pedido.', 'error');
    }
  };

  const handleDeleteRadioRequest = async (trackId: string) => {
    try {
      await api.delete(`/radio/requests/${trackId}`);
      await loadTab('RADIO');
      showToast('Pedido removido.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao remover pedido.', 'error');
    }
  };

  const handleValidateProof = async (proofId: string, status: 'VALIDATED' | 'REJECTED') => {
    try {
      await api.post(`/academic/proofs/${proofId}/validate`, {
        status,
        feedback: status === 'REJECTED' ? 'Recusado pela coordenação acadêmica' : undefined,
      });
      await loadTab('PROOFS_KEYS');
      showToast('Comprovante processado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao processar comprovante.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      showToast('Configurações institucionais salvas!', 'success');
    } catch {
      showToast('Erro ao salvar configurações.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
          Governança da Colmeia
        </span>
        <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
          Painel Administrativo
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { k: 'METRICS', l: 'Métricas', icon: BarChart3 },
          { k: 'MEMBERS', l: 'Membros & Cargos', icon: Users },
          { k: 'RBAC', l: 'RBAC & Permissões', icon: KeyRound },
          { k: 'MODERATION', l: 'Denúncias', icon: AlertTriangle },
          { k: 'PROOFS_KEYS', l: 'Comprovantes & Chaves', icon: CheckCircle2 },
          { k: 'RADIO', l: 'Músicas', icon: Radio },
          { k: 'SETTINGS_LOGS', l: 'Configurações & Auditoria', icon: Settings },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k as AdminTab)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border inline-flex items-center gap-2 ${
              tab === t.k
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10'
            }`}
          >
            <t.icon size={13} /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'METRICS' && metrics && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics.totals || {}).map(([k, v]) => (
              <div key={k} className="bg-graphite border border-white/5 p-4 rounded-sm">
                <p className="text-[10px] uppercase tracking-widest text-white/40">{k}</p>
                <p className="text-2xl font-bold text-royal-gold mt-1">{String(v)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-royal-gold">
                Distribuição por Cargo
              </h2>
              {(metrics.roleDistribution || []).map((r: any) => (
                <div key={r.role} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <RoleBadge role={r.role} />
                  <span className="font-bold text-white">{r.count}</span>
                </div>
              ))}
            </div>

            <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-royal-gold">
                Atividades Auditadas Recentes
              </h2>
              {(metrics.recentAuditLogs || []).map((log: any) => (
                <div key={log.id} className="text-xs py-1.5 border-b border-white/5 flex justify-between gap-2">
                  <span className="text-white/80">
                    <strong className="text-royal-gold">{log.action}</strong> ({log.resource})
                  </span>
                  <span className="text-white/40">
                    {log.user?.profile?.name || log.user?.passport || 'Sistema'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'MEMBERS' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              placeholder="Pesquisar membro por nome ou passaporte..."
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              className="flex-1 bg-graphite border border-white/10 rounded-sm px-4 py-2 text-xs text-white"
            />
            <Button size="sm" onClick={() => loadTab('MEMBERS')}>
              Buscar
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-graphite border border-white/5 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-bold text-white">
                    {m.profile?.name} (#{m.passport}) {m.isSuspended && <span className="text-red-400">[SUSPENSO]</span>}
                  </p>
                  <p className="text-white/40">
                    Curso Principal: {m.profile?.mainCourse?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={m.role}
                    disabled={m.id === user?.id}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="bg-obsidian border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>
                        {RoleLabels[r]}
                      </option>
                    ))}
                  </select>
                  {m.id !== user?.id && (
                    <Button
                      size="sm"
                      variant={m.isSuspended ? 'outline' : 'secondary'}
                      onClick={() => handleSuspendToggle(m.id, m.isSuspended)}
                    >
                      {m.isSuspended ? 'Reativar' : 'Suspender'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'RBAC' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h2 className="text-sm font-bold text-royal-gold uppercase tracking-widest">
              Cargos & Permissões Registrados
            </h2>
            {rbac.roles.map((r) => (
              <div key={r.id} className="p-3 bg-obsidian border border-white/10 rounded-sm text-xs space-y-1">
                <div className="flex justify-between">
                  <strong className="text-white">{r.name}</strong>
                  <span className="text-royal-gold">Nível {r.level}</span>
                </div>
                <p className="text-white/40">{r.code} • {r.rolePermissions?.length || 0} permissões</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateRole} className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4 h-fit">
            <h2 className="text-sm font-bold text-royal-gold uppercase tracking-widest">
              Criar Novo Cargo Extensível
            </h2>
            <input
              required
              placeholder="Código (ex: MONITOR_ACADEMIA)"
              value={newRoleForm.code}
              onChange={(e) => setNewRoleForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <input
              required
              placeholder="Nome visível"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              value={newRoleForm.level}
              onChange={(e) => setNewRoleForm((f) => ({ ...f, level: Number(e.target.value) }))}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <Button type="submit">Criar Cargo</Button>
          </form>
        </div>
      )}

      {tab === 'MODERATION' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-xs text-white/40">Nenhuma denúncia registrada.</p>
          ) : (
            reports.map((rep) => (
              <div key={rep.id} className="bg-graphite border border-white/5 p-5 rounded-sm space-y-2 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-bold text-royal-gold">
                    {rep.contentType} • {rep.reason}
                  </span>
                  <span className="uppercase font-bold text-white/60">{rep.status}</span>
                </div>
                <p className="text-white/70">{rep.description || 'Sem descrição adicional.'}</p>
                <p className="text-white/40">Denunciante: {rep.reporter?.name}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(['ANALYZING', 'RESOLVED', 'REJECTED'] as const).map((st) => (
                    <Button key={st} size="sm" variant="outline" onClick={() => handleModerateReport(rep.id, st)}>
                      {st}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'PROOFS_KEYS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold">
              Comprovantes Pendentes ({pendingProofs.length})
            </h2>
            {pendingProofs.map((p) => (
              <div key={p.id} className="bg-graphite border border-white/5 p-4 rounded-sm text-xs space-y-2">
                <p className="font-bold text-white">
                  {p.profile?.name} — {p.session?.course?.name} ({p.session?.title})
                </p>
                <a href={p.imageUrl} target="_blank" rel="noopener noreferrer" className="text-royal-gold underline">
                  Abrir Comprovante
                </a>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleValidateProof(p.id, 'VALIDATED')}>
                    <CheckCircle2 size={12} /> Validar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleValidateProof(p.id, 'REJECTED')}>
                    <XCircle size={12} /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold">
              Solicitações de Chave ({keyRequests.length})
            </h2>
            {keyRequests.map((kr) => (
              <div key={kr.id} className="bg-graphite border border-white/5 p-4 rounded-sm text-xs space-y-2">
                <div className="flex justify-between">
                  <strong className="text-white">{kr.album?.name}</strong>
                  <span className="text-royal-gold">{kr.status}</span>
                </div>
                <p className="text-white/70">
                  {kr.profile?.name} (#{kr.profile?.user?.passport}): {kr.reason}
                </p>
                {kr.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReviewKey(kr.id, 'APPROVED')}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReviewKey(kr.id, 'REJECTED')}>
                      Recusar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'SETTINGS_LOGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveSettings} className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold">
              Configurações Institucionais
            </h2>
            {[
              { k: 'guestbook_public', l: 'Livro de visitas público (true/false)' },
              { k: 'social_instagram', l: 'URL Instagram' },
              { k: 'social_discord', l: 'URL Discord' },
              { k: 'social_twitter', l: 'URL Twitter/X' },
              { k: 'lore_origin', l: 'Lore — Origem (Roxwood)' },
              { k: 'lore_philosophy', l: 'Lore — Erasmos & Filosofia' },
              { k: 'lore_culture', l: 'Lore — Cultura & Trabalho em Equipe' },
              { k: 'lore_objectives', l: 'Lore — Hoje em Roxwood' },
            ].map((item) => (
              <div key={item.k} className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">{item.l}</label>
                <input
                  value={settings[item.k] || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, [item.k]: e.target.value }))}
                  className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                />
              </div>
            ))}
            <Button type="submit">Salvar Configurações</Button>
          </form>

          <div className="bg-graphite border border-white/5 p-6 rounded-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold flex items-center gap-2">
              <ScrollText size={14} /> Logs de Auditoria
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-obsidian border border-white/5 rounded-sm text-xs">
                  <div className="flex justify-between">
                    <strong className="text-royal-gold">{log.action}</strong>
                    <span className="text-[10px] text-white/40">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-white/60 mt-1">
                    Responsável: {log.user?.profile?.name || log.user?.passport || 'Sistema'} • Recurso:{' '}
                    {log.resource || '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'RADIO' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold flex items-center gap-2">
            <Radio size={14} /> Músicas ({radioRequests.length})
          </h2>
          {radioRequests.length === 0 ? (
            <p className="text-xs text-white/40 bg-graphite border border-white/5 p-8 rounded-sm text-center">
              Nenhum pedido de música no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {radioRequests.map((track) => (
                <div key={track.id} className="bg-graphite border border-white/5 p-4 rounded-sm space-y-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{track.title}</p>
                      <p className="text-white/50">{track.artist}</p>
                      <p className="text-white/40">
                        Por {track.author?.name} • Passaporte #{track.author?.user?.passport || track.passport}
                      </p>
                      {track.referenceUrl && (
                        <a className="text-royal-gold break-all" href={track.referenceUrl} target="_blank" rel="noreferrer">
                          {track.referenceUrl}
                        </a>
                      )}
                      {track.rejectionReason && (
                        <p className="text-red-400 mt-1">Motivo: {track.rejectionReason}</p>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-1 border border-white/10 rounded text-white/60">
                      {track.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <input
                        value={radioFilePaths[track.id] || track.filePath || ''}
                        onChange={(e) => setRadioFilePaths((prev) => ({ ...prev, [track.id]: e.target.value }))}
                        placeholder="Nome do MP3, ex.: musica.mp3"
                        className="w-full rounded-sm bg-obsidian border border-white/10 px-3 py-2 text-white"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => handleUpdateRadioStatus(track.id, 'EM_ANALISE')}>
                          Em análise
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateRadioStatus(track.id, 'ADICIONADA_PLAYLIST')}>
                          <CheckCircle2 size={12} /> Adicionar à playlist
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <input
                        value={radioRejectionReasons[track.id] || ''}
                        onChange={(e) => setRadioRejectionReasons((prev) => ({ ...prev, [track.id]: e.target.value }))}
                        placeholder="Motivo da recusa"
                        className="w-full rounded-sm bg-obsidian border border-white/10 px-3 py-2 text-white"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => handleUpdateRadioStatus(track.id, 'RECUSADA')}>
                          <XCircle size={12} /> Recusar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDeleteRadioRequest(track.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
