import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { mensajeDeError } from './errores';

function errorHttp(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('mensajeDeError', () => {
  it('debe usar el message del backend', () => {
    expect(mensajeDeError(errorHttp(401, { message: 'Usuario o contraseña incorrectos' }))).toBe(
      'Usuario o contraseña incorrectos',
    );
  });

  it('debe unir los mensajes de validación cuando el backend envía una lista', () => {
    expect(mensajeDeError(errorHttp(400, { message: ['a inválido', 'b inválido'] }))).toBe(
      'a inválido. b inválido',
    );
  });

  it('debe usar el texto por defecto cuando la respuesta no trae message', () => {
    expect(mensajeDeError(errorHttp(500, ''), 'Falló')).toBe('Falló');
  });

  it('debe avisar de un problema de conexión cuando no hubo respuesta', () => {
    expect(mensajeDeError(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(
      'No se pudo conectar con el servidor',
    );
  });

  it('debe usar el texto por defecto cuando el error no es de HTTP', () => {
    expect(mensajeDeError(new Error('otro'), 'Falló')).toBe('Falló');
  });
});
