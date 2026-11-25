'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import { formatDate } from '@/lib/utils';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = String(params?.id || '');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'SESSIONS' | 'MATERIALS' | 'STUDENTS'>('SESSIONS');

  // Proof submission modal
  const [proofSession, setProofSession] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofObs, setProofObs] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Teacher: create session modal
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', date: '', startTime: '' });

  // Teacher: add material modal
  const [newMatOpen, setNewMatOpen] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', url: '', type: 'LINK' as 'PDF' | 'LINK' | 'IMAGE' });

  // Teacher: reject proof modal
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const isTeacherOrAdmin =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadCourseData = async () => {
    try {
      const [cRes, sRes, stRes, compRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/academic/courses/${courseId}/sessions`),
        api.get(`/courses/${courseId}/students`),
        api.get(`/academic/courses/${courseId}/completions`),
      ]);
      setCourse(cRes.data);
      setSessions(Array.isArray(sRes.data) ? sRes.data : []);
      setStudents(Array.isArray(stRes.data) ? stRes.data : []);
      setCompletions(Array.isArray(compRes.data) ? compRes.data : []);
    } catch {
      showToast('Erro ao carregar detalhes do curso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) loadCourseData();
  }, [courseId]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofSession || !proofUrl.trim()) {
      showToast('Envie o arquivo do comprovante ou informe uma URL válida.', 'error');
      return;
    }
    setSubmittingProof(true);
    try {
      await api.post('/academic/proofs', {
        sessionId: proofSession.id,
        imageUrl: proofUrl.trim(),
        observation: proofObs,
      });
      setProofSession(null);
      setProofUrl('');
      setProofObs('');
      await loadCourseData();
      showToast('Comprovante enviado para validação!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao enviar comprovante.', 'error');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/academic/courses/${courseId}/sessions`, sessionForm);
      setNewSessionOpen(false);
      setSessionForm({ title: '', description: '', date: '', startTime: '' });
      await loadCourseData();
      showToast('Aula registrada com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao registrar aula.', 'error');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/academic/courses/${courseId}/materials`, matForm);
      setNewMatOpen(false);
      setMatForm({ title: '', url: '', type: 'LINK' });
      await loadCourseData();
      showToast('Material adicionado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao adicionar material.', 'error');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await api.delete(`/academic/materials/${materialId}`);
      await loadCourseData();
      showToast('Material removido.', 'info');
    } catch {
      showToast('Erro ao remover material.', 'error');
    }
  };

  const handleValidateProof = async (proofId: string, status: 'VALIDATED' | 'REJECTED', feedback?: string) => {
    try {
      await api.post(`/academic/proofs/${proofId}/validate`, { status, feedback });
      setRejectTarget(null);
      setRejectFeedback('');
      await loadCourseData();
      showToast(status === 'VALIDATED' ? 'Presença validada!' : 'Comprovante recusado.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao validar comprovante.', 'error');
    }
  };

  const handleCompleteStudent = async (profileId: string) => {
    try {
      await api.post(`/academic/courses/${courseId}/complete`, {
        profileId,
        status: 'APPROVED',
        emitMedal: true,
      });
      await loadCourseData();
      showToast('Conclusão oficial validada e medalha emitida!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Não foi possível validar conclusão.', 'error');
    }
  };

  if (loading) {
    return <div className="h-96 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />;
  }

  if (!course) {
    return (
      <div className="p-12 bg-graphite border border-white/5 rounded-sm text-center space-y-4">
        <p className="text-white/60">Curso não encontrado.</p>
        <Link href="/cursos" className="btn-primary inline-block">
          Voltar para Grade
        </Link>
      </div>
    );
  }

  const completionIds = new Set(completions.filter((c) => c.status === 'APPROVED').map((c) => c.profileId));

  return (
    <div className="space-y-8 pb-20">
      <Link
        href="/cursos"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-royal-gold"
      >
        <ArrowLeft size={14} /> Voltar à Grade Acadêmica
      </Link>

      {/* Course Header */}
      <section className="bg-graphite border border-white/5 p-8 rounded-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-royal-gold/10 border border-royal-gold/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-royal-gold">
              <BookOpen size={12} /> Disciplina Oficial
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{course.name}</h1>
            <p className="text-sm text-white/60 max-w-2xl">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-white/60 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <User size={14} className="text-royal-gold" /> Professor:{' '}
                <strong className="text-white">{course.teacher?.name || 'Alta Cúpula'}</strong>
              </span>
              {(course.schedules || []).map((s: any, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1.5 text-royal-gold">
                  <Clock size={14} /> {DAYS[s.dayOfWeek]} às {s.startTime}
                </span>
              ))}
            </div>
          </div>

          {course.medal && (
            <div className="bg-obsidian border border-royal-gold/30 p-5 rounded-sm max-w-xs space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-royal-gold flex items-center gap-1.5">
                <Award size={14} /> Medalha de Conclusão
              </p>
              <p className="text-sm font-bold text-white">{course.medal.name}</p>
              <p className="text-xs text-white/50">{course.medal.criteria || course.medal.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { key: 'SESSIONS', label: `Aulas & Presenças (${sessions.length})` },
          { key: 'MATERIALS', label: `Materiais (${course.materials?.length || 0})` },
          { key: 'STUDENTS', label: `Alunos & Conclusões (${students.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
              tab === t.key
                ? 'bg-royal-gold text-obsidian border-royal-gold'
                : 'bg-graphite text-white/60 border-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SESSIONS & PROOFS */}
      {tab === 'SESSIONS' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Registro de Aulas e Comprovantes</h2>
            {isTeacherOrAdmin && (
              <Button size="sm" onClick={() => setNewSessionOpen(true)}>
                <Plus size={14} /> Registrar Aula
              </Button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhuma aula registrada nesta disciplina ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const myProof = (session.proofs || []).find((p: any) => p.profileId === user?.profile?.id);
                return (
                  <div key={session.id} className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                          {formatDate(session.date)} {session.startTime ? `• ${session.startTime}` : ''} • {session.status}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{session.title}</h3>
                        {session.description && (
                          <p className="text-xs text-white/50 mt-1">{session.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {myProof && (
                          <span
                            className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${
                              myProof.status === 'VALIDATED'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : myProof.status === 'REJECTED'
                                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {myProof.status}
                          </span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setProofSession(session)}>
                          <Upload size={13} /> {myProof ? 'Atualizar Comprovante' : 'Enviar Comprovante'}
                        </Button>
                      </div>
                    </div>

                    {myProof?.feedback && (
                      <p className="text-xs text-red-300 bg-red-500/5 border border-red-500/20 p-3 rounded-sm">
                        Retorno da avaliação: {myProof.feedback}
                      </p>
                    )}

                    {/* Teacher Proof Review List */}
                    {isTeacherOrAdmin && session.proofs?.length > 0 && (
                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          Comprovantes Enviados ({session.proofs.length})
                        </p>
                        {session.proofs.map((proof: any) => (
                          <div
                            key={proof.id}
                            className="p-3 bg-obsidian border border-white/10 rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">
                                {proof.profile?.name} (#{proof.profile?.user?.passport})
                              </p>
                              <p className="text-white/50">{proof.observation || 'Sem observação'}</p>
                              <a
                                href={proof.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-royal-gold underline text-[11px]"
                              >
                                Visualizar Comprovante
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-white/50">
                                {proof.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleValidateProof(proof.id, 'VALIDATED')}
                                className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-sm inline-flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} /> Validar
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(proof)}
                                className="px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-sm inline-flex items-center gap-1"
                              >
                                <XCircle size={12} /> Recusar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MATERIALS */}
      {tab === 'MATERIALS' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Materiais de Estudo</h2>
            {isTeacherOrAdmin && (
              <Button size="sm" onClick={() => setNewMatOpen(true)}>
                <Plus size={14} /> Adicionar Material
              </Button>
            )}
          </div>
          {!course.materials?.length ? (
            <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhum material publicado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.materials.map((m: any) => (
                <div
                  key={m.id}
                  className="bg-graphite border border-white/5 p-5 rounded-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={20} className="text-royal-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.title}</p>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-royal-gold underline"
                      >
                        Abrir ({m.type})
                      </a>
                    </div>
                  </div>
                  {isTeacherOrAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="text-white/40 hover:text-red-400 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* STUDENTS & COMPLETIONS */}
      {tab === 'STUDENTS' && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-royal-gold" /> Alunos Matriculados
          </h2>
          {students.length === 0 ? (
            <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
              Nenhum aluno matriculado.
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((st: any) => {
                const completed = completionIds.has(st.profileId);
                return (
                  <div
                    key={st.id}
                    className="bg-graphite border border-white/5 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/membros/${st.profile.user.passport}`}
                        className="font-bold text-white hover:text-royal-gold text-sm"
                      >
                        {st.profile.name} (#{st.profile.user.passport})
                      </Link>
                      <RoleBadge role={st.profile.user.role} />
                      <span className="text-[10px] uppercase text-white/40">
                        {st.type === 'MAIN' ? 'Principal' : 'Secundário'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {completed ? (
                        <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase rounded-sm">
                          Concluído Oficialmente
                        </span>
                      ) : isTeacherOrAdmin ? (
                        <Button size="sm" onClick={() => handleCompleteStudent(st.profileId)}>
                          <Award size={12} /> Validar Conclusão & Medalha
                        </Button>
                      ) : (
                        <span className="text-[10px] text-white/40 uppercase">{st.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Proof Modal */}
      <Modal
        open={Boolean(proofSession)}
        onClose={() => setProofSession(null)}
        title={`Enviar Comprovante — ${proofSession?.title || ''}`}
      >
        <form onSubmit={handleSubmitProof} className="space-y-4">
          <FileUploadZone
            scope="proofs"
            allowPaste={true}
            label="Clique, arraste ou cole (Ctrl+V) a imagem do comprovante"
            currentUrl={proofUrl}
            onUploaded={(url) => setProofUrl(url)}
            onClear={() => setProofUrl('')}
          />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              URL da Imagem (se já hospedada / alternativa)
            </label>
            <input
              type="text"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... ou caminho retornado pelo upload"
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Observação
            </label>
            <textarea
              rows={3}
              value={proofObs}
              onChange={(e) => setProofObs(e.target.value)}
              placeholder="Detalhes sobre sua participação na aula..."
              className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setProofSession(null)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submittingProof}>
              Enviar Comprovante
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Session Modal */}
      <Modal
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        title="Registrar Nova Aula"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <input
            required
            placeholder="Título da aula"
            value={sessionForm.title}
            onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="datetime-local"
              value={sessionForm.date}
              onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="Horário (ex: 20:00)"
              value={sessionForm.startTime}
              onChange={(e) => setSessionForm((f) => ({ ...f, startTime: e.target.value }))}
              className="bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
            />
          </div>
          <textarea
            rows={3}
            placeholder="Descrição / pauta da aula"
            value={sessionForm.description}
            onChange={(e) => setSessionForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setNewSessionOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Aula</Button>
          </div>
        </form>
      </Modal>

      {/* Add Material Modal */}
      <Modal
        open={newMatOpen}
        onClose={() => setNewMatOpen(false)}
        title="Adicionar Material de Estudo"
      >
        <form onSubmit={handleAddMaterial} className="space-y-4">
          <input
            required
            placeholder="Título do material"
            value={matForm.title}
            onChange={(e) => setMatForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <select
            value={matForm.type}
            onChange={(e) => setMatForm((f) => ({ ...f, type: e.target.value as any }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          >
            <option value="LINK">Link</option>
            <option value="PDF">PDF</option>
            <option value="IMAGE">Imagem</option>
          </select>
          <FileUploadZone
            scope="materials"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            allowPaste={false}
            currentUrl={matForm.url}
            onUploaded={(url) => setMatForm((f) => ({ ...f, url }))}
          />
          <input
            required
            placeholder="URL do material"
            value={matForm.url}
            onChange={(e) => setMatForm((f) => ({ ...f, url: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setNewMatOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Material</Button>
          </div>
        </form>
      </Modal>

      {/* Reject Proof Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Recusar Comprovante"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/60">Informe o motivo da recusa para o aluno:</p>
          <textarea
            required
            rows={3}
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="Ex: Imagem ilegível ou data incompatível com a aula."
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleValidateProof(rejectTarget.id, 'REJECTED', rejectFeedback)}
              disabled={rejectFeedback.trim().length < 3}
            >
              Confirmar Recusa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
