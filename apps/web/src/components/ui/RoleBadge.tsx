import React from 'react';
import { RoleLabels, UserRole } from '@enxamistas/shared';
import { cn } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  STAFF_ZANGAO: 'bg-red-500/10 border-red-500/30 text-red-300',
  ABELHA_RAINHA: 'bg-royal-gold/20 border-royal-gold/50 text-honey',
  ABELHA_PRINCESA: 'bg-royal-gold/15 border-royal-gold/40 text-royal-gold-light',
  ABELHA_PATRONO: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  ABELHA_CONSELHEIRA_REAL: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-200',
  ABELHA_OPERARIA: 'bg-white/10 border-white/20 text-ivory',
  KAKUNA: 'bg-white/5 border-white/15 text-white/70',
  CONVIDADO: 'bg-white/5 border-white/10 text-white/50',
};

export function RoleBadge({ role, className }: { role?: string; className?: string }) {
  const key = (role || 'CONVIDADO') as UserRole;
  const label = RoleLabels[key] || role || 'Convidado';
  const style = ROLE_STYLES[key] || ROLE_STYLES.CONVIDADO;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-[0.15em]',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
