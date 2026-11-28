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
  Trash2,
  UploadCloud,
  Award,
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
  const [courses, setCourses] = useState<any[]>([]);
  const [medalCatalog, setMedalCatalog] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedMedalId, setSelectedMedalId] = useState('');
  const [medalReason, setMedalReason] = useState('');
  const [memberForm, setMemberForm] = useState<Record<string, string>>({});
  const [completionCourseId, setCompletionCourseId] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [mainCourseId, setMainCourseId] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [rbac, setRbac] = useState<{ roles: any[]; permissions: any[] }>({ roles: [], permissions: [] });
  const [reports, setReports] = useState<any[]>([]);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [keyRequests, setKeyRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [newRoleForm, setNewRoleForm] = useState({ code: '', name: '', level: 30, description: '' });
  const [radioRequests, setRadioRequests] = useState<any[]>([]);
  const [radioLibrary, setRadioLibrary] = useState<any[]>([]);
  const [selectedRadioFiles, setSelectedRadioFiles] = useState<Record<string, string>>({});
  const [radioMusicPassport, setRadioMusicPassport] = useState('');
  const [radioMusicFile, setRadioMusicFile] = useState<File | null>(null);
  const [uploadingRadioMusic, setUploadingRadioMusic] = useState(false);

  const hasAccess =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadTab = async (activeTab: AdminTab) => {
    try {
      if (activeTab === 'METRICS') {
        const res = await api.get('/admin/metrics');
        setMetrics(res.data);
      } else if (activeTab === 'MEMBERS') {
        const [membersRes, coursesRes, medalsRes] = await Promise.all([
          api.get('/admin/members', { params: memberQuery ? { q: memberQuery } : {} }),
          api.get('/courses'),
          api.get('/medals/catalog'),
        ]);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setMedalCatalog(Array.isArray(medalsRes.data?.medals) ? medalsRes.data.medals : []);
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
        const [requestsRes, libraryRes] = await Promise.all([
          api.get('/radio/requests'),
          api.get('/radio'),
        ]);
        setRadioRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setRadioLibrary(Array.isArray(libraryRes.data?.tracks) ? libraryRes.data.tracks : []);
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

  const openMemberEditor = (member: any) => {
    setEditingMember(member);
    setMainCourseId(member.profile?.mainCourseId || '');
    setMemberForm({
      name: member.profile?.name || '',
      passport: member.passport || '',
      joinDate: member.profile?.joinDate ? new Date(member.profile.joinDate).toISOString().slice(0, 10) : '',
      avatar: member.profile?.avatar || '',
      banner: member.profile?.banner || '',
      nickname: member.profile?.nickname || '',
      age: member.profile?.age == null ? '' : String(member.profile.age),
      zodiac: member.profile?.zodiac || '',
      bio: member.profile?.bio || '',
      description: member.profile?.description || '',
      favoriteMusic: member.profile?.favoriteMusic || '',
      favoriteFilm: member.profile?.favoriteFilm || '',
      personalQuote: member.profile?.personalQuote || '',
      socialLinks: member.profile?.socialLinks || '',
      formationArea: member.profile?.formationArea || '',
      honors: member.profile?.honors || '',
      musicGenre: member.profile?.musicGenre || '',
      interests: member.profile?.interests || '',
      projects: member.profile?.projects || '',
    });
  };

  const handleSaveMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMember) return;
    try {
      await api.put(`/admin/members/${editingMember.id}`, {
        ...memberForm,
        age: memberForm.age ? Number(memberForm.age) : null,
        joinDate: memberForm.joinDate || undefined,
      });
      await loadTab('MEMBERS');
      setEditingMember(null);
      showToast('Dados do membro atualizados e registrados na auditoria.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar dados do membro.', 'error');
    }
  };

  const handleChangeMainCourse = async () => {
    if (!editingMember?.profile?.id || !mainCourseId) return;
    try {
      await api.put(`/admin/profiles/${editingMember.profile.id}/main-course`, { courseId: mainCourseId });
      await loadTab('MEMBERS');
      setEditingMember(null);
      showToast('Curso principal atualizado.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao alterar o curso principal.', 'error');
    }
  };

  const handleReviewMemberCourse = async (status: 'APPROVED' | 'REJECTED') => {
    if (!editingMember?.profile?.id || !completionCourseId) return;
    if (status === 'REJECTED' && completionNotes.trim().length < 3) {
      showToast('Informe o motivo da reprovação (mínimo de 3 caracteres).', 'error');
      return;
    }
    try {
      await api.put(`/admin/profiles/${editingMember.profile.id}/courses/${completionCourseId}/complete`, {
        status,
        notes: completionNotes || undefined,
        emitMedal: status === 'APPROVED',
      });
      await loadTab('MEMBERS');
      setEditingMember(null);
      setCompletionCourseId('');
      setCompletionNotes('');
      showToast(status === 'APPROVED'
        ? 'Curso aprovado e medalha de mérito concedida.'
        : 'Curso reprovado; matrícula e membro atualizados.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao revisar curso do membro.', 'error');
    }
  };

  const handleGrantMemberMedal = async () => {
    if (!editingMember?.profile?.id || !selectedMedalId) return;
    try {
      await api.post(`/admin/profiles/${editingMember.profile.id}/medals`, {
        medalId: selectedMedalId,
        reason: medalReason.trim() || undefined,
      });
      await loadTab('MEMBERS');
      setEditingMember(null);
      setSelectedMedalId('');
      setMedalReason('');
      showToast('Medalha concedida e visível no perfil do membro.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao conceder medalha.', 'error');
    }
  };

  const handleRemoveMemberMedal = async (member: any, medal: any) => {
    if (!window.confirm(`Remover a medalha "${medal.medal.name}" deste membro?`)) return;
    try {
      await api.delete(`/admin/profiles/${member.profile.id}/medals/${medal.id}`);
      await loadTab('MEMBERS');
      setEditingMember(null);
      showToast('Medalha removida do perfil do membro.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao remover medalha.', 'error');
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

  const handleUploadRadioMusic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!radioMusicFile) {
      showToast('Selecione um arquivo MP3.', 'error');
      return;
    }
    if (!radioMusicFile.name.toLowerCase().endsWith('.mp3')) {
      showToast('Apenas arquivos .mp3 são permitidos.', 'error');
      return;
    }
    if (radioMusicFile.size > 50 * 1024 * 1024) {
      showToast('O arquivo deve ter no máximo 50 MB.', 'error');
      return;
    }

    setUploadingRadioMusic(true);
    try {
      await api.post('/radio/library', radioMusicFile, {
        params: { passport: radioMusicPassport.trim(), filename: radioMusicFile.name },
        headers: { 'Content-Type': 'audio/mpeg' },
        timeout: 120000,
      });
      setRadioMusicFile(null);
      await loadTab('RADIO');
      showToast('MP3 adicionado à biblioteca da rádio.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao enviar o MP3.', 'error');
    } finally {
      setUploadingRadioMusic(false);
    }
  };

  const handleDeleteRadioMusic = async (filePath: string) => {
    if (!window.confirm(`Excluir o arquivo ${filePath}?`)) return;
    try {
      await api.delete('/radio/library', { params: { file: filePath } });
      setRadioLibrary((current) => current.filter((file) => file.filePath !== filePath));
      setSelectedRadioFiles((current) => Object.fromEntries(
        Object.entries(current).filter(([, selectedFile]) => selectedFile !== filePath)
      ));
      showToast('MP3 removido da biblioteca.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao excluir o MP3.', 'error');
    }
  };

  const handleUpdateRadioStatus = async (
    trackId: string,
    status: 'ADICIONADA_PLAYLIST' | 'RECUSADA',
    filePath?: string
  ) => {
    let rejectionReason: string | undefined;
    if (status === 'RECUSADA') {
      const answer = window.prompt('Motivo da recusa (opcional):');
      if (answer === null) return;
      rejectionReason = answer.trim() || undefined;
    }

    try {
      await api.put(`/radio/requests/${trackId}/status`, { status, rejectionReason, filePath });
      setRadioRequests((current) => current.filter((request) => request.id !== trackId));
      setSelectedRadioFiles((current) => {
        const next = { ...current };
        delete next[trackId];
        return next;
      });
      showToast(status === 'RECUSADA' ? 'Pedido recusado e membro notificado.' : 'Pedido aceito e membro notificado.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar pedido.', 'error');
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
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Pesquisar membro por nome ou passaporte..."
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              className="min-w-0 w-full flex-1 rounded-sm border border-white/10 bg-graphite px-4 py-2 text-xs text-white"
            />
            <Button size="sm" className="sm:w-auto" onClick={() => loadTab('MEMBERS')}>
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
                  <Button size="sm" variant="outline" onClick={() => openMemberEditor(m)}>
                    Gerenciar membro
                  </Button>
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

          {editingMember && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-6">
              <section role="dialog" aria-modal="true" aria-labelledby="member-editor-title" className="max-h-[calc(100vh-1rem)] w-full max-w-5xl space-y-6 overflow-y-auto border border-royal-gold/25 bg-graphite p-4 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="member-editor-title" className="text-lg font-bold uppercase tracking-widest text-royal-gold">Gerenciar membro</h2>
                  <p className="mt-1 text-xs text-white/50">{editingMember.profile?.name} • passaporte #{editingMember.passport}</p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>Fechar</Button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Conta e perfil público</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[['name', 'Nome'], ['passport', 'Passaporte'], ['nickname', 'Apelido'], ['age', 'Idade'], ['zodiac', 'Signo'], ['joinDate', 'Data de ingresso'], ['avatar', 'URL do avatar'], ['banner', 'URL da capa'], ['formationArea', 'Área de formação'], ['favoriteMusic', 'Música favorita'], ['favoriteFilm', 'Filme ou série favorito'], ['musicGenre', 'Gênero musical']].map(([key, label]) => (
                    <label key={key} className="space-y-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                      {label}
                      <input value={memberForm[key] || ''} type={key === 'age' ? 'number' : key === 'joinDate' ? 'date' : 'text'} onChange={(event) => setMemberForm((form) => ({ ...form, [key]: event.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm normal-case tracking-normal text-white" />
                    </label>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['bio', 'Biografia'], ['description', 'Descrição'], ['personalQuote', 'Frase pessoal'],
                    ['socialLinks', 'Links sociais (um por linha)'], ['honors', 'Títulos e destaques'],
                    ['interests', 'Interesses'], ['projects', 'Projetos'],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                      {label}
                      <textarea rows={key === 'description' || key === 'socialLinks' ? 4 : 3} value={memberForm[key] || ''} onChange={(event) => setMemberForm((form) => ({ ...form, [key]: event.target.value }))} className="w-full rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm normal-case tracking-normal text-white" />
                    </label>
                  ))}
                </div>
                <Button type="submit">Salvar informações</Button>
              </form>

              <div className="space-y-4 border-t border-white/10 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Formação e conclusão de cursos</h3>
                <div className="flex flex-wrap gap-3">
                  <select value={mainCourseId} onChange={(event) => setMainCourseId(event.target.value)} className="w-full min-w-0 flex-1 rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm text-white sm:min-w-60">
                    <option value="">Definir curso principal</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                  </select>
                  <Button type="button" variant="outline" disabled={!mainCourseId || mainCourseId === editingMember.profile?.mainCourseId} onClick={handleChangeMainCourse}>Alterar curso principal</Button>
                </div>
                <p className="text-xs text-white/50">Curso principal atual: {editingMember.profile?.mainCourse?.name || 'não definido'}</p>
                <div className="flex flex-wrap gap-3">
                  <select value={completionCourseId} onChange={(event) => setCompletionCourseId(event.target.value)} className="w-full min-w-0 flex-1 rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm text-white sm:min-w-60">
                    <option value="">Selecione um curso para revisar</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                  </select>
                  <input value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} placeholder="Observação ou motivo da reprovação" className="w-full min-w-0 flex-1 rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm text-white sm:min-w-60" />
                  <Button type="button" disabled={!completionCourseId} onClick={() => handleReviewMemberCourse('APPROVED')}>Aprovar e concluir</Button>
                  <Button type="button" variant="secondary" disabled={!completionCourseId || completionNotes.trim().length < 3} onClick={() => handleReviewMemberCourse('REJECTED')}>Reprovar curso</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingMember.profile?.courseCompletions || []).map((completion: any) => (
                    <span key={completion.id} className="border border-royal-gold/20 px-3 py-2 text-xs text-white/70">{completion.course.name} · {completion.status}</span>
                  ))}
                  {!(editingMember.profile?.courseCompletions || []).length && <span className="text-xs text-white/40">Nenhum curso concluído registrado.</span>}
                </div>
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Matrículas atuais</p>
                  <div className="flex flex-wrap gap-2">
                    {(editingMember.profile?.enrollments || []).map((enrollment: any) => (
                      <span key={enrollment.id} className="border border-white/10 px-3 py-2 text-xs text-white/60">{enrollment.course.name} · {enrollment.type} · {enrollment.status}</span>
                    ))}
                    {!(editingMember.profile?.enrollments || []).length && <span className="text-xs text-white/40">Nenhuma matrícula registrada.</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-5">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white"><Award size={15} className="text-royal-gold" /> Medalhas do membro</h3>
                <div className="flex flex-wrap gap-3">
                  <select value={selectedMedalId} onChange={(event) => setSelectedMedalId(event.target.value)} className="w-full min-w-0 flex-1 rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm text-white sm:min-w-60">
                    <option value="">Selecione uma medalha para conceder</option>
                    {medalCatalog.map((medal) => <option key={medal.id} value={medal.id}>{medal.name}{medal.course?.name ? ` · ${medal.course.name}` : ''}</option>)}
                  </select>
                  <input value={medalReason} onChange={(event) => setMedalReason(event.target.value)} placeholder="Motivo da concessão (opcional)" className="w-full min-w-0 flex-1 rounded-sm border border-white/10 bg-obsidian px-3 py-2 text-sm text-white sm:min-w-60" />
                  <Button type="button" disabled={!selectedMedalId} onClick={handleGrantMemberMedal}>Conceder medalha</Button>
                </div>
                <div className="space-y-2">
                  {(editingMember.profile?.medals || []).map((memberMedal: any) => (
                    <div key={memberMedal.id} className="flex flex-wrap items-center justify-between gap-3 border border-royal-gold/15 bg-obsidian/50 px-3 py-2">
                      <div>
                        <p className="text-sm font-bold text-white">{memberMedal.medal.name}</p>
                        <p className="text-[10px] text-white/45">{memberMedal.medal.course?.name || 'Mérito institucional'}{memberMedal.reason ? ` · ${memberMedal.reason}` : ''}</p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleRemoveMemberMedal(editingMember, memberMedal)}>Remover</Button>
                    </div>
                  ))}
                  {!(editingMember.profile?.medals || []).length && <p className="text-xs text-white/40">Este membro ainda não recebeu medalhas.</p>}
                </div>
              </div>
              </section>
            </div>
          )}
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
        <div className="space-y-8">
          <section className="bg-graphite border border-white/5 p-5 rounded-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold flex items-center gap-2">
                <Radio size={14} /> Biblioteca MP3 ({radioLibrary.length})
              </h2>
              <span className="text-[10px] text-white/40">Destino no servidor: musicas/{radioMusicPassport || 'PASSAPORTE'}/</span>
            </div>
            <form onSubmit={handleUploadRadioMusic} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <label htmlFor="radio-music-passport" className="text-[10px] uppercase tracking-widest text-white/50">Passaporte (pasta de destino)</label>
                <input
                  id="radio-music-passport"
                  required
                  maxLength={32}
                  pattern="[A-Za-z0-9-]+"
                  value={radioMusicPassport}
                  onChange={(event) => setRadioMusicPassport(event.target.value)}
                  className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                  placeholder="Ex.: 123456"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="radio-music-file" className="text-[10px] uppercase tracking-widest text-white/50">Arquivo MP3 (máx. 50 MB)</label>
                <input
                  id="radio-music-file"
                  required
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={(event) => setRadioMusicFile(event.target.files?.[0] || null)}
                  className="block w-full text-xs text-white/70 file:mr-3 file:rounded-sm file:border-0 file:bg-royal-gold file:px-3 file:py-2 file:text-xs file:font-bold file:text-obsidian"
                />
              </div>
              <Button type="submit" isLoading={uploadingRadioMusic} disabled={uploadingRadioMusic || !radioMusicFile}>
                <UploadCloud size={13} /> Adicionar MP3
              </Button>
            </form>
            <div className="space-y-2">
              {radioLibrary.length === 0 ? (
                <p className="rounded-sm border border-white/5 bg-obsidian/50 p-4 text-xs text-white/40">Não há MP3s na pasta musicas/ do servidor.</p>
              ) : radioLibrary.map((file: any) => (
                <div key={file.filePath} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/5 bg-obsidian/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{file.title}</p>
                    <p className="truncate text-[10px] text-white/40">{file.filePath}</p>
                  </div>
                  <audio
                    controls
                    preload="none"
                    crossOrigin="use-credentials"
                    src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')}/radio/library/stream?file=${encodeURIComponent(file.filePath)}`}
                    className="h-8 max-w-full"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleDeleteRadioMusic(file.filePath)}>
                    <Trash2 size={12} /> Excluir
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-royal-gold flex items-center gap-2">
            <Radio size={14} /> Pedidos de Música ({radioRequests.length})
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

                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/50" htmlFor={`radio-file-${track.id}`}>
                      MP3 que será vinculado à playlist e à rádio
                    </label>
                    <select
                      id={`radio-file-${track.id}`}
                      value={selectedRadioFiles[track.id] || ''}
                      onChange={(event) => setSelectedRadioFiles((current) => ({ ...current, [track.id]: event.target.value }))}
                      className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione um MP3 da pasta musicas/</option>
                      {radioLibrary.map((file: any) => (
                        <option key={file.filePath} value={file.filePath}>
                          {file.title} — {file.filePath}
                        </option>
                      ))}
                    </select>
                    {radioLibrary.length === 0 && (
                      <p className="text-[10px] text-amber-300">Nenhum MP3 encontrado. Adicione arquivos ao disco musicas/ do Render.</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      disabled={!selectedRadioFiles[track.id]}
                      onClick={() => handleUpdateRadioStatus(track.id, 'ADICIONADA_PLAYLIST', selectedRadioFiles[track.id])}
                    >
                      <CheckCircle2 size={12} /> Aceitar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateRadioStatus(track.id, 'RECUSADA')}>
                      <XCircle size={12} /> Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>
        </div>
      )}
    </div>
  );
}
