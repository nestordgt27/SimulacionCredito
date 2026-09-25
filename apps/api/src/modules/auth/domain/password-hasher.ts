export interface PasswordHasher {
  hash(passwordPlano: string): Promise<string>;
  verificar(passwordPlano: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
