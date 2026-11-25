'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="min-h-screen bg-obsidian text-ivory">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
        <Link
          href="/projetos"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-royal-gold"
        >
          <ArrowLeft size={14} /> Voltar aos Projetos
        </Link>

        {loading ? (
          <div className="h-64 bg-graphite/50 rounded-sm animate-pulse" />
        ) : !project ? (
          <div className="p-12 bg-graphite border border-white/5 rounded-sm text-center text-white/50">
            Projeto não encontrado.
          </div>
        ) : (
          <article className="bg-graphite border border-white/5 p-8 rounded-sm space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
              {project.category} • {project.status}
            </span>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <p className="text-xs text-white/50">
              Autor: {project.author?.name} • Publicado em {formatDate(project.createdAt)}
            </p>
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                Acessar Projeto <ExternalLink size={14} />
              </a>
            )}
          </article>
        )}
      </div>
    </main>
  );
}
