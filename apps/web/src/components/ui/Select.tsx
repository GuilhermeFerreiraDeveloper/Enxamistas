import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 group">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 transition-colors group-focus-within:text-honey">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#202024]/80 px-4 py-3.5 text-sm text-white shadow-inner shadow-black/10 transition duration-200 hover:border-white/15 focus:border-royal-gold/55 focus:outline-none focus:ring-4 focus:ring-royal-gold/10',
              error && 'border-red-500/30 focus:border-red-500/50',
              className
            )}
            {...props}
          >
            <option value="" disabled className="bg-graphite">SELECIONE UMA OPÇÃO</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-graphite">
                {opt.label.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-focus-within:text-royal-gold transition-colors">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
