import { useMutation } from '@tanstack/react-query';
import { sesionStore } from '../../../shared/auth/sesion-store';
import { iniciarSesion } from '../api/auth.api';

export function useIniciarSesion() {
  return useMutation({
    mutationFn: iniciarSesion,
    onSuccess: (respuesta) => sesionStore.guardar(respuesta),
  });
}
