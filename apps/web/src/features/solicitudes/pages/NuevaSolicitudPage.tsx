import { useState } from 'react';
import { mensajeDeError } from '../../../shared/api/errores';
import { ResultadoSolicitud } from '../components/ResultadoSolicitud';
import { SolicitudForm } from '../components/SolicitudForm';
import { useCrearSolicitud } from '../hooks/useCrearSolicitud';

export function NuevaSolicitudPage() {
  // "Hoy" se fija al abrir la página: la edad y el bloqueo no cambian mientras se llena.
  const [hoy] = useState(() => new Date());
  const crearSolicitud = useCrearSolicitud();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Nueva solicitud de crédito</h2>
        <p className="text-sm text-slate-600">
          Completa los datos del cliente, su información laboral y las condiciones del crédito.
        </p>
      </div>
      {crearSolicitud.isSuccess ? (
        <ResultadoSolicitud
          solicitud={crearSolicitud.data}
          onNueva={() => crearSolicitud.reset()}
        />
      ) : (
        <SolicitudForm
          hoy={hoy}
          enviando={crearSolicitud.isPending}
          error={
            crearSolicitud.isError
              ? mensajeDeError(crearSolicitud.error, 'No se pudo registrar la solicitud')
              : undefined
          }
          onSubmit={(solicitud) => crearSolicitud.mutate(solicitud)}
        />
      )}
    </div>
  );
}
