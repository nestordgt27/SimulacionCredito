const DOS_DECIMALES: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** 1234567.5 → "C$ 1,234,567.50" (córdobas). */
export function formatearMonto(monto: number): string {
  return `C$ ${monto.toLocaleString('es-NI', DOS_DECIMALES)}`;
}

/** 12 → "12 meses", 1 → "1 mes", 1.5 → "1.5 meses". */
export function formatearMeses(meses: number): string {
  return `${meses.toLocaleString('es-NI')} ${meses === 1 ? 'mes' : 'meses'}`;
}

/** "2026-09-25T17:14:57.578Z" → "25/09/2026" (fecha en UTC, igual que en el backend). */
export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-NI', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
