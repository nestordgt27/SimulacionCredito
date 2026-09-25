import { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { UNIT_OF_WORK, type UnitOfWork } from '../../src/core/domain/unit-of-work';
import { AprobarSolicitudUseCase } from '../../src/modules/comite/application/aprobar-solicitud.use-case';
import { DesembolsarCreditoUseCase } from '../../src/modules/desembolsos/application/desembolsar-credito.use-case';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../src/modules/solicitudes/domain/solicitud.repository';
import { unaSolicitud } from '../support/solicitud-builders';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearUsuario } from './support/datos-prueba';

describe('Desembolso (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;
  let desembolsar: DesembolsarCreditoUseCase;
  let operadorId: number;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
    desembolsar = db.app.get(DesembolsarCreditoUseCase);
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
    operadorId = (await crearUsuario(db.prisma)).id;
  });

  afterAll(async () => {
    await db.cerrar();
  });

  async function sembrarSolicitudAprobada(): Promise<number> {
    const unitOfWork = db.app.get<UnitOfWork>(UNIT_OF_WORK);
    const repositorio = db.app.get<SolicitudRepository>(SOLICITUD_REPOSITORY);
    const { id } = await unitOfWork.run(() =>
      repositorio.crear(unaSolicitud().creadaPor(operadorId).crear()),
    );
    await db.app
      .get(AprobarSolicitudUseCase)
      .ejecutar({ solicitudId: id, observaciones: 'Cumple', evaluadorId: operadorId });
    return id;
  }

  const comando = (solicitudId: number) => ({
    solicitudId,
    banco: Banco.BANPRO,
    numeroCuenta: '000123456',
    usuarioId: operadorId,
  });

  it('debe pasar la solicitud a DESEMBOLSADA y registrar el desembolso del crédito', async () => {
    const solicitudId = await sembrarSolicitudAprobada();

    await desembolsar.ejecutar(comando(solicitudId));

    const credito = await db.prisma.credito.findUniqueOrThrow({
      where: { solicitudId },
      include: { desembolso: true, solicitud: true },
    });
    expect(credito.solicitud.estado).toBe(EstadoSolicitud.DESEMBOLSADA);
    expect(credito.desembolso).toMatchObject({
      banco: Banco.BANPRO,
      numeroCuenta: '000123456',
      montoCentavos: credito.montoCentavos,
      desembolsadoPorId: operadorId,
    });
  });

  it('debe registrar la transición APROBADA → DESEMBOLSADA en el historial', async () => {
    const solicitudId = await sembrarSolicitudAprobada();

    await desembolsar.ejecutar(comando(solicitudId));

    const historial = await db.prisma.solicitudHistorial.findMany({
      where: { solicitudId },
      orderBy: { id: 'asc' },
    });
    expect(historial.map((h) => [h.estadoAnterior, h.estadoNuevo])).toEqual([
      [null, EstadoSolicitud.PENDIENTE],
      [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA],
      [EstadoSolicitud.APROBADA, EstadoSolicitud.DESEMBOLSADA],
    ]);
    expect(historial.at(-1)).toMatchObject({
      usuarioId: operadorId,
      comentario: 'Desembolso en BANPRO',
    });
  });

  it('debe revertir el cambio de estado cuando falla el registro del desembolso', async () => {
    const solicitudId = await sembrarSolicitudAprobada();
    const credito = await db.prisma.credito.findUniqueOrThrow({ where: { solicitudId } });
    // Dato inconsistente a propósito: el crédito ya tiene un desembolso, así que el INSERT del
    // caso de uso viola UNIQUE(creditoId) después de haber cambiado el estado.
    await db.prisma.desembolso.create({
      data: {
        creditoId: credito.id,
        banco: Banco.LAFISE,
        numeroCuenta: '999999',
        montoCentavos: credito.montoCentavos,
        desembolsadoPorId: operadorId,
      },
    });

    await expect(desembolsar.ejecutar(comando(solicitudId))).rejects.toMatchObject({
      code: 'P2002',
    });

    await expect(
      db.prisma.solicitud.findUniqueOrThrow({ where: { id: solicitudId } }),
    ).resolves.toMatchObject({ estado: EstadoSolicitud.APROBADA });
    await expect(db.prisma.solicitudHistorial.count({ where: { solicitudId } })).resolves.toBe(2);
    await expect(db.prisma.desembolso.count()).resolves.toBe(1);
  });
});
