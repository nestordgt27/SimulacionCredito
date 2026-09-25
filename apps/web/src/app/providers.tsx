import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { crearQueryClient } from './query-client';

interface AppProvidersProps {
  children: ReactNode;
  /** Solo para pruebas: permite inyectar un QueryClient propio. */
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [cliente] = useState(() => queryClient ?? crearQueryClient());

  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
