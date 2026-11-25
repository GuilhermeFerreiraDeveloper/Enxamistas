'use client'

import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Send, Trash2, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

export default function LivroDeVisitasPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isMod =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/guestbook', { params: isMod ? { all: 'true' } : {} });
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível carregar o livro de visitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isMod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/guestbook', {
        content,
        authorName: user ? undefined : authorName,
      });
      setContent('');
      setAuthorName('');
      await load();
      showToast('Assinatura registrada no livro de visitas!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao assinar livro.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async (id: string, isHidden: boolean) => {
    await api.put(`/guestbook/${id}/moderate`, { isHidden: !isHidden });
    await load();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/guestbook/${id}`);
    await load();
  };

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-14 space-y-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
            <BookOpenCheck size={12} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
              Registros da Comunidade
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">Livro de Visitas</h1>
          <p className="text-sm text-white/50">
            Deixe sua mensagem oficial para os arquivos da organização (máximo 400 caracteres).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-graphite border border-white/5 p-6 rounded-sm space-y-4">
          {!user && (
            <input
              required
              minLength={2}
              maxLength={60}
              placeholder="Seu nome / assinatura"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
            />
          )}
          <textarea
            required
            minLength={3}
            maxLength={400}
            rows={3}
            placeholder="Escreva sua mensagem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40">{content.length} / 400</span>
            <Button type="submit" isLoading={submitting}>
              <Send size={13} /> Assinar Livro
            </Button>
          </div>
        </form>

        {error ? (
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-sm text-xs text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="h-40 bg-graphite/50 rounded-sm animate-pulse" />
        ) : entries.length === 0 ? (
          <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
            Nenhuma assinatura registrada ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-5 rounded-sm border ${
                  entry.isHidden ? 'bg-obsidian/40 border-red-500/20 opacity-60' : 'bg-graphite border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-royal-gold">{entry.authorName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/40">{formatDate(entry.createdAt)}</span>
                    {isMod && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleHide(entry.id, entry.isHidden)}
                          className="text-white/40 hover:text-amber-400"
                          title="Ocultar/Exibir"
                        >
                          <EyeOff size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-white/40 hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-white/80">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
