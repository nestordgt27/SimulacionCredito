import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { RefreshTokenGenerator } from '../domain/refresh-token.generator';

// 256 bits aleatorios. Al tener tanta entropía, SHA-256 basta para guardarlo
// (no hace falta un hash lento como Argon2, que es para contraseñas).
@Injectable()
export class CryptoRefreshTokenGenerator implements RefreshTokenGenerator {
  generar(): string {
    return randomBytes(32).toString('base64url');
  }

  hashear(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
