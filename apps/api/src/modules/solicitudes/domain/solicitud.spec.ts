import { EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { HOY, unaSolicitud } from '../../../../test/support/solicitud-builders';
import { EdadNoPermitidaError, FechaNacimientoInvalidaError } from './errores';

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
});
