// Aritmética de fechas en UTC para que el resultado no dependa de la zona horaria
// del servidor ni del navegador.

const MS_POR_DIA = 86_400_000;

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_POR_DIA);
}

// Si el día no existe en el mes destino, se usa el último día de ese mes
// (31 de enero + 1 mes = 28 o 29 de febrero).
export function sumarMeses(fecha: Date, meses: number): Date {
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + meses;
  const ultimoDiaDelMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const dia = Math.min(fecha.getUTCDate(), ultimoDiaDelMes);

  return new Date(
    Date.UTC(
      anio,
      mes,
      dia,
      fecha.getUTCHours(),
      fecha.getUTCMinutes(),
      fecha.getUTCSeconds(),
      fecha.getUTCMilliseconds(),
    ),
  );
}
