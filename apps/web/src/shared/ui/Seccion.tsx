import type { ReactNode } from 'react';

// Grupo de campos con título (fieldset + legend: accesible como "group" con nombre).
export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <legend className="float-left mb-4 w-full text-base font-semibold text-slate-900">
        {titulo}
      </legend>
      <div className="clear-both grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
