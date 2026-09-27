import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
}

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700',
  secundario:
    'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
};

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  ...props
}: BotonProps) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
