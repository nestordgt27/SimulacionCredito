export const EstadoSolicitud = {
  PENDIENTE: 'PENDIENTE',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  DESEMBOLSADA: 'DESEMBOLSADA',
} as const;

export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];
