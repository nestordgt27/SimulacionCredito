import {
  calcularCuotaNivelada,
  calcularPlazoMeses,
  type Periodicidad,
} from '@simulacion-credito/shared';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';

type Usuario = ReturnType<typeof renderApp>['usuario'];

interface CuerpoSolicitud {
  cliente: Record<string, unknown>;
  empleo: Record<string, unknown>;
  credito: { monto: number; tasaAnual: number; cantidadCuotas: number; periodicidad: Periodicidad };
}

// Imita al backend: recalcula la cuota con shared y responde la vista de la solicitud.
function apiDeSolicitudes() {
  const cuerpos: CuerpoSolicitud[] = [];
  server.use(
    http.post('*/api/solicitudes', async ({ request }) => {
      const cuerpo = (await request.json()) as CuerpoSolicitud;
      cuerpos.push(cuerpo);
      const { monto, tasaAnual, cantidadCuotas, periodicidad } = cuerpo.credito;
      return HttpResponse.json(
        {
          id: 7,
          estado: 'PENDIENTE',
          observaciones: null,
          creadaEn: '2026-09-25T12:00:00.000Z',
          cliente: { ...cuerpo.cliente, edad: 36 },
          empleo: cuerpo.empleo,
          credito: {
            ...cuerpo.credito,
            plazoMeses: calcularPlazoMeses(cantidadCuotas, periodicidad),
            cuotaNivelada: calcularCuotaNivelada(monto, tasaAnual, cantidadCuotas, periodicidad),
          },
        },
        { status: 201 },
      );
    }),
  );
  return cuerpos;
}

const campo = (etiqueta: string) => screen.getByLabelText(etiqueta);
const resumen = () => within(screen.getByRole('region', { name: 'Cuota estimada' }));
const botonRegistrar = () => screen.getByRole('button', { name: 'Registrar solicitud' });

// Pegar inserta el valor en un solo evento (escribir tecla a tecla re-renderiza el formulario
// por cada carácter y vuelve lentas las pruebas). Las fechas se escriben: input date no admite pegar.
async function escribir(usuario: Usuario, etiqueta: string, valor: string) {
  const entrada = campo(etiqueta);
  await usuario.clear(entrada);
  if (entrada.getAttribute('type') === 'date') {
    await usuario.type(entrada, valor);
  } else {
    await usuario.click(entrada);
    await usuario.paste(valor);
  }
}

async function llenarCredito(
  usuario: Usuario,
  { monto = '10000', tasa = '12', cuotas = '12', periodicidad = 'MENSUAL' } = {},
) {
  await escribir(usuario, 'Monto solicitado (C$)', monto);
  await escribir(usuario, 'Tasa anual (%)', tasa);
  await escribir(usuario, 'Cantidad de cuotas', cuotas);
  await usuario.selectOptions(campo('Periodicidad'), periodicidad);
}

async function llenarFormulario(usuario: Usuario, fechaNacimiento = '1990-01-01') {
  await escribir(usuario, 'Cédula', '001-010190-0001a');
  await escribir(usuario, 'Nombre completo', 'Ana Pérez');
  await escribir(usuario, 'Correo', 'Ana@Correo.com');
  await escribir(usuario, 'Teléfono', '88887777');
  await escribir(usuario, 'Fecha de nacimiento', fechaNacimiento);
  await usuario.selectOptions(campo('Tipo de empleo'), 'ASALARIADO');
  await escribir(usuario, 'Empresa o negocio', 'Empresa S.A.');
  await escribir(usuario, 'Antigüedad laboral (años)', '5');
  await escribir(usuario, 'Ingreso mensual (C$)', '25000.50');
  await llenarCredito(usuario);
}

// Estas pruebas llenan el formulario completo como lo haría una persona (~3 s con cobertura):
// se da más margen que los 5 s por defecto para evitar fallos intermitentes en máquinas lentas.
// Se configura al cargar el módulo porque Vitest asigna el límite al recolectar las pruebas;
// cada archivo corre aislado, así que no afecta a los demás.
vi.setConfig({ testTimeout: 15_000 });

