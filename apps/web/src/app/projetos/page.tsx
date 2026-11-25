'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, Search, ExternalLink, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function ProjetosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Tecnologia',
    link: '',
    imageUrl: '',
  });

  const isLeader =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects', {
        params: { q: q || undefined, category: category || undefined },
      });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Erro ao carregar projetos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadProjects, 250);
    return () => clearTimeout(t);
  }, [q, category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', form);
      setModalOpen(false);
      setForm({ title: '', description: '', category: 'Tecnologia', link: '', imageUrl: '' });
      await loadProjects();
      showToast('Projeto publicado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao publicar projeto.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      await loadProjects();
      showToast('Projeto removido.', 'info');
    } catch {
      showToast('Sem permissão para remover este projeto.', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
              <FolderKanban size={12} className="text-royal-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
                Iniciativas dos Membros
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Projetos</h1>
          </div>

          {user && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Novo Projeto
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-graphite border border-white/10 rounded-sm pl-10 pr-4 py-2.5 text-xs text-white"
            />
          </div>
          <input
            type="text"
            placeholder="Filtrar categoria..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="sm:w-64 bg-graphite border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-graphite/50 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
            Nenhum projeto cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-graphite border border-white/5 hover:border-royal-gold/30 p-6 rounded-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                      {p.category} • {p.status}
                    </span>
                    {(user?.profile?.id === p.authorId || isLeader) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-white/40 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <Link href={`/projetos/${p.id}`} className="text-xl font-bold text-white hover:text-royal-gold block">
                    {p.title}
                  </Link>
                  <p className="text-xs text-white/60 line-clamp-3">{p.description}</p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                  <span>
                    {p.author?.name} • {formatDate(p.createdAt)}
                  </span>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-royal-gold hover:underline inline-flex items-center gap-1"
                    >
                      Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publicar Projeto">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            required
            minLength={3}
            placeholder="Título do projeto"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
          />
          <input
            required
            placeholder="Categoria"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <textarea
            required
            minLength={10}
            rows={4}
            placeholder="Descrição do projeto"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-xs text-white"
          />
          <input
            type="url"
            placeholder="Link externo (opcional)"
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Publicar</Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
