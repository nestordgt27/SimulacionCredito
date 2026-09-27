import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { SolicitudComite, SolicitudPendiente } from '../api/comite.api';

const SOLICITUD: SolicitudComite = {
  personal: {
    cedula: '001-010190-0001A',
    nombreCompleto: 'Ana Pérez',
    edad: 36,
    fechaNacimiento: '1990-01-01',
    correo: 'ana@correo.com',
    telefono: '88887777',
  },
  laboral: {
    tipoEmpleo: 'ASALARIADO',
    empresa: 'Empresa S.A.',
    antiguedadLaboralAnios: 5,
    ingresoMensual: 25000,
  },
  financiero: {
    monto: 10000,
    tasaAnual: 12,
    cantidadCuotas: 24,
    periodicidad: 'QUINCENAL',
    plazoMeses: 12,
    cuotaNivelada: 443.21,
    cuotaMensualEquivalente: 886.42,
    relacionCuotaIngreso: 3.55,
    totalAPagar: 10636.94,
    totalIntereses: 636.94,
  },
};

// Imita al backend del comité para la solicitud 5 y registra lo que recibe.
function apiDelComite() {
  const aprobaciones: unknown[] = [];
  const rechazos: unknown[] = [];
  let pendientes: SolicitudPendiente[] = [
    {
      id: 5,
      creadaEn: '2026-09-25T12:00:00.000Z',
      cliente: { cedula: '001-010190-0001A', nombreCompleto: 'Ana Pérez' },
      credito: { monto: 10000, cantidadCuotas: 24, periodicidad: 'QUINCENAL' },
    },
  ];
  server.use(
    http.get('*/api/solicitudes', () => HttpResponse.json(pendientes)),
    http.get('*/api/comite/solicitudes/5', () => HttpResponse.json(SOLICITUD)),
    http.post('*/api/comite/solicitudes/5/aprobar', async ({ request }) => {
      const cuerpo = (await request.json()) as { observaciones: string };
      aprobaciones.push(cuerpo);
      pendientes = [];
      return HttpResponse.json({
        solicitudId: 5,
        estado: 'APROBADA',
        observaciones: cuerpo.observaciones,
        credito: {
          numeroCredito: 'CR-2026-000001',
          fechaAprobacion: '2026-09-25T12:00:00.000Z',
          monto: 10000,
          tasaAnual: 12,
          cantidadCuotas: 24,
          periodicidad: 'QUINCENAL',
          cuotaNivelada: 443.21,
        },
      });
    }),
    http.post('*/api/comite/solicitudes/5/rechazar', async ({ request }) => {
      const cuerpo = (await request.json()) as { observaciones?: string };
      rechazos.push(cuerpo);
      pendientes = [];
      return HttpResponse.json({
        solicitudId: 5,
        estado: 'RECHAZADA',
        observaciones: cuerpo.observaciones ?? null,
      });
    }),
  );
  return { aprobaciones, rechazos };
}

const observaciones = () => screen.getByLabelText('Observaciones');
const boton = (nombre: 'Aprobar Crédito' | 'Rechazar Crédito') =>
  screen.getByRole('button', { name: nombre });

async function abrirRevision() {
  const renderizado = renderApp('/comite/5');
  await screen.findByText('Datos de la solicitud');
  return renderizado;
}

