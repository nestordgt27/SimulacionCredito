import { EstadoSolicitud } from '@simulacion-credito/shared';
import { UNIT_OF_WORK, type UnitOfWork } from '../../src/core/domain/unit-of-work';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../src/modules/solicitudes/domain/solicitud.repository';
import { HOY, unaSolicitud } from '../support/solicitud-builders';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearUsuario } from './support/datos-prueba';

describe('PrismaSolicitudRepository (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;
  let repositorio: SolicitudRepository;
  let unitOfWork: UnitOfWork;
  let usuarioId: number;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
    repositorio = db.app.get(SOLICITUD_REPOSITORY);
    unitOfWork = db.app.get(UNIT_OF_WORK);
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
    usuarioId = (await crearUsuario(db.prisma)).id;
  });

  afterAll(async () => {
    await db.cerrar();
  });

  const guardar = (builder = unaSolicitud(), ahora = HOY) =>
    unitOfWork.run(() => repositorio.crear(builder.creadaPor(usuarioId).crear(ahora)));

  it('debe persistir la solicitud en centavos y puntos básicos con la cuota calculada', async () => {
    const guardada = await guardar();

    await expect(
      db.prisma.solicitud.findUniqueOrThrow({ where: { id: guardada.id } }),
    ).resolves.toMatchObject({
      montoSolicitadoCentavos: 1_000_000,
      tasaAnualBps: 1200,
      cuotaNiveladaCentavos: 88_849,
      ingresoMensualCentavos: 2_500_050,
      estado: EstadoSolicitud.PENDIENTE,
      creadaPorId: usuarioId,
      createdAt: HOY,
    });
  });

  it('debe registrar el historial de creación de PENDIENTE sin estado anterior', async () => {
    const guardada = await guardar();

    const historial = await db.prisma.solicitudHistorial.findMany({
      where: { solicitudId: guardada.id },
    });
    expect(historial).toEqual([
      expect.objectContaining({
        estadoAnterior: null,
        estadoNuevo: EstadoSolicitud.PENDIENTE,
        usuarioId,
        fecha: HOY,
      }),
    ]);
  });

  it('debe reutilizar y actualizar al cliente cuando ya existe la cédula', async () => {
    await guardar(unaSolicitud().conCedula('001-010190-0001A'));
    await guardar(unaSolicitud().conCedula('001-010190-0001A').conFechaNacimiento('1985-05-05'));

    const clientes = await db.prisma.cliente.findMany();
    expect(clientes).toHaveLength(1);
    expect(clientes[0]?.fechaNacimiento).toEqual(new Date('1985-05-05T00:00:00Z'));
    await expect(db.prisma.solicitud.count()).resolves.toBe(2);
  });

  it('debe no dejar al cliente guardado cuando falla la creación de la solicitud', async () => {
    const huerfana = unaSolicitud().conCedula('001-010190-0099Z').creadaPor(-1).crear();

    const guardarInvalida = unitOfWork.run(() => repositorio.crear(huerfana));

    await expect(guardarInvalida).rejects.toMatchObject({ code: 'P2003' });
    await expect(db.prisma.cliente.count()).resolves.toBe(0);
  });

  it('debe devolver la solicitud de dominio completa al listar', async () => {
    const guardada = await guardar();

    const [listada] = await repositorio.listar({});

    expect(listada).toMatchObject({
      id: guardada.id,
      cuotaNiveladaCentavos: 88_849,
      cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
    });
    expect(listada?.plazoMeses).toBe(12);
  });

  it('debe filtrar por estado y ordenar de la más reciente a la más antigua', async () => {
    const antigua = await guardar(unaSolicitud(), new Date('2026-09-20T10:00:00Z'));
    const reciente = await guardar(
      unaSolicitud().conCedula('001-010190-0002A'),
      new Date('2026-09-24T10:00:00Z'),
    );
    const aprobada = await guardar(unaSolicitud().conCedula('001-010190-0003A'));
    await db.prisma.solicitud.update({
      where: { id: aprobada.id },
      data: { estado: EstadoSolicitud.APROBADA },
    });

    const pendientes = await repositorio.listar({ estado: EstadoSolicitud.PENDIENTE });

    expect(pendientes.map((solicitud) => solicitud.id)).toEqual([reciente.id, antigua.id]);
  });

  it('debe listar todas las solicitudes cuando no se indica estado', async () => {
    await guardar();
    const aprobada = await guardar(unaSolicitud().conCedula('001-010190-0002A'));
    await db.prisma.solicitud.update({
      where: { id: aprobada.id },
      data: { estado: EstadoSolicitud.APROBADA },
    });

    await expect(repositorio.listar({})).resolves.toHaveLength(2);
  });
});
