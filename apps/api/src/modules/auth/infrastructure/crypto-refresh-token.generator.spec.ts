import { CryptoRefreshTokenGenerator } from './crypto-refresh-token.generator';

describe('CryptoRefreshTokenGenerator', () => {
  const generador = new CryptoRefreshTokenGenerator();

  it('debe generar tokens distintos de 256 bits en base64url', () => {
    const primero = generador.generar();
    const segundo = generador.generar();

    expect(primero).not.toBe(segundo);
    expect(primero).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('debe producir siempre el mismo hash SHA-256 para el mismo token', () => {
    const token = generador.generar();

    expect(generador.hashear(token)).toBe(generador.hashear(token));
    expect(generador.hashear(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('debe no contener el token original en su hash', () => {
    const token = generador.generar();

    expect(generador.hashear(token)).not.toContain(token);
  });
});
