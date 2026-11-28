'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import {
  Heart,
  MessageSquare,
  Image as ImageIcon,
  User,
  AlertCircle,
  Shield,
  Clock,
  Trash2,
  Edit3,
  Send,
  CornerDownRight,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

interface CommentNode {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    user?: { passport: string; role: string };
  };
  createdAt: string;
  _count?: { likes: number };
  likedByMe?: boolean;
  replies?: CommentNode[];
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    user?: { passport: string; role: string };
  };
  media: { url: string; type: string }[];
  _count: { likes: number; comments: number };
  likedByMe?: boolean;
  comments?: CommentNode[];
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaBox, setShowMediaBox] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');

  const [reportTarget, setReportTarget] = useState<{ postId?: string; commentId?: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);

  const isModerator =
    (RoleHierarchy[(user?.role || 'CONVIDADO') as UserRole] ?? 0) >=
    RoleHierarchy[UserRole.ABELHA_PRINCESA];

  const fetchPosts = async (targetPage = 1, append = false) => {
    try {
      const response = await api.get('/feed', { params: { page: targetPage, limit: 10 } });
      const items = response.data?.items || [];
      setPosts((prev) => (append ? [...prev, ...items] : items));
      setPage(response.data?.page || targetPage);
      setTotalPages(response.data?.totalPages || 1);
    } catch {
      showToast('Erro ao carregar o feed da colmeia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/feed', {
        content,
        media: mediaUrl.trim() ? [{ url: mediaUrl.trim(), type: 'IMAGE' }] : undefined,
      });
      setContent('');
      setMediaUrl('');
      setShowMediaBox(false);
      await fetchPosts(1, false);
      showToast('Publicação enviada!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao publicar.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (post: Post) => {
    try {
      const res = post.likedByMe
        ? await api.delete(`/feed/${post.id}/like`)
        : await api.post(`/feed/${post.id}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: res.data.likedByMe, _count: { ...p._count, likes: res.data.likes } }
            : p
        )
      );
    } catch {
      showToast('Não foi possível atualizar curtida.', 'error');
    }
  };

  const handleSaveEditPost = async (postId: string) => {
    try {
      await api.put(`/feed/${postId}`, { content: editingPostContent });
      setEditingPostId(null);
      await fetchPosts(1, false);
      showToast('Publicação atualizada!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao editar post.', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/feed/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Publicação removida.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Sem permissão para excluir.', 'error');
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentText[postId] || '').trim();
    if (!text) return;
    try {
      await api.post(`/feed/${postId}/comments`, {
        content: text,
        parentId: replyingTo[postId] || undefined,
      });
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
      await fetchPosts(page, false);
      showToast('Comentário publicado!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao comentar.', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/feed/comments/${commentId}`);
      await fetchPosts(page, false);
      showToast('Comentário removido.', 'info');
    } catch {
      showToast('Erro ao remover comentário.', 'error');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    setReporting(true);
    try {
      await api.post('/feed/report', {
        contentType: reportTarget.commentId ? 'COMMENT' : 'POST',
        postId: reportTarget.postId,
        commentId: reportTarget.commentId,
        reason: reportReason,
        description: reportDescription,
      });
      setReportTarget(null);
      setReportReason('');
      setReportDescription('');
      showToast('Denúncia registrada e encaminhada à moderação.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao enviar denúncia.', 'error');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
          <Shield size={12} className="text-royal-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
            Comunicações Privadas
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight uppercase">Feed da Colmeia</h1>
        <p className="text-white/50 text-sm">
          Compartilhe atualizações, imagens e interaja com membros autenticados.
        </p>
      </div>

      {/* Create Post */}
      <div className="bg-graphite border border-white/5 p-6 rounded-sm shadow-premium">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-sm bg-obsidian border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.profile?.avatar ? (
                <img src={resolveMediaUrl(user.profile.avatar)} alt={user.profile.name} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-royal-gold/50" />
              )}
            </div>
            <textarea
              placeholder="O que está acontecendo na colmeia?"
              className="flex-1 bg-obsidian/50 border border-white/10 rounded-sm p-3 text-white placeholder:text-white/25 resize-none min-h-[100px] text-sm focus:outline-none focus:border-royal-gold/40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {showMediaBox && (
            <div className="p-4 bg-obsidian/70 border border-white/10 rounded-sm space-y-3">
              <FileUploadZone
                scope="feed"
                allowPaste={false}
                currentUrl={mediaUrl}
                onUploaded={(url) => setMediaUrl(url)}
                onClear={() => setMediaUrl('')}
              />
              <input
                type="url"
                placeholder="Ou cole uma URL de imagem (https://...)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-graphite border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowMediaBox((v) => !v)}
              className="text-white/50 hover:text-royal-gold transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <ImageIcon size={16} />
              <span>{showMediaBox ? 'Ocultar Mídia' : 'Anexar Imagem'}</span>
            </button>
            <Button type="submit" disabled={!content.trim()} isLoading={submitting}>
              Publicar Agora
            </Button>
          </div>
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-graphite/50 border border-white/5 p-8 rounded-sm animate-pulse h-52" />
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-graphite/30 border border-white/5 rounded-sm">
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
              Nenhuma publicação compartilhada ainda.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const isAuthor = user?.profile?.id === post.authorId;
            const commentsOpen = Boolean(openComments[post.id]);
            return (
              <div
                key={post.id}
                className="bg-graphite border border-white/5 p-6 rounded-sm space-y-5 shadow-premium"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-sm bg-obsidian border border-white/10 flex items-center justify-center overflow-hidden">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={
                            post.author.user?.passport
                              ? `/membros/${post.author.user.passport}`
                              : '/membros'
                          }
                          className="font-bold text-white hover:text-royal-gold text-sm"
                        >
                          {post.author.name}
                        </Link>
                        {post.author.user?.role && <RoleBadge role={post.author.user.role} />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                        <Clock size={10} />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditingPostContent(post.content);
                        }}
                        className="p-1.5 text-white/40 hover:text-royal-gold"
                        title="Editar publicação"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                    {(isAuthor || isModerator) && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-white/40 hover:text-red-400"
                        title="Excluir publicação"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReportTarget({ postId: post.id })}
                      className="p-1.5 text-white/30 hover:text-amber-400"
                      title="Denunciar publicação"
                    >
                      <AlertCircle size={15} />
                    </button>
                  </div>
                </div>

                {editingPostId === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={editingPostContent}
                      onChange={(e) => setEditingPostContent(e.target.value)}
                      className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPostId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEditPost(post.id)}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>
                )}

                {post.media.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {post.media.map((m, i) => (
                      <img
                        key={i}
                        src={m.url}
                        alt="Mídia da publicação"
                        className="w-full max-h-96 object-cover rounded-sm border border-white/10 bg-obsidian"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post)}
                    className={cn(
                      'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors',
                      post.likedByMe ? 'text-red-400' : 'text-white/40 hover:text-red-400'
                    )}
                  >
                    <Heart size={16} className={post.likedByMe ? 'fill-red-400' : ''} />
                    <span>{post._count.likes} Curtidas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-royal-gold transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>{post._count.comments} Comentários</span>
                  </button>
                </div>

                {/* Comments Drawer */}
                {commentsOpen && (
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="space-y-3">
                      {(post.comments || []).map((c) => {
                        const isCommentAuthor = user?.profile?.id === c.authorId;
                        return (
                          <div key={c.id} className="bg-obsidian/60 border border-white/5 p-3 rounded-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{c.author.name}</span>
                                <span className="text-[10px] text-white/30">
                                  {formatDate(c.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyingTo((prev) => ({ ...prev, [post.id]: c.id }))
                                  }
                                  className="text-[10px] text-royal-gold hover:underline"
                                >
                                  Responder
                                </button>
                                {(isCommentAuthor || isModerator) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="text-white/40 hover:text-red-400"
                                    title="Excluir comentário"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setReportTarget({ postId: post.id, commentId: c.id })}
                                  className="text-white/30 hover:text-amber-400"
                                  title="Denunciar comentário"
                                >
                                  <AlertCircle size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-white/75">{c.content}</p>

                            {c.replies && c.replies.length > 0 && (
                              <div className="pl-4 border-l border-royal-gold/30 space-y-2 mt-2">
                                {c.replies.map((r) => (
                                  <div key={r.id} className="text-xs bg-graphite/60 p-2 rounded-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white inline-flex items-center gap-1">
                                        <CornerDownRight size={10} className="text-royal-gold" />
                                        {r.author.name}
                                      </span>
                                      {(user?.profile?.id === r.authorId || isModerator) && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteComment(r.id)}
                                          className="text-white/40 hover:text-red-400"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-white/70 mt-1">{r.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {replyingTo[post.id] && (
                      <div className="text-[11px] text-royal-gold flex items-center justify-between bg-royal-gold/10 px-3 py-1.5 rounded-sm">
                        <span>Respondendo a um comentário</span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                          className="underline"
                        >
                          Cancelar resposta
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={commentText[post.id] || ''}
                        onChange={(e) =>
                          setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        className="flex-1 bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                      />
                      <Button size="sm" onClick={() => handleAddComment(post.id)}>
                        <Send size={13} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {page < totalPages && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={() => fetchPosts(page + 1, true)}>
              Carregar Mais Publicações
            </Button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title="Denunciar Conteúdo"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Motivo da Denúncia
            </label>
            <input
              required
              minLength={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Ex: Quebra de conduta, spam, conteúdo impróprio..."
              className="w-full bg-obsidian border border-white/10 rounded-sm px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Detalhes Adicionais (Opcional)
            </label>
            <textarea
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setReportTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={reporting}>
              Enviar Denúncia
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
