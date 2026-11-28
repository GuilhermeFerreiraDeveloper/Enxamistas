'use client'

import React from 'react';
import { RadioBar } from '@/components/RadioBar';
import { useRadio } from '@/contexts/RadioContext';

export function GlobalRadioShell({ children }: { children: React.ReactNode }) {
  const { currentTrack } = useRadio();

  return (
    <>
      <div className={currentTrack ? 'pb-28 sm:pb-20' : undefined}>{children}</div>
      <RadioBar />
    </>
  );
}
