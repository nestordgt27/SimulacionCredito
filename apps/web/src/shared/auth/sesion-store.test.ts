import { SESION_DE_PRUEBA } from '../../test/msw/handlers';
import { sesionStore } from './sesion-store';

const CLAVE = 'simulacion-credito.sesion';

describe('sesionStore', () => {
  it('debe guardar la sesión completa en memoria', () => {
    sesionStore.guardar(SESION_DE_PRUEBA);

    expect(sesionStore.obtener()).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      usuario: SESION_DE_PRUEBA.usuario,
    });
  });

  it('debe persistir el refresh token y el usuario, pero nunca el access token', () => {
    sesionStore.guardar(SESION_DE_PRUEBA);

    const persistida = localStorage.getItem(CLAVE) ?? '';
    expect(JSON.parse(persistida)).toEqual({
      refreshToken: 'refresh-1',
      usuario: SESION_DE_PRUEBA.usuario,
    });
    expect(persistida).not.toContain('access-1');
  });

  it('debe restaurar la sesión persistida sin access token', () => {
    sesionStore.guardar(SESION_DE_PRUEBA);

    sesionStore.restaurar();

    expect(sesionStore.obtener()).toEqual({
      accessToken: null,
      refreshToken: 'refresh-1',
      usuario: SESION_DE_PRUEBA.usuario,
    });
  });

  it('debe quedar sin sesión cuando lo persistido no es JSON válido', () => {
    localStorage.setItem(CLAVE, '{no-es-json');

    sesionStore.restaurar();

    expect(sesionStore.obtener()).toBeNull();
  });

  it('debe borrar la sesión de memoria y de localStorage al cerrar', () => {
    sesionStore.guardar(SESION_DE_PRUEBA);

    sesionStore.cerrar();

    expect(sesionStore.obtener()).toBeNull();
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });

  it('debe notificar a los suscriptores hasta que se desuscriben', () => {
    const suscriptor = vi.fn();
    const desuscribir = sesionStore.suscribir(suscriptor);

    sesionStore.guardar(SESION_DE_PRUEBA);
    desuscribir();
    sesionStore.cerrar();

    expect(suscriptor).toHaveBeenCalledTimes(1);
  });
});
