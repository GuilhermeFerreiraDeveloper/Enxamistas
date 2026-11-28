'use client'

import React from 'react';
import { RadioBar } from '@/components/RadioBar';

export function GlobalRadioShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-28 sm:pb-20">{children}</div>
      <RadioBar />
    </>
  );
}
