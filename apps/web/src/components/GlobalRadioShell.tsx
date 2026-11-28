'use client'

import React from 'react';
import { RadioBar } from '@/components/RadioBar';
import { MascotCompanion } from '@/components/MascotCompanion';

export function GlobalRadioShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="site-atmosphere" aria-hidden="true">
        <span className="pollen-dot pollen-one" />
        <span className="pollen-dot pollen-two" />
        <span className="pollen-dot pollen-three" />
        <span className="pollen-dot pollen-four" />
        <span className="hive-hex hive-hex-one" />
        <span className="hive-hex hive-hex-two" />
        <span className="hive-hex hive-hex-three" />
      </div>
      <div className="relative z-10 pb-28 sm:pb-24">{children}</div>
      <MascotCompanion />
      <RadioBar />
    </>
  );
}
