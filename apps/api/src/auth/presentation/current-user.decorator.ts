import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '@/auth/infrastructure/jwt.strategy';

/**
 * Injeta o usuário autenticado (preenchido pela JwtStrategy) no handler.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
