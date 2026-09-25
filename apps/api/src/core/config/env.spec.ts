import { envFilePath, validateEnv } from './env';

const envValido = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'file:../../data/dev.db',
  CORS_ORIGIN: 'http://localhost:5173',
};

describe('validateEnv', () => {
  it('debe convertir PORT a número cuando las variables son válidas', () => {
    const env = validateEnv(envValido);

    expect(env.PORT).toBe(3000);
  });

  it('debe usar valores por defecto cuando NODE_ENV y PORT no están definidos', () => {
    const { DATABASE_URL, CORS_ORIGIN } = envValido;

    const env = validateEnv({ DATABASE_URL, CORS_ORIGIN });

    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('debe lanzar error cuando DATABASE_URL no es una ruta SQLite', () => {
    const config = { ...envValido, DATABASE_URL: 'postgres://localhost/db' };

    expect(() => validateEnv(config)).toThrow(/DATABASE_URL/);
  });

  it('debe lanzar error cuando falta CORS_ORIGIN', () => {
    const config: Record<string, unknown> = { ...envValido };
    delete config.CORS_ORIGIN;

    expect(() => validateEnv(config)).toThrow(/CORS_ORIGIN/);
  });
});

describe('envFilePath', () => {
  it('debe usar .env.test cuando NODE_ENV es test', () => {
    expect(envFilePath('test')).toBe('.env.test');
  });

  it('debe usar .env cuando NODE_ENV no es test', () => {
    expect(envFilePath(undefined)).toBe('.env');
  });
});
