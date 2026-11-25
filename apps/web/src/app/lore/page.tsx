'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scroll, Shield, Feather, Compass, Flame, Crown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';

export default function LorePage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get('/institutional/public')
      .then((res) => setSettings(res.data?.settings || {}))
      .catch(() => {});
  }, []);

  const originText =
    settings.lore_origin ||
    'Nascida nas sombras e forjada na união, a organização Enxamistas surgiu como um refúgio para aqueles que buscavam excelência e lealdade absoluta no universo RP. Inspirados pela estrutura perfeita de uma colmeia, cada membro desempenha um papel vital para o sucesso coletivo.';

  const philosophyText =
    settings.lore_philosophy ||
    'Acreditamos que o conhecimento é a arma mais poderosa. Através da nossa fundação acadêmica, cultivamos não apenas habilidades técnicas, mas uma cultura de respeito, mistério e elegância estratégica.';

  const cultureText =
    settings.lore_culture ||
    'Nossa cultura valoriza o silêncio cirúrgico, a etiqueta impecável, o estudo contínuo e a proteção mútua entre os membros da colmeia.';

  const objectivesText =
    settings.lore_objectives ||
    'Formar especialistas multidisciplinares, consolidar influência institucional legítima, preservar nossas tradições e elevar cada integrante do estágio de Convidado e Kakuna até os mais altos graus da colmeia.';

  return (
    <main className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <Navbar />

      <div className="max-w-4xl mx-auto pt-20 pb-32 px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-royal-gold/5 border border-royal-gold/20 mb-8">
            <Scroll size={14} className="text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
              História & Doutrina
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
            TRADIÇÃO E <br />
            <span className="text-royal-gold text-glow-gold italic font-serif">LEALDADE.</span>
          </h1>
          <div className="w-24 h-1 bg-royal-gold/30 mx-auto" />
        </div>

        <div className="space-y-12">
          <section className="card-premium border-l-4 border-l-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Shield className="text-royal-gold" size={22} />
              01. A Origem
            </h2>
            <p className="text-white/60 text-base leading-relaxed">{originText}</p>
          </section>

          <section className="card-premium border-r-4 border-r-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Feather className="text-royal-gold" size={22} />
              02. Filosofia
            </h2>
            <p className="text-white/60 text-base leading-relaxed">{philosophyText}</p>
          </section>

          <section className="card-premium border-l-4 border-l-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Flame className="text-royal-gold" size={22} />
              03. Cultura & Tradições
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-4">{cultureText}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-royal-gold/80">
              <li className="p-3 bg-obsidian/60 border border-white/5 rounded-sm">• Cerimônias de Ascensão</li>
              <li className="p-3 bg-obsidian/60 border border-white/5 rounded-sm">• Mérito Acadêmico e Medalhas</li>
              <li className="p-3 bg-obsidian/60 border border-white/5 rounded-sm">• Conselhos na Mansão Real</li>
              <li className="p-3 bg-obsidian/60 border border-white/5 rounded-sm">• Reconhecimento Enxamista do Mês</li>
            </ul>
          </section>

          <section className="card-premium border-r-4 border-r-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Compass className="text-royal-gold" size={22} />
              04. Objetivos & Evolução
            </h2>
            <p className="text-white/60 text-base leading-relaxed mb-6">{objectivesText}</p>
            <div className="p-4 bg-obsidian/70 border border-white/5 rounded-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold mb-2 flex items-center gap-2">
                <Crown size={14} /> Linha Evolutiva da Colmeia
              </p>
              <p className="text-xs text-white/50 leading-relaxed">
                Convidados → Kakunas (Novatos) → Abelhas Operárias → Abelha Conselheira Real →
                Abelha Patrono → Abelha Princesa → Abelha Rainha • Staff Zangão.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <div className="p-10 bg-white/5 rounded-sm border border-white/5 flex flex-col items-center text-center">
              <h3 className="text-royal-gold font-bold tracking-[0.3em] uppercase mb-6">
                Valores Fundamentais
              </h3>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                <li>• Lealdade Absoluta</li>
                <li>• Excelência Técnica</li>
                <li>• Discrição Estratégica</li>
                <li>• Respeito à Hierarquia</li>
              </ul>
            </div>
            <div className="p-10 bg-royal-gold/5 rounded-sm border border-royal-gold/20 flex flex-col items-center text-center justify-center">
              <p className="text-white/70 italic font-serif text-xl mb-6 leading-relaxed">
                &ldquo;Uma abelha sozinha é frágil. A colmeia é uma fortaleza inexpugnável.&rdquo;
              </p>
              <div className="w-12 h-0.5 bg-royal-gold" />
            </div>
          </section>
        </div>

        <div className="mt-20 text-center">
          <Link href="/cadastro" className="btn-primary px-12 py-5 text-sm inline-block">
            SOLICITAR INGRESSO NA COLMEIA
          </Link>
        </div>
      </div>
    </main>
  );
}
