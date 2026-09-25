import { UNIT_OF_WORK, type UnitOfWork } from '../../src/core/domain/unit-of-work';
import { PrismaTransactionContext } from '../../src/prisma/prisma-transaction-context';
import {
  abrirBaseDeDatosDePrueba,
  limpiarBaseDeDatos,
  type BaseDeDatosDePrueba,
} from './support/base-de-datos';
import { crearCliente } from './support/datos-prueba';

describe('PrismaUnitOfWork (integración con SQLite)', () => {
  let db: BaseDeDatosDePrueba;
  let unitOfWork: UnitOfWork;
  let contexto: PrismaTransactionContext;

  beforeAll(async () => {
    db = await abrirBaseDeDatosDePrueba();
    unitOfWork = db.app.get(UNIT_OF_WORK);
    contexto = db.app.get(PrismaTransactionContext);
  });

  beforeEach(async () => {
    await limpiarBaseDeDatos(db.prisma);
  });

  afterAll(async () => {
    await db.cerrar();
  });

  const crearClienteEnContexto = (cedula: string) =>
    contexto.cliente.cliente.create({
      data: {
        cedula,
        nombreCompleto: 'Cliente',
        correo: 'cliente@correo.com',
        telefono: '88888888',
        fechaNacimiento: new Date('1990-01-01T00:00:00Z'),
      },
    });

  it('debe confirmar todas las escrituras cuando la función termina bien', async () => {
    await unitOfWork.run(async () => {
      await crearClienteEnContexto('001-010190-0001A');
      await crearClienteEnContexto('001-010190-0002A');
    });

    await expect(db.prisma.cliente.count()).resolves.toBe(2);
  });

  it('debe revertir todas las escrituras cuando falla un paso intermedio', async () => {
    const operacion = unitOfWork.run(async () => {
      await crearClienteEnContexto('001-010190-0001A');
      throw new Error('fallo simulado');
    });

    await expect(operacion).rejects.toThrow('fallo simulado');
    await expect(db.prisma.cliente.count()).resolves.toBe(0);
  });

  it('debe revertir también las escrituras de un run anidado cuando falla el externo', async () => {
    const operacion = unitOfWork.run(async () => {
      await unitOfWork.run(() => crearClienteEnContexto('001-010190-0001A'));
      await crearClienteEnContexto('001-010190-0001A');
    });

    await expect(operacion).rejects.toMatchObject({ code: 'P2002' });
    await expect(db.prisma.cliente.count()).resolves.toBe(0);
  });

  it('debe usar el cliente sin transacción cuando no hay un run activo', async () => {
    await crearCliente(db.prisma);

    expect(contexto.enTransaccion).toBe(false);
    await expect(contexto.cliente.cliente.count()).resolves.toBe(1);
  });
});
