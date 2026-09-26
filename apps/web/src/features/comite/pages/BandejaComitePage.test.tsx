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

  describe('paginación', () => {
    // Solicitudes pendientes #N..#1, de la más reciente a la más antigua como las devuelve la API.
    const varias = (cantidad: number) =>
      Array.from({ length: cantidad }, (_, indice) =>
        unaSolicitudPendiente({ id: cantidad - indice }),
      );

    const idsVisibles = () => {
      const tabla = screen.getByRole('table', { name: 'Solicitudes pendientes de revisión' });
      return within(tabla)
        .getAllByRole('row')
        .slice(1)
        .map((fila) => within(fila).getAllByRole('cell')[0]?.textContent);
    };

    const paginacion = () => screen.getByRole('navigation', { name: 'Paginación de solicitudes' });

    it('debe mostrar todas sin paginación cuando son exactamente 5', async () => {
      pendientesQueDevuelve(varias(5));

      renderApp('/comite');

      await screen.findByRole('table');
      expect(idsVisibles()).toEqual(['5', '4', '3', '2', '1']);
      expect(
        screen.queryByRole('navigation', { name: 'Paginación de solicitudes' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/^Mostrando/)).not.toBeInTheDocument();
    });

    it('debe mostrar solo las primeras 5 y la paginación cuando son más de 5', async () => {
      pendientesQueDevuelve(varias(8));

      renderApp('/comite');

      expect(await screen.findByText('Mostrando 1–5 de 8 solicitudes')).toBeInTheDocument();
      expect(idsVisibles()).toEqual(['8', '7', '6', '5', '4']);
      expect(within(paginacion()).getByRole('button', { name: 'Página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(paginacion()).getByRole('button', { name: 'Anterior' })).toBeDisabled();
    });

    it('debe ir a la página siguiente guardándola en la URL y sin volver a consultar la API', async () => {
      const consultas = pendientesQueDevuelve(varias(8));
      const { usuario, router } = renderApp('/comite');
      await screen.findByText('Mostrando 1–5 de 8 solicitudes');

      await usuario.click(within(paginacion()).getByRole('button', { name: 'Siguiente' }));

      expect(await screen.findByText('Mostrando 6–8 de 8 solicitudes')).toBeInTheDocument();
      expect(idsVisibles()).toEqual(['3', '2', '1']);
      expect(router.state.location.search).toBe('?pagina=2');
      expect(within(paginacion()).getByRole('button', { name: 'Siguiente' })).toBeDisabled();
      expect(consultas).toHaveLength(1);
    });

    it('debe volver a la página 1 sin escribirla en la URL', async () => {
      pendientesQueDevuelve(varias(8));
      const { usuario, router } = renderApp('/comite?pagina=2');
      await screen.findByText('Mostrando 6–8 de 8 solicitudes');

      await usuario.click(within(paginacion()).getByRole('button', { name: 'Página 1' }));

      expect(await screen.findByText('Mostrando 1–5 de 8 solicitudes')).toBeInTheDocument();
      expect(router.state.location.search).toBe('');
    });

    it.each([
      ['99', 'Mostrando 6–8 de 8 solicitudes'],
      ['0', 'Mostrando 1–5 de 8 solicitudes'],
      ['abc', 'Mostrando 1–5 de 8 solicitudes'],
    ])('debe ajustar pagina=%p de la URL al rango válido', async (pagina, resumen) => {
      pendientesQueDevuelve(varias(8));

      renderApp(`/comite?pagina=${pagina}`);

      expect(await screen.findByText(resumen)).toBeInTheDocument();
    });

    it('debe llevar a la revisión correcta desde la segunda página', async () => {
      pendientesQueDevuelve(varias(8));
      const { usuario, router } = renderApp('/comite?pagina=2');

      await usuario.click(
        await screen.findByRole('link', { name: 'Revisar la solicitud 2 de Ana Pérez' }),
      );

      expect(router.state.location.pathname).toBe('/comite/2');
    });
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
