import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UsuarioActual } from '../../../core/auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';
import {
  DesembolsarCreditoUseCase,
  type ResultadoDesembolso,
} from '../application/desembolsar-credito.use-case';
import { DesembolsarDto } from './dto/desembolsar.dto';

@Controller('desembolsos')
export class DesembolsosController {
  constructor(private readonly desembolsarCredito: DesembolsarCreditoUseCase) {}

  @Post(':solicitudId')
  desembolsar(
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: DesembolsarDto,
  ): Promise<ResultadoDesembolso> {
    return this.desembolsarCredito.ejecutar({
      solicitudId,
      banco: dto.banco,
      numeroCuenta: dto.numeroCuenta,
      usuarioId: usuario.id,
    });
  }
}
