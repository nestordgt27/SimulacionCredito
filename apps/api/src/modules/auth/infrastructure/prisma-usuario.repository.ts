import { Injectable } from '@nestjs/common';
import type { Usuario as UsuarioRegistro } from '@prisma/client';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import { Usuario } from '../domain/usuario';
import type { UsuarioRepository } from '../domain/usuario.repository';

const aDominio = (registro: UsuarioRegistro): Usuario =>
  new Usuario({
    id: registro.id,
    username: registro.username,
    passwordHash: registro.passwordHash,
    nombreCompleto: registro.nombreCompleto,
    rol: registro.rol,
    activo: registro.activo,
  });

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async buscarPorUsername(username: string): Promise<Usuario | null> {
    const registro = await this.contexto.cliente.usuario.findUnique({ where: { username } });
    return registro ? aDominio(registro) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const registro = await this.contexto.cliente.usuario.findUnique({ where: { id } });
    return registro ? aDominio(registro) : null;
  }
}
