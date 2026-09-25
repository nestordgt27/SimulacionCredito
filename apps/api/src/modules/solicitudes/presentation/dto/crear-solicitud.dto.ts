import { Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Máximo que cabe en un Int de 32 bits expresado en centavos (CLAUDE.md §4). */
export const MONTO_MAXIMO = 21_474_836.47;
export const CUOTAS_MAXIMAS = 360;

const recortar = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
const recortarEnMayusculas = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;
const recortarEnMinusculas = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const DOS_DECIMALES = { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false };

export class ClienteDto {
  @Transform(recortarEnMayusculas)
  @Matches(/^\d{3}-\d{6}-\d{4}[A-Z]$/, {
    message: 'cedula debe tener el formato 000-000000-0000X',
  })
  cedula: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreCompleto: string;

  @Transform(recortarEnMinusculas)
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @Transform(recortar)
  @Matches(/^\+?\d{8,15}$/, { message: 'telefono debe tener entre 8 y 15 dígitos' })
  telefono: string;

  /** Solo fecha: YYYY-MM-DD. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaNacimiento debe tener el formato YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  fechaNacimiento: string;
}

export class EmpleoDto {
  @IsIn(Object.values(TipoEmpleo))
  tipoEmpleo: TipoEmpleo;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  empresa: string;

  @IsInt()
  @Min(0)
  @Max(80)
  antiguedadLaboralAnios: number;

  @IsNumber(DOS_DECIMALES)
  @Min(0)
  @Max(MONTO_MAXIMO)
  ingresoMensual: number;
}

export class CreditoDto {
  @IsNumber(DOS_DECIMALES)
  @IsPositive()
  @Max(MONTO_MAXIMO)
  monto: number;

  /** Porcentaje anual con máximo 2 decimales (se guarda en puntos básicos). */
  @IsNumber(DOS_DECIMALES)
  @Min(0)
  @Max(100)
  tasaAnual: number;

  @IsInt()
  @Min(1)
  @Max(CUOTAS_MAXIMAS)
  cantidadCuotas: number;

  @IsIn(Object.values(Periodicidad))
  periodicidad: Periodicidad;

  /**
   * Se acepta para no romper clientes que la envían, pero se IGNORA: el servidor siempre
   * recalcula la cuota con packages/shared (CLAUDE.md §4).
   */
  @IsOptional()
  @IsNumber()
  cuotaNivelada?: number;
}

export class CrearSolicitudDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ClienteDto)
  cliente: ClienteDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => EmpleoDto)
  empleo: EmpleoDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreditoDto)
  credito: CreditoDto;
}
