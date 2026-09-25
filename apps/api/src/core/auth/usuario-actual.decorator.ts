import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioAutenticado } from './usuario-autenticado';

export interface RequestAutenticada extends Request {
  usuario?: UsuarioAutenticado;
}

// Inyecta el usuario que el JwtAuthGuard dejó en la petición. Solo en rutas protegidas.
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): UsuarioAutenticado | undefined =>
    contexto.switchToHttp().getRequest<RequestAutenticada>().usuario,
);
