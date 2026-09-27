import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().startsWith('file:', 'DATABASE_URL debe ser una ruta SQLite (file:...)'),
  CORS_ORIGIN: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL_SEGUNDOS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DIAS: z.coerce.number().int().positive().default(7),
});

export type Env = z.infer<typeof envSchema>;

export function envFilePath(nodeEnv: string | undefined): string {
  return nodeEnv === 'test' ? '.env.test' : '.env';
}

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
