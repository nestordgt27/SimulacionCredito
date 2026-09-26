import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { SolicitudAprobada } from '../api/desembolsos.api';

const APROBADA: SolicitudAprobada = {
  id: 5,
  observaciones: 'Cumple',
  cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
  credito: { monto: 10000, cantidadCuotas: 12, periodicidad: 'MENSUAL', cuotaNivelada: 888.49 },
};

function aprobadasQueDevuelve(solicitudes: SolicitudAprobada[]) {
  const consultas: string[] = [];
  server.use(
    http.get('*/api/solicitudes', ({ request }) => {
      consultas.push(new URL(request.url).search);
      return HttpResponse.json(solicitudes);
    }),
  );
  return consultas;
}

describe('BandejaDesembolsosPage', () => {
  beforeEach(() => {
    conSesion();
  });

  it('debe pedir solo las solicitudes APROBADA', async () => {
    const consultas = aprobadasQueDevuelve([]);

    renderApp('/desembolsos');

    await screen.findByText('No hay créditos pendientes de desembolso.');
    expect(consultas).toEqual(['?estado=APROBADA']);
  });

  it('debe listar los créditos aprobados con monto y cuota', async () => {
    aprobadasQueDevuelve([APROBADA]);

    renderApp('/desembolsos');

    const tabla = await screen.findByRole('table', {
      name: 'Solicitudes aprobadas pendientes de desembolso',
    });
    const [, fila] = within(tabla).getAllByRole('row');
    expect(fila).toHaveTextContent('Ana Pérez');
    expect(fila).toHaveTextContent('001-010190-0001A');
    expect(fila).toHaveTextContent('C$ 10,000.00');
    expect(fila).toHaveTextContent('C$ 888.49');
    expect(fila).toHaveTextContent('12 (mensual)');
  });

  it('debe abrir el desembolso de la solicitud elegida', async () => {
    aprobadasQueDevuelve([APROBADA]);
    const { usuario, router } = renderApp('/desembolsos');

    await usuario.click(
      await screen.findByRole('link', { name: 'Desembolsar la solicitud 5 de Ana Pérez' }),
    );

    expect(router.state.location.pathname).toBe('/desembolsos/5');
  });

  describe('paginación', () => {
    // Solicitudes aprobadas #N..#1, del más reciente al más antiguo como las devuelve la API.
    const varias = (cantidad: number) =>
      Array.from({ length: cantidad }, (_, indice) => ({ ...APROBADA, id: cantidad - indice }));

    const idsVisibles = () => {
      const tabla = screen.getByRole('table', {
        name: 'Solicitudes aprobadas pendientes de desembolso',
      });
      return within(tabla)
        .getAllByRole('row')
        .slice(1)
        .map((fila) => within(fila).getAllByRole('cell')[0]?.textContent);
    };

    const paginacion = () => screen.getByRole('navigation', { name: 'Paginación de desembolsos' });

    it('debe mostrar todas sin paginación cuando son exactamente 5', async () => {
      aprobadasQueDevuelve(varias(5));

      renderApp('/desembolsos');

      await screen.findByRole('table');
      expect(idsVisibles()).toEqual(['5', '4', '3', '2', '1']);
      expect(
        screen.queryByRole('navigation', { name: 'Paginación de desembolsos' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/^Mostrando/)).not.toBeInTheDocument();
    });

    it('debe mostrar solo las primeras 5 y la paginación cuando son más de 5', async () => {
      aprobadasQueDevuelve(varias(7));

      renderApp('/desembolsos');

      expect(await screen.findByText('Mostrando 1–5 de 7 créditos')).toBeInTheDocument();
      expect(idsVisibles()).toEqual(['7', '6', '5', '4', '3']);
      expect(within(paginacion()).getByRole('button', { name: 'Página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(paginacion()).getByRole('button', { name: 'Anterior' })).toBeDisabled();
    });

    it('debe ir a la página siguiente guardándola en la URL y sin volver a consultar la API', async () => {
      const consultas = aprobadasQueDevuelve(varias(7));
      const { usuario, router } = renderApp('/desembolsos');
      await screen.findByText('Mostrando 1–5 de 7 créditos');

      await usuario.click(within(paginacion()).getByRole('button', { name: 'Siguiente' }));

      expect(await screen.findByText('Mostrando 6–7 de 7 créditos')).toBeInTheDocument();
      expect(idsVisibles()).toEqual(['2', '1']);
      expect(router.state.location.search).toBe('?pagina=2');
      expect(within(paginacion()).getByRole('button', { name: 'Siguiente' })).toBeDisabled();
      expect(consultas).toHaveLength(1);
    });

    it('debe volver a la página 1 sin escribirla en la URL', async () => {
      aprobadasQueDevuelve(varias(7));
      const { usuario, router } = renderApp('/desembolsos?pagina=2');
      await screen.findByText('Mostrando 6–7 de 7 créditos');

      await usuario.click(within(paginacion()).getByRole('button', { name: 'Anterior' }));

      expect(await screen.findByText('Mostrando 1–5 de 7 créditos')).toBeInTheDocument();
      expect(router.state.location.search).toBe('');
    });

    it.each([
      ['99', 'Mostrando 6–7 de 7 créditos'],
      ['0', 'Mostrando 1–5 de 7 créditos'],
      ['abc', 'Mostrando 1–5 de 7 créditos'],
    ])('debe ajustar pagina=%p de la URL al rango válido', async (pagina, resumen) => {
      aprobadasQueDevuelve(varias(7));

      renderApp(`/desembolsos?pagina=${pagina}`);

      expect(await screen.findByText(resumen)).toBeInTheDocument();
    });

    it('debe llevar a la solicitud correcta desde la segunda página', async () => {
      aprobadasQueDevuelve(varias(7));
      const { usuario, router } = renderApp('/desembolsos?pagina=2');

      await usuario.click(
        await screen.findByRole('link', { name: 'Desembolsar la solicitud 1 de Ana Pérez' }),
      );

      expect(router.state.location.pathname).toBe('/desembolsos/1');
    });
  });

  it('debe mostrar el error cuando no se pueden cargar los créditos', async () => {
    server.use(
      http.get('*/api/solicitudes', () => errorApi(500, 'ERROR', 'Error interno del servidor')),
    );

    renderApp('/desembolsos');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor');
  });

  it('debe ser accesible desde la navegación principal', async () => {
    aprobadasQueDevuelve([]);
    const { usuario, router } = renderApp('/');

    await usuario.click(
      within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
        name: 'Desembolsos',
      }),
    );

    expect(router.state.location.pathname).toBe('/desembolsos');
  });
});
