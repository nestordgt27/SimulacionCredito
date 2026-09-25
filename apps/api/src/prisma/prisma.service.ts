import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { Env } from '../core/config/env';

// Solo los adaptadores de `infrastructure` y las pruebas de integración usan este servicio
// (CLAUDE.md §2.2: Prisma no sale de infraestructura).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ datasources: { db: { url: config.get('DATABASE_URL', { infer: true }) } } });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
