import { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { crearAppE2E, type AppE2E } from './support/app-e2e';
import { FakeClock } from './support/fake-clock';

const ANA = '001-010190-0001A';

function unCuerpoSolicitud(cedula = ANA) {
  return {
    cliente: {
      cedula,
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@correo.com',
      telefono: '88887777',
      fechaNacimiento: '1990-01-01',
    },
    empleo: {
      tipoEmpleo: 'ASALARIADO',
      empresa: 'Empresa S.A.',
      antiguedadLaboralAnios: 5,
      ingresoMensual: 25000,
    },
    credito: { monto: 10000, tasaAnual: 12, cantidadCuotas: 12, periodicidad: 'MENSUAL' },
  };
}

interface CreditoHttp {
  numeroCredito: string;
  estado: string;
  planPagos: { numero: number; cuota: number; capital: number; saldo: number }[];
}

describe('Créditos (e2e)', () => {
  const reloj = new FakeClock('2026-09-25T12:00:00Z');
  let e2e: AppE2E;
  let token: string;

  beforeAll(async () => {
    e2e = await crearAppE2E(reloj);
  });

  beforeEach(async () => {
    token = await e2e.reiniciarConAdmin();
  });

  afterAll(async () => {
    await e2e.app.close();
  });

  const post = (ruta: string, cuerpo: object) =>
    e2e.http().post(ruta).set('Authorization', `Bearer ${token}`).send(cuerpo);
  const consultar = (query: string) =>
    e2e.http().get(`/api/creditos${query}`).set('Authorization', `Bearer ${token}`);

  async function creditoAprobado(cedula = ANA): Promise<number> {
    const respuesta = await post('/api/solicitudes', unCuerpoSolicitud(cedula)).expect(201);
    const id = (respuesta.body as { id: number }).id;
    await post(`/api/comite/solicitudes/${id}/aprobar`, { observaciones: 'Cumple' }).expect(200);
    return id;
  }

  it('debe devolver los créditos del cliente con su plan de pagos', async () => {
    const id = await creditoAprobado();

    const respuesta = await consultar(`?cedula=${ANA}`).expect(200);

    expect(respuesta.body).toMatchObject([
      {
        numeroCredito: 'CR-2026-000001',
        solicitudId: id,
        estado: EstadoSolicitud.APROBADA,
        fechaAprobacion: '2026-09-25T12:00:00.000Z',
        cliente: { cedula: ANA, nombreCompleto: 'Ana Pérez' },
        monto: 10000,
        tasaAnual: 12,
        cantidadCuotas: 12,
        periodicidad: 'MENSUAL',
        plazoMeses: 12,
        cuotaNivelada: 888.49,
        desembolso: null,
      },
    ]);
  });

  it('debe devolver un plan de 12 cuotas que amortiza el monto y termina en saldo 0', async () => {
    await creditoAprobado();

    const [credito] = (await consultar(`?cedula=${ANA}`).expect(200)).body as CreditoHttp[];

    expect(credito?.planPagos).toHaveLength(12);
    expect(credito?.planPagos[0]).toEqual({
      numero: 1,
      fechaVencimiento: '2026-10-25T12:00:00.000Z',
      cuota: 888.49,
      capital: 788.49,
      interes: 100,
      saldo: 9211.51,
    });
    expect(credito?.planPagos.at(-1)).toMatchObject({ cuota: 888.47, saldo: 0 });
  });

  it('debe mostrar el desembolso cuando el crédito fue desembolsado', async () => {
    const id = await creditoAprobado();
    await post(`/api/desembolsos/${id}`, {
      banco: Banco.BANPRO,
      numeroCuenta: '000123456',
    }).expect(201);

    const respuesta = await consultar(`?cedula=${ANA}`).expect(200);

    expect(respuesta.body).toMatchObject([
      {
        estado: EstadoSolicitud.DESEMBOLSADA,
        desembolso: { banco: Banco.BANPRO, fechaDesembolso: '2026-09-25T12:00:00.000Z' },
      },
    ]);
  });

  it('debe no exponer el número de cuenta del desembolso', async () => {
    const id = await creditoAprobado();
    await post(`/api/desembolsos/${id}`, { banco: Banco.BANPRO, numeroCuenta: '000123456' });

    const respuesta = await consultar(`?cedula=${ANA}`).expect(200);

    expect(JSON.stringify(respuesta.body)).not.toContain('000123456');
  });

  it('debe devolver solo los créditos de la cédula consultada', async () => {
    await creditoAprobado(ANA);
    await creditoAprobado('001-150385-0007K');

    const respuesta = await consultar(`?cedula=${ANA}`).expect(200);

    expect(respuesta.body).toHaveLength(1);
  });

  it('debe aceptar la cédula en minúsculas', async () => {
    await creditoAprobado();

    const respuesta = await consultar('?cedula=001-010190-0001a').expect(200);

    expect(respuesta.body).toHaveLength(1);
  });

  it('debe devolver una lista vacía cuando la cédula no tiene créditos', async () => {
    const respuesta = await consultar('?cedula=001-010190-0099Z').expect(200);

    expect(respuesta.body).toEqual([]);
  });

  it.each([
    ['falta la cédula', ''],
    ['la cédula no tiene el formato', '?cedula=0010101900001A'],
  ])('debe responder 400 cuando %s', async (_caso, query) => {
    await consultar(query).expect(400);
  });

  it('debe responder 401 sin access token', async () => {
    await e2e.http().get(`/api/creditos?cedula=${ANA}`).expect(401);
  });
});
