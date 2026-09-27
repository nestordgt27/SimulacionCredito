import { screen, within } from '@testing-library/react';
import { renderApp } from '../test/render';
import { conSesion } from '../test/sesion';

// En pantallas angostas la navegación se pliega detrás de un botón. jsdom no aplica el CSS
// (la visibilidad depende de clases de Tailwind), así que se prueba el estado accesible.
describe('AppLayout: menú en pantallas angostas', () => {
  beforeEach(() => {
    conSesion();
  });

  const botonMenu = () => screen.getByRole('button', { name: 'Menú' });

  it('debe empezar cerrado y controlar el panel con la navegación y la sesión', () => {
    renderApp('/');

    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(botonMenu().getAttribute('aria-controls')!);
    expect(panel).not.toBeNull();
    expect(within(panel!).getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(within(panel!).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('debe abrir y cerrar el menú con el botón', async () => {
    const { usuario } = renderApp('/');

    await usuario.click(botonMenu());
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'true');

    await usuario.click(botonMenu());
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('debe cerrar el menú al elegir una sección', async () => {
    const { usuario, router } = renderApp('/');
    await usuario.click(botonMenu());

    await usuario.click(screen.getByRole('link', { name: 'Consulta' }));

    expect(router.state.location.pathname).toBe('/creditos');
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('debe cerrar el menú con Escape y devolver el foco al botón', async () => {
    const { usuario } = renderApp('/');
    await usuario.click(botonMenu());
    await usuario.tab();

    await usuario.keyboard('{Escape}');

    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false');
    expect(botonMenu()).toHaveFocus();
  });
});
