import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { EstadoSolicitud, Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import { Cliente } from '../domain/cliente';
import { Solicitud } from '../domain/solicitud';
import type { FiltroSolicitudes, SolicitudRepository } from '../domain/solicitud.repository';

type SolicitudConCliente = Prisma.SolicitudGetPayload<{ include: { cliente: true } }>;

// Los enums se guardan como texto (CLAUDE.md §4) y solo se escriben desde el dominio,
// por eso la conversión de string al tipo de shared es segura.
const aDominio = (registro: SolicitudConCliente): Solicitud =>
  Solicitud.reconstituir({
    id: registro.id,
    cliente: new Cliente({
      cedula: registro.cliente.cedula,
      nombreCompleto: registro.cliente.nombreCompleto,
      correo: registro.cliente.correo,
      telefono: registro.cliente.telefono,
      fechaNacimiento: registro.cliente.fechaNacimiento,
    }),
    laboral: {
      tipoEmpleo: registro.tipoEmpleo as TipoEmpleo,
      empresa: registro.empresa,
      antiguedadLaboralAnios: registro.antiguedadLaboralAnios,
      ingresoMensualCentavos: registro.ingresoMensualCentavos,
    },
    condiciones: {
      montoCentavos: registro.montoSolicitadoCentavos,
      tasaAnualBps: registro.tasaAnualBps,
      cantidadCuotas: registro.cantidadCuotas,
      periodicidad: registro.periodicidad as Periodicidad,
    },
    cuotaNiveladaCentavos: registro.cuotaNiveladaCentavos,
    estado: registro.estado as EstadoSolicitud,
    observaciones: registro.observaciones,
    creadaPorId: registro.creadaPorId,
    creadaEn: registro.createdAt,
  });

@Injectable()
export class PrismaSolicitudRepository implements SolicitudRepository {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async crear(solicitud: Solicitud): Promise<Solicitud> {
    const { cliente, laboral, condiciones } = solicitud;
    const datosCliente = {
      nombreCompleto: cliente.nombreCompleto,
      correo: cliente.correo,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento,
    };

    const { id: clienteId } = await this.contexto.cliente.cliente.upsert({
      where: { cedula: cliente.cedula },
      create: { cedula: cliente.cedula, ...datosCliente },
      update: datosCliente,
    });

    const registro = await this.contexto.cliente.solicitud.create({
      data: {
        clienteId,
        tipoEmpleo: laboral.tipoEmpleo,
        empresa: laboral.empresa,
        antiguedadLaboralAnios: laboral.antiguedadLaboralAnios,
        ingresoMensualCentavos: laboral.ingresoMensualCentavos,
        montoSolicitadoCentavos: condiciones.montoCentavos,
        cantidadCuotas: condiciones.cantidadCuotas,
        tasaAnualBps: condiciones.tasaAnualBps,
        periodicidad: condiciones.periodicidad,
        cuotaNiveladaCentavos: solicitud.cuotaNiveladaCentavos,
        estado: solicitud.estado,
        creadaPorId: solicitud.creadaPorId,
        createdAt: solicitud.creadaEn,
        historial: {
          create: {
            estadoAnterior: null,
            estadoNuevo: solicitud.estado,
            usuarioId: solicitud.creadaPorId,
            fecha: solicitud.creadaEn,
          },
        },
      },
      include: { cliente: true },
    });

    return aDominio(registro);
  }

  async listar({ estado }: FiltroSolicitudes): Promise<Solicitud[]> {
    const registros = await this.contexto.cliente.solicitud.findMany({
      where: { estado },
      include: { cliente: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return registros.map(aDominio);
  }
}
