import { sembradoPermitido } from './sembrado-permitido';

describe('sembradoPermitido', () => {
  it.each([
    [{ NODE_ENV: 'development' }, true],
    [{ NODE_ENV: 'test' }, true],
    [{}, true],
    [{ NODE_ENV: 'production' }, false],
    [{ NODE_ENV: 'production', SEMBRAR_USUARIO_PRUEBA: 'false' }, false],
    [{ NODE_ENV: 'production', SEMBRAR_USUARIO_PRUEBA: '1' }, false],
    [{ NODE_ENV: 'production', SEMBRAR_USUARIO_PRUEBA: 'true' }, true],
  ])('con %p debe devolver %p', (entorno, esperado) => {
    expect(sembradoPermitido(entorno)).toBe(esperado);
  });
});
