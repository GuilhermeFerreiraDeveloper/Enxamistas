'use client'

import React from 'react';
import { RadioBar } from '@/components/RadioBar';
import { MascotCompanion } from '@/components/MascotCompanion';

export function GlobalRadioShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-28 sm:pb-24">{children}</div>
      <MascotCompanion />
      <RadioBar />
    </>
  );
}
