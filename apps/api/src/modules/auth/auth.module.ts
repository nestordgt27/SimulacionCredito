import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../../core/config/env';
import { AUTH_OPTIONS, type AuthOptions } from './application/auth-options';
import { CerrarSesionUseCase } from './application/cerrar-sesion.use-case';
import { EmisorDeSesion } from './application/emisor-de-sesion';
import { IniciarSesionUseCase } from './application/iniciar-sesion.use-case';
import { RefrescarSesionUseCase } from './application/refrescar-sesion.use-case';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { REFRESH_TOKEN_GENERATOR } from './domain/refresh-token.generator';
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository';
import { TOKEN_SERVICE } from './domain/token.service';
import { USUARIO_REPOSITORY } from './domain/usuario.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { CryptoRefreshTokenGenerator } from './infrastructure/crypto-refresh-token.generator';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository';
import { PrismaUsuarioRepository } from './infrastructure/prisma-usuario.repository';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    IniciarSesionUseCase,
    RefrescarSesionUseCase,
    CerrarSesionUseCase,
    EmisorDeSesion,
    {
      provide: AUTH_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): AuthOptions => ({
        refreshTokenTtlDias: config.get('REFRESH_TOKEN_TTL_DIAS', { infer: true }),
      }),
    },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: REFRESH_TOKEN_GENERATOR, useClass: CryptoRefreshTokenGenerator },
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
