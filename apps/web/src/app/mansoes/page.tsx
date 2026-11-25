'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Shield, MapPin, Key, ArrowRight, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';

interface MansionItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  location?: string;
  typeLabel?: string;
  coverImage?: string;
  features?: string[];
  _count?: { media: number };
}

export default function MansoesPage() {
  const [mansions, setMansions] = useState<MansionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/gallery/mansions')
      .then((res) => setMansions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Não foi possível carregar o catálogo das mansões da API.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <Navbar />

      <div className="max-w-7xl mx-auto pt-20 pb-32 px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-royal-gold/5 border border-royal-gold/20 mb-6">
            <Home size={14} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
              Patrimônio & Galeria Institucional
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
            NOSSAS <br />
            <span className="text-royal-gold text-glow-gold italic font-serif">MANSÕES.</span>
          </h1>
          <div className="w-24 h-1 bg-royal-gold/30 mx-auto" />
        </div>

        {error && (
          <div className="mb-8 bg-red-500/5 border border-red-500/20 text-red-300 p-4 rounded-sm flex items-center gap-3 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : mansions.length === 0 ? (
          <div className="p-16 bg-graphite/40 border border-white/5 rounded-sm text-center text-white/40 text-sm">
            Nenhuma mansão cadastrada no banco de dados ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {mansions.map((mansao) => (
              <div key={mansao.id} className="card-premium group flex flex-col h-full">
                <div className="relative aspect-video bg-obsidian rounded-sm mb-8 overflow-hidden border border-white/5 group-hover:border-royal-gold/30 transition-all duration-500">
                  {mansao.coverImage ? (
                    <img
                      src={mansao.coverImage}
                      alt={mansao.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-2">
                      <Home size={56} className="text-royal-gold/30" />
                      <span className="text-[10px] uppercase tracking-widest text-white/30">
                        {mansao._count?.media || 0} mídias registradas
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-royal-gold text-obsidian text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm">
                      {mansao.typeLabel || 'MANSÃO'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-black/70 border border-white/10 rounded-sm text-[10px] text-white/70 inline-flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-royal-gold" />
                    {mansao._count?.media || 0} fotos/vídeos
                  </div>
                </div>

                <div className="flex-1">
                  {mansao.location && (
                    <div className="flex items-center gap-2 text-royal-gold/70 mb-2">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        {mansao.location}
                      </span>
                    </div>
                  )}
                  <h2 className="text-3xl font-bold text-white mb-4 tracking-tight group-hover:text-royal-gold transition-colors">
                    {mansao.name}
                  </h2>
                  <p className="text-white/50 text-base leading-relaxed mb-6">
                    {mansao.description}
                  </p>

                  {mansao.features && mansao.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {mansao.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-sm text-[11px] font-bold uppercase tracking-wider text-white/60"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-white/30">
                    <Shield size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Acesso Controlado
                    </span>
                  </div>
                  <Link
                    href={`/mansoes/${mansao.slug || mansao.id}`}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Key size={14} />
                    Explorar & Solicitar Chave
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
