// Path: /apps/api/src/common/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type JwtUser = { userId: string };

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtUser => {
  const req = ctx.switchToHttp().getRequest();
  return req.user as JwtUser;
});
