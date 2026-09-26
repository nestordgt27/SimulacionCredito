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
