import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { errorApi } from '../../../test/msw/handlers';
import { server } from '../../../test/msw/server';
import { renderApp } from '../../../test/render';
import { conSesion } from '../../../test/sesion';
import type { SolicitudComite, SolicitudPendiente } from '../api/comite.api';

const SOLICITUD: SolicitudComite = {
  cedula: '001-010190-0001A',
  nombreCompleto: 'Ana Pérez',
  edad: 36,
  cantidadCuotas: 24,
  periodicidad: 'QUINCENAL',
  plazoMeses: 12,
  monto: 10000,
};

// Imita al backend del comité para la solicitud 5 y registra lo que recibe.
function apiDelComite() {
  const aprobaciones: unknown[] = [];
  const rechazos: unknown[] = [];
  let pendientes: SolicitudPendiente[] = [
    {
      id: 5,
      creadaEn: '2026-09-25T12:00:00.000Z',
      cliente: { cedula: SOLICITUD.cedula, nombreCompleto: SOLICITUD.nombreCompleto },
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
const boton = (nombre: 'Aprobar' | 'Rechazar') => screen.getByRole('button', { name: nombre });

async function abrirRevision() {
  const renderizado = renderApp('/comite/5');
  await screen.findByText('Datos de la solicitud');
  return renderizado;
}

describe('RevisionSolicitudPage', () => {
  beforeEach(() => {
    conSesion();
  });

  it('debe mostrar solo los 7 campos de la vista del comité', async () => {
    apiDelComite();

    await abrirRevision();

    const ficha = screen.getByText('Datos de la solicitud').closest('section')!;
    const terminos = within(ficha)
      .getAllByRole('term')
      .map((termino) => termino.textContent);
    const valores = within(ficha)
      .getAllByRole('definition')
      .map((valor) => valor.textContent);
    expect(terminos).toEqual([
      'Cédula',
      'Nombre',
      'Edad',
      'Cuotas',
      'Periodicidad',
      'Plazo',
      'Monto',
    ]);
    expect(valores).toEqual([
      '001-010190-0001A',
      'Ana Pérez',
      '36 años',
      '24',
      'Quincenal',
      '12 meses',
      'C$ 10,000.00',
    ]);
  });

  it('debe mostrar el error cuando la solicitud no existe', async () => {
    server.use(
      http.get('*/api/comite/solicitudes/99', () =>
        errorApi(404, 'SOLICITUD_NO_ENCONTRADA', 'No existe la solicitud 99'),
      ),
    );

    renderApp('/comite/99');

    expect(await screen.findByRole('alert')).toHaveTextContent('No existe la solicitud 99');
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
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

      await usuario.click(boton('Aprobar'));

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

      await usuario.click(boton('Aprobar'));

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

      await usuario.click(boton('Aprobar'));

      const resultado = await screen.findByRole('status');
      expect(resultado).toHaveTextContent('Solicitud #5 aprobada');
      expect(resultado).toHaveTextContent('Observaciones: Ingresos estables');
      expect(screen.getByText('CR-2026-000001')).toBeInTheDocument();
      expect(screen.getByText('C$ 443.21')).toBeInTheDocument();
      expect(aprobaciones).toEqual([{ observaciones: 'Ingresos estables' }]);
      expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
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

      await usuario.click(boton('Aprobar'));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La solicitud está APROBADA y no puede pasar a APROBADA',
      );
    });

    it('debe sacar la solicitud de la bandeja después de aprobarla', async () => {
      apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('Cumple');
      await usuario.click(boton('Aprobar'));

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

      await usuario.click(boton('Rechazar'));

      expect(await screen.findByRole('status')).toHaveTextContent('Solicitud #5 rechazada');
      expect(rechazos).toEqual([{}]);
    });

    it('debe enviar las observaciones del rechazo cuando se escriben', async () => {
      const { rechazos } = apiDelComite();
      const { usuario } = await abrirRevision();
      await usuario.click(observaciones());
      await usuario.paste('Ingresos insuficientes');

      await usuario.click(boton('Rechazar'));

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Observaciones: Ingresos insuficientes',
      );
      expect(rechazos).toEqual([{ observaciones: 'Ingresos insuficientes' }]);
      expect(screen.queryByText('CR-2026-000001')).not.toBeInTheDocument();
    });
  });
});
