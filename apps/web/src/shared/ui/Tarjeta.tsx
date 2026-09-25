import type { ReactNode } from 'react';

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 ${className}`}>
      {children}
    </section>
  );
}
