import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/5',
      outline: 'bg-transparent border border-royal-gold/30 text-royal-gold hover:bg-royal-gold/5',
      ghost: 'bg-transparent text-white/50 hover:text-white hover:bg-white/5',
    };

    const sizes = {
      sm: 'px-4 py-2 text-[10px]',
      md: 'px-6 py-3 text-xs',
      lg: 'px-8 py-4 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative flex items-center justify-center rounded-sm transition-all duration-500 font-bold uppercase tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed group active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="flex items-center gap-2">{children}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
