import { Banco, FORMATO_NUMERO_CUENTA } from '@simulacion-credito/shared';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsIn, Matches } from 'class-validator';

export class DesembolsarDto {
  @IsIn(Object.values(Banco), {
    message: `banco debe ser uno de: ${Object.values(Banco).join(', ')}`,
  })
  banco: Banco;

  /** Solo dígitos; se guarda como texto para preservar los ceros a la izquierda. */
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(FORMATO_NUMERO_CUENTA, { message: 'numeroCuenta debe tener entre 6 y 20 dígitos' })
  numeroCuenta: string;
}
