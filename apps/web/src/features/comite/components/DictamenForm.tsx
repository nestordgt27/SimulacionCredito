import { useForm } from 'react-hook-form';
import { Alerta } from '../../../shared/ui/Alerta';
import { AreaTexto } from '../../../shared/ui/AreaTexto';
import { Boton } from '../../../shared/ui/Boton';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import {
  aprobacionSchema,
  rechazoSchema,
  type DictamenFormulario,
} from '../schemas/dictamen.schema';

interface DictamenFormProps {
  onAprobar: (observaciones: string) => void;
  onRechazar: (observaciones: string | undefined) => void;
  procesando: boolean;
  error?: string;
}

// Un mismo campo con dos acciones de reglas distintas: cada botón valida con su esquema
// (aprobar exige observaciones, rechazar no), por eso no se usa un resolver único.
export function DictamenForm({ onAprobar, onRechazar, procesando, error }: DictamenFormProps) {
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<DictamenFormulario>({ defaultValues: { observaciones: '' } });

  function aprobar() {
    const resultado = aprobacionSchema.safeParse(getValues());
    if (!resultado.success) {
      setError('observaciones', { message: resultado.error.issues[0]?.message });
      return;
    }
    clearErrors();
    onAprobar(resultado.data.observaciones);
  }

  function rechazar() {
    const resultado = rechazoSchema.safeParse(getValues());
    if (!resultado.success) {
      setError('observaciones', { message: resultado.error.issues[0]?.message });
      return;
    }
    clearErrors();
    onRechazar(resultado.data.observaciones);
  }

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Dictamen del comité</h3>
      <div className="flex flex-col gap-4">
        {error && <Alerta>{error}</Alerta>}
        <AreaTexto
          etiqueta="Observaciones"
          ayuda="Obligatorias para aprobar; opcionales para rechazar."
          error={errors.observaciones?.message}
          {...register('observaciones')}
        />
        <div className="flex justify-end gap-3">
          <Boton variante="secundario" disabled={procesando} onClick={rechazar}>
            Rechazar Crédito
          </Boton>
          <Boton cargando={procesando} onClick={aprobar}>
            Aprobar Crédito
          </Boton>
        </div>
      </div>
    </Tarjeta>
  );
}
