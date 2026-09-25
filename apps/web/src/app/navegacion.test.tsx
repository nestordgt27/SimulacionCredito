import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { renderApp } from '../test/render';
import { conSesion } from '../test/sesion';
import { sesionStore } from '../shared/auth/sesion-store';

describe('Navegación con sesión', () => {
  it('debe enviar al login cuando se abre una ruta protegida sin sesión', () => {
    const { router } = renderApp('/');

    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('debe volver a la ruta pedida después de iniciar sesión', async () => {
    const { usuario, router } = renderApp('/');

    await usuario.type(screen.getByLabelText('Usuario'), 'admin');
    await usuario.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Bienvenido, Administrador de prueba')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('debe mostrar el inicio con el nombre del usuario cuando hay sesión', () => {
    conSesion();

    renderApp('/');

    expect(
      screen.getByRole('heading', { name: 'Bienvenido, Administrador de prueba' }),
    ).toBeInTheDocument();
  });

  it('debe revocar el refresh token en el servidor y volver al login al cerrar sesión', async () => {
    const cuerpos: unknown[] = [];
    server.use(
      http.post('*/api/auth/logout', async ({ request }) => {
        cuerpos.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    conSesion();
    const { usuario, router } = renderApp('/');

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(cuerpos).toEqual([{ refreshToken: 'refresh-1' }]);
    expect(localStorage.length).toBe(0);
  });

  it('debe cerrar la sesión local aunque falle la revocación en el servidor', async () => {
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()));
    conSesion();
    const { usuario } = renderApp('/');

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(sesionStore.obtener()).toBeNull();
  });

  it('debe volver al login cuando la sesión se cierra por un refresh fallido', () => {
    conSesion();
    const { router } = renderApp('/');

    act(() => sesionStore.cerrar());

    expect(router.state.location.pathname).toBe('/login');
  });

  it('debe redirigir las rutas desconocidas al inicio', () => {
    conSesion();

    const { router } = renderApp('/no-existe');

    expect(router.state.location.pathname).toBe('/');
  });
});
