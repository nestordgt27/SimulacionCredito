import { useId } from 'react';
import { ETIQUETAS_PERIODICIDAD, ETIQUETAS_TIPO_EMPLEO } from '../../../shared/lib/etiquetas';
import {
  formatearAnios,
  formatearFecha,
  formatearMeses,
  formatearMonto,
  formatearPorcentaje,
} from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudComite } from '../api/comite.api';

// Vista de solo lectura para el dictamen (CLAUDE.md §4): información personal, laboral y
// financiera. Los indicadores (cuota mensual equivalente, relación cuota / ingreso, totales)
// los calcula el backend con packages/shared; aquí solo se muestran.
export function FichaSolicitud({ solicitud }: { solicitud: SolicitudComite }) {
  const { personal, laboral, financiero } = solicitud;

  const datosPersonales: [string, string][] = [
    ['Cédula / Identificación', personal.cedula],
    ['Nombre Completo', personal.nombreCompleto],
    ['Edad', `${personal.edad} años`],
    ['Fecha de nacimiento', formatearFecha(personal.fechaNacimiento)],
    ['Correo', personal.correo],
    ['Teléfono', personal.telefono],
  ];
  const datosLaborales: [string, string][] = [
    ['Tipo de empleo', ETIQUETAS_TIPO_EMPLEO[laboral.tipoEmpleo]],
    ['Empresa', laboral.empresa],
    ['Antigüedad laboral', formatearAnios(laboral.antiguedadLaboralAnios)],
    ['Ingreso mensual', formatearMonto(laboral.ingresoMensual)],
  ];
  const datosFinancieros: [string, string][] = [
    ['Monto solicitado', formatearMonto(financiero.monto)],
    ['Tasa anual', formatearPorcentaje(financiero.tasaAnual)],
    ['Cantidad de cuotas', String(financiero.cantidadCuotas)],
    ['Periodicidad de Pago', ETIQUETAS_PERIODICIDAD[financiero.periodicidad]],
    ['Plazo', formatearMeses(financiero.plazoMeses)],
    ['Cuota nivelada', formatearMonto(financiero.cuotaNivelada)],
    ['Cuota mensual equivalente', formatearMonto(financiero.cuotaMensualEquivalente)],
    [
      'Relación cuota / ingreso',
      financiero.relacionCuotaIngreso === null
        ? 'No aplica (sin ingresos)'
        : formatearPorcentaje(financiero.relacionCuotaIngreso),
    ],
    ['Total a pagar', formatearMonto(financiero.totalAPagar)],
    ['Total de intereses', formatearMonto(financiero.totalIntereses)],
  ];

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Datos de la solicitud</h3>
      <div className="flex flex-col gap-6">
        <GrupoDatos titulo="Información personal" datos={datosPersonales} />
        <GrupoDatos titulo="Información laboral" datos={datosLaborales} />
        <GrupoDatos titulo="Información financiera" datos={datosFinancieros} />
      </div>
    </Tarjeta>
  );
}

function GrupoDatos({ titulo, datos }: { titulo: string; datos: [string, string][] }) {
  const idTitulo = useId();

  return (
    <div
      role="group"
      aria-labelledby={idTitulo}
      className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
    >
      <h4 id={idTitulo} className="mb-2 text-sm font-semibold text-slate-700">
        {titulo}
      </h4>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {datos.map(([termino, valor]) => (
          <div key={termino} className="min-w-0">
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium break-words text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
