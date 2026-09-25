import type { Usuario } from './usuario';

export interface UsuarioRepository {
  buscarPorUsername(username: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
