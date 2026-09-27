import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Al usar prisma.config.ts, Prisma no carga .env por su cuenta: lo hace dotenv/config.
// dotenv no sobrescribe variables ya definidas, así `dotenv -e .env.test` tiene prioridad.
export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: {
    path: 'src/prisma/migrations',
    seed: 'ts-node src/prisma/seed.ts',
  },
});
