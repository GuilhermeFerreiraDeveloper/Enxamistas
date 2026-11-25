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
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-focus-within:text-royal-gold transition-colors">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'w-full bg-graphite border border-white/5 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-royal-gold/30 transition-all duration-500 shadow-premium',
              error && 'border-red-500/30 focus:border-red-500/50',
              className
            )}
            {...props}
          />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-royal-gold scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
        </div>
        {error && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
