import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { crearQueryClient } from './query-client';

function errorHttp(status: number): AxiosError {
  const response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

const reintentar = (intentos: number, error: unknown): boolean => {
  const { retry } = crearQueryClient().getDefaultOptions().queries ?? {};
  return typeof retry === 'function' ? retry(intentos, error as Error) : false;
};

describe('crearQueryClient', () => {
  it.each([400, 401, 404, 409, 422])('debe no reintentar las consultas con error %i', (status) => {
    expect(reintentar(0, errorHttp(status))).toBe(false);
  });

  it('debe reintentar hasta 2 veces los errores del servidor', () => {
    expect([0, 1, 2].map((intentos) => reintentar(intentos, errorHttp(503)))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('debe reintentar los errores de red', () => {
    expect(reintentar(0, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
  });

  it('debe no reintentar las mutaciones', () => {
    expect(crearQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
