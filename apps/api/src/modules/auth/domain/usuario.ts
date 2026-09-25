export interface DatosUsuario {
  id: number;
  username: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: string;
  activo: boolean;
}

export class Usuario {
  readonly id: number;
  readonly username: string;
  readonly passwordHash: string;
  readonly nombreCompleto: string;
  readonly rol: string;
  readonly activo: boolean;

  constructor(datos: DatosUsuario) {
    this.id = datos.id;
    this.username = datos.username;
    this.passwordHash = datos.passwordHash;
    this.nombreCompleto = datos.nombreCompleto;
    this.rol = datos.rol;
    this.activo = datos.activo;
  }

  puedeIniciarSesion(): boolean {
    return this.activo;
  }
}
