import { ListadoPaginado } from '../../../shared/ui/ListadoPaginado';
import type { CreditoConsultado } from '../api/creditos.api';
import { TarjetaCredito } from './TarjetaCredito';

const resumenSinPaginas = (total: number) =>
  total === 1 ? '1 crédito encontrado' : `${total} créditos encontrados`;

// Paginación en el cliente: la API devuelve todos los créditos de un solo cliente (pocos).
export function ListaCreditos({ creditos }: { creditos: CreditoConsultado[] }) {
  return (
    <ListadoPaginado
      elementos={creditos}
      unidad="créditos"
      etiquetaRegion="Resultados"
      etiquetaNavegacion="Paginación de créditos"
      resumenSinPaginas={resumenSinPaginas}
    >
      {(enPagina) =>
        enPagina.map((credito) => <TarjetaCredito key={credito.numeroCredito} credito={credito} />)
      }
    </ListadoPaginado>
  );
}
