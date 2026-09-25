import { RefreshToken, type DatosRefreshToken } from '../../src/modules/auth/domain/refresh-token';
import { Usuario, type DatosUsuario } from '../../src/modules/auth/domain/usuario';

class UsuarioBuilder {
  private datos: DatosUsuario = {
    id: 1,
    username: 'admin',
    passwordHash: 'hash-admin',
    nombreCompleto: 'Administrador',
    rol: 'ADMIN',
    activo: true,
  };

  conId(id: number): this {
    this.datos.id = id;
    return this;
  }

  inactivo(): this {
    this.datos.activo = false;
    return this;
  }

  build(): Usuario {
    return new Usuario(this.datos);
  }
}

class RefreshTokenBuilder {
  private datos: DatosRefreshToken = {
    id: 10,
    usuarioId: 1,
    familiaId: 'familia-1',
    expiraEn: new Date('2026-10-02T12:00:00Z'),
    revocadoEn: null,
  };

  conId(id: number): this {
    this.datos.id = id;
    return this;
  }

  deUsuario(usuarioId: number): this {
    this.datos.usuarioId = usuarioId;
    return this;
  }

  expiraEn(fecha: string): this {
    this.datos.expiraEn = new Date(fecha);
    return this;
  }

  revocado(fecha = '2026-09-25T11:00:00Z'): this {
    this.datos.revocadoEn = new Date(fecha);
    return this;
  }

  build(): RefreshToken {
    return new RefreshToken(this.datos);
  }
}

export const unUsuario = () => new UsuarioBuilder();
export const unRefreshToken = () => new RefreshTokenBuilder();
