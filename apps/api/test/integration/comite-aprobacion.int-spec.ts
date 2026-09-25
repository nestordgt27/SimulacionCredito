import { EstadoSolicitud } from '@simulacion-credito/shared';
import { AprobarSolicitudUseCase } from '../../src/modules/comite/application/aprobar-solicitud.use-case';
import { RechazarSolicitudUseCase } from '../../src/modules/comite/application/rechazar-solicitud.use-case';
import type { Credito } from '../../src/modules/creditos/domain/credito';
import { CREDITO_REPOSITORY } from '../../src/modules/creditos/domain/credito.repository';
import { PrismaCreditoRepository } from '../../src/modules/creditos/infrastructure/prisma-credito.repository';
import { TransicionInvalidaError } from '../../src/modules/solicitudes/domain/errores';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../src/modules/solicitudes/domain/solicitud.repository';
import { UNIT_OF_WORK, type UnitOfWork } from '../../src/core/domain/unit-of-work';
import { unaSolicitud } from '../support/solicitud-builders';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearUsuario } from './support/datos-prueba';

// Inyecta un fallo real de la base DURANTE la creación de las cuotas: repite la primera cuota,
// lo que viola UNIQUE(creditoId, numero) en el createMany, después de insertar el crédito.
class CreditoRepositoryQueFallaEnCuotas extends PrismaCreditoRepository {
  override crear(credito: Credito): Promise<void> {
    return super.crear({ ...credito, cuotas: [...credito.cuotas, credito.cuotas[0]] });
  }
}

async function sembrarSolicitudPendiente(db: BaseDeDatosDePrueba, cedula = '001-010190-0001A') {
  const usuarioId = (await crearUsuario(db.prisma)).id;
  const repositorio = db.app.get<SolicitudRepository>(SOLICITUD_REPOSITORY);
  const unitOfWork = db.app.get<UnitOfWork>(UNIT_OF_WORK);
  const solicitud = await unitOfWork.run(() =>
    repositorio.crear(unaSolicitud().conCedula(cedula).creadaPor(usuarioId).crear()),
  );
  return { solicitudId: solicitud.id, usuarioId };
}

