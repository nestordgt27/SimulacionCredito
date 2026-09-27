import { EstadoSolicitud } from '@simulacion-credito/shared';
import { crearAppE2E, type AppE2E } from './support/app-e2e';
import { FakeClock } from './support/fake-clock';

interface CuerpoSolicitud {
  cliente: Record<string, unknown>;
  empleo: Record<string, unknown>;
  credito: Record<string, unknown>;
}

function unCuerpo(cambios: Partial<CuerpoSolicitud> = {}): CuerpoSolicitud {
  return {
    cliente: {
      cedula: '001-010190-0001a',
      nombreCompleto: '  Ana Pérez ',
      correo: 'Ana@Correo.com',
      telefono: '88887777',
      fechaNacimiento: '1990-01-01',
      ...cambios.cliente,
    },
    empleo: {
      tipoEmpleo: 'ASALARIADO',
      empresa: 'Empresa S.A.',
      antiguedadLaboralAnios: 5,
      ingresoMensual: 25000.5,
      ...cambios.empleo,
    },
    credito: {
      monto: 10000,
      tasaAnual: 12,
      cantidadCuotas: 12,
      periodicidad: 'MENSUAL',
      ...cambios.credito,
    },
  };
}

describe('Solicitudes (e2e)', () => {
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

  const crear = (cuerpo: CuerpoSolicitud) =>
    e2e.http().post('/api/solicitudes').set('Authorization', `Bearer ${token}`).send(cuerpo);

  const listar = (query = '') =>
    e2e.http().get(`/api/solicitudes${query}`).set('Authorization', `Bearer ${token}`);

  describe('POST /api/solicitudes', () => {
    it('debe responder 401 cuando no hay access token', async () => {
      await e2e.http().post('/api/solicitudes').send(unCuerpo()).expect(401);
    });

    it('debe crear la solicitud PENDIENTE y devolver la cuota calculada por el servidor', async () => {
      const respuesta = await crear(unCuerpo()).expect(201);

      expect(respuesta.body).toMatchObject({
        estado: EstadoSolicitud.PENDIENTE,
        cliente: { edad: 36, fechaNacimiento: '1990-01-01' },
        credito: { monto: 10000, tasaAnual: 12, plazoMeses: 12, cuotaNivelada: 888.49 },
      });
    });

    it('debe ignorar la cuota que envía el frontend y guardar la recalculada', async () => {
      const respuesta = await crear(unCuerpo({ credito: { cuotaNivelada: 1 } })).expect(201);

      const guardada = await e2e.prisma.solicitud.findUniqueOrThrow({
        where: { id: (respuesta.body as { id: number }).id },
      });
      expect(respuesta.body).toMatchObject({ credito: { cuotaNivelada: 888.49 } });
      expect(guardada.cuotaNiveladaCentavos).toBe(88_849);
    });

    it('debe normalizar cédula, nombre y correo del cliente', async () => {
      const respuesta = await crear(unCuerpo()).expect(201);

      expect(respuesta.body).toMatchObject({
        cliente: {
          cedula: '001-010190-0001A',
          nombreCompleto: 'Ana Pérez',
          correo: 'ana@correo.com',
        },
      });
    });

    it('debe registrar al usuario autenticado como creador', async () => {
      await crear(unCuerpo()).expect(201);

      const [solicitud] = await e2e.prisma.solicitud.findMany({ include: { creadaPor: true } });
      expect(solicitud?.creadaPor.username).toBe('admin');
    });

    it('debe aceptar a un cliente con exactamente 80 años', async () => {
      await crear(unCuerpo({ cliente: { fechaNacimiento: '1945-09-26' } })).expect(201);
    });

    it('debe responder 422 EDAD_NO_PERMITIDA cuando el cliente tiene más de 80 años', async () => {
      const respuesta = await crear(unCuerpo({ cliente: { fechaNacimiento: '1945-09-25' } }));

      expect(respuesta.status).toBe(422);
      expect(respuesta.body).toMatchObject({ error: 'EDAD_NO_PERMITIDA' });
      await expect(e2e.prisma.solicitud.count()).resolves.toBe(0);
    });

    it('debe responder 422 cuando la fecha de nacimiento es futura', async () => {
      const respuesta = await crear(unCuerpo({ cliente: { fechaNacimiento: '2027-01-01' } }));

      expect(respuesta.status).toBe(422);
      expect(respuesta.body).toMatchObject({ error: 'FECHA_NACIMIENTO_INVALIDA' });
    });

    it.each([
      ['la tasa tiene 3 decimales', { credito: { tasaAnual: 12.555 } }],
      ['el monto tiene 3 decimales', { credito: { monto: 100.001 } }],
      ['el monto es 0', { credito: { monto: 0 } }],
      ['las cuotas no son enteras', { credito: { cantidadCuotas: 1.5 } }],
      ['la periodicidad no existe', { credito: { periodicidad: 'SEMANAL' } }],
      ['la cédula no tiene el formato', { cliente: { cedula: '0010101900001A' } }],
      ['el correo no es válido', { cliente: { correo: 'no-es-correo' } }],
      ['la fecha de nacimiento no es una fecha', { cliente: { fechaNacimiento: '1990-02-30' } }],
      ['el tipo de empleo no existe', { empleo: { tipoEmpleo: 'JUBILADO' } }],
    ])('debe responder 400 cuando %s', async (_caso, cambios) => {
      await crear(unCuerpo(cambios)).expect(400);
    });

    it('debe responder 400 cuando falta la sección de crédito', async () => {
      const { cliente, empleo } = unCuerpo();

      await e2e
        .http()
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${token}`)
        .send({ cliente, empleo })
        .expect(400);
    });
  });

  describe('GET /api/solicitudes', () => {
    it('debe responder 401 cuando no hay access token', async () => {
      await e2e.http().get('/api/solicitudes').expect(401);
    });

    it('debe listar solo las solicitudes PENDIENTE cuando se filtra por estado', async () => {
      await crear(unCuerpo()).expect(201);
      const otra = await crear(unCuerpo({ cliente: { cedula: '001-010190-0002A' } })).expect(201);
      await e2e.prisma.solicitud.update({
        where: { id: (otra.body as { id: number }).id },
        data: { estado: EstadoSolicitud.RECHAZADA },
      });

      const respuesta = await listar('?estado=PENDIENTE').expect(200);

      expect(respuesta.body).toMatchObject([
        {
          estado: EstadoSolicitud.PENDIENTE,
          cliente: { cedula: '001-010190-0001A', edad: 36 },
          credito: { cuotaNivelada: 888.49, plazoMeses: 12 },
        },
      ]);
    });

    it('debe listar todas las solicitudes cuando no se indica estado', async () => {
      await crear(unCuerpo()).expect(201);
      await crear(unCuerpo({ cliente: { cedula: '001-010190-0002A' } })).expect(201);

      const respuesta = await listar().expect(200);

      expect(respuesta.body).toHaveLength(2);
    });

    it('debe responder 400 cuando el estado no existe', async () => {
      await listar('?estado=CUALQUIERA').expect(400);
    });
  });
});
