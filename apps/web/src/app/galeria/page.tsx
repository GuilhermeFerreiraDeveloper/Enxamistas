'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Heart, ImagePlus, Trash2, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

function getGalleryImageUrl(imagePath: string) {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
  return `${apiBase}/${imagePath.replace(/^\/+/, '')}`;
}

interface GalleryPhoto {
  id: string;
  image: string;
  caption: string | null;
  authorId: string;
  author: { name: string; avatar: string | null };
  createdAt: string;
  isMine: boolean;
}

export default function GalleryPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPhotos = useCallback(async (requestedPage = 1, append = false) => {
    setError('');
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const response = await api.get('/feed/gallery', { params: { page: requestedPage } });
      const loadedPhotos = response.data.items.map((photo: GalleryPhoto) => ({
        ...photo,
        image: getGalleryImageUrl(photo.image),
      }));
      setPhotos((current) => append ? [...current, ...loadedPhotos] : loadedPhotos);
      setPage(response.data.page);
      setTotal(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Não foi possível carregar a galeria. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const publishPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageUrl || posting) return;

    setPosting(true);
    setError('');
    setNotice('');
    try {
      await api.post('/feed/gallery', { imageUrl, caption });
      setImageUrl('');
      setCaption('');
      setNotice('Sua foto agora faz parte do favo da Colmeia.');
      await loadPhotos(1);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Não foi possível publicar sua foto.');
    } finally {
      setPosting(false);
    }
  };

  const removePhoto = async (photo: GalleryPhoto) => {
    if (!window.confirm('Remover esta foto da galeria?')) return;
    setError('');
    try {
      await api.delete(`/feed/gallery/${photo.id}`);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setTotal((current) => Math.max(0, current - 1));
      if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || 'Não foi possível remover a foto.');
    }
  };

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />
      <section className="relative overflow-hidden px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 honeycomb-overlay opacity-30" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 honeycomb-glow" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-royal-gold/25 bg-royal-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
              <Camera size={14} /> Memórias da comunidade
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Galeria <span className="text-royal-gold">da Colmeia</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              Cada imagem é uma história. Compartilhe seus momentos e ajude nosso favo a crescer.
            </p>
          </div>

          {user ? (
            <form onSubmit={publishPhoto} className="mx-auto mb-14 grid max-w-4xl gap-5 rounded-sm border border-royal-gold/20 bg-graphite/80 p-5 shadow-premium sm:p-7 md:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                  <ImagePlus size={17} className="text-royal-gold" /> Adicione sua memória
                </h2>
                <p className="mb-4 text-xs text-white/45">A imagem será publicada para todos os membros.</p>
                <FileUploadZone
                  scope="gallery"
                  label="Escolha uma foto (JPEG, PNG ou WebP)"
                  onUploaded={setImageUrl}
                  onClear={() => setImageUrl('')}
                />
                {imageUrl && <p className="mt-2 text-xs text-emerald-300">Imagem enviada e pronta para publicar.</p>}
              </div>
              <div className="flex flex-col">
                <label htmlFor="gallery-caption" className="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">
                  Legenda <span className="font-normal normal-case text-white/40">(opcional)</span>
                </label>
                <textarea
                  id="gallery-caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={300}
                  rows={5}
                  placeholder="Conte um pouco sobre este momento..."
                  className="min-h-32 flex-1 resize-y rounded-sm border border-white/10 bg-obsidian/70 p-3 text-sm text-white outline-none transition focus:border-royal-gold/60"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/40">{caption.length}/300</span>
                  <button type="submit" disabled={!imageUrl || posting} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <Heart size={14} /> {posting ? 'Publicando...' : 'Publicar foto'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mx-auto mb-14 flex max-w-4xl flex-col items-center justify-between gap-4 border border-royal-gold/20 bg-graphite/80 p-5 sm:flex-row sm:p-7">
              <div>
                <h2 className="font-bold text-white">Faça parte das memórias</h2>
                <p className="mt-1 text-sm text-white/50">Entre na sua conta para compartilhar uma foto com a comunidade.</p>
              </div>
              <Link href="/login" className="btn-primary whitespace-nowrap">Acessar conta</Link>
            </div>
          )}

          {error && <div role="alert" className="mx-auto mb-6 max-w-4xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="mx-auto mb-6 max-w-4xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

          <div className="mb-6 flex items-end justify-between border-b border-royal-gold/15 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-royal-gold">O favo de todos</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Momentos compartilhados</h2>
            </div>
            {!loading && <span className="text-xs text-white/40">{total} {total === 1 ? 'foto' : 'fotos'}</span>}
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-white/45">Carregando as memórias da Colmeia...</div>
          ) : photos.length === 0 ? (
            <div className="rounded-sm border border-dashed border-royal-gold/25 bg-graphite/40 px-6 py-16 text-center">
              <Camera className="mx-auto mb-4 text-royal-gold/70" size={32} />
              <h3 className="font-bold text-white">O primeiro hexágono está esperando</h3>
              <p className="mt-2 text-sm text-white/45">Ainda não há fotos. Seja o primeiro a compartilhar uma memória.</p>
            </div>
          ) : (
            <div className="hive-gallery-grid">
              {photos.map((photo) => (
                <article key={photo.id} className="hive-gallery-cell group">
                  <button type="button" className="hive-gallery-photo" onClick={() => setSelectedPhoto(photo)} aria-label={`Ampliar foto de ${photo.author.name}`}>
                    <img src={photo.image} alt={photo.caption || `Foto compartilhada por ${photo.author.name}`} loading="lazy" />
                    <span className="hive-gallery-shade" />
                    <span className="hive-gallery-caption">
                      <span className="block text-xs font-bold text-white">{photo.author.name}</span>
                      {photo.caption && <span className="mt-1 block line-clamp-2 text-[11px] text-white/75">{photo.caption}</span>}
                    </span>
                  </button>
                  {photo.isMine && (
                    <button type="button" onClick={() => void removePhoto(photo)} className="hive-gallery-delete" aria-label="Remover minha foto" title="Remover foto">
                      <Trash2 size={14} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          {!loading && hasMore && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => void loadPhotos(page + 1, true)} disabled={loadingMore} className="rounded-sm border border-royal-gold/35 px-6 py-3 text-xs font-bold uppercase tracking-widest text-royal-gold transition hover:bg-royal-gold/10 disabled:opacity-50">
                {loadingMore ? 'Carregando...' : 'Carregar mais memórias'}
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setSelectedPhoto(null)}>
          <button type="button" onClick={() => setSelectedPhoto(null)} aria-label="Fechar foto" className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 p-3 text-white hover:bg-white/10">
            <X size={20} />
          </button>
          <div className="max-h-[90vh] max-w-5xl text-center" onClick={(event) => event.stopPropagation()}>
            <img src={selectedPhoto.image} alt={selectedPhoto.caption || `Foto de ${selectedPhoto.author.name}`} className="mx-auto max-h-[78vh] max-w-full rounded-sm object-contain" />
            <p className="mt-4 text-sm font-semibold text-white">{selectedPhoto.author.name}</p>
            {selectedPhoto.caption && <p className="mt-1 text-sm text-white/65">{selectedPhoto.caption}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