describe('NuevaSolicitudPage', () => {
  beforeEach(() => {
    // Solo se fija Date (la edad depende de "hoy"); los timers reales siguen para user-event y MSW.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T12:00:00Z'));
    conSesion();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe mostrar las tres secciones del formulario', () => {
    renderApp('/solicitudes/nueva');

    expect(screen.getByRole('group', { name: 'Datos personales' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Información laboral' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Condiciones del crédito' })).toBeInTheDocument();
  });

  it('debe abrirse desde el enlace del inicio', async () => {
    const { usuario, router } = renderApp('/');

    await usuario.click(screen.getByRole('link', { name: 'Registrar una solicitud' }));

    expect(router.state.location.pathname).toBe('/solicitudes/nueva');
  });

  describe('cuota en vivo', () => {
    it('debe mostrar un guion mientras faltan condiciones del crédito', () => {
      renderApp('/solicitudes/nueva');

      expect(resumen().getAllByText('—')).toHaveLength(2);
    });

    it('debe calcular la cuota y el plazo con shared al completar las condiciones', async () => {
      const { usuario } = renderApp('/solicitudes/nueva');

      await llenarCredito(usuario);

      expect(resumen().getByText('C$ 888.49')).toBeInTheDocument();
      expect(resumen().getByText('12 meses')).toBeInTheDocument();
    });

    it('debe recalcular al cambiar la periodicidad y las cuotas', async () => {
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarCredito(usuario);

      await escribir(usuario, 'Cantidad de cuotas', '24');
      await usuario.selectOptions(campo('Periodicidad'), 'QUINCENAL');

      expect(resumen().getByText('C$ 443.21')).toBeInTheDocument();
      expect(resumen().getByText('12 meses')).toBeInTheDocument();
    });

    it('debe volver al guion cuando una condición deja de ser válida', async () => {
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarCredito(usuario);

      await escribir(usuario, 'Tasa anual (%)', '12.555');

      expect(resumen().getAllByText('—')).toHaveLength(2);
    });
  });

  describe('regla de edad', () => {
    it('debe bloquear el registro con un aviso claro cuando el cliente tiene más de 80 años', async () => {
      const cuerpos = apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');

      await llenarFormulario(usuario, '1945-09-25');

      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se puede registrar la solicitud. El cliente tiene 81 años y la edad máxima permitida es 80 años.',
      );
      expect(botonRegistrar()).toBeDisabled();
      await usuario.click(botonRegistrar());
      expect(cuerpos).toHaveLength(0);
    });

    it('debe permitir registrar a un cliente con exactamente 80 años', async () => {
      apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');

      await llenarFormulario(usuario, '1945-09-26');

      expect(screen.getByText('Edad: 80 años')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(botonRegistrar()).toBeEnabled();
    });

    it('debe quitar el bloqueo cuando se corrige la fecha de nacimiento', async () => {
      const { usuario } = renderApp('/solicitudes/nueva');
      await escribir(usuario, 'Fecha de nacimiento', '1940-01-01');
      expect(botonRegistrar()).toBeDisabled();

      await escribir(usuario, 'Fecha de nacimiento', '1990-01-01');

      expect(botonRegistrar()).toBeEnabled();
      expect(screen.getByText('Edad: 36 años')).toBeInTheDocument();
    });
  });

  describe('registro', () => {
    it('debe enviar los datos normalizados sin la cuota, que calcula el servidor', async () => {
      const cuerpos = apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarFormulario(usuario);

      await usuario.click(botonRegistrar());

      await screen.findByText('Solicitud #7 registrada');
      expect(cuerpos).toEqual([
        {
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
            ingresoMensual: 25000.5,
          },
          credito: { monto: 10000, tasaAnual: 12, cantidadCuotas: 12, periodicidad: 'MENSUAL' },
        },
      ]);
    });

    it('debe mostrar la solicitud registrada con la cuota confirmada por el servidor', async () => {
      apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarFormulario(usuario);

      await usuario.click(botonRegistrar());

      const resultado = await screen.findByRole('status');
      expect(resultado).toHaveTextContent('Solicitud #7 registrada');
      expect(resultado).toHaveTextContent('Estado: PENDIENTE');
      expect(screen.getByText('C$ 888.49')).toBeInTheDocument();
    });

    it('debe volver al formulario vacío con "Registrar otra solicitud"', async () => {
      apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarFormulario(usuario);
      await usuario.click(botonRegistrar());

      await usuario.click(await screen.findByRole('button', { name: 'Registrar otra solicitud' }));

      expect(campo('Cédula')).toHaveValue('');
      expect(resumen().getAllByText('—')).toHaveLength(2);
    });

    it('debe mostrar los errores de validación y no enviar cuando faltan datos', async () => {
      const cuerpos = apiDeSolicitudes();
      const { usuario } = renderApp('/solicitudes/nueva');

      await usuario.click(botonRegistrar());

      expect(await screen.findByText('Ingresa el nombre completo')).toBeInTheDocument();
      expect(screen.getByText('Ingresa la fecha de nacimiento')).toBeInTheDocument();
      expect(screen.getByText('Selecciona el tipo de empleo')).toBeInTheDocument();
      expect(screen.getByText('Ingresa el monto')).toBeInTheDocument();
      expect(cuerpos).toHaveLength(0);
    });

    it('debe mostrar el mensaje del backend cuando rechaza la solicitud', async () => {
      server.use(
        http.post('*/api/solicitudes', () =>
          errorApi(
            422,
            'EDAD_NO_PERMITIDA',
            'El cliente tiene 81 años; la edad máxima permitida es 80',
          ),
        ),
      );
      const { usuario } = renderApp('/solicitudes/nueva');
      await llenarFormulario(usuario);

      await usuario.click(botonRegistrar());

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'El cliente tiene 81 años; la edad máxima permitida es 80',
      );
    });
  });
});
