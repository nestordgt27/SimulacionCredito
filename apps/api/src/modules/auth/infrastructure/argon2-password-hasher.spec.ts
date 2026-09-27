import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('debe generar un hash argon2id que no contiene la contraseña en texto plano', async () => {
    const hash = await hasher.hash('Admin123!');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('Admin123!');
  });

  it('debe generar hashes distintos para la misma contraseña por usar sal aleatoria', async () => {
    const [primero, segundo] = await Promise.all([
      hasher.hash('Admin123!'),
      hasher.hash('Admin123!'),
    ]);

    expect(primero).not.toBe(segundo);
  });

  it('debe verificar la contraseña cuando coincide con el hash', async () => {
    const hash = await hasher.hash('Admin123!');

    await expect(hasher.verificar('Admin123!', hash)).resolves.toBe(true);
  });

  it('debe rechazar la contraseña cuando no coincide con el hash', async () => {
    const hash = await hasher.hash('Admin123!');

    await expect(hasher.verificar('admin123!', hash)).resolves.toBe(false);
  });
});
