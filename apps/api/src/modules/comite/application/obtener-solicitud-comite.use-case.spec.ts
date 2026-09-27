import { crearPuertosSolicitudYCredito } from '../../../../test/support/puertos-solicitud-credito';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import { SolicitudNoEncontradaError } from '../../solicitudes/domain/errores';
import { ObtenerSolicitudComiteUseCase } from './obtener-solicitud-comite.use-case';

describe('ObtenerSolicitudComiteUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosSolicitudYCredito>;
  let useCase: ObtenerSolicitudComiteUseCase;

  beforeEach(() => {
    puertos = crearPuertosSolicitudYCredito();
    useCase = new ObtenerSolicitudComiteUseCase(puertos.solicitudes, puertos.clock);
  });

  it('debe devolver la información personal, laboral y financiera para el dictamen', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(
      unaSolicitud().conFechaNacimiento('1990-01-01').persistida(5),
    );

    const vista = await useCase.ejecutar(5);

    expect(vista).toStrictEqual({
      personal: {
        cedula: '001-010190-0001A',
        nombreCompleto: 'Ana Pérez',
        edad: 36,
        fechaNacimiento: '1990-01-01',
        correo: 'ana@correo.com',
        telefono: '88887777',
      },
      laboral: {
        tipoEmpleo: 'ASALARIADO',
        empresa: 'Empresa S.A.',
        antiguedadLaboralAnios: 5,
        ingresoMensual: 25_000.5,
      },
      financiero: {
        monto: 10_000,
        tasaAnual: 12,
        cantidadCuotas: 12,
        periodicidad: 'MENSUAL',
        plazoMeses: 12,
        cuotaNivelada: 888.49,
        cuotaMensualEquivalente: 888.49,
        relacionCuotaIngreso: 3.55,
        totalAPagar: 10_661.86,
        totalIntereses: 661.86,
      },
    });
  });

  it('debe lanzar SolicitudNoEncontradaError cuando la solicitud no existe', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(null);

    await expect(useCase.ejecutar(99)).rejects.toThrow(SolicitudNoEncontradaError);
  });
});
