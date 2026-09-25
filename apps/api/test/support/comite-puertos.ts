import type { CreditoRepository } from '../../src/modules/creditos/domain/credito.repository';
import type { NumeroCreditoGenerator } from '../../src/modules/creditos/domain/numero-credito.generator';
import type { SolicitudRepository } from '../../src/modules/solicitudes/domain/solicitud.repository';
import { FakeClock } from './fake-clock';
import { FakeUnitOfWork } from './fake-unit-of-work';

// Puertos mockeados para los casos de uso del comité (CLAUDE.md §6.2).
export function crearPuertosComite() {
  const solicitudes: jest.Mocked<SolicitudRepository> = {
    crear: jest.fn(),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    registrarEvaluacion: jest.fn().mockResolvedValue(true),
  };
  const creditos: jest.Mocked<CreditoRepository> = {
    crear: jest.fn().mockResolvedValue(undefined),
  };
  const numeros: jest.Mocked<NumeroCreditoGenerator> = {
    generar: jest.fn().mockResolvedValue('CR-2026-000001'),
  };

  return {
    solicitudes,
    creditos,
    numeros,
    unitOfWork: new FakeUnitOfWork(),
    clock: new FakeClock('2026-09-26T15:00:00Z'),
  };
}
