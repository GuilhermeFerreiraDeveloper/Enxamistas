import React from 'react';
import { cn } from '@/lib/utils';

export function BeeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-5 h-5', className)}
      aria-hidden="true"
    >
      <path
        d="M11 10C8 6.5 4 7 4.5 10.5C5 13.5 8.5 14 11 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M21 10C24 6.5 28 7 27.5 10.5C27 13.5 23.5 14 21 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse cx="16" cy="18" rx="5.5" ry="7.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11.2 15.5H20.8M10.8 19H21.2M12 22.5H20" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.2 6.4L12.8 4M17.8 6.4L19.2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HoneycombCrest({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'hex-badge bg-royal-gold/15 border border-royal-gold/40 flex items-center justify-center text-royal-gold shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}
