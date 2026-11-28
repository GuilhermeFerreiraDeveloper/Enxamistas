import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 group">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 transition-colors group-focus-within:text-honey">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-white/10 bg-[#202024]/80 px-4 py-3.5 text-sm text-white shadow-inner shadow-black/10 transition duration-200 placeholder:text-white/30 hover:border-white/15 focus:border-royal-gold/55 focus:outline-none focus:ring-4 focus:ring-royal-gold/10',
              error && 'border-red-500/30 focus:border-red-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
