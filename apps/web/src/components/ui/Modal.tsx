'use client'

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/10 bg-[#1d1d20]/95 shadow-2xl shadow-black/50`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
