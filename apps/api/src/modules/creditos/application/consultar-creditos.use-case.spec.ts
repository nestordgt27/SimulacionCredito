import { Banco, EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import type { ConsultaCreditos, CreditoDetalle } from '../domain/consulta-creditos';
import { Credito } from '../domain/credito';
import { ConsultarCreditosUseCase } from './consultar-creditos.use-case';

const APROBACION = new Date('2026-09-25T12:00:00Z');

// El plan se genera con la entidad real (no se mockea el dominio, CLAUDE.md §6.2).
function unCreditoDetalle(cambios: Partial<CreditoDetalle> = {}): CreditoDetalle {
  const credito = Credito.otorgar(
    {
      solicitudId: 5,
      montoCentavos: 1_000_000,
      tasaAnualBps: 1200,
      periodicidad: Periodicidad.QUINCENAL,
      cantidadCuotas: 24,
      cuotaNiveladaCentavos: 44_321,
    },
    'CR-2026-000001',
    APROBACION,
  );
  return {
    numeroCredito: credito.numeroCredito,
    solicitudId: credito.solicitudId,
    estado: EstadoSolicitud.APROBADA,
    fechaAprobacion: credito.fechaAprobacion,
    cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
    montoCentavos: credito.montoCentavos,
    tasaAnualBps: credito.tasaAnualBps,
    cantidadCuotas: credito.cantidadCuotas,
    periodicidad: credito.periodicidad,
    cuotaNiveladaCentavos: credito.cuotaNiveladaCentavos,
    desembolso: null,
    cuotas: [...credito.cuotas],
    ...cambios,
  };
}

describe('ConsultarCreditosUseCase', () => {
  let consulta: jest.Mocked<ConsultaCreditos>;
  let useCase: ConsultarCreditosUseCase;

  beforeEach(() => {
    consulta = { porCedula: jest.fn().mockResolvedValue([unCreditoDetalle()]) };
    useCase = new ConsultarCreditosUseCase(consulta);
  });

  it('debe consultar los créditos de la cédula indicada', async () => {
    await useCase.porCedula('001-010190-0001A');

    expect(consulta.porCedula).toHaveBeenCalledWith('001-010190-0001A');
  });

  it('debe devolver las condiciones en unidades con el plazo derivado', async () => {
    const [credito] = await useCase.porCedula('001-010190-0001A');

    expect(credito).toMatchObject({
      numeroCredito: 'CR-2026-000001',
      estado: EstadoSolicitud.APROBADA,
      monto: 10_000,
      tasaAnual: 12,
      cantidadCuotas: 24,
      periodicidad: Periodicidad.QUINCENAL,
      plazoMeses: 12,
      cuotaNivelada: 443.21,
      desembolso: null,
    });
  });

  it('debe devolver el plan completo en unidades con los nombres de shared', async () => {
    const [credito] = await useCase.porCedula('001-010190-0001A');

    expect(credito?.planPagos).toHaveLength(24);
    expect(credito?.planPagos[0]).toEqual({
      numero: 1,
      fechaVencimiento: new Date('2026-10-10T12:00:00Z'),
      cuota: 443.21,
      capital: 393.21,
      interes: 50,
      saldo: 9606.79,
    });
    expect(credito?.planPagos.at(-1)?.saldo).toBe(0);
  });

  it('debe incluir el banco y la fecha cuando el crédito fue desembolsado', async () => {
    const desembolso = { banco: Banco.FICOHSA, fechaDesembolso: new Date('2026-09-27T09:00:00Z') };
    consulta.porCedula.mockResolvedValue([
      unCreditoDetalle({ estado: EstadoSolicitud.DESEMBOLSADA, desembolso }),
    ]);

    const [credito] = await useCase.porCedula('001-010190-0001A');

    expect(credito).toMatchObject({ estado: EstadoSolicitud.DESEMBOLSADA, desembolso });
  });

  it('debe devolver una lista vacía cuando el cliente no tiene créditos', async () => {
    consulta.porCedula.mockResolvedValue([]);

    await expect(useCase.porCedula('001-010190-0099Z')).resolves.toEqual([]);
  });
});
