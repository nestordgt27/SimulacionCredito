import { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { crearAppE2E, type AppE2E } from './support/app-e2e';
import { FakeClock } from './support/fake-clock';

const CUERPO_SOLICITUD = {
  cliente: {
    cedula: '001-010190-0001A',
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

const DATOS_BANCARIOS = { banco: Banco.BANPRO, numeroCuenta: '000123456' };

describe('Desembolsos (e2e)', () => {
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

  async function crearSolicitud(): Promise<number> {
    const respuesta = await post('/api/solicitudes', CUERPO_SOLICITUD).expect(201);
    return (respuesta.body as { id: number }).id;
  }

  async function crearSolicitudAprobada(): Promise<number> {
    const id = await crearSolicitud();
    await post(`/api/comite/solicitudes/${id}/aprobar`, { observaciones: 'Cumple' }).expect(200);
    return id;
  }

  const desembolsar = (solicitudId: number | string, cuerpo: object = DATOS_BANCARIOS) =>
    post(`/api/desembolsos/${solicitudId}`, cuerpo);

  it('debe desembolsar una solicitud APROBADA y responder 201 con los datos del desembolso', async () => {
    const id = await crearSolicitudAprobada();

    const respuesta = await desembolsar(id).expect(201);

    expect(respuesta.body).toEqual({
      solicitudId: id,
      estado: EstadoSolicitud.DESEMBOLSADA,
      desembolso: {
        numeroCredito: 'CR-2026-000001',
        banco: Banco.BANPRO,
        numeroCuenta: '000123456',
        monto: 10000,
        fechaDesembolso: '2026-09-25T12:00:00.000Z',
      },
    });
  });

  it('debe dejar la solicitud en DESEMBOLSADA y el desembolso guardado', async () => {
    const id = await crearSolicitudAprobada();

    await desembolsar(id).expect(201);

    await expect(e2e.prisma.solicitud.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({
      estado: EstadoSolicitud.DESEMBOLSADA,
    });
    await expect(e2e.prisma.desembolso.findFirstOrThrow()).resolves.toMatchObject({
      banco: Banco.BANPRO,
      numeroCuenta: '000123456',
      montoCentavos: 1_000_000,
    });
  });

  it.each(Object.values(Banco))('debe aceptar el banco %s', async (banco) => {
    const id = await crearSolicitudAprobada();

    await desembolsar(id, { banco, numeroCuenta: '12345678' }).expect(201);
  });

  it('debe responder 409 cuando la solicitud está PENDIENTE', async () => {
    const id = await crearSolicitud();

    const respuesta = await desembolsar(id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toMatchObject({ error: 'TRANSICION_INVALIDA' });
    await expect(e2e.prisma.desembolso.count()).resolves.toBe(0);
  });

  it('debe responder 409 cuando la solicitud está RECHAZADA', async () => {
    const id = await crearSolicitud();
    await post(`/api/comite/solicitudes/${id}/rechazar`, {}).expect(200);

    const respuesta = await desembolsar(id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toMatchObject({ error: 'TRANSICION_INVALIDA' });
  });

  it('debe responder 409 al desembolsar dos veces', async () => {
    const id = await crearSolicitudAprobada();
    await desembolsar(id).expect(201);

    await desembolsar(id).expect(409);

    await expect(e2e.prisma.desembolso.count()).resolves.toBe(1);
  });

  it('debe responder 404 cuando la solicitud no existe', async () => {
    await desembolsar(999_999).expect(404);
  });

  it.each([
    ['el banco no está en la lista', { banco: 'CITIBANK', numeroCuenta: '000123456' }],
    ['falta el banco', { numeroCuenta: '000123456' }],
    ['la cuenta tiene letras', { banco: Banco.BANPRO, numeroCuenta: '12AB5678' }],
    ['la cuenta es muy corta', { banco: Banco.BANPRO, numeroCuenta: '12345' }],
    ['falta la cuenta', { banco: Banco.BANPRO }],
    ['la cuenta es un número y no texto', { banco: Banco.BANPRO, numeroCuenta: 123456 }],
  ])('debe responder 400 cuando %s', async (_caso, cuerpo) => {
    const id = await crearSolicitudAprobada();

    await desembolsar(id, cuerpo).expect(400);
  });

  it('debe responder 400 cuando el id no es numérico', async () => {
    await desembolsar('abc').expect(400);
  });

  it('debe responder 401 sin access token', async () => {
    await e2e.http().post('/api/desembolsos/1').send(DATOS_BANCARIOS).expect(401);
  });
});
