import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../domain/password-hasher';

// Argon2id con los parámetros por defecto de la librería (recomendación de OWASP).
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(passwordPlano: string): Promise<string> {
    return hash(passwordPlano);
  }

  verificar(passwordPlano: string, hashGuardado: string): Promise<boolean> {
    return verify(hashGuardado, passwordPlano);
  }
}
