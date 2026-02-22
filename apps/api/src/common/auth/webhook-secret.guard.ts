// Path: /apps/api/src/common/auth/webhook-secret.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const secret = req.headers["x-webhook-secret"];

    const expected = process.env.WEBHOOK_SECRET;
    if (!expected) throw new UnauthorizedException("WEBHOOK_SECRET not set");

    if (!secret || secret !== expected) {
      throw new UnauthorizedException("Invalid webhook secret");
    }

    return true;
  }
}
