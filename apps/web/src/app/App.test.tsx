import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from './providers';
import { routes } from './routes';

function renderRuta(ruta: string) {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] });
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('App', () => {
  it('debe mostrar el título de la aplicación cuando se abre la ruta de inicio', () => {
    renderRuta('/');

    expect(screen.getByRole('heading', { name: 'Simulación de Crédito' })).toBeInTheDocument();
  });
});
