// Path: /apps/api/src/common/auth/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type AppRole = "CLIENT" | "FIXER" | "SUPER_ADMIN" | "VERIFICATION_OFFICER" | "FINANCE_OFFICER" | "SUPPORT_OFFICER" | "SECURITY_OFFICER";

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
