import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envFilePath, validateEnv } from './core/config/env';
import { CoreModule } from './core/core.module';
import { ComiteModule } from './modules/comite/comite.module';
import { CreditosModule } from './modules/creditos/creditos.module';
import { DesembolsosModule } from './modules/desembolsos/desembolsos.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath(process.env.NODE_ENV),
      validate: validateEnv,
    }),
    CoreModule,
    PrismaModule,
    SolicitudesModule,
    ComiteModule,
    DesembolsosModule,
    CreditosModule,
  ],
})
export class AppModule {}
