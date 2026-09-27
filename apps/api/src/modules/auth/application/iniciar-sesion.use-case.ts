import { Inject, Injectable } from '@nestjs/common';
import { CredencialesInvalidasError } from '../domain/errores';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher';
import { USUARIO_REPOSITORY, type UsuarioRepository } from '../domain/usuario.repository';
import { EmisorDeSesion } from './emisor-de-sesion';
import type { Sesion } from './sesion';

export interface Credenciales {
  username: string;
  password: string;
}

@Injectable()
export class IniciarSesionUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly emisor: EmisorDeSesion,
  ) {}

  async ejecutar({ username, password }: Credenciales): Promise<Sesion> {
    const usuario = await this.usuarios.buscarPorUsername(username);
    if (!usuario?.puedeIniciarSesion()) {
      throw new CredencialesInvalidasError();
    }
    if (!(await this.hasher.verificar(password, usuario.passwordHash))) {
      throw new CredencialesInvalidasError();
    }

    const { sesion } = await this.emisor.emitir(usuario);
    return sesion;
  }
}
