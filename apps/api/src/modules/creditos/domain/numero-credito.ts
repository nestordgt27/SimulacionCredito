/** CR-AAAA-NNNNNN (CLAUDE.md §4). La secuencia se reinicia cada año. */
export function formatearNumeroCredito(anio: number, secuencial: number): string {
  return `CR-${anio}-${String(secuencial).padStart(6, '0')}`;
}
