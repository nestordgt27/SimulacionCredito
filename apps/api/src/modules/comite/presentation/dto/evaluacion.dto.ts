import { IsOptional, IsString, MaxLength } from 'class-validator';

// Se acepta un texto vacío para que el dominio responda 422 OBSERVACIONES_REQUERIDAS
// (la regla de negocio vive en Solicitud.aprobar, no en el DTO).
export class AprobarSolicitudDto {
  @IsString()
  @MaxLength(1000)
  observaciones: string;
}

export class RechazarSolicitudDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
