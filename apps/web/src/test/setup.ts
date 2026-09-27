import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { sesionStore } from '../shared/auth/sesion-store';
import { server } from './msw/server';

// Cualquier petición sin handler falla la prueba: no hay red real en las pruebas.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  sesionStore.cerrar();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
