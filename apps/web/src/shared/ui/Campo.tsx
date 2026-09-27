import { useId, type InputHTMLAttributes, type Ref } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

// Input con etiqueta y mensaje de error accesibles (aria-invalid + aria-describedby).
// Compatible con `register` de React Hook Form (React 19 pasa `ref` como prop).
export function Campo({ etiqueta, error, className = '', ...props }: CampoProps) {
  const id = useId();
  const idError = `${id}-error`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none aria-invalid:border-red-500"
        {...props}
      />
      {error && (
        <p id={idError} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
