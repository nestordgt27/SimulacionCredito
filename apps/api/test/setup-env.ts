import { resolve } from 'node:path';
import { config } from 'dotenv';

// Prisma Client carga apps/api/.env por su cuenta al importarse, y ConfigModule no sobrescribe
// variables ya definidas: sin esto, las pruebas usarían data/dev.db. Se carga .env.test con
// prioridad antes de cualquier import de la app.
config({ path: resolve(__dirname, '../.env.test'), override: true, quiet: true });
