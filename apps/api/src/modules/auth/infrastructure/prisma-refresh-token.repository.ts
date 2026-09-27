import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { RefreshToken as RefreshTokenRegistro } from '@prisma/client';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import { RefreshToken } from '../domain/refresh-token';
import type { NuevoRefreshToken, RefreshTokenRepository } from '../domain/refresh-token.repository';

const aDominio = (registro: RefreshTokenRegistro): RefreshToken =>
  new RefreshToken({
    id: registro.id,
    usuarioId: registro.usuarioId,
    familiaId: registro.familiaId,
    expiraEn: registro.expiraEn,
    revocadoEn: registro.revocadoEn,
  });

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async crear({ familiaId, ...datos }: NuevoRefreshToken): Promise<RefreshToken> {
    const registro = await this.contexto.cliente.refreshToken.create({
      data: { ...datos, familiaId: familiaId ?? randomUUID() },
    });
    return aDominio(registro);
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshToken | null> {
    const registro = await this.contexto.cliente.refreshToken.findUnique({ where: { tokenHash } });
    return registro ? aDominio(registro) : null;
  }

  async marcarRotado(id: number, reemplazadoPorId: number, fecha: Date): Promise<boolean> {
    // Condición `revocadoEn: null`: si dos peticiones rotan el mismo token, solo una lo logra.
    const { count } = await this.contexto.cliente.refreshToken.updateMany({
      where: { id, revocadoEn: null },
      data: { revocadoEn: fecha, reemplazadoPorId },
    });
    return count === 1;
  }

  async revocarFamilia(familiaId: string, fecha: Date): Promise<void> {
    await this.contexto.cliente.refreshToken.updateMany({
      where: { familiaId, revocadoEn: null },
      data: { revocadoEn: fecha },
    });
  }
}
