import { EstadoSolicitud } from '@simulacion-credito/shared';
import { TransicionInvalidaError } from './errores';
import { SolicitudStateMachine } from './solicitud-state-machine';

const { PENDIENTE, APROBADA, RECHAZADA, DESEMBOLSADA } = EstadoSolicitud;

const VALIDAS: [EstadoSolicitud, EstadoSolicitud][] = [
  [PENDIENTE, APROBADA],
  [PENDIENTE, RECHAZADA],
  [APROBADA, DESEMBOLSADA],
];

// Todas las combinaciones de los 4 estados (16) menos las 3 válidas.
const INVALIDAS = Object.values(EstadoSolicitud)
  .flatMap((desde) => Object.values(EstadoSolicitud).map((hacia) => [desde, hacia] as const))
  .filter(([desde, hacia]) => !VALIDAS.some(([d, h]) => d === desde && h === hacia));

describe('SolicitudStateMachine', () => {
  it('debe considerar 13 transiciones inválidas de las 16 posibles', () => {
    expect(INVALIDAS).toHaveLength(13);
  });

  it.each(VALIDAS)('debe permitir %s → %s', (desde, hacia) => {
    expect(SolicitudStateMachine.puedeTransicionar(desde, hacia)).toBe(true);
    expect(() => SolicitudStateMachine.assertTransicion(desde, hacia)).not.toThrow();
  });

  it.each(INVALIDAS)('debe rechazar %s → %s con TransicionInvalidaError', (desde, hacia) => {
    expect(SolicitudStateMachine.puedeTransicionar(desde, hacia)).toBe(false);
    expect(() => SolicitudStateMachine.assertTransicion(desde, hacia)).toThrow(
      TransicionInvalidaError,
    );
  });

  it('debe indicar el estado de origen y destino en el error', () => {
    expect(() => SolicitudStateMachine.assertTransicion(RECHAZADA, APROBADA)).toThrow(
      'La solicitud está RECHAZADA y no puede pasar a APROBADA',
    );
  });
});
