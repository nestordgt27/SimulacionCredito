import { unUsuario } from '../../../../test/support/auth-builders';

describe('Usuario', () => {
  it('debe poder iniciar sesión cuando está activo', () => {
    expect(unUsuario().build().puedeIniciarSesion()).toBe(true);
  });

  it('debe no poder iniciar sesión cuando está inactivo', () => {
    expect(unUsuario().inactivo().build().puedeIniciarSesion()).toBe(false);
  });
});
