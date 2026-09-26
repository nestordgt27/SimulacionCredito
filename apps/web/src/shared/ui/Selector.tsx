import { useId, type Ref, type SelectHTMLAttributes } from 'react';

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  opciones: readonly Opcion[];
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

// Select con etiqueta y error accesibles, con el mismo estilo que Campo.
export function Selector({ etiqueta, opciones, error, className = '', ...props }: SelectorProps) {
  const id = useId();
  const idError = `${id}-error`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none aria-invalid:border-red-500"
        {...props}
      >
        {opciones.map(({ valor, etiqueta: texto }) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {error && (
        <p id={idError} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
