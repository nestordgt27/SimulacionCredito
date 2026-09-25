import { Transform, type TransformFnParams } from 'class-transformer';
import { Matches } from 'class-validator';

export class ConsultarCreditosQuery {
  /** Misma normalización que al registrar la solicitud: sin espacios y en mayúsculas. */
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^\d{3}-\d{6}-\d{4}[A-Z]$/, {
    message: 'cedula debe tener el formato 000-000000-0000X',
  })
  cedula: string;
}
