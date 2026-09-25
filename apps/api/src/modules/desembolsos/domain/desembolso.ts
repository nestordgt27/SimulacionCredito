import type { Banco } from '@simulacion-credito/shared';
import type { CreditoResumen } from '../../creditos/domain/credito.repository';

export interface NuevoDesembolso {
  credito: CreditoResumen;
  banco: Banco;
  /** Texto: preserva ceros a la izquierda. */
  numeroCuenta: string;
  desembolsadoPorId: number;
}

interface DatosDesembolso {
  creditoId: number;
  numeroCredito: string;
  banco: Banco;
  numeroCuenta: string;
  montoCentavos: number;
  desembolsadoPorId: number;
  fecha: Date;
}

export class Desembolso {
  readonly creditoId: number;
  readonly numeroCredito: string;
  readonly banco: Banco;
  readonly numeroCuenta: string;
  readonly montoCentavos: number;
  readonly desembolsadoPorId: number;
  readonly fecha: Date;

  private constructor(datos: DatosDesembolso) {
    this.creditoId = datos.creditoId;
    this.numeroCredito = datos.numeroCredito;
    this.banco = datos.banco;
    this.numeroCuenta = datos.numeroCuenta;
    this.montoCentavos = datos.montoCentavos;
    this.desembolsadoPorId = datos.desembolsadoPorId;
    this.fecha = datos.fecha;
  }

  /** Se desembolsa siempre el monto total del crédito otorgado. */
  static registrar(nuevo: NuevoDesembolso, ahora: Date): Desembolso {
    return new Desembolso({
      creditoId: nuevo.credito.id,
      numeroCredito: nuevo.credito.numeroCredito,
      banco: nuevo.banco,
      numeroCuenta: nuevo.numeroCuenta,
      montoCentavos: nuevo.credito.montoCentavos,
      desembolsadoPorId: nuevo.desembolsadoPorId,
      fecha: ahora,
    });
  }
}
