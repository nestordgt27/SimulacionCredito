import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { ErrorDeDominio, type TipoErrorDeDominio } from '../domain/error-de-dominio';

const ESTADO_HTTP: Record<TipoErrorDeDominio, HttpStatus> = {
  NO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
  REGLA_NEGOCIO: HttpStatus.UNPROCESSABLE_ENTITY,
};

export interface RespuestaDeError {
  statusCode: number;
  error: string;
  message: string;
}

@Catch(ErrorDeDominio)
export class ErroresDeDominioFilter implements ExceptionFilter<ErrorDeDominio> {
  catch(error: ErrorDeDominio, host: ArgumentsHost): void {
    const statusCode = ESTADO_HTTP[error.tipo];
    const cuerpo: RespuestaDeError = { statusCode, error: error.codigo, message: error.message };

    host.switchToHttp().getResponse<Response>().status(statusCode).json(cuerpo);
  }
}
