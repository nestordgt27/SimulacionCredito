import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Los errores 4xx (validación, 401 ya tratado por el interceptor, 404, 409...) no se reintentan.
function debeReintentar(intentos: number, error: unknown): boolean {
  const estado = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (estado !== undefined && estado >= 400 && estado < 500) {
    return false;
  }
  return intentos < 2;
}

export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: debeReintentar, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
