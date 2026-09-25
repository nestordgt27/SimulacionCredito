import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../../core/auth/public.decorator';
import { UsuarioActual } from '../../../core/auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../../../core/auth/usuario-autenticado';
import { CerrarSesionUseCase } from '../application/cerrar-sesion.use-case';
import { IniciarSesionUseCase } from '../application/iniciar-sesion.use-case';
import { RefrescarSesionUseCase } from '../application/refrescar-sesion.use-case';
import type { Sesion } from '../application/sesion';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly refrescarSesion: RefrescarSesionUseCase,
    private readonly cerrarSesion: CerrarSesionUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<Sesion> {
    return this.iniciarSesion.ejecutar(dto);
  }

  // Público: se usa justamente cuando el access token ya expiró.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<Sesion> {
    return this.refrescarSesion.ejecutar(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    return this.cerrarSesion.ejecutar({ usuarioId: usuario.id, refreshToken: dto.refreshToken });
  }
}
