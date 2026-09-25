import { describe, expect, it } from 'vitest';
import { EstadoSolicitud } from './estado-solicitud';

describe('EstadoSolicitud', () => {
  // Los valores se guardan como texto en la base de datos: cambiarlos rompe los datos existentes.
  it('debe exponer exactamente los cuatro estados del ciclo de vida', () => {
    expect(Object.values(EstadoSolicitud)).toEqual([
      'PENDIENTE',
      'APROBADA',
      'RECHAZADA',
      'DESEMBOLSADA',
    ]);
  });
});
