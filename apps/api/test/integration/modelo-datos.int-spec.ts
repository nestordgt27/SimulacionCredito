import { Banco, EstadoSolicitud, generarPlanPagos, Periodicidad } from '@simulacion-credito/shared';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearCliente, crearCredito, crearSolicitud, crearUsuario } from './support/datos-prueba';

const aCentavos = (valor: number) => Math.round(valor * 100);

describe('Modelo de datos (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
  });

  afterAll(async () => {
    await db.cerrar();
  });

  it('debe crear la solicitud en estado PENDIENTE cuando no se indica estado', async () => {
    const solicitud = await crearSolicitud(db.prisma);

    expect(solicitud.estado).toBe(EstadoSolicitud.PENDIENTE);
  });

  it('debe persistir el plan de generarPlanPagos en centavos con saldo final 0', async () => {
    const credito = await crearCredito(db.prisma);
    const plan = generarPlanPagos({
      monto: credito.montoCentavos / 100,
      tasaAnual: credito.tasaAnualBps / 100,
      cuotas: credito.cantidadCuotas,
      periodicidad: Periodicidad.MENSUAL,
      fechaInicio: credito.fechaAprobacion,
    });

    await db.prisma.cuotaPlan.createMany({
      data: plan.map((fila) => ({
        creditoId: credito.id,
        numero: fila.numero,
        fechaVencimiento: fila.fechaVencimiento,
        cuotaCentavos: aCentavos(fila.cuota),
        capitalCentavos: aCentavos(fila.capital),
        interesCentavos: aCentavos(fila.interes),
        saldoCentavos: aCentavos(fila.saldo),
      })),
    });
    const cuotas = await db.prisma.cuotaPlan.findMany({
      where: { creditoId: credito.id },
      orderBy: { numero: 'asc' },
    });

    expect(cuotas).toHaveLength(credito.cantidadCuotas);
    expect(cuotas.reduce((total, cuota) => total + cuota.capitalCentavos, 0)).toBe(
      credito.montoCentavos,
    );
    expect(cuotas.at(-1)?.saldoCentavos).toBe(0);
    expect(cuotas[0]?.fechaVencimiento.toISOString()).toBe('2026-10-25T00:00:00.000Z');
  });

  it('debe rechazar dos cuotas con el mismo número en un crédito', async () => {
    const credito = await crearCredito(db.prisma);
    const cuota = {
      creditoId: credito.id,
      numero: 1,
      fechaVencimiento: new Date('2026-10-25T00:00:00Z'),
      cuotaCentavos: 88_849,
      capitalCentavos: 78_849,
      interesCentavos: 10_000,
      saldoCentavos: 921_151,
    };
    await db.prisma.cuotaPlan.create({ data: cuota });

    const duplicar = db.prisma.cuotaPlan.create({ data: cuota });

    await expect(duplicar).rejects.toMatchObject({ code: 'P2002' });
  });

  it('debe rechazar un segundo crédito para la misma solicitud', async () => {
    const { solicitudId } = await crearCredito(db.prisma);

    const duplicar = crearCredito(db.prisma, { solicitudId });

    await expect(duplicar).rejects.toMatchObject({ code: 'P2002' });
  });

  it('debe rechazar un segundo desembolso del mismo crédito', async () => {
    const credito = await crearCredito(db.prisma);
    const usuario = await crearUsuario(db.prisma);
    const desembolso = {
      creditoId: credito.id,
      banco: Banco.BANPRO,
      numeroCuenta: '0012345678',
      montoCentavos: credito.montoCentavos,
      desembolsadoPorId: usuario.id,
    };
    await db.prisma.desembolso.create({ data: desembolso });

    const duplicar = db.prisma.desembolso.create({ data: desembolso });

    await expect(duplicar).rejects.toMatchObject({ code: 'P2002' });
  });

  it('debe rechazar una cédula duplicada', async () => {
    const { cedula } = await crearCliente(db.prisma);

    const duplicar = crearCliente(db.prisma, { cedula });

    await expect(duplicar).rejects.toMatchObject({ code: 'P2002' });
  });

  it('debe impedir borrar un cliente que tiene solicitudes', async () => {
    const { clienteId } = await crearSolicitud(db.prisma);

    const borrar = db.prisma.cliente.delete({ where: { id: clienteId } });

    await expect(borrar).rejects.toMatchObject({ code: 'P2003' });
  });

  it('debe preservar los ceros a la izquierda del número de cuenta', async () => {
    const credito = await crearCredito(db.prisma);
    const usuario = await crearUsuario(db.prisma);

    const desembolso = await db.prisma.desembolso.create({
      data: {
        creditoId: credito.id,
        banco: Banco.LAFISE,
        numeroCuenta: '000123',
        montoCentavos: credito.montoCentavos,
        desembolsadoPorId: usuario.id,
      },
    });

    expect(desembolso.numeroCuenta).toBe('000123');
  });

  it('debe borrar los refresh tokens cuando se borra el usuario', async () => {
    const usuario = await crearUsuario(db.prisma);
    await db.prisma.refreshToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: 'hash',
        familiaId: 'familia',
        expiraEn: new Date('2026-10-02T00:00:00Z'),
      },
    });

    await db.prisma.usuario.delete({ where: { id: usuario.id } });

    await expect(db.prisma.refreshToken.count()).resolves.toBe(0);
  });
});
