import { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { UNIT_OF_WORK, type UnitOfWork } from '../../src/core/domain/unit-of-work';
import { AprobarSolicitudUseCase } from '../../src/modules/comite/application/aprobar-solicitud.use-case';
import {
  CONSULTA_CREDITOS,
  type ConsultaCreditos,
} from '../../src/modules/creditos/domain/consulta-creditos';
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

const ANA = '001-010190-0001A';
const LUIS = '001-150385-0007K';

describe('PrismaConsultaCreditos (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;
  let consulta: ConsultaCreditos;
  let usuarioId: number;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
    consulta = db.app.get(CONSULTA_CREDITOS);
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
    usuarioId = (await crearUsuario(db.prisma)).id;
  });

  afterAll(async () => {
    await db.cerrar();
  });

  async function solicitudAprobada(cedula: string): Promise<number> {
    const repositorio = db.app.get<SolicitudRepository>(SOLICITUD_REPOSITORY);
    const { id } = await db.app
      .get<UnitOfWork>(UNIT_OF_WORK)
      .run(() => repositorio.crear(unaSolicitud().conCedula(cedula).creadaPor(usuarioId).crear()));
    await db.app
      .get(AprobarSolicitudUseCase)
      .ejecutar({ solicitudId: id, observaciones: 'Cumple', evaluadorId: usuarioId });
    return id;
  }

  it('debe devolver solo los créditos de la cédula consultada', async () => {
    const deAna = await solicitudAprobada(ANA);
    await solicitudAprobada(LUIS);

    const creditos = await consulta.porCedula(ANA);

    expect(creditos.map((credito) => credito.solicitudId)).toEqual([deAna]);
    expect(creditos[0]?.cliente).toEqual({ cedula: ANA, nombreCompleto: 'Ana Pérez' });
  });

  it('debe incluir el plan completo ordenado por número de cuota', async () => {
    await solicitudAprobada(ANA);

    const [credito] = await consulta.porCedula(ANA);

    expect(credito?.cuotas.map((cuota) => cuota.numero)).toEqual(
      Array.from({ length: 12 }, (_, indice) => indice + 1),
    );
    expect(credito?.cuotas.reduce((total, cuota) => total + cuota.capitalCentavos, 0)).toBe(
      credito?.montoCentavos,
    );
  });

  it('debe informar el estado de la solicitud y el desembolso cuando existe', async () => {
    const id = await solicitudAprobada(ANA);
    await db.app.get(DesembolsarCreditoUseCase).ejecutar({
      solicitudId: id,
      banco: Banco.LAFISE,
      numeroCuenta: '000123456',
      usuarioId,
    });

    const [credito] = await consulta.porCedula(ANA);

    expect(credito).toMatchObject({
      estado: EstadoSolicitud.DESEMBOLSADA,
      desembolso: { banco: Banco.LAFISE, fechaDesembolso: expect.any(Date) as Date },
    });
  });

  it('debe devolver desembolso null cuando el crédito aún no se desembolsa', async () => {
    await solicitudAprobada(ANA);

    const [credito] = await consulta.porCedula(ANA);

    expect(credito).toMatchObject({ estado: EstadoSolicitud.APROBADA, desembolso: null });
  });

  it('debe devolver varios créditos del mismo cliente del más reciente al más antiguo', async () => {
    const primero = await solicitudAprobada(ANA);
    const segundo = await solicitudAprobada(ANA);

    const creditos = await consulta.porCedula(ANA);

    expect(creditos.map((credito) => credito.solicitudId)).toEqual([segundo, primero]);
  });

  it('debe no incluir solicitudes que no tienen crédito', async () => {
    const repositorio = db.app.get<SolicitudRepository>(SOLICITUD_REPOSITORY);
    await db.app
      .get<UnitOfWork>(UNIT_OF_WORK)
      .run(() => repositorio.crear(unaSolicitud().conCedula(ANA).creadaPor(usuarioId).crear()));

    await expect(consulta.porCedula(ANA)).resolves.toEqual([]);
  });
});
