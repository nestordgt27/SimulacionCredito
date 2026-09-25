import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'esPublico';

// Excluye un handler o controller del JwtAuthGuard global.
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(ES_PUBLICO, true);
