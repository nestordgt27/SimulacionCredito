import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../app/providers';
import { routes } from '../app/routes';

/** Renderiza la aplicación completa (rutas reales) en la ruta indicada. */
export function renderApp(ruta = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const usuario = userEvent.setup();

  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, usuario };
}
