import { EstadoSolicitud } from '@simulacion-credito/shared';
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
  credito: { monto: 10000, tasaAnual: 12, cantidadCuotas: 24, periodicidad: 'QUINCENAL' },
};

describe('Comité (e2e)', () => {
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

  const conToken = <T extends { set(campo: string, valor: string): T }>(peticion: T): T =>
    peticion.set('Authorization', `Bearer ${token}`);

  async function crearSolicitud(cedula = '001-010190-0001A'): Promise<number> {
    const respuesta = await conToken(e2e.http().post('/api/solicitudes'))
      .send({ ...CUERPO_SOLICITUD, cliente: { ...CUERPO_SOLICITUD.cliente, cedula } })
      .expect(201);
    return (respuesta.body as { id: number }).id;
  }

  const obtener = (id: number | string) =>
    conToken(e2e.http().get(`/api/comite/solicitudes/${id}`));
  const aprobar = (id: number, observaciones?: string) =>
    conToken(e2e.http().post(`/api/comite/solicitudes/${id}/aprobar`)).send({ observaciones });
  const rechazar = (id: number, cuerpo: Record<string, unknown> = {}) =>
    conToken(e2e.http().post(`/api/comite/solicitudes/${id}/rechazar`)).send(cuerpo);

  describe('GET /api/comite/solicitudes/:id', () => {
    it('debe devolver solo los 7 campos del enunciado', async () => {
      const id = await crearSolicitud();

      const respuesta = await obtener(id).expect(200);

      expect(respuesta.body).toStrictEqual({
        cedula: '001-010190-0001A',
        nombreCompleto: 'Ana Pérez',
        edad: 36,
        cantidadCuotas: 24,
        periodicidad: 'QUINCENAL',
        plazoMeses: 12,
        monto: 10000,
      });
    });

    it('debe responder 404 SOLICITUD_NO_ENCONTRADA cuando no existe', async () => {
      const respuesta = await obtener(999_999);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body).toMatchObject({ error: 'SOLICITUD_NO_ENCONTRADA' });
    });

    it('debe responder 400 cuando el id no es numérico', async () => {
      await obtener('abc').expect(400);
    });

    it('debe responder 401 sin access token', async () => {
      await e2e.http().get('/api/comite/solicitudes/1').expect(401);
    });
  });

  describe('POST /api/comite/solicitudes/:id/aprobar', () => {
    it('debe aprobar y devolver el crédito con su número', async () => {
      const id = await crearSolicitud();

      const respuesta = await aprobar(id, 'Cumple con los requisitos').expect(200);

      expect(respuesta.body).toMatchObject({
        solicitudId: id,
        estado: EstadoSolicitud.APROBADA,
        observaciones: 'Cumple con los requisitos',
        credito: {
          numeroCredito: 'CR-2026-000001',
          fechaAprobacion: '2026-09-25T12:00:00.000Z',
          monto: 10000,
          cantidadCuotas: 24,
          periodicidad: 'QUINCENAL',
          // Referencia independiente: 443,2061 (10 000 al 12 % en 24 cuotas quincenales)
          cuotaNivelada: 443.21,
        },
      });
    });

    it('debe crear exactamente N cuotas quincenales desde la fecha de aprobación', async () => {
      const id = await crearSolicitud();

      await aprobar(id, 'Cumple').expect(200);

      const cuotas = await e2e.prisma.cuotaPlan.findMany({ orderBy: { numero: 'asc' } });
      expect(cuotas).toHaveLength(24);
      expect(cuotas[0]?.fechaVencimiento.toISOString()).toBe('2026-10-10T12:00:00.000Z');
      expect(cuotas.at(-1)?.saldoCentavos).toBe(0);
    });

    it('debe asignar números de crédito consecutivos', async () => {
      const primera = await crearSolicitud('001-010190-0001A');
      const segunda = await crearSolicitud('001-010190-0002A');

      await aprobar(primera, 'Cumple').expect(200);
      const respuesta = await aprobar(segunda, 'Cumple').expect(200);

      expect(respuesta.body).toMatchObject({ credito: { numeroCredito: 'CR-2026-000002' } });
    });

    it('debe responder 422 OBSERVACIONES_REQUERIDAS sin dejar nada a medias', async () => {
      const id = await crearSolicitud();

      const respuesta = await aprobar(id, '   ');

      expect(respuesta.status).toBe(422);
      expect(respuesta.body).toMatchObject({ error: 'OBSERVACIONES_REQUERIDAS' });
      await obtener(id).expect(200);
      await expect(e2e.prisma.credito.count()).resolves.toBe(0);
      await expect(
        e2e.prisma.solicitud.findUniqueOrThrow({ where: { id } }),
      ).resolves.toMatchObject({ estado: EstadoSolicitud.PENDIENTE });
    });

    it('debe responder 400 cuando no se envían observaciones', async () => {
      const id = await crearSolicitud();

      await aprobar(id).expect(400);
    });

    it('debe responder 409 TRANSICION_INVALIDA al aprobar dos veces', async () => {
      const id = await crearSolicitud();
      await aprobar(id, 'Cumple').expect(200);

      const respuesta = await aprobar(id, 'Otra vez');

      expect(respuesta.status).toBe(409);
      expect(respuesta.body).toMatchObject({ error: 'TRANSICION_INVALIDA' });
      await expect(e2e.prisma.credito.count()).resolves.toBe(1);
    });

    it('debe responder 409 al aprobar una solicitud rechazada', async () => {
      const id = await crearSolicitud();
      await rechazar(id).expect(200);

      await aprobar(id, 'Cumple').expect(409);
    });

    it('debe responder 404 cuando la solicitud no existe', async () => {
      await aprobar(999_999, 'Cumple').expect(404);
    });
  });

  describe('POST /api/comite/solicitudes/:id/rechazar', () => {
    it('debe rechazar guardando las observaciones y sin crear crédito', async () => {
      const id = await crearSolicitud();

      const respuesta = await rechazar(id, { observaciones: 'Ingresos insuficientes' }).expect(200);

      expect(respuesta.body).toEqual({
        solicitudId: id,
        estado: EstadoSolicitud.RECHAZADA,
        observaciones: 'Ingresos insuficientes',
      });
      await expect(e2e.prisma.credito.count()).resolves.toBe(0);
    });

    it('debe permitir rechazar sin observaciones', async () => {
      const id = await crearSolicitud();

      const respuesta = await rechazar(id).expect(200);

      expect(respuesta.body).toMatchObject({ observaciones: null });
    });

    it('debe responder 409 al rechazar una solicitud aprobada', async () => {
      const id = await crearSolicitud();
      await aprobar(id, 'Cumple').expect(200);

      await rechazar(id).expect(409);
    });

    it('debe sacar la solicitud del listado de pendientes', async () => {
      const id = await crearSolicitud();
      await rechazar(id).expect(200);

      const respuesta = await conToken(e2e.http().get('/api/solicitudes?estado=PENDIENTE')).expect(
        200,
      );

      expect(respuesta.body).toEqual([]);
    });
  });
});
