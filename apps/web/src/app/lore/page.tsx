'use client'

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Shield, Feather, Compass, Flame, Crown, ScrollText, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BeeIcon, HoneycombCrest } from '@/components/ui/BeeEmblem';
import api from '@/lib/api';
import { FRATERNITY_RULES } from '@enxamistas/shared';

export default function LorePage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [ruleFilter, setRuleFilter] = useState('');

  useEffect(() => {
    api
      .get('/institutional/public')
      .then((res) => setSettings(res.data?.settings || {}))
      .catch(() => {});
  }, []);

  const originText =
    settings.lore_origin ||
    'A história começa em uma época em que a cidade de Roxwood estava em pleno crescimento e precisava de uma comunidade que valorizasse a diversidade e a comunicação. Foi então que um grupo de visionários decidiu criar uma fraternidade que se inspirasse nas abelhas, essas criaturas incríveis que trabalham juntas para criar algo incrível.';

  const philosophyText =
    settings.lore_philosophy ||
    'Erasmos, o fundador, era um apaixonado por natureza e comunicação. Ele viu nas abelhas um exemplo de como a união e a cooperação podem levar a grandes conquistas. Assim, os Enxamistas nasceram com o objetivo de ser uma colmeia de ideias, onde cada membro pudesse contribuir com suas habilidades e perspectivas únicas.';

  const cultureText =
    settings.lore_culture ||
    'A fraternidade cresceu rapidamente, atraindo pessoas de diferentes origens e interesses. Juntos, eles trabalhavam em projetos que beneficiavam a comunidade, sempre com um foco em comunicação eficaz e respeito mútuo. Os Enxamistas se tornaram conhecidos por sua diversidade e capacidade de trabalhar em equipe, assim como as abelhas em uma colmeia.';

  const objectivesText =
    settings.lore_objectives ||
    'Hoje, os Enxamistas continuam a ser uma força vital em Roxwood, promovendo a união e o desenvolvimento da comunidade. Eles são um exemplo de como a diversidade e a comunicação podem levar a grandes conquistas.';

  const filteredRules = useMemo(() => {
    const q = ruleFilter.trim().toLowerCase();
    if (!q) return FRATERNITY_RULES;
    return FRATERNITY_RULES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        String(r.number).includes(q)
    );
  }, [ruleFilter]);

  return (
    <main className="min-h-screen bg-obsidian text-ivory selection:bg-royal-gold selection:text-obsidian relative overflow-hidden">
      <div className="absolute inset-0 honeycomb-overlay opacity-70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[480px] honeycomb-glow pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal-gold/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <Navbar />

      <div className="max-w-5xl mx-auto pt-16 pb-32 px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-royal-gold/10 border border-royal-gold/30 mb-8 shadow-gold-glow">
            <BeeIcon className="w-4 h-4 text-royal-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">
              Os Enxamistas • Fraternidade de Roxwood
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
            DIVERSIDADE E <br />
            <span className="text-royal-gold text-glow-gold italic font-serif">UNIÃO.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-white/60 leading-relaxed">
            A história da nossa colmeia de ideias fundada por Erasmos em Roxwood e o código oficial
            de convivência da Fraternidade Enxamistas.
          </p>
        </div>

        {/* Lore Sections */}
        <div className="space-y-10">
          <section className="card-premium border-l-4 border-l-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Shield className="text-royal-gold" size={22} />
              01. A Origem em Roxwood
            </h2>
            <p className="text-white/70 text-base leading-relaxed">{originText}</p>
          </section>

          <section className="card-premium border-r-4 border-r-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Feather className="text-royal-gold" size={22} />
              02. Erasmos &amp; A Colmeia de Ideias
            </h2>
            <p className="text-white/70 text-base leading-relaxed">{philosophyText}</p>
          </section>

          <section className="card-premium border-l-4 border-l-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Flame className="text-royal-gold" size={22} />
              03. Crescimento, Cultura &amp; Equipe
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-5">{cultureText}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-honey">
              <li className="p-3 bg-obsidian/70 border border-royal-gold/20 rounded-sm">
                ⬡ Diversidade &amp; Perspectivas Únicas
              </li>
              <li className="p-3 bg-obsidian/70 border border-royal-gold/20 rounded-sm">
                ⬡ Comunicação Eficaz
              </li>
              <li className="p-3 bg-obsidian/70 border border-royal-gold/20 rounded-sm">
                ⬡ Projetos pela Comunidade
              </li>
              <li className="p-3 bg-obsidian/70 border border-royal-gold/20 rounded-sm">
                ⬡ Respeito Mútuo &amp; Cooperação
              </li>
            </ul>
          </section>

          <section className="card-premium border-r-4 border-r-royal-gold">
            <h2 className="text-xl font-bold text-white mb-4 tracking-[0.2em] uppercase flex items-center gap-3">
              <Compass className="text-royal-gold" size={22} />
              04. Os Enxamistas Hoje em Roxwood
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-6">{objectivesText}</p>
            <div className="p-4 bg-obsidian/70 border border-royal-gold/20 rounded-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold mb-2 flex items-center gap-2">
                <Crown size={14} /> Hierarquia da Colmeia
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                Convidados → Kakunas (Novatos) → Abelhas Operárias → Abelha Conselheira Real →
                Abelha Patrono → Abelha Princesa → Abelha Rainha • Staff Zangão.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-graphite/90 rounded-sm border border-royal-gold/20 flex flex-col items-center text-center">
              <h3 className="text-royal-gold font-bold tracking-[0.3em] uppercase mb-6">
                Valores da Fraternidade
              </h3>
              <ul className="space-y-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                <li>⬡ Diversidade &amp; Inclusão</li>
                <li>⬡ Comunicação Eficaz</li>
                <li>⬡ Cooperação em Equipe</li>
                <li>⬡ Respeito Mútuo &amp; Ética</li>
              </ul>
            </div>
            <div className="p-10 bg-royal-gold/10 rounded-sm border border-royal-gold/30 flex flex-col items-center text-center justify-center">
              <p className="text-honey italic font-serif text-xl mb-6 leading-relaxed">
                &ldquo;Assim como as abelhas em uma colmeia, a união e a cooperação nos levam a grandes conquistas.&rdquo;
              </p>
              <div className="w-12 h-0.5 bg-royal-gold" />
            </div>
          </section>
        </div>

        {/* 20 Official Rules Section */}
        <section id="regras" className="mt-20 pt-16 border-t border-royal-gold/20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-royal-gold/10 border border-royal-gold/25 mb-3">
                <ScrollText size={13} className="text-royal-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-royal-gold">
                  Código Oficial • 20 Normas
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Regras da Fraternidade Enxamistas
              </h2>
              <p className="text-xs md:text-sm text-white/55 mt-2">
                Normas válidas no campus da Universidade de RUA2, nas instalações da fraternidade,
                no Discord e em todos os eventos oficiais.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-royal-gold/70" />
              <input
                type="text"
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value)}
                placeholder="Filtrar regra (ex: uniforme, rua2)..."
                className="w-full bg-graphite border border-royal-gold/25 rounded-sm pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-royal-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.number}
                className="card-honeycomb flex items-start gap-4 p-5 bg-graphite/95"
              >
                <HoneycombCrest className="w-10 h-10 text-xs font-bold mt-0.5">
                  {String(rule.number).padStart(2, '0')}
                </HoneycombCrest>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-honey">
                    Regra {String(rule.number).padStart(2, '0')} • {rule.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredRules.length === 0 && (
            <div className="p-8 text-center bg-graphite/60 border border-white/10 rounded-sm text-sm text-white/50">
              Nenhuma regra encontrada para &ldquo;{ruleFilter}&rdquo;.
            </div>
          )}
        </section>

        <div className="mt-20 flex flex-col sm:flex-row justify-center gap-4 text-center">
          <Link href="/cadastro" className="btn-primary px-10 py-4 text-sm inline-block">
            SOLICITAR INGRESSO NA COLMEIA
          </Link>
          <Link
            href="/cinematica"
            className="px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] border border-royal-gold/30 hover:border-royal-gold hover:bg-royal-gold/10 transition-all rounded-sm inline-block text-honey"
          >
            EXPLORAR CINEMÁTICA
          </Link>
        </div>
      </div>
    </main>
  );
}
