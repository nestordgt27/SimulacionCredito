import axios from 'axios';

interface CuerpoDeError {
  message?: string | string[];
}

/** Mensaje legible de un error HTTP: el `message` del backend o un texto por defecto. */
export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
  if (!axios.isAxiosError<CuerpoDeError>(error)) {
    return porDefecto;
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor';
  }
  const { message } = error.response.data ?? {};
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  return message ?? porDefecto;
}
