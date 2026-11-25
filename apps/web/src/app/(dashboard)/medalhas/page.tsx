'use client'

import React, { useEffect, useState } from 'react';
import { Award, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MedalhasPage() {
  const [myMedals, setMyMedals] = useState<any[]>([]);
  const [myAchievements, setMyAchievements] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<{ medals: any[]; achievements: any[] }>({
    medals: [],
    achievements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/medals/my'),
      api.get('/medals/my-achievements'),
      api.get('/medals/catalog'),
    ])
      .then(([mRes, aRes, cRes]) => {
        setMyMedals(Array.isArray(mRes.data) ? mRes.data : []);
        setMyAchievements(Array.isArray(aRes.data) ? aRes.data : []);
        setCatalog(cRes.data || { medals: [], achievements: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const earnedMedalIds = new Set(myMedals.map((m) => m.medalId));
  const earnedAchIds = new Set(myAchievements.map((a) => a.achievementId));

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20">
          <Award size={12} className="text-royal-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">
            Honrarias & Conquistas
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight uppercase">
          Medalhas e Conquistas
        </h1>
        <p className="text-sm text-white/50">
          Histórico oficial de conclusão de cursos e méritos concedidos na colmeia.
        </p>
      </div>

      {loading ? (
        <div className="h-64 bg-graphite/50 border border-white/5 rounded-sm animate-pulse" />
      ) : (
        <>
          <section className="space-y-5">
            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={18} className="text-royal-gold" /> Minhas Medalhas ({myMedals.length})
            </h2>
            {myMedals.length === 0 ? (
              <div className="p-8 bg-graphite/40 border border-white/5 rounded-sm text-xs text-white/40">
                Você ainda não possui medalhas de conclusão. Conclua aulas e valide sua formação.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myMedals.map((um) => (
                  <div key={um.id} className="bg-graphite border border-royal-gold/30 p-6 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <Award size={24} className="text-royal-gold" />
                      <span className="text-[10px] text-white/40">{formatDate(um.createdAt)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{um.medal.name}</h3>
                    <p className="text-xs text-royal-gold">{um.medal.course?.name}</p>
                    <p className="text-xs text-white/60">{um.reason || um.medal.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={18} className="text-royal-gold" /> Minhas Conquistas ({myAchievements.length})
            </h2>
            {myAchievements.length === 0 ? (
              <div className="p-8 bg-graphite/40 border border-white/5 rounded-sm text-xs text-white/40">
                Nenhuma conquista desbloqueada ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAchievements.map((ua) => (
                  <div key={ua.id} className="bg-graphite border border-white/10 p-6 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                        {ua.achievement.category} • {ua.achievement.type}
                      </span>
                      <span className="text-[10px] text-white/40">{formatDate(ua.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{ua.achievement.name}</h3>
                    <p className="text-xs text-white/60">{ua.achievement.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
              Catálogo Geral da Academia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.medals.map((m) => {
                const earned = earnedMedalIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-sm border ${
                      earned ? 'bg-graphite border-royal-gold/40' : 'bg-graphite/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-royal-gold">
                        {m.course?.name}
                      </span>
                      {earned ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <Lock size={14} className="text-white/30" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    <p className="text-xs text-white/50 mt-1">{m.criteria || m.description}</p>
                  </div>
                );
              })}

              {catalog.achievements.map((a) => {
                const earned = earnedAchIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`p-5 rounded-sm border ${
                      earned ? 'bg-graphite border-royal-gold/40' : 'bg-graphite/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Conquista {a.type}
                      </span>
                      {earned ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <Lock size={14} className="text-white/30" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{a.name}</h3>
                    <p className="text-xs text-white/50 mt-1">{a.criteria || a.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