describe('RevisionSolicitudPage', () => {
  beforeEach(() => {
    conSesion();
  });

  // Pares término → valor de un grupo de la ficha, en el orden en que se muestran.
  const datosDe = (nombre: string) => {
    const grupo = screen.getByRole('group', { name: nombre });
    const valores = within(grupo).getAllByRole('definition');
    return within(grupo)
      .getAllByRole('term')
      .map((termino, indice) => [termino.textContent, valores[indice]?.textContent]);
  };

  it('debe mostrar la información personal', async () => {
    apiDelComite();

    await abrirRevision();

    expect(datosDe('Información personal')).toEqual([
      ['Cédula / Identificación', '001-010190-0001A'],
      ['Nombre Completo', 'Ana Pérez'],
      ['Edad', '36 años'],
      ['Fecha de nacimiento', '01/01/1990'],
      ['Correo', 'ana@correo.com'],
      ['Teléfono', '88887777'],
    ]);
  });

  it('debe mostrar la información laboral', async () => {
    apiDelComite();

    await abrirRevision();

    expect(datosDe('Información laboral')).toEqual([
      ['Tipo de empleo', 'Asalariado'],
      ['Empresa', 'Empresa S.A.'],
      ['Antigüedad laboral', '5 años'],
      ['Ingreso mensual', 'C$ 25,000.00'],
    ]);
  });

  it('debe mostrar la información financiera con los indicadores de viabilidad', async () => {
    apiDelComite();

    await abrirRevision();

    expect(datosDe('Información financiera')).toEqual([
      ['Monto solicitado', 'C$ 10,000.00'],
      ['Tasa anual', '12 %'],
      ['Cantidad de cuotas', '24'],
      ['Periodicidad de Pago', 'Quincenal'],
      ['Plazo', '12 meses'],
      ['Cuota nivelada', 'C$ 443.21'],
      ['Cuota mensual equivalente', 'C$ 886.42'],
      ['Relación cuota / ingreso', '3.55 %'],
      ['Total a pagar', 'C$ 10,636.94'],
      ['Total de intereses', 'C$ 636.94'],
    ]);
  });

  it('debe indicar que la relación cuota / ingreso no aplica cuando no hay ingresos', async () => {
    apiDelComite();
    server.use(
      http.get('*/api/comite/solicitudes/5', () =>
        HttpResponse.json({
          ...SOLICITUD,
          laboral: { ...SOLICITUD.laboral, ingresoMensual: 0 },
          financiero: { ...SOLICITUD.financiero, relacionCuotaIngreso: null },
        }),
      ),
    );

    await abrirRevision();

    expect(datosDe('Información financiera')).toContainEqual([
      'Relación cuota / ingreso',
      'No aplica (sin ingresos)',
    ]);
  });

  it('debe ser de solo lectura: el único campo editable son las observaciones', async () => {
    apiDelComite();

    await abrirRevision();

    expect(screen.getAllByRole('textbox')).toEqual([observaciones()]);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(
      expect.arrayContaining(['Aprobar Crédito', 'Rechazar Crédito']),
    );
  });

  it('debe mostrar el error cuando la solicitud no existe', async () => {
    server.use(
      http.get('*/api/comite/solicitudes/99', () =>
        errorApi(404, 'SOLICITUD_NO_ENCONTRADA', 'No existe la solicitud 99'),
      ),
    );

    renderApp('/comite/99');

    expect(await screen.findByRole('alert')).toHaveTextContent('No existe la solicitud 99');
    expect(screen.queryByRole('button', { name: 'Aprobar Crédito' })).not.toBeInTheDocument();
  });

  it('debe volver a la bandeja cuando el id no es válido', () => {
    apiDelComite();

    const { router } = renderApp('/comite/abc');

    expect(router.state.location.pathname).toBe('/comite');
  });

  describe('aprobar', () => {
    it('debe exigir observaciones sin llamar a la API', async () => {
      const { aprobaciones } = apiDelComite();
      const { usuario } = await abrirRevision();

      await usuario.click(boton('Aprobar Crédito'));

      expect(
        await screen.findByText('Las observaciones son obligatorias para aprobar'),
      ).toBeInTheDocument();
      expect(observaciones()).toHaveAttribute('aria-invalid', 'true');
      expect(aprobaciones).toHaveLength(0);
    });

    it('debe tratar como vacías las observaciones con solo espacios', async () => {
      const { aprobaciones } = apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('    ');

      await usuario.click(boton('Aprobar Crédito'));

      expect(
        await screen.findByText('Las observaciones son obligatorias para aprobar'),
      ).toBeInTheDocument();
      expect(aprobaciones).toHaveLength(0);
    });

    it('debe aprobar y mostrar el crédito otorgado con su número', async () => {
      const { aprobaciones } = apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('  Ingresos estables  ');

      await usuario.click(boton('Aprobar Crédito'));

      const resultado = await screen.findByRole('status');
      expect(resultado).toHaveTextContent('Solicitud #5 aprobada');
      expect(resultado).toHaveTextContent('Observaciones: Ingresos estables');
      const credito = screen.getByText('CR-2026-000001').closest('dl')!;
      expect(within(credito).getByText('C$ 443.21')).toBeInTheDocument();
      expect(aprobaciones).toEqual([{ observaciones: 'Ingresos estables' }]);
      expect(screen.queryByRole('button', { name: 'Aprobar Crédito' })).not.toBeInTheDocument();
    });

    it('debe mostrar el conflicto del backend cuando la solicitud ya no está pendiente', async () => {
      apiDelComite();
      server.use(
        http.post('*/api/comite/solicitudes/5/aprobar', () =>
          errorApi(
            409,
            'TRANSICION_INVALIDA',
            'La solicitud está APROBADA y no puede pasar a APROBADA',
          ),
        ),
      );
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('Cumple');

      await usuario.click(boton('Aprobar Crédito'));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La solicitud está APROBADA y no puede pasar a APROBADA',
      );
    });

    it('debe sacar la solicitud de la bandeja después de aprobarla', async () => {
      apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('Cumple');
      await usuario.click(boton('Aprobar Crédito'));

      await usuario.click(await screen.findByRole('link', { name: 'Volver a la bandeja' }));

      expect(
        await screen.findByText('No hay solicitudes pendientes de revisión.'),
      ).toBeInTheDocument();
    });
  });

  describe('rechazar', () => {
    it('debe rechazar sin observaciones', async () => {
      const { rechazos } = apiDelComite();
      const { usuario } = await abrirRevision();

      await usuario.click(boton('Rechazar Crédito'));

      expect(await screen.findByRole('status')).toHaveTextContent('Solicitud #5 rechazada');
      expect(rechazos).toEqual([{}]);
    });

    it('debe enviar las observaciones del rechazo cuando se escriben', async () => {
      const { rechazos } = apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('Ingresos insuficientes');

      await usuario.click(boton('Rechazar Crédito'));

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Observaciones: Ingresos insuficientes',
      );
      expect(rechazos).toEqual([{ observaciones: 'Ingresos insuficientes' }]);
      expect(screen.queryByText('CR-2026-000001')).not.toBeInTheDocument();
    });
  });
});