describe('Aprobación del comité (integración con SQLite)', () => {
  describe('con la base funcionando', () => {
    let db: BaseDeDatosDePrueba;
    let aprobar: AprobarSolicitudUseCase;
    let rechazar: RechazarSolicitudUseCase;

    beforeAll(async () => {
      db = await abrirBaseDeDatosDePrueba();
      aprobar = db.app.get(AprobarSolicitudUseCase);
      rechazar = db.app.get(RechazarSolicitudUseCase);
    });

    beforeEach(async () => {
      await limpiarBaseDeDatos(db.prisma);
    });

    afterAll(async () => {
      await db.cerrar();
    });

    it('debe aprobar, crear el crédito y exactamente N cuotas en una transacción', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);

      const resultado = await aprobar.ejecutar({
        solicitudId,
        observaciones: 'Cumple',
        evaluadorId: usuarioId,
      });

      const solicitud = await db.prisma.solicitud.findUniqueOrThrow({ where: { id: solicitudId } });
      const credito = await db.prisma.credito.findUniqueOrThrow({
        where: { solicitudId },
        include: { cuotas: { orderBy: { numero: 'asc' } } },
      });
      expect(solicitud).toMatchObject({
        estado: EstadoSolicitud.APROBADA,
        observaciones: 'Cumple',
        evaluadaPorId: usuarioId,
      });
      expect(credito.numeroCredito).toBe(resultado.credito.numeroCredito);
      expect(credito.cuotas).toHaveLength(12);
      expect(credito.cuotas.reduce((total, cuota) => total + cuota.capitalCentavos, 0)).toBe(
        credito.montoCentavos,
      );
      expect(credito.cuotas.at(-1)?.saldoCentavos).toBe(0);
    });

    it('debe registrar la transición PENDIENTE → APROBADA en el historial', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);

      await aprobar.ejecutar({ solicitudId, observaciones: 'Cumple', evaluadorId: usuarioId });

      const historial = await db.prisma.solicitudHistorial.findMany({
        where: { solicitudId },
        orderBy: { id: 'asc' },
      });
      expect(historial.map((h) => [h.estadoAnterior, h.estadoNuevo, h.comentario])).toEqual([
        [null, EstadoSolicitud.PENDIENTE, null],
        [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA, 'Cumple'],
      ]);
    });

    it('debe numerar los créditos de forma incremental', async () => {
      const primera = await sembrarSolicitudPendiente(db, '001-010190-0001A');
      const segunda = await sembrarSolicitudPendiente(db, '001-010190-0002A');

      const a = await aprobar.ejecutar({
        solicitudId: primera.solicitudId,
        observaciones: 'Cumple',
        evaluadorId: primera.usuarioId,
      });
      const b = await aprobar.ejecutar({
        solicitudId: segunda.solicitudId,
        observaciones: 'Cumple',
        evaluadorId: segunda.usuarioId,
      });

      expect([a.credito.numeroCredito, b.credito.numeroCredito]).toEqual([
        expect.stringMatching(/^CR-\d{4}-000001$/),
        expect.stringMatching(/^CR-\d{4}-000002$/),
      ]);
    });

    it('debe rechazar una segunda aprobación sin crear otro crédito', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);
      const comando = { solicitudId, observaciones: 'Cumple', evaluadorId: usuarioId };
      await aprobar.ejecutar(comando);

      await expect(aprobar.ejecutar(comando)).rejects.toThrow(TransicionInvalidaError);

      await expect(db.prisma.credito.count()).resolves.toBe(1);
      await expect(db.prisma.cuotaPlan.count()).resolves.toBe(12);
    });

    it('debe rechazar la solicitud sin crear crédito', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);

      await rechazar.ejecutar({ solicitudId, observaciones: null, evaluadorId: usuarioId });

      await expect(
        db.prisma.solicitud.findUniqueOrThrow({ where: { id: solicitudId } }),
      ).resolves.toMatchObject({ estado: EstadoSolicitud.RECHAZADA });
      await expect(db.prisma.credito.count()).resolves.toBe(0);
    });

    it('debe no registrar la evaluación cuando el estado ya cambió (concurrencia)', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);
      const repositorio = db.app.get<SolicitudRepository>(SOLICITUD_REPOSITORY);
      const pendiente = (await repositorio.buscarPorId(solicitudId))!;
      await db.prisma.solicitud.update({
        where: { id: solicitudId },
        data: { estado: EstadoSolicitud.RECHAZADA },
      });

      const registrada = await repositorio.registrarEvaluacion(
        pendiente.aprobar('Cumple', usuarioId, new Date()),
        EstadoSolicitud.PENDIENTE,
      );

      expect(registrada).toBe(false);
      await expect(db.prisma.solicitudHistorial.count({ where: { solicitudId } })).resolves.toBe(1);
    });
  });

  describe('cuando falla la creación de las cuotas', () => {
    let db: BaseDeDatosDePrueba;

    beforeAll(async () => {
      db = await abrirBaseDeDatosDePrueba((builder) =>
        builder.overrideProvider(CREDITO_REPOSITORY).useClass(CreditoRepositoryQueFallaEnCuotas),
      );
    });

    beforeEach(async () => {
      await limpiarBaseDeDatos(db.prisma);
    });

    afterAll(async () => {
      await db.cerrar();
    });

    it('debe revertir todo: estado, historial, crédito, cuotas y número consumido', async () => {
      const { solicitudId, usuarioId } = await sembrarSolicitudPendiente(db);
      const aprobar = db.app.get(AprobarSolicitudUseCase);

      const aprobacion = aprobar.ejecutar({
        solicitudId,
        observaciones: 'Cumple',
        evaluadorId: usuarioId,
      });

      await expect(aprobacion).rejects.toMatchObject({ code: 'P2002' });
      await expect(
        db.prisma.solicitud.findUniqueOrThrow({ where: { id: solicitudId } }),
      ).resolves.toMatchObject({
        estado: EstadoSolicitud.PENDIENTE,
        observaciones: null,
        evaluadaPorId: null,
        fechaEvaluacion: null,
      });
      await expect(db.prisma.solicitudHistorial.count({ where: { solicitudId } })).resolves.toBe(1);
      await expect(db.prisma.credito.count()).resolves.toBe(0);
      await expect(db.prisma.cuotaPlan.count()).resolves.toBe(0);
      await expect(db.prisma.secuencia.count()).resolves.toBe(0);
    });
  });
});
