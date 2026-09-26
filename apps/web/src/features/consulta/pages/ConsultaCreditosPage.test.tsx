import { calcularPlazoMeses, generarPlanPagos } from '@simulacion-credito/shared';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { CreditoConsultado } from '../api/creditos.api';

type Usuario = ReturnType<typeof renderApp>['usuario'];

const CEDULA = '001-010190-0001A';

// Crédito como lo devuelve la API, con el plan real de generarPlanPagos (packages/shared).
function unCredito(cambios: Partial<CreditoConsultado> = {}): CreditoConsultado {
  const base = {
    monto: 10000,
    tasaAnual: 12,
    cantidadCuotas: 12,
    periodicidad: 'MENSUAL' as const,
  };
  const fechaAprobacion = '2026-09-25T12:00:00.000Z';
  const plan = generarPlanPagos({
    monto: base.monto,
    tasaAnual: base.tasaAnual,
    cuotas: base.cantidadCuotas,
    periodicidad: base.periodicidad,
    fechaInicio: new Date(fechaAprobacion),
  });
  return {
    numeroCredito: 'CR-2026-000001',
    solicitudId: 5,
    estado: 'APROBADA',
    fechaAprobacion,
    cliente: { cedula: CEDULA, nombreCompleto: 'Ana Pérez' },
    ...base,
    plazoMeses: calcularPlazoMeses(base.cantidadCuotas, base.periodicidad),
    cuotaNivelada: plan[0]!.cuota,
    desembolso: null,
    planPagos: plan.map((fila) => ({
      ...fila,
      fechaVencimiento: fila.fechaVencimiento.toISOString(),
    })),
    ...cambios,
  };
}

function creditosQueDevuelve(creditos: CreditoConsultado[]) {
  const consultas: (string | null)[] = [];
  server.use(
    http.get('*/api/creditos', ({ request }) => {
      consultas.push(new URL(request.url).searchParams.get('cedula'));
      return HttpResponse.json(creditos);
    }),
  );
  return consultas;
}

async function buscar(usuario: Usuario, cedula: string) {
  const campo = screen.getByLabelText('Cédula del cliente');
  await usuario.clear(campo);
  await usuario.click(campo);
  await usuario.paste(cedula);
  await usuario.click(screen.getByRole('button', { name: 'Buscar' }));
}

const tarjeta = (numeroCredito: string) => screen.getByRole('article', { name: numeroCredito });

