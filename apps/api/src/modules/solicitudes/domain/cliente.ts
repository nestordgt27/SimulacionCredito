import { calcularEdad } from '@simulacion-credito/shared';

export interface DatosCliente {
  cedula: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  /** Solo fecha, a las 00:00 UTC. */
  fechaNacimiento: Date;
}

export class Cliente {
  readonly cedula: string;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly telefono: string;
  readonly fechaNacimiento: Date;

  constructor(datos: DatosCliente) {
    this.cedula = datos.cedula;
    this.nombreCompleto = datos.nombreCompleto;
    this.correo = datos.correo;
    this.telefono = datos.telefono;
    this.fechaNacimiento = datos.fechaNacimiento;
  }

  naceDespuesDe(fecha: Date): boolean {
    return this.fechaNacimiento.getTime() > fecha.getTime();
  }

  edadA(fecha: Date): number {
    return calcularEdad(this.fechaNacimiento, fecha);
  }
}
