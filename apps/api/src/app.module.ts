import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envFilePath, validateEnv } from './core/config/env';
import { CoreModule } from './core/core.module';
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
  ],
})
export class AppModule {}
