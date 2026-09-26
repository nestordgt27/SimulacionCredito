import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { SolicitudPendiente } from '../api/comite.api';

function unaSolicitudPendiente(cambios: Partial<SolicitudPendiente> = {}): SolicitudPendiente {
  return {
    id: 5,
    creadaEn: '2026-09-25T12:00:00.000Z',
    cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
    credito: { monto: 10000, cantidadCuotas: 12, periodicidad: 'MENSUAL' },
    ...cambios,
  };
}

function pendientesQueDevuelve(solicitudes: SolicitudPendiente[]) {
  const consultas: string[] = [];
  server.use(
    http.get('*/api/solicitudes', ({ request }) => {
      consultas.push(new URL(request.url).search);
      return HttpResponse.json(solicitudes);
    }),
  );
  return consultas;
}

describe('BandejaComitePage', () => {
  beforeEach(() => {
    conSesion();
  });

  it('debe pedir solo las solicitudes PENDIENTE', async () => {
    const consultas = pendientesQueDevuelve([]);

    renderApp('/comite');

    await screen.findByText('No hay solicitudes pendientes de revisión.');
    expect(consultas).toEqual(['?estado=PENDIENTE']);
  });

  it('debe listar las solicitudes pendientes con sus datos principales', async () => {
    pendientesQueDevuelve([
      unaSolicitudPendiente(),
      unaSolicitudPendiente({
        id: 6,
        cliente: { cedula: '001-150385-0007K', nombreCompleto: 'Luis Martínez' },
        credito: { monto: 50000, cantidadCuotas: 24, periodicidad: 'QUINCENAL' },
      }),
    ]);

    renderApp('/comite');

    const tabla = await screen.findByRole('table', { name: 'Solicitudes pendientes de revisión' });
    const [, primera, segunda] = within(tabla).getAllByRole('row');
    expect(primera).toHaveTextContent('Ana Pérez');
    expect(primera).toHaveTextContent('001-010190-0001A');
    expect(primera).toHaveTextContent('C$ 10,000.00');
    expect(primera).toHaveTextContent('12 (mensual)');
    expect(primera).toHaveTextContent('25/09/2026');
    expect(segunda).toHaveTextContent('Luis Martínez');
    expect(segunda).toHaveTextContent('24 (quincenal)');
  });

  it('debe abrir la revisión de la solicitud elegida', async () => {
    pendientesQueDevuelve([unaSolicitudPendiente()]);
    const { usuario, router } = renderApp('/comite');

    await usuario.click(
      await screen.findByRole('link', { name: 'Revisar la solicitud 5 de Ana Pérez' }),
    );

    expect(router.state.location.pathname).toBe('/comite/5');
  });

  it('debe mostrar un aviso cuando no hay solicitudes pendientes', async () => {
    pendientesQueDevuelve([]);

    renderApp('/comite');

    expect(await screen.findByText('No hay solicitudes pendientes de revisión.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('debe mostrar el error cuando no se pueden cargar las solicitudes', async () => {
    server.use(
      http.get('*/api/solicitudes', () => errorApi(500, 'ERROR', 'Error interno del servidor')),
    );

    renderApp('/comite');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
  });

  it('debe ser accesible desde la navegación principal', async () => {
    pendientesQueDevuelve([]);
    const { usuario, router } = renderApp('/');

    await usuario.click(
      within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
        name: 'Comité',
      }),
    );

    expect(router.state.location.pathname).toBe('/comite');
  });
});
