import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Boton } from '../../../shared/ui/Boton';
import { Campo } from '../../../shared/ui/Campo';
import { busquedaSchema, type Busqueda, type BusquedaFormulario } from '../schemas/busqueda.schema';

interface BuscadorCedulaProps {
  cedulaInicial: string;
  buscando: boolean;
  onBuscar: (cedula: string) => void;
}

export function BuscadorCedula({ cedulaInicial, buscando, onBuscar }: BuscadorCedulaProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusquedaFormulario, unknown, Busqueda>({
    resolver: zodResolver(busquedaSchema),
    defaultValues: { cedula: cedulaInicial },
  });

  return (
    <form
      role="search"
      aria-label="Buscar créditos por cédula"
      onSubmit={handleSubmit(({ cedula }) => onBuscar(cedula))}
      noValidate
      className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-start"
    >
      <Campo
        etiqueta="Cédula del cliente"
        placeholder="001-010190-0001A"
        className="md:flex-1"
        error={errors.cedula?.message}
        {...register('cedula')}
      />
      <Boton type="submit" cargando={buscando} className="md:mt-6">
        Buscar
      </Boton>
    </form>
  );
}
