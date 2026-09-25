import { EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { HOY, unaSolicitud } from '../../../../test/support/solicitud-builders';
import {
  EdadNoPermitidaError,
  FechaNacimientoInvalidaError,
  ObservacionesRequeridasError,
  TransicionInvalidaError,
} from './errores';

describe('Solicitud', () => {
  describe('crear', () => {
    it('debe quedar en estado PENDIENTE y sin observaciones', () => {
      const solicitud = unaSolicitud().crear();

      expect(solicitud).toMatchObject({ estado: EstadoSolicitud.PENDIENTE, observaciones: null });
    });

    it('debe registrar la fecha de creación del reloj', () => {
      const solicitud = unaSolicitud().crear(HOY);

      expect(solicitud.creadaEn).toEqual(HOY);
    });

    it.each([
      { periodicidad: Periodicidad.MENSUAL, cantidadCuotas: 12, centavos: 88_849 },
      { periodicidad: Periodicidad.QUINCENAL, cantidadCuotas: 24, centavos: 44_321 },
      { periodicidad: Periodicidad.ANUAL, cantidadCuotas: 3, centavos: 416_349 },
    ])(
      'debe calcular la cuota con shared en centavos cuando es $periodicidad en $cantidadCuotas cuotas',
      ({ periodicidad, cantidadCuotas, centavos }) => {
        const solicitud = unaSolicitud().conCondiciones({ periodicidad, cantidadCuotas }).crear();

        expect(solicitud.cuotaNiveladaCentavos).toBe(centavos);
      },
    );

    it('debe convertir la tasa en puntos básicos a porcentaje para el cálculo', () => {
      const solicitud = unaSolicitud()
        .conCondiciones({ montoCentavos: 500_000, tasaAnualBps: 1850, cantidadCuotas: 6 })
        .crear();

      // 5 000 al 18,5 % en 6 cuotas mensuales: 878,8718 con la fórmula en punto flotante
      expect(solicitud.cuotaNiveladaCentavos).toBe(87_887);
    });

    it('debe permitir a un cliente con exactamente 80 años', () => {
      const solicitud = unaSolicitud().conFechaNacimiento('1945-09-26').crear();

      expect(solicitud.edadDelClienteA(HOY)).toBe(80);
    });

    it('debe lanzar EdadNoPermitidaError cuando el cliente tiene más de 80 años', () => {
      const crear = () => unaSolicitud().conFechaNacimiento('1945-09-25').crear();

      expect(crear).toThrow(EdadNoPermitidaError);
      expect(crear).toThrow(/81 años/);
    });

    it('debe lanzar FechaNacimientoInvalidaError cuando la fecha de nacimiento es futura', () => {
      const crear = () => unaSolicitud().conFechaNacimiento('2026-09-26').crear();

      expect(crear).toThrow(FechaNacimientoInvalidaError);
    });

    it('debe no tener id hasta que se persiste', () => {
      const solicitud = unaSolicitud().crear();

      expect(() => solicitud.id).toThrow(/no fue persistida/);
    });
  });

  describe('reconstituir', () => {
    it('debe exponer el id de la solicitud persistida', () => {
      expect(unaSolicitud().persistida(7).id).toBe(7);
    });
  });

  it.each([
    { periodicidad: Periodicidad.MENSUAL, cantidadCuotas: 12, meses: 12 },
    { periodicidad: Periodicidad.QUINCENAL, cantidadCuotas: 6, meses: 3 },
    { periodicidad: Periodicidad.ANUAL, cantidadCuotas: 2, meses: 24 },
  ])(
    'debe derivar un plazo de $meses meses cuando son $cantidadCuotas cuotas $periodicidad',
    ({ periodicidad, cantidadCuotas, meses }) => {
      const solicitud = unaSolicitud().conCondiciones({ periodicidad, cantidadCuotas }).crear();

      expect(solicitud.plazoMeses).toBe(meses);
    },
  );

  describe('aprobar', () => {
    const DICTAMEN = new Date('2026-09-26T15:00:00Z');

    it('debe pasar a APROBADA con observaciones, evaluador y fecha del dictamen', () => {
      const aprobada = unaSolicitud().persistida(5).aprobar('  Buen historial  ', 9, DICTAMEN);

      expect(aprobada).toMatchObject({
        id: 5,
        estado: EstadoSolicitud.APROBADA,
        observaciones: 'Buen historial',
        evaluadaPorId: 9,
        fechaEvaluacion: DICTAMEN,
      });
    });

    it('debe no modificar la solicitud original', () => {
      const pendiente = unaSolicitud().persistida();

      pendiente.aprobar('Aprobada', 9, DICTAMEN);

      expect(pendiente.estado).toBe(EstadoSolicitud.PENDIENTE);
    });

    it.each(['', '   '])(
      'debe lanzar ObservacionesRequeridasError cuando las observaciones son %p',
      (observaciones) => {
        const aprobar = () => unaSolicitud().persistida().aprobar(observaciones, 9, DICTAMEN);

        expect(aprobar).toThrow(ObservacionesRequeridasError);
      },
    );

    it.each([EstadoSolicitud.APROBADA, EstadoSolicitud.RECHAZADA, EstadoSolicitud.DESEMBOLSADA])(
      'debe lanzar TransicionInvalidaError cuando la solicitud está %s',
      (estado) => {
        const aprobar = () =>
          unaSolicitud().enEstado(estado).persistida().aprobar('Aprobada', 9, DICTAMEN);

        expect(aprobar).toThrow(TransicionInvalidaError);
      },
    );
  });

  describe('rechazar', () => {
    const DICTAMEN = new Date('2026-09-26T15:00:00Z');

    it('debe pasar a RECHAZADA guardando las observaciones cuando se indican', () => {
      const rechazada = unaSolicitud()
        .persistida()
        .rechazar(' Ingresos insuficientes ', 9, DICTAMEN);

      expect(rechazada).toMatchObject({
        estado: EstadoSolicitud.RECHAZADA,
        observaciones: 'Ingresos insuficientes',
        evaluadaPorId: 9,
        fechaEvaluacion: DICTAMEN,
      });
    });

    it.each([null, '', '  '])(
      'debe permitir rechazar sin observaciones cuando son %p',
      (observaciones) => {
        const rechazada = unaSolicitud().persistida().rechazar(observaciones, 9, DICTAMEN);

        expect(rechazada).toMatchObject({ estado: EstadoSolicitud.RECHAZADA, observaciones: null });
      },
    );

    it('debe lanzar TransicionInvalidaError cuando la solicitud ya fue aprobada', () => {
      const rechazar = () =>
        unaSolicitud().enEstado(EstadoSolicitud.APROBADA).persistida().rechazar(null, 9, DICTAMEN);

      expect(rechazar).toThrow(TransicionInvalidaError);
    });
  });
});
