import { Controller, Get, Query } from '@nestjs/common';
import {
  ConsultarCreditosUseCase,
  type CreditoVista,
} from '../application/consultar-creditos.use-case';
import { ConsultarCreditosQuery } from './dto/consultar-creditos.query';

@Controller('creditos')
export class CreditosController {
  constructor(private readonly consultarCreditos: ConsultarCreditosUseCase) {}

  @Get()
  listar(@Query() { cedula }: ConsultarCreditosQuery): Promise<CreditoVista[]> {
    return this.consultarCreditos.porCedula(cedula);
  }
}
