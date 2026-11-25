'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Key,
  MapPin,
  Video,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface AlbumMedia {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  title?: string;
  description?: string;
  environmentCategory?: string;
}

interface MansionDetail {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  location?: string;
  typeLabel?: string;
  coverImage?: string;
  tourVideoUrl?: string;
  features?: string[];
  media: AlbumMedia[];
}

export default function MansionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const slug = String(params?.slug || '');

  const [mansion, setMansion] = useState<MansionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnv, setSelectedEnv] = useState<string>('ALL');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submittingKey, setSubmittingKey] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/gallery/mansions/${slug}`)
      .then((res) => setMansion(res.data))
      .catch(() => setMansion(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/gallery/mansions/key-requests/my')
      .then((res) => setMyRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user]);

  const categories = mansion
    ? Array.from(new Set(mansion.media.map((m) => m.environmentCategory || 'Geral')))
    : [];

  const visibleMedia = mansion
    ? selectedEnv === 'ALL'
      ? mansion.media
      : mansion.media.filter((m) => (m.environmentCategory || 'Geral') === selectedEnv)
    : [];

  const photosOnly = visibleMedia.filter((m) => m.type === 'IMAGE');

  const handleRequestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Faça login para solicitar acesso à mansão.', 'info');
      router.push('/login');
      return;
    }
    if (!mansion) return;
    setSubmittingKey(true);
    try {
      const res = await api.post(`/gallery/mansions/${mansion.id}/key-request`, { reason });
      setMyRequests((prev) => [res.data, ...prev]);
      setKeyModalOpen(false);
      setReason('');
      showToast('Solicitação de chave enviada à liderança!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao enviar solicitação de chave.', 'error');
    } finally {
      setSubmittingKey(false);
    }
  };

  const existingRequest = mansion
    ? myRequests.find((r) => r.albumId === mansion.id)
    : undefined;

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <Link
          href="/mansoes"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-royal-gold"
        >
          <ArrowLeft size={14} /> Voltar às Mansões
        </Link>

        {loading ? (
          <div className="h-80 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
        ) : !mansion ? (
          <div className="p-16 bg-graphite border border-white/5 rounded-sm text-center space-y-4">
            <p className="text-white/60">Mansão não encontrada.</p>
            <Link href="/mansoes" className="btn-primary inline-block">
              Voltar
            </Link>
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-graphite border border-white/5 p-8 rounded-sm">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-royal-gold text-obsidian text-[10px] font-bold uppercase tracking-widest rounded-sm">
                    {mansion.typeLabel || 'PATRIMÔNIO'}
                  </span>
                  {mansion.location && (
                    <span className="text-xs text-royal-gold inline-flex items-center gap-1.5">
                      <MapPin size={14} /> {mansion.location}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">{mansion.name}</h1>
                <p className="text-white/60 leading-relaxed">{mansion.description}</p>
                {mansion.features && mansion.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {mansion.features.map((f) => (
                      <span
                        key={f}
                        className="px-3 py-1.5 bg-obsidian border border-white/10 rounded-sm text-xs text-white/70"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-obsidian border border-white/10 p-6 rounded-sm flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold mb-2">
                    Acesso & Chave Institucional
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Solicite autorização de acesso ou chave de entrada. Sua solicitação será analisada
                    pela liderança.
                  </p>
                </div>

                {existingRequest ? (
                  <div className="p-4 bg-graphite border border-royal-gold/30 rounded-sm space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-royal-gold flex items-center gap-1.5">
                      {existingRequest.status === 'APPROVED' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                      Status da sua solicitação: {existingRequest.status}
                    </p>
                    {existingRequest.responseNote && (
                      <p className="text-xs text-white/60">{existingRequest.responseNote}</p>
                    )}
                  </div>
                ) : null}

                <Button
                  onClick={() => {
                    if (!user) {
                      showToast('Entre na sua conta para solicitar a chave.', 'info');
                      router.push('/login');
                      return;
                    }
                    setKeyModalOpen(true);
                  }}
                  className="w-full"
                >
                  <Key size={14} /> Solicitar Chave
                </Button>
              </div>
            </section>

            {/* Video / Tour Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Video size={20} className="text-royal-gold" />
                Tour & Apresentação em Vídeo
              </h2>
              {mansion.tourVideoUrl ? (
                <div className="aspect-video w-full bg-black border border-white/10 rounded-sm overflow-hidden">
                  {mansion.tourVideoUrl.includes('youtube.com') ||
                  mansion.tourVideoUrl.includes('youtu.be') ||
                  mansion.tourVideoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={mansion.tourVideoUrl}
                      title={`Tour ${mansion.name}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={mansion.tourVideoUrl} controls className="w-full h-full object-contain" />
                  )}
                </div>
              ) : (
                <div className="p-8 bg-graphite/50 border border-white/5 rounded-sm text-sm text-white/50">
                  Nenhum vídeo de tour cadastrado para esta mansão ainda. Administradores podem
                  vincular o vídeo pelo Painel Administrativo.
                </div>
              )}
            </section>

            {/* Photo Gallery by Environment Category */}
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <ImageIcon size={20} className="text-royal-gold" />
                  Galeria de Ambientes
                </h2>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEnv('ALL')}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
                        selectedEnv === 'ALL'
                          ? 'bg-royal-gold text-obsidian border-royal-gold'
                          : 'bg-graphite text-white/60 border-white/10'
                      }`}
                    >
                      Todos
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedEnv(cat)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
                          selectedEnv === cat
                            ? 'bg-royal-gold text-obsidian border-royal-gold'
                            : 'bg-graphite text-white/60 border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {photosOnly.length === 0 ? (
                <div className="p-10 bg-graphite/40 border border-white/5 rounded-sm text-center text-sm text-white/40">
                  Nenhuma foto registrada neste álbum ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photosOnly.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLightboxIdx(idx)}
                      className="group text-left bg-graphite border border-white/5 hover:border-royal-gold/40 rounded-sm overflow-hidden transition-all"
                    >
                      <div className="aspect-video bg-obsidian overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.title || mansion.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                          {item.environmentCategory || 'Ambiente'}
                        </span>
                        {item.title && <p className="text-sm font-bold text-white mt-1">{item.title}</p>}
                        {item.description && (
                          <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && photosOnly[lightboxIdx] && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
            aria-label="Fechar galeria"
          >
            <X size={28} />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIdx((lightboxIdx - 1 + photosOnly.length) % photosOnly.length)
            }
            className="p-3 text-white/70 hover:text-royal-gold"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={32} />
          </button>
          <div className="max-w-4xl w-full text-center space-y-3">
            <img
              src={photosOnly[lightboxIdx].url}
              alt={photosOnly[lightboxIdx].title || 'Foto'}
              className="max-h-[75vh] mx-auto rounded-sm border border-white/10 object-contain"
            />
            <p className="text-sm font-bold text-white">{photosOnly[lightboxIdx].title}</p>
            <p className="text-xs text-white/50">{photosOnly[lightboxIdx].description}</p>
          </div>
          <button
            type="button"
            onClick={() => setLightboxIdx((lightboxIdx + 1) % photosOnly.length)}
            className="p-3 text-white/70 hover:text-royal-gold"
            aria-label="Próxima foto"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

      {/* Key Request Modal */}
      <Modal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title={`Solicitar Chave — ${mansion?.name || ''}`}
      >
        <form onSubmit={handleRequestKey} className="space-y-4">
          <p className="text-xs text-white/60 leading-relaxed">
            Descreva o motivo ou finalidade de acesso à mansão. A liderança receberá sua
            solicitação e enviará uma notificação com a decisão.
          </p>
          <textarea
            required
            minLength={5}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Reunião de curso, treinamento tático ou evento autorizado..."
            className="w-full bg-obsidian border border-white/10 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-royal-gold/40"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setKeyModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submittingKey}>
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
