import { useId, type Ref, type TextareaHTMLAttributes } from 'react';

interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

// Textarea con etiqueta, ayuda y error accesibles, con el mismo estilo que Campo.
export function AreaTexto({ etiqueta, ayuda, error, className = '', ...props }: AreaTextoProps) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descripciones = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripciones || undefined}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none aria-invalid:border-red-500"
        {...props}
      />
      {ayuda && (
        <p id={idAyuda} className="text-xs text-slate-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
