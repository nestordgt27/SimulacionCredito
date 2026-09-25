export const Banco = {
  LAFISE: 'LAFISE',
  FICOHSA: 'FICOHSA',
  BAC_CREDOMATIC: 'BAC_CREDOMATIC',
  BANPRO: 'BANPRO',
} as const;

export type Banco = (typeof Banco)[keyof typeof Banco];
