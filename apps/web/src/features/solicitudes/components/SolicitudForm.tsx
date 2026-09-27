import { zodResolver } from '@hookform/resolvers/zod';
import { EDAD_MAXIMA, Periodicidad } from '@simulacion-credito/shared';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  ETIQUETAS_PERIODICIDAD,
  ETIQUETAS_TIPO_EMPLEO,
  opcionesDe,
} from '../../../shared/lib/etiquetas';
import { Alerta } from '../../../shared/ui/Alerta';
import { Boton } from '../../../shared/ui/Boton';
import { Campo } from '../../../shared/ui/Campo';
import { Seccion } from '../../../shared/ui/Seccion';
import { Selector } from '../../../shared/ui/Selector';
import { useCuotaEstimada } from '../hooks/useCuotaEstimada';
import {
  crearSolicitudSchema,
  edadSegunFecha,
  type SolicitudFormulario,
  type SolicitudValida,
} from '../schemas/solicitud.schema';
import { ResumenCuota } from './ResumenCuota';

const OPCIONES_EMPLEO = [
  { valor: '', etiqueta: 'Selecciona…' },
  ...opcionesDe(ETIQUETAS_TIPO_EMPLEO),
];
const OPCIONES_PERIODICIDAD = opcionesDe(ETIQUETAS_PERIODICIDAD);

const COMO_NUMERO = { valueAsNumber: true } as const;

interface SolicitudFormProps {
  /** Fecha de referencia para la edad (hoy). */
  hoy: Date;
  onSubmit: (solicitud: SolicitudValida) => void;
  enviando: boolean;
  error?: string;
}

export function SolicitudForm({ hoy, onSubmit, enviando, error }: SolicitudFormProps) {
  const schema = useMemo(() => crearSolicitudSchema(hoy), [hoy]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SolicitudFormulario, unknown, SolicitudValida>({
    resolver: zodResolver(schema),
    defaultValues: { credito: { periodicidad: Periodicidad.MENSUAL } },
  });

  const estimacion = useCuotaEstimada(useWatch({ control, name: 'credito' }));
  const fechaNacimiento = useWatch({ control, name: 'cliente.fechaNacimiento' }) ?? '';
  const edad = edadSegunFecha(fechaNacimiento, hoy);
  const edadExcedida = edad !== null && edad > EDAD_MAXIMA;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {error && <Alerta>{error}</Alerta>}

      <Seccion titulo="Datos personales">
        <Campo
          etiqueta="Cédula"
          placeholder="001-010190-0001A"
          error={errors.cliente?.cedula?.message}
          {...register('cliente.cedula')}
        />
        <Campo
          etiqueta="Nombre completo"
          autoComplete="name"
          error={errors.cliente?.nombreCompleto?.message}
          {...register('cliente.nombreCompleto')}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          error={errors.cliente?.correo?.message}
          {...register('cliente.correo')}
        />
        <Campo
          etiqueta="Teléfono"
          type="tel"
          autoComplete="tel"
          error={errors.cliente?.telefono?.message}
          {...register('cliente.telefono')}
        />
        <Campo
          etiqueta="Fecha de nacimiento"
          type="date"
          error={edadExcedida ? undefined : errors.cliente?.fechaNacimiento?.message}
          {...register('cliente.fechaNacimiento')}
        />
        {edad !== null && !edadExcedida && (
          <p className="self-end pb-2 text-sm text-slate-600">Edad: {edad} años</p>
        )}
        {edadExcedida && (
          <div className="md:col-span-2">
            <Alerta>
              <strong>No se puede registrar la solicitud.</strong> El cliente tiene {edad} años y la
              edad máxima permitida es {EDAD_MAXIMA} años.
            </Alerta>
          </div>
        )}
      </Seccion>

      <Seccion titulo="Información laboral">
        <Selector
          etiqueta="Tipo de empleo"
          opciones={OPCIONES_EMPLEO}
          error={errors.empleo?.tipoEmpleo?.message}
          {...register('empleo.tipoEmpleo')}
        />
        <Campo
          etiqueta="Empresa o negocio"
          error={errors.empleo?.empresa?.message}
          {...register('empleo.empresa')}
        />
        <Campo
          etiqueta="Antigüedad laboral (años)"
          type="number"
          min={0}
          step={1}
          error={errors.empleo?.antiguedadLaboralAnios?.message}
          {...register('empleo.antiguedadLaboralAnios', COMO_NUMERO)}
        />
        <Campo
          etiqueta="Ingreso mensual (C$)"
          type="number"
          min={0}
          step="0.01"
          error={errors.empleo?.ingresoMensual?.message}
          {...register('empleo.ingresoMensual', COMO_NUMERO)}
        />
      </Seccion>

      <Seccion titulo="Condiciones del crédito">
        <Campo
          etiqueta="Monto solicitado (C$)"
          type="number"
          min={0}
          step="0.01"
          error={errors.credito?.monto?.message}
          {...register('credito.monto', COMO_NUMERO)}
        />
        <Campo
          etiqueta="Tasa anual (%)"
          type="number"
          min={0}
          step="0.01"
          error={errors.credito?.tasaAnual?.message}
          {...register('credito.tasaAnual', COMO_NUMERO)}
        />
        <Campo
          etiqueta="Cantidad de cuotas"
          type="number"
          min={1}
          step={1}
          error={errors.credito?.cantidadCuotas?.message}
          {...register('credito.cantidadCuotas', COMO_NUMERO)}
        />
        <Selector
          etiqueta="Periodicidad"
          opciones={OPCIONES_PERIODICIDAD}
          error={errors.credito?.periodicidad?.message}
          {...register('credito.periodicidad')}
        />
        <ResumenCuota estimacion={estimacion} />
      </Seccion>

      <div className="flex justify-end">
        <Boton type="submit" cargando={enviando} disabled={edadExcedida}>
          {enviando ? 'Registrando…' : 'Registrar solicitud'}
        </Boton>
      </div>
    </form>
  );
}
