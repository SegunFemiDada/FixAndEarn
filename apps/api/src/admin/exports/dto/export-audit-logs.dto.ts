//path: apps/api/src/admin/exports/dto/export-audit-logs.dto.ts
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ExportAuditLogsDto {
  @IsOptional()
  @IsString()
  actorAdminId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsISO8601()
  from?: string; // ISO date-time

  @IsOptional()
  @IsISO8601()
  to?: string; // ISO date-time

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  take?: number; // safety cap
}
