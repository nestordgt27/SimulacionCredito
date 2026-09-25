import Decimal from 'decimal.js';

export interface ParametrosCredito {
  monto: number;
  tasaAnual: number;
  cuotas: number;
}

export function validarParametrosCredito({ monto, tasaAnual, cuotas }: ParametrosCredito): void {
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new RangeError('El monto debe ser un número mayor que 0');
  }
  if (new Decimal(monto).decimalPlaces() > 2) {
    throw new RangeError('El monto no puede tener más de 2 decimales');
  }
  if (!Number.isFinite(tasaAnual) || tasaAnual < 0) {
    throw new RangeError('La tasa anual debe ser un número mayor o igual que 0');
  }
  validarCuotas(cuotas);
}

export function validarCuotas(cuotas: number): void {
  if (!Number.isInteger(cuotas) || cuotas < 1) {
    throw new RangeError('La cantidad de cuotas debe ser un entero mayor o igual que 1');
  }
}

export function validarFecha(fecha: Date, nombre: string): void {
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(`${nombre} no es una fecha válida`);
  }
}
