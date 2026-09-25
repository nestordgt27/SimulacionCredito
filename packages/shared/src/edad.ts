import { validarFecha } from './validaciones';

/**
 * Edad en años cumplidos a la `fechaReferencia` (en UTC).
 * La fecha de referencia es un parámetro para que la función sea pura: quien la llama
 * pasa "hoy" desde su `Clock` (backend) o desde el navegador (frontend).
 * Quien nació un 29 de febrero cumple años el 1 de marzo en los años no bisiestos.
 */
export function calcularEdad(fechaNacimiento: Date, fechaReferencia: Date): number {
  validarFecha(fechaNacimiento, 'La fecha de nacimiento');
  validarFecha(fechaReferencia, 'La fecha de referencia');
  if (fechaNacimiento.getTime() > fechaReferencia.getTime()) {
    throw new RangeError('La fecha de nacimiento no puede ser posterior a la fecha de referencia');
  }

  const anios = fechaReferencia.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
  const mesReferencia = fechaReferencia.getUTCMonth();
  const mesNacimiento = fechaNacimiento.getUTCMonth();
  const yaCumplioEsteAnio =
    mesReferencia > mesNacimiento ||
    (mesReferencia === mesNacimiento &&
      fechaReferencia.getUTCDate() >= fechaNacimiento.getUTCDate());

  return yaCumplioEsteAnio ? anios : anios - 1;
}
