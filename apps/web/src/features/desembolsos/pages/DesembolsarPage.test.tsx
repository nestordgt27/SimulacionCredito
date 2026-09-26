import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { SolicitudAprobada } from '../api/desembolsos.api';

type Usuario = ReturnType<typeof renderApp>['usuario'];

const APROBADA: SolicitudAprobada = {
  id: 5,
  observaciones: 'Ingresos estables',
  cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
  credito: { monto: 10000, cantidadCuotas: 12, periodicidad: 'MENSUAL', cuotaNivelada: 888.49 },
};

// Imita al backend: lista de aprobadas y desembolso de la solicitud 5.
function apiDeDesembolsos() {
  const desembolsos: unknown[] = [];
  let aprobadas = [APROBADA];
  server.use(
    http.get('*/api/solicitudes', () => HttpResponse.json(aprobadas)),
    http.post('*/api/desembolsos/5', async ({ request }) => {
      const cuerpo = (await request.json()) as { banco: string; numeroCuenta: string };
      desembolsos.push(cuerpo);
      aprobadas = [];
      return HttpResponse.json(
        {
          solicitudId: 5,
          estado: 'DESEMBOLSADA',
          desembolso: {
            numeroCredito: 'CR-2026-000001',
            banco: cuerpo.banco,
            numeroCuenta: cuerpo.numeroCuenta,
            monto: 10000,
            fechaDesembolso: '2026-09-25T12:00:00.000Z',
          },
        },
        { status: 201 },
      );
    }),
  );
  return desembolsos;
}

async function abrirDesembolso() {
  const renderizado = renderApp('/desembolsos/5');
  await screen.findByText('Crédito aprobado');
  return renderizado;
}

async function llenarDatosBancarios(usuario: Usuario, banco: string, cuenta: string) {
  if (banco) await usuario.selectOptions(screen.getByLabelText('Banco'), banco);
  if (cuenta) {
    await usuario.click(screen.getByLabelText('Número de cuenta'));
    await usuario.paste(cuenta);
  }
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('DesembolsarPage', () => {
  beforeEach(() => {
    conSesion();
  });

  it('debe mostrar el resumen del crédito aprobado', async () => {
    apiDeDesembolsos();

    await abrirDesembolso();

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('C$ 10,000.00')).toBeInTheDocument();
    expect(screen.getByText('Observaciones del comité: Ingresos estables')).toBeInTheDocument();
  });

  it('debe ofrecer exactamente los 4 bancos permitidos', async () => {
    apiDeDesembolsos();

    await abrirDesembolso();

    const opciones = [...(screen.getByLabelText('Banco') as HTMLSelectElement).options].map(
      (opcion) => opcion.text,
    );
    expect(opciones).toEqual(['Selecciona…', 'LAFISE', 'FICOHSA', 'BAC Credomatic', 'Banpro']);
  });

  it('debe validar banco y cuenta sin llamar a la API', async () => {
    const desembolsos = apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();

    await llenarDatosBancarios(usuario, '', '');

    expect(await screen.findByText('Selecciona el banco')).toBeInTheDocument();
    expect(
      screen.getByText('El número de cuenta debe tener entre 6 y 20 dígitos'),
    ).toBeInTheDocument();
    expect(desembolsos).toHaveLength(0);
  });

  it('debe rechazar un número de cuenta con letras', async () => {
    apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();

    await llenarDatosBancarios(usuario, 'BANPRO', '12AB5678');

    expect(
      await screen.findByText('El número de cuenta debe tener entre 6 y 20 dígitos'),
    ).toBeInTheDocument();
  });

  it('debe pedir confirmación con el resumen antes de desembolsar', async () => {
    const desembolsos = apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();

    await llenarDatosBancarios(usuario, 'BAC_CREDOMATIC', '0012345678');

    expect(screen.getByRole('heading', { name: 'Confirmar desembolso' })).toBeInTheDocument();
    expect(
      screen
        .getByText(/Vas a desembolsar/)
        .closest('p')
        ?.textContent?.replace(/\s+/g, ' '),
    ).toBe(
      'Vas a desembolsar C$ 10,000.00 a Ana Pérez en BAC Credomatic, cuenta 0012345678. Esta operación no se puede deshacer.',
    );
    expect(desembolsos).toHaveLength(0);
  });

  it('debe volver a los datos bancarios al corregir, sin desembolsar', async () => {
    const desembolsos = apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();
    await llenarDatosBancarios(usuario, 'BANPRO', '0012345678');

    await usuario.click(screen.getByRole('button', { name: 'Corregir datos' }));

    expect(screen.getByLabelText('Número de cuenta')).toBeInTheDocument();
    expect(desembolsos).toHaveLength(0);
  });

  it('debe desembolsar al confirmar conservando los ceros de la cuenta', async () => {
    const desembolsos = apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();
    await llenarDatosBancarios(usuario, 'BAC_CREDOMATIC', ' 0012345678 ');

    await usuario.click(screen.getByRole('button', { name: 'Confirmar desembolso' }));

    const resultado = await screen.findByRole('status');
    expect(resultado).toHaveTextContent('Crédito CR-2026-000001 desembolsado');
    expect(resultado).toHaveTextContent('Estado: DESEMBOLSADA');
    expect(desembolsos).toEqual([{ banco: 'BAC_CREDOMATIC', numeroCuenta: '0012345678' }]);
  });

  it('debe sacar el crédito de la bandeja después de desembolsarlo', async () => {
    apiDeDesembolsos();
    const { usuario } = await abrirDesembolso();
    await llenarDatosBancarios(usuario, 'BANPRO', '0012345678');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar desembolso' }));

    await usuario.click(await screen.findByRole('link', { name: 'Volver a los desembolsos' }));

    expect(
      await screen.findByText('No hay créditos pendientes de desembolso.'),
    ).toBeInTheDocument();
  });

  it('debe mostrar el conflicto del backend en la confirmación', async () => {
    apiDeDesembolsos();
    server.use(
      http.post('*/api/desembolsos/5', () =>
        errorApi(
          409,
          'TRANSICION_INVALIDA',
          'La solicitud está DESEMBOLSADA y no puede pasar a DESEMBOLSADA',
        ),
      ),
    );
    const { usuario } = await abrirDesembolso();
    await llenarDatosBancarios(usuario, 'BANPRO', '0012345678');

    await usuario.click(screen.getByRole('button', { name: 'Confirmar desembolso' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La solicitud está DESEMBOLSADA y no puede pasar a DESEMBOLSADA',
    );
  });

  it('debe avisar cuando la solicitud no está aprobada o ya fue desembolsada', async () => {
    server.use(http.get('*/api/solicitudes', () => HttpResponse.json([APROBADA])));

    renderApp('/desembolsos/99');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La solicitud #99 no está aprobada o ya fue desembolsada.',
    );
    expect(screen.queryByLabelText('Banco')).not.toBeInTheDocument();
  });

  it('debe volver a la bandeja cuando el id no es válido', () => {
    apiDeDesembolsos();

    const { router } = renderApp('/desembolsos/abc');

    expect(router.state.location.pathname).toBe('/desembolsos');
  });
});
