import { screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { SESION_DE_PRUEBA } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';

async function llenarYEnviar(
  usuario: ReturnType<typeof renderApp>['usuario'],
  username: string,
  password: string,
) {
  if (username) await usuario.type(screen.getByLabelText('Usuario'), username);
  if (password) await usuario.type(screen.getByLabelText('Contraseña'), password);
  await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('LoginPage', () => {
  it('debe mostrar el formulario de inicio de sesión', () => {
    renderApp('/login');

    expect(screen.getByRole('heading', { name: 'Simulación de Crédito' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('debe mostrar los errores de validación y no llamar a la API cuando faltan datos', async () => {
    const llamadas: unknown[] = [];
    server.use(http.post('*/api/auth/login', () => void llamadas.push(1)));
    const { usuario } = renderApp('/login');

    await llenarYEnviar(usuario, '', '');

    expect(await screen.findByText('Ingresa tu usuario')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true');
    expect(llamadas).toHaveLength(0);
  });

  it('debe entrar a la aplicación cuando las credenciales son válidas', async () => {
    const { usuario, router } = renderApp('/login');

    await llenarYEnviar(usuario, 'admin', 'Admin123!');

    expect(
      await screen.findByRole('heading', { name: 'Bienvenido, Administrador de prueba' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('debe mostrar el mensaje del backend cuando las credenciales son inválidas', async () => {
    const { usuario, router } = renderApp('/login');

    await llenarYEnviar(usuario, 'admin', 'incorrecta');

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(router.state.location.pathname).toBe('/login');
  });

  it('debe avisar cuando no se puede conectar con el servidor', async () => {
    server.use(http.post('*/api/auth/login', () => HttpResponse.error()));
    const { usuario } = renderApp('/login');

    await llenarYEnviar(usuario, 'admin', 'Admin123!');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor',
    );
  });

  it('debe deshabilitar el botón mientras se envía', async () => {
    server.use(
      http.post('*/api/auth/login', async () => {
        await delay(50);
        return HttpResponse.json(SESION_DE_PRUEBA);
      }),
    );
    const { usuario } = renderApp('/login');

    await llenarYEnviar(usuario, 'admin', 'Admin123!');

    expect(screen.getByRole('button', { name: 'Ingresando…' })).toBeDisabled();
    expect(await screen.findByText('Bienvenido, Administrador de prueba')).toBeInTheDocument();
  });

  it('debe redirigir al inicio cuando ya hay una sesión', () => {
    conSesion();

    const { router } = renderApp('/login');

    expect(router.state.location.pathname).toBe('/');
    expect(within(screen.getByRole('banner')).getByText('Administrador de prueba')).toBeVisible();
  });
});
