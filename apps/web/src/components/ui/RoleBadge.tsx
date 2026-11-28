import React from 'react';
import { RoleLabels, UserRole } from '@enxamistas/shared';
import { cn } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  STAFF_ZANGAO: 'bg-amber-500/15 border-amber-400/50 text-amber-200',
  ABELHA_RAINHA: 'bg-royal-gold/25 border-royal-gold/60 text-honey',
  ABELHA_PRINCESA: 'bg-royal-gold/15 border-royal-gold/45 text-royal-gold-light',
  ABELHA_PATRONO: 'bg-amber-500/10 border-amber-500/35 text-amber-300',
  ABELHA_CONSELHEIRA_REAL: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
  ABELHA_OPERARIA: 'bg-white/10 border-royal-gold/25 text-ivory',
  KAKUNA: 'bg-white/5 border-white/15 text-white/75',
  CONVIDADO: 'bg-white/5 border-white/10 text-white/55',
};

const ROLE_SIGILS: Record<string, string> = {
  STAFF_ZANGAO: '⬡',
  ABELHA_RAINHA: '♛',
  ABELHA_PRINCESA: '✦',
  ABELHA_PATRONO: '◈',
  ABELHA_CONSELHEIRA_REAL: '❖',
  ABELHA_OPERARIA: '⬢',
  KAKUNA: '◇',
  CONVIDADO: '○',
};

export function RoleBadge({ role, className }: { role?: string; className?: string }) {
  const key = (role || 'CONVIDADO') as UserRole;
  const label = RoleLabels[key] || role || 'Convidado';
  const style = ROLE_STYLES[key] || ROLE_STYLES.CONVIDADO;
  const sigil = ROLE_SIGILS[key] || '○';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]',
        style,
        className
      )}
    >
      <span className="text-royal-gold leading-none">{sigil}</span>
      {label}
    </span>
  );
}
