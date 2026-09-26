import { useSearchParams } from 'react-router';
import { leerPagina } from './paginacion';

const PARAMETRO = 'pagina';

/**
 * Página actual guardada en la URL (?pagina=N): se puede compartir y sobrevive al recargo.
 * Conserva los demás parámetros (por ejemplo, ?cedula=) y no escribe la página 1.
 */
export function usePaginaEnUrl(): [number, (pagina: number) => void] {
  const [parametros, setParametros] = useSearchParams();

  function irAPagina(pagina: number) {
    setParametros((actuales) => {
      const siguientes = new URLSearchParams(actuales);
      if (pagina > 1) {
        siguientes.set(PARAMETRO, String(pagina));
      } else {
        siguientes.delete(PARAMETRO);
      }
      return siguientes;
    });
  }

  return [leerPagina(parametros.get(PARAMETRO)), irAPagina];
}
