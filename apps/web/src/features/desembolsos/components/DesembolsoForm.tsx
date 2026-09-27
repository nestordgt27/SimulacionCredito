import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ETIQUETAS_BANCO, opcionesDe } from '../../../shared/lib/etiquetas';
import { formatearMonto } from '../../../shared/lib/formato';
import { Alerta } from '../../../shared/ui/Alerta';
import { Boton } from '../../../shared/ui/Boton';
import { Campo } from '../../../shared/ui/Campo';
import { Selector } from '../../../shared/ui/Selector';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import {
  desembolsoSchema,
  type DatosBancarios,
  type DatosBancariosFormulario,
} from '../schemas/desembolso.schema';

const OPCIONES_BANCO = [{ valor: '', etiqueta: 'Selecciona…' }, ...opcionesDe(ETIQUETAS_BANCO)];

interface DesembolsoFormProps {
  monto: number;
  nombreCliente: string;
  onConfirmar: (datos: DatosBancarios) => void;
  procesando: boolean;
  error?: string;
}

// Dos pasos: datos bancarios validados y, antes de enviar, una confirmación con el resumen
// (el desembolso mueve dinero y no se puede deshacer).
export function DesembolsoForm({
  monto,
  nombreCliente,
  onConfirmar,
  procesando,
  error,
}: DesembolsoFormProps) {
  const [porConfirmar, setPorConfirmar] = useState<DatosBancarios | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosBancariosFormulario, unknown, DatosBancarios>({
    resolver: zodResolver(desembolsoSchema),
    defaultValues: { numeroCuenta: '' },
  });

  if (porConfirmar) {
    return (
      <Tarjeta>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Confirmar desembolso</h3>
        {error && (
          <div className="mb-4">
            <Alerta>{error}</Alerta>
          </div>
        )}
        <p className="text-sm text-slate-700">
          Vas a desembolsar <strong>{formatearMonto(monto)}</strong> a {nombreCliente} en{' '}
          <strong>{ETIQUETAS_BANCO[porConfirmar.banco]}</strong>, cuenta{' '}
          <strong>{porConfirmar.numeroCuenta}</strong>. Esta operación no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Boton variante="secundario" disabled={procesando} onClick={() => setPorConfirmar(null)}>
            Corregir datos
          </Boton>
          <Boton cargando={procesando} onClick={() => onConfirmar(porConfirmar)}>
            {procesando ? 'Desembolsando…' : 'Confirmar desembolso'}
          </Boton>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Datos bancarios</h3>
      <form
        onSubmit={handleSubmit(setPorConfirmar)}
        noValidate
        className="grid gap-4 md:grid-cols-2"
      >
        <Selector
          etiqueta="Banco"
          opciones={OPCIONES_BANCO}
          error={errors.banco?.message}
          {...register('banco')}
        />
        <Campo
          etiqueta="Número de cuenta"
          inputMode="numeric"
          autoComplete="off"
          error={errors.numeroCuenta?.message}
          {...register('numeroCuenta')}
        />
        <div className="flex justify-end md:col-span-2">
          <Boton type="submit">Continuar</Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
