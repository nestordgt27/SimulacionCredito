export const TipoEmpleo = {
  ASALARIADO: 'ASALARIADO',
  INDEPENDIENTE: 'INDEPENDIENTE',
} as const;

export type TipoEmpleo = (typeof TipoEmpleo)[keyof typeof TipoEmpleo];
