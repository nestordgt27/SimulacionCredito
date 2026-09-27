import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { CLOCK } from './domain/clock';
import { HealthController } from './health/health.controller';
import { ErroresDeDominioFilter } from './http/errores-de-dominio.filter';
import { SystemClock } from './infrastructure/system-clock';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: APP_FILTER, useClass: ErroresDeDominioFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
  exports: [CLOCK],
})
export class CoreModule {}