describe('ConsultaCreditosPage', () => {
  beforeEach(() => {
    conSesion();
  });

  it('debe validar la cédula sin llamar a la API', async () => {
    const consultas = creditosQueDevuelve([]);
    const { usuario } = renderApp('/creditos');

    await buscar(usuario, '0010101900001A');

    expect(
      await screen.findByText('La cédula debe tener el formato 000-000000-0000X'),
    ).toBeInTheDocument();
    expect(consultas).toHaveLength(0);
  });

  it('debe buscar con la cédula normalizada y guardarla en la URL', async () => {
    const consultas = creditosQueDevuelve([unCredito()]);
    const { usuario, router } = renderApp('/creditos');

    await buscar(usuario, ' 001-010190-0001a ');

    expect(await screen.findByRole('article', { name: 'CR-2026-000001' })).toBeInTheDocument();
    expect(consultas).toEqual([CEDULA]);
    expect(router.state.location.search).toBe(`?cedula=${CEDULA}`);
  });

  it('debe buscar al abrir una URL con la cédula', async () => {
    const consultas = creditosQueDevuelve([unCredito()]);

    renderApp(`/creditos?cedula=${CEDULA}`);

    expect(await screen.findByText('1 crédito encontrado')).toBeInTheDocument();
    expect(screen.getByLabelText('Cédula del cliente')).toHaveValue(CEDULA);
    expect(consultas).toEqual([CEDULA]);
  });

  it('debe ignorar una cédula inválida en la URL sin llamar a la API', () => {
    const consultas = creditosQueDevuelve([]);

    renderApp('/creditos?cedula=no-es-cedula');

    expect(screen.getByLabelText('Cédula del cliente')).toHaveValue('');
    expect(consultas).toHaveLength(0);
  });

  it('debe mostrar las condiciones y el estado de cada crédito', async () => {
    creditosQueDevuelve([unCredito()]);

    renderApp(`/creditos?cedula=${CEDULA}`);

    const credito = await screen.findByRole('article', { name: 'CR-2026-000001' });
    expect(credito).toHaveTextContent('Ana Pérez · 001-010190-0001A · Solicitud #5');
    expect(credito).toHaveTextContent('Aprobado · pendiente de desembolso');
    expect(credito).toHaveTextContent('C$ 10,000.00');
    expect(credito).toHaveTextContent('12 %');
    expect(credito).toHaveTextContent('12 (mensual)');
    expect(credito).toHaveTextContent('12 meses');
    expect(credito).toHaveTextContent('C$ 888.49');
    expect(credito).toHaveTextContent('DesembolsoPendiente');
  });

  it('debe mostrar el banco y la fecha cuando el crédito fue desembolsado', async () => {
    creditosQueDevuelve([
      unCredito({
        estado: 'DESEMBOLSADA',
        desembolso: { banco: 'BAC_CREDOMATIC', fechaDesembolso: '2026-09-27T15:00:00.000Z' },
      }),
    ]);

    renderApp(`/creditos?cedula=${CEDULA}`);

    const credito = await screen.findByRole('article', { name: 'CR-2026-000001' });
    expect(credito).toHaveTextContent('Desembolsado');
    expect(credito).toHaveTextContent('BAC Credomatic, 27/09/2026');
  });

  it('debe listar varios créditos del cliente', async () => {
    creditosQueDevuelve([
      unCredito({ numeroCredito: 'CR-2026-000002', solicitudId: 6 }),
      unCredito(),
    ]);

    renderApp(`/creditos?cedula=${CEDULA}`);

    expect(await screen.findByText('2 créditos encontrados')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('article')
        .map((articulo) => within(articulo).getByRole('heading').textContent),
    ).toEqual(['CR-2026-000002', 'CR-2026-000001']);
  });

  describe('plan de pagos', () => {
    it('debe estar oculto hasta que se pide', async () => {
      creditosQueDevuelve([unCredito()]);

      renderApp(`/creditos?cedula=${CEDULA}`);

      await screen.findByRole('article', { name: 'CR-2026-000001' });
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ver plan de pagos' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('debe mostrar todas las cuotas con su vencimiento, montos y saldo final 0', async () => {
      creditosQueDevuelve([unCredito()]);
      const { usuario } = renderApp(`/creditos?cedula=${CEDULA}`);

      await usuario.click(await screen.findByRole('button', { name: 'Ver plan de pagos' }));

      const tabla = within(tarjeta('CR-2026-000001')).getByRole('table', {
        name: 'Plan de pagos del crédito CR-2026-000001',
      });
      const filas = within(tabla).getAllByRole('row');
      // Encabezado + 12 cuotas + totales.
      expect(filas).toHaveLength(14);
      expect(filas[1]).toHaveTextContent('125/10/2026C$ 888.49C$ 788.49C$ 100.00C$ 9,211.51');
      expect(filas[12]).toHaveTextContent('1225/09/2027C$ 888.47C$ 879.67C$ 8.80C$ 0.00');
    });

    it('debe totalizar el capital exactamente en el monto del crédito', async () => {
      creditosQueDevuelve([unCredito()]);
      const { usuario } = renderApp(`/creditos?cedula=${CEDULA}`);

      await usuario.click(await screen.findByRole('button', { name: 'Ver plan de pagos' }));

      const totales = within(screen.getByRole('table')).getByRole('row', { name: /Totales/ });
      expect(totales).toHaveTextContent('TotalesC$ 10,661.86C$ 10,000.00C$ 661.86');
    });

    it('debe ocultarse de nuevo al pedirlo', async () => {
      creditosQueDevuelve([unCredito()]);
      const { usuario } = renderApp(`/creditos?cedula=${CEDULA}`);
      await usuario.click(await screen.findByRole('button', { name: 'Ver plan de pagos' }));

      await usuario.click(screen.getByRole('button', { name: 'Ocultar plan de pagos' }));

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  it('debe avisar cuando la cédula no tiene créditos', async () => {
    creditosQueDevuelve([]);

    renderApp(`/creditos?cedula=${CEDULA}`);

    expect(
      await screen.findByText(`No se encontraron créditos para la cédula ${CEDULA}.`),
    ).toBeInTheDocument();
  });

  it('debe mostrar el error cuando la consulta falla', async () => {
    server.use(
      http.get('*/api/creditos', () => errorApi(500, 'ERROR', 'Error interno del servidor')),
    );

    renderApp(`/creditos?cedula=${CEDULA}`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
  });

  it('debe ser accesible desde la navegación principal', async () => {
    const { usuario, router } = renderApp('/');

    await usuario.click(
      within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
        name: 'Consulta',
      }),
    );

    expect(router.state.location.pathname).toBe('/creditos');
  });
});
