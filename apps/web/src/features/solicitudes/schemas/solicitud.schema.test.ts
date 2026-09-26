import { crearSolicitudSchema, edadSegunFecha, type SolicitudFormulario } from './solicitud.schema';

const HOY = new Date('2026-09-25T12:00:00Z');
const schema = crearSolicitudSchema(HOY);

function unaSolicitud(
  cambios: { [K in keyof SolicitudFormulario]?: Partial<SolicitudFormulario[K]> } = {},
): SolicitudFormulario {
  return {
    cliente: {
      cedula: '001-010190-0001A',
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@correo.com',
      telefono: '88887777',
      fechaNacimiento: '1990-01-01',
      ...cambios.cliente,
    },
    empleo: {
      tipoEmpleo: 'ASALARIADO',
      empresa: 'Empresa S.A.',
      antiguedadLaboralAnios: 5,
      ingresoMensual: 25000,
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

const mensajes = (datos: SolicitudFormulario) => {
  const resultado = schema.safeParse(datos);
  return resultado.success ? [] : resultado.error.issues.map((issue) => issue.message);
};

describe('crearSolicitudSchema', () => {
  it('debe aceptar una solicitud válida', () => {
    expect(mensajes(unaSolicitud())).toEqual([]);
  });

  it('debe normalizar la cédula a mayúsculas y el correo a minúsculas', () => {
    const datos = schema.parse(
      unaSolicitud({ cliente: { cedula: ' 001-010190-0001a ', correo: ' Ana@Correo.COM ' } }),
    );

    expect(datos.cliente).toMatchObject({ cedula: '001-010190-0001A', correo: 'ana@correo.com' });
  });

  it('debe aceptar a un cliente con exactamente 80 años', () => {
    expect(mensajes(unaSolicitud({ cliente: { fechaNacimiento: '1945-09-26' } }))).toEqual([]);
  });

  it('debe rechazar a un cliente con más de 80 años indicando su edad', () => {
    expect(mensajes(unaSolicitud({ cliente: { fechaNacimiento: '1945-09-25' } }))).toEqual([
      'El cliente tiene 81 años; la edad máxima es 80',
    ]);
  });

  it.each([
    [
      'la fecha es futura',
      { cliente: { fechaNacimiento: '2027-01-01' } },
      'La fecha no puede ser futura',
    ],
    [
      'la fecha no existe',
      { cliente: { fechaNacimiento: '1990-02-30' } },
      'Ingresa una fecha válida',
    ],
    ['falta la fecha', { cliente: { fechaNacimiento: '' } }, 'Ingresa la fecha de nacimiento'],
    [
      'la cédula no tiene el formato',
      { cliente: { cedula: '0010101900001A' } },
      'La cédula debe tener el formato 000-000000-0000X',
    ],
    ['el correo no es válido', { cliente: { correo: 'ana' } }, 'Ingresa un correo válido'],
    [
      'el teléfono es corto',
      { cliente: { telefono: '123' } },
      'El teléfono debe tener entre 8 y 15 dígitos',
    ],
    ['el monto es 0', { credito: { monto: 0 } }, 'El monto debe ser mayor que 0'],
    ['el monto está vacío', { credito: { monto: Number.NaN } }, 'Ingresa el monto'],
    ['el monto tiene 3 decimales', { credito: { monto: 100.005 } }, 'Usa como máximo 2 decimales'],
    ['la tasa supera 100', { credito: { tasaAnual: 101 } }, 'La tasa máxima es 100 %'],
    [
      'las cuotas no son enteras',
      { credito: { cantidadCuotas: 1.5 } },
      'La cantidad de cuotas debe ser un número entero',
    ],
    ['las cuotas superan 360', { credito: { cantidadCuotas: 361 } }, 'El máximo es 360 cuotas'],
    [
      'falta el tipo de empleo',
      { empleo: { tipoEmpleo: '' as 'ASALARIADO' } },
      'Selecciona el tipo de empleo',
    ],
    [
      'la antigüedad es negativa',
      { empleo: { antiguedadLaboralAnios: -1 } },
      'La antigüedad no puede ser negativa',
    ],
  ])('debe rechazar cuando %s', (_caso, cambios, mensaje) => {
    expect(mensajes(unaSolicitud(cambios))).toEqual([mensaje]);
  });
});

describe('edadSegunFecha', () => {
  it('debe calcular la edad a la fecha de referencia', () => {
    expect(edadSegunFecha('1990-01-01', HOY)).toBe(36);
  });

  it.each(['', '1990-1-1', '1990-02-30', '2027-01-01'])(
    'debe devolver null cuando la fecha es %p',
    (iso) => {
      expect(edadSegunFecha(iso, HOY)).toBeNull();
    },
  );
});
