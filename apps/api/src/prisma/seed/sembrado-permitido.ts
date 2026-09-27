// El usuario de prueba tiene una contraseña pública (README). Fuera de producción siempre se
// puede sembrar; con NODE_ENV=production solo si se pide de forma explícita, como hace
// docker-compose.yml para que la demo quede lista con un solo comando.
export function sembradoPermitido(entorno: Record<string, string | undefined>): boolean {
  return entorno.NODE_ENV !== 'production' || entorno.SEMBRAR_USUARIO_PRUEBA === 'true';
}
