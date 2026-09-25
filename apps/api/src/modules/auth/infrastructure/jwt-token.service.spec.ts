import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FakeClock, MINUTOS } from '../../../../test/support/fake-clock';
import { AccessTokenInvalidoError } from '../domain/errores';
import { JwtTokenService } from './jwt-token.service';

const SECRETO = 'secreto-de-pruebas-unitarias-0123456789';
const USUARIO = { id: 1, username: 'admin', rol: 'ADMIN' };

function crearServicio(clock: FakeClock, secreto = SECRETO): JwtTokenService {
  return new JwtTokenService(
    new JwtService({ secret: secreto, signOptions: { algorithm: 'HS256' } }),
    clock,
    new ConfigService({ JWT_ACCESS_TTL_SEGUNDOS: 900 }),
  );
}

describe('JwtTokenService', () => {
  let clock: FakeClock;
  let servicio: JwtTokenService;

  beforeEach(() => {
    clock = new FakeClock();
    servicio = crearServicio(clock);
  });

  it('debe informar una vigencia de 900 segundos cuando firma el access token', async () => {
    const { expiresIn } = await servicio.firmarAccessToken(USUARIO);

    expect(expiresIn).toBe(900);
  });

  it('debe devolver el usuario del token cuando la firma es válida y no expiró', async () => {
    const { accessToken } = await servicio.firmarAccessToken(USUARIO);

    await expect(servicio.verificarAccessToken(accessToken)).resolves.toEqual(USUARIO);
  });

  it('debe aceptar el token un segundo antes de cumplir 15 minutos', async () => {
    const { accessToken } = await servicio.firmarAccessToken(USUARIO);

    clock.avanzar(15 * MINUTOS - 1000);

    await expect(servicio.verificarAccessToken(accessToken)).resolves.toEqual(USUARIO);
  });

  it('debe lanzar AccessTokenInvalidoError cuando el token expiró a los 15 minutos', async () => {
    const { accessToken } = await servicio.firmarAccessToken(USUARIO);

    clock.avanzar(15 * MINUTOS);

    await expect(servicio.verificarAccessToken(accessToken)).rejects.toThrow(
      AccessTokenInvalidoError,
    );
  });

  it('debe lanzar AccessTokenInvalidoError cuando el token fue firmado con otro secreto', async () => {
    const { accessToken } = await crearServicio(
      clock,
      'otro-secreto-distinto-0123456789ab',
    ).firmarAccessToken(USUARIO);

    await expect(servicio.verificarAccessToken(accessToken)).rejects.toThrow(
      AccessTokenInvalidoError,
    );
  });

  it('debe lanzar AccessTokenInvalidoError cuando el contenido del token fue alterado', async () => {
    const { accessToken } = await servicio.firmarAccessToken(USUARIO);
    const [cabecera, , firma] = accessToken.split('.');
    const payloadAlterado = Buffer.from(JSON.stringify({ ...USUARIO, rol: 'SUPER' })).toString(
      'base64url',
    );

    const verificar = servicio.verificarAccessToken(`${cabecera}.${payloadAlterado}.${firma}`);

    await expect(verificar).rejects.toThrow(AccessTokenInvalidoError);
  });
});
