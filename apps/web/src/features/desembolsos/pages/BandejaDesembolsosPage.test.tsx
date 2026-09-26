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
