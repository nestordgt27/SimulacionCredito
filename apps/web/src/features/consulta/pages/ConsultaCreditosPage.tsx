import { useSearchParams } from 'react-router';
import { mensajeDeError } from '../../../shared/api/errores';
import { leerPagina } from '../../../shared/lib/paginacion';
import { Alerta } from '../../../shared/ui/Alerta';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import { BuscadorCedula } from '../components/BuscadorCedula';
import { ListaCreditos } from '../components/ListaCreditos';
import { useCreditosPorCedula } from '../hooks/useCreditosPorCedula';
import { cedulaValida } from '../schemas/busqueda.schema';

export function ConsultaCreditosPage() {
  // La cédula y la página viven en la URL (?cedula=…&pagina=…): la búsqueda se puede
  // compartir y sobrevive al recargo.
  const [parametros, setParametros] = useSearchParams();
  const cedula = cedulaValida(parametros.get('cedula'));
  const pagina = leerPagina(parametros.get('pagina'));
  const creditos = useCreditosPorCedula(cedula);

  function irAPagina(nueva: number) {
    // La página 1 no se escribe en la URL para mantenerla limpia.
    setParametros(
      nueva > 1 ? { cedula: cedula ?? '', pagina: String(nueva) } : { cedula: cedula ?? '' },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Consulta de créditos</h2>
        <p className="text-sm text-slate-600">
          Busca los créditos de un cliente por su cédula y revisa su plan de pagos.
        </p>
      </div>

      <BuscadorCedula
        // Al cambiar la cédula de la URL (atrás/adelante) el formulario se reinicia con ella.
        key={cedula ?? ''}
        cedulaInicial={cedula ?? ''}
        buscando={creditos.isFetching}
        // Una búsqueda nueva siempre empieza en la página 1.
        onBuscar={(nueva) => setParametros({ cedula: nueva })}
      />

      {cedula && creditos.isPending && <p className="text-sm text-slate-500">Buscando créditos…</p>}
      {creditos.isError && (
        <Alerta>{mensajeDeError(creditos.error, 'No se pudieron consultar los créditos')}</Alerta>
      )}
      {creditos.isSuccess && creditos.data.length === 0 && (
        <Tarjeta>
          <p className="text-sm text-slate-600">
            No se encontraron créditos para la cédula {cedula}.
          </p>
        </Tarjeta>
      )}
      {creditos.isSuccess && creditos.data.length > 0 && (
        <ListaCreditos creditos={creditos.data} pagina={pagina} onCambiarPagina={irAPagina} />
      )}
    </div>
  );
}
