import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envFilePath, validateEnv } from './core/config/env';
import { HealthController } from './core/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath(process.env.NODE_ENV),
      validate: validateEnv,
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
